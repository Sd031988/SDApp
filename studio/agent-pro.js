/* SD Agent Pro – local task board and guarded state machine.
   Metadata only: never stores source code, executes project code or publishes changes. */
(function(root){
'use strict';
const STATES=['open','working','testing','approval','done'];
const MAX_TASKS=40;
function eligible(path){
 return typeof path==='string'&&path.length>0&&path.length<=240&&
  !/(?:^|\/)\.{1,2}(?:\/|$)/.test(path)&&
  !/(?:^|\/)(?:\.env(?:\..*)?|\.git|\.ssh|node_modules|vendor|dist|build)(?:\/|$)/i.test(path)&&
  !/(?:^|\/)[^/]*(?:secret|credential|password|private[-_]?key|token)[^/]*(?:\/|$)/i.test(path)&&
  !/\.(?:pem|key|p12|pfx|keystore)$/i.test(path);
}
function pathsFor(plan,files){
 const src=files&&typeof files==='object'?files:{};
 return [...new Set((Array.isArray(plan&&plan.paths)?plan.paths:[])
  .filter(p=>eligible(p)&&Object.prototype.hasOwnProperty.call(src,p)&&
    typeof src[p]==='string'&&!src[p].startsWith('data:')))].slice(0,6);
}
// Lightweight change detector, not a cryptographic integrity or security check.
function fingerprint(files,paths){
 const src=files&&typeof files==='object'?files:{};
 let hash=2166136261;
 for(const p of paths){
  const value=Object.prototype.hasOwnProperty.call(src,p)?src[p]:null;
  const chunk=p+'\u0000'+(typeof value==='string'?value:'[missing]')+'\u0000';
  for(let i=0;i<chunk.length;i++){hash^=chunk.charCodeAt(i);hash=Math.imul(hash,16777619);}
 }
 return (hash>>>0).toString(16).padStart(8,'0');
}
function create(goal,plan,files,id,now){
 const text=String(goal||'').trim().slice(0,1200);
 if(!text)throw Error('Bitte einen Auftrag beschreiben.');
 const paths=pathsFor(plan,files);
 if(!paths.length)throw Error('Keine geeigneten Projektdateien gefunden.');
 if(typeof id!=='string'||!/^task-[a-z0-9-]{8,80}$/i.test(id))throw Error('Ungültige Aufgaben-ID.');
 const at=String(now||new Date().toISOString());
 return {id,goal:text,status:'open',paths,createdAt:at,updatedAt:at,
  baseline:fingerprint(files,paths),lastTest:null,history:[{status:'open',at}]};
}
function hydrate(list){
 if(!Array.isArray(list))return [];
 const ids=new Set(),out=[];
 for(const entry of list.slice(0,MAX_TASKS)){
  if(!entry||!/^task-[a-z0-9-]{8,80}$/i.test(entry.id||'')||ids.has(entry.id))continue;
  const goal=typeof entry.goal==='string'?entry.goal.trim().slice(0,1200):'';
  if(!goal||!STATES.includes(entry.status))continue;
  const paths=[...new Set((Array.isArray(entry.paths)?entry.paths:[]).filter(eligible))].slice(0,6);
  if(!paths.length)continue;
  ids.add(entry.id);
  const last=entry.lastTest;
  const lastTest=last&&typeof last==='object'&&Number.isInteger(last.fail)&&Number.isInteger(last.warnings)&&
   last.fail>=0&&last.warnings>=0&&typeof last.snapshot==='string'
   ?{fail:last.fail,warnings:last.warnings,passes:Math.max(0,Number(last.passes)||0),
    snapshot:last.snapshot.slice(0,20),checkedAt:String(last.checkedAt||'').slice(0,40),staticOnly:true}:null;
  out.push({id:entry.id,goal,status:entry.status,paths,baseline:String(entry.baseline||'').slice(0,20),
   createdAt:String(entry.createdAt||'').slice(0,40),updatedAt:String(entry.updatedAt||'').slice(0,40),
   lastTest,history:[]});
 }
 return out;
}
function transition(task,to,files,now,manualConfirmed){
 if(!task||!STATES.includes(task.status)||!STATES.includes(to))throw Error('Ungültiger Status.');
 if(STATES.indexOf(to)!==STATES.indexOf(task.status)+1)throw Error('Statuswechsel ist nur schrittweise erlaubt.');
 if(to==='approval'){
  const t=task.lastTest;
  if(!t||t.fail!==0||t.warnings!==0||t.snapshot!==fingerprint(files,task.paths))
   throw Error('Statische Prüfung fehlt, meldet Befunde oder ist nicht mehr aktuell.');
 }
 if(to==='done'&&!manualConfirmed)throw Error('Abschluss erfordert ausdrückliche Bestätigung echter Tests und Freigabe.');
 const at=String(now||new Date().toISOString());
 return {...task,status:to,updatedAt:at,history:[...(task.history||[]).slice(-12),{status:to,at}]};
}
function recordStaticTest(task,result,files,now){
 if(!task||task.status!=='testing')throw Error('Aufgabe ist noch nicht in der Prüfphase.');
 if(!result||!result.staticOnly||result.codeExecuted!==false||result.filesModified!==false||
  !Number.isInteger(result.fail)||!Number.isInteger(result.warnings)||
  result.fail<0||result.warnings<0)throw Error('Ungültiger statischer Prüfbericht.');
 const at=String(now||new Date().toISOString());
 return {...task,updatedAt:at,lastTest:{fail:result.fail,warnings:result.warnings,
  passes:result.passes||0,snapshot:fingerprint(files,task.paths),checkedAt:at,staticOnly:true}};
}
function add(list,task){
 if(!Array.isArray(list)||list.length>=MAX_TASKS)throw Error('Maximal 40 Aufgaben pro Projekt.');
 if(list.some(x=>x.id===task.id))throw Error('Aufgaben-ID bereits vergeben.');
 return [task,...list];
}
const api={STATES,MAX_TASKS,eligible,pathsFor,fingerprint,create,hydrate,transition,recordStaticTest,add};
root.SDStudioAgentPro=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
