import {chromium} from 'playwright';
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import AxeBuilder from '@axe-core/playwright';
const dir='.omo/evidence/notebook';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:await puppeteer.executablePath()});
const manifest=[];
try{
 for(const [width,height] of [[375,812],[768,900],[1280,900],[1280,720]]){
  const context=await browser.newContext({viewport:{width,height},recordVideo:{dir:`${dir}/video`,size:{width,height}}});
  const page=await context.newPage();const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const record={width,height,files:[],errors,axe:[]};
  const shot=async name=>{await page.evaluate(()=>Promise.all(document.querySelector('#workspace-window').getAnimations().map(a=>a.finished.catch(()=>{}))));const file=`${name}-${width}x${height}.png`;await page.screenshot({path:`${dir}/${file}`});record.files.push(file);};
  const axe=async name=>{const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();record.axe.push({name,violations:r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});};
  await page.goto('http://localhost:4321/');await page.locator('#entrance[data-ready="true"]').waitFor();await shot('closed');await axe('entrance');
  await page.locator('#enter').hover();await page.waitForTimeout(360);await shot('hover');await page.mouse.move(1,1);await page.keyboard.press('Tab');await page.waitForTimeout(360);await shot('focus');
  await page.locator('#enter').click();await page.waitForTimeout(420);await shot('opening');await page.waitForFunction(()=>document.querySelector('#entrance').dataset.phase==='open',null,{polling:'raf'});await shot('open');await page.locator('#entrance[data-phase="zooming"]').waitFor();await page.waitForTimeout(300);await shot('zoom');
  await page.locator('#entrance').waitFor({state:'hidden'});await shot('desktop');await axe('desktop');
  for(const [label,name] of [['추천 도구함','finder'],['만든 프로그램 폴더','programs'],['메모 펼쳐보기 ↗','note'],['캘린더','records']]){
   await page.getByRole('button',{name:label,exact:true}).click();await page.locator('#window-body').waitFor();await shot(name);await page.locator('#window-close').click();
  }
  await page.getByRole('button',{name:'만든 프로그램 폴더',exact:true}).click();await page.getByRole('button',{name:'5E',exact:true}).click();await shot('chooser');await page.getByRole('button',{name:/바로 실행/}).click();await shot('browser');
  await page.locator('#titlebar [data-exit]').click();await page.waitForTimeout(330);await shot('returning');await page.locator('#entrance[data-phase="closed"]').waitFor();await shot('returned');
  await page.locator('#enter').click();await page.keyboard.press('Escape');await page.locator('#entrance[data-phase="closed"]').waitFor();await shot('cancelled');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#enter').click();await page.locator('#entrance').waitFor({state:'hidden'});await shot('reduced-desktop');await page.locator('#return').click();await shot('reduced-closed');
  record.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);await context.close();manifest.push(record);
  const tiles=[];for(const [i,file]of record.files.entries()){tiles.push({input:await sharp(`${dir}/${file}`).resize(320,240,{fit:'contain',background:'#e8e8eb'}).png().toBuffer(),left:i%4*320,top:Math.floor(i/4)*266});tiles.push({input:Buffer.from(`<svg width="320" height="26"><rect width="320" height="26" fill="white"/><text x="8" y="18" font-size="12">${file}</text></svg>`),left:i%4*320,top:Math.floor(i/4)*266+240});}
  await sharp({create:{width:1280,height:Math.ceil(record.files.length/4)*266,channels:4,background:'#eee'}}).composite(tiles).png().toFile(`${dir}/sheet-${width}x${height}.png`);
 }
 await fs.writeFile(`${dir}/manifest.json`,JSON.stringify(manifest,null,2));console.log(JSON.stringify(manifest.map(r=>({viewport:`${r.width}x${r.height}`,files:r.files.length,errors:r.errors,overflow:r.overflow,axe:r.axe})),null,2));
}finally{await browser.close();}
