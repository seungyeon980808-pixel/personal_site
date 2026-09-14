const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
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
