import {test,expect} from '@playwright/test';
import seed from '../../src/studio/seed.json' with {type:'json'};
function encode(v){if(v==null)return{nullValue:null};if(typeof v==='string')return{stringValue:v};if(typeof v==='boolean')return{booleanValue:v};if(typeof v==='number')return{doubleValue:v};if(Array.isArray(v))return{arrayValue:{values:v.map(encode)}};return{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,v])=>[k,encode(v)]))}};}
test('private folder authenticated CRUD and logout clear',async({page})=>{
 let saved=null;
 await page.addInitScript(()=>{sessionStorage.setItem('studio-entered','1');localStorage.setItem('studio-welcome-v1','done');});
 await page.route('https://firestore.googleapis.com/**',async route=>{
  if(route.request().url().includes('private-workspaces')){expect(route.request().headers().authorization).toBe('Bearer test-token');if(route.request().method()==='PATCH'){saved=route.request().postDataJSON();return route.fulfill({json:{...saved,updateTime:'2026-09-15T00:00:00Z'}});}return route.fulfill(saved?{json:{...saved,updateTime:'2026-09-15T00:00:00Z'}}:{status:404,json:{}});}
  return route.fulfill({json:[{found:{name:'projects/edunote-96bd7/databases/(default)/documents/personal-site/main',...encode(seed).mapValue}},{missing:'projects/edunote-96bd7/databases/(default)/documents/personal-site/desktop-v1'}]});
 });
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':`const user={email:'seungyeon980808@gmail.com',emailVerified:true,getIdToken:async()=> 'test-token'};export const getAuth=()=>({currentUser:null,authStateReady:async()=>{}});export const onAuthStateChanged=(a,cb)=>cb(null);export class GoogleAuthProvider{};export const signInWithPopup=async()=>({user});export const signOut=async()=>{};`}));
 await page.goto('/?entrance=open');
 await expect(page.getByRole('button',{name:'비밀 폴더',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();
 await page.getByRole('button',{name:'Google 관리자 로그인'}).click();
 await page.getByRole('button',{name:'창 닫기',exact:true}).click();
 await page.getByRole('button',{name:'비밀 폴더',exact:true}).click();
 await page.getByLabel('작업 이름').fill('개인 수업 준비');
 await page.getByRole('textbox',{name:'메모',exact:true}).fill('나만 보는 작업 메모');
 await page.getByRole('button',{name:'저장',exact:true}).click();
 await expect(page.locator('#private-status')).toHaveText('저장했습니다.');
 await page.getByRole('button',{name:'개인 수업 준비',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'메모',exact:true})).toHaveValue('나만 보는 작업 메모');
 expect(await page.evaluate(()=>JSON.stringify(localStorage))).not.toContain('나만 보는 작업 메모');
 await page.screenshot({path:'/tmp/private-folder.png'});
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'삭제',exact:true}).click();
 await expect(page.getByRole('button',{name:'개인 수업 준비',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'창 닫기',exact:true}).click();
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();
 await page.getByRole('button',{name:'로그아웃',exact:true}).click();
 await expect(page.getByRole('button',{name:'비밀 폴더',exact:true})).toHaveCount(0);
});
