import {test,expect} from '@playwright/test';
import seed from '../../src/studio/seed.json' with {type:'json'};

function encode(value){
 if(value==null)return{nullValue:null};if(typeof value==='string')return{stringValue:value};if(typeof value==='boolean')return{booleanValue:value};if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};if(Array.isArray(value))return{arrayValue:{values:value.map(encode)}};return{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,item])=>[key,encode(item)]))}};
}

async function mockOwner(page){
 await page.addInitScript(()=>{if(!sessionStorage.getItem('foundation-seeded')){localStorage.clear();sessionStorage.setItem('foundation-seeded','1');}localStorage.setItem('studio-welcome-v1','done');sessionStorage.setItem('studio-entered','1');});
 await page.route('https://firestore.googleapis.com/**',async route=>{
  if(route.request().url().includes(':batchGet'))return route.fulfill({json:[{found:{name:'projects/edunote-96bd7/databases/(default)/documents/personal-site/main',...encode(seed).mapValue}},{missing:'projects/edunote-96bd7/databases/(default)/documents/personal-site/desktop-v1'}]});
  return route.fulfill({status:404,json:{error:{code:404}}});
 });
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':`const user={email:'seungyeon980808@gmail.com',emailVerified:true,getIdToken:async()=> 'test-token'};export const getAuth=()=>({currentUser:null,authStateReady:async()=>{}});export const onAuthStateChanged=(a,cb)=>cb(null);export class GoogleAuthProvider{};export const signInWithPopup=async()=>({user});export const signOut=async()=>{};`}));
 await page.goto('/?entrance=photo');
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();
 await page.getByRole('button',{name:'Google 관리자 로그인'}).click();
 await page.getByRole('button',{name:'초안 편집 시작'}).click();
 await page.getByRole('button',{name:'창 닫기',exact:true}).click();
}

async function route(page,detail){
 await page.evaluate(value=>{const button=document.createElement('button');button.dataset.route=JSON.stringify(value);document.body.append(button);button.click();button.remove();},detail);
}

test('foundation resource editor is area scoped and rejects a forged cross-area id',async({page})=>{
 await mockOwner(page);
 await route(page,{view:'admin',tab:'resources',area:'training',category:'공유 자료',folder:'자료실'});
 await expect(page.getByRole('heading',{name:'연수 자료 편집'})).toBeVisible();
 await expect(page.getByLabel('자료실')).toHaveCount(0);
 await expect(page.locator('.edit-list')).not.toContainText('rHWP');
 await route(page,{view:'admin',tab:'resources',area:'training',id:'pk-rhwp'});
 await expect(page.getByRole('alert')).toHaveText('이 자료실의 항목이 아닙니다.');
 await expect(page.getByLabel('이름',{exact:true})).toHaveCount(0);
 await route(page,{view:'admin',tab:'resources',area:'training',category:'공유 자료',folder:'자료실'});
 await page.getByLabel('분야',{exact:true}).fill('교원 연수');
 await page.getByLabel('폴더 이름').fill('실습 파일');
 await page.getByLabel('이름',{exact:true}).fill('신규 연수 자료');
 await page.getByLabel('연결 주소').fill('https://example.com/training');
 await page.getByLabel('소개 · 사용법 · 설치 안내').fill('연수에서 사용하는 파일');
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace.resources.find(item=>item.name==='신규 연수 자료'));
 expect(stored).toMatchObject({area:'training',category:'교원 연수',folder:'실습 파일'});
 await page.getByRole('button',{name:'돌아가기',exact:true}).click();
 await expect(page.getByRole('button',{name:'교원 연수',exact:true})).toBeVisible();
 await page.screenshot({animations:'disabled',path:'.omo/evidence/owner-refinement/foundation-resource.png'});
 await page.reload();
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();
 await page.getByRole('button',{name:'Google 관리자 로그인'}).click();
 await page.getByRole('button',{name:'초안 편집 시작'}).click();
 await route(page,{view:'admin',tab:'resources',area:'training'});
 await page.locator('.edit-list').getByRole('button',{name:/신규 연수 자료/}).click();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'삭제',exact:true}).click();
 await expect(page.locator('.edit-list')).not.toContainText('신규 연수 자료');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace.resources.some(item=>item.name==='신규 연수 자료'))).toBe(false);
});

test('foundation seeded workflow saves a stable-id override with real program icons',async({page})=>{
 await mockOwner(page);
 await route(page,{view:'workflows',category:'새 태그',folder:'시험문제 제작 워크플로우',id:'overview'});
 await page.getByRole('button',{name:'프로젝트 편집',exact:true}).click();
 await page.getByLabel('분야').fill('수업 설계');
 await page.getByLabel('프로젝트 이름').fill('시험문제 제작 개선');
 await page.getByLabel('개요').fill('문항 제작 흐름의 새 개요');
 await page.getByLabel('해결하려는 문제').fill('반복 조판을 줄입니다.');
 await page.locator('#editor-form select[name="step-program"]').first().selectOption('1');
 await page.getByLabel('역할').first().fill('과학 문항 그림을 만듭니다.');
 await page.getByLabel('현재 메모 · 결과').fill('첫 편집 결과');
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace);
 expect(Object.keys(draft.workflowOverrides)).toEqual(['wf-mrx2l0t0-20']);
 expect(draft.workflowOverrides['wf-mrx2l0t0-20'].steps[0]).toEqual({programId:'1',role:'과학 문항 그림을 만듭니다.'});
 await page.getByRole('button',{name:'프로젝트로 돌아가기'}).click();
 await page.getByRole('button',{name:'수업 설계',exact:true}).click();
 await page.getByRole('button',{name:'시험문제 제작 개선',exact:true}).click();
 await page.locator('.finder-items').getByRole('button',{name:/^5E 과학/}).click();
 await expect(page.locator('.finder-preview img')).toHaveAttribute('src','assets/logo-5e.svg');
 await expect(page.locator('.finder-preview .prose')).toHaveText('과학 문항 그림을 만듭니다.');
 await page.screenshot({animations:'disabled',path:'.omo/evidence/owner-refinement/foundation-workflow.png'});
});

test('foundation opens a legacy draft and rejects a malformed new schedule field',async({page})=>{
 await mockOwner(page);
 await page.evaluate(()=>localStorage.setItem('studio-draft-v1',JSON.stringify({workspace:{version:1,note:'이전 초안',records:[],resources:[],shortcuts:[]},baseRevision:null,baseKnown:true})));
 await page.reload();
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();
 await page.getByRole('button',{name:'Google 관리자 로그인'}).click();
 await page.getByRole('button',{name:'초안 편집 시작'}).click();
 await route(page,{view:'about'});
 await expect(page.locator('.about-intro-copy')).toContainText('저는 게으른 교사입니다.');
 await route(page,{view:'settings'});
 const invalid={version:1,note:'백업',records:[],resources:[],shortcuts:[],schedules:[{id:'bad',date:'2026-09-13',start:605,end:660,title:'잘못된 일정',location:'',body:'',url:''}]};
 await page.locator('#import-file').setInputFiles({name:'bad-schedule.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
 await expect(page.locator('#admin-status')).toHaveText('일정의 날짜, 시간 또는 내용을 확인해주세요.');
});
