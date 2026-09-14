import {state,update,isAdmin,login,logout,publish,discard,refresh,editDraft,restoreAuth} from './store.js';
import {$,escape as e,toast,download} from './utils.js';
import {validateWorkspace} from './data.js';
import {content,open} from './window.js';
import {routeButton} from './views.js';
import {resolvedWorkflows} from './workflow-data.js';
import {workflowEditor,bindWorkflowEditor} from './workflow-editor.js';
const tabs={dockPrograms:'Dock 프로그램',memos:'메모',resources:'자료',archives:'자료 아카이브',projects:'프로젝트 분류',workflows:'프로젝트',shortcuts:'바로가기'};
const input=(name,label,value='',type='text',max=100)=>`<label>${label}<input name="${name}" type="${type}" value="${e(value)}" maxlength="${max}" required></label>`;
const select=(name,label,options,value)=>`<label>${label}<select name="${name}">${options.map(([v,n])=>`<option value="${v}" ${value===v?'selected':''}>${n}</option>`).join('')}</select></label>`;
const textarea=(name,label,value='',max=10000)=>`<label>${label}<textarea name="${name}" maxlength="${max}">${e(value)}</textarea></label>`;
const message=()=>$('#admin-status');

export async function admin(route={}){
 content('작업실 설정','<div class="settings-panel"><p class="muted">설정 상태를 확인하고 있습니다.</p></div>');
 await restoreAuth();
 if(!isAdmin())return access();
 if((route.tab||'settings')==='settings')return settings();
 const tab=tabs[route.tab]?route.tab:'note';
 if(!state.editor)editDraft();
 if(tab==='workflows')return workflowAdmin(route);
 const area=route.area==='training'?'training':'recommend';
 const list=tab==='resources'?state.workspace.resources.filter(item=>item.area===area):state.workspace[tab]||[],selected=list.find(r=>r.id===route.id);
 const label=tab==='resources'?(area==='training'?'연수 자료':'추천 도구함'):tabs[tab];
 const returnRoute=tab==='resources'?{view:area==='training'?'training':'recommend',category:route.category,folder:route.folder}:tab==='memos'?{view:'note',id:route.id}:tab==='archives'?{view:'archives',category:route.category,folder:route.folder}:tab==='projects'?{view:'workflows',category:route.category,folder:route.folder}:{view:'programs'};
 if(tab==='resources'&&route.id&&!selected){content(`${label} 편집`,`<div class="context-editor"><header class="editor-heading">${routeButton(returnRoute,'돌아가기','text')}<div><p class="eyebrow">OWNER EDITOR</p><h1>${label} 편집</h1></div></header><p role="alert">이 자료실의 항목이 아닙니다.</p></div>`);return;}
 content(`${label} 편집`, `<div class="context-editor"><header class="editor-heading">${routeButton(returnRoute,'돌아가기','text')}<div><p class="eyebrow">OWNER EDITOR</p><h1>${label} 편집</h1><p class="muted">이 브라우저의 초안으로 저장됩니다.</p></div></header><div class="editor-split"><div class="edit-list">${routeButton({view:'admin',tab,area,category:route.category,folder:route.folder},`${label} 새 항목 +`,'secondary admin-only')}${list.map(r=>routeButton({view:'admin',tab,id:r.id,area,category:r.category,folder:r.folder},`<strong>${e(r.title||r.name)}</strong><small>${e(r.date||r.category||r.url)}</small>`,`row ${selected?.id===r.id?'selected':''}`)).join('')}</div><form id="editor-form">${fields(tab,selected,{...route,area})}<div class="actions"><button class="primary admin-only">초안 저장</button>${selected?'<button type="button" class="danger admin-only" id="delete-item">삭제</button>':''}</div><p id="form-error" role="alert"></p></form></div></div>`);
 bindForm(tab,selected,route);
}

function workflowAdmin(route){
 const workflows=resolvedWorkflows(state.site.workflows,state.workspace.workflowOverrides),selected=workflows.find(item=>item.id===route.id)||workflows[0];
 if(!selected){content('프로젝트 편집','<div class="page"><p>편집할 프로젝트가 없습니다.</p></div>');return;}
 const context={category:route.category||selected.tag,folder:route.folder||selected.name};
 content('프로젝트 편집',`<div class="context-editor"><header class="editor-heading">${routeButton({view:'workflows',...context},'프로젝트로 돌아가기','text')}<div><p class="eyebrow">OWNER EDITOR</p><h1>프로젝트 편집</h1><p class="muted">기존 프로젝트 ID를 유지한 채 초안에 저장됩니다.</p></div></header><div class="editor-split"><div class="edit-list">${workflows.map(item=>routeButton({view:'admin',tab:'workflows',id:item.id,category:item.tag,folder:item.name},`<strong>${e(item.name)}</strong><small>${e(item.tag)}</small>`,`row ${selected.id===item.id?'selected':''}`)).join('')}</div><form id="editor-form">${workflowEditor(selected,state.site.programs)}</form></div></div>`);
 bindWorkflowEditor($('#editor-form'),selected,state.site.programs,{...context});
}

