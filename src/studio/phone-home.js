// 휴대폰 폭(700px 이하)에서만 보이는 아이폰식 홈 화면.
// 데스크톱과 같은 데이터(state.site·state.workspace)를 읽고, 누르면 같은 화면(route)을 연다 — 모양만 다르다.
// 1쪽: 캘린더 중간 위젯 · 메모 작은 위젯 · 앱 격자 · 채널 폴더 / 2쪽: 기록 위젯 · 채널 앱 · 바로가기
// 독 위 「검색」 알약, 「프로그램」·「채널」 폴더는 흐린 배경 위 유리 판으로 열린다. 꾹 누르면 아이콘이 흔들린다.
import {state,isAdmin} from './store.js';
import {$,escape as e,day} from './utils.js';
import {icon,svg} from './icons.js';
import {iosIcon} from './mobile-icons.js';

let lastPage=0; // 보던 쪽: 화면이 입구↔작업실로 옮겨 붙어도(스크롤 초기화) 그대로 돌려놓는다
const weekdays=['일요일','월요일','화요일','수요일','목요일','금요일','토요일'];
const route=r=>`data-route='${e(JSON.stringify(r))}'`;
const app=(label,picture,attrs)=>`<button class="ph-app" ${attrs} aria-label="${e(label)}">${picture}<span class="ph-lbl" aria-hidden="true">${e(label)}</span></button>`;
// 제목 없이 쓴 개발일지는 '2026-08-30 개발일지' 대신 본문 첫머리를 보여 준다
const recordTitle=r=>r.kind==='개발일지'&&(!r.title||r.title===`${r.date} 개발일지`)&&r.body?r.body.replace(/^(어제|오늘)\s*/,'').slice(0,40):r.title;
const monthDay=date=>{const [,m,d]=String(date).split('-').map(Number);return m&&d?`${m}월 ${d}일`:'';};

// 채널: 데스크톱 독과 같은 그림(GitHub·Threads·브런치) + 인스타·유튜브·드라이브는 여기서 그린다
const channelName={github:'GitHub',threads:'Threads',brunch:'브런치',instagram:'인스타그램',youtube:'유튜브',drive:'드라이브'};
const extra={
 instagram:`<span class="ph-ic" style="background:radial-gradient(circle at 30% 107%,#fdf497 0%,#fd5949 45%,#d6249f 60%,#285aeb 90%)"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="#fff" stroke="none"/></svg></span>`,
 youtube:`<span class="ph-ic ph-light" style="background:#fff"><svg viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="#ff0033"/><path d="M10 9.2v5.6l5-2.8Z" fill="#fff"/></svg></span>`,
 drive:`<span class="ph-ic ph-light" style="background:#fff"><svg viewBox="0 0 24 24"><path d="M8.6 3h6.8l6.1 10.6-3.4 5.9L11.8 9Z" fill="#ffba00"/><path d="M8.6 3 2.5 13.6l3.4 5.9L12 9Z" fill="#0f9d58"/><path d="M5.9 19.5h12.2l3.4-5.9H9.3Z" fill="#4285f4"/></svg></span>`
};
const channelIcon=id=>extra[id]||icon(id).replace('class="app-icon','class="ph-ic ph-ch ph-ch-'+id);
const channels=()=>state.site.channels.filter(c=>c.url).sort((a,b)=>Object.keys(channelName).indexOf(a.id)-Object.keys(channelName).indexOf(b.id));
const folderTile=items=>`<span class="ph-ic ph-folder" aria-hidden="true">${items.slice(0,9).map(item=>`<i>${item}</i>`).join('')}</span>`;

