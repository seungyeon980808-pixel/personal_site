const {test,expect}=require('@playwright/test');
test('slow image loading preserves keyboard entry and cancellation',async({page})=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/notebook-refined-*.webp',async route=>{await gate;await route.continue();});
 try{
  await page.goto('/',{waitUntil:'domcontentloaded'});await page.keyboard.press('Tab');await expect(page.locator('#enter')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#entrance')).toHaveAttribute('data-phase','opening');
  await page.keyboard.press('Escape');await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');await expect(page.locator('#enter')).toBeFocused();
 }finally{release();}
 await page.locator('#entrance[data-ready="true"]').waitFor();await page.keyboard.press('Enter');await expect(page.locator('#entrance')).toBeHidden();
});
test('approved photo endpoints and copy form one vertically centered hero',async({page})=>{
 for(const [width,height] of [[375,812],[1280,720],[1280,1000]]){
  await page.setViewportSize({width,height});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
  const geometry=await page.evaluate(()=>{const copy=document.querySelector('.entrance-copy').getBoundingClientRect(),photo=document.querySelector(innerWidth<=700?'.phone-rest-photo':'.notebook-rest-photo').getBoundingClientRect();return {center:(copy.top+photo.bottom)/2,gap:photo.top-copy.bottom,top:copy.top,bottom:photo.bottom};});
  expect(Math.abs(geometry.center-height/2)).toBeLessThan(2);expect(geometry.gap).toBeGreaterThanOrEqual(width<=700?15:35);expect(geometry.top).toBeGreaterThan(0);expect(geometry.bottom).toBeLessThan(height);
 }
 await page.locator('#enter').click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','open');await expect(page.locator('#photo-flight')).toHaveCSS('opacity','1');await expect(page.locator('#entrance')).toBeHidden();
});
test('entry can be cancelled and retried, resize settles flight, exit restores keyboard focus',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('교사가 한가해야,교육이 성장한다.');
 await page.keyboard.press('Tab');await expect(page.locator('#enter')).toBeFocused();await page.keyboard.press('Enter');
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','opening');await page.keyboard.press('Escape');
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');await expect(page.locator('#enter')).toBeFocused();
 await page.keyboard.press('Enter');await page.setViewportSize({width:1100,height:740});await expect(page.locator('#entrance')).toBeHidden();
 await expect(page.locator('#desktop')).not.toHaveAttribute('inert','');await expect(page.locator('#workspace-window')).not.toBeVisible();
 await page.locator('#return').click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');await expect(page.locator('#enter')).toBeFocused();
 await page.reload();await expect(page.locator('#entrance')).toBeVisible();
});
test('entry remains usable without session storage and reduced motion avoids camera travel',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}}));
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('#enter').click();
 await expect(page.locator('#entrance')).toBeHidden();expect(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
 await page.locator('#return').click();await expect(page.locator('#enter')).toBeFocused();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
});
test('embedded application survives minimize and is disposed on close',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.locator('#enter').click();
 await page.getByRole('button',{name:'만든 프로그램 폴더',exact:true}).click();await page.getByRole('button',{name:'5E',exact:true}).click();await page.getByRole('button',{name:/바로 실행/}).click();
 await page.locator('#browser-frame').evaluate(frame=>frame.dataset.instance='keep');await page.locator('#window-minimize').click();await page.locator('#restore').click();
 await expect(page.locator('#browser-frame')).toHaveAttribute('data-instance','keep');await page.locator('#window-close').click();await expect(page.locator('#browser-frame')).toHaveCount(0);
});
