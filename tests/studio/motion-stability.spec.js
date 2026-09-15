const {test,expect}=require('@playwright/test');

test('Escape during the fullscreen request keeps the notebook closed',async({page})=>{
 await page.goto('/prototypes/device-unlock.html');
 const frame=page.frameLocator('#desktop iframe');
 await frame.locator('#entrance[data-ready="true"]').waitFor();
 await page.frameLocator('#mobile iframe').locator('#entrance[data-ready="true"]').waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('.device iframe')].every(frame=>frame.contentDocument.querySelector('link[href="/prototypes/unlock-motion.css"]')?.sheet));
 await page.locator('.device').evaluateAll(async panels=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await Promise.all(panels.flatMap(panel=>panel.getAnimations().map(animation=>animation.finished.catch(()=>{}))));});
 await page.evaluate(()=>{document.documentElement.requestFullscreen=()=>new Promise(resolve=>{window.finishFullscreen=resolve;});});
 await frame.locator('#enter').click();
 await expect.poll(()=>page.evaluate(()=>typeof window.finishFullscreen)).toBe('function');
 await frame.locator('body').press('Escape');
 await page.evaluate(()=>window.finishFullscreen());
 await page.waitForTimeout(1200);
 await expect(frame.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await expect(frame.locator('#enter')).toBeEnabled();
});

test('reduced motion stops wire writes and reacts to preference changes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?entrance=closed');await page.locator('#enter').click();
 const skip=page.getByRole('button',{name:'넘어가기',exact:true});if(await skip.isVisible())await skip.click();
 await expect(page.locator('#playful-desktop')).toBeVisible();
 await page.evaluate(()=>{window.wireWrites=0;new MutationObserver(records=>window.wireWrites+=records.length).observe(document.querySelector('.spring-wire path'),{attributes:true,attributeFilter:['d']});});
 await page.waitForTimeout(200);const before=await page.evaluate(()=>window.wireWrites);
 await page.waitForTimeout(250);expect(await page.evaluate(()=>window.wireWrites)).toBe(before);
 await page.emulateMedia({reducedMotion:'no-preference'});
 await expect.poll(()=>page.evaluate(()=>window.wireWrites)).toBeGreaterThan(before+2);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
 const stopped=await page.evaluate(()=>window.wireWrites);await page.waitForTimeout(250);
 expect(await page.evaluate(()=>window.wireWrites)).toBe(stopped);
});

test('inactive iframe is inert while its outer switch still wakes and activates',async({page})=>{
 await page.goto('/prototypes/device-unlock.html');
 const frame=page.frameLocator('#mobile iframe');await frame.locator('#entrance[data-ready="true"]').waitFor();
 await expect(page.locator('#mobile iframe')).toHaveJSProperty('inert',true);
 await expect(page.locator('#mobile')).toHaveJSProperty('inert',false);
 await page.locator('#mobile .switch').focus();
 await expect(frame.locator('html')).toHaveClass(/device-peek-hover/);
 await page.locator('#mobile .switch').press('Enter');
 await expect(page.locator('#mobile iframe')).toHaveJSProperty('inert',false);
 await expect(page.locator('#desktop iframe')).toHaveJSProperty('inert',true);
});
test('late frame assets cannot close an entry that the visitor opens',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('**/assets/ai/aside.png',async route=>{await new Promise(resolve=>setTimeout(resolve,1500));await route.continue();});
 await page.goto('/prototypes/device-unlock.html',{waitUntil:'domcontentloaded'});
 const phone=page.frameLocator('#mobile iframe');
 await phone.locator('#entrance[data-ready=true]').waitFor();
 await expect(page.locator('#mobile')).toHaveAttribute('data-ui-ready','true');
 await expect(page.locator('#mobile iframe')).toHaveJSProperty('inert',false);
 await phone.locator('#enter').click();
 await expect(phone.locator('#entrance')).toBeHidden();
 await page.waitForTimeout(500);
 await expect(phone.locator('#entrance')).toBeHidden();
});
