import {$,escape as e,day,toast} from './utils.js';
import {state,refresh,editDraft,previewPublic} from './store.js';
import {icon,svg} from './icons.js';
import {configureWindow,initWindow,open,currentRoute,redraw,close} from './window.js';
import * as views from './views.js';
import {admin} from './admin.js';
import {physics} from './physics.js';
import {browserView,separateWindow} from './browser.js';
let month=new Date(),selectedDate='';
const defaults=[['연수 자료','training','folder'],['만든 도구','programs','folder'],['추천 도구함','recommend','folder'],['프로젝트','workflows','folder'],['소개·채널','about','person']];
const button=(label,view,kind,image='')=>`<button class="desktop-icon" data-route='${JSON.stringify({view})}'>${icon(kind,image)}<span>${e(label)}</span></button>`;
function render(){
 $('#note-text').textContent=state.workspace.note;$('#draft-banner').hidden=!state.draft;$('#edit').textContent=state.editor?'관리 화면':'작업실 관리';
 $('#icons').innerHTML=defaults.map(([label,view,kind])=>button(label,view,kind)).join('')+state.workspace.shortcuts.map(s=>`<a class="desktop-icon" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${icon(s.kind,e(s.image))}<span>${e(s.name)}</span></a>`).join('')+(state.editor?`<button class="shortcut-create" data-route='{"view":"addShortcut"}'>${svg('plus')}<strong>새 바로가기</strong><span>추가하기</span></button>`:'');
 $('#dock').innerHTML=state.site.programs.slice(0,3).map(p=>`<button data-route='${JSON.stringify({view:'program',id:p.id})}' aria-label="${e(p.label)}">${icon('sheet',p.icon)}<span>${e(p.label)}</span></button>`).join('')+[['자료실','training','folder'],['추천 도구함','recommend','folder'],['캘린더','records','calendar'],['놀이터','physics','play']].map(([n,v,k])=>`<button data-route='${JSON.stringify({view:v})}'>${icon(k)}<span>${n}</span></button>`).join('');
 calendar();
}
function calendar(){
 const year=month.getFullYear(),m=month.getMonth();$('#month-title').textContent=`${year}년 ${m+1}월`;let html='<span></span>'.repeat(new Date(year,m,1).getDay());
 for(let d=1;d<=new Date(year,m+1,0).getDate();d++){const date=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,count=state.workspace.records.filter(r=>r.date===date).length;html+=`<button class="${count?'has-record':''} ${date===day()?'today':''} ${date===selectedDate?'chosen':''}" data-date="${date}" aria-label="${m+1}월 ${d}일${count?`, 기록 ${count}개`:''}" ${date===day()?'aria-current="date"':''}>${d}${count?'<i></i>':''}</button>`;}
 $('#calendar-dates').innerHTML=html;
}
function route(r){
 if(r.view==='addShortcut'){if(!state.editor)editDraft();return open({view:'admin',tab:'shortcuts'},true);}
 const fn={programs:()=>views.programs(),program:()=>views.program(r.id),browser:()=>browserView(r.id,r.mode),records:()=>views.records(r.date,r.id),recommend:()=>views.finder('recommend',r.category,r.folder,r.id),training:()=>views.finder('training',r.category,r.folder,r.id),workflows:views.workflows,about:views.about,search:()=>views.search(r.query),physics,admin:()=>admin(r)}[r.view];
 fn?.();
 if(r.view==='search'){$('#search-form').onsubmit=event=>{event.preventDefault();open({view:'search',query:new FormData(event.target).get('query')},true);};$('#search-query').focus();}
}
configureWindow(route);initWindow();
document.addEventListener('click',event=>{const link=event.target.closest('a[target="_blank"]');if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();separateWindow(link.href);return;}const target=event.target.closest('[data-route],[data-date]');if(!target)return;if(target.dataset.date){selectedDate=target.dataset.date;calendar();open({view:'records',date:selectedDate});}else open(JSON.parse(target.dataset.route));});
$('#previous-month').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);calendar();};
$('#next-month').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);calendar();};
$('#today').onclick=()=>{month=new Date();calendar();};
$('#edit').onclick=()=>{try{if(!state.editor)editDraft();open({view:'admin'});}catch(err){toast(err.message);}};
$('#public-preview').onclick=()=>{previewPublic();if(currentRoute())open({view:'about'});toast('공개된 내용을 보고 있습니다. 초안은 보관됩니다.');};
$('#edit-note').onclick=()=>{if(!state.editor)editDraft();open({view:'admin',tab:'note'});};
function enter(){
 if($('#entrance').classList.contains('leaving'))return;
 $('#desktop').hidden=false;
 const entrance=$('#entrance');entrance.classList.add('leaving');
 const finish=()=>{entrance.hidden=true;entrance.classList.remove('leaving');$('#search-button').focus();};
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,650);
 sessionStorage.setItem('studio-entered','1');
}
$('#enter').onclick=enter;
const exitDesktop=()=>{close();$('#desktop').hidden=true;$('#entrance').hidden=false;sessionStorage.removeItem('studio-entered');$('#enter').focus();};
$('#return').onclick=exitDesktop;document.querySelector('[data-exit]').onclick=exitDesktop;
$('#search-button').onclick=()=>open({view:'search'});
$('#search-shortcut').onclick=()=>open({view:'search'});
window.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!$('#entrance').hidden)enter();open({view:'search'});}});
document.addEventListener('studio:change',render);render();
if(sessionStorage.getItem('studio-entered')){$('#entrance').hidden=true;$('#desktop').hidden=false;}
refresh().then(ok=>{if(!ok)toast('저장된 공개 내용으로 표시하고 있습니다. 네트워크 연결 후 새로고침해주세요.');}).catch(()=>toast('내용을 불러오지 못했습니다. 저장된 공개 내용으로 표시합니다.'));
