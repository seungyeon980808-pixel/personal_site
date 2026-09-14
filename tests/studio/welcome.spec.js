const {test,expect}=require('@playwright/test');
test('first visit tour, skip persistence and help replay',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?entrance=closed');await page.locator('#enter').click();
 await expect(page.locator('#welcome')).toBeVisible();await expect(page.locator('#welcome h1')).toHaveText('게으른 교사의 노트북에 오신 것을 환영합니다.');
 await page.getByRole('button',{name:'둘러보기',exact:true}).click();await expect(page.locator('#dock')).toHaveClass(/tour-target/);
 await page.getByRole('button',{name:'다음',exact:true}).click();await expect(page.locator('#icons')).toHaveClass(/tour-target/);
 await page.getByRole('button',{name:'시작하기',exact:true}).click();await expect(page.locator('#welcome')).toBeHidden();
 await page.reload();await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();await expect(page.locator('#welcome')).toBeHidden();
 await page.locator('.system-menu summary').click();await page.locator('#welcome-again').click();await expect(page.locator('#welcome')).toBeVisible();await page.getByRole('button',{name:'넘어가기',exact:true}).click();await expect(page.locator('#welcome')).toBeHidden();
});
