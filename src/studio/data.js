import seed from './seed.json';
import {plain, safeURL} from './utils.js';
import {normalizeWorkflowOverrides,validateWorkflowOverrides} from './workflow-data.js';
import {normalizeProfile,validateProfile} from './profile-data.js';
import {normalizeSchedules,validateSchedules} from './calendar-data.js';
export const programMeta = [
 ['7','ExamPool','exam-pool','exampool'],['1','5E','physics-draw','5e'],['3','HwpPalette','hwp-palette','hwp'],['4','EveryKey','everykey','everykey'],['5','DocFinder','docfinder','docfinder'],['6','ModiPdf','modipdf','modipdf'],['0','Obsidian Hub','edunote','obsidian-hub']
];
const officialIconURLs=new Set((seed.picks||[]).map(item=>safeURL(item.icon)).filter(Boolean));
const workspaceImage=image=>officialIconURLs.has(safeURL(image))?safeURL(image):'';
export function siteFrom(raw=seed) {
 const fields=raw.fields||{}, links=raw.links||{};
 const programs=programMeta.map(([id,label,slug,logo])=>({id,label,slug,icon:logo?`assets/logo-${logo}.svg`:'',name:plain(fields[`project.${id}.name`]||label),desc:plain(fields[`project.${id}.desc`]||''),why:plain(fields[`project.${id}.why`]||''),status:plain(fields[`project.${id}.status`]||'in progress'),version:plain(fields[`project.${id}.version`]||''),url:safeURL(links[`project.${id}.url`]),github:safeURL(links[`project.${id}.github`])}));
 return {fields,links,programs,workflows:raw.workflows||[],channels:['youtube','threads','instagram','brunch','github','drive'].map(id=>({id,name:plain(fields[`channel.${id}.name`]||id),desc:plain(fields[`channel.${id}.desc`]||''),url:safeURL(links[`channel.${id}`])}))};
}
export function workspaceFrom(raw=seed) {
 const records=[...(raw.thoughts||[]).map(r=>({...r,kind:'생각'})),...(raw.devlog||[]).map(r=>({...r,kind:'개발일지'}))].map(r=>({id:r.id,date:r.at,title:plain(r.title||`${r.at} 개발일지`),body:plain(r.body),kind:r.kind}));
 const resources=(raw.picks||[]).map(r=>({id:r.id,area:'recommend',category:['pk-rhwp'].includes(r.id)?'문서·행정':r.id==='pk-recordly'?'영상·제작':'AI·개발',folder:r.kind==='service'?'서비스':'프로그램',name:plain(r.name),body:plain(r.desc),by:plain(r.by),url:safeURL(r.url),kind:r.kind==='skill'?'skill':'link',image:workspaceImage(r.icon)}));
 const drive=safeURL(raw.links?.['channel.drive']);
 if(drive)resources.push({id:'training-drive',area:'training',category:'공유 자료',folder:'자료실',name:'배포 중인 자료',body:'기존 홈페이지에서 공유하던 Google Drive 자료실입니다. 연수별 발표 자료와 실습 파일은 이곳에 연결해 추가할 수 있습니다.',by:'박승연',url:drive,kind:'folder',image:''});
 const note='작업실에 오신 것을 환영합니다.\n아래 Dock에서 도구를, 캘린더에서 그날의 기록을 만나보세요.';
 return {version:1,note,memos:[{id:'welcome-note',name:'방문자에게',text:note,checklist:[],color:'cream',x:0,y:.65}],records,resources,archives:[],projects:[],shortcuts:[],dockPrograms:[],workflowOverrides:normalizeWorkflowOverrides(raw.workflowOverrides),profile:normalizeProfile(raw.profile),schedules:normalizeSchedules(raw.schedules)};
}
const string = (v,max) => typeof v==='string' && v.length<=max;
const colors=new Set(['cream','blue','green','pink','lavender']);
const position=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1;
function normalizeWorkspace(raw){
 const d=structuredClone(raw||{}), fallback=string(d.note,2000)?d.note:'';
 if(!Array.isArray(d.memos))d.memos=[{id:'welcome-note',name:'방문자에게',text:fallback,checklist:[],color:'cream',x:0,y:.65}];
 d.memos=d.memos.map((m,index)=>({id:m?.id||`memo-${index}`,name:typeof m?.name==='string'?m.name:'메모',text:typeof m?.text==='string'?m.text:(index===0?fallback:''),checklist:(Array.isArray(m?.checklist)?m.checklist:[]).map(item=>typeof item==='string'?{text:item,done:false}:{text:item?.text,done:item?.done===true}),color:colors.has(m?.color)?m.color:'cream',x:position(m?.x)?m.x:.08,y:position(m?.y)?m.y:.08}));
 d.archives=Array.isArray(d.archives)?d.archives:[];
 d.projects=Array.isArray(d.projects)?d.projects:[];
 d.dockPrograms=Array.isArray(d.dockPrograms)?d.dockPrograms:[];
 d.workflowOverrides=normalizeWorkflowOverrides(d.workflowOverrides);
 d.profile=normalizeProfile(d.profile);
 d.schedules=normalizeSchedules(d.schedules);
 d.note=d.memos[0]?.text??fallback;
 return d;
}
export function validateWorkspace(d) {
 d=normalizeWorkspace(d);
 if(!d||d.version!==1||!string(d.note,2000))throw Error('올바른 작업실 백업 파일이 아닙니다.');
 for(const key of ['records','resources','archives','projects','shortcuts','dockPrograms'])if(!Array.isArray(d[key])||d[key].length>500)throw Error('항목 수가 허용 범위를 벗어났습니다.');
 d.workflowOverrides=validateWorkflowOverrides(d.workflowOverrides);
 d.profile=validateProfile(d.profile);
 d.schedules=validateSchedules(d.schedules);
 const ids=new Set();
 if(d.memos.length>100)throw Error('메모 수가 허용 범위를 벗어났습니다.');
 for(const memo of d.memos){
  if(!memo||!string(memo.id,100)||!memo.id||ids.has(memo.id)||!string(memo.name,80)||!memo.name.trim()||!string(memo.text,2000)||!Array.isArray(memo.checklist)||memo.checklist.length>100||!memo.checklist.every(item=>item&&string(item.text,300)&&typeof item.done==='boolean')||!colors.has(memo.color)||!position(memo.x)||!position(memo.y))throw Error('메모의 이름, 내용, 목록 또는 위치를 확인해주세요.');
  ids.add(memo.id);
 }
 for(const key of ['records','resources','archives','projects','shortcuts','dockPrograms'])for(const r of d[key]){
  if(!r||!string(r.id,100)||!r.id||ids.has(r.id))throw Error('항목 ID가 없거나 중복됩니다.'); ids.add(r.id);
  if(key==='records'){
   if(!string(r.title,160)||!r.title.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||new Date(r.date).toISOString().slice(0,10)!==r.date||!string(r.body,30000)||!['생각','개발일지','연수'].includes(r.kind))throw Error('기록의 날짜 또는 내용이 올바르지 않습니다.');
  }else{
   const optionalLink=key==='archives'||key==='projects';
   if(!string(r.name,100)||!r.name.trim()||!string(r.url||'',3000)||(!optionalLink&&!safeURL(r.url))||(optionalLink&&r.url&&!safeURL(r.url))||!['folder','link','sheet','skill'].includes(r.kind))throw Error(optionalLink?'이름과 링크 형식을 확인해주세요.':'이름과 https 링크를 확인해주세요.');
   if(r.image&&(!string(r.image,100000)||!(/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(r.image)||officialIconURLs.has(safeURL(r.image)))))throw Error('아이콘 형식이 올바르지 않습니다.');
   if((key==='resources'||key==='archives'||key==='projects')&&(!['training','recommend'].includes(r.area||'recommend')||!string(r.category,80)||!r.category.trim()||!string(r.folder,80)||!r.folder.trim()||!string(r.body,10000)||!string(r.by,100)))throw Error('자료의 분야와 폴더를 확인해주세요.');
  }
 }
 if(new TextEncoder().encode(JSON.stringify(d)).length>800000)throw Error('저장 용량을 초과했습니다. 아이콘이나 항목을 줄여주세요.');
 return structuredClone(d);
}
export {seed};
