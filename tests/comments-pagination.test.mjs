import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const source=await readFile(new URL('../assets/comments.js',import.meta.url),'utf8');
const {commentQuery,commentPage}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('pagination uses stable timestamp and document cursors with a bounded query',()=>{
 const first=commentQuery('guestbook').structuredQuery;
 assert.equal(first.limit,30);
 assert.equal(first.where.fieldFilter.value.stringValue,'guestbook');
 assert.deepEqual(first.orderBy.map(item=>item.field.fieldPath),['createdAt','__name__']);
 assert.equal(first.startAt,undefined);
 const cursor={date:'2026-09-15T00:00:00Z',path:'projects/example/databases/(default)/documents/comments/last'};
 assert.deepEqual(commentQuery('guestbook',cursor).structuredQuery.startAt,{values:[{timestampValue:cursor.date},{referenceValue:cursor.path}],before:false});
});
test('empty result ends paging and legacy comments need no authorId to display',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>[{readTime:'2026-09-15T00:00:00Z'}]});
  assert.deepEqual(await commentPage('guestbook'),{entries:[],cursor:null,more:false});
  globalThis.fetch=async()=>({ok:true,json:async()=>[{document:{name:'projects/p/databases/(default)/documents/comments/legacy',fields:{name:{stringValue:'Guest'},text:{stringValue:'Old entry'},createdAt:{timestampValue:'2026-01-01T00:00:00Z'}}}}]});
  const page=await commentPage('guestbook');
  assert.equal(page.entries[0].text,'Old entry');assert.equal(page.cursor.path.endsWith('/legacy'),true);assert.equal(page.more,false);
 }finally{globalThis.fetch=original;}
});
