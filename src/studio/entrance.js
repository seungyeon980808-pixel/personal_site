import {$} from './utils.js';
import {phonePhotoTarget,phoneFrames,phoneCameraFrames} from './phone-motion.js';
import {close} from './window.js';
import {mountDesktop,releaseDesktop,resizeScreen} from './screen.js';

const motion={hinge:1100,hold:320,flight:800,copy:240,ease:'cubic-bezier(.4,0,.2,1)',zoom:'cubic-bezier(.65,.02,.3,1)'};
const phone=()=>matchMedia('(max-width:700px)').matches;
const lidClosed=()=>phone()?'rotateX(48deg)':'rotateX(-94deg)',lidOpen='rotateX(0deg)';
let sequence=0,animations=[],intent='closed',restCamera='none',uprightPhoto='',phonePath=null,cameraPath=null,imagesReady=Promise.resolve();
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function layoutEntrance(){
 uprightPhoto='';phonePath=null;cameraPath=null;
 const entrance=$('#entrance'),camera=$('#photo-flight'),copy=$('.entrance-copy');
 const hidden=entrance.hidden;entrance.hidden=false;camera.style.transform='none';
 const isPhone=phone();
 $('#enter').setAttribute('aria-label',isPhone?'휴대폰 들고 작업실 들어가기':'노트북 열고 작업실 들어가기');
 entrance.setAttribute('aria-label',isPhone?'휴대폰 입구':'노트북 입구');
 const exitLabel=isPhone?'휴대폰 내려놓기':'노트북 닫기';
 $('#return').setAttribute('title',exitLabel);$('#return').setAttribute('aria-label',exitLabel);
 const bounds=$(isPhone?'.phone-rest-photo':'.notebook-rest-photo').getBoundingClientRect(),copyHeight=copy.getBoundingClientRect().height,gap=isPhone?16:48;
 const top=(innerHeight-copyHeight-gap-bounds.height)/2,restTop=top+copyHeight+gap;
 restCamera=`translateY(${restTop-bounds.top}px)`;
 entrance.style.setProperty('--copy-top',`${top}px`);entrance.style.setProperty('--rest-top',`${restTop}px`);entrance.style.setProperty('--rest-height',`${bounds.height}px`);entrance.style.setProperty('--rest-width',`${bounds.width}px`);
 camera.style.setProperty('--rest-camera',restCamera);camera.style.removeProperty('transform');resizeScreen();entrance.hidden=hidden;
}
function remember(inside){try{inside?sessionStorage.setItem('studio-entered','1'):sessionStorage.removeItem('studio-entered');}catch{return false;}}
function animate(element,keyframes,duration,easing=motion.ease){
 const animation=element.animate(keyframes,{duration,easing,fill:'forwards'});animations.push(animation);return animation.finished.catch(()=>{});
}
function phoneShell(standing,duration){
 const shell=$('.phone-upright-shell'),parts=[$('.phone-rest-photo>img'),$('.phone-rest-glass')];
 const frames=standing?[{opacity:0},{opacity:0,offset:.25},{opacity:1,offset:.85},{opacity:1}]:[{opacity:1},{opacity:1,offset:.15},{opacity:0,offset:.75},{opacity:0}];
 animate(shell,frames,duration);
 animate($('.phone-photo-base'),standing?[{opacity:1},{opacity:0,offset:.45},{opacity:0}]:[{opacity:0},{opacity:0,offset:.55},{opacity:1}],duration);
 for(const part of parts)animate(part,frames.map(frame=>({...frame,opacity:1-frame.opacity})),duration);
}
function cancelAnimations(){for(const animation of animations)animation.cancel();animations=[];}
function settle(inside){
 sequence++;cancelAnimations();intent=inside?'inside':'closed';
 $('#entrance').hidden=inside;$('#entrance').dataset.phase=inside?'inside':'closed';
 inside?releaseDesktop():mountDesktop();document.dispatchEvent(new Event('studio:desktopready'));$('#enter').disabled=false;
 document.body.classList.remove('travelling');remember(inside);
 (inside?$('#search-button'):$('#enter')).focus({preventScroll:true});
}
function flightTransform(){
 const screen=$('.screen-viewport').getBoundingClientRect(),x=innerWidth/screen.width,y=innerHeight/screen.height;
 return `translate(${-screen.x*x}px,${-screen.y*y}px) scale(${x},${y})`;
}
async function mobileTransition(inside,token){
 const entrance=$('#entrance'),reverse=frames=>frames.slice().reverse().map(frame=>({...frame,offset:1-frame.offset}));
 if(!phonePath){uprightPhoto=phonePhotoTarget();phonePath=phoneFrames(uprightPhoto);}
 cameraPath ||= phoneCameraFrames(restCamera);
 const cameraDone=animate($('#photo-flight'),inside?cameraPath:reverse(cameraPath),1800,'linear');
 if(!inside){
  animate($('.entrance-copy'),[{opacity:0},{opacity:0}],0);
  animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidOpen}],0);
  animate($('.phone-rest-photo'),[phonePath.photoFrames.at(-1),phonePath.photoFrames.at(-1)].map(({transform})=>({transform})),0);
  animate($('.phone-upright-shell'),[{transform:'none',opacity:1},{transform:'none',opacity:1}],0);
  for(const part of [$('.phone-rest-photo>img'),$('.phone-rest-glass'),$('.phone-photo-base')])animate(part,[{opacity:0},{opacity:0}],0);
  animate($('.phone-photo-base'),[{transform:'scaleY(.24)'},{transform:'scaleY(.24)'}],0);
  animate($('.screen-notch'),[{opacity:0},{opacity:1}],700);
  await animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidOpen}],700);
  if(token!==sequence)return;
 }
 phoneShell(inside,1100);
 animate($('.phone-upright-shell'),inside?phonePath.shellFrames:reverse(phonePath.shellFrames),1100);
 animate($('.phone-rest-photo'),inside?phonePath.photoFrames:reverse(phonePath.photoFrames),1100);
 animate($('.phone-photo-base'),inside?[{transform:'scaleY(1)'},{transform:'scaleY(.24)'}]:[{transform:'scaleY(.24)'},{transform:'scaleY(1)'}],1100);
 animate($('.entrance-copy'),inside?[{opacity:1},{opacity:1,offset:.25},{opacity:0}]:[{opacity:0},{opacity:0,offset:.65},{opacity:1}],1100);
 await animate($('#notebook-lid'),inside?[{transform:lidClosed()},{transform:lidOpen}]:[{transform:lidOpen},{transform:lidClosed()}],1100);
 if(token!==sequence)return;
 if(inside){
  entrance.dataset.phase='open';
  animate($('.screen-notch'),[{opacity:1},{opacity:0}],500);
  await animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidOpen}],160);
  if(token!==sequence)return;
  entrance.dataset.phase='zooming';
 }
 await cameraDone;
 if(token===sequence)settle(inside);
}
export async function enterDesktop(){
 if(intent!=='closed'||$('#entrance').dataset.phase!=='closed')return;
 const lidStart=getComputedStyle($('#notebook-lid')).transform,coverStyle=getComputedStyle($('.device-cover')),coverStart=coverStyle.transform,coverOpacity=coverStyle.opacity;
 intent='inside';const token=++sequence;if(reduced()){settle(true);return;}
 const entrance=$('#entrance');entrance.dataset.phase='opening';$('#enter').disabled=true;document.body.classList.add('travelling');
 await imagesReady;if(token!==sequence)return;
 if(phone())return mobileTransition(true,token);
 if(phone()){
  const target=phonePhotoTarget();uprightPhoto=target;phonePath=phoneFrames(target);phoneShell(true,motion.hinge);
  animate($('.phone-upright-shell'),phonePath.shellFrames,motion.hinge);
  animate($('.phone-photo-base'),[{transform:'scaleY(1)'},{transform:'scaleY(.24)'}],motion.hinge);
  animate($('.phone-rest-photo'),phonePath.photoFrames,motion.hinge);

 }
 animate($('.entrance-copy'),phone()?[{opacity:1,offset:0},{opacity:1,offset:.35},{opacity:0,offset:1}]:[{opacity:1},{opacity:0}],phone()?motion.hinge:motion.copy);
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
 if(phone())return mobileTransition(false,token);
 animate($('.entrance-copy'),[{opacity:0},{opacity:0}],0);animate($('.device-cover'),[{opacity:0},{opacity:0}],0);animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidOpen}],0);animate($('#photo-flight'),[{transform:'none'},{transform:'none'}],0);
 const photoTarget=phone()?(uprightPhoto||phonePhotoTarget()):'';
 if(phone()){
  phonePath ||= phoneFrames(photoTarget);
  animate($('.phone-upright-shell'),[{opacity:1},{opacity:1}],0);
  for(const part of [$('.phone-rest-photo>img'),$('.phone-rest-glass'),$('.phone-photo-base')])animate(part,[{opacity:0},{opacity:0}],0);
  animate($('.phone-rest-photo'),[{transform:photoTarget},{transform:photoTarget}],0);
  animate($('.phone-photo-base'),[{transform:'scaleY(.24)'},{transform:'scaleY(.24)'}],0);
 }
 animate($('.screen-notch'),[{opacity:0},{opacity:1}],motion.flight);
 await animate($('#photo-flight'),[{transform:flightTransform()},{transform:'none'}],motion.flight);
 if(token!==sequence)return;
 if(phone()){
  phoneShell(false,motion.hinge);
  const reverse=frames=>frames.slice().reverse().map(frame=>({...frame,offset:1-frame.offset}));
  animate($('.phone-upright-shell'),reverse(phonePath.shellFrames),motion.hinge);
  animate($('.phone-photo-base'),[{transform:'scaleY(.24)'},{transform:'scaleY(1)'}],motion.hinge);
  animate($('.phone-rest-photo'),reverse(phonePath.photoFrames),motion.hinge);

 }
 await Promise.all([
  animate($('#notebook-lid'),[{transform:lidOpen},{transform:lidClosed()}],motion.hinge),
  animate($('#photo-flight'),[{transform:'none'},{transform:restCamera}],motion.hinge),
  animate($('.device-cover'),[{transform:'translateY(6.35%) scaleY(0)',opacity:0,offset:0},{transform:'translateY(6.35%) scaleY(0)',opacity:0,offset:.82},{transform:'translateY(6.35%) scaleY(.5024)',opacity:1,offset:1}],motion.hinge),
  animate($('.entrance-copy'),[{opacity:0,offset:0},{opacity:0,offset:.7},{opacity:1,offset:1}],motion.hinge)
 ]);
 if(token===sequence)settle(false);
}
export function initEntrance(){
 layoutEntrance();
 imagesReady=Promise.all([...document.querySelectorAll('.device-frame img')].map(img=>img.decode().catch(()=>{}))).then(()=>{layoutEntrance();$('#entrance').dataset.ready='true';});
 $('#enter').onclick=enterDesktop;$('#return').onclick=exitDesktop;
 let entered=false;try{entered=sessionStorage.getItem('studio-entered')==='1';}catch{entered=false;}
 if(entered){intent='inside';$('#entrance').hidden=true;releaseDesktop();}else mountDesktop();
 window.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#entrance').hidden&&intent==='inside'){event.preventDefault();settle(false);}});
 window.addEventListener('resize',()=>{if(animations.length)settle(intent==='inside');layoutEntrance();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&animations.length)settle(intent==='inside');});
}
