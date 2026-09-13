import {escape as e} from './utils.js';

const pad=value=>String(value).padStart(2,'0');
export const iso=date=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
export const fromISO=value=>{const [year,month,date]=value.split('-').map(Number);return new Date(year,month-1,date);};
export const moveDate=(value,days)=>{const date=fromISO(value);date.setDate(date.getDate()+days);return iso(date);};
export const monday=value=>{const date=fromISO(value),offset=(date.getDay()+6)%7;date.setDate(date.getDate()-offset);return iso(date);};
export const time=minutes=>`${pad(Math.floor(minutes/60))}:${pad(minutes%60)}`;
export const minutes=value=>{const [hour,minute]=String(value).split(':').map(Number);return hour*60+minute;};

function nav(route,editable){
 const month=route.mode!=='week',focus=fromISO(route.date),start=monday(route.date),end=moveDate(start,6),title=month?`${focus.getFullYear()}년 ${focus.getMonth()+1}월`:`${dayLabel(start)}–${dayLabel(end)}`;
 return `<header class="calendar-toolbar"><h1>${title}</h1><div class="calendar-period"><button data-cal-action="previous" aria-label="이전 ${month?'달':'주'}">‹</button><button data-cal-action="today">오늘</button><button data-cal-action="next" aria-label="다음 ${month?'달':'주'}">›</button></div><div class="calendar-view-switch" role="group" aria-label="캘린더 보기"><button data-cal-action="month" aria-pressed="${month}">월간</button><button data-cal-action="week" aria-pressed="${!month}">주간</button></div>${editable?'<div class="calendar-add"><button class="admin-only" data-cal-add="schedule">+ 일정</button><button class="admin-only" data-cal-add="record">+ 기록</button></div>':''}</header>`;
}

const counts=(date,schedules,records)=>({schedules:schedules.filter(item=>item.date===date).length,records:records.filter(item=>item.date===date).length});
const dayLabel=value=>{const date=fromISO(value);return `${date.getMonth()+1}월 ${date.getDate()}일`;};
const routeValue=(type,id)=>e(JSON.stringify({type,id}));

function dayPanel(date,schedules,records,editable,detail){
 const events=schedules.filter(item=>item.date===date).sort((a,b)=>a.start-b.start),notes=records.filter(item=>item.date===date);
 let detailHTML='';
 if(detail?.type==='schedule'){
  const item=events.find(entry=>entry.id===detail.id);
  if(item)detailHTML=`<article class="calendar-detail"><p class="calendar-entry-kind schedule-kind">일정 · ${time(item.start)}–${time(item.end)}</p><h2>${e(item.title)}</h2>${item.location?`<p class="calendar-location">${e(item.location)}</p>`:''}${item.body?`<p class="calendar-description">${e(item.body)}</p>`:''}${item.url?`<a class="text" href="${e(item.url)}" target="_blank" rel="noopener noreferrer">연결 열기 ↗</a>`:''}${editable?`<button class="secondary calendar-edit" data-cal-edit="schedule" data-id="${e(item.id)}">일정 수정</button>`:''}</article>`;
 }else if(detail?.type==='record'){
  const item=notes.find(entry=>entry.id===detail.id);
  if(item)detailHTML=`<article class="calendar-detail"><p class="calendar-entry-kind record-kind">기록 · ${e(item.kind)}</p><h2>${e(item.title)}</h2><p class="calendar-description">${e(item.body)}</p>${editable?`<button class="secondary calendar-edit" data-cal-edit="record" data-id="${e(item.id)}">기록 수정</button>`:''}</article>`;
 }
 return `<aside class="calendar-agenda calendar-overlay"><div class="calendar-agenda-head"><div><p class="eyebrow">${e(date)}</p><h2>${dayLabel(date)}</h2></div><button data-cal-dismiss aria-label="선택한 날짜 닫기">×</button></div><div class="calendar-entry-list">${events.map(item=>`<button class="calendar-entry schedule-entry" data-cal-entry='${routeValue('schedule',item.id)}'><span>${time(item.start)}</span><strong>${e(item.title)}</strong><small>${e(item.location)}</small></button>`).join('')}${notes.map(item=>`<button class="calendar-entry record-entry" data-cal-entry='${routeValue('record',item.id)}'><span>${e(item.kind)}</span><strong>${e(item.title)}</strong></button>`).join('')||(!events.length?'<p class="muted">이날의 일정과 기록이 없습니다.</p>':'')}</div>${detailHTML}</aside>`;
}

