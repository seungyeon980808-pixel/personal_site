export function initNotch(){
 const physical=document.querySelector('.screen-notch'),entrance=document.querySelector('#entrance');
 const desktop=document.createElement('div');desktop.className='desktop-notch';desktop.setAttribute('aria-label','노치 안의 작은 친구들');document.body.append(desktop);
 const gone=new Set();
 for(const container of [physical,desktop]){
  container.classList.add('playful-notch');
  ['Claude','GPT','Aside'].forEach((name,index)=>{
   const button=document.createElement('button');button.className='notch-friend';button.dataset.friend=name;button.setAttribute('aria-label',name+' 놀래키기');button.style.setProperty('--beat',index*-.43+'s');
   const img=document.createElement('img');img.src='/assets/ai/'+['claude.svg','gpt.svg','aside.png'][index];img.alt='';button.append(img);container.append(button);
   button.onclick=event=>{event.preventDefault();event.stopPropagation();if(gone.has(name))return;gone.add(name);document.querySelectorAll('[data-friend="'+name+'"]').forEach(item=>{item.classList.add('startled');item.disabled=true;setTimeout(()=>{item.hidden=true;},420);});};
  });
 }
 function sync(){desktop.hidden=!entrance.hidden;desktop.classList.toggle('phone-notch',matchMedia('(max-width:700px)').matches);}
 new MutationObserver(sync).observe(entrance,{attributes:true,attributeFilter:['hidden']});window.addEventListener('resize',sync);sync();
}
