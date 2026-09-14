const {test,expect}=require('@playwright/test');
test('integrated Mac enters fullscreen after login and shows first visit welcome',async({page})=>{
 await page.goto('/prototypes/device-unlock.html');
 await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','/assets/about/hammer.webp');
 const mac=page.frameLocator('#desktop iframe');await mac.locator('#entrance[data-ready="true"]').waitFor();
 await mac.locator('#enter').click();
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
 await expect(mac.locator('#entrance')).toBeHidden();await expect(mac.locator('#welcome')).toBeVisible();
 await mac.getByRole('button',{name:'넘어가기',exact:true}).click();
 await mac.locator('#return').click();await expect(mac.locator('#entrance')).toHaveAttribute('data-phase','closed');
});
test('side phone wakes on hover and sleeps on leave',async({page})=>{
 await page.goto('/prototypes/device-unlock.html');const phone=page.frameLocator('#mobile iframe');await phone.locator('#entrance[data-ready="true"]').waitFor();
 await page.getByRole('button',{name:'휴대폰으로 전환',exact:true}).hover();
 await expect.poll(()=>phone.locator('.screen-viewport').first().evaluate(e=>getComputedStyle(e,'::after').opacity)).toBe('0');
 await page.mouse.move(10,10);await expect.poll(()=>phone.locator('.screen-viewport').first().evaluate(e=>getComputedStyle(e,'::after').opacity)).toBe('1');
 await page.getByRole('button',{name:'휴대폰으로 전환',exact:true}).click();await page.waitForTimeout(1100);await phone.locator('#enter').hover();
 await expect.poll(()=>phone.locator('.screen-viewport').first().evaluate(e=>getComputedStyle(e,'::after').opacity)).toBe('0');await expect(phone.locator('.passcode-preview')).toBeVisible();
});
