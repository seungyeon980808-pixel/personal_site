import {siteFrom,workspaceFrom,validateWorkspace} from './data.js';
import {readLocal,writeLocal} from './utils.js';
const config={apiKey:'AIzaSyAbHRNi10RttJNoLJCuxZQHucwp5Vttn90',authDomain:'edunote-96bd7.firebaseapp.com',projectId:'edunote-96bd7',appId:'1:769455023609:web:3cdaa733ef3bf47aaa0928'};
const base='https://firestore.googleapis.com/v1/projects/edunote-96bd7/databases/(default)/documents/personal-site/';
const owner='seungyeon980808@gmail.com', draftKey='studio-draft-v1';
let sdk,user=null,revision,loaded=false,publicWorkspace=workspaceFrom(),draftBase=null,draftBaseKnown=false;
export const state={site:siteFrom(),workspace:workspaceFrom(),draft:false,editor:false};
const notify=()=>document.dispatchEvent(new CustomEvent('studio:change'));
function decode(v){if(v.mapValue)return decodeFields(v.mapValue.fields||{});if(v.arrayValue)return(v.arrayValue.values||[]).map(decode);return v.stringValue??v.booleanValue??(v.integerValue?Number(v.integerValue):null);}
function decodeFields(f){return Object.fromEntries(Object.entries(f).map(([k,v])=>[k,decode(v)]));}
function encode(v){if(typeof v==='string')return{stringValue:v};if(typeof v==='number')return{integerValue:String(v)};if(Array.isArray(v))return{arrayValue:{values:v.map(encode)}};return{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)]))}};}
async function readContent(){
 const endpoint=base.slice(0,base.indexOf('/documents/'))+'/documents:batchGet';
 const prefix='projects/edunote-96bd7/databases/(default)/documents/personal-site/';
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documents:[prefix+'main',prefix+'desktop-v1']}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('공개 내용을 불러오지 못했습니다.');
 const docs=await response.json();
 if(!Array.isArray(docs))throw Error('서버 응답을 확인할 수 없습니다.');
 return Object.fromEntries(docs.map(item=>[(item.found?.name||item.missing).split('/').at(-1),item.found||null]));
}
export async function refresh(){
 try{
  const docs=await readContent();
  if(docs.main){const main=decodeFields(docs.main.fields||{});state.site=siteFrom(main);publicWorkspace=workspaceFrom(main);}
  if(!Object.hasOwn(docs,'desktop-v1'))throw Error('작업실 저장 상태를 확인하지 못했습니다.');
  const doc=docs['desktop-v1'];revision=doc?.updateTime||null;
  if(doc)publicWorkspace=validateWorkspace(decodeFields(doc.fields||{}));loaded=true;
  if(!state.draft)state.workspace=structuredClone(publicWorkspace);notify();return true;
 }catch{loaded=false;notify();return false;}
}
export function editDraft(){
 const stored=readLocal(draftKey);
 if(stored){state.workspace=validateWorkspace(stored.workspace||stored);draftBase=stored.baseRevision??null;draftBaseKnown=stored.baseKnown===true;}else{state.workspace=structuredClone(publicWorkspace);draftBase=revision??null;draftBaseKnown=loaded;}
 state.draft=true;state.editor=true;notify();
}
export function update(workspace){
 const checked=validateWorkspace(workspace);writeLocal(draftKey,{workspace:checked,baseRevision:draftBase,baseKnown:draftBaseKnown});state.workspace=checked;state.draft=true;notify();
}
export function previewPublic(){state.workspace=structuredClone(publicWorkspace);state.draft=false;state.editor=false;notify();}
export function discard(){localStorage.removeItem(draftKey);previewPublic();}
export function isAdmin(){return user?.email===owner&&user.emailVerified===true;}
async function authSdk(){
 if(!sdk){sdk=(async()=>{const version='https://www.gstatic.com/firebasejs/12.14.0/';const [app,a]=await Promise.all([import(version+'firebase-app.js'),import(version+'firebase-auth.js')]);const auth=a.getAuth(app.initializeApp(config,'desktop'));await auth.authStateReady();user=auth.currentUser;a.onAuthStateChanged(auth,u=>{user=u;notify();});return{a,auth};})();}
 return sdk;
}
export async function login(){const {a,auth}=await authSdk();const credential=await a.signInWithPopup(auth,new a.GoogleAuthProvider());user=credential.user;if(!isAdmin()){await a.signOut(auth);throw Error('등록된 관리자 계정으로 로그인해주세요.');}notify();}
export async function logout(){const {a,auth}=await authSdk();await a.signOut(auth);user=null;notify();}
export async function publish(){
 if(!isAdmin())throw Error('관리자 로그인이 필요합니다.');
 if(!loaded||!draftBaseKnown)throw Error('이 초안의 서버 기준을 확인하지 못했습니다. 백업을 내려받고 공개 내용을 다시 불러온 뒤 적용해주세요.');
 const d=validateWorkspace(state.workspace), token=await user.getIdToken();
 const params=new URLSearchParams({key:config.apiKey});
 if(draftBase)params.set('currentDocument.updateTime',draftBase);else params.set('currentDocument.exists','false');
 const r=await fetch(base+'desktop-v1?'+params,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(encode(d).mapValue)});
 if(!r.ok){if([409,412].includes(r.status))throw Error('다른 곳에서 내용이 수정되었습니다. 백업을 내려받고 공개 내용을 새로 불러온 뒤 다시 적용해주세요.');throw Error(`게시하지 못했습니다 (${r.status}). 로그인과 저장 권한을 확인해주세요.`);}
 const doc=await r.json();revision=doc.updateTime;publicWorkspace=d;localStorage.removeItem(draftKey);state.draft=false;state.editor=false;state.workspace=structuredClone(d);notify();
}
