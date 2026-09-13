import {state,update} from './store.js';
import {escape as e} from './utils.js';
import {time,minutes} from './calendar-render.js';

const field=(label,name,value,type='text',max='')=>`<label>${label}<input name="${name}" type="${type}" value="${e(value)}" ${type==='time'?'step="600"':''} ${max?`maxlength="${max}"`:''} required></label>`;

export function editorMarkup(kind,item,date,range){
 const isSchedule=kind==='schedule',title=item?.title||'';
 return `<section class="calendar-editor"><form id="calendar-editor-form" data-kind="${kind}" data-id="${e(item?.id||'')}"><div class="calendar-editor-head"><div><p class="eyebrow">${item?'EDIT':'NEW'} · ${isSchedule?'일정':'기록'}</p><h2>${item?'수정하기':'추가하기'}</h2></div><button type="button" data-cal-cancel aria-label="편집 닫기">×</button></div>${field('날짜','date',item?.date||date,'date')}${isSchedule?`<div class="calendar-time-fields">${field('시작','start',time(item?.start??range?.start??540),'time')}${field('종료','end',time(item?.end??range?.end??600),'time')}</div>`:''}${field('제목','title',title,'text','160')}${isSchedule?`${field('장소','location',item?.location||'','text','200').replace(' required','')}<label>설명<textarea name="body" maxlength="10000">${e(item?.body||'')}</textarea></label>${field('연결 주소','url',item?.url||'','url','3000').replace(' required','')}`:`<label>종류<select name="kind"><option>생각</option><option ${item?.kind==='개발일지'?'selected':''}>개발일지</option><option ${item?.kind==='연수'?'selected':''}>연수</option></select></label><label>내용<textarea name="body" maxlength="30000">${e(item?.body||'')}</textarea></label>`}<div class="calendar-editor-actions">${item?'<button type="button" class="danger" data-cal-delete>삭제</button>':''}<button type="button" class="secondary" data-cal-cancel>취소</button><button type="submit">초안 저장</button></div></form></section>`;
}

export function saveCalendarForm(form){
 const data=new FormData(form),kind=form.dataset.kind,id=form.dataset.id||crypto.randomUUID(),next=structuredClone(state.workspace),date=String(data.get('date'));next.schedules||=[];
 if(kind==='schedule'){
  const item={id,date,start:minutes(data.get('start')),end:minutes(data.get('end')),title:String(data.get('title')).trim(),location:String(data.get('location')).trim(),body:String(data.get('body')).trim(),url:String(data.get('url')).trim()};
  const index=next.schedules.findIndex(entry=>entry.id===id);if(index<0)next.schedules.push(item);else next.schedules[index]=item;
 }else{
  const item={id,date,title:String(data.get('title')).trim(),kind:String(data.get('kind')),body:String(data.get('body')).trim()},index=next.records.findIndex(entry=>entry.id===id);if(index<0)next.records.push(item);else next.records[index]=item;
 }
 update(next);return {date,id};
}

export function deleteCalendarItem(kind,id){
 const next=structuredClone(state.workspace),key=kind==='schedule'?'schedules':'records';next[key]=next[key].filter(item=>item.id!==id);update(next);
}
