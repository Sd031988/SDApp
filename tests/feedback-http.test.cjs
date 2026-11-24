'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {makeHandler}=require('../feedback-server/http.cjs');
const origin='https://thesdhub.com';
function setup(enabled=false){const calls=[];const service={submit:async()=>{calls.push('submit');return {id:'test'};},publicList:async()=>[],pending:async()=>{calls.push('pending');return [];},approve:async()=>calls.push('approve'),remove:async()=>calls.push('remove'),withdraw:async()=>calls.push('withdraw')};return {calls,handle:makeHandler(service,{origin,enabled,verifyIdToken:async token=>token==='admin'?{uid:'test',feedbackAdmin:true}:{uid:'test'}})};}
const post=(path,body={},headers={})=>({method:'POST',path,body,headers:{origin,...headers}});
test('disabled does not accept submissions',async()=>{const {handle,calls}=setup();assert.equal((await handle(post('/submit'))).status,503);assert.deepEqual(calls,[]);});
test('cross-origin writes rejected',async()=>{const {handle,calls}=setup(true);assert.equal((await handle(post('/submit',{}, {origin:'https://example.org'}))).status,403);assert.deepEqual(calls,[]);});
test('request body cannot grant admin access',async()=>{const {handle,calls}=setup(true);assert.equal((await handle(post('/admin/approve',{verifiedAdmin:true}))).status,403);assert.deepEqual(calls,[]);});
test('verified token required for pending and approval',async()=>{const {handle,calls}=setup(true);assert.equal((await handle({method:'GET',path:'/admin/pending',headers:{authorization:'Bearer user'}})).status,403);assert.equal((await handle(post('/admin/approve',{}, {authorization:'Bearer admin'}))).status,200);assert.deepEqual(calls,['approve']);});
test('withdraw remains available when collection disabled',async()=>{const {handle,calls}=setup();const r=await handle(post('/withdraw'));assert.equal(r.status,200);assert.equal(r.headers['Cache-Control'],'no-store');assert.deepEqual(calls,['withdraw']);});
