'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),l=require('./nordhafen-ops-lifecycle.js');
test('pause freezes time and resume continues',()=>{let s=l.transition(l.initial(),{type:'tick',dt:1});s=l.transition(s,{type:'pause'});assert.equal(l.transition(s,{type:'tick',dt:9}).elapsed,1);s=l.transition(s,{type:'resume'});assert.equal(l.transition(s,{type:'tick',dt:2}).elapsed,3);});
test('two restarts return clean state without accumulating enemies',()=>{let s=l.initial();for(let i=0;i<2;i++){s=l.transition({...s,ended:true,health:0,defeated:6},{type:'restart'});assert.deepEqual(s,l.initial());}assert.equal(l.cleanupCount(6,6),0);});
test('terminal state cannot be unpaused into active game',()=>{let s=l.transition(l.initial(),{type:'finish'});s=l.transition(s,{type:'pause'});assert.equal(s.ended,true);assert.equal(l.transition(s,{type:'tick',dt:2}).elapsed,0);});
