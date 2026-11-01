import assert from 'node:assert/strict';
import {SOUND_CUES,SDGameSound,cueForMini,soundSettings,loadSoundSettings,saveSoundSettings} from './sd-sound.mjs';
assert.equal(SOUND_CUES.length,40);
for(const cue of ['dog','bunny','fox','siren','heartbeat','parcel'])assert.ok(SOUND_CUES.includes(cue));
assert.equal(new Set(SOUND_CUES).size,SOUND_CUES.length);
assert.deepEqual(soundSettings('not-json'),{enabled:false,volume:.65});
assert.deepEqual(soundSettings({enabled:'true',volume:-5}),{enabled:false,volume:0});
assert.deepEqual(soundSettings({enabled:true,volume:99}),{enabled:true,volume:1});
assert.equal(soundSettings({volume:'0.3'}).volume,.3);
const recorded=new Map(),store={getItem:k=>recorded.get(k)||null,setItem:(k,v)=>recorded.set(k,v)};
assert.equal(loadSoundSettings(store).enabled,false);
assert.equal(saveSoundSettings({enabled:true,volume:.35},store),true);
assert.deepEqual(loadSoundSettings(store),{enabled:true,volume:.35});
assert.equal(cueForMini('garden','water'),'water');
assert.equal(cueForMini('pet','feed'),'feed');
assert.equal(cueForMini('obby','checkpoint'),'checkpoint');
assert.equal(cueForMini('city','task'),'task');
assert.equal(cueForMini('learn','answer'),'correct');
assert.equal(cueForMini('fashion','show'),'fashion');
assert.equal(cueForMini('kart','gate'),'checkpoint');
assert.equal(cueForMini('treasure','move'),'step');
assert.equal(cueForMini('garden','harvest',false),'error');
assert.equal(cueForMini('other','unknown',true,15),'reward');

let created=0,voices=0,played=0,connected=0,resumed=0,closed=0,now=1000;
class Param{
 constructor(){this.value=0}
 setValueAtTime(v){this.value=v}
 exponentialRampToValueAtTime(v){this.value=v}
}
class Node {
 constructor(){this.gain=new Param();this.frequency=new Param();this.Q={value:0};this.type='sine'}
 connect(){connected++;return this}
 start(){played++}
 stop(){ }
}
class Context{
 constructor(){created++;this.currentTime=10;this.sampleRate=8000;this.state='suspended';this.destination=new Node()}
 createGain(){return new Node()}
 createOscillator(){voices++;return new Node()}
 createBiquadFilter(){return new Node()}
 createDynamicsCompressor(){return new Node()}
 createBuffer(){return {getChannelData:()=>new Float32Array(12000)}}
 createBufferSource(){voices++;return new Node()}
 resume(){resumed++;this.state='running';return Promise.resolve()}
 close(){closed++;return Promise.resolve()}
}
const engine=new SDGameSound({enabled:false,volume:.65,contextFactory:()=>new Context(),clock:()=>now});
assert.equal(engine.play('jump'),false);
assert.equal(created,0,'Muted sound must not create a context before user gesture');
engine.setEnabled(true);
assert.equal(created,1);
assert.equal(engine.ready,true);
for(const cue of SOUND_CUES)assert.equal(engine.play(cue),true,'Cue '+cue+' must be implemented');
assert.ok(voices>=SOUND_CUES.length,'All sound cues must synthesize audio');
assert.ok(played>30);
assert.ok(connected>=voices);
assert.ok(resumed>=1);
assert.equal(engine.play('does-not-exist'),false);
assert.equal(engine.pulse('step',300),true);
assert.equal(engine.pulse('step',300),false,'Repeated movement is throttled');
now+=300;
assert.equal(engine.pulse('step',300),true);
engine.setVolume(.35);assert.equal(engine.volume,.35);
assert.ok(Math.abs(engine.master.gain.value-.35*.28)<.001);
engine.setEnabled(false);assert.equal(engine.master.gain.value,0);
const before=voices;
assert.equal(engine.play('collect'),false);assert.equal(voices,before);
await engine.dispose();assert.equal(closed,1);
const unsupported=new SDGameSound({enabled:true,contextFactory:()=>null});
assert.equal(unsupported.play('jump'),false);
console.log('PASS: 40 original cues, muted startup, mobile unlock, volume, throttle, persistence and safe fallback');
