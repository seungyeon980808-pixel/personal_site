import {$,toast} from './utils.js';
import {state,isAdmin} from './store.js';
import {content} from './window.js';
import {iso,fromISO,moveDate,monthView,weekView,widgetMarkup} from './calendar-render.js';
import {editorMarkup,saveCalendarForm,deleteCalendarItem} from './calendar-editor.js';

let widgetMonth=new Date(),activeRoute={view:'records',mode:'month',date:iso(new Date())},editor=null,drag=null;
const editable=()=>state.editor&&isAdmin();

function normalizedRoute(route={}){
 const schedules=state.workspace.schedules||[],records=state.workspace.records||[],matched=route.id&&(schedules.find(item=>item.id===route.id)||records.find(item=>item.id===route.id));
 const date=/^\d{4}-\d{2}-\d{2}$/.test(route.date||'')?route.date:matched?.date||iso(new Date());
 return {view:'records',mode:route.mode==='week'?'week':'month',date,dateIntent:Boolean(route.date||route.id)};
}

function render(){
 const schedules=state.workspace.schedules||[],records=state.workspace.records||[],detail=activeRoute.detailType?{type:activeRoute.detailType,id:activeRoute.detailId}:null;
 content('캘린더',`<div class="calendar-page">${activeRoute.mode==='week'?weekView(activeRoute,schedules,records,editable(),detail):monthView(activeRoute,schedules,records,editable(),detail)}${editor&&editable()?editorMarkup(editor.kind,editor.item,activeRoute.date,editor.range):''}</div>`);
 bind();
 if(activeRoute.mode==='week'){const scroller=$('.calendar-week-scroll');if(scroller&&!scroller.dataset.positioned){scroller.scrollTop=8*48-8;scroller.dataset.positioned='true';}}
}

function period(delta){
 const date=fromISO(activeRoute.date);
 if(activeRoute.mode==='week')activeRoute.date=moveDate(activeRoute.date,delta*7);else{const day=date.getDate();date.setDate(1);date.setMonth(date.getMonth()+delta);date.setDate(Math.min(day,new Date(date.getFullYear(),date.getMonth()+1,0).getDate()));activeRoute.date=iso(date);}
 editor=null;render();
}

function openEditor(kind,id='',range=null){
 if(!editable())return;
 const key=kind==='schedule'?'schedules':'records',item=(state.workspace[key]||[]).find(entry=>entry.id===id);editor={kind,item,range};render();requestAnimationFrame(()=>$('#calendar-editor-form input[name="title"]')?.focus());
}

function bindControls(){
 document.querySelectorAll('[data-cal-action]').forEach(button=>button.onclick=()=>{const action=button.dataset.calAction;if(action==='month'||action==='week'){activeRoute.mode=action;editor=null;render();}else if(action==='today'){activeRoute.date=iso(new Date());editor=null;render();}else period(action==='previous'?-1:1);});
 document.querySelectorAll('[data-cal-date]').forEach(button=>button.onclick=()=>{activeRoute.date=button.dataset.calDate;activeRoute.dateIntent=true;activeRoute.detailType='';editor=null;render();});
 document.querySelectorAll('[data-cal-entry]').forEach(button=>button.onclick=()=>{const item=JSON.parse(button.dataset.calEntry);activeRoute.detailType=item.type;activeRoute.detailId=item.id;activeRoute.date=(item.type==='schedule'?state.workspace.schedules:state.workspace.records).find(entry=>entry.id===item.id)?.date||activeRoute.date;activeRoute.dateIntent=true;editor=null;render();});
 document.querySelectorAll('[data-cal-add]').forEach(button=>button.onclick=()=>openEditor(button.dataset.calAdd));
 document.querySelectorAll('[data-cal-edit]').forEach(button=>button.onclick=()=>openEditor(button.dataset.calEdit,button.dataset.id));
 document.querySelectorAll('[data-cal-dismiss]').forEach(button=>button.onclick=()=>{activeRoute.dateIntent=false;activeRoute.detailType='';render();});
}

function bindForm(){
 const form=$('#calendar-editor-form');if(!form)return;
 form.onsubmit=event=>{event.preventDefault();try{const saved=saveCalendarForm(form);activeRoute.date=saved.date;activeRoute.detailType=form.dataset.kind;activeRoute.detailId=saved.id;editor=null;render();toast('초안에 저장했습니다.');}catch(error){toast(error.message);}};
 form.querySelectorAll('[data-cal-cancel]').forEach(button=>button.onclick=()=>{editor=null;render();});
 const remove=form.querySelector('[data-cal-delete]');if(remove)remove.onclick=()=>{if(!confirm('이 항목을 삭제할까요?'))return;try{deleteCalendarItem(form.dataset.kind,form.dataset.id);activeRoute.detailType='';editor=null;render();toast('초안에서 삭제했습니다.');}catch(error){toast(error.message);}};
}

function dragPosition(event,column){const rect=column.getBoundingClientRect(),raw=(event.clientY-rect.top)/rect.height*1440;return Math.max(0,Math.min(1430,Math.round(raw/10)*10));}

function bindDrag(){
 if(!editable()||activeRoute.mode!=='week')return;
 document.querySelectorAll('.calendar-week-column').forEach(column=>{
  column.onpointerdown=event=>{if(event.target.closest('.week-event'))return;event.preventDefault();const start=dragPosition(event,column),selection=document.createElement('div');selection.className='calendar-drag-selection';column.append(selection);drag={column,start,end:Math.min(1440,start+10),selection};column.setPointerCapture(event.pointerId);paintDrag();};
  column.onpointermove=event=>{if(!drag||drag.column!==column)return;drag.end=dragPosition(event,column);if(drag.end===drag.start)drag.end=Math.min(1440,drag.start+10);paintDrag();};
 column.onpointerup=column.onpointercancel=()=>{if(!drag||drag.column!==column)return;const start=Math.min(drag.start,drag.end),end=Math.max(drag.start,drag.end);activeRoute.date=column.dataset.weekDate;activeRoute.dateIntent=true;drag=null;openEditor('schedule','',{start,end});};
 });
}

function paintDrag(){const start=Math.min(drag.start,drag.end),end=Math.max(drag.start,drag.end);drag.selection.style.setProperty('--start',start);drag.selection.style.setProperty('--duration',Math.max(10,end-start));}
function bind(){bindControls();bindForm();bindDrag();}

export function calendarView(route={}){activeRoute={...normalizedRoute(route),detailType:route.id?(state.workspace.schedules||[]).some(item=>item.id===route.id)?'schedule':'record':'',detailId:route.id||''};editor=null;render();}

export function renderCalendarWidget(){
 const widget=widgetMarkup({date:widgetMonth,schedules:state.workspace.schedules||[],records:state.workspace.records||[]});$('#month-title').textContent=widget.title;$('.weekdays').innerHTML='<span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span>';$('#calendar-dates').innerHTML=widget.padding+widget.html;
}

export function changeWidgetMonth(delta){widgetMonth=new Date(widgetMonth.getFullYear(),widgetMonth.getMonth()+delta,1);renderCalendarWidget();}
export function resetWidgetMonth(){widgetMonth=new Date();renderCalendarWidget();}
