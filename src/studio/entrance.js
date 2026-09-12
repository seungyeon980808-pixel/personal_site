import {$} from './utils.js';
import {close} from './window.js';
import {mountDesktop,releaseDesktop,resizeScreen} from './screen.js';

const motion={hinge:1100,hold:320,flight:800,copy:240,ease:'cubic-bezier(.4,0,.2,1)',zoom:'cubic-bezier(.65,.02,.3,1)'};
const lidClosed='rotateX(-94deg)',lidOpen='rotateX(0deg)';
let sequence=0,animations=[],intent='closed',restCamera='none',imagesReady=Promise.resolve();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function layoutEntrance(){
 const entrance=$('#entrance'),camera=$('#photo-flight'),copy=$('.entrance-copy');
 const hidden=entrance.hidden;entrance.hidden=false;camera.style.transform='none';
 const bounds=$('.notebook-rest-photo').getBoundingClientRect(),copyHeight=copy.getBoundingClientRect().height,gap=innerWidth<=700?36:48;
 const top=(innerHeight-copyHeight-gap-bounds.height)/2,restTop=top+copyHeight+gap;
 restCamera=`translateY(${restTop-bounds.top}px)`;
 entrance.style.setProperty('--copy-top',`${top}px`);entrance.style.setProperty('--rest-top',`${restTop}px`);entrance.style.setProperty('--rest-height',`${bounds.height}px`);
 camera.style.setProperty('--rest-camera',restCamera);camera.style.removeProperty('transform');resizeScreen();entrance.hidden=hidden;
}
function remember(inside){try{inside?sessionStorage.setItem('studio-entered','1'):sessionStorage.removeItem('studio-entered');}catch{return false;}}
function animate(element,keyframes,duration,easing=motion.ease){
 const animation=element.animate(keyframes,{duration,easing,fill:'forwards'});animations.push(animation);return animation.finished.catch(()=>{});
}
function cancelAnimations(){for(const animation of animations)animation.cancel();animations=[];}
function settle(inside){
 sequence++;cancelAnimations();intent=inside?'inside':'closed';
 $('#entrance').hidden=inside;$('#entrance').dataset.phase=inside?'inside':'closed';
 inside?releaseDesktop():mountDesktop();$('#enter').disabled=false;
 document.body.classList.remove('travelling');remember(inside);
 (inside?$('#search-button'):$('#enter')).focus({preventScroll:true});
}
function flightTransform(){
 const screen=$('.screen-viewport').getBoundingClientRect(),x=innerWidth/screen.width,y=innerHeight/screen.height;
 return `translate(${-screen.x*x}px,${-screen.y*y}px) scale(${x},${y})`;
}
export async function enterDesktop(){
 if(intent!=='closed'||$('#entrance').dataset.phase!=='closed')return;
 const lidStart=getComputedStyle($('#notebook-lid')).transform,coverStyle=getComputedStyle($('.device-cover')),coverStart=coverStyle.transform,coverOpacity=coverStyle.opacity;
 intent='inside';const token=++sequence;if(reduced()){settle(true);return;}
 const entrance=$('#entrance');entrance.dataset.phase='opening';$('#enter').disabled=true;document.body.classList.add('travelling');
 await imagesReady;if(token!==sequence)return;
 animate($('.entrance-copy'),[{opacity:1},{opacity:0}],motion.copy);
 animate($('.device-cover'),[{transform:coverStart,opacity:coverOpacity,offset:0},{transform:'translateY(6.35%) scaleY(0)',opacity:0,offset:.18},{transform:'translateY(6.35%) scaleY(0)',opacity:0,offset:1}],motion.hinge);
 animate($('#photo-flight'),[{transform:restCamera},{transform:'none'}],motion.hinge);
 await animate($('#notebook-lid'),[{transform:lidStart},{transform:lidOpen}],motion.hinge);
 if(token!==sequence)return;entrance.dataset.phase='open';
 await animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidOpen}],motion.hold);
 if(token!==sequence)return;entrance.dataset.phase='zooming';
 animate($('.screen-notch'),[{opacity:1},{opacity:0}],motion.flight);
 await animate($('#photo-flight'),[{transform:'none'},{transform:flightTransform()}],motion.flight,motion.zoom);
 if(token===sequence)settle(true);
}
export async function exitDesktop(){
 if(intent==='closed')return;
 if(!$('#entrance').hidden){close();settle(false);return;}
 close();intent='closed';const token=++sequence;window.scrollTo(0,0);if(reduced()){settle(false);return;}
 const entrance=$('#entrance');entrance.hidden=false;entrance.dataset.phase='closing';$('#enter').disabled=true;$('#desktop').inert=true;document.body.classList.add('travelling');
 mountDesktop();
 animate($('.entrance-copy'),[{opacity:0},{opacity:0}],0);animate($('.device-cover'),[{opacity:0},{opacity:0}],0);animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidOpen}],0);animate($('#photo-flight'),[{transform:'none'},{transform:'none'}],0);
 animate($('.screen-notch'),[{opacity:0},{opacity:1}],motion.flight);
 await animate($('#photo-flight'),[{transform:flightTransform()},{transform:'none'}],motion.flight);
 if(token!==sequence)return;
 await Promise.all([
  animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidClosed}],motion.hinge),
  animate($('#photo-flight'),[{transform:'none'},{transform:restCamera}],motion.hinge),
  animate($('.device-cover'),[{transform:'translateY(6.35%) scaleY(0)',opacity:0,offset:0},{transform:'translateY(6.35%) scaleY(0)',opacity:0,offset:.82},{transform:'translateY(6.35%) scaleY(.5024)',opacity:1,offset:1}],motion.hinge),
  animate($('.entrance-copy'),[{opacity:0,offset:0},{opacity:0,offset:.7},{opacity:1,offset:1}],motion.hinge)
 ]);
 if(token===sequence)settle(false);
}
export function initEntrance(){
 layoutEntrance();
 imagesReady=Promise.all([...document.querySelectorAll('.device-frame img')].map(img=>img.decode().catch(()=>{}))).then(()=>{layoutEntrance();$('#entrance').dataset.ready='true';});
 $('#enter').onclick=enterDesktop;$('#return').onclick=exitDesktop;document.querySelector('[data-exit]').onclick=exitDesktop;
 let entered=false;try{entered=sessionStorage.getItem('studio-entered')==='1';}catch{entered=false;}
 if(entered){intent='inside';$('#entrance').hidden=true;releaseDesktop();}else mountDesktop();
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#entrance').hidden&&intent==='inside'){event.preventDefault();settle(false);}});
 window.addEventListener('resize',()=>{if(animations.length)settle(intent==='inside');layoutEntrance();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&animations.length)settle(intent==='inside');});
}
