// OurDocs 입구(ourdocs/index.html)와 404.html의 짧은 주소 넘김 검사. 5E desktop/ourdocs-entry.test.cjs에서 옮김.
// 실행: node --test tests/ourdocs-entry.test.mjs
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
const WORKER = 'https://ourdocs-cloud.5e-desktop.workers.dev';
const source = await readFile(new URL('../ourdocs/index.html', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1];
const notFound = await readFile(new URL('../404.html', import.meta.url), 'utf8');
const recovery = notFound.match(/<script>([\s\S]*?)<\/script>/)[1];

function fixture(search = '', hash = '', page = 'https://www.psy.ai.kr/ourdocs/') {
  const events = {}, frameEvents = {}, updates = [], messages = [];
  const frame = {contentWindow: {postMessage: (...args) => messages.push(args)}, addEventListener: (type, fn) => frameEvents[type] = fn};
  vm.runInNewContext(script, {URL, URLSearchParams, document: {getElementById: () => frame}, window: {addEventListener: (type, fn) => events[type] = fn},
    location: {href: page + search + hash, search, hash}, history: {replaceState: (_, __, url) => updates.push(url.toString())}});
  return {frame, events, frameEvents, updates, messages};
}

test('초대 조각(#)을 지닌 채 Worker 화면을 연다', () => {
  const qa = fixture('?route=%2Finvite', '#one-use-token');
  assert.equal(qa.frame.src, WORKER + '/ourdocs/invite#one-use-token');
  qa.frameEvents.load();
  assert.deepEqual(JSON.parse(JSON.stringify(qa.messages[0])), [{type: '5e:ourdocs-ready'}, WORKER]);
});

test('아무 route 값을 API나 바깥 주소로 넘기지 않는다', () => {
  for (const route of ['https://attacker.example', '//attacker.example', '/api/v1/account', '/studio/../api', 'javascript:alert(1)'])
    assert.equal(fixture('?route=' + encodeURIComponent(route)).frame.src, WORKER + '/ourdocs/');
});

test('자기 iframe이 보낸 위치만 주소줄에 반영하고, 입구가 놓인 폴더를 지킨다', () => {
  for (const page of ['https://www.psy.ai.kr/ourdocs/', 'https://www.psy.ai.kr/tools/ourdocs/index.html']) {
    const base = page.replace(/[^/]*$/, '');
    const qa = fixture('?route=%2Finvite', '#one-use-token', page);
    const send = (origin, from, path, hash) => qa.events.message({origin, source: from, data: {type: '5e:ourdocs-location', path, hash}});
    send('https://attacker.example', qa.frame.contentWindow, '/', '');
    send(WORKER, {}, '/', '');
    send(WORKER, qa.frame.contentWindow, '/api/v1/account', '');
    assert.equal(qa.updates.length, 0);
    send(WORKER, qa.frame.contentWindow, '/invite', '');
    assert.equal(qa.updates[0], base + '?route=%2Finvite');
    send(WORKER, qa.frame.contentWindow, '/s/abc', '');
    assert.equal(qa.updates[1], base + 'abc');
  }
});

test('이름 주소는 보이는 주소를 짧게 바꾸고 Worker에는 이름 경로만 넘긴다', () => {
  const name = encodeURIComponent('4월교과협의록');
  const qa = fixture('?route=' + encodeURIComponent('/s/' + name));
  assert.equal(qa.frame.src, WORKER + '/ourdocs/s/' + name);
  assert.equal(qa.updates[0], 'https://www.psy.ai.kr/ourdocs/' + name);
});

test('404.html은 한글 이름 주소만 입구로 넘기고 다른 주소는 건드리지 않는다', () => {
  const redirects = [];
  for (const path of ['/ourdocs/4월교과협의록', '/ourdocs/' + encodeURIComponent('4월교과협의록') + '/', '/docfinder/missing', '/ourdocs/%2fapi', '/ourdocs/admin', '/ourdocs/%ZZ', '/upload/x'])
    vm.runInNewContext(recovery, {URL, fetch: () => new Promise(() => {}), document: {documentElement: {style: {}}},
      location: {pathname: path, origin: 'https://www.psy.ai.kr', replace: url => redirects.push(url)}});
  assert.equal(redirects.length, 2);
  for (const target of redirects) {
    assert.equal(new URL(target).pathname, '/ourdocs/');
    assert.equal(new URL(target).searchParams.get('route'), '/s/' + encodeURIComponent('4월교과협의록'));
  }
});
