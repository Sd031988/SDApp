'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {isExpired,DEFAULT_RETENTION_DAYS}=require('../feedback-server/domain.cjs');
const {makeService}=require('../feedback-server/service.cjs');
const now=new Date('2026-12-01T00:00:00Z'),tage=n=>new Date(now.getTime()-n*864e5).toISOString();
test('Speicherfrist: nur nicht veröffentlichte Rückmeldungen laufen ab',()=>{
 assert.equal(DEFAULT_RETENTION_DAYS,90);
 assert.equal(isExpired({status:'pending',createdAt:tage(91)},now),true);
 assert.equal(isExpired({status:'pending',createdAt:tage(89)},now),false);
 assert.equal(isExpired({status:'pending',createdAt:'kaputt'},now),true,'unklares Datum wird nicht ewig behalten');
 assert.equal(isExpired({status:'published',createdAt:tage(400)},now),false);
});
test('purgeExpired löscht nur abgelaufene Dokumente',async()=>{
 const docs=[{id:'a',data:{status:'pending',createdAt:tage(120)}},{id:'b',data:{status:'published',createdAt:tage(120)}},{id:'c',data:{status:'pending',createdAt:tage(120),permission:'none'}}];
 const geloescht=[];let filter=null;
 const db={collection:()=>({where:(f,op,v)=>{filter=[f,op,v];return {limit:()=>({get:async()=>({docs:docs.map(d=>({data:()=>d.data,ref:{delete:async()=>geloescht.push(d.id)}}))})})};},doc:()=>({})})};
 const r=await makeService(db,{enabled:false}).purgeExpired(now);
 assert.deepEqual(r,{deleted:2});assert.deepEqual(geloescht,['a','c']);assert.deepEqual(filter,['createdAt','<',tage(90)]);
});
