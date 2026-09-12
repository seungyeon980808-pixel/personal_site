import {chromium} from 'playwright';
import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import fs from 'node:fs/promises';
const dir='.omo/evidence/studio';
await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:await puppeteer.executablePath(),args:['--remote-debugging-port=9333']});
try{
 const page=await browser.newPage();await page.goto('http://localhost:4321/');
 for(let run=1;run<=3;run++)for(const formFactor of ['mobile','desktop']){
  const result=await lighthouse('http://localhost:4321/',{port:9333,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']},{extends:'lighthouse:default',settings:formFactor==='desktop'?{formFactor,screenEmulation:{mobile:false,width:1280,height:900,deviceScaleFactor:1},throttling:{rttMs:40,throughputKbps:10240,cpuSlowdownMultiplier:1}}:{formFactor}});
  await fs.writeFile(`${dir}/lighthouse-${formFactor}-${run}.json`,JSON.stringify(result.lhr,null,2));
  console.log(run,formFactor,JSON.stringify(Object.fromEntries(Object.entries(result.lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)]))));
 }
}finally{await browser.close();}
