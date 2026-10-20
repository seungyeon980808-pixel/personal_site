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
 // 휴대폰 폭은 아이폰식 홈(떠다니는 아이콘 없음)
 await expect(phone.locator('#phone-home')).toBeVisible();await expect(phone.locator('.playful-training')).toBeHidden();
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
 // 움직임은 CSS 애니메이션(translate)이 맡는다 — 실제 화면 위치가 바뀌는지로 확인한다
 const at=()=>icon.locator('img').evaluate(e=>{const r=e.getBoundingClientRect();return Math.round(r.x*10)+','+Math.round(r.y*10);});
 const before=await at();
 await expect.poll(at).not.toBe(before);
 await expect.poll(()=>icon.evaluate(e=>e.getAnimations().length)).toBeGreaterThan(0);
 await expect(icon).toHaveCSS('left','0px');
 await expect(icon).toHaveCSS('top','0px');
});
