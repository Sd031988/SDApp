/* Offline-friendly, opt-in sound effects for the SD Game-Studio. No microphone, downloads or analytics. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDGameAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SOUNDS=Object.freeze({
collect:[[659,.00,.10],[880,.08,.14]],
jump:[[330,.00,.11],[440,.09,.13]],
complete:[[523,.00,.12],[659,.12,.12],[784,.24,.18]],
toggle:[[523,.00,.08]]
});
function createController(AudioContextClass){
let context=null,enabled=false;
function setEnabled(value){
if(!value){enabled=false;return false;}
if(typeof AudioContextClass!=='function')return false;
try{
if(!context)context=new AudioContextClass();
if(context.state==='suspended'){
const p=context.resume();
if(p&&typeof p.catch==='function')p.catch(()=>{});
}
enabled=true;
return true;
}catch(_){enabled=false;return false;}
}
function play(name){
if(!enabled||!context||!Object.prototype.hasOwnProperty.call(SOUNDS,name))return false;
try{
const t=context.currentTime;
for(const [hz,offset,duration] of SOUNDS[name]){
const start=t+offset,osc=context.createOscillator(),gain=context.createGain();
osc.type='sine';
osc.frequency.setValueAtTime(hz,start);
gain.gain.setValueAtTime(.0001,start);
gain.gain.exponentialRampToValueAtTime(.09,start+.015);
gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
osc.connect(gain);gain.connect(context.destination);
osc.start(start);osc.stop(start+duration+.02);
}
return true;
}catch(_){return false;}
}
function dispose(){enabled=false;if(context){try{const p=context.close();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_){}context=null;}}
return Object.freeze({setEnabled,play,dispose,get enabled(){return enabled;}});
}
return Object.freeze({SOUNDS,createController});
});
