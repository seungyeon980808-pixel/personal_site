const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test('side phone wakes while Mac remains asleep and partly cropped',async({page})=>{
 await page.setViewportSize({width:1000,height:900});await page.goto('/prototypes/device-unlock.html');
 const phone=page.frameLocator('#mobile iframe');
 await phone.locator('#entrance[data-ready="true"]').waitFor();
 await page.getByRole('button',{name:'휴대폰으로 전환',exact:true}).hover();
 await expect(phone.locator('html')).toHaveClass(/device-peek-hover/);
 await expect.poll(()=>phone.locator('.screen-viewport').first().evaluate(e=>getComputedStyle(e,'::after').opacity)).toBe('0');
 await page.getByRole('button',{name:'휴대폰으로 전환',exact:true}).click();await page.waitForTimeout(1100);
 const mac=page.getByRole('button',{name:'맥북으로 전환',exact:true});
 const box=await mac.boundingBox();expect(box.x).toBeGreaterThan(650);expect(box.x+box.width).toBeGreaterThan(1000);
 await mac.hover();await expect(page.frameLocator('#desktop iframe').locator('html')).not.toHaveClass(/device-peek-hover/);
});
test('unlock preview keeps one registered phone and hides the shortcut',async({page})=>{
 await page.setViewportSize({width:1000,height:900});
 await page.goto('/prototypes/device-unlock.html');
 const phone=page.frameLocator('#mobile iframe');
 await phone.locator('#entrance[data-ready="true"]').waitFor();
 await page.getByRole('button',{name:'휴대폰으로 전환',exact:true}).click();
 await page.waitForTimeout(1000);
 await phone.locator('#enter').hover();
 await expect(phone.locator('.passcode-preview')).toBeVisible();
 fs.mkdirSync('.omo/evidence/unlock-continuity',{recursive:true});
 await page.screenshot({path:'.omo/evidence/unlock-continuity/phone-hover.png'});
 await phone.locator('#enter').click();
 await expect(page.locator('#desktop')).toHaveCSS('visibility','hidden');
 const frame=page.frames().find(f=>f.url().includes('v=phone'));
 await frame.waitForFunction(()=>document.querySelector('.phone-rest-photo').getAnimations().some(a=>a.playState==='running'));
 for(const time of [0,250,550,850,1100,1450]){
  await frame.evaluate(time=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=time;}),time);
  await page.screenshot({path:'.omo/evidence/unlock-continuity/phone-'+time+'.png'});
  await expect(phone.locator('.phone-upright-shell')).toBeHidden();
  expect(await phone.locator('.phone-rest-photo>img').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 }
 await frame.evaluate(()=>document.getAnimations().forEach(a=>a.play()));
 await expect(phone.locator('#entrance')).toBeHidden();
 await page.screenshot({path:'.omo/evidence/unlock-continuity/phone-inside.png'});
 await phone.locator('#return').click();
 await expect(phone.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await expect(page.locator('#desktop')).toHaveCSS('visibility','visible');
});

test('mobile shortcut stays reachable and Mac entry hides phone',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/prototypes/device-unlock.html');
 await page.frameLocator('#mobile iframe').locator('#entrance[data-ready="true"]').waitFor();
 await expect(page.locator('#mobile')).toHaveClass(/active/);
 const button=page.getByRole('button',{name:'맥북으로 전환',exact:true});
 await page.frameLocator('#desktop iframe').locator('#entrance[data-ready="true"]').waitFor();await page.waitForTimeout(1100);await expect(button).toBeVisible();
 await page.screenshot({path:'.omo/evidence/unlock-continuity/mobile-shortcut.png'});
 await button.click();await page.waitForTimeout(1000);
 const mac=page.frameLocator('#desktop iframe');
 await mac.locator('#enter').click();await expect(page.locator('#mobile')).toHaveCSS('visibility','hidden');
 await expect(mac.locator('#entrance')).toBeHidden();
 await mac.locator('#return').click();await expect(mac.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await expect(page.locator('#mobile')).toHaveCSS('visibility','visible');
});

test('Mac preview contains the complete desktop before zoom',async({page})=>{
 await page.setViewportSize({width:1000,height:900});await page.goto('/prototypes/device-unlock.html');
 const mac=page.frameLocator('#desktop iframe');await mac.locator('#entrance[data-ready="true"]').waitFor();
 const fits=await mac.locator('.screen-content').evaluate(e=>{
  const m=new DOMMatrix(getComputedStyle(e).transform),v=e.parentElement;
  return {left:m.e,top:m.f,right:m.e+e.clientWidth*m.a,bottom:m.f+e.clientHeight*m.d,width:v.clientWidth,height:v.clientHeight};
 });
 expect(fits.left).toBeGreaterThanOrEqual(-1);expect(fits.top).toBeGreaterThanOrEqual(-1);
 expect(fits.right).toBeLessThanOrEqual(fits.width+1);expect(fits.bottom).toBeLessThanOrEqual(fits.height+1);
 await mac.locator('#enter').click();
 const frame=page.frames().find(f=>f.url().includes('entrance=closed')&&!f.url().includes('v=phone'));
 await frame.waitForFunction(()=>document.querySelector('#entrance').dataset.phase==='zooming');
 await frame.evaluate(()=>document.querySelector('#photo-flight').getAnimations().forEach(a=>{if(a.effect.getTiming().duration===800){a.pause();a.currentTime=799;}}));
 const before=await mac.locator('#dock').boundingBox();
 await page.screenshot({path:'.omo/evidence/unlock-continuity/mac-zoom-end.png'});
 await frame.evaluate(()=>document.querySelector('#photo-flight').getAnimations().forEach(a=>a.play()));
 await expect(mac.locator('#entrance')).toBeHidden();
 const after=await mac.locator('#dock').boundingBox();
 for(const key of ['x','y','width','height'])expect(Math.abs(before[key]-after[key])).toBeLessThan(2);

});

test('Mac chassis stays identical across closing and closed states',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('studio-welcome-v1','done'));
 await page.goto('/?entrance=closed');await page.locator('#entrance[data-ready="true"]').waitFor();await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();await page.locator('#return').click();
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closing');
 const chassis=()=>page.locator('.device-frame').evaluate(e=>({opacity:getComputedStyle(e,'::before').opacity,transform:getComputedStyle(e,'::before').transform,base:getComputedStyle(e.querySelector('.device-base')).display}));
 const closing=await chassis();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');expect(await chassis()).toEqual(closing);
});
