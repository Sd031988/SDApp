/* Nordhafen Ops – synthesized WebAudio cues, no network or sound assets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsAudio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CUES=Object.freeze({pistol:[190,.09,'square'],rifle:[135,.075,'sawtooth'],smg:[210,.055,'square'],shotgun:[90,.22,'sawtooth'],sniper:[80,.3,'sawtooth'],hit:[500,.07,'sine'],step:[100,.04,'sine'],motor:[65,.12,'sawtooth'],alarm:[650,.2,'square'],mast:[850,.24,'sine'],win:[950,.4,'sine'],lose:[120,.4,'sine']});
function volume(v){const n=Number(v);return Number.isFinite(n)?Math.min(1,Math.max(0,n/100)):.6;}
function create(factory){let ctx=null,muted=false;function play(name,level=60){const cue=CUES[name];if(!cue||muted||volume(level)===0)return false;try{ctx=ctx||factory();if(ctx.state==='suspended')void ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;osc.type=cue[2];osc.frequency.setValueAtTime(cue[0],now);gain.gain.setValueAtTime(Math.min(.15,volume(level)*.15),now);gain.gain.exponentialRampToValueAtTime(.001,now+cue[1]);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+cue[1]);return true;}catch{return false;}}
 function dispose(){muted=true;if(ctx){try{void ctx.close();}catch{}ctx=null;}}return {play,dispose};}
return Object.freeze({CUES,volume,create});
});