import assert from 'node:assert/strict';
import {BlockWorldOnline,ROOM_IDS,SERVER_URL} from './online.mjs';

const originalFetch=globalThis.fetch;
const requests=[],states=[],statuses=[];
globalThis.fetch=async(url,options)=>{
 const action=new URL(url).pathname.split('/').pop();
 const data=JSON.parse(options.body);
 requests.push({action,data,url});
 if(action==='join')return new Response(JSON.stringify({
  ok:true,token:'opaque-private-test-token',id:'deadbeef12345678',room:'dorf',
  players:[{id:'aabbccdd00112233',x:1,z:2,y:0,heading:0,color:'blue'}],
  blocks:[]
 }),{status:200,headers:{'Content-Type':'application/json'}});
 if(action==='sync')return new Response(JSON.stringify({
  ok:true,room:'dorf',players:[],blocks:[{x:4,z:2,level:0,color:'mint'}]
 }),{status:200,headers:{'Content-Type':'application/json'}});
 if(action==='build'||action==='leave')return new Response(JSON.stringify({ok:true}),{status:200});
 return new Response('not found',{status:404});
};
try{
 assert.equal(ROOM_IDS.length,3);
 assert.equal(SERVER_URL,'https://sd-maschinen-kenner.onrender.com');
 const online=new BlockWorldOnline({onState:v=>states.push(v),onStatus:v=>statuses.push(v)});
 assert.equal(online.connected,false);
 assert.equal(await online.join('invalid-room').then(()=>false,e=>e.message.includes('Unbekannter')),true);
 assert.equal(await online.join('dorf'),true);
 assert.equal(online.connected,true);
 assert.equal(states[states.length-1].players.length,1);
 online.position=()=>({x:2,z:5,y:0,heading:1,color:'pink'});
 await online.poll();
 assert.equal(states[states.length-1].blocks.length,1);
 assert.equal(requests.find(x=>x.action==='sync').data.position.color,'pink');
 assert.equal(await online.build('place',{x:4,z:2,level:0,color:'mint'}),true);
 assert.equal(requests.find(x=>x.action==='build').data.operation,'place');
 online.disconnect();
 assert.equal(online.connected,false);
 assert.equal(states[states.length-1].players.length,0);
 assert.ok(statuses.some(v=>v.includes('Verbunden')));
 assert.ok(requests.every(v=>v.url.startsWith(SERVER_URL)));
 console.log('PASS: safe opt-in BlockWorld online transport, sync and offline disconnect');
}finally{
 globalThis.fetch=originalFetch;
}
