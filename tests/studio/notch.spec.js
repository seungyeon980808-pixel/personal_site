const {test,expect}=require('@playwright/test');
test('notch friends bounce and disappear when clicked',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('studio-welcome-v1','done');sessionStorage.setItem('studio-entered','1');});await page.goto('/');
 const notch=page.locator('.desktop-notch');await expect(notch).toBeVisible();await expect(notch.locator('button')).toHaveCount(3);
 await expect.poll(()=>notch.locator('img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0))).toBe(true);
 await notch.getByRole('button',{name:'Claude 놀래키기'}).click();await expect(notch.locator('[data-friend="Claude"]')).toBeHidden();await expect(notch.locator('[data-friend="GPT"]')).toBeVisible();
});