function access(){
 content('작업실 설정',`<div class="settings-panel"><p class="eyebrow">ACCOUNT</p><h1>작업실 설정</h1><p>공개 화면을 보고 있습니다. 소유자 계정으로 로그인하면 초안, 백업, 게시 기능을 사용할 수 있습니다.</p><button class="admin-only" data-admin="login">Google 관리자 로그인</button><p id="admin-status" role="status"></p></div>`);
 $('[data-admin="login"]').onclick=async event=>{
  const button=event.currentTarget,status=message();button.disabled=true;
  status.textContent='Google 로그인 창에서 등록된 관리자 계정을 선택해주세요.';
  const help=setTimeout(()=>{if(status.isConnected)status.textContent='로그인 창이 보이지 않으면 이 주소를 Aside, Chrome 또는 Safari에서 열어 로그인해주세요. 앱 내부 미리보기에서는 인증 팝업이 진행되지 않을 수 있습니다.';},8000);
  try{await login();if(button.isConnected)await admin({tab:'settings'});toast('관리자 계정이 연결되었습니다.');}
  catch(err){
   const code=String(err.code||err.message||'');
   const text=code.includes('popup-closed-by-user')?'로그인이 완료되기 전에 창이 닫혔습니다. 창이 나타나지 않았다면 일반 브라우저에서 이 주소를 열어주세요.':code.includes('popup-blocked')?'로그인 창이 차단되었습니다. 일반 브라우저에서 이 주소를 열어 다시 로그인해주세요.':code.includes('unauthorized-domain')?'이 주소는 Google 로그인에 등록되지 않았습니다. 등록된 사이트 주소에서 다시 시도해주세요.':err.message;
   if(status.isConnected)status.textContent=text;else toast(text);
  }finally{clearTimeout(help);if(button.isConnected)button.disabled=false;}
 };

}

function settings(){
 content('작업실 설정',`<div class="settings-panel"><p class="eyebrow">ACCOUNT · BACKUP · PUBLISH</p><h1>작업실 설정</h1><p class="muted">관리자 계정으로 연결됨</p><div class="settings-actions">${state.editor?'':'<button class="admin-only" data-admin="begin">초안 편집 시작</button>'}<button class="admin-only" data-admin="export">백업 내려받기</button><label class="file-button admin-only">백업 불러오기<input id="import-file" type="file" accept="application/json,.json"></label>${state.draft?'<button class="admin-only" data-admin="discard">초안 버리기</button>':''}<button class="admin-only" data-admin="logout">로그아웃</button><button class="primary admin-only" data-admin="publish" ${state.draft?'':'disabled'}>공개 게시</button></div><p id="admin-status" role="status"></p>${state.draft?'<p class="draft-note">현재 초안은 이 브라우저에만 저장되어 있습니다.</p>':'<p class="muted">편집을 시작하면 공개 내용에서 분리된 초안을 만듭니다.</p>'}</div>`);
 document.querySelectorAll('[data-admin]').forEach(button=>button.onclick=()=>handleSetting(button.dataset.admin));
 $('#import-file').onchange=importBackup;
}

async function handleSetting(action){
 try{
  if(action==='begin'){editDraft();return open({view:'settings'},true);}
  if(action==='export'){download(state.workspace);message().textContent='백업을 내려받았습니다.';}
  if(action==='logout'){await logout();return open({view:'settings'},true);}
  if(action==='discard'&&confirm('저장한 로컬 초안을 버리고 공개 내용으로 돌아갈까요?')){discard();await refresh();return open({view:'settings'},true);}
  if(action==='publish'&&confirm('현재 저장된 초안을 공개 게시할까요? 모든 방문자에게 반영됩니다.')){await publish();open({view:'about'});toast('공개 게시되었습니다.');}
 }catch(err){message().textContent=err.message;}
}
async function importBackup(event){
 try{const file=event.target.files[0];if(!file)return;if(file.size>800000)throw Error('백업 파일이 너무 큽니다.');const parsed=validateWorkspace(JSON.parse(await file.text()));if(!confirm('현재 초안을 이 백업 내용으로 바꿀까요?'))return;editDraft();update(parsed);open({view:'settings'},true);toast('백업을 초안으로 불러왔습니다.');}catch(err){message().textContent=err.message;}}
