export function initPreviewNotch(container,dialog){
 const names=['Claude','GPT','Aside','ExamPool','HwpPalette','5E'];
 const assets=['ai/claude.svg','ai/gpt.svg','ai/aside.png','logo-exampool.svg','logo-hwp.svg','logo-5e.svg'];
 const particles=names.map((name,index)=>{
  const button=document.createElement('button');button.className='preview-friend';button.setAttribute('aria-label',`${name} 놀래키기`);button.dataset.friend=name;
  const img=document.createElement('img');img.src=`../assets/${assets[index]}`;img.alt='';button.append(img);container.append(button);
  button.addEventListener('click',()=>{button.disabled=true;button.classList.add('startled');setTimeout(()=>{button.hidden=true;},420);});
  return {button,x:3+index*16,y:3+(index%3)*5,vx:(index%2?1:-1)*(12+index*3),vy:8+index*2};
 });
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');let raf=0,last=0;
 function tick(now){raf=0;if(document.hidden||dialog.open)return;const dt=Math.min(.04,(now-last)/1000);last=now;
  for(const p of particles){if(p.button.disabled)continue;if(!reduced.matches){p.x+=p.vx*dt;p.y+=p.vy*dt;}if(p.x<2||p.x>92){p.x=Math.max(2,Math.min(92,p.x));p.vx*=-1;}if(p.y<2||p.y>12){p.y=Math.max(2,Math.min(12,p.y));p.vy*=-1;}p.button.style.translate=`${p.x}px ${p.y}px`;}
  if(!reduced.matches&&particles.some(p=>!p.button.disabled))raf=requestAnimationFrame(tick);
 }
 function wake(){cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(tick);}
 new MutationObserver(wake).observe(dialog,{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);wake();
}
