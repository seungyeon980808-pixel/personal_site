import {chromium} from 'playwright';
import puppeteer from 'puppeteer';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({executablePath:await puppeteer.executablePath()});const results=[];
try{for(const width of [375,1280]){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();await page.goto('http://localhost:4321/');await page.locator('#enter').click();await page.locator('#entrance').waitFor({state:'hidden'});
 const audit=async name=>{await page.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();results.push({width,name,violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});};
 await audit('desktop');for(const name of ['만든 도구','추천 도구함','연수 자료','프로젝트','소개·채널','캘린더']){await page.getByRole('button',{name,exact:true}).first().click();await audit(name);await page.locator('#window-close').click();}
 await page.getByRole('button',{name:'작업실 관리',exact:true}).click();for(const name of ['메모','기록','추천·연수 자료','바로가기']){await page.getByRole('button',{name,exact:true}).click();await audit('editor-'+name);}await context.close();
}await fs.writeFile('.omo/evidence/studio/accessibility.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.filter(r=>r.violations.length),null,2));console.log('Audited '+results.length+' states');}finally{await browser.close();}
