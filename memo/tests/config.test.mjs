// psy 이전 뒤에도 공개 설정과 Worker 허용 주소가 맞는지 확인한다(배포·네트워크 없음).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {readConfig,publicConfig}=require('../scripts/config.cjs');
const dir=path.resolve(import.meta.dirname,'..');

test('공개 config.js는 HTTPS Worker 주소와 Google 웹 클라이언트 ID만 담는다',()=>{
  const config=readConfig(path.join(dir,'config.js'));
  assert.equal(new URL(config.apiUrl).protocol,'https:');
  assert.throws(()=>publicConfig('https://secret@demo.workers.dev',config.googleClientId));
});

test('Worker 허용 주소에 psy와 옛 5E 주소가 모두 들어 있다',()=>{
  const wrangler=JSON.parse(fs.readFileSync(path.join(dir,'worker/wrangler.jsonc'),'utf8'));
  const allowed=wrangler.vars.ALLOWED_ORIGINS.split(',').map(s=>s.trim());
  for(const origin of ['https://www.psy.ai.kr','https://psy.ai.kr','https://www.5e.ai.kr','https://5e.ai.kr'])assert.ok(allowed.includes(origin),origin);
  for(const origin of allowed)assert.equal(new URL(origin).origin,origin);
});
