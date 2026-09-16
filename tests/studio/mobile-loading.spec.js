const {test,expect}=require('@playwright/test');
test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
test('loading phone cannot paint an uninitialized device or unlocked screen',async({page})=>{
 let release;const hold=new Promise(resolve=>release=resolve);
 await page.route('**/prototypes/unlock-motion.css',async route=>{await hold;await route.continue();});
 await page.goto('/prototypes/device-unlock.html',{waitUntil:'domcontentloaded'});
 const phone=page.frameLocator('#mobile iframe');
 await phone.locator('#entrance[data-ready=true]').waitFor();
 try{await expect(page.locator('#mobile iframe')).toBeHidden();}finally{release();}
 await expect(page.locator('#mobile')).toHaveAttribute('data-ui-ready','true');
 await expect(page.locator('#mobile iframe')).toBeVisible();
});
test('touch does not leave the corner phone awake',async({page})=>{
 await page.goto('/prototypes/device-unlock.html');
 await expect(page.locator('#mobile')).toHaveAttribute('data-ui-ready','true');
 await expect(page.locator('#desktop')).toHaveAttribute('data-ui-ready','true');
 await page.locator('#desktop .switch').tap();
 await page.waitForTimeout(1100);
 await page.locator('#mobile').dispatchEvent('pointerenter',{pointerType:'touch'});
 await expect(page.frameLocator('#mobile iframe').locator('html')).not.toHaveClass(/device-peek-hover/);
});
test('notch motion does not synchronously measure layout on every frame',async({page})=>{
 await page.goto('/?entrance=closed');
 await page.locator('#entrance[data-ready=true]').waitFor();
 await page.locator('#enter').tap();
 await page.locator('#entrance').waitFor({state:'hidden'});
 const skip=page.getByRole('button',{name:'넘어가기',exact:true});if(await skip.isVisible())await skip.click();
 const measurements=await page.locator('.desktop-notch').evaluate(async el=>{
  let reads=0;for(const key of ['clientWidth','clientHeight']){const original=Object.getOwnPropertyDescriptor(Element.prototype,key).get;Object.defineProperty(el,key,{configurable:true,get(){reads++;return original.call(this);}});}
  for(let i=0;i<12;i++)await new Promise(requestAnimationFrame);
  for(const key of ['clientWidth','clientHeight'])delete el[key];return reads;
 });
 expect(measurements).toBe(0);
});
test('desktop physics does not rebuild layout on every animation frame',async({page,context})=>{
 await page.addInitScript(()=>localStorage.setItem('studio-welcome-v1','done'));
 await page.goto('/?entrance=closed');await page.locator('#entrance[data-ready=true]').waitFor();await page.locator('#enter').tap();await page.locator('#entrance').waitFor({state:'hidden'});
 await page.waitForTimeout(300);
 const session=await context.newCDPSession(page);await session.send('Performance.enable');
 const layouts=async()=> (await session.send('Performance.getMetrics')).metrics.find(m=>m.name==='LayoutCount').value;
 const start=await layouts();await page.evaluate(async()=>{for(let i=0;i<20;i++)await new Promise(requestAnimationFrame);});
 expect(await layouts()-start).toBeLessThan(3);
});
test('touch entry and return restore the unlit phone glass',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('studio-welcome-v1','done'));
 await page.goto('/prototypes/device-unlock.html');const phone=page.frameLocator('#mobile iframe');
 await expect(page.locator('#mobile')).toHaveAttribute('data-ui-ready','true');
 await phone.locator('#enter').tap();await phone.locator('#entrance').waitFor({state:'hidden'});
 await phone.locator('#return').tap();await expect(phone.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await expect.poll(()=>phone.locator('.phone-rest-photo .screen-viewport').evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');
});
