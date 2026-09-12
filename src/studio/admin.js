import {state,update,isAdmin,login,logout,publish,discard,refresh,editDraft} from './store.js';
import {$,escape as e,day,toast,download} from './utils.js';
import {validateWorkspace} from './data.js';
import {content,open} from './window.js';
import {routeButton} from './views.js';
const tabs={note:'메모',records:'기록',resources:'추천·연수 자료',shortcuts:'바로가기'};
const input=(name,label,value='',type='text',max=100)=>`<label>${label}<input name="${name}" type="${type}" value="${e(value)}" maxlength="${max}" required></label>`;
const select=(name,label,options,value)=>`<label>${label}<select name="${name}">${options.map(([v,n])=>`<option value="${v}" ${value===v?'selected':''}>${n}</option>`).join('')}</select></label>`;
const textarea=(name,label,value='',max=10000)=>`<label>${label}<textarea name="${name}" maxlength="${max}">${e(value)}</textarea></label>`;
export function admin(route={}){
 const tab=tabs[route.tab]?route.tab:'note';const list=tab==='note'?[]:state.workspace[tab];const selected=list.find(r=>r.id===route.id);
 content('작업실 관리',`<div class="admin-layout"><aside class="admin-sidebar"><p class="eyebrow">CONTENT STUDIO</p>${Object.entries(tabs).map(([id,label])=>routeButton({view:'admin',tab:id},label,`row ${id===tab?'selected':''}`)).join('')}<a class="row" href="classic.html" target="_blank" rel="noopener">프로그램·소개 편집 ↗</a></aside><section class="admin-main"><div class="admin-heading"><div><h1>${tabs[tab]}</h1><p class="muted">초안은 이 브라우저에 저장됩니다. 공개 게시 전에는 방문자에게 보이지 않습니다.</p></div><span class="badge">${isAdmin()?'관리자 연결됨':'로컬 초안'}</span></div><div class="admin-toolbar"><button data-admin="export">백업 내려받기</button><label class="file-button">백업 불러오기<input id="import-file" type="file" accept="application/json,.json"></label><button data-admin="discard">초안 버리기</button>${isAdmin()?'<button data-admin="logout">로그아웃</button>':'<button data-admin="login">Google 관리자 로그인</button>'}<button class="primary" data-admin="publish" ${isAdmin()?'':'disabled'}>공개 게시</button></div><p id="admin-status" role="status"></p>${tab==='note'?`<form id="editor-form">${textarea('note','방문자에게 남기는 메모',state.workspace.note,2000)}<button class="primary">초안 저장</button></form>`:`<div class="editor-split"><div class="edit-list">${routeButton({view:'admin',tab,area:route.area},'새 항목 추가 +','secondary')}${list.map(r=>routeButton({view:'admin',tab,id:r.id},`<strong>${e(r.title||r.name)}</strong><small>${e(r.date||r.category||r.url)}</small>`,`row ${selected?.id===r.id?'selected':''}`)).join('')}</div><form id="editor-form">${fields(tab,selected,route)}<div class="actions"><button class="primary">초안 저장</button>${selected?'<button type="button" class="danger" id="delete-item">삭제</button>':''}</div><p id="form-error" role="alert"></p></form></div>`}</section></div>`);
 bindForm(tab,selected,route);
 $('#import-file').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>800000)throw Error('백업 파일이 너무 큽니다.');const parsed=validateWorkspace(JSON.parse(await file.text()));if(!confirm('현재 초안을 이 백업 내용으로 바꿀까요?'))return;update(parsed);open({view:'admin',tab},true);toast('백업을 초안으로 불러왔습니다.');}catch(err){toast(err.message);}};
 document.querySelectorAll('[data-admin]').forEach(button=>button.onclick=async()=>{
  const action=button.dataset.admin;button.disabled=true;const status=$('#admin-status');status.textContent='처리 중…';
  try{
   if(action==='export'){download(state.workspace);status.textContent='백업을 내려받았습니다.';}
   if(action==='login'){await login();open({view:'admin',tab},true);toast('관리자 계정이 연결되었습니다.');}
   if(action==='logout'){await logout();open({view:'admin',tab},true);}
   if(action==='discard'&&confirm('저장한 로컬 초안을 버리고 공개 내용으로 돌아갈까요?')){discard();await refresh();editDraft();open({view:'admin',tab},true);toast('공개 내용을 다시 불러왔습니다.');}
   if(action==='publish'&&confirm('현재 저장된 초안을 공개 게시할까요? 모든 방문자에게 반영됩니다.')){await publish();open({view:'about'});toast('공개 게시되었습니다.');}
  }catch(err){status.textContent=err.message;}finally{button.disabled=false;if(status.textContent==='처리 중…')status.textContent='';}
 });
}
function fields(tab,r={},route){r=r||{};
 if(tab==='records')return input('date','날짜',r.date||route.date||day(),'date')+input('title','제목',r.title,'text',160)+select('kind','종류',[['생각','생각'],['개발일지','개발일지'],['연수','연수']],r.kind||'개발일지')+textarea('body','내용',r.body,30000);
 let html=input('name','이름',r.name)+input('url','연결 주소',r.url,'url',3000);
 if(tab==='resources')html=select('area','자료실',[['recommend','추천 도구함'],['training','연수 자료']],r.area||route.area||'recommend')+input('category','분야',r.category||'AI·개발','text',80)+input('folder','폴더 이름',r.folder||'프로그램','text',80)+html+textarea('body','소개 · 사용법 · 설치 안내',r.body)+`<label>제작자 · 작성자<input name="by" value="${e(r.by||'')}" maxlength="100"></label>`;
 return html+select('kind','아이콘 종류',[['link','링크'],['sheet','스프레드시트'],['folder','폴더'],['skill','스킬']],r.kind||'link')+`<label>직접 고른 아이콘<input name="image" type="file" accept="image/png,image/jpeg,image/webp"></label><p class="muted">PNG·JPEG·WebP 이미지를 선택하면 작은 아이콘으로 최적화합니다.</p>${r.image?'<label class="checkbox"><input type="checkbox" name="removeImage"> 기존 아이콘 지우기</label>':''}`;
}
function bindForm(tab,selected,route){
 $('#editor-form').onsubmit=async event=>{
  event.preventDefault();const form=event.target,button=form.querySelector('button[type="submit"],button.primary');button.disabled=true;
  try{const data=new FormData(form),next=structuredClone(state.workspace);
   if(tab==='note')next.note=String(data.get('note'));
   else{
    const keys=tab==='records'?['date','title','body','kind']:tab==='resources'?['area','category','folder','name','url','body','by','kind']:['name','url','kind'];
    const item={id:selected?.id||crypto.randomUUID(),...Object.fromEntries(keys.map(k=>[k,String(data.get(k)||'').trim()]))};
    if(tab!=='records'){item.image=data.get('removeImage')?'':selected?.image||'';const file=data.get('image');if(file?.size)item.image=await shrinkIcon(file);}
    const index=next[tab].findIndex(r=>r.id===item.id);if(index<0)next[tab].push(item);else next[tab][index]=item;route={...route,id:item.id};
   }
   update(next);if(form.isConnected&&$('#workspace-window').open)open({...route,view:'admin',tab},true);toast('초안을 저장했습니다.');
  }catch(err){($('#form-error')||$('#admin-status')).textContent=err.message;}finally{button.disabled=false;}
 };
 if($('#delete-item'))$('#delete-item').onclick=()=>{if(!confirm('이 항목을 초안에서 삭제할까요?'))return;const next=structuredClone(state.workspace);next[tab]=next[tab].filter(r=>r.id!==selected.id);try{update(next);open({view:'admin',tab},true);toast('초안에서 삭제했습니다.');}catch(err){toast(err.message);}};
}
async function shrinkIcon(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error('10MB 이하의 PNG·JPEG·WebP 이미지를 선택해주세요.');
 const bitmap=await createImageBitmap(file);const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');const ratio=Math.min(128/bitmap.width,128/bitmap.height);ctx.drawImage(bitmap,(128-bitmap.width*ratio)/2,(128-bitmap.height*ratio)/2,bitmap.width*ratio,bitmap.height*ratio);bitmap.close();return canvas.toDataURL('image/webp',.86);
}
