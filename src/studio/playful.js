import {icon} from './icons.js';
import {open} from './window.js';
export function initPlayful(){
 const layer=document.createElement('div');layer.id='playful-desktop';layer.hidden=true;
 layer.innerHTML=`<svg class="spring-wire" aria-hidden="true"><path/></svg><button class="playful-about desktop-icon" aria-label="인사드립니다">${icon('greeting')}<span>인사드립니다</span></button><button class="playful-training desktop-icon" aria-label="연수 자료">${icon('folder')}<span>연수 자료</span></button>`;document.body.append(layer);
 const about=layer.querySelector('.playful-about'),training=layer.querySelector('.playful-training'),wire=layer.querySelector('path');
 const coil=Array.from({length:201},(_,j)=>{const t=j/200,a=t*Math.PI*20,taper=Math.min(1,t*12,(1-t)*12);return {t,across:11*Math.sin(a)*taper,along:3.5*(Math.cos(a)-1)*taper};});
 let raf=0;
 function wake(){if(raf)cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(tick);}
 document.addEventListener('visibilitychange',wake);
 let frozen=matchMedia('(prefers-reduced-motion:reduce)').matches,last=performance.now();
 const spring={x:0,y:0,vx:40,vy:0},fly={x:100,y:150,vx:250,vy:180};
 let anchorX=0,anchorY=55,limits;
 function bounds(){const dock=document.querySelector('#dock').getBoundingClientRect();limits={left:8,right:Math.max(8,innerWidth-88),top:45,bottom:Math.max(100,(dock.top||innerHeight-100)-92)};anchorX=Math.max(100,innerWidth-(innerWidth>700?340:130));spring.x=anchorX;spring.y=190;}
 function bind(button,state,view){let drag,hover=false,skip=false,launched=0;
  button.onpointerenter=()=>hover=true;button.onpointerleave=()=>hover=false;
  state.hold=()=>!!drag||(view==='training'&&hover&&performance.now()>launched);
  button.onpointerdown=e=>{if(e.button!==0)return;skip=false;drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:e.clientX-state.x,dy:e.clientY-state.y,samples:[],moved:false};button.setPointerCapture(e.pointerId);};
  button.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(!drag.moved)return;state.x=Math.max(limits.left,Math.min(limits.right,e.clientX-drag.dx));state.y=Math.max(limits.top,Math.min(limits.bottom,e.clientY-drag.dy));state.vx=state.vy=0;const t=performance.now();drag.samples.push({x:state.x,y:state.y,t});drag.samples=drag.samples.filter(p=>t-p.t<120);};
  button.onpointerup=e=>{if(!drag)return;skip=drag.moved;if(skip&&view==='training'){const a=drag.samples[0],b=drag.samples.at(-1);if(a&&b.t>a.t&&performance.now()-b.t<100){const dt=(b.t-a.t)/1000;state.vx=(b.x-a.x)/dt;state.vy=(b.y-a.y)/dt;const speed=Math.hypot(state.vx,state.vy);if(speed>1400){state.vx*=1400/speed;state.vy*=1400/speed;}}hover=false;launched=performance.now()+250;}drag=null;button.releasePointerCapture(e.pointerId);};
  button.onpointercancel=()=>{drag=null;skip=true;};button.onclick=()=>{if(!skip)open({view});skip=false;};
 }
 bind(about,spring,'about');bind(training,fly,'training');
 bounds();window.addEventListener('resize',bounds);
 function sync(){const entry=document.querySelector('#entrance'),welcome=document.querySelector('#welcome');const hide=!entry.hidden||(!welcome.hidden)||document.querySelector('#workspace-window').open;if(layer.hidden!==hide){layer.hidden=hide;wake();}document.body.classList.toggle('playful-ready',entry.hidden);}
 new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden','open']});sync();
 function tick(now){raf=0;if(layer.hidden||document.hidden)return;const dt=Math.min(.02,(now-last)/1000);last=now;
  if(!layer.hidden){
   if(!frozen&&!document.documentElement.classList.contains('hammer-active')){
    if(!spring.hold()){const dx=spring.x-anchorX,dy=spring.y-anchorY,r=Math.hypot(dx,dy)||1,f=-40*(r-115);spring.vx+=(f*dx/r-.45*spring.vx)/2*dt;spring.vy+=((f*dy/r-.45*spring.vy)/2+290)*dt;spring.x+=spring.vx*dt;spring.y+=spring.vy*dt;}
    if(!fly.hold()){fly.x+=fly.vx*dt;fly.y+=fly.vy*dt;}
    for(const s of [spring,fly]){if(s.x<limits.left){s.x=limits.left;s.vx=Math.abs(s.vx);}if(s.x>limits.right){s.x=limits.right;s.vx=-Math.abs(s.vx);}if(s.y<limits.top){s.y=limits.top;s.vy=Math.abs(s.vy);}if(s.y>limits.bottom){s.y=limits.bottom;s.vy=-Math.abs(s.vy);}}
   }
   about.style.transform=`translate(${spring.x}px,${spring.y}px)`;training.style.transform=`translate(${fly.x}px,${fly.y}px)`;
   const ax=anchorX+40,ay=anchorY,dx=spring.x+40-ax,dy=spring.y+12-ay,len=Math.hypot(dx,dy)||1;let d=`M${ax} ${ay}`;
   for(const {t,across,along} of coil){d+=` L${ax+dx*t-dy/len*across+dx/len*along} ${ay+dy*t+dx/len*across+dy/len*along}`;}wire.setAttribute('d',d);
  }raf=requestAnimationFrame(tick);
 }wake();
}
