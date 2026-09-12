import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root)||pathname.split('/').some(p=>p.startsWith('.'))){res.writeHead(403);return res.end();}
  let data=await fs.readFile(file);const type=types[path.extname(file)]||'application/octet-stream';
  const headers={'Content-Type':type,'Cache-Control':pathname.startsWith('/assets/')?'public, max-age=3600':'no-cache','X-Content-Type-Options':'nosniff','Vary':'Accept-Encoding'};
  if(/text|javascript|json|svg/.test(type)&&req.headers['accept-encoding']?.includes('gzip')){data=gzipSync(data);headers['Content-Encoding']='gzip';}
  headers['Content-Length']=data.length;res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:data);
 }catch(err){res.writeHead(err.code==='ENOENT'?404:400);res.end('요청한 파일을 찾을 수 없습니다.');}
}).listen(4321,'127.0.0.1',()=>console.log('Studio preview: http://localhost:4321/'));
