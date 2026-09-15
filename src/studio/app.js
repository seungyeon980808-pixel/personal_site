import {initPlayful} from './playful.js';
import {initHammer} from './hammer.js';
import {initNotch} from './notch.js';
import {$,escape as e,day,toast} from './utils.js';
import {state,refresh,editDraft,previewPublic,isAdmin,restoreAuth,restoreDraftIfOwner,update} from './store.js';
import {icon,svg} from './icons.js';
import {configureWindow,initWindow,open,currentRoute,redraw,close} from './window.js';
import * as views from './views.js';
import {admin} from './admin.js';
import {physics} from './physics.js';
import {browserView,separateWindow} from './browser.js';
import {initEntrance,enterDesktop as enterPhotoDesktop} from './entrance.js';
import {initSolidPhone,enterSolidDesktop} from './solid-phone.js';
const solid=new URLSearchParams(location.search).get('entrance')==='solid';
const enterDesktop=solid?enterSolidDesktop:enterPhotoDesktop;
import {initPages} from './pages.js';
import {initWelcome} from './welcome.js';
import {initDockNames} from './dock.js';
import {initMenuBar} from './menu-bar.js';
import {guestbook,contact} from './community.js';
import {calendarView,renderCalendarWidget,changeWidgetMonth,resetWidgetMonth} from './calendar.js';
let memoDrag,memoBoardObserver;
const defaults=[['연수 자료','training','folder'],['공유 자료','shared','folder'],['추천 도구함','recommend','folder'],['자료 아카이브','archives','folder'],['방명록','guestbook','guestbook'],['연락하기','contact','message'],['인사드립니다','about','greeting']];
const button=(label,view,kind,image='')=>`<button class="desktop-icon" data-route='${JSON.stringify({view})}' title="${e(label)}">${icon(kind,image)}<span>${e(label)}</span></button>`;
const memoCard=(memo,index)=>`<article class="widget note memo-card ${e(memo.color)}" data-memo-id="${e(memo.id)}" style="--memo-x:${memo.x};--memo-y:${memo.y}"><header class="note-heading"><strong>${e(memo.name)}</strong><details><summary aria-label="${e(memo.name)} 메뉴">⋯</summary><div class="memo-menu"><button data-route='${e(JSON.stringify({view:'note',id:memo.id}))}'>펼쳐 보기</button>${isAdmin()?`<button class="admin-only" data-route='${e(JSON.stringify({view:'editNote',id:memo.id}))}'>메모 편집</button>`:''}</div></details></header><p class="memo-text" ${index===0?'id="note-text"':''}>${e(memo.text)}</p>${memo.checklist.length?`<ul class="memo-checklist">${memo.checklist.map((item,itemIndex)=>`<li class="${item.done?'done':''}">${isAdmin()?`<label><input type="checkbox" data-memo-check="${e(memo.id)}:${itemIndex}" ${item.done?'checked':''}>${e(item.text)}</label>`:`${item.done?'✓ ':''}${e(item.text)}`}</li>`).join('')}</ul>`:''}</article>`;
function renderMemos(){
 const memos=state.workspace.memos||[];$('#memo-board').innerHTML=memos.map(memoCard).join('');
 const board=$('#memo-board');
 board.querySelectorAll('[data-memo-check]').forEach(control=>control.addEventListener('change',()=>{try{if(!state.editor)editDraft();const [id,index]=control.dataset.memoCheck.split(':'),next=structuredClone(state.workspace),memo=next.memos.find(item=>item.id===id),item=memo?.checklist[Number(index)];if(!item)return;item.done=control.checked;update(next);}catch(error){toast(error.message);}}));
 const place=(card,memo,rect)=>{const x=Math.max(0,Math.min(1,memo.x))*Math.max(0,rect.width-card.offsetWidth),y=Math.max(0,Math.min(1,memo.y))*Math.max(0,rect.height-card.offsetHeight);card.style.left=`${x}px`;card.style.top=`${y}px`;};
 const placeAll=()=>{const rect=board.getBoundingClientRect();memos.forEach(memo=>{const card=board.querySelector(`[data-memo-id="${CSS.escape(memo.id)}"]`);if(card)place(card,memo,rect);});};memoBoardObserver?.disconnect();memoBoardObserver=new ResizeObserver(placeAll);memoBoardObserver.observe(board);placeAll();requestAnimationFrame(placeAll);
 if(!isAdmin()||matchMedia('(max-width:700px)').matches){$('#memo-board').onpointerdown=$('#memo-board').onpointermove=$('#memo-board').onpointerup=$('#memo-board').onpointercancel=null;return;}
 board.onpointerdown=event=>{let card=event.target.closest('.memo-card');if(!card||!event.target.closest('.note-heading')||event.target.closest('button,summary,details'))return;if(!state.editor){const id=card.dataset.memoId;editDraft();card=board.querySelector(`[data-memo-id="${CSS.escape(id)}"]`);if(!card)return;}const memo=state.workspace.memos.find(item=>item.id===card.dataset.memoId);if(!memo)return;const rect=board.getBoundingClientRect(),width=Math.max(1,rect.width-card.offsetWidth),height=Math.max(1,rect.height-card.offsetHeight);memoDrag={id:memo.id,card,startX:event.clientX,startY:event.clientY,x:memo.x*width,y:memo.y*height,width,height,rect};card.setPointerCapture(event.pointerId);};
 board.onpointermove=event=>{if(!memoDrag)return;const x=Math.max(0,Math.min(memoDrag.width,memoDrag.x+event.clientX-memoDrag.startX)),y=Math.max(0,Math.min(memoDrag.height,memoDrag.y+event.clientY-memoDrag.startY));memoDrag.card.style.left=`${x}px`;memoDrag.card.style.top=`${y}px`;memoDrag.next={x:x/memoDrag.width,y:y/memoDrag.height};};
 board.onpointerup=board.onpointercancel=()=>{if(!memoDrag)return;const {id,moved}= {id:memoDrag.id,moved:memoDrag.next};memoDrag=null;if(!moved)return;const next=structuredClone(state.workspace),memo=next.memos.find(item=>item.id===id);if(memo){memo.x=moved.x;memo.y=moved.y;try{update(next);}catch(error){toast(error.message);}}};
}
function render(){
 $('#draft-banner').hidden=!state.draft;renderMemos();
 $('#icons').innerHTML=defaults.map(([label,view,kind])=>button(label,view,kind)).join('')+state.workspace.shortcuts.map(s=>`<a class="desktop-icon" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${icon(s.kind,e(s.image))}<span>${e(s.name)}</span></a>`).join('')+(state.editor?`<button class="shortcut-create" data-route='{"view":"addShortcut"}'>${svg('plus')}<strong>새 바로가기</strong><span>추가하기</span></button>`:'');
 const mobile=matchMedia('(max-width:700px)').matches,hammer=$('.hammer-tool');
 $('#dock').innerHTML=mobile?`<button data-route='{"view":"programs"}' aria-label="만든 프로그램 폴더" title="만든 프로그램">${icon('folder')}<span>만든 프로그램</span></button><button data-route='{"view":"records"}' title="캘린더">${icon('calendar')}<span>캘린더</span></button><button id="edit" data-route='{"view":"settings"}' aria-label="설정" title="설정">${icon('settings')}<span>설정</span></button>`:`<button class="dock-launcher" data-route='{"view":"workflows"}' aria-label="진행 중인 프로젝트 폴더" title="진행 중인 프로젝트">${icon('folder')}<span>프로젝트</span></button>${state.site.programs.map(p=>`<button data-route='${e(JSON.stringify({view:'program',id:p.id}))}' aria-label="${e(p.label)}" title="${e(p.label)}">${icon('sheet',p.icon)}<span>${e(p.label)}</span></button>`).join('')}`;
 if(!mobile){
  $('#dock').insertAdjacentHTML('beforeend',(state.workspace.dockPrograms||[]).map(p=>`<a class="dock-channel" href="${e(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(p.name)}">${icon(p.kind,p.image)}<span>${e(p.name)}</span></a>`).join('')+(isAdmin()?`<button id="dock-add" class="admin-only" data-route='{"view":"admin","tab":"dockPrograms"}' aria-label="프로그램 추가">${icon('plus')}<span>프로그램 추가</span></button>`:''));
  $('#dock').querySelectorAll('[title]').forEach(item=>item.removeAttribute('title'));
 }
 const channels=['github','threads','brunch'].map(id=>state.site.channels.find(c=>c.id===id)).filter(c=>c?.url);
 if(!mobile)$('#dock').insertAdjacentHTML('beforeend',channels.length?`<span class="dock-divider" aria-hidden="true"></span>${channels.map(c=>`<a class="dock-channel" href="${e(c.url)}" target="_blank" rel="noopener noreferrer" aria-label="${e(c.id==='brunch'?'브런치':c.id==='threads'?'Threads':'GitHub')} 열기">${icon(c.id)}<span>${c.id==='brunch'?'브런치':c.id==='threads'?'Threads':'GitHub'}</span></a>`).join('')}`:'');
 if(hammer)$('#dock').prepend(hammer);
 renderCalendarWidget();
}
function route(r){
 $('#workspace-window').classList.toggle('calendar-window',r.view==='records');
 if(r.view==='settings')return admin({tab:'settings'});
 if(r.view==='editNote'){if(!isAdmin())return admin({tab:'settings'});editDraft();return open({view:'admin',tab:'memos',id:r.id},true);}
 if(r.view==='addShortcut'){if(!isAdmin())return admin({tab:'settings'});editDraft();return open({view:'admin',tab:'shortcuts'},true);}
 const fn={programs:()=>views.programs(),program:()=>views.program(r.id),browser:()=>browserView(r.id,r.mode),records:()=>calendarView(r),recommend:()=>views.finder('recommend',r.category,r.folder,r.id),training:()=>views.finder('training',r.category,r.folder,r.id),archives:()=>views.finder('archive',r.category,r.folder,r.id),shared:views.shared,note:()=>views.note(r.id),usage:views.usage,workflows:()=>views.workflows(r.category,r.folder,r.id),about:views.about,guestbook,contact,search:()=>views.search(r.query),physics,admin:()=>admin(r)}[r.view];
 fn?.();
 if(r.view==='search'){$('#search-form').onsubmit=event=>{event.preventDefault();open({view:'search',query:new FormData(event.target).get('query')},true);};$('#search-query').focus();}
}
initDockNames();initMenuBar(open);configureWindow(route);initWindow();initPages();solid?initSolidPhone():initEntrance();
document.addEventListener('click',event=>{const link=event.target.closest('a[target="_blank"]');if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();separateWindow(link.href);return;}const target=event.target.closest('[data-route],[data-date]');if(!target)return;if(target.dataset.date)open({view:'records',date:target.dataset.date});else open(JSON.parse(target.dataset.route));});
$('#previous-month').onclick=()=>changeWidgetMonth(-1);
$('#next-month').onclick=()=>changeWidgetMonth(1);
$('#today').onclick=resetWidgetMonth;
$('#public-preview').onclick=()=>{previewPublic();if(currentRoute())open({view:'about'});toast('공개된 내용을 보고 있습니다. 초안은 보관됩니다.');};
$('#search-button').onclick=()=>open({view:'search'});

window.addEventListener('keydown',async event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!$('#entrance').hidden)await enterDesktop();if($('#entrance').hidden)open({view:'search'});}});
document.addEventListener('studio:change',render);render();
document.addEventListener('studio:desktopready',render);
let resizeRender;addEventListener('resize',()=>{clearTimeout(resizeRender);if(document.body.classList.contains('travelling'))return;resizeRender=setTimeout(render,120);});
refresh().then(async ok=>{if(!ok){toast('저장된 공개 내용으로 표시하고 있습니다. 네트워크 연결 후 새로고침해주세요.');return;}try{await restoreAuth();restoreDraftIfOwner();}catch{}}).catch(()=>toast('내용을 불러오지 못했습니다. 저장된 공개 내용으로 표시합니다.'));

initWelcome();

initNotch();

initPlayful();
initHammer();
