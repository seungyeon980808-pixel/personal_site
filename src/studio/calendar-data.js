const datePattern=/^\d{4}-\d{2}-\d{2}$/;

function validDate(value){
 if(typeof value!=='string'||!datePattern.test(value))return false;
 const [year,month,date]=value.split('-').map(Number),parsed=new Date(Date.UTC(year,month-1,date));
 return parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===date;
}

function text(value,max){return typeof value==='string'&&value.length<=max;}

function validURL(value){
 if(value==='')return true;
 if(!text(value,3000))return false;
 try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}
}

function scheduleFrom(value){
 if(!value||typeof value!=='object')return null;
 const schedule={
  id:typeof value.id==='string'?value.id.trim():'',
  date:typeof value.date==='string'?value.date:'',
  start:value.start,end:value.end,
  title:typeof value.title==='string'?value.title.trim():'',
  location:typeof value.location==='string'?value.location.trim():'',
  body:typeof value.body==='string'?value.body.trim():'',
  url:typeof value.url==='string'?value.url.trim():''
 };
 if(!text(schedule.id,100)||!schedule.id||!validDate(schedule.date)||!Number.isInteger(schedule.start)||!Number.isInteger(schedule.end)||schedule.start%10||schedule.end%10||schedule.start<0||schedule.end>1440||schedule.end<=schedule.start||!text(schedule.title,160)||!schedule.title||!text(schedule.location,200)||!text(schedule.body,10000)||!validURL(schedule.url))return null;
 return schedule;
}

export function normalizeSchedules(raw){
 if(raw==null)return [];
 if(!Array.isArray(raw))return structuredClone(raw);
 return raw.map(value=>scheduleFrom(value)??structuredClone(value));
}

export function validateSchedules(raw){
 if(raw==null)return [];
 if(!Array.isArray(raw)||raw.length>500)throw Error('일정 수가 허용 범위를 벗어났습니다.');
 const ids=new Set(),normalized=[];
 for(const value of raw){const schedule=scheduleFrom(value);if(!schedule||ids.has(schedule.id))throw Error('일정의 날짜, 시간 또는 내용을 확인해주세요.');ids.add(schedule.id);normalized.push(schedule);}
 return normalized;
}
