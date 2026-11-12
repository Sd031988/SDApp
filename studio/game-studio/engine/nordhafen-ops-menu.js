/* Nordhafen Ops: title menu settings and resilient local records, no DOM dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsMenu=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='nordhafen-ops-records-v1',MODES=['mission','city','royale'],DIFFICULTIES=['easy','normal','hard'];
function settings(input={}){return {mode:MODES.includes(input.mode)?input.mode:'mission',difficulty:DIFFICULTIES.includes(input.difficulty)?input.difficulty:'normal',volume:Math.min(100,Math.max(0,Number.isFinite(Number(input.volume))?Number(input.volume):60))};}
function initial(){return {bestMissionSeconds:null,wins:{mission:0,city:0,royale:0}};}
function sanitize(raw){const base=initial(),wins=raw&&typeof raw==='object'?raw.wins:null;return {bestMissionSeconds:Number.isFinite(raw?.bestMissionSeconds)&&raw.bestMissionSeconds>0?raw.bestMissionSeconds:null,wins:Object.fromEntries(MODES.map(m=>[m,Math.max(0,Math.floor(Number(wins?.[m])||0))]))};}
function read(storage){try{return sanitize(JSON.parse(storage.getItem(KEY)));}catch{return initial();}}
function write(storage,records){try{storage.setItem(KEY,JSON.stringify(sanitize(records)));return true;}catch{return false;}}
function finish(records,mode,seconds,won){const next=sanitize(records);if(!won||!MODES.includes(mode))return next;next.wins[mode]++;if(mode==='mission'&&Number.isFinite(seconds)&&seconds>0)next.bestMissionSeconds=Math.min(next.bestMissionSeconds??Infinity,seconds);return next;}
function help(){return 'PC: WASD bewegen, Shift sprinten, Maus schauen, links schießen, rechts zielen, R nachladen, E interagieren, Esc pausieren. Handy derzeit nicht unterstützt.';}
return Object.freeze({KEY,MODES,DIFFICULTIES,settings,initial,read,write,finish,help});
});