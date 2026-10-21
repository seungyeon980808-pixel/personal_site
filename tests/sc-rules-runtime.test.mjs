import test from 'node:test';
import assert from 'node:assert/strict';
const project='demo-personal-site-rules';
const host=process.env.FIRESTORE_EMULATOR_HOST;
if(!host)throw Error('Run through the Firestore emulator; production requests are prohibited.');
const root=`projects/${project}/databases/(default)/documents`;
const base=`http://${host}/v1/${root}`;
function token(uid){
 const now=Math.floor(Date.now()/1000);
 const payload={iss:`https://securetoken.google.com/${project}`,aud:project,auth_time:now,user_id:uid,sub:uid,iat:now,exp:now+3600,firebase:{identities:{},sign_in_provider:'anonymous'}};
 return Buffer.from(JSON.stringify({alg:'none',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.';
}
const v=x=>x===null?{nullValue:null}:typeof x==='boolean'?{booleanValue:x}:typeof x==='number'?{integerValue:String(x)}:typeof x==='string'?{stringValue:x}:{mapValue:{fields:F(x)}};
const F=o=>Object.fromEntries(Object.entries(o).map(([k,x])=>[k,v(x)]));
const put=(path,data,opts={})=>({update:{name:root+'/'+path,fields:F(data)},...opts});
async function commit(writes,auth){return fetch(base+':commit',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth}`}:{})},body:JSON.stringify({writes})});}
const get=(path,auth)=>fetch(base+'/'+path,{headers:auth?{Authorization:`Bearer ${auth}`}:{}});
const query=(parent,sq,auth)=>fetch(`http://${host}/v1/${root}${parent?'/'+parent:''}:runQuery`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth}`},body:JSON.stringify({structuredQuery:sq})});
async function status(res,expected,label){const body=await res.text();assert.equal(res.status,expected,`${label}: ${body.slice(0,300)}`);}
const at={updateTransforms:[{fieldPath:'at',setToServerValue:'REQUEST_TIME'}]};
const login=(uid,key,m)=>commit([put('sc-sessions/'+uid,{member:m.id,key,room:m.room,role:m.role})],token(uid));

test('소통 창구: 개인 번호 세션과 방·1:1·할 일·투표 권한',async()=>{
 const M={kt:{id:'t',room:'all',role:'teacher'},kp:{id:'c1',room:'council',role:'leader'},ka:{id:'c13',room:'council',role:'student'},kb:{id:'c4',room:'council',role:'student'},ks:{id:'s1',room:'science',role:'student'}};
 await status(await commit(Object.entries(M).map(([k,m])=>put('sc-members/'+k,m)),'owner'),200,'seed members');
 await status(await commit([put('sc-rooms/council/notices/n1',{title:'공지'}),put('sc-rooms/council/dm/d1',{student:'c4',from:'c4',text:'비밀'}),
   put('sc-rooms/council/todos/p1',{text:'남의 체크리스트',owner:'c4',private:true,by:'c4',due:null,doneBy:{}}),
   put('sc-rooms/council/todos/a1',{text:'모두 할 일',owner:null,private:false,by:'t',due:null,doneBy:{}}),
   put('sc-rooms/council/todos/a2',{text:'c4 할 일',owner:'c4',private:false,by:'t',due:null,doneBy:{}}),
   put('sc-rooms/council/polls/v1',{q:'?',closed:false,votes:{}}),put('sc-rooms/council/polls/v2',{q:'?',closed:true,votes:{}})],'owner'),200,'seed room');

 const T=token('u-t'),P=token('u-p'),A=token('u-a'),B=token('u-b'),S=token('u-s'),X=token('u-x');
 // 세션: 남의 번호로 다른 사람인 척 못 한다
 await status(await login('u-a','ka',{...M.ka,id:'c1'}),403,'impersonate member id');
 await status(await login('u-a','ka',{...M.ka,role:'teacher'}),403,'escalate role');
 await status(await login('u-a','nope',M.ka),403,'unknown key');
 await status(await commit([put('sc-sessions/u-b',{member:'c13',key:'ka',room:'council',role:'student'})],A),403,'write other uid session');
 for(const [u,k] of [['u-t','kt'],['u-p','kp'],['u-a','ka'],['u-b','kb'],['u-s','ks']]) await status(await login(u,k,M[k]),200,'login '+k);
 await status(await query('',{from:[{collectionId:'sc-members'}]},A),403,'list members');
 await status(await get('sc-sessions/u-t',A),403,'read other session');

 // 방 나누기
 await status(await get('sc-rooms/council/notices/n1',X),403,'no session');
 await status(await get('sc-rooms/council/notices/n1',A),200,'own room');
 await status(await get('sc-rooms/council/notices/n1',S),403,'other room');
 await status(await get('sc-rooms/council/notices/n1',T),200,'teacher any room');
 await status(await commit([put('sc-rooms/council/notices/n2',{title:'x'})],A),403,'student notice');
 await status(await commit([put('sc-rooms/council/notices/n2',{title:'x'})],T),200,'teacher notice');
 await status(await get('sc-admin/roster',A),403,'student roster');

 // 전체 톡: 내 이름으로만
 await status(await commit([put('sc-rooms/council/chat/c1',{from:'c13',text:'안녕'},at)],A),200,'chat as self');
 await status(await commit([put('sc-rooms/council/chat/c2',{from:'c1',text:'사칭'},at)],A),403,'chat as other');
 await status(await commit([put('sc-rooms/council/chat/c3',{from:'c13',text:'x'.repeat(301)},at)],A),403,'chat too long');
 await status(await commit([{delete:root+'/sc-rooms/council/chat/c1'}],A),403,'student delete chat');

 // 1:1: 남의 대화는 못 읽고, 남의 방에 못 쓴다
 await status(await get('sc-rooms/council/dm/d1',A),403,'read other dm');
 await status(await get('sc-rooms/council/dm/d1',B),200,'read own dm');
 await status(await get('sc-rooms/council/dm/d1',T),200,'teacher dm');
 await status(await query('sc-rooms/council',{from:[{collectionId:'dm'}],where:{fieldFilter:{field:{fieldPath:'student'},op:'EQUAL',value:{stringValue:'c13'}}}},A),200,'query own dms');
 await status(await query('sc-rooms/council',{from:[{collectionId:'dm'}]},A),403,'query all dms');
 await status(await commit([put('sc-rooms/council/dm/d2',{student:'c4',from:'c13',text:'끼어들기'},at)],A),403,'dm into other thread');
 await status(await commit([put('sc-rooms/council/dm/d3',{student:'c13',from:'c13',text:'선생님'},at)],A),200,'dm own thread');

 // 할 일
 await status(await get('sc-rooms/council/todos/p1',A),403,'read other private todo');
 await status(await get('sc-rooms/council/todos/p1',T),403,'teacher cannot read private todo');
 await status(await get('sc-rooms/council/todos/p1',B),200,'read own private todo');
 const todo=(o)=>({text:'할 일',owner:null,private:false,by:'c13',due:null,doneBy:{},...o});
 await status(await commit([put('sc-rooms/council/todos/m1',todo({owner:'c13',private:true}))],A),200,'own checklist');
 await status(await commit([put('sc-rooms/council/todos/m2',todo({owner:'c4',private:true}))],A),403,'checklist for other');
 await status(await commit([put('sc-rooms/council/todos/m3',todo({owner:'c4'}))],A),403,'student assigns');
 await status(await commit([put('sc-rooms/council/todos/m4',todo({owner:'c4',by:'c1'}))],P),200,'leader assigns');
 await status(await commit([put('sc-rooms/council/todos/m5',todo({owner:'c4',by:'c13'}))],P),403,'leader assigns as other');
 const mark=(id,who)=>({update:{name:root+'/sc-rooms/council/todos/'+id,fields:{doneBy:{mapValue:{fields:{[who]:{booleanValue:true}}}}}},updateMask:{fieldPaths:['doneBy.'+who]}});
 await status(await commit([mark('a1','c13')],A),200,'check shared todo');
 await status(await commit([mark('a1','c4')],A),403,'check for someone else');
 await status(await commit([mark('a2','c13')],A),403,'check other person todo');
 await status(await query('sc-rooms/council',{from:[{collectionId:'todos'}],where:{fieldFilter:{field:{fieldPath:'private'},op:'EQUAL',value:{booleanValue:false}}}},A),200,'query shared todos');
 await status(await query('sc-rooms/council',{from:[{collectionId:'todos'}],where:{fieldFilter:{field:{fieldPath:'owner'},op:'EQUAL',value:{stringValue:'c13'}}}},A),200,'query my todos');
 await status(await query('sc-rooms/council',{from:[{collectionId:'todos'}]},A),403,'query all todos');
 await status(await commit([{delete:root+'/sc-rooms/council/todos/a1'}],A),403,'delete assigned todo');
 await status(await commit([{delete:root+'/sc-rooms/council/todos/m1'}],A),200,'delete own checklist');

 // 투표
 const vote=(id,who,i)=>({update:{name:root+'/sc-rooms/council/polls/'+id,fields:{votes:{mapValue:{fields:{[who]:{integerValue:String(i)}}}}}},updateMask:{fieldPaths:['votes.'+who]}});
 await status(await commit([vote('v1','c13',1)],A),200,'vote');
 await status(await commit([vote('v1','c4',1)],A),403,'vote as other');
 await status(await commit([vote('v2','c13',0)],A),403,'vote closed');

 // 읽음 표시
 await status(await commit([put('sc-rooms/council/seen/c13',{dm:1})],A),200,'own seen');
 await status(await commit([put('sc-rooms/council/seen/c4',{dm:1})],A),403,'other seen');

 // 번호를 바꾸면(해시 문서 삭제) 기존 세션은 바로 끊긴다
 await status(await commit([{delete:root+'/sc-members/ka'}],T),200,'teacher revokes');
 await status(await get('sc-rooms/council/notices/n1',A),403,'revoked session');
});
