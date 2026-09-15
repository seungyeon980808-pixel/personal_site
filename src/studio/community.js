import {commentPage,createComment} from '../../assets/comments.js';
import {state,isAdmin,adminToken} from './store.js';
import {content} from './window.js';
import {escape as e,plain,safeURL} from './utils.js';

const root='https://firestore.googleapis.com/v1/projects/edunote-96bd7/databases/(default)/documents';
async function request(url,options={}){
 const response=await fetch(url,{...options,signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error(response.status===403?'방명록 저장 권한이 아직 활성화되지 않았습니다.':'요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
 return response.status===204?null:response.json();
}

export function guestbook(){
 content('방명록',`<section class="community-panel"><header><h1>방명록</h1><p class="muted">다녀간 흔적이나 짧은 인사를 남겨주세요.</p></header><form id="guestbook-form"><label>이름 또는 별명<input name="name" maxlength="30" required autocomplete="nickname"></label><label>남길 이야기<textarea name="text" maxlength="500" required rows="3"></textarea></label><div class="community-submit"><span class="muted">작성한 글은 모두에게 공개됩니다. · 최대 500자</span><button class="primary" type="submit">글 남기기</button></div><p role="status" id="guestbook-status"></p></form><div class="guestbook-toolbar"><h2>남겨주신 이야기</h2><button type="button" id="guestbook-refresh" aria-label="방명록 새로고침">새로고침</button></div><div id="guestbook-list" aria-live="polite">불러오는 중입니다.</div></section>`);
 const form=document.querySelector('#guestbook-form'),list=document.querySelector('#guestbook-list'),status=document.querySelector('#guestbook-status');
 let reading=false,cursor=null,more=false;
 const next=document.createElement('button');next.type='button';next.textContent='더 보기';next.hidden=true;list.after(next);next.onclick=()=>refresh(true);
 async function refresh(append=false){
  if(reading)return;reading=true;next.disabled=true;
  try{
   const page=await commentPage('guestbook',append?cursor:null);
   if(!list.isConnected)return;
   const entries=page.entries;cursor=page.cursor;more=page.more;next.hidden=!more;
   const previous=append?list.innerHTML:'';
   list.innerHTML=previous+(entries.length?entries.map(item=>`<article class="guestbook-entry"><header><strong>${e(item.name)}</strong><time>${e(item.date?new Date(item.date).toLocaleDateString('ko-KR'):'')}</time>${isAdmin()?`<button type="button" class="admin-only" data-delete-entry="${e(item.id)}" aria-label="${e(item.name)}의 방명록 삭제">삭제</button>`:''}</header><p>${e(item.text)}</p></article>`).join(''):'<p class="muted">아직 남겨진 글이 없습니다. 첫 인사를 남겨주세요.</p>');
   list.querySelectorAll('[data-delete-entry]').forEach(button=>button.onclick=async()=>{
    if(!isAdmin()||!confirm('이 방명록 글을 삭제할까요?'))return;
    button.disabled=true;
    try{const token=await adminToken();await request(root+'/comments/'+encodeURIComponent(button.dataset.deleteEntry),{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});await refresh();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
   });
  }catch{if(list.isConnected)list.innerHTML='<p class="muted">방명록을 불러오지 못했습니다. 새로고침으로 다시 시도해주세요.</p>';}
  finally{reading=false;next.disabled=false;}
 }
 document.querySelector('#guestbook-refresh').onclick=()=>refresh();
 form.onsubmit=async event=>{
  event.preventDefault();const data=new FormData(form),name=String(data.get('name')).trim(),text=String(data.get('text')).trim();
  if(!name||!text){status.textContent='이름과 내용을 입력해주세요.';return;}
  if(name.length>30||text.length>500){status.textContent='이름은 30자, 내용은 500자 이내로 입력해주세요.';return;}
  const button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent='등록 중입니다.';
  try{
   await createComment('guestbook',name,text);
   if(!form.isConnected)return;form.elements.text.value='';status.textContent='글이 등록되었습니다.';await refresh();
  }catch(error){if(form.isConnected)status.textContent=error.message;}
  finally{button.disabled=false;}
 };
 refresh();
}

export function contact(){
 const fields=state.site.fields,email=plain(fields['contact.email']).trim(),kakao=plain(fields['contact.kakao']).trim(),phone=plain(fields['contact.phone']).trim(),chat=safeURL(plain(fields['contact.openchat']));
 const emailHref=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?'mailto:'+encodeURIComponent(email).replace('%40','@'):'';
 const phoneHref=/^\+?[\d\s()-]{7,24}$/.test(phone)?'tel:'+phone.replace(/[^+\d]/g,''):'';
 const row=(label,value,action)=>`<div class="contact-row"><div><span class="muted">${label}</span><strong>${e(value)}</strong></div>${action}</div>`;
 content('연락하기',`<section class="community-panel contact-panel"><h1>연락하기</h1><p class="muted">프로그램 이야기, 연수 문의, 함께 해보고 싶은 일까지.</p>${email?row('이메일',email,emailHref?`<a class="secondary" href="${e(emailHref)}">메일 쓰기</a>`:''):''}${kakao?row('카카오톡 ID',kakao,'<button class="secondary" id="copy-kakao">ID 복사</button>'):''}${chat?row('카카오톡','오픈채팅',`<a class="secondary" href="${e(chat)}" target="_blank" rel="noopener noreferrer">대화 열기 ↗</a>`):''}${phoneHref?row('전화',phone,`<a class="secondary" href="${e(phoneHref)}">전화하기</a>`):''}${!email&&!kakao&&!chat&&!phoneHref?'<p>연락처를 준비하고 있습니다.</p>':''}<p role="status" id="contact-status"></p></section>`);
 const copy=document.querySelector('#copy-kakao');if(copy)copy.onclick=async()=>{const status=document.querySelector('#contact-status');try{await navigator.clipboard.writeText(kakao);status.textContent='카카오톡 ID를 복사했습니다.';}catch{status.textContent='복사하지 못했습니다. 위의 ID를 직접 선택해 복사해주세요.';}};
}
