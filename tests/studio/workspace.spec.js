const {test,expect}=require('@playwright/test');
const seed=require('../../src/studio/seed.json');
const encode=v=>typeof v==='string'?{stringValue:v}:typeof v==='number'?{integerValue:String(v)}:typeof v==='boolean'?{booleanValue:v}:v===null?{nullValue:null}:Array.isArray(v)?{arrayValue:{values:v.map(encode)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}};
async function mock(page,{auth='owner',conflict=false,remote=null}={}){
 let writes=[];
 await page.route('https://firestore.googleapis.com/**',async route=>{const req=route.request();if(req.method()==='PATCH'){writes.push(req.postDataJSON());await route.fulfill({status:conflict?409:200,json:conflict?{error:{message:'conflict'}}:{...req.postDataJSON(),updateTime:'2026-09-12T00:00:01Z'}});return;}if(req.url().includes(':batchGet')){await route.fulfill({json:[{found:{name:'projects/edunote-96bd7/databases/(default)/documents/personal-site/main',...encode(seed).mapValue}},remote?{found:{name:'projects/edunote-96bd7/databases/(default)/documents/personal-site/desktop-v1',...encode(remote.workspace).mapValue,updateTime:remote.revision}}:{missing:'projects/edunote-96bd7/databases/(default)/documents/personal-site/desktop-v1'}]});return;}if(req.url().includes('/main?'))await route.fulfill({json:{...encode(seed).mapValue,updateTime:'2026-09-12T00:00:00Z'}});else await route.fulfill({status:404,json:{error:{code:404}}});});
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp = () => ({});':`const user={email:'${auth==='owner'?'seungyeon980808@gmail.com':'visitor@example.com'}',emailVerified:true,getIdToken:async()=> 'test-token'};export const getAuth=()=>({currentUser:null,authStateReady:async()=>{}});export const onAuthStateChanged=(a,cb)=>cb(null);export class GoogleAuthProvider{};export const signInWithPopup=async()=>({user});export const signOut=async()=>{};`}));
 await page.goto('/');await page.getByRole('button',{name:/(노트북 열고|휴대폰 들고) 작업실 들어가기/,exact:true}).click();await expect(page.locator('#entrance')).toBeHidden();return writes;
}
const close=page=>page.getByRole('button',{name:'창 닫기',exact:true}).click();
const manage=page=>page.getByRole('button',{name:'작업실 설정',exact:true}).click();
async function edit(page){await manage(page);await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await page.getByRole('button',{name:'초안 편집 시작'}).click();await close(page);await page.getByLabel('방문자에게 메뉴').click();await page.getByRole('button',{name:'메모 편집'}).click();}
test('all content, dated records, Finder navigation, search and window controls',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));await mock(page);
 await page.getByRole('button',{name:'ExamPool',exact:true}).click();await expect(page.getByRole('button',{name:/설명 보기/})).toBeVisible();
 await page.getByRole('button',{name:'창 최소화'}).click();await expect(page.locator('#workspace-window')).not.toBeVisible();await page.locator('#restore').click();await expect(page.getByRole('button',{name:/설명 보기/})).toBeVisible();await close(page);
 await page.getByRole('button',{name:'이전 달',exact:true}).click();await page.getByRole('button',{name:'8월 30일, 기록 2개',exact:true}).click();await expect(page.getByRole('button',{name:'월간',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.calendar-entry-list .record-entry')).toHaveCount(2);await close(page);
 await page.getByRole('button',{name:'추천 도구함',exact:true}).first().click();await page.getByRole('button',{name:'문서·행정',exact:true}).click();await page.getByRole('button',{name:'프로그램',exact:true}).click();await page.getByRole('button',{name:/rHWP/}).click();await expect(page.getByRole('heading',{name:'rHWP',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'자료 열기'})).toHaveAttribute('href','https://edwardkim.github.io/rhwp/');await close(page);
 await page.getByRole('button',{name:'작업실 검색',exact:true}).click();await page.getByRole('searchbox').fill('시험');await page.getByRole('button',{name:'검색',exact:true}).click();await expect(page.locator('.search-result').first()).toBeVisible();await close(page);
 await page.getByRole('button',{name:'진행 중인 프로젝트 폴더',exact:true}).click();await page.getByRole('button',{name:'새 태그',exact:true}).click();await page.getByRole('button',{name:'시험문제 제작 워크플로우',exact:true}).click();await page.locator('.finder-items').getByRole('button',{name:/^5E/}).click();await expect(page.getByRole('heading',{name:'5E',exact:true})).toBeVisible();await close(page);
 await page.getByRole('button',{name:'인사드립니다',exact:true}).click();await expect(page.getByRole('heading',{name:'인사드립니다',exact:true})).toBeVisible();await expect(page.locator('.about-intro-copy')).toContainText('저는 게으른 교사입니다.');await expect(page.locator('.about-page')).toContainText('교사가 한가해야');expect(errors).toEqual([]);
});
test('draft note and icon shortcut persist, public view stays unchanged, publish is owner-only',async({page})=>{
 const writes=await mock(page);await edit(page);
 await page.getByLabel('방문자에게 남기는 메모').fill('테스트 방문자 메모');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await close(page);await expect(page.locator('#note-text')).toHaveText('테스트 방문자 메모');
 await page.reload();await edit(page);await expect(page.getByLabel('방문자에게 남기는 메모')).toHaveValue('테스트 방문자 메모');
 await close(page);await page.locator('.shortcut-create').click();await page.getByLabel('이름',{exact:true}).fill('연수 설문');await page.getByLabel('연결 주소').fill('https://docs.google.com/spreadsheets/');await page.getByLabel('아이콘 종류').selectOption('sheet');await page.getByLabel('직접 고른 아이콘').setInputFiles('assets/studio/lake.webp');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await close(page);await expect(page.locator('#icons a')).toHaveAttribute('href','https://docs.google.com/spreadsheets/');await expect(page.locator('#icons a img')).toHaveAttribute('src',/^data:image\/webp/);
 await page.getByRole('button',{name:'공개 화면 보기'}).click();await expect(page.locator('#icons a')).toHaveCount(0);await expect(page.locator('#note-text')).not.toHaveText('테스트 방문자 메모');
 await manage(page);await page.getByRole('button',{name:'초안 편집 시작',exact:true}).click();await expect(page.getByRole('button',{name:'공개 게시',exact:true})).toBeEnabled();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'공개 게시',exact:true}).click();await expect(page.getByRole('heading',{name:'인사드립니다',exact:true})).toBeVisible();expect(writes).toHaveLength(1);expect(writes[0].fields.note.stringValue).toBe('테스트 방문자 메모');
});
test('record and categorized skill CRUD plus backup validation and conflict recovery',async({page})=>{
 await mock(page,{conflict:true});await edit(page);await close(page);
 await page.getByRole('button',{name:'추천 도구함',exact:true}).first().click();await page.getByRole('button',{name:'자료 추가',exact:true}).click();await page.getByLabel('분야',{exact:true}).fill('수업·평가');await page.getByLabel('폴더 이름').fill('문항 제작');await page.getByLabel('이름',{exact:true}).fill('내 추천 스킬');await page.getByLabel('연결 주소').fill('https://github.com/example/skill');await page.getByLabel('아이콘 종류').selectOption('skill');await page.getByLabel('소개 · 사용법 · 설치 안내').fill('설치 방법과 활용 예시');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await close(page);
 await page.getByRole('button',{name:'추천 도구함',exact:true}).first().click();await page.getByRole('button',{name:'수업·평가',exact:true}).click();await page.getByRole('button',{name:'문항 제작',exact:true}).click();await page.getByRole('button',{name:/내 추천 스킬/}).click();await expect(page.getByRole('heading',{name:'내 추천 스킬',exact:true})).toBeVisible();await close(page);
 await manage(page);page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'공개 게시',exact:true}).click();await expect(page.locator('#admin-status')).toContainText('다른 곳에서');
 await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"note":"x","records":[],"resources":[],"shortcuts":[{"id":"x","name":"bad","url":"javascript:alert(1)","kind":"link"}]}')});
 await expect(page.locator('#admin-status')).toContainText('https 링크');
});
test('non-owner login cannot access editing controls',async({page})=>{const writes=await mock(page,{auth:'visitor'});await manage(page);await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await expect(page.locator('#admin-status')).toContainText('등록된 관리자');await expect(page.getByRole('button',{name:'공개 게시',exact:true})).toHaveCount(0);expect(writes).toHaveLength(0);});
for(const width of [375,768,1280])test(`responsive surfaces ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await mock(page);
 await page.screenshot({animations:'disabled',path:`.omo/evidence/studio/desktop-${width}.png`,fullPage:false});
 for(const name of [width===375?'만든 프로그램 폴더':'ExamPool','추천 도구함','연수 자료','공유 자료','인사드립니다']){await page.getByRole('button',{name,exact:true}).first().click();await page.screenshot({animations:'disabled',path:`.omo/evidence/studio/${name}-${width}.png`});expect(await page.locator('#window-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await close(page);}
 if(width===375){await page.getByRole('button',{name:'캘린더',exact:true}).click();await page.screenshot({animations:'disabled',path:`.omo/evidence/studio/records-${width}.png`});await close(page);}
 await manage(page);await page.screenshot({animations:'disabled',path:`.omo/evidence/studio/admin-${width}.png`});expect(await page.locator('#window-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
});
test('reduced motion, physics pause and keyboard Escape',async({page})=>{await page.setViewportSize({width:375,height:812});await page.emulateMedia({reducedMotion:'reduce'});await mock(page);await page.getByRole('button',{name:'만든 프로그램 폴더',exact:true}).click();await page.getByRole('button',{name:'놀이터',exact:true}).click();await expect(page.getByRole('button',{name:'재생',exact:true})).toBeVisible();await page.getByRole('slider').fill('200');await expect(page.locator('#period')).toContainText('2.84');await page.keyboard.press('Escape');await expect(page.locator('#workspace-window')).not.toBeVisible();});

test('a stored draft keeps its original server revision after reload',async({page})=>{
 const original='2026-09-12T00:00:00Z';const remote={revision:original,workspace:{version:1,note:'기존 메모',records:[],resources:[],shortcuts:[]}};
 await mock(page,{remote,conflict:true});await edit(page);await page.getByLabel('방문자에게 남기는 메모').fill('오래된 초안');await page.getByRole('button',{name:'초안 저장',exact:true}).click();
 remote.revision='2026-09-12T01:00:00Z';remote.workspace.note='다른 기기에서 쓴 메모';await page.reload();await expect(page.locator('#note-text')).toHaveText('다른 기기에서 쓴 메모');await edit(page);await expect(page.getByLabel('방문자에게 남기는 메모')).toHaveValue('오래된 초안');await close(page);
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();page.once('dialog',d=>d.accept());const request=page.waitForRequest(r=>r.method()==='PATCH');await page.getByRole('button',{name:'공개 게시',exact:true}).click();expect(new URL((await request).url()).searchParams.get('currentDocument.updateTime')).toBe(original);await expect(page.locator('#admin-status')).toContainText('다른 곳에서');
});

test('screen entry, distinct shortcut control, exit and in-desktop app browser',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'5E',exact:true}).click();await expect(page.getByRole('button',{name:/설명 보기/})).toBeVisible();await page.getByRole('button',{name:/바로 실행/}).click();await expect(page.locator('#browser-frame')).toHaveAttribute('src','https://seungyeon980808-pixel.github.io/5E/');const rect=await page.locator('#workspace-window').boundingBox();expect(rect.width).toBeLessThan(1280);expect(rect.height).toBeLessThan(900);await expect(page.locator('#titlebar [data-exit]')).toHaveCount(0);await page.locator('#window-close').click();await page.locator('#return').click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');await expect(page.locator('#workspace-window')).not.toBeVisible();await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();await edit(page);await close(page);await expect(page.locator('.shortcut-create')).toContainText('새 바로가기');await page.locator('.shortcut-create').click();await expect(page.getByLabel('연결 주소')).toBeVisible();
});

test('short resource and note windows fit their content and still maximize',async({page})=>{
 await mock(page);await page.getByRole('button',{name:'추천 도구함',exact:true}).click();
 const win=page.locator('#workspace-window');await page.waitForTimeout(260);
 const compact=await win.boundingBox();expect(compact.height).toBeLessThan(550);expect(compact.y).toBeGreaterThan(40);
 await page.locator('#window-expand').click();expect((await win.boundingBox()).height).toBeGreaterThan(compact.height);
 await page.locator('#window-expand').click();await close(page);
 await page.getByLabel('방문자에게 메뉴').click();await page.getByRole('button',{name:'펼쳐 보기',exact:true}).click();await page.waitForTimeout(260);expect((await win.boundingBox()).height).toBeLessThan(compact.height);
});

test('first owner drag creates a draft and keeps the same pointer interaction',async({page})=>{
 await mock(page);await manage(page);await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await close(page);
 const card=page.locator('.memo-card').first(),heading=card.locator('.note-heading'),box=await heading.boundingBox();await page.mouse.move(box.x+20,box.y+12);await page.mouse.down();await page.mouse.move(box.x+180,box.y-120);await page.mouse.up();
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace.memos[0].x)).toBeGreaterThan(0);const moved=await card.boundingBox();expect(moved.y).toBeLessThan(300);await page.screenshot({animations:'disabled',path:'.omo/evidence/studio/memo-first-drag.png'});
});

test('owner memo checklist and position persist separately from public content, with optional archive and custom project folders',async({page})=>{
 await mock(page);await edit(page);
 await page.getByRole('button',{name:'메모 새 항목 +'}).click();await page.getByLabel('메모 이름').fill('준비 메모');await page.getByLabel('메모 내용').fill('수업 전에 확인할 내용');await page.getByLabel('체크리스트 (한 줄에 하나)').fill('자료 확인\n빔프로젝터 확인\n좌석 확인\n출석 확인\n수업안 확인\n마무리 확인\n기록 확인');await page.getByLabel('메모 색상').selectOption('green');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await close(page);
 let card=page.locator('.memo-card').filter({hasText:'준비 메모'});await expect(card.locator('.memo-checklist li:visible')).toHaveCount(5);await card.getByRole('checkbox').first().check();await expect(card.getByRole('checkbox').first()).toBeChecked();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace.memos.find(item=>item.name==='준비 메모').checklist[0].done)).toBe(true);card=page.locator('.memo-card').filter({hasText:'준비 메모'});const heading=card.locator('.note-heading'),box=await heading.boundingBox();await page.mouse.move(box.x+20,box.y+12);await page.mouse.down();await page.mouse.move(box.x+180,box.y+38);await page.mouse.up();const movedBox=await card.boundingBox();expect(movedBox.y).toBeLessThan(300);await page.screenshot({animations:'disabled',path:'.omo/evidence/studio/memo-owner-moved.png'});await card.getByLabel('준비 메모 메뉴').click();await card.getByRole('button',{name:'펼쳐 보기',exact:true}).click();await expect(page.locator('.note-checklist li')).toHaveCount(7);await page.locator('.note-checklist input').last().check();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace.memos.find(item=>item.name==='준비 메모').checklist[6].done)).toBe(true);await close(page);
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace),memo=draft.memos.find(item=>item.name==='준비 메모');expect(memo.checklist[0].done).toBe(true);expect(memo.x).toBeGreaterThan(0);expect(memo.y).toBeLessThan(.4);expect(memo.color).toBe('green');
 await page.getByRole('button',{name:'자료 아카이브',exact:true}).click();await page.getByRole('button',{name:'자료 추가',exact:true}).click();await page.getByLabel('분야',{exact:true}).fill('나중에');await page.getByLabel('폴더 이름').fill('아이디어');await page.getByLabel('이름',{exact:true}).fill('링크 없는 생각');await page.getByLabel('소개 · 사용법 · 설치 안내').fill('나중에 더할 내용을 적어 둡니다.');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await close(page);await page.getByRole('button',{name:'자료 아카이브',exact:true}).click();await page.getByRole('button',{name:'나중에',exact:true}).click();await page.getByRole('button',{name:'아이디어',exact:true}).click();await page.getByRole('button',{name:/링크 없는 생각/}).click();await expect(page.getByText('나중에 더할 내용을 적어 둡니다.')).toBeVisible();await page.screenshot({animations:'disabled',path:'.omo/evidence/studio/archive-optional-link.png'});await close(page);
 await page.getByRole('button',{name:'진행 중인 프로젝트 폴더',exact:true}).click();await page.getByRole('button',{name:'프로젝트 추가',exact:true}).click();await page.getByLabel('분야',{exact:true}).fill('개인');await page.getByLabel('폴더 이름').fill('준비중');await page.getByLabel('이름',{exact:true}).fill('새 분류');await page.getByLabel('소개 · 사용법 · 설치 안내').fill('직접 분류한 프로젝트입니다.');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await close(page);await page.getByRole('button',{name:'진행 중인 프로젝트 폴더',exact:true}).click();await page.getByRole('button',{name:'개인',exact:true}).click();await page.getByRole('button',{name:'준비중',exact:true}).click();await page.getByRole('button',{name:/새 분류/}).click();await expect(page.locator('.finder-preview .prose')).toHaveText('직접 분류한 프로젝트입니다.');await page.screenshot({animations:'disabled',path:'.omo/evidence/studio/project-finder-custom.png'});
});

test('login failure after settings closes does not crash',async({page})=>{
 const errors=[];page.on('pageerror',err=>errors.push(err.message));await mock(page);
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':`export const getAuth=()=>({currentUser:null,authStateReady:async()=>{}});export const onAuthStateChanged=(a,cb)=>cb(null);export class GoogleAuthProvider{};export const signInWithPopup=()=>new Promise((resolve,reject)=>{window.failLogin=()=>reject(Object.assign(new Error('closed'),{code:'auth/popup-closed-by-user'}));});export const signOut=async()=>{};`}));
 await page.reload();await expect(page.locator('#entrance')).toBeHidden();
 await manage(page);await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await expect.poll(()=>page.evaluate(()=>typeof window.failLogin)).toBe('function');await close(page);await page.evaluate(()=>window.failLogin());await page.waitForTimeout(100);expect(errors).toEqual([]);
});

test('Dock programs are owner-only drafts, survive reload and publish with workspace',async({page})=>{
 const writes=await mock(page);
 await expect(page.locator('#dock-add')).toHaveCount(0);
 await page.locator('#dock button[aria-label="5E"]').hover();
 await expect(page.locator('#dock-tooltip')).toHaveText('5E');await expect(page.locator('#dock-tooltip')).toBeVisible();
 await manage(page);await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await close(page);
 await page.getByRole('button',{name:'프로그램 추가',exact:true}).click();
 await page.locator('#editor-form input[name="name"]').fill('내 새 프로그램');
 await page.locator('#editor-form input[name="url"]').fill('https://example.com/my-tool');
 await page.locator('#editor-form button.primary').click();
 await expect(page.locator('#dock a[aria-label="내 새 프로그램"]')).toHaveAttribute('href','https://example.com/my-tool');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace.dockPrograms[0].name)).toBe('내 새 프로그램');
 await page.reload();await expect(page.locator('#entrance')).toBeHidden();
 await manage(page);await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await close(page);
 await page.getByRole('button',{name:'프로그램 추가',exact:true}).click();
 await expect(page.locator('#dock a[aria-label="내 새 프로그램"]')).toHaveCount(1);
 await close(page);await manage(page);page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'공개 게시',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].fields.dockPrograms.arrayValue.values[0].mapValue.fields.name.stringValue).toBe('내 새 프로그램');
 await expect(page.locator('#draft-banner')).toBeHidden();
});
