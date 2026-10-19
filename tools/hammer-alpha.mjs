// 체크무늬가 그림으로 박힌 hammer-cutout.webp에서 배경을 걷어내 진짜 투명 이미지를 만든다.
// 가장자리에서 밝고 무채색인 픽셀(체크무늬)을 따라 채우기 → 배경, 나머지 → 망치.
import sharp from 'sharp';
const src='assets/about/hammer-cutout.webp';
const {data,info}=await sharp(src).removeAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h}=info,bg=new Uint8Array(w*h);
const checker=i=>{const r=data[i*3],g=data[i*3+1],b=data[i*3+2];return Math.min(r,g,b)>=188&&Math.max(r,g,b)-Math.min(r,g,b)<=14;};
const stack=[];for(let x=0;x<w;x++){stack.push(x,(h-1)*w+x);}for(let y=0;y<h;y++){stack.push(y*w,y*w+w-1);}
while(stack.length){const p=stack.pop();if(bg[p]||!checker(p))continue;bg[p]=1;const x=p%w,y=(p-x)/w;if(x>0)stack.push(p-1);if(x<w-1)stack.push(p+1);if(y>0)stack.push(p-w);if(y<h-1)stack.push(p+w);}
// 테두리 1px은 반투명으로 부드럽게
const out=Buffer.alloc(w*h*4);
for(let p=0;p<w*h;p++){const x=p%w,y=(p-x)/w;let a=bg[p]?0:255;if(!bg[p]){let n=0;for(const q of [p-1,p+1,p-w,p+w])if(q>=0&&q<w*h&&bg[q])n++;if(n)a=255-n*45;}out[p*4]=data[p*3];out[p*4+1]=data[p*3+1];out[p*4+2]=data[p*3+2];out[p*4+3]=a;}
const img=sharp(out,{raw:{width:w,height:h,channels:4}});
await img.clone().webp({quality:86,alphaQuality:90}).toFile('assets/about/hammer-alpha.webp');
await img.clone().resize(192,192).webp({quality:88,alphaQuality:90}).toFile('assets/about/hammer-alpha-192.webp');
console.log('ok',w,h);
