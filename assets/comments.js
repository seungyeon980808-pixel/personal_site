const base='https://firestore.googleapis.com/v1/projects/edunote-96bd7/databases/(default)/documents';
const names='projects/edunote-96bd7/databases/(default)/documents';
const config={apiKey:'AIzaSyAbHRNi10RttJNoLJCuxZQHucwp5Vttn90',authDomain:'edunote-96bd7.firebaseapp.com',projectId:'edunote-96bd7'};
export const PAGE_SIZE=30;
let identity;
async function guest(){
 if(!identity)identity=(async()=>{
  const sdk='https://www.gstatic.com/firebasejs/12.14.0/';
  const [apps,auths]=await Promise.all([import(sdk+'firebase-app.js'),import(sdk+'firebase-auth.js')]);
  const app=apps.getApps().find(item=>item.name==='comment-guest')||apps.initializeApp(config,'comment-guest');
  const auth=auths.getAuth(app);await auth.authStateReady();
  return auth.currentUser||(await auths.signInAnonymously(auth)).user;
 })().catch(error=>{identity=null;throw error;});
 return identity;
}
async function post(path,body,token){
 const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error(response.status===403?'글은 1분에 한 번 남길 수 있습니다. 잠시 후 다시 시도해주세요.':'요청을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
 return response.json();
}
export function commentQuery(project,cursor=null){
 return {structuredQuery:{from:[{collectionId:'comments'}],where:{fieldFilter:{field:{fieldPath:'project'},op:'EQUAL',value:{stringValue:project}}},orderBy:[{field:{fieldPath:'createdAt'},direction:'DESCENDING'},{field:{fieldPath:'__name__'},direction:'DESCENDING'}],limit:PAGE_SIZE,...(cursor?{startAt:{values:[{timestampValue:cursor.date},{referenceValue:cursor.path}],before:false}}:{})}};
}
export async function commentPage(project,cursor=null){
 const rows=await post(':runQuery',commentQuery(project,cursor));
 const docs=rows.filter(row=>row.document).map(row=>row.document);
 const last=docs.at(-1);
 return {entries:docs.map(d=>({id:d.name.split('/').at(-1),name:d.fields.name?.stringValue||'',text:d.fields.text?.stringValue||'',reply:d.fields.reply?.stringValue||'',date:d.fields.createdAt?.timestampValue||''})),cursor:last?{path:last.name,date:last.fields.createdAt.timestampValue}:null,more:docs.length===PAGE_SIZE};
}
export async function createComment(project,name,text){
 const user=await guest(),id=crypto.randomUUID(),token=await user.getIdToken();
 const stamp=[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}];
 await post(':commit',{writes:[{update:{name:names+'/comments/'+id,fields:{project:{stringValue:project},name:{stringValue:name},text:{stringValue:text},authorId:{stringValue:user.uid}}},updateTransforms:stamp,currentDocument:{exists:false}},{update:{name:names+'/comment-cooldowns/'+user.uid,fields:{commentId:{stringValue:id}}},updateTransforms:[{fieldPath:'lastCreatedAt',setToServerValue:'REQUEST_TIME'}]}]},token);
}