function fields(tab,r={},route){r=r||{};
 if(tab==='memos')return input('name','메모 이름',r.name||'새 메모','text',80)+textarea('text',r.name==='방문자에게'?'방문자에게 남기는 메모':'메모 내용',r.text,2000)+textarea('checklist','체크리스트 (한 줄에 하나)',(r.checklist||[]).map(item=>item.text||item).join('\n'),30000)+select('color','메모 색상',[['cream','크림'],['blue','파랑'],['green','초록'],['pink','분홍'],['lavender','보라']],r.color||'cream');
 let html=input('name','이름',r.name)+input('url','연결 주소',r.url,'url',3000);
 if(tab==='resources'||tab==='archives'||tab==='projects'){const link=tab==='resources'?input('url','연결 주소',r.url,'url',3000):`<label>연결 주소 (선택)<input name="url" type="url" value="${e(r.url||'')}" maxlength="3000"></label>`;html=input('category','분야',r.category||route.category||'AI·개발','text',80)+input('folder','폴더 이름',r.folder||route.folder||'프로젝트','text',80)+input('name','이름',r.name)+link+textarea('body','소개 · 사용법 · 설치 안내',r.body)+`<label>제작자 · 작성자<input name="by" value="${e(r.by||'')}" maxlength="100"></label>`;}
 return html+select('kind','아이콘 종류',[['link','링크'],['sheet','스프레드시트'],['folder','외부 폴더'],['skill','스킬']],r.kind||'link')+`<label>직접 고른 아이콘<input name="image" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="muted">PNG·JPEG·WebP 이미지를 선택하면 작은 아이콘으로 최적화합니다.</p>${r.image?'<label class="checkbox"><input type="checkbox" name="removeImage"> 기존 아이콘 지우기</label>':''}`;
}
function bindForm(tab,selected,route){
 $('#editor-form').onsubmit=async event=>{event.preventDefault();const form=event.target,button=form.querySelector('button[type="submit"],button.primary');button.disabled=true;
  try{const data=new FormData(form),next=structuredClone(state.workspace);
   const keys=tab==='resources'||tab==='archives'||tab==='projects'?['category','folder','name','url','body','by','kind']:tab==='memos'?['name','text','color']:['name','url','kind'];const item={id:selected?.id||crypto.randomUUID(),...Object.fromEntries(keys.map(k=>[k,String(data.get(k)||'').trim()]))};if(tab==='memos'){const previous=new Map((selected?.checklist||[]).map(entry=>[entry.text,entry.done]));item.checklist=String(data.get('checklist')||'').split('\n').map(value=>value.trim()).filter(Boolean).map(text=>({text,done:previous.get(text)===true}));const offset=Math.min(.8,next.memos.length*.12);item.x=selected?.x??offset;item.y=selected?.y??offset;next.note=item.id===next.memos[0]?.id?item.text:next.note;}else{item.image=data.get('removeImage')?'':selected?.image||'';const file=data.get('image');if(file?.size)item.image=await shrinkIcon(file);item.area=tab==='resources'?(route.area==='training'?'training':'recommend'):'recommend';}const index=next[tab].findIndex(r=>r.id===item.id);if(index<0)next[tab].push(item);else next[tab][index]=item;route={...route,id:item.id,category:item.category,folder:item.folder};
   update(next);if(form.isConnected&&$('#workspace-window').open)open({...route,view:'admin',tab},true);toast('초안을 저장했습니다.');
  }catch(err){($('#form-error')||message()).textContent=err.message;}finally{button.disabled=false;}
 };
 if($('#delete-item'))$('#delete-item').onclick=()=>{if(!confirm('이 항목을 초안에서 삭제할까요?'))return;const next=structuredClone(state.workspace);next[tab]=next[tab].filter(r=>r.id!==selected.id);try{update(next);open({view:'admin',tab,area:route.area,category:route.category,folder:route.folder},true);toast('초안에서 삭제했습니다.');}catch(err){toast(err.message);}};
}
async function shrinkIcon(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error('10MB 이하의 PNG·JPEG·WebP 이미지를 선택해주세요.');
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');const ratio=Math.min(128/bitmap.width,128/bitmap.height);ctx.drawImage(bitmap,(128-bitmap.width*ratio)/2,(128-bitmap.height*ratio)/2,bitmap.width*ratio,bitmap.height*ratio);bitmap.close();return canvas.toDataURL('image/webp',.86);
}
