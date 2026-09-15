import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const source=fs.readFileSync('assets/detail.js','utf8');
const sanitizer=source.slice(source.indexOf('const COLOR_OK'),source.indexOf('/* ---- 줄바꿈은 데스크톱 전용'));
test('rich text retains approved styling without executable attributes',async({page})=>{
 await page.goto('/?entrance=closed');
 const result=await page.evaluate(code=>{
  const clean=new Function(code+';return sanitizeRich;')();
  const box=document.createElement('div');
  box.innerHTML=clean('<u onclick="window.injected=true">밑줄</u><br onmouseover="window.injected=true"><span style="color:red;font-size:1.2em" onclick="window.injected=true">색상</span><script>window.injected=true</script>');
  document.body.append(box);box.querySelector('u').click();box.querySelector('span').click();
  return{executed:window.injected===true,attributes:[...box.querySelectorAll('*')].flatMap(el=>[...el.attributes].map(a=>a.name)),text:box.textContent,color:box.querySelector('span').style.color};
 },sanitizer);
 expect(result.executed).toBe(false);expect(result.attributes).toEqual(['style']);expect(result.text).toBe('밑줄색상');expect(result.color).toBe('red');
});
test('classic line breaks discard event handlers',async({page})=>{
 const classic=fs.readFileSync('classic.html','utf8');
 const body=classic.slice(classic.indexOf('function sanitizeBreaks(html)'),classic.indexOf('function applyData(data)'));
 await page.goto('/?entrance=closed');
 const output=await page.evaluate(code=>new Function(code+';return sanitizeBreaks;')()('첫줄<br onclick="alert(1)">둘째줄'),body);
 expect(output).toBe('첫줄<br>둘째줄');
});
