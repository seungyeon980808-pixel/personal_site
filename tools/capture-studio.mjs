import {chromium} from 'playwright';
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import sharp from 'sharp';
const dir='.omo/evidence/studio';const browser=await chromium.launch({executablePath:await puppeteer.executablePath()});const files=[];
try{for(const width of [375,768,1280]){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.goto('http://localhost:4321/');
 const shot=async name=>{const file=`${dir}/${name}-${width}.png`;await page.screenshot({path:file,animations:'disabled'});files.push(file);};
 await shot('entrance');await page.locator('#enter').click();await page.locator('#entrance').waitFor({state:'hidden'});
 const close=()=>page.locator('#window-close').click();
 await page.getByRole('button',{name:'만든 도구',exact:true}).click();
 for(let i=0;i<7;i++){await page.locator('.program-card').nth(i).click();await shot('program-'+i);await page.locator('#window-back').click();}await close();
 await page.getByRole('button',{name:'추천 도구함',exact:true}).first().click();
 for(const [i,category] of ['AI·개발','문서·행정','영상·제작'].entries()){await page.getByRole('button',{name:category,exact:true}).click();await shot('category-'+i);}
 await page.getByRole('button',{name:'AI·개발',exact:true}).click();await page.getByRole('button',{name:'서비스',exact:true}).click();await shot('service');await close();
 await page.getByRole('button',{name:'작업실 검색',exact:true}).click();await page.getByRole('searchbox').fill('시험');await page.getByRole('button',{name:'검색',exact:true}).click();await shot('search');await close();
 await page.getByRole('button',{name:'놀이터',exact:true}).click();await page.getByRole('button',{name:'일시정지',exact:true}).click();await shot('physics');await close();
 await page.getByRole('button',{name:'작업실 관리',exact:true}).click();
 for(const [i,name] of ['메모','기록','추천·연수 자료','바로가기'].entries()){await page.getByRole('button',{name,exact:true}).click();await shot('editor-'+i);}
 await close();await shot('shortcut-rest');await page.locator('.shortcut-create').hover();await shot('shortcut-hover');await page.mouse.move(1,1);await page.locator('.shortcut-create').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await shot('shortcut-focus');await page.locator('.shortcut-create').click();await shot('shortcut-open');await close();
 await page.getByRole('button',{name:'5E',exact:true}).click();await page.getByRole('button',{name:/바로 실행/}).click();await page.frameLocator('#browser-frame').getByRole('button',{name:'선택 (V)',exact:true}).waitFor({timeout:30000});await shot('program-launch');
 await page.close();
}
const all=(await fs.readdir(dir)).filter(f=>f.endsWith('.png')&&!f.startsWith('sheet-'));
for(const width of [375,768,1280]){
 const subset=all.filter(f=>f.endsWith(`-${width}.png`));const cells=[];for(const [i,file]of subset.entries()){const thumb=await sharp(`${dir}/${file}`).resize(240,300,{fit:'contain',background:'#e1e5eb'}).png().toBuffer();cells.push({input:thumb,left:(i%5)*240,top:Math.floor(i/5)*324});const label=Buffer.from(`<svg width="240" height="24"><rect width="240" height="24" fill="white"/><text x="4" y="17" font-size="11">${file.replace(/[<>&]/g,'')}</text></svg>`);cells.push({input:label,left:(i%5)*240,top:Math.floor(i/5)*324+300});}
 await sharp({create:{width:1200,height:Math.ceil(subset.length/5)*324,channels:4,background:'#e1e5eb'}}).composite(cells).png().toFile(`${dir}/sheet-${width}.png`);
}
await fs.writeFile(`${dir}/capture-manifest.json`,JSON.stringify({createdAt:new Date().toISOString(),additional:files,allScreens:all},null,2));console.log(`Captured ${files.length} additional states; ${all.length} total screenshots`);
}finally{await browser.close();}
