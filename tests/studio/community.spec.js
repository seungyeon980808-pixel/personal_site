const {test,expect}=require('@playwright/test');
const seed=require('../../src/studio/seed.json');
const encode=v=>typeof v==='string'?{stringValue:v}:typeof v==='number'?{integerValue:String(v)}:typeof v==='boolean'?{booleanValue:v}:v===null?{nullValue:null}:Array.isArray(v)?{arrayValue:{values:v.map(encode)}}:{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}};
async function prepare(page,{failure=false,owner=false}={}){
 let entries=[],writes=[];
 await page.route('https://firestore.googleapis.com/**',async route=>{
  const req=route.request(),url=req.url();
  if(url.includes(':batchGet'))return route.fulfill({json:[{found:{name:'projects/p/databases/(default)/documents/personal-site/main',...encode(seed).mapValue}},{missing:'projects/p/databases/(default)/documents/personal-site/desktop-v1'}]});
  if(url.includes(':runQuery'))return route.fulfill({json:entries.map(document=>({document}))});
  if(url.includes(':commit')){const body=req.postDataJSON();writes.push(body);if(failure)return route.fulfill({status:403,json:{error:{code:403}}});const write=body.writes[0];entries.push({...write.update,fields:{...write.update.fields,createdAt:{timestampValue:'2026-09-13T00:00:00Z'}}});return route.fulfill({json:{writeResults:[{}]}});}
  if(req.method()==='DELETE'){expect(req.headers().authorization).toBe('Bearer test-token');entries=entries.filter(d=>!url.endsWith(d.name.split('/').at(-1)));return route.fulfill({json:{}});}
  return route.fulfill({status:404,json:{}});
 });
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':`const user={email:'seungyeon980808@gmail.com',emailVerified:true,getIdToken:async()=> 'test-token'};export const getAuth=()=>({currentUser:${owner?'user':'null'},authStateReady:async()=>{}});export const onAuthStateChanged=(a,cb)=>cb(a.currentUser);export class GoogleAuthProvider{};export const signInWithPopup=async()=>({user});export const signOut=async()=>{};`}));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:/(노트북 열고|휴대폰 들고) 작업실 들어가기/}).click();await expect(page.locator('#entrance')).toBeHidden();return writes;
}
test('guestbook publishes escaped text with server timestamp and owner-only deletion',async({page})=>{
 const writes=await prepare(page);
 await page.screenshot({path:'.omo/evidence/studio/desktop-community.png'});
 await page.getByRole('button',{name:'방명록',exact:true}).click();await expect(page.locator('#guestbook-list')).toContainText('첫 인사');await page.screenshot({path:'.omo/evidence/studio/guestbook.png'});
 await page.getByLabel('이름 또는 별명').fill('방문자');await page.getByLabel('남길 이야기').fill('<img src=x onerror=alert(1)> 반갑습니다');await page.getByRole('button',{name:'글 남기기',exact:true}).click();
 await expect(page.locator('.guestbook-entry')).toContainText('<img src=x onerror=alert(1)> 반갑습니다');await expect(page.locator('.guestbook-entry img')).toHaveCount(0);await expect(page.locator('[data-delete-entry]')).toHaveCount(0);
 expect(writes[0].writes[0].update.fields.project.stringValue).toBe('guestbook');expect(writes[0].writes[0].updateTransforms).toEqual([{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}]);
 await page.getByRole('button',{name:'창 닫기',exact:true}).click();await page.getByRole('button',{name:'작업실 설정',exact:true}).click();await page.getByRole('button',{name:'Google 관리자 로그인'}).click();await expect(page.getByRole('button',{name:'로그아웃',exact:true})).toBeVisible();await page.getByRole('button',{name:'창 닫기',exact:true}).click();
 await page.getByRole('button',{name:'방명록',exact:true}).click();await expect(page.locator('[data-delete-entry]')).toHaveClass(/admin-only/);page.once('dialog',d=>d.accept());await page.locator('[data-delete-entry]').click();await expect(page.locator('.guestbook-entry')).toHaveCount(0);
});
test('guestbook failed save preserves input and contact uses existing public values',async({page})=>{
 await prepare(page,{failure:true});await page.getByRole('button',{name:'방명록',exact:true}).click();await page.getByLabel('이름 또는 별명').fill('방문자');await page.getByLabel('남길 이야기').fill('다시 보낼 글');await page.getByRole('button',{name:'글 남기기',exact:true}).click();await expect(page.locator('#guestbook-status')).toContainText('저장 권한');await expect(page.getByLabel('남길 이야기')).toHaveValue('다시 보낼 글');await expect(page.getByRole('button',{name:'글 남기기',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'창 닫기',exact:true}).click();await page.getByRole('button',{name:'연락하기',exact:true}).click();await expect(page.getByRole('link',{name:'메일 쓰기',exact:true})).toHaveAttribute('href',/^mailto:/);await expect(page.getByRole('button',{name:'ID 복사',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'전화하기',exact:true})).toHaveAttribute('href','tel:01049174332');await page.screenshot({path:'.omo/evidence/studio/contact.png'});await page.setViewportSize({width:375,height:812});await expect(page.locator('#window-body')).toBeVisible();expect(await page.locator('#window-body').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.screenshot({path:'.omo/evidence/studio/contact-mobile.png'});
});
