import {initHammer} from './hammer.js';
import {initFloatingFolder} from './floating-folder.js';
import {svg} from '/src/studio/icons.js';
const models=[['A','용수철 진자','가볍고 유쾌하게','아래로 당겼다 놓으면 늘어나고 흔들립니다.'],['B','실 진자','차분하게','옆으로 끌어 놓으면 일정한 길이의 실에 매달려 흔들립니다.'],['C','포물선 운동','짧고 경쾌하게','발판에서 출발해 반대쪽에 착지합니다. 끌어 놓으면 다시 날아갑니다.'],['D','탄성충돌','작은 물리 실험','은색 공과 부딪히며 속도를 주고받습니다. 아이콘을 끌어 흐름을 바꿔보세요.']];
const main=document.querySelector('main'),dialog=document.querySelector('dialog');
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
let paused=reduced;
initFloatingFolder(()=>paused);
initHammer();
const scenes=models.map(([key,title,tone,copy],index)=>{
 const card=document.createElement('article');card.innerHTML=`<div class="heading"><h2>${key} · ${title}</h2><span>${tone}</span></div><div class="stage"><svg class="wires" aria-hidden="true" viewBox="0 0 500 285" preserveAspectRatio="none"><path class="trajectory"/><path class="wire"/><path class="platform"/><circle class="anchor" cx="250" cy="25" r="4"/></svg><button class="subject" aria-label="${title} · 인사드립니다">${svg('greeting')}</button>${index===3?'<div class="ball"></div>':''}</div><p class="caption">${copy}</p>`;main.append(card);
 const stage=card.querySelector('.stage'),button=card.querySelector('.subject');
 const s={index,stage,button,wire:card.querySelector('.wire'),trail:card.querySelector('.trajectory'),platform:card.querySelector('.platform'),anchor:card.querySelector('.anchor'),ball:card.querySelector('.ball'),x:250,y:164,vx:40,vy:0,a:.48,av:0,bx:355,bv:-55,drag:false,moved:false,t:0};
 if(index===2){s.x=80;s.y=185;s.vx=230;s.vy=-240;}if(index===3){s.x=140;s.y=183;s.vx=100;}
 function point(e){const r=stage.getBoundingClientRect();return{x:(e.clientX-r.left)*500/r.width,y:(e.clientY-r.top)*285/r.height};}
 button.onpointerdown=e=>{s.drag=true;s.moved=false;s.start=point(e);button.setPointerCapture(e.pointerId);};
 button.onpointermove=e=>{if(!s.drag)return;const p=point(e);if(Math.hypot(p.x-s.start.x,p.y-s.start.y)>5)s.moved=true;if(!s.moved)return;s.x=Math.max(34,Math.min(466,p.x));s.y=Math.max(60,Math.min(215,p.y));s.vx=0;s.vy=0;s.a=Math.atan2(s.x-250,s.y-25);s.av=0;};
 button.onpointerup=()=>{s.drag=false;if(s.moved&&index===2){s.vx=s.x<250?230:-230;s.vy=-210;}if(s.moved&&index===3)s.vx=110;};
 button.onpointercancel=()=>{s.drag=false;s.moved=true;};
 button.onclick=()=>{if(!s.moved)dialog.showModal();s.moved=false;};
 return s;
});
document.querySelector('.close').onclick=()=>dialog.close();
function step(s,dt){
 const i=s.index;
 if(i===0){const dx=s.x-250,dy=s.y-25,r=Math.hypot(dx,dy)||1,mass=2,f=-40*(r-115);s.vx+=(f*dx/r-.45*s.vx)/mass*dt;s.vy+=((f*dy/r-.45*s.vy)/mass+290)*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;}
 if(i===1){s.av+=(-3.4*Math.sin(s.a)-.025*s.av)*dt;s.a+=s.av*dt;s.x=250+145*Math.sin(s.a);s.y=25+145*Math.cos(s.a);}
 if(i===2){s.vy+=380*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;if(s.y>=185&&s.vy>0){s.y=185;s.t+=dt;if(s.t>.6){s.vx=s.x>250?-230:230;s.vy=-240;s.t=0;}else s.x-=s.vx*dt;}}
 if(i===3){s.x+=s.vx*dt;s.bx+=s.bv*dt;if(s.x<38||s.x>462){s.x=Math.max(38,Math.min(462,s.x));s.vx*=-1;}if(s.bx<30||s.bx>470){s.bx=Math.max(30,Math.min(470,s.bx));s.bv*=-1;}const d=s.bx-s.x;if(Math.abs(d)<52&&(s.vx-s.bv)*d>0){const v=s.vx;s.vx=s.bv;s.bv=v;const overlap=(52-Math.abs(d))/2,sign=Math.sign(d)||1;s.x-=sign*overlap;s.bx+=sign*overlap;}}
}
function draw(s){
 const r=s.stage.getBoundingClientRect(),sx=r.width/500,sy=r.height/285;
 s.button.style.transform=`translate(${s.x*sx-29}px,${s.y*sy-29}px)`;
 if(s.index===0){
  const dx=s.x-250,dy=s.y-25,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  let d='M250 25';
  for(let j=0;j<=240;j++){
   const t=j/240,angle=t*Math.PI*20,taper=Math.min(1,t*12,(1-t)*12);
   const across=11*Math.sin(angle)*taper,along=3.5*(Math.cos(angle)-1)*taper;
   d+=` L${250+dx*t+nx*across+dx/len*along} ${25+dy*t+ny*across+dy/len*along}`;
  }
  s.wire.setAttribute('d',d);
 }
 else if(s.index===1)s.wire.setAttribute('d',`M250 25 L${s.x} ${s.y}`);
 else{s.anchor.style.display='none';s.platform.setAttribute('d',s.index===2?'M35 214h95v6H35z M370 214h95v6h-95z':'M20 213h460v3H20z');}
 if(s.index===2)s.trail.setAttribute('d','M80 185 Q225 -110 370 185');
 if(s.ball)s.ball.style.transform=`translate(${s.bx*sx-22}px,${s.y*sy-22}px)`;
}
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.025);last=now;for(const s of scenes){if(!paused&&!dialog.open&&!s.drag)step(s,dt);draw(s);}requestAnimationFrame(frame);}requestAnimationFrame(frame);
