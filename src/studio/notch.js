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
 let last=performance.now();function tick(now){const dt=Math.min(.04,(now-last)/1000);last=now;const welcome=document.querySelector('#welcome');const quiet=!welcome.hidden;desktop.classList.toggle('notch-quiet',quiet);for(const p of particles){if(p.container!==desktop||desktop.hidden||quiet||p.button.hidden||p.button.disabled)continue;if(!matchMedia('(prefers-reduced-motion:reduce)').matches){p.x+=p.vx*dt*pace;p.y+=p.vy*dt*pace;}const w=p.container.clientWidth-18,h=p.container.clientHeight-16;if(p.x<0||p.x>w){p.x=Math.max(0,Math.min(w,p.x));p.vx*=-1;}if(p.y<0||p.y>h){p.y=Math.max(0,Math.min(h,p.y));p.vy*=-1;}p.button.style.left=p.x+'px';p.button.style.top=p.y+'px';}requestAnimationFrame(tick);}requestAnimationFrame(tick);
 new MutationObserver(sync).observe(entrance,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',sync);sync();
}
