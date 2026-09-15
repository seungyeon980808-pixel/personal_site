import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),seed=require('../../src/studio/seed.json');

const encode=value=>typeof value==='string'?{stringValue:value}:typeof value==='number'?{integerValue:String(value)}:typeof value==='boolean'?{booleanValue:value}:value===null?{nullValue:null}:Array.isArray(value)?{arrayValue:{values:value.map(encode)}}:{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,item])=>[key,encode(item)]))}};
const record={id:'calendar-record',date:'2026-09-16',title:'수업 회고',body:'학생 질문을 다음 수업에 반영합니다.',kind:'생각'};
const schedule={id:'calendar-schedule',date:'2026-09-16',start:610,end:650,title:'연수 준비',location:'과학실',body:'실습 자료를 점검합니다.',url:'https://example.com/guide'};
const workspace={version:1,note:'방문자 메모',records:[record],resources:[],shortcuts:[],schedules:[schedule]};

async function prepare(page,{owner=false}={}){
 await page.route('https://firestore.googleapis.com/**',route=>{const request=route.request();if(request.url().includes(':batchGet'))return route.fulfill({json:[{found:{name:'projects/p/databases/(default)/documents/personal-site/main',...encode(seed).mapValue}},{found:{name:'projects/p/databases/(default)/documents/personal-site/desktop-v1',...encode(workspace).mapValue,updateTime:'2026-09-13T00:00:00Z'}}]});return route.fulfill({status:404,json:{}});});
 await page.route('https://www.gstatic.com/firebasejs/**',route=>route.fulfill({contentType:'application/javascript',body:route.request().url().includes('firebase-app')?'export const initializeApp=()=>({});':`const user={email:'seungyeon980808@gmail.com',emailVerified:true,getIdToken:async()=> 'test-token'};export const getAuth=()=>({currentUser:${owner?'user':'null'},authStateReady:async()=>{}});export const onAuthStateChanged=(auth,callback)=>callback(auth.currentUser);export class GoogleAuthProvider{};export const signInWithPopup=async()=>({user});export const signOut=async()=>{};`}));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?entrance=photo');const enter=page.getByRole('button',{name:/(노트북 열고|휴대폰 들고) 작업실 들어가기/,exact:true});if(await enter.isVisible())await enter.click();await expect(page.locator('#entrance')).toBeHidden();
}

test('visitor calendar distinguishes records and schedules in month and full-day week views',async({page})=>{
 await page.setViewportSize({width:1280,height:900});await prepare(page);await page.getByRole('button',{name:'전체 기록 ↗',exact:true}).click();
 await expect(page.getByRole('heading',{name:/2026년 9월/})).toBeVisible();const date=page.locator('.calendar-page').getByRole('button',{name:/9월 16일, 일정 1개, 기록 1개/});await expect(date).toBeVisible();await date.click();
 await expect(page.locator('.schedule-entry')).toContainText('연수 준비');await expect(page.locator('.record-entry')).toContainText('수업 회고');await expect(page.getByRole('button',{name:'일정 추가'})).toHaveCount(0);
 await page.locator('.schedule-entry').click();await expect(page.locator('.calendar-detail')).toContainText('10:10–10:50');await expect(page.getByRole('link',{name:'연결 열기 ↗'})).toHaveAttribute('href','https://example.com/guide');
 await page.getByRole('button',{name:'주간',exact:true}).click();await expect(page.locator('.calendar-week-date').first()).toContainText('월');await expect(page.locator('.calendar-week-date').last()).toContainText('일');await expect(page.locator('.calendar-hour-labels span')).toHaveCount(24);await expect(page.locator('.calendar-week-records button')).toContainText('수업 회고');await expect(page.locator('.week-event')).toContainText('연수 준비');
 await page.screenshot({animations:'disabled',path:'.omo/evidence/owner-refinement/calendar-visitor-week.png'});
});

