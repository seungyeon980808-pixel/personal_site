import {$} from './utils.js';

export function initPages(){
 const pages=$('.desktop-layout'),navigation=document.createElement('nav');
 navigation.className='mobile-pages';navigation.setAttribute('aria-label','홈 화면 선택');
 navigation.innerHTML='<button aria-label="캘린더와 메모 화면" aria-current="true"></button><button aria-label="자료와 바로가기 화면" aria-current="false"></button>';
 pages.after(navigation);
 const buttons=[...navigation.children];
 buttons.forEach((button,index)=>button.onclick=()=>pages.scrollTo({left:index*pages.clientWidth,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
 pages.addEventListener('scroll',()=>{
  if(!pages.clientWidth||$('#desktop').inert)return;
  const current=Math.round(pages.scrollLeft/pages.clientWidth);pages.dataset.page=String(current);
  buttons.forEach((button,index)=>button.setAttribute('aria-current',String(index===current)));
 },{passive:true});
}

export function restorePage(){
 const pages=$('.desktop-layout');
 if(matchMedia('(max-width:700px)').matches)pages.scrollTo({left:Number(pages.dataset.page||0)*pages.clientWidth,behavior:'instant'});
}