export function monthView(route,schedules,records,editable,detail){
 const focus=fromISO(route.date),year=focus.getFullYear(),month=focus.getMonth(),first=new Date(year,month,1),offset=(first.getDay()+6)%7,start=new Date(year,month,1-offset);
 const days=Array.from({length:42},(_,index)=>{const date=new Date(start);date.setDate(start.getDate()+index);const value=iso(date),total=counts(value,schedules,records),outside=date.getMonth()!==month;return `<button class="calendar-month-day${outside?' outside':''}${value===route.date?' selected':''}" data-cal-date="${value}" ${value===iso(new Date())?'aria-current="date"':''} aria-label="${dayLabel(value)}, 일정 ${total.schedules}개, 기록 ${total.records}개"><span>${date.getDate()}</span><span class="calendar-marks">${total.schedules?`<i class="schedule-mark">일정 ${total.schedules}</i>`:''}${total.records?`<i class="record-mark">기록 ${total.records}</i>`:''}</span></button>`;}).join('');
 return `${nav(route,editable)}<div class="calendar-surface"><section class="calendar-month"><div class="calendar-weekdays" aria-hidden="true"><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span></div><div class="calendar-month-grid">${days}</div></section>${route.dateIntent?dayPanel(route.date,schedules,records,editable,detail):''}</div>`;
}

export function weekView(route,schedules,records,editable,detail){
 const start=monday(route.date),dates=Array.from({length:7},(_,index)=>moveDate(start,index));
 const header=dates.map(date=>{const quantity=counts(date,schedules,records);return `<button data-cal-date="${date}" class="calendar-week-date${date===route.date?' selected':''}" ${date===iso(new Date())?'aria-current="date"':''}><span>${['월','화','수','목','금','토','일'][dates.indexOf(date)]}</span><strong>${fromISO(date).getDate()}</strong>${quantity.records?`<i aria-label="기록 ${quantity.records}개"></i>`:''}</button>`;}).join('');
 const recordStrip=dates.map(date=>`<div class="calendar-week-records">${records.filter(item=>item.date===date).map(item=>`<button data-cal-entry='${routeValue('record',item.id)}'><span>${e(item.kind)}</span><strong>${e(item.title)}</strong></button>`).join('')}</div>`).join('');
 const columns=dates.map(date=>`<div class="calendar-week-column" data-week-date="${date}" aria-label="${dayLabel(date)} 시간 선택">${schedules.filter(item=>item.date===date).map(item=>`<button class="week-event" style="--start:${item.start};--duration:${item.end-item.start}" data-cal-entry='${routeValue('schedule',item.id)}'><span>${time(item.start)}</span><strong>${e(item.title)}</strong></button>`).join('')}</div>`).join('');
 const labels=Array.from({length:24},(_,hour)=>`<span>${pad(hour)}:00</span>`).join('');
 return `${nav(route,editable)}<div class="calendar-surface"><section class="calendar-week"><div class="calendar-week-header"><span></span>${header}</div><div class="calendar-week-record-strip"><span>기록</span>${recordStrip}</div><div class="calendar-week-scroll"><div class="calendar-hour-labels">${labels}</div><div class="calendar-week-columns">${columns}</div></div><p class="calendar-drag-hint">${editable?'빈 시간대를 드래그하면 10분 단위로 일정을 만들 수 있습니다.':'시간대별 공개 일정을 선택해 자세히 볼 수 있습니다.'}</p></section>${route.dateIntent?dayPanel(route.date,schedules,records,editable,detail):''}</div>`;
}

export function widgetMarkup({date,schedules,records}){
 const focus=new Date(date.getFullYear(),date.getMonth(),1),offset=(focus.getDay()+6)%7,start=new Date(focus);start.setDate(1-offset);let html='';
 for(let index=0;index<42;index++){const current=new Date(start);current.setDate(start.getDate()+index);if(current.getMonth()!==date.getMonth())continue;const value=iso(current),quantity=counts(value,schedules,records);html+=`<button class="${quantity.schedules?'has-schedule ':''}${quantity.records?'has-record ':''}${value===iso(new Date())?'today ':''}" data-date="${value}" aria-label="${dayLabel(value)}${quantity.schedules?`, 일정 ${quantity.schedules}개`:''}${quantity.records?`, 기록 ${quantity.records}개`:''}" ${value===iso(new Date())?'aria-current="date"':''}>${current.getDate()}<span class="widget-marks">${quantity.schedules?'<i></i>':''}${quantity.records?'<b></b>':''}</span></button>`;}
 return {title:`${date.getFullYear()}년 ${date.getMonth()+1}월`,padding:'<span></span>'.repeat(offset),html};
}
