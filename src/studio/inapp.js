// 인스타그램·스레드·카카오톡 등 앱 안 브라우저에서 열렸을 때: 외부 브라우저(Safari·Chrome)로 넘기는 띠.
// 앱이 밖으로 나가는 길을 자주 막으므로 ① 앱별로 알려진 방법을 시도하고 ② 안 넘어가면 직접 여는 방법과 링크 복사를 보여 준다.
// 앱 감지와 가벼운 모드(입구 연출 생략) 이동은 shell.html 맨 앞 스크립트가 먼저 한다.
export function detectInApp(ua=navigator.userAgent){
 return /Instagram/i.test(ua)?'instagram':/Barcelona/i.test(ua)?'threads':/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)?'facebook':/KAKAOTALK/i.test(ua)?'kakaotalk':/NAVER\(inapp|NAVER\//i.test(ua)?'naver':/ Line\//i.test(ua)?'line':/DaumApps/i.test(ua)?'daum':'';
}
const names={instagram:'인스타그램',threads:'스레드',facebook:'페이스북',kakaotalk:'카카오톡',naver:'네이버',line:'라인',daum:'다음'};
const manual={instagram:'오른쪽 위 ··· 를 누르고 「외부 브라우저에서 열기」',threads:'오른쪽 위 ··· 를 누르고 「브라우저에서 열기」',facebook:'오른쪽 위 ··· 를 누르고 「외부 브라우저에서 열기」',kakaotalk:'오른쪽 아래 ··· 를 누르고 「다른 브라우저로 열기」',naver:'오른쪽 아래 ··· 를 누르고 「기본 브라우저로 열기」',line:'오른쪽 위 ··· 를 누르고 「다른 앱으로 열기」',daum:'··· 를 누르고 「다른 브라우저로 열기」'};
export function escapeUrl(app,target,ios){
 const encoded=encodeURIComponent(target),bare=target.replace(/^https?:\/\//,'');
 const android=`intent://${bare}#Intent;scheme=https;package=com.android.chrome;end`;
 if(app==='kakaotalk')return `kakaotalk://web/openExternal?url=${encoded}`;
 if(app==='line')return target+(target.includes('?')?'&':'?')+'openExternalBrowser=1';
 if(app==='instagram'&&ios)return `instagram://extbrowser/?url=${encoded}`;
 if(app==='threads'&&ios)return `barcelona://extbrowser/?url=${encoded}`;
 return ios?`x-safari-${target}`:android;
}
export function initInApp(){
 const params=new URLSearchParams(location.search),app=params.get('inapp')||detectInApp();
 if(!app)return;
 try{if(sessionStorage.getItem('studio-inapp-closed')==='1')return;}catch{}
 const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const browser=ios?'Safari':'Chrome',target=location.origin+'/';
 const bar=document.createElement('aside');bar.className='inapp-bar';bar.setAttribute('aria-label','외부 브라우저로 열기');
 bar.innerHTML=`<div class="inapp-row"><p><b>${names[app]||'앱'} 안에서 보고 있어요</b><span>${browser}에서 보면 더 부드러워요</span></p><button class="inapp-open" type="button">${browser}에서 열기</button><button class="inapp-close" type="button" aria-label="닫기">×</button></div><div class="inapp-help" hidden><p>바로 넘어가지 않으면 <b>${manual[app]||'메뉴에서 「브라우저에서 열기」'}</b>를 눌러 주세요.</p><button class="inapp-copy" type="button">링크 복사</button><span class="inapp-copied" role="status"></span></div>`;
 document.body.append(bar);document.body.classList.add('inapp-mode');
 const help=bar.querySelector('.inapp-help');
 bar.querySelector('.inapp-open').onclick=()=>{
  const started=Date.now();location.href=escapeUrl(app,target,ios);
  // 앱이 막으면 페이지가 그대로 남는다 → 직접 여는 방법을 펼친다
  setTimeout(()=>{if(!document.hidden&&Date.now()-started<4000)help.hidden=false;},1500);
 };
 bar.querySelector('.inapp-copy').onclick=async()=>{
  const status=bar.querySelector('.inapp-copied');
  try{await navigator.clipboard.writeText(target);}catch{const field=document.createElement('textarea');field.value=target;document.body.append(field);field.select();try{document.execCommand('copy');}catch{}field.remove();}
  status.textContent=`복사했어요 — ${browser} 주소창에 붙여 넣으세요`;
 };
 bar.querySelector('.inapp-close').onclick=()=>{bar.remove();document.body.classList.remove('inapp-mode');try{sessionStorage.setItem('studio-inapp-closed','1');}catch{}};
}
