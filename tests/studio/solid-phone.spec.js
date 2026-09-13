const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('solid phone rotates rigidly, enters live desktop, and reverses',async({page})=>{
 fs.mkdirSync('.omo/evidence/solid',{recursive:true});
 await page.setViewportSize({width:390,height:844});await page.goto('/?entrance=solid');
 await page.locator('#entrance[data-ready="true"]').waitFor();
 await page.screenshot({path:'.omo/evidence/solid/closed.png'});
 const initialDepth=await page.locator('.solid-rig').evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--depth')));
 const side=await page.locator('.solid-bottom').boundingBox(),front=await page.locator('.solid-front').boundingBox();
 expect(side.height/front.width).toBeGreaterThan(.08);
 expect(side.height/front.width).toBeLessThan(.13);
 await expect(page.locator('.solid-rig img')).toHaveCount(0);
 await page.locator('#desktop').evaluate(e=>e.dataset.solidIdentity='same');
 await page.locator('#enter').click();
 await page.waitForFunction(()=>document.querySelector('.solid-rig').getAnimations().some(a=>a.playState==='running'));
 for(const time of [250,550,850,1100]){
  const invariants=await page.evaluate(time=>{
   document.getAnimations().forEach(a=>{a.pause();a.currentTime=time});
   const rig=document.querySelector('.solid-rig'),m=new DOMMatrix(getComputedStyle(rig).transform);
   return {length:Math.hypot(m.m22,m.m23),depth:getComputedStyle(rig).getPropertyValue('--depth'),opacity:getComputedStyle(document.querySelector('.solid-front')).opacity};
  },time);
  expect(invariants.length).toBeCloseTo(1,5);expect(invariants.opacity).toBe('1');expect(parseFloat(invariants.depth)).toBe(initialDepth);
  await page.screenshot({path:`.omo/evidence/solid/lift-${time}.png`});
 }
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));
 await page.waitForFunction(()=>document.querySelector('#entrance').dataset.phase==='open',null,{polling:'raf'});
 await page.screenshot({path:'.omo/evidence/solid/open.png'});
 await expect(page.locator('#entrance')).toBeHidden();
 await expect(page.locator('#desktop')).toHaveAttribute('data-solid-identity','same');
 await page.screenshot({path:'.omo/evidence/solid/inside.png'});
 await page.getByRole('button',{name:'만든 프로그램 폴더',exact:true}).click();
 await expect(page.locator('#workspace-window')).toBeVisible();await page.locator('#window-close').click();
 await page.locator('#return').click();
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await page.screenshot({path:'.omo/evidence/solid/returned.png'});
 await expect(page.locator('#desktop')).toHaveAttribute('data-solid-identity','same');
 expect(await page.locator('.solid-rig').evaluate(e=>parseFloat(getComputedStyle(e).getPropertyValue('--depth')))).toBe(initialDepth);
});
test('solid entrance supports reduced motion and cancellation',async({page})=>{
 await page.setViewportSize({width:375,height:812});await page.goto('/?entrance=solid');
 await page.locator('#enter').click();await page.keyboard.press('Escape');
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();
 await page.locator('#return').click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
});
