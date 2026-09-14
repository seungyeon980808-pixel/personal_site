const {test,expect}=require('@playwright/test');
test('welcome notch, playful routes and charged hammer return',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/?entrance=closed&welcome=1');
 await page.locator('#enter').click();
 await expect(page.locator('#welcome')).toBeVisible();
 await expect(page.locator('.desktop-notch')).toBeVisible();
 await expect(page.locator('.desktop-notch .notch-friend')).toHaveCount(6);
 await expect(page.locator('.desktop-notch .notch-friend').first()).toBeHidden();
 await page.getByRole('button',{name:'넘어가기',exact:true}).click();
 await expect(page.locator('#playful-desktop')).toBeVisible();
 await expect(page.locator('.desktop-notch .notch-friend').first()).toBeVisible();
 const dims=await page.locator('.desktop-notch .notch-friend img').first().boundingBox();expect(dims.height).toBeCloseTo(11.016,1);
 await page.locator('.playful-about').click();await expect(page.locator('#window-title')).toHaveText('인사드립니다');await page.locator('#window-close').click();
 await page.locator('.playful-training').click();await expect(page.locator('#window-title')).toHaveText('연수 자료');await page.locator('#window-close').click();
 await page.locator('.hammer-tool').dblclick();await page.mouse.move(400,300);await page.mouse.down();await expect(page.locator('.hammer-boom')).toBeVisible({timeout:5000});await page.mouse.up();
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed',{timeout:6000});
 await expect(page.locator('.hammer-boom')).toBeHidden();await expect(page.locator('#playful-desktop')).toBeHidden();
});
