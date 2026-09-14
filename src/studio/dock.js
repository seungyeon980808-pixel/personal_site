export function initDockNames(){
 const dock=document.querySelector('#dock'),tip=document.createElement('div');
 tip.className='dock-tooltip';tip.id='dock-tooltip';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 let current;
 const hide=()=>{tip.hidden=true;if(current)current.removeAttribute('aria-describedby');current=null;};
 const show=target=>{
  if(matchMedia('(max-width:700px)').matches)return hide();
  const item=target.closest('#dock button,#dock a');if(!item)return hide();
  const label=item.querySelector(':scope > span:last-child');if(!label)return hide();
  hide();current=item;tip.textContent=label.textContent;tip.hidden=false;item.setAttribute('aria-describedby',tip.id);
  const box=item.getBoundingClientRect(),half=tip.offsetWidth/2;
  tip.style.left=Math.max(half+8,Math.min(innerWidth-half-8,box.left+box.width/2))+'px';tip.style.top=(box.top-tip.offsetHeight-16)+'px';
 };
 dock.addEventListener('pointerover',event=>show(event.target));
 dock.addEventListener('pointerleave',hide);dock.addEventListener('focusin',event=>show(event.target));
 dock.addEventListener('focusout',hide);dock.addEventListener('click',hide);dock.addEventListener('scroll',hide);
 document.addEventListener('studio:change',hide);window.addEventListener('resize',hide);
}
