import {$,escape as e,day,toast} from './utils.js';
import {state,refresh,editDraft,previewPublic} from './store.js';
import {icon,svg} from './icons.js';
import {configureWindow,initWindow,open,currentRoute,redraw,close} from './window.js';
import * as views from './views.js';
import {admin} from './admin.js';
import {physics} from './physics.js';
import {browserView,separateWindow} from './browser.js';
import {initEntrance,enterDesktop} from './entrance.js';
import {initPages} from './pages.js';
let month=new Date(),selectedDate='';
const defaults=[['연수 자료','training','folder'],['공유 자료','shared','folder'],['추천 도구함','recommend','folder'],['소개','about','folder']];
const button=(label,view,kind,image='')=>`<button class="desktop-icon" data-route='${JSON.stringify({view})}'>${icon(kind,image)}<span>${e(label)}</span></button>`;
function render(){
 $('#note-text').textContent=state.workspace.note;$('#draft-banner').hidden=!state.draft;
 $('#icons').innerHTML=defaults.map(([label,view,kind])=>button(label,view,kind)).join('')+state.workspace.shortcuts.map(s=>`<a class="desktop-icon" href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${icon(s.kind,e(s.image))}<span>${e(s.name)}</span></a>`).join('')+(state.editor?`<button class="shortcut-create" data-route='{"view":"addShortcut"}'>${svg('plus')}<strong>새 바로가기</strong><span>추가하기</span></button>`:'');
 $('#dock').innerHTML=`<button data-route='{"view":"programs"}' aria-label="만든 프로그램 폴더">${icon('folder')}<span>만든 프로그램</span></button><button data-route='{"view":"records"}'>${icon('calendar')}<span>캘린더</span></button><button id="edit" data-route='{"view":"settings"}' aria-label="설정">${icon('settings')}<span>설정</span></button>`;
 calendar();
}
function calendar(){
 const year=month.getFullYear(),m=month.getMonth();$('#month-title').textContent=`${year}년 ${m+1}월`;let html='<span></span>'.repeat(new Date(year,m,1).getDay());
 for(let d=1;d<=new Date(year,m+1,0).getDate();d++){const date=`${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,count=state.workspace.records.filter(r=>r.date===date).length;html+=`<button class="${count?'has-record':''} ${date===day()?'today':''} ${date===selectedDate?'chosen':''}" data-date="${date}" aria-label="${m+1}월 ${d}일${count?`, 기록 ${count}개`:''}" ${date===day()?'aria-current="date"':''}>${d}${count?'<i></i>':''}</button>`;}
 $('#calendar-dates').innerHTML=html;
}
function route(r){
 if(r.view==='settings'){if(!state.editor)editDraft();return open({view:'admin'},true);}
 if(r.view==='addShortcut'){if(!state.editor)editDraft();return open({view:'admin',tab:'shortcuts'},true);}
 const fn={programs:()=>views.programs(),program:()=>views.program(r.id),browser:()=>browserView(r.id,r.mode),records:()=>views.records(r.date,r.id),recommend:()=>views.finder('recommend',r.category,r.folder,r.id),training:()=>views.finder('training',r.category,r.folder,r.id),shared:views.shared,note:views.note,workflows:views.workflows,about:views.about,search:()=>views.search(r.query),physics,admin:()=>admin(r)}[r.view];
 fn?.();
 if(r.view==='search'){$('#search-form').onsubmit=event=>{event.preventDefault();open({view:'search',query:new FormData(event.target).get('query')},true);};$('#search-query').focus();}
}
configureWindow(route);initWindow();initPages();initEntrance();
document.addEventListener('click',event=>{const link=event.target.closest('a[target="_blank"]');if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){event.preventDefault();separateWindow(link.href);return;}const target=event.target.closest('[data-route],[data-date]');if(!target)return;if(target.dataset.date){selectedDate=target.dataset.date;calendar();open({view:'records',date:selectedDate});}else open(JSON.parse(target.dataset.route));});
$('#previous-month').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()-1,1);calendar();};
$('#next-month').onclick=()=>{month=new Date(month.getFullYear(),month.getMonth()+1,1);calendar();};
$('#today').onclick=()=>{month=new Date();calendar();};
$('#public-preview').onclick=()=>{previewPublic();if(currentRoute())open({view:'about'});toast('공개된 내용을 보고 있습니다. 초안은 보관됩니다.');};
$('#edit-note').onclick=()=>{if(!state.editor)editDraft();open({view:'admin',tab:'note'});};
$('#search-button').onclick=()=>open({view:'search'});
$('#search-shortcut').onclick=()=>open({view:'search'});
window.addEventListener('keydown',async event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!$('#entrance').hidden)await enterDesktop();if($('#entrance').hidden)open({view:'search'});}});
document.addEventListener('studio:change',render);render();
refresh().then(ok=>{if(!ok)toast('저장된 공개 내용으로 표시하고 있습니다. 네트워크 연결 후 새로고침해주세요.');}).catch(()=>toast('내용을 불러오지 못했습니다. 저장된 공개 내용으로 표시합니다.'));
