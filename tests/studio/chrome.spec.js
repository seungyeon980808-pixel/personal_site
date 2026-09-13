const {test,expect}=require('@playwright/test');
const seed=require('../../src/studio/seed.json');
const evidence='.omo/evidence/owner-refinement/chrome';
const encode=value=>typeof value==='string'?{stringValue:value}:typeof value==='number'?{integerValue:String(value)}:typeof value==='boolean'?{booleanValue:value}:value===null?{nullValue:null}:Array.isArray(value)?{arrayValue:{values:value.map(encode)}}:{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,item])=>[key,encode(item)]))}};
async function openStudio(page){
 await page.route('https://firestore.googleapis.com/**',route=>route.fulfill({json:{...encode(seed).mapValue,updateTime:'2026-09-13T00:00:00Z'}}));
 await page.goto('/');
 await page.getByRole('button',{name:/(노트북 열고|휴대폰 들고) 작업실 들어가기/,exact:true}).click();
 await expect(page.locator('#entrance')).toBeHidden();
}
test('browser titlebar keeps the launch controls while compacting the external frame',async({page})=>{
 await openStudio(page);
 await page.getByRole('button',{name:'5E',exact:true}).click();
 await page.getByRole('button',{name:/바로 실행/}).click();
 await expect(page.locator('#browser-controls')).toBeVisible();
 await expect(page.locator('#browser-origin')).toContainText('seungyeon980808-pixel.github.io');
 await expect(page.locator('.browser-toolbar,.browser-help')).toHaveCount(0);
 await expect(page.locator('#browser-error')).toBeHidden();
 await expect(page.getByRole('button',{name:'페이지 새로고침'})).toBeVisible();
 await expect(page.getByRole('button',{name:'별도 창으로 열기'})).toBeVisible();
 await page.screenshot({animations:'disabled',path:`${evidence}/external-titlebar.png`});
 await page.getByRole('button',{name:'창 닫기'}).click();
 await page.getByRole('button',{name:'5E',exact:true}).click();
 await page.getByRole('button',{name:/설명 보기/}).click();
 await expect(page.locator('#browser-origin')).toBeHidden();
 await expect(page.locator('#browser-frame')).toHaveAttribute('src',/embedded=1/);
 await page.screenshot({animations:'disabled',path:`${evidence}/internal-titlebar.png`});
});
test('embedded detail suppresses only its own navigation while standalone detail retains it',async({page})=>{
 await page.goto('/projects/edunote.html?embedded=1');
 await expect(page.locator('.topbar')).toBeHidden();
 await page.screenshot({animations:'disabled',path:`${evidence}/embedded-detail.png`,fullPage:false});
 await page.goto('/projects/edunote.html');
 await expect(page.locator('.topbar .home')).toBeVisible();
});
