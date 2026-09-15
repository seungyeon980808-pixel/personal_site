import test from 'node:test';
import assert from 'node:assert/strict';
const project='demo-personal-site-rules';
const host=process.env.FIRESTORE_EMULATOR_HOST;
if(!host)throw Error('Run through the Firestore emulator; production requests are prohibited.');
const root=`projects/${project}/databases/(default)/documents`;
const base=`http://${host}/v1/${root}`;
function token(uid,email,verified=false){
 const now=Math.floor(Date.now()/1000);
 const payload={iss:`https://securetoken.google.com/${project}`,aud:project,auth_time:now,user_id:uid,sub:uid,iat:now,exp:now+3600,firebase:{identities:{},sign_in_provider:'anonymous'},...(email?{email,email_verified:verified}:{})};
 return Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.';
}
async function commit(writes,auth){return fetch(base+':commit',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth}`}:{})},body:JSON.stringify({writes})});}
function comment(id,uid){return {update:{name:root+'/comments/'+id,fields:{project:{stringValue:'guestbook'},name:{stringValue:'Test'},text:{stringValue:'Hello'},authorId:{stringValue:uid}}},updateTransforms:[{fieldPath:'createdAt',setToServerValue:'REQUEST_TIME'}],currentDocument:{exists:false}};}
function cooldown(id,uid){return {update:{name:root+'/comment-cooldowns/'+uid,fields:{commentId:{stringValue:id}}},updateTransforms:[{fieldPath:'lastCreatedAt',setToServerValue:'REQUEST_TIME'}]};}
async function status(response,expected){const body=await response.text();assert.equal(response.status,expected,body);}
test('enforces atomic guest cooldown and private owner authorization on real rules',async()=>{
 const uid='guest-rules-test',guest=token(uid),owner=token('owner','seungyeon980808@gmail.com',true),unverified=token('owner','seungyeon980808@gmail.com',false);
 await status(await commit([comment('no-auth',uid),cooldown('no-auth',uid)]),403);
 await status(await commit([comment('standalone',uid)],guest),403);
 await status(await commit([cooldown('missing-comment',uid)],guest),403);
 await status(await commit([comment('first',uid),cooldown('first',uid)],guest),200);
 await status(await commit([comment('second',uid),cooldown('second',uid)],guest),403);
 await status(await commit([{update:{name:root+'/comment-cooldowns/'+uid,fields:{commentId:{stringValue:'first'},lastCreatedAt:{timestampValue:new Date(Date.now()-61000).toISOString()}}}}],'owner'),200);
 await status(await commit([comment('after-cooldown',uid),cooldown('after-cooldown',uid)],guest),200);
 const batchUid='batch-guest';
 await status(await commit([comment('batch-one',batchUid),comment('batch-two',batchUid),cooldown('batch-one',batchUid)],token(batchUid)),403);
 const privateWrite={update:{name:root+'/private-workspaces/owner',fields:{items:{stringValue:'[]'}}}};
 await status(await commit([privateWrite],guest),403);
 await status(await commit([privateWrite],unverified),403);
 await status(await commit([privateWrite],owner),200);
 for(const auth of [guest,unverified])await status(await fetch(base+'/private-workspaces/owner',{headers:{Authorization:`Bearer ${auth}`}}),403);
 await status(await fetch(base+'/private-workspaces/owner',{headers:{Authorization:`Bearer ${owner}`}}),200);
 await status(await commit([{update:{name:root+'/comments/legacy',fields:{project:{stringValue:'guestbook'},name:{stringValue:'Legacy'},text:{stringValue:'Before auth'},createdAt:{timestampValue:'2026-01-01T00:00:00Z'}}}}],'owner'),200);
 await status(await commit([{update:{name:root+'/comments/legacy',fields:{reply:{stringValue:'Welcome'}}},updateMask:{fieldPaths:['reply']},updateTransforms:[{fieldPath:'repliedAt',setToServerValue:'REQUEST_TIME'}]}],owner),200);
});
