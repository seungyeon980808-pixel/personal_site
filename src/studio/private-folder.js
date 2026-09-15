import {isAdmin,adminToken} from './store.js';
import {content,currentRoute,close} from './window.js';
import {$,escape as e,safeURL} from './utils.js';
const endpoint='https://firestore.googleapis.com/v1/projects/edunote-96bd7/databases/(default)/documents/private-workspaces/owner';
let generation=0;
document.addEventListener('studio:change',()=>{if(!isAdmin()){generation++;if(currentRoute()?.view==='private')close();}});
export async function privateFolder(){
 if(!isAdmin()){content('비밀 폴더','<p class="page">관리자 로그인이 필요합니다.</p>');return;}
 const ticket=++generation;
 const active=()=>ticket===generation&&isAdmin()&&currentRoute()?.view==='private';
 content('비밀 폴더','<p class="page">작업 공간을 불러오고 있습니다.</p>');
 try{
  const headers={Authorization:`Bearer ${await adminToken()}`};
  if(!active())return;
  const response=await fetch(endpoint,{headers,cache:'no-store'});
  if(!active())return;
  if(response.status!==404&&!response.ok)throw Error('비밀 폴더에 접근할 수 없습니다. 관리자 저장 권한을 확인해주세요.');
  const document=response.status===404?null:await response.json();
  if(!active())return;
  let items=document?JSON.parse(document.fields.items.stringValue):[],revision=document?.updateTime;
  if(!Array.isArray(items))throw Error('저장된 작업 내용을 확인할 수 없습니다.');
  function draw(selected){
   if(!active())return;
   content('비밀 폴더',`<section class="page private-space"><p>관리자 전용 작업 공간 · 메모와 작업 링크를 보관하세요.</p><div class="private-grid"><div><button id="private-new" class="primary">새 작업</button><ul>${items.map(item=>`<li><button data-private-id="${e(item.id)}">${e(item.title)}</button></li>`).join('')||'<li>아직 저장한 작업이 없습니다.</li>'}</ul></div><form id="private-form"><label>작업 이름<input name="title" required maxlength="100" value="${e(selected?.title||'')}"></label><label>작업 링크<input name="url" type="url" placeholder="https://" maxlength="2000" value="${e(selected?.url||'')}"></label><label>메모<textarea name="note" rows="9" maxlength="20000">${e(selected?.note||'')}</textarea></label><div class="private-actions"><button class="primary" type="submit">저장</button>${selected?'<button type="button" id="private-delete">삭제</button>':''}${safeURL(selected?.url)?`<a href="${e(safeURL(selected.url))}" target="_blank" rel="noopener noreferrer">작업 열기 ↗</a>`:''}</div><p id="private-status" role="status"></p></form></div></section>`);
   $('#private-new').onclick=()=>draw();
   documentQuery('[data-private-id]').forEach(button=>button.onclick=()=>draw(items.find(item=>item.id===button.dataset.privateId)));
   async function save(next){
    const form=$('#private-form'),status=$('#private-status');
    form.querySelectorAll('button').forEach(button=>button.disabled=true);
    try{
     if(next.length>100)throw Error('작업은 최대 100개까지 보관할 수 있습니다.');
     const payload=JSON.stringify(next);
     if(new TextEncoder().encode(payload).length>500000)throw Error('메모 저장 용량을 초과했습니다.');
     const token=await adminToken();if(!active())return;
     const condition=revision?`currentDocument.updateTime=${encodeURIComponent(revision)}`:'currentDocument.exists=false';
     const result=await fetch(`${endpoint}?${condition}`,{method:'PATCH',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({fields:{items:{stringValue:payload}}})});
     if(!active())return;
     if(!result.ok)throw Error(result.status===409||result.status===412?'다른 창에서 내용이 변경되었습니다. 폴더를 다시 열어주세요.':'저장하지 못했습니다. 권한과 연결 상태를 확인해주세요.');
     revision=(await result.json()).updateTime;if(!active())return;
     items=next;draw(next.find(item=>item.id===selected?.id));$('#private-status').textContent='저장했습니다.';
    }catch(error){if(active())status.textContent=error.message;}finally{if(active())form.querySelectorAll('button').forEach(button=>button.disabled=false);}
   }
   $('#private-form').onsubmit=event=>{event.preventDefault();const data=new FormData(event.target),url=data.get('url').trim(),title=data.get('title').trim();if(!title||url&&!safeURL(url)){$('#private-status').textContent='작업 이름과 올바른 웹 주소를 입력해주세요.';return;}const item={id:selected?.id||crypto.randomUUID(),title,url,note:data.get('note')};save([...items.filter(row=>row.id!==item.id),item]);};
   const remove=$('#private-delete');if(remove)remove.onclick=()=>{if(confirm('이 작업을 삭제할까요?'))save(items.filter(item=>item.id!==selected.id));};
  }
  draw();
 }catch(error){if(active())content('비밀 폴더',`<p class="page" role="alert">${e(error.message)}</p>`);}
}
function documentQuery(selector){return globalThis.document.querySelectorAll(selector);}
