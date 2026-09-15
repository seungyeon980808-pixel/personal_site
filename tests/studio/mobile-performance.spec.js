const {test,expect}=require('@playwright/test');
test('phone enters fullscreen and closes without losing its entry',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/prototypes/device-unlock.html');
 const phone=page.frameLocator('#mobile iframe');
 await phone.locator('#entrance[data-ready=true]').waitFor();
 await phone.locator('#enter').click();
 await expect(phone.locator('#entrance')).toBeHidden();
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
 await phone.getByRole('button',{name:'넘어가기',exact:true}).click();
 await expect(phone.locator('.playful-training')).toBeVisible();
 await phone.locator('#return').click();
 await expect(phone.locator('#entrance')).toHaveAttribute('data-phase','closed');
});
test('notch moves without changing layout position every frame',async({page})=>{
 await page.goto('/?entrance=closed');
 await page.locator('#entrance[data-ready=true]').waitFor();
 await page.locator('#enter').click();
 await page.getByRole('button',{name:'넘어가기',exact:true}).click();
 const icon=page.locator('.desktop-notch .notch-friend').first();
 await expect(icon).toBeVisible();
 const before=await icon.evaluate(e=>e.style.translate);
 await expect.poll(()=>icon.evaluate(e=>e.style.translate)).not.toBe(before);
 await expect(icon).toHaveCSS('left','0px');
 await expect(icon).toHaveCSS('top','0px');
});
