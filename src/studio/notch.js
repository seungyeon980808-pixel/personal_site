export function initNotch(){
 const physical=document.querySelector('.screen-notch'),entrance=document.querySelector('#entrance');
 const desktop=document.createElement('div');desktop.className='desktop-notch';desktop.setAttribute('aria-label','노치 안의 작은 친구들');document.body.append(desktop);
 const gone=new Set(),particles=[],pace=new URLSearchParams(location.search).get('notchMotion')==='calm'?.5:1;
 const names=['Claude','GPT','Aside','ExamPool','HwpPalette','5E'],assets=['/assets/ai/claude.svg','/assets/ai/gpt.svg','/assets/ai/aside.png','/assets/logo-exampool.svg','/assets/logo-hwp.svg','/assets/logo-5e.svg'];
 for(const container of [physical,desktop]){
  container.classList.add('playful-notch');
  names.forEach((name,index)=>{
   const button=document.createElement('button');button.className='notch-friend';button.dataset.friend=name;button.setAttribute('aria-label',name+' 놀래키기');button.style.setProperty('--beat',index*-.43+'s');button.style.left='0px';button.style.top='0px';
   const img=document.createElement('img');img.src=assets[index];img.alt='';button.append(img);container.append(button);particles.push({button,container,x:8+index*16,y:5+(index%3)*7,vx:(index%2?1:-1)*(12+index*3),vy:8+index*2});
   button.onclick=event=>{event.preventDefault();event.stopPropagation();if(gone.has(name))return;gone.add(name);document.querySelectorAll('[data-friend="'+name+'"]').forEach(item=>{item.classList.add('startled');item.disabled=true;setTimeout(()=>{item.hidden=true;},420);});};
  });
 }
 function sync(){desktop.hidden=!entrance.hidden;desktop.classList.toggle('phone-notch',matchMedia('(max-width:700px)').matches);}
 const welcome=document.querySelector('#welcome');
 let width=0,height=0;
 new ResizeObserver(entries=>{const box=entries[0].contentRect;width=box.width-18;height=box.height-16;wake();}).observe(desktop);
 // 노치 안 친구들의 튕기기는 CSS 애니메이션(가로·세로 왕복)으로 돌린다. 매 프레임 JS를 돌리지 않아 대기 중 메인 스레드가 쉰다.
 // 같은 속도로 벽에 튕기는 움직임 = 가로·세로 각각의 등속 왕복이므로 이전 모습과 같다.
 function place(){
  if(width<=0||height<=0)return;
  desktop.style.setProperty('--notch-w',width+'px');desktop.style.setProperty('--notch-h',height+'px');
  for(const p of particles){if(p.container!==desktop)continue;
   const x=Math.max(0,Math.min(width,p.x)),y=Math.max(0,Math.min(height,p.y));
   const dx=width/(Math.abs(p.vx)*pace),dy=height/(Math.abs(p.vy)*pace);
   const phase=(pos,size,dir,d)=>-(dir>0?pos/size*d:d+(size-pos)/size*d);
   p.button.style.translate='';
   p.button.style.setProperty('--dx',dx+'s');p.button.style.setProperty('--dy',dy+'s');
   p.button.style.setProperty('--x0',x+'px');p.button.style.setProperty('--y0',y+'px');p.button.style.setProperty('--delay-x',phase(x,width,p.vx,dx)+'s');p.button.style.setProperty('--delay-y',phase(y,height,p.vy,dy)+'s');
  }
 }
 function wake(){desktop.classList.toggle('notch-quiet',!welcome.hidden);place();}
 new MutationObserver(wake).observe(desktop,{attributes:true,attributeFilter:['hidden']});
 new MutationObserver(wake).observe(welcome,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('resize',wake);wake();
 new MutationObserver(sync).observe(entrance,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',sync);sync();
}