function calendarWidget(){
 const now=new Date(),today=day();
 const records=[...(state.workspace.records||[])].filter(r=>r.date).sort((a,b)=>b.date.localeCompare(a.date));
 const todays=records.filter(r=>r.date===today).length;
 const list=records.slice(0,3).map(r=>`<li class="${r.kind==='개발일지'?'devlog':''}"><b>${e(recordTitle(r))}</b><span>${monthDay(r.date)} · ${e(r.kind)}</span></li>`).join('')||'<li><b>아직 기록이 없어요</b></li>';
 return `<button class="ph-widget ph-w-medium ph-cal-widget" ${route({view:'records'})} aria-label="캘린더 — 기록 보기"><div class="ph-cal-day"><span class="ph-wd">${weekdays[now.getDay()]}</span><span class="ph-dd">${now.getDate()}</span><span class="ph-none">${todays?`오늘 기록 ${todays}개`:'오늘 기록 없음'}</span></div><div class="ph-cal-list"><h4>최근 기록</h4><ul>${list}</ul></div></button><span class="ph-wlabel">캘린더</span>`;
}
function noteWidget(){
 const memo=(state.workspace.memos||[])[0];if(!memo)return '';
 return `<button class="ph-widget ph-w-small ph-note-widget" ${route({view:'note',id:memo.id})} aria-label="메모 — ${e(memo.name)}"><header>메모</header><div><b>${e(memo.name)}</b>${e(memo.text||'')}</div></button><span class="ph-wlabel">메모</span>`;
}
function recordWidget(){
 const records=[...(state.workspace.records||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 const log=records.find(r=>r.kind==='개발일지'),thought=records.find(r=>r.kind==='생각');
 if(!log&&!thought)return '';
 return `<button class="ph-widget ph-w-wide ph-log-widget" ${route({view:'records'})} aria-label="기록 보기">${log?`<h4>개발일지 <span>${monthDay(log.date)}</span></h4><p>${e(log.body||log.title)}</p>`:''}${thought?`<h4 class="thought">생각 <span>${monthDay(thought.date)}</span></h4><p class="title">${e(thought.title)}</p>`:''}</button><span class="ph-wlabel">기록</span>`;
}

export function renderPhoneHome(){
 const home=$('#phone-home');if(!home)return;
 const list=channels();
 const apps1=[
  app('인사드립니다',iosIcon('person'),route({view:'about'})),
  app('방명록',iosIcon('guestbook'),route({view:'guestbook'})),
  app('연락하기',iosIcon('message'),route({view:'contact'})),
  app('연수 자료',iosIcon('note'),route({view:'training'}))
 ].join('');
 const row=[
  app('공유 자료',iosIcon('folder'),route({view:'shared'})),
  app('추천 도구함',iosIcon('star'),route({view:'recommend'})),
  app('자료 아카이브',iosIcon('sheet'),route({view:'archives'})),
  list.length?app('채널',folderTile(list.map(c=>channelIcon(c.id))),'data-folder="channels"'):''
 ].join('');
 const shortcuts=(state.workspace.shortcuts||[]).map(s=>`<a class="ph-app" href="${e(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(s.name)}">${icon(s.kind,e(s.image)).replace('class="app-icon','class="ph-ic ph-light')}<span class="ph-lbl" aria-hidden="true">${e(s.name)}</span></a>`).join('');
 const page2=list.map(c=>`<a class="ph-app" href="${e(c.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(channelName[c.id]||c.name)} 열기">${channelIcon(c.id)}<span class="ph-lbl" aria-hidden="true">${e(channelName[c.id]||c.name)}</span></a>`).join('')+(isAdmin()?app('비밀 폴더',iosIcon('folder'),route({view:'private'})):'')+shortcuts+(state.editor?app('새 바로가기',`<span class="ph-ic ph-add">${svg('plus')}</span>`,route({view:'addShortcut'})):'');
 home.innerHTML=`<div class="ph-pages" tabindex="-1"><section class="ph-page" aria-label="홈 1쪽">${calendarWidget()}<div class="ph-row2">${noteWidget()}<div class="ph-grid ph-grid2">${apps1}</div></div><div class="ph-grid">${row}</div></section><section class="ph-page" aria-label="홈 2쪽">${recordWidget()}<div class="ph-grid">${page2}</div></section></div><div class="ph-dots" aria-hidden="true"><i class="on"></i><i></i></div><button class="ph-search" ${route({view:'search'})}>${svg('search')}<span>검색</span></button><button class="ph-done" type="button" hidden>완료</button>`;
restorePage();
}

function restorePage(){const pages=$('#phone-home .ph-pages');if(!pages)return;pages.scrollLeft=lastPage*pages.clientWidth;syncDots(false);}
function syncDots(remember=true){
 const pages=$('#phone-home .ph-pages');if(!pages)return;
 const index=Math.round(pages.scrollLeft/Math.max(1,pages.clientWidth));if(remember&&pages.clientWidth)lastPage=index;
 document.querySelectorAll('#phone-home .ph-dots i').forEach((dot,i)=>dot.classList.toggle('on',i===index));
}

// 폴더: 흐린 배경 위 유리 판. 「프로그램」에는 데스크톱 「만든 프로그램」 창의 프로젝트·놀이터도 함께 넣는다
export function openPhoneFolder(kind){
 const sheet=$('#phone-folder');if(!sheet)return;
 const items=kind==='channels'
  ?channels().map(c=>`<a class="ph-app" href="${e(c.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(channelName[c.id]||c.name)} 열기">${channelIcon(c.id)}<span class="ph-lbl" aria-hidden="true">${e(channelName[c.id]||c.name)}</span></a>`)
  :[...state.site.programs.map(p=>app(p.label,`<span class="ph-ic"><img src="${e(p.icon)}" alt=""></span>`,route({view:'program',id:p.id}))),app('프로젝트',iosIcon('sheet'),route({view:'workflows'})),app('놀이터',iosIcon('star'),route({view:'physics'}))];
 sheet.innerHTML=`<h2 id="phone-folder-title">${kind==='channels'?'채널':'프로그램'}</h2><div class="ph-folder-panel">${items.join('')}</div>`;
 sheet.hidden=false;requestAnimationFrame(()=>sheet.classList.add('open'));
}
export function closePhoneFolder(){const sheet=$('#phone-folder');if(!sheet||sheet.hidden)return;sheet.classList.remove('open');sheet.hidden=true;}

export function initPhoneHome(){
 const desktop=$('#desktop');
 if(!$('#phone-home')){
  desktop.insertAdjacentHTML('beforeend','<div id="phone-home" aria-label="홈 화면"></div><div id="phone-folder" role="dialog" aria-modal="true" aria-labelledby="phone-folder-title" hidden></div>');
 }
 const home=$('#phone-home'),sheet=$('#phone-folder');
 home.addEventListener('scroll',event=>{if(event.target.classList?.contains('ph-pages'))syncDots();},true);
 // 폴더 열기(독의 「프로그램」, 1쪽 「채널」)
 document.addEventListener('click',event=>{
  const folder=event.target.closest('[data-folder]');
  if(folder&&!document.body.classList.contains('ph-jiggle')){event.preventDefault();event.stopPropagation();openPhoneFolder(folder.dataset.folder);}
 },true);
 // 폴더 바깥을 누르거나, 폴더 안에서 무언가를 열면 닫힌다
 sheet.addEventListener('click',event=>{if(!event.target.closest('.ph-folder-panel'))closePhoneFolder();else if(event.target.closest('[data-route],a'))setTimeout(closePhoneFolder,0);});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){closePhoneFolder();stopJiggle();}});
 document.addEventListener('studio:desktopready',()=>requestAnimationFrame(restorePage));
 // 꾹 누르기: 아이콘이 흔들린다(방문자는 아무것도 바뀌지 않는다). 「완료」나 빈 곳을 누르면 끝
 let timer=0,longPressed=false;
 const startJiggle=()=>{longPressed=true;document.body.classList.add('ph-jiggle');const done=home.querySelector('.ph-done');if(done)done.hidden=false;navigator.vibrate?.(8);};
 home.addEventListener('pointerdown',event=>{if(!event.target.closest('.ph-app,.ph-widget')||document.body.classList.contains('ph-jiggle'))return;longPressed=false;clearTimeout(timer);timer=setTimeout(startJiggle,550);});
 for(const type of ['pointerup','pointercancel','pointerleave'])home.addEventListener(type,()=>clearTimeout(timer));
 home.addEventListener('scroll',()=>clearTimeout(timer),true);
 home.addEventListener('contextmenu',event=>{if(event.target.closest('.ph-app,.ph-widget'))event.preventDefault();});
 home.addEventListener('click',event=>{
  if(longPressed){longPressed=false;event.preventDefault();event.stopPropagation();return;}
  if(!document.body.classList.contains('ph-jiggle'))return;
  event.preventDefault();event.stopPropagation();
  if(event.target.closest('.ph-done')||!event.target.closest('.ph-app,.ph-widget'))stopJiggle();
 },true);
}
export function stopJiggle(){document.body.classList.remove('ph-jiggle');const done=$('#phone-home .ph-done');if(done)done.hidden=true;}
