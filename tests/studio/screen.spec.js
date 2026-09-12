const {test,expect}=require('@playwright/test');

for(const width of [375,1280])test(`screen content keeps identity and widget positions through entry at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:812});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await page.locator('#desktop').evaluate(node=>node.dataset.continuity='same-desktop');await expect(page.locator('#desktop')).toHaveAttribute('inert','');
 await page.locator('#enter').click();await page.locator('#entrance[data-phase="open"]').waitFor();
 const before=await page.evaluate(()=>{const v=document.querySelector('.screen-viewport').getBoundingClientRect();return {background:getComputedStyle(document.querySelector('#desktop'),'::before').backgroundImage,rects:['#widgets','#icons','#dock'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [(r.x-v.x)/v.width,(r.y-v.y)/v.height,r.width/v.width,r.height/v.height];})};});
 await page.locator('#entrance').waitFor({state:'hidden'});
 const after=await page.evaluate(()=>({background:getComputedStyle(document.querySelector('#desktop'),'::before').backgroundImage,rects:['#widgets','#icons','#dock'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x/innerWidth,r.y/innerHeight,r.width/innerWidth,r.height/innerHeight];})}));
 expect(after.background).toBe(before.background);for(let i=0;i<3;i++)for(let j=0;j<4;j++)expect(Math.abs(after.rects[i][j]-before.rects[i][j])).toBeLessThan(.006);
 await expect(page.locator('#desktop')).toHaveAttribute('data-continuity','same-desktop');expect(await page.locator('#desktop').evaluate(e=>e.parentElement.tagName)).toBe('BODY');
 await page.locator('#return').click();await page.locator('#entrance[data-phase="closed"]').waitFor();await expect(page.locator('#desktop')).toHaveAttribute('data-continuity','same-desktop');await expect(page.locator('#desktop')).toHaveAttribute('inert','');
});

test('hover peeks without entering, pointer leave closes and click continues',async({page})=>{
 await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();await page.mouse.move(1,1);
 const points=()=>page.locator('.device-cover').evaluate(e=>{const s=getComputedStyle(e),m=new DOMMatrix(s.transform),o=s.transformOrigin.split(' ').map(parseFloat);return [.7305,.8335].map(y=>{const p=new DOMPoint(0,e.clientHeight*y-o[1]).matrixTransform(m);return p.y+o[1];});});
 const restPoints=await points();
 const initial=await page.locator('#notebook-lid').evaluate(e=>getComputedStyle(e).transform);
 const cover=await page.locator('.device-cover').evaluate(e=>getComputedStyle(e).transform);
 await page.locator('#enter').hover();await expect.poll(()=>page.locator('.device-cover').evaluate(e=>getComputedStyle(e).transform)).not.toBe(cover);
 await page.waitForTimeout(360);const hoverPoints=await points();expect(Math.abs(hoverPoints[0]-restPoints[0])).toBeLessThan(.1);expect(hoverPoints[1]).toBeLessThan(restPoints[1]-1);
 expect(await page.locator('#notebook-lid').evaluate(e=>getComputedStyle(e).transform)).toBe(initial);
 expect(await page.locator('.device-cover').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');await expect(page.locator('#desktop')).toHaveAttribute('inert','');
 await page.mouse.move(1,1);await expect.poll(()=>page.locator('#notebook-lid').evaluate(e=>getComputedStyle(e).transform)).toBe(initial);
 await page.locator('#enter').hover();await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();
});
