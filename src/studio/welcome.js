const key='studio-welcome-v1';
export function initWelcome(){
 const desktop=document.querySelector('#desktop'),entrance=document.querySelector('#entrance');
 const overlay=document.createElement('section');overlay.id='welcome';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','처음 방문 안내');document.body.append(overlay);
 let languageTimer,stepTimer,index=0,sessionDone=false,focusBefore;
 const words=[['hello','en'],['안녕하세요','ko'],['こんにちは','ja'],['你好','zh'],['bonjour','fr'],['hola','es']];
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 const clear=()=>{clearInterval(languageTimer);clearTimeout(stepTimer);document.querySelectorAll('.tour-target').forEach(e=>e.classList.remove('tour-target'));};
 const finish=()=>{clear();overlay.hidden=true;desktop.inert=false;sessionDone=true;try{localStorage.setItem(key,'done');}catch{}(focusBefore?.isConnected?focusBefore:document.querySelector('#search-button')).focus({preventScroll:true});};
 function guide(step){
  clear();overlay.className='tour';
  const mobile=matchMedia('(max-width:700px)').matches;
  if(step===1&&mobile)document.querySelector('.desktop-layout').scrollTo({left:document.querySelector('.desktop-layout').clientWidth,behavior:'instant'});
  const target=document.querySelector(step===0?'#dock':'#icons');target.classList.add('tour-target');
  overlay.innerHTML=`<div class="tour-card"><p class="tour-count">${step+1} / 2</p><h2>${step===0?'직접 만든 도구를 만나보세요':'필요한 자료를 가져가세요'}</h2><p>${step===0?(mobile?'하단의 만든 프로그램 폴더에서 도구를 둘러보세요.':'하단에서 만든 프로그램을 열고, 게으른 교사의 GitHub를 방문할 수 있어요.'):'오른쪽 폴더에서 연수 자료와 공유 자료, 추천 도구를 둘러볼 수 있어요.'}</p><div><button data-end>넘어가기</button><button class="primary" data-next>${step===0?'다음':'시작하기'}</button></div></div>`;
  overlay.querySelector('[data-end]').onclick=finish;overlay.querySelector('[data-next]').onclick=()=>step===0?guide(1):finish();
  const card=overlay.querySelector('.tour-card'),r=target.getBoundingClientRect();
  card.style.left=Math.max(16,Math.min(innerWidth-card.offsetWidth-16,step===0?r.left+r.width/2-card.offsetWidth/2:r.left-card.offsetWidth-24))+'px';
  card.style.top=Math.max(16,Math.min(innerHeight-card.offsetHeight-16,step===0?r.top-card.offsetHeight-24:r.top))+'px';
  overlay.querySelector('[data-next]').focus();
  if(!reduced())stepTimer=setTimeout(()=>step===0?guide(1):finish(),8000);
  card.onpointerenter=()=>clearTimeout(stepTimer);card.onfocusin=()=>clearTimeout(stepTimer);
 }
 function show(){
  if(!overlay.hidden||!entrance.hidden)return;
  focusBefore=document.activeElement;desktop.inert=true;overlay.hidden=false;overlay.className='welcome-intro';index=0;
  overlay.innerHTML='<div class="welcome-copy"><div class="welcome-greeting" aria-hidden="true" lang="en">hello</div><h1>게으른 교사의 노트북에 오신 것을 환영합니다.</h1><div class="welcome-actions"><button class="welcome-start">둘러보기</button><button class="welcome-skip">넘어가기</button></div></div>';
  overlay.querySelector('.welcome-start').onclick=()=>guide(0);overlay.querySelector('.welcome-skip').onclick=finish;overlay.querySelector('.welcome-start').focus();
  if(!reduced())languageTimer=setInterval(()=>{const el=overlay.querySelector('.welcome-greeting');if(!el)return;index=(index+1)%words.length;el.textContent=words[index][0];el.lang=words[index][1];el.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'},{opacity:1,offset:.8},{opacity:0}],{duration:2700});},2800);
 }
 function firstVisit(){let done=sessionDone;try{if(new URLSearchParams(location.search).get('welcome')!=='1')done ||= localStorage.getItem(key)==='done';}catch{}if(!done&&!desktop.hidden&&!desktop.inert&&entrance.hidden)show();}
 document.addEventListener('studio:desktopready',firstVisit);new MutationObserver(firstVisit).observe(entrance,{attributes:true,attributeFilter:['hidden']});
 document.querySelector('#welcome-again').onclick=()=>{document.querySelector('#welcome-again').closest('details').open=false;show();};
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish();}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}});
 window.addEventListener('resize',()=>{if(!overlay.hidden&&overlay.className==='tour')guide(overlay.querySelector('.tour-count').textContent.startsWith('1')?0:1);});
 firstVisit();
}
