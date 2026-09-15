export function initNotch(){
 const physical=document.querySelector('.screen-notch'),entrance=document.querySelector('#entrance');
 const desktop=document.createElement('div');desktop.className='desktop-notch';desktop.setAttribute('aria-label','노치 안의 작은 친구들');document.body.append(desktop);
 const gone=new Set(),particles=[],pace=new URLSearchParams(location.search).get('notchMotion')==='calm'?.5:1;
 const names=['Claude','GPT','Aside','ExamPool','HwpPalette','5E'],assets=['/assets/ai/claude.svg','/assets/ai/gpt.svg','/assets/ai/aside.png','/assets/logo-exampool.svg','/assets/logo-hwp.svg','/assets/logo-5e.svg'];
 for(const container of [physical,desktop]){
  container.classList.add('playful-notch');
  names.forEach((name,index)=>{
   const button=document.createElement('button');button.className='notch-friend';button.dataset.friend=name;button.setAttribute('aria-label',name+' 놀래키기');button.style.setProperty('--beat',index*-.43+'s');
   const img=document.createElement('img');img.src=assets[index];img.alt='';button.append(img);container.append(button);particles.push({button,container,x:8+index*16,y:5+(index%3)*7,vx:(index%2?1:-1)*(12+index*3),vy:8+index*2});
   button.onclick=event=>{event.preventDefault();event.stopPropagation();if(gone.has(name))return;gone.add(name);document.querySelectorAll('[data-friend="'+name+'"]').forEach(item=>{item.classList.add('startled');item.disabled=true;setTimeout(()=>{item.hidden=true;},420);});};
  });
 }
 function sync(){desktop.hidden=!entrance.hidden;desktop.classList.toggle('phone-notch',matchMedia('(max-width:700px)').matches);}
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),welcome=document.querySelector('#welcome');
 let last=0,raf=0;
 function tick(now){raf=0;if(document.hidden||desktop.hidden||!welcome.hidden)return;
  const dt=Math.min(.04,(now-last)/1000);last=now;
  const w=desktop.clientWidth-18,h=desktop.clientHeight-16;
  for(const p of particles){if(p.container!==desktop||p.button.hidden||p.button.disabled)continue;
   if(!reduced.matches){p.x+=p.vx*dt*pace;p.y+=p.vy*dt*pace;}
   if(p.x<0||p.x>w){p.x=Math.max(0,Math.min(w,p.x));p.vx*=-1;}
   if(p.y<0||p.y>h){p.y=Math.max(0,Math.min(h,p.y));p.vy*=-1;}
   p.button.style.left='0px';p.button.style.top='0px';p.button.style.translate=p.x+'px '+p.y+'px';
  }
  if(!reduced.matches)raf=requestAnimationFrame(tick);
 }
 function wake(){desktop.classList.toggle('notch-quiet',!welcome.hidden);if(raf)cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(tick);}
 new MutationObserver(wake).observe(desktop,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(wake).observe(welcome,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',wake);window.addEventListener('resize',wake);reduced.addEventListener('change',wake);wake();
 new MutationObserver(sync).observe(entrance,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',sync);sync();
}