test('owner drag-snaps a schedule and record CRUD persists in the private draft',async({page})=>{
 await page.setViewportSize({width:1280,height:900});await prepare(page,{owner:true});await page.getByRole('button',{name:'작업실 설정',exact:true}).click();await page.getByRole('button',{name:'초안 편집 시작',exact:true}).click();await page.getByRole('button',{name:'창 닫기',exact:true}).click();await page.getByRole('button',{name:'전체 기록 ↗',exact:true}).click();await page.locator('.calendar-month-day[data-cal-date="2026-09-16"]').click();await page.getByRole('button',{name:'주간',exact:true}).click();
 await page.locator('.calendar-week-scroll').evaluate(element=>element.scrollTop=0);const column=page.locator('[data-week-date="2026-09-16"]'),box=await column.boundingBox();await page.mouse.move(box.x+20,box.y+60);await page.mouse.down();await page.mouse.move(box.x+20,box.y+96);await page.mouse.up();
 await expect(page.getByRole('heading',{name:'추가하기'})).toBeVisible();const start=await page.getByLabel('시작',{exact:true}).inputValue(),end=await page.getByLabel('종료').inputValue();expect(Number(start.split(':')[1])%10).toBe(0);expect(Number(end.split(':')[1])%10).toBe(0);
 await page.getByLabel('제목').fill('드래그 일정');await page.getByLabel('장소').fill('준비실');await page.getByLabel('설명').fill('10분 단위로 만든 일정');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(page.locator('.week-event').filter({hasText:'드래그 일정'})).toBeVisible();
 const addRecord=page.getByRole('button',{name:'+ 기록',exact:true}),addBox=await addRecord.boundingBox(),overlayBox=await page.locator('.calendar-overlay').boundingBox();expect(addBox.y+addBox.height).toBeLessThanOrEqual(overlayBox.y);await addRecord.click();await page.getByLabel('제목').fill('새 기록');await page.getByLabel('종류').selectOption('연수');await page.getByLabel('내용').fill('캘린더에서 작성한 기록');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await page.getByRole('button',{name:'기록 수정',exact:true}).click();await page.getByLabel('제목').fill('수정된 기록');await page.getByRole('button',{name:'초안 저장',exact:true}).click();await expect(page.locator('.calendar-detail')).toContainText('수정된 기록');
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('studio-draft-v1')).workspace);const dragged=draft.schedules.find(item=>item.title==='드래그 일정');expect(dragged.start%10).toBe(0);expect(dragged.end%10).toBe(0);expect(draft.records.some(item=>item.title==='수정된 기록'&&item.kind==='연수')).toBe(true);
 await page.reload();const enter=page.getByRole('button',{name:/(노트북 열고|휴대폰 들고) 작업실 들어가기/,exact:true});if(await enter.isVisible())await enter.click();await page.getByRole('button',{name:'전체 기록 ↗',exact:true}).click();await page.locator('.calendar-month-day[data-cal-date="2026-09-16"]').click();await page.getByRole('button',{name:'주간',exact:true}).click();await expect(page.locator('.week-event').filter({hasText:'드래그 일정'})).toBeVisible();await page.screenshot({animations:'disabled',path:'.omo/evidence/owner-refinement/calendar-owner-week.png'});
});

test('calendar backup validation rejects malformed and duplicate schedules without dropping them',async({page})=>{
 await prepare(page,{owner:true});await page.getByRole('button',{name:'작업실 설정',exact:true}).click();await page.getByRole('button',{name:'초안 편집 시작',exact:true}).click();await page.getByLabel('백업 불러오기').setInputFiles({name:'invalid-calendar.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...workspace,schedules:[schedule,{...schedule,title:'중복'}]}))});
 await expect(page.locator('#admin-status')).toContainText('일정의 날짜, 시간 또는 내용');
});

const calendarWidths=[768,375,1280];
const scrollbarModes=[
 {name:'classic-16',width:16},
 {name:'overlay-0',width:0},
];

async function openWeek(page,scrollbarWidth){
 await prepare(page);await page.getByRole('button',{name:'전체 기록 ↗',exact:true}).click();await page.locator('.calendar-month-day[data-cal-date="2026-09-16"]').click();await page.getByRole('button',{name:'주간',exact:true}).click();
 await page.addStyleTag({content:`.calendar-week-header,.calendar-week-record-strip,.calendar-week-scroll{scrollbar-gutter:${scrollbarWidth?'stable':'auto'}!important}.calendar-week-header::-webkit-scrollbar,.calendar-week-record-strip::-webkit-scrollbar,.calendar-week-scroll::-webkit-scrollbar{width:${scrollbarWidth}px!important;height:${scrollbarWidth}px!important}`});
}

async function calendarGeometry(page){
 return page.locator('.calendar-week').evaluate(week=>{
  const boxes=selector=>[...week.querySelectorAll(selector)].map(element=>{const box=element.getBoundingClientRect();return {left:box.left,right:box.right,width:box.width};});
  const scroll=week.querySelector('.calendar-week-scroll').getBoundingClientRect(),midnight=week.querySelector('.calendar-hour-labels span').getBoundingClientRect();
  return {header:boxes('.calendar-week-date'),records:boxes('.calendar-week-records'),time:boxes('.calendar-week-column'),scroll:{top:scroll.top,left:scroll.left,right:scroll.right},midnight:{top:midnight.top,bottom:midnight.bottom}};
 });
}

function expectAligned(geometry){
 for(const row of [geometry.header,geometry.records])for(let index=0;index<7;index++){
  expect(Math.abs(row[index].left-geometry.time[index].left)).toBeLessThanOrEqual(1);
  expect(Math.abs(row[index].right-geometry.time[index].right)).toBeLessThanOrEqual(1);
 }
}

test('weekly day boundaries align for forced classic and overlay scrollbars',async({page})=>{
 for(const width of calendarWidths)for(const mode of scrollbarModes){
 await page.setViewportSize({width,height:900});await openWeek(page,mode.width);const scroll=page.locator('.calendar-week-scroll'),week=page.locator('.calendar-week');
  await scroll.evaluate(element=>element.scrollTop=0);const atStart=await calendarGeometry(page);console.log(`calendar geometry ${width}px ${mode.name}`,JSON.stringify(atStart));await page.screenshot({animations:'disabled',path:`.omo/evidence/calendar-alignment/after-${width}-${mode.name}.png`});expectAligned(atStart);expect(atStart.midnight.top).toBeGreaterThanOrEqual(atStart.scroll.top-1);
  await week.evaluate(element=>element.scrollLeft=Math.min(80,element.scrollWidth-element.clientWidth));const afterHorizontalScroll=await calendarGeometry(page);expectAligned(afterHorizontalScroll);
  await page.screenshot({animations:'disabled',path:`.omo/evidence/calendar-alignment/after-scroll-${width}-${mode.name}.png`});
 }
});

test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('studio-welcome-v1','done'));});
