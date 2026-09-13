const {test,expect}=require('@playwright/test');
test('phone rises in front of nearby copy, enters the same screen and returns',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await expect(page.locator('.phone-copy')).toHaveText('게으른 교사의 작업용 휴대폰');await expect(page.locator('.notebook-copy')).toBeHidden();
 await page.getByRole('button',{name:'휴대폰 들고 작업실 들어가기',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#notebook-lid').getAnimations().some(a=>a.playState==='running'));
 const overlap=await page.evaluate(()=>{for(const a of document.getAnimations()){a.pause();a.currentTime=450;}const phone=document.querySelector('#notebook-lid').getBoundingClientRect(),copy=document.querySelector('.entrance-copy').getBoundingClientRect();return {overlap:phone.top<copy.bottom&&phone.bottom>copy.top,opacity:Number(getComputedStyle(document.querySelector('.entrance-copy')).opacity),front:Number(getComputedStyle(document.querySelector('#photo-flight')).zIndex)>Number(getComputedStyle(document.querySelector('.entrance-copy')).zIndex)};});
 expect(overlap.overlap).toBe(true);expect(overlap.front).toBe(true);expect(overlap.opacity).toBeGreaterThan(0);
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));await expect(page.locator('#entrance')).toBeHidden();
 await page.getByRole('button',{name:'휴대폰 내려놓기',exact:true}).click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await page.setViewportSize({width:1280,height:900});await expect(page.locator('.phone-copy')).toBeHidden();await expect(page.getByRole('button',{name:'노트북 열고 작업실 들어가기',exact:true})).toBeVisible();
});

test('one original phone remains opaque throughout the mobile transition',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await page.evaluate(()=>{
  window.phoneFrames=[];
  const sample=()=>{
   const entrance=document.querySelector('#entrance');
   if(!entrance.hidden){
    const photo=document.querySelector('.phone-rest-photo');
    window.phoneFrames.push({phase:entrance.dataset.phase,opacity:Number(getComputedStyle(photo).opacity),source:photo.querySelector('img').src});
    requestAnimationFrame(sample);
   }
  };
  requestAnimationFrame(sample);
 });
 await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();
 const frames=await page.evaluate(()=>window.phoneFrames);
 expect(frames.length).toBeGreaterThan(20);
 expect(new Set(frames.map(frame=>frame.source)).size).toBe(1);
 for(const phase of ['opening','open','zooming']){
  const samples=frames.filter(frame=>frame.phase===phase);
  expect(samples.length).toBeGreaterThan(0);
  expect(Math.min(...samples.map(frame=>frame.opacity))).toBe(1);
 }
});

test('lowering starts from the same upright photo and thickness as lifting ends',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await page.locator('#enter').click();await page.waitForFunction(()=>document.querySelector('#entrance').dataset.phase==='open',null,{polling:'raf'});
 const upright=await page.evaluate(()=>['.phone-rest-photo','.phone-photo-base'].map(selector=>Array.from(new DOMMatrix(getComputedStyle(document.querySelector(selector)).transform).toFloat64Array())));
 const hardware=()=>page.evaluate(()=>['.phone-upright-shell','.phone-rest-photo>img','.phone-photo-base'].map(selector=>getComputedStyle(document.querySelector(selector)).opacity));
 expect(await hardware()).toEqual(['1','0','0']);
 await expect(page.locator('#entrance')).toBeHidden();await page.locator('#return').click();
 const returnStart=await page.evaluate(()=>['.phone-rest-photo','.phone-photo-base'].map(selector=>Array.from(new DOMMatrix(getComputedStyle(document.querySelector(selector)).transform).toFloat64Array())));
 for(let part=0;part<upright.length;part++)for(let cell=0;cell<16;cell++)expect(returnStart[part][cell]).toBeCloseTo(upright[part][cell],10);
 expect(await hardware()).toEqual(['1','0','0']);
 await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
});

test('live screen is present at rest and touch paging preserves its page on return',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await expect(page.locator('.phone-rest-photo .screen-viewport #desktop')).toHaveCount(1);
 expect(await page.locator('.screen-content').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
 await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();
 const dock=await page.locator('#dock').boundingBox();
 const cdp=await context.newCDPSession(page);
 await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y:450}]});
 for(let x=300;x>=60;x-=30){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:450}]});await page.waitForTimeout(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.getByLabel('자료와 바로가기 화면',{exact:true})).toHaveAttribute('aria-current','true');
 expect(await page.locator('#dock').boundingBox()).toEqual(dock);
 await page.locator('#return').click();await expect(page.locator('#entrance')).toHaveAttribute('data-phase','closed');
 await expect(page.locator('.phone-rest-photo .screen-viewport #desktop')).toHaveCount(1);
 await page.locator('#enter').click();await expect(page.locator('#entrance')).toBeHidden();
 await expect(page.getByLabel('자료와 바로가기 화면',{exact:true})).toHaveAttribute('aria-current','true');
 await page.getByLabel('캘린더와 메모 화면',{exact:true}).click();
 await expect(page.getByLabel('캘린더와 메모 화면',{exact:true})).toHaveAttribute('aria-current','true');
});

test('hardware and live glass follow the same angle throughout lifting',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#entrance[data-ready="true"]').waitFor();
 await page.locator('#enter').click();
 await page.waitForFunction(()=>document.querySelector('.phone-upright-shell').getAnimations().some(a=>a.playState==='running'));
 for(const time of [200,400,650,850,1050]){
  const separation=await page.evaluate(time=>{
   document.getAnimations().forEach(a=>{a.pause();a.currentTime=time;});
   const screen=document.querySelector('.screen-viewport'),shell=document.querySelector('.phone-upright-shell');
   const coordinates=[[0,0],[1,0],[1,1],[0,1]];
   return coordinates.map(([x,y])=>{
    const sample=(parent,left,top)=>{const dot=document.createElement('span');dot.style.cssText=`position:absolute;left:${left}%;top:${top}%;width:0;height:0`;parent.append(dot);const r=dot.getBoundingClientRect();dot.remove();return r;};
    const a=sample(screen,x*100,y*100),b=sample(shell,4.6+x*90.8,2.05+y*95.7);
    return Math.hypot(a.x-b.x,a.y-b.y);
   });
  },time);
  expect(Math.max(...separation)).toBeLessThan(1);
 }
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));
 await expect(page.locator('#entrance')).toBeHidden();
});

test('camera keeps moving across the lift-to-zoom boundary',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.locator('#entrance[data-ready="true"]').waitFor();await page.locator('#enter').click();
 await page.waitForFunction(()=>document.querySelector('#photo-flight').getAnimations().some(a=>a.playState==='running'));
 const scales=[];
 for(const time of [950,1050,1150,1250,1350]){
  scales.push(await page.evaluate(time=>{
   document.getAnimations().forEach(a=>{a.pause();a.currentTime=time;});
   return new DOMMatrix(getComputedStyle(document.querySelector('#photo-flight')).transform).m11;
  },time));
 }
 for(let i=1;i<scales.length;i++)expect(scales[i]-scales[i-1]).toBeGreaterThan(.01);
 await page.evaluate(()=>document.getAnimations().forEach(a=>a.play()));
 await expect(page.locator('#entrance')).toBeHidden();
});
