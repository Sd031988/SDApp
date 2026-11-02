'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {SOUNDS,createController}=require('../../studio/game-studio/game-audio.js');
test('Spielton ist standardmäßig aus, benötigt keine Browserberechtigungen',()=>{
let audioCreated=0,oscillators=0;
class FakeContext {
 constructor(){audioCreated++;this.currentTime=1;this.destination={};this.state='running';}
 createOscillator(){oscillators++;return{frequency:{setValueAtTime(){}},connect(){},start(){},stop(){}};}
 createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
 close(){return Promise.resolve();}
}
const controller=createController(FakeContext);
assert.equal(controller.enabled,false);
assert.equal(controller.play('collect'),false);
assert.equal(audioCreated,0);
assert.equal(controller.setEnabled(true),true);
assert.equal(controller.play('collect'),true);
assert.equal(oscillators,SOUNDS.collect.length);
assert.equal(controller.play('invalid-sound'),false);
assert.equal(controller.setEnabled(false),false);
assert.equal(controller.play('jump'),false);
assert.equal(oscillators,SOUNDS.collect.length);
controller.dispose();
});
test('Ton bleibt deaktiviert, wenn die Audio-API fehlt',()=>{
const controller=createController(null);
assert.equal(controller.setEnabled(true),false);
assert.equal(controller.play('complete'),false);
assert.equal(controller.enabled,false);
});
