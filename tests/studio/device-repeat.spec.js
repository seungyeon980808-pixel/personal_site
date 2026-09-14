const {test,expect}=require('@playwright/test');
test('repeated viewport changes and switches keep device centered and corner Mac peeks',async({page})=>{
 await page.goto('/prototypes/device-unlock.html');const phone=page.frameLocator('#mobile iframe');await phone.locator('#entrance[data-ready=true]').waitFor();
 for(let i=0;i<3;i++){
  await page.getByRole('button',{name:'휴대폰으로 전환',exact:true}).click();await page.waitForTimeout(1100);
  await page.setViewportSize({width:1500+i*60,height:950});await page.waitForTimeout(300);
  await expect.poll(async()=>{const panel=await page.locator('#mobile').boundingBox();return Math.abs(panel.x+panel.width/2-(1500+i*60)/2);}).toBeLessThan(1);
  const mac=page.frameLocator('#desktop iframe');await page.getByRole('button',{name:'맥북으로 전환',exact:true}).hover();
  await expect.poll(()=>mac.locator('.device-cover').evaluate(e=>getComputedStyle(e).transform)).toBe('matrix(1, 0, 0, 0.86, 0, 0)');
  await page.getByRole('button',{name:'맥북으로 전환',exact:true}).click();await page.waitForTimeout(1100);
 }
});
