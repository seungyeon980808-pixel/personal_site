import {$} from './utils.js';
import {close} from './window.js';
import {restorePage} from './pages.js';

let state='closed',animations=[],home,rest='none',serial=0,slow=false;
const pose='rotateX(60deg)';
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const duration=ms=>reduced()?0:ms*(slow?2.5:1);
function tween(element,frames,ms,easing='cubic-bezier(.42,0,.22,1)'){
 const a=element.animate(frames,{duration:duration(ms),easing,fill:'forwards'});animations.push(a);
 return a.finished.catch(()=>{});
}
function stop(){animations.forEach(a=>a.cancel());animations=[];}
function perimeter(width,height,radius){
 const points=[];
 for(const [cx,cy,start] of [[width-radius,radius,-90],[width-radius,height-radius,0],[radius,height-radius,90],[radius,radius,180]]){
  for(let i=0;i<=16;i++){const a=(start+i*90/16)*Math.PI/180;points.push([cx+radius*Math.cos(a),cy+radius*Math.sin(a)]);}
 }
 return points;
}
function geometry(){
 const rig=$('.solid-rig'),w=rig.clientWidth,h=rig.clientHeight,depth=w*.12,r=w*.13;
 rig.style.setProperty('--depth',depth+'px');
 const points=perimeter(w,h,r);
 $('.solid-sides').innerHTML=points.map(([x,y],i)=>{
  const [nx,ny]=points[(i+1)%points.length],angle=Math.atan2(ny-y,nx-x),length=Math.hypot(nx-x,ny-y);
  const light=Math.round(135+70*Math.cos(angle-.8));
  const bottom=Math.abs(y-h)<.1&&Math.abs(ny-h)<.1;
  return `<i class="solid-side${bottom?' solid-bottom':''}" style="width:${length+.4}px;height:${depth}px;left:${(x+nx)/2}px;top:${(y+ny)/2}px;background:linear-gradient(#fafafa,${'rgb('+light+','+light+','+(light+2)+')'} 28%,#777a80 68%,#e4e5e6);transform:translate(-50%,-50%) translateZ(${-depth/2}px) rotateZ(${angle}rad) rotateX(90deg)">${bottom?'<b class="solid-port"></b><b class="solid-grille left"></b><b class="solid-grille right"></b>':''}</i>`;
 }).join('');
 const screen=$('.solid-glass'),content=$('.solid-content');
 content.style.width=innerWidth+'px';content.style.height=innerHeight+'px';
 const body=getComputedStyle(document.body);
 content.style.font=body.font;content.style.lineHeight=body.lineHeight;content.style.color=body.color;
 content.style.transform=`scale(${screen.clientWidth/innerWidth},${screen.clientHeight/innerHeight})`;
}
function mount(){
 const desktop=$('#desktop');
 $('.solid-content').append(desktop);desktop.hidden=false;desktop.inert=true;geometry();restorePage();
}
function release(){
 home.after($('#desktop'));$('#desktop').hidden=false;$('#desktop').inert=false;restorePage();
}
function settle(inside){
 serial++;stop();state=inside?'inside':'closed';
 $('#entrance').hidden=inside;$('#entrance').dataset.phase=state;
 inside?release():mount();document.dispatchEvent(new Event('studio:desktopready'));$('#enter').disabled=false;
 (inside?$('#search-button'):$('#enter')).focus({preventScroll:true});
}
function layout(){
 const entrance=$('#entrance'),hidden=entrance.hidden;entrance.hidden=false;
 geometry();
 const camera=$('.solid-camera');camera.style.transform='none';
 const bounds=$('.solid-rig').getBoundingClientRect(),copy=$('.entrance-copy'),height=copy.getBoundingClientRect().height;
 const top=Math.max(24,(innerHeight-height-20-bounds.height)/2);
 rest=`translateY(${top+height+20-bounds.top}px)`;
 camera.style.setProperty('--solid-rest',rest);camera.style.removeProperty('transform');
 entrance.style.setProperty('--copy-top',top+'px');
 Object.assign($('#enter').style,{top:top+height+20+'px',height:bounds.height+'px',width:bounds.width+'px'});
 entrance.hidden=hidden;
}
function zoom(){
 const r=$('.solid-glass').getBoundingClientRect(),x=innerWidth/r.width,y=innerHeight/r.height;
 return `translate(${-r.x*x}px,${-r.y*y}px) scale(${x},${y})`;
}
export async function enterSolidDesktop(){
 if(state!=='closed')return;
 state='opening';const token=++serial;$('#enter').disabled=true;$('#entrance').dataset.phase='opening';
 if(reduced()){settle(true);return;}
 tween($('.entrance-copy'),[{opacity:1},{opacity:1,offset:.2},{opacity:0}],1150);
 tween($('.solid-camera'),[{transform:rest},{transform:'none'}],1150);
 tween($('.solid-shadow'),[{opacity:.2,transform:'scaleX(1)'},{opacity:0,transform:'scaleX(.75)'}],1150);
 await tween($('.solid-rig'),[{transform:pose},{transform:'rotateX(0deg)'}],1150);
 if(token!==serial)return;
 $('#entrance').dataset.phase='open';
 await tween($('.solid-rig'),[{transform:'rotateX(0deg)'},{transform:'rotateX(0deg)'}],180);
 if(token!==serial)return;
 $('#entrance').dataset.phase='zooming';
 tween($('.solid-island'),[{opacity:1},{opacity:0}],760);
 await tween($('.solid-camera'),[{transform:'none'},{transform:zoom()}],760);
 if(token===serial)settle(true);
}
async function exit(){
 close();if(state!=='inside'){settle(false);return;}
 state='closing';const token=++serial;$('#entrance').hidden=false;$('#entrance').dataset.phase='closing';mount();
 if(reduced()){settle(false);return;}
 tween($('.solid-rig'),[{transform:'rotateX(0deg)'},{transform:'rotateX(0deg)'}],0);
 tween($('.solid-camera'),[{transform:'none'},{transform:'none'}],0);
 tween($('.entrance-copy'),[{opacity:0},{opacity:0}],0);
 tween($('.solid-island'),[{opacity:0},{opacity:1}],760);
 tween($('.solid-shadow'),[{opacity:0},{opacity:0}],0);
 await tween($('.solid-camera'),[{transform:zoom()},{transform:'none'}],760);
 if(token!==serial)return;
 tween($('.entrance-copy'),[{opacity:0},{opacity:0,offset:.55},{opacity:1}],1150);
 tween($('.solid-shadow'),[{opacity:0},{opacity:.2}],1150);
 tween($('.solid-camera'),[{transform:'none'},{transform:rest}],1150);
 await tween($('.solid-rig'),[{transform:'rotateX(0deg)'},{transform:pose}],1150);
 if(token===serial)settle(false);
}
export function initSolidPhone(){
 $('#entrance').classList.add('solid-mode');$('#entrance').setAttribute('aria-label','입체 휴대폰 입구');
 $('#photo-flight').hidden=true;
 $('#enter').insertAdjacentHTML('beforebegin','<div class="solid-camera" aria-hidden="true"><div class="solid-world"><div class="solid-rig"><div class="solid-back"></div><div class="solid-sides"></div><div class="solid-front"><div class="solid-glass"><div class="solid-content"></div><span class="solid-island"></span></div></div></div><div class="solid-shadow"></div></div></div>');
 home=document.createElement('span');home.hidden=true;$('#desktop').before(home);
 $('#enter').setAttribute('aria-label','휴대폰 들고 작업실 들어가기');
 $('#return').setAttribute('aria-label','휴대폰 내려놓기');$('#return').title='휴대폰 내려놓기';

 $('#enter').onclick=enterSolidDesktop;$('#return').onclick=exit;
 mount();layout();$('#entrance').dataset.ready='true';
 addEventListener('resize',()=>{settle(state==='inside');layout();});
 addEventListener('keydown',event=>{if(event.key==='Escape'&&state!=='inside'){event.preventDefault();settle(false);}});
 addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='solid-speed')slow=event.data.slow===true;});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&animations.length)settle(state==='inside');});
}
