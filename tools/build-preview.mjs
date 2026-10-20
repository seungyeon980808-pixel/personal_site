// 지금 브랜치의 방문자용 파일을 공개 사이트의 하위 폴더(기본 /preview/)로 내보낸다.
// 사이트 코드는 /assets/… 처럼 루트 기준 주소를 쓰므로, 그대로 복사하면 미리보기가 루트의 옛 파일을 섞어 부른다.
// → 루트 기준 주소를 /preview/ 기준으로 바꾸고, 바뀌지 않는 큰 파일(영상·시안용 사진)은 복사하지 않고 루트 것을 가리킨다.
// 사용: node tools/build-preview.mjs <내보낼 폴더> [/preview]
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const [out,base='/preview']=process.argv.slice(2);
if(!out)throw Error('사용: node tools/build-preview.mjs <내보낼 폴더> [/preview]');
const root=path.resolve(new URL('..',import.meta.url).pathname);
const skip=/^(node_modules|tests|tools|docs|PRD|src|shader-experiment)\/|\.md$|^package|^playwright|^firebase|^firestore|^_config|^\.|^CNAME$|^start-server\.bat$|^prototypes\/zz-/;
// 복사하지 않고 루트 파일을 그대로 쓰는 것: 영상, 시안 비교용 사진 묶음
const remote=/\.(mp4|mov|webm)$|^prototypes\/(wallpaper|coastal)-previews\//;
const files=execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).split('\n').filter(file=>file&&!skip.test(file));
const text=/\.(html|js|mjs|css)$/;

function rewrite(source){
 let s=source;
 // ① 루트 파일을 쓰는 영상·사진: 상대·절대 어느 쪽이든 루트 절대 주소로(나중에 ② 가 건드리지 않게 표시)
 s=s.replace(/(?:\.\.\/|\.\/|\/)*((?:assets|prototypes)\/[^"'`()\s?#]+)/g,(match,ref)=>remote.test(ref)?'\u0000/'+ref:match);
 // ② 루트 기준 파일 주소 → 미리보기 기준
 s=s.replace(/(["'`(=,\s])\/(assets|prototypes|projects)\//g,`$1${base}/$2/`);
 // ③ 루트로 보내는 이동(/?…)과 외부 브라우저로 넘길 주소
 s=s.replace(/(["'])\/\?/g,`$1${base}/?`);
 s=s.replace(/location\.origin\s*\+\s*(["'])\/\1/g,`location.origin+$1${base}/$1`);
 return s.replace(/\u0000/g,'');
}

// 지우지 않고 덮어쓴다 — 없어진 파일이 남지 않게 하려면 빈 폴더(또는 git이 관리하는 폴더)에 내보낸다
let copied=0,bytes=0;
for(const file of files){
 if(remote.test(file))continue;
 const from=path.join(root,file),to=path.join(out,file);
 await fs.mkdir(path.dirname(to),{recursive:true});
 if(text.test(file)){
  let s=rewrite(await fs.readFile(from,'utf8'));
  // 검색에 미리보기가 잡히지 않게
  if(file.endsWith('.html'))s=s.replace(/<meta charset="utf-8"\s*\/?>/i,match=>match+'<meta name="robots" content="noindex,nofollow">');
  await fs.writeFile(to,s);bytes+=Buffer.byteLength(s);
 }else{await fs.copyFile(from,to);bytes+=(await fs.stat(from)).size;}
 copied++;
}
await fs.writeFile(path.join(out,'PREVIEW.txt'),`미리보기: ${execFileSync('git',['rev-parse','--short','HEAD'],{cwd:root,encoding:'utf8'}).trim()} (${execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8'}).trim()})\n`);
console.log(`${copied}개 파일, ${(bytes/1048576).toFixed(1)}MB → ${out} (기준 ${base}/)`);
