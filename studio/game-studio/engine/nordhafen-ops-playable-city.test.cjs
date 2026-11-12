'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const objectives=require('./nordhafen-ops-city-objectives.js');
const mobile=require('./nordhafen-ops-mobile.js');
const sites={towers:[{x:90,z:90},{x:120,z:120}],extraction:{x:200,z:200}};
test('Free City: five objectives require actual actions, reward exactly once',()=>{
 let state=objectives.initial();
 assert.equal(objectives.title(state).includes('Fahrauftrag'),true);
 assert.equal(objectives.step(state,{sites,pos:sites.towers[0],driving:false}).state.index,0,'walking is not a courier drive');
 state=objectives.step(state,{sites,pos:sites.towers[0],driving:true}).state;
 assert.equal(state.index,1);
 assert.equal(objectives.step(state,{sites,kills:1}).state.index,1);
 state=objectives.step(state,{sites,kills:2}).state;
 assert.equal(state.index,2);
 let x=objectives.step(state,{sites,pos:sites.towers[1],holding:true,dt:.1,driving:false}).state;
 assert.ok(x.progress>0);
 assert.equal(objectives.step(x,{sites,pos:{x:0,z:0},holding:true,dt:.1}).state.progress,0,'out of range resets hold');
 for(let i=0;i<31;i++)state=objectives.step(state,{sites,pos:sites.towers[1],holding:true,dt:.1}).state;
 assert.equal(state.index,3);
 for(let i=0;i<21;i++)state=objectives.step(state,{sites,driving:true,speedKmh:46,dt:.1}).state;
 assert.equal(state.index,4);
 assert.equal(objectives.step(state,{sites,pos:sites.extraction,driving:true}).state.index,4,'must exit vehicle');
 const finish=objectives.step(state,{sites,pos:sites.extraction,driving:false});
 assert.equal(finish.state.won,true);assert.equal(finish.state.completed.length,5);
 assert.equal(finish.event.won,true);
 assert.equal(objectives.step(finish.state,{sites,pos:sites.extraction}).event,null,'no duplicate win');
});
test('Free City: route marker targets only active located missions',()=>{
 const initial=objectives.initial();
 assert.deepEqual(objectives.goal(initial,sites),sites.towers[0]);
 assert.equal(objectives.goal({...initial,index:1},sites),null);
 assert.deepEqual(objectives.goal({...initial,index:2},sites),sites.towers[1]);
 assert.deepEqual(objectives.goal({...initial,index:4},sites),sites.extraction);
 assert.equal(objectives.goal({...initial,won:true},sites),null);
});
test('Mobile: camera sensitivity and beta limits are clamped',()=>{
 assert.deepEqual(mobile.look(2,1,100,-50,{lower:.3,upper:2.7,sensitivity:.006}),{alpha:1.4,beta:1.3});
 assert.equal(mobile.look(0,2.6,0,-1000).beta,2.7);
 assert.equal(mobile.look(0,.4,0,1000).beta,.35);
 assert.equal(mobile.KEY_NAMES.KeyE,'e');
});
test('Mobile: multi-touch keys emit keydown and keyup to the actual player canvas',()=>{
 const listeners={},emitted=[];
 function element(code){return {dataset:{footKey:code},listeners:{},addEventListener(n,fn){this.listeners[n]=fn;},setPointerCapture(){}};}
 const keyW=element('KeyW'),keyE=element('KeyE'),buttons=[keyW,keyE];
 const doc={defaultView:{KeyboardEvent:class{constructor(type,props){this.type=type;Object.assign(this,props)}},addEventListener(){}},
  getElementById(){return {hidden:true}},querySelectorAll(){return buttons}};
 const canvas={addEventListener(n,fn){listeners[n]=fn;},dispatchEvent(e){emitted.push([e.type,e.code,e.bubbles]);},setPointerCapture(){}};
 const controls=mobile.create({canvas,camera:{alpha:0,beta:1},document:doc,signal:{}});
 controls.setMode(true,false);
 const ev=id=>({pointerId:id,preventDefault(){}});
 keyW.listeners.pointerdown(ev(1));keyE.listeners.pointerdown(ev(2));
 assert.deepEqual(emitted.slice(0,2),[['keydown','KeyW',true],['keydown','KeyE',true]]);
 keyW.listeners.pointerup(ev(1));keyE.listeners.pointerup(ev(2));
 assert.deepEqual(emitted.slice(2),[['keyup','KeyW',true],['keyup','KeyE',true]]);
});
test('Ops page wires mobile, vehicles, quests, HUD and inline script syntax',()=>{
 const page=fs.readFileSync(path.join(__dirname,'nordhafen-ops.html'),'utf8');
 for(const token of ['nordhafen-ops-mobile.js','nordhafen-ops-city-objectives.js',
  'id="footControls"','data-foot-key="KeyE"','data-foot-action="vehicle"',
  'cityObjectiveRules.step','cityObjectiveRules.goal','mobile.setMode','player.setVehicleMode(true)'])
  assert.ok(page.includes(token),token);
 const open=page.lastIndexOf('<script>'),close=page.lastIndexOf('</script>');
 assert.ok(open>=0&&close>open);
 assert.doesNotThrow(()=>new vm.Script(page.slice(open+8,close)));
});
