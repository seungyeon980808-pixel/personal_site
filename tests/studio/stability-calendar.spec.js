import {test,expect} from '@playwright/test';
import seed from '../../src/studio/seed.json' with {type:'json'};
function encode(value){if(value==null)return{nullValue:null};if(typeof value==='string')return{stringValue:value};if(typeof value==='boolean')return{booleanValue:value};if(typeof value==='number')return{doubleValue:value};if(Array.isArray(value))return{arrayValue:{values:value.map(encode)}};return{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,item])=>[key,encode(item)]))}};}
test.beforeEach(async({page})=>{
 await page.clock.setFixedTime(new Date('2026-01-31T12:00:00'));
 await page.addInitScript(()=>{sessionStorage.setItem('studio-entered','1');localStorage.setItem('studio-welcome-v1','done');});
 await page.route('https://firestore.googleapis.com/**',route=>route.fulfill({json:[{found:{name:'projects/edunote-96bd7/databases/(default)/documents/personal-site/main',...encode(seed).mapValue}},{missing:'projects/edunote-96bd7/databases/(default)/documents/personal-site/desktop-v1'}]}));
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':`const user={email:'seungyeon980808@gmail.com',emailVerified:true,getIdToken:async()=> 'test-token'};export const getAuth=()=>({currentUser:null,authStateReady:async()=>{}});export const onAuthStateChanged=(a,cb)=>cb(null);export class GoogleAuthProvider{};export const signInWithPopup=async()=>({user});export const signOut=async()=>{};`}));
 await page.goto('/?entrance=open');
});
async function editCalendar(page){
 await page.getByRole('button',{name:'작업실 설정',exact:true}).click();
 await page.getByRole('button',{name:'Google 관리자 로그인'}).click();
 await page.getByRole('button',{name:'초안 편집 시작'}).click();
 await page.locator('#window-close').click();
 await page.getByRole('button',{name:'전체 기록 ↗'}).click();
}
test('January 31 navigates to February and back without overflow',async({page})=>{
 await page.getByRole('button',{name:'전체 기록 ↗'}).click();
 await expect(page.locator('.calendar-toolbar h1')).toHaveText('2026년 1월');
 await page.locator('[data-cal-action="next"]').click();
 await expect(page.locator('.calendar-toolbar h1')).toHaveText('2026년 2월');
 await page.locator('[data-cal-action="previous"]').click();
 await expect(page.locator('.calendar-toolbar h1')).toHaveText('2026년 1월');
});
test('minimize and restore preserves unsaved calendar form',async({page})=>{
 await editCalendar(page);
 await page.locator('[data-cal-add="schedule"]').click();
 await page.getByLabel('제목',{exact:true}).fill('아직 저장하지 않은 일정');
 await page.getByLabel('설명',{exact:true}).fill('작성 중인 설명');
 await page.locator('#window-minimize').click();
 await page.locator('#restore').click();
 await expect(page.getByLabel('제목',{exact:true})).toHaveValue('아직 저장하지 않은 일정');
 await expect(page.getByLabel('설명',{exact:true})).toHaveValue('작성 중인 설명');
});
test('last ten minutes of the day can be saved and edited',async({page})=>{
 await editCalendar(page);
 await page.locator('[data-cal-action="week"]').click();
 const column=page.locator('.calendar-week-column').first();
 await page.locator('.calendar-week-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
 const bounds=await column.boundingBox();
 await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height-4);
 await expect(page.locator('input[name="start"]')).toHaveValue('23:50');
 await expect(page.locator('input[name="end"]')).toHaveValue('00:00');
 await page.getByLabel('제목',{exact:true}).fill('자정까지');
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();
 await expect(page.locator('.calendar-detail')).toContainText('23:50–24:00');
 await page.locator('[data-cal-edit="schedule"]').click();
 await expect(page.locator('input[name="end"]')).toHaveValue('00:00');
 await page.getByRole('button',{name:'초안 저장',exact:true}).click();
 await expect(page.locator('.calendar-detail')).toContainText('23:50–24:00');
});
