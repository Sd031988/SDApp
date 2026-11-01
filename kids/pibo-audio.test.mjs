import assert from 'node:assert/strict';
import {PiboAudio} from './pibo-audio.js';
const oldWindow=globalThis.window;
let contexts=0,voices=0,buffers=0,connections=0;
class Param{constructor(){this.value=0}setValueAtTime(x){this.value=x}exponentialRampToValueAtTime(x){this.value=x}}
class Node{
 constructor(){this.frequency=new Param();this.gain=new Param();this.Q={value:.7};this.playbackRate=new Param();this.type='sine'}
 connect(){connections++;return this}
 start(){voices++}
 stop(){}
}
class AudioContext{
 constructor(){contexts++;this.sampleRate=8000;this.currentTime=10;this.destination=new Node()}
 createOscillator(){return new Node()}
 createGain(){return new Node()}
 createBuffer(_channels,len){buffers++;return {getChannelData:()=>new Float32Array(len)}}
 createBufferSource(){return new Node()}
 createBiquadFilter(){return new Node()}
 createDynamicsCompressor(){return new Node()}
 resume(){return Promise.resolve()}
}
try{
 globalThis.window={AudioContext};
 const audio=new PiboAudio();
 assert.equal(contexts,0);
 audio.setVolume(.2);
 assert.equal(audio.volume,.2);
 assert.equal(contexts,0,'Adjusting a slider must not start audio before a user gesture');
 for(const cue of ['meow','purr','chew','step','water','splash','flush','fart','snore','gift','select','photo']){
  const before=voices;audio.play(cue);assert.ok(voices>before,'No audio for '+cue);
 }
 assert.equal(contexts,1);
 assert.equal(buffers,1,'Reuse noise buffer across original sounds');
 assert.ok(connections>30);
 assert.equal(audio.master.gain.value,.2);
 audio.setVolume(3);assert.equal(audio.master.gain.value,1);
 audio.setVolume(-2);assert.equal(audio.master.gain.value,0);
 console.log('PASS: original Pibo voice, care, water, toilet, photo, room and scaled sound levels');
}finally{globalThis.window=oldWindow}
