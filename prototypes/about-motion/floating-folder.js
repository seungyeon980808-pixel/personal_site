export function initFloatingFolder(isPaused){
 const folder=document.createElement('button');folder.className='floating-training';folder.setAttribute('aria-label','연수 자료 열기');folder.innerHTML='<span class="folder-picture" aria-hidden="true"></span><span>연수 자료</span>';document.body.append(folder);
 const panel=document.createElement('dialog');panel.className='training-preview';panel.innerHTML='<button class="close" aria-label="연수 자료 닫기">×</button><iframe title="연수 자료"></iframe>';document.body.append(panel);
 panel.querySelector('button').onclick=()=>panel.close();
 const frame=panel.querySelector('iframe');
 frame.onload=()=>{
  const d=frame.contentDocument;
  const open=()=>{const entry=d.querySelector('#entrance');if(!entry||!entry.hidden)return;observer.disconnect();frame.contentWindow.requestAnimationFrame(()=>{d.querySelector('#welcome .welcome-skip')?.click();d.querySelector('#icons [data-route*=training]')?.click();});};
  const observer=new MutationObserver(open);observer.observe(d.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
  d.querySelector('#enter')?.click();open();
 };
 let x=100,y=110,vx=250,vy=180,last=performance.now(),hovered=false,drag=null,suppressClick=false,launchUntil=0;
 folder.style.touchAction='none';folder.style.cursor='grab';
 folder.onclick=()=>{if(suppressClick){suppressClick=false;return;}panel.showModal();if(!frame.getAttribute('src'))frame.src='../../?entrance=closed';};
 folder.onpointerenter=()=>hovered=true;folder.onpointerleave=()=>hovered=false;
 folder.onpointerdown=e=>{
  if(e.button!==0)return;
  suppressClick=false;drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,offsetX:e.clientX-x,offsetY:e.clientY-y,moved:false,samples:[{x:e.clientX,y:e.clientY,t:performance.now()}]};
  folder.setPointerCapture(e.pointerId);folder.style.cursor='grabbing';
 };
 folder.onpointermove=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;
  if(!drag.moved)return;
  x=Math.max(0,Math.min(innerWidth-90,e.clientX-drag.offsetX));y=Math.max(0,Math.min(innerHeight-91,e.clientY-drag.offsetY));
  const now=performance.now();drag.samples.push({x:e.clientX,y:e.clientY,t:now});drag.samples=drag.samples.filter(p=>now-p.t<120);
 };
 folder.onpointerup=e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(drag.moved){
   suppressClick=true;const now=performance.now(),first=drag.samples[0],end=drag.samples.at(-1),seconds=(end.t-first.t)/1000;
   if(seconds>0&&now-end.t<100){vx=(end.x-first.x)/seconds;vy=(end.y-first.y)/seconds;const speed=Math.hypot(vx,vy);if(speed>1400){vx*=1400/speed;vy*=1400/speed;}}
   else{vx=0;vy=0;}
   hovered=false;launchUntil=now+250;
  }
  drag=null;folder.style.cursor='grab';folder.releasePointerCapture(e.pointerId);
 };
 folder.onpointercancel=()=>{drag=null;suppressClick=true;hovered=false;folder.style.cursor='grab';};
 function tick(now){
  const dt=Math.min((now-last)/1000,.04);last=now;
  const maxX=Math.max(0,innerWidth-90),maxY=Math.max(0,innerHeight-91);
  if(!isPaused()&&!drag&&(!hovered||now<launchUntil)&&!document.querySelector('dialog[open]')){x+=vx*dt;y+=vy*dt;}
  if(x<0){x=-x;vx=Math.abs(vx);}if(x>maxX){x=Math.max(0,2*maxX-x);vx=-Math.abs(vx);}
  if(y<0){y=-y;vy=Math.abs(vy);}if(y>maxY){y=Math.max(0,2*maxY-y);vy=-Math.abs(vy);}
  folder.style.transform=`translate(${x}px,${y}px)`;requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
}
