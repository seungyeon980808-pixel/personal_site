const {test,expect}=require('@playwright/test');
const sharp=require('sharp');
test.use({deviceScaleFactor:2});

test('resting phone has no photo matte or blue screen leakage',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await page.mouse.move(0,0);await page.addStyleTag({content:'#entrance{background:rgb(180,124,150)!important}'});
 const photo=page.locator('.phone-rest-photo');
 await expect.poll(()=>photo.locator('.screen-viewport').evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');
 const png=await photo.screenshot();const {data,info}=await sharp(png).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const x=Math.round(info.width*70/628),y=Math.round(info.height*100/593),offset=(y*info.width+x)*info.channels;
 expect([...data.subarray(offset,offset+3)]).toEqual([180,124,150]);
 let blue=0;for(let i=0;i<data.length;i+=info.channels)if(data[i+2]>60&&data[i+2]>data[i]*1.45&&data[i+1]>data[i]*1.15)blue++;
 expect(blue).toBeLessThan(4);
});

test('notebook peek raises the front while the rear hinge stays fixed',async({page})=>{
 await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 const sample=()=>page.locator('.device-cover').evaluate(el=>{
  const marker=document.createElement('span');marker.style.cssText='position:absolute;left:50%;top:73.05%;width:0;height:0';el.append(marker);const rear=marker.getBoundingClientRect().y;marker.style.top='83.35%';const front=marker.getBoundingClientRect().y;marker.remove();return{rear,front};
 });
 await page.mouse.move(0,0);const rest=await sample();await page.locator('#enter').hover();await page.waitForTimeout(360);const peek=await sample();
 expect(Math.abs(peek.rear-rest.rear)).toBeLessThan(.2);expect(rest.front-peek.front).toBeGreaterThan(10);
 await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();await page.locator('#return').click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
});

test('phone glass wakes on hover and stays lit through touch entry',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 const glass=()=>page.locator('.phone-rest-photo .screen-viewport').evaluate(el=>getComputedStyle(el,'::after').opacity);
 await expect.poll(glass).toBe('1');await page.locator('#enter').hover();await expect.poll(glass).toBe('0');await page.mouse.move(0,0);await expect.poll(glass).toBe('1');
 await page.locator('#enter').click();await expect.poll(glass).toBe('0');await expect(page.locator('#entrance')).toBeHidden();
});

test('corner phone hover wakes only the display, without a tinted iframe rectangle',async({page})=>{
 await page.goto('/prototypes/device-switch.html');const frame=page.frameLocator('#mobile iframe');await frame.locator('#entrance[data-ready="true"]').waitFor();
 await page.waitForTimeout(1100);const button=page.locator('#mobile .switch');const box=await frame.locator('#enter').boundingBox();
 expect(box).not.toBeNull();await page.mouse.move(Math.min(1270,box.x+box.width*.3),box.y+box.height*.5);
 await expect(page.locator('#mobile')).toHaveCSS('filter','none');await expect(page.locator('#mobile')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(frame.locator('#entrance')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(frame.locator('body')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect.poll(()=>frame.locator('.screen-viewport').evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('0');
 await page.mouse.move(0,0);await expect.poll(()=>frame.locator('.screen-viewport').evaluate(el=>getComputedStyle(el,'::after').opacity)).toBe('1');
});

test('phone display follows the photographed upper and lower glass curves',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();await page.locator('#enter').hover();
 await page.addStyleTag({content:'.phone-rest-photo .screen-content{visibility:hidden}.phone-rest-photo .screen-viewport{background:#ff00ff!important}'});
 await expect.poll(()=>page.locator('.screen-viewport').evaluate(e=>getComputedStyle(e,'::after').opacity)).toBe('0');
 const {data,info}=await sharp(await page.locator('.phone-rest-photo').screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});
 for(const [y,left,right] of [[30,158,463],[455,88,537]]){
  const row=Math.round(y*info.height/593),xs=[];for(let x=0;x<info.width;x++){const i=(row*info.width+x)*info.channels;if(data[i]>200&&data[i+1]<50&&data[i+2]>200)xs.push(x)}
  expect(xs.length).toBeGreaterThan(0);expect(Math.abs(xs[0]/info.width*628-left)).toBeLessThan(5);expect(Math.abs(xs.at(-1)/info.width*628-right)).toBeLessThan(5);
 }
});
