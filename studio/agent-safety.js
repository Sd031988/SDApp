/* SD Code-Studio: local change-impact and capability preview.
   Uses only the already-built project graph. No external requests, project writes or execution. */
(function(root){
'use strict';
const CAP=60;
function safePath(path){
 return typeof path==='string'&&path.length<=240&&!/(?:^|\/)\.(?:env|git|ssh)(?:\/|\.|$)/i.test(path)&&
 !/(?:^|\/)(?:id_rsa|id_ed25519|[^/]*(?:secret|credential|password|private[-_]?key|token)[^/]*)(?:$|\/)/i.test(path)&&
 !/\.(?:pem|key|p12|pfx|keystore)$/i.test(path)&&!/(?:^|\/)(?:node_modules|vendor|dist|build)\/|(?:^|\/)\.\.\//.test(path);
}
function impactAnalysis(graph,selected,files){
 const src=files&&typeof files==='object'?files:{};
 const edges=Array.isArray(graph&&graph.edges)?graph.edges.slice(0,350):[];
 const roots=[...new Set((Array.isArray(selected)?selected:[]).filter(p=>
  safePath(p)&&Object.prototype.hasOwnProperty.call(src,p)&&typeof src[p]==='string'&&!src[p].startsWith('data:')))].slice(0,12);
 const visited=new Set(roots),queue=roots.map(path=>({path,depth:0})), affected=[];
 const reverse=new Map();
 for(const e of edges){
  if(!e||!e.exists||!safePath(e.to)||!safePath(e.from))continue;
  if(!Object.prototype.hasOwnProperty.call(src,e.to)||!Object.prototype.hasOwnProperty.call(src,e.from))continue;
  if(!reverse.has(e.to))reverse.set(e.to,[]);
  reverse.get(e.to).push(e.from);
 }
 let cursor=0;
 while(cursor<queue.length&&affected.length<CAP){
  const current=queue[cursor++];
  for(const parent of reverse.get(current.path)||[]){
   if(visited.has(parent)||!safePath(parent))continue;
   visited.add(parent);
   const item={path:parent,via:current.path,depth:current.depth+1};
   affected.push(item);queue.push(item);
   if(affected.length>=CAP)break;
  }
 }
 // Only a conservative clue, not a complete call graph or assertion of execution.
 const rootsSet=new Set(roots);
 const associatedTests=Object.keys(src).filter(p=>
  safePath(p)&&/(?:^|\/)(?:test|tests|__tests__)\/|(?:\.test|\.spec)\.[cm]?[jt]sx?$|(?:test_[^/]+|[^/]+_test)\.py$/i.test(p))
  .slice(0,18);
 const incomplete=!!(graph&&graph.truncated)||affected.length>=CAP;
 return {selected:roots,affected,affectedCount:affected.length,associatedTests,
  incomplete,unresolved:Math.min(Array.isArray(graph&&graph.missing)?graph.missing.length:0,350),
  note:'Statische Verknüpfungen: dynamische Imports, Laufzeitaufrufe und externe Pakete können fehlen.'};
}
function capabilityPreview(){
 // Describes current UI operations only, NOT an authorization engine for future API/tool calls.
 return [
  {name:'Projektstruktur lokal lesen',status:'lokal',detail:'Nur im Browser analysieren; keine Übertragung.'},
  {name:'Dateiinhalte an KI-Anbieter kopieren',status:'freigabe',detail:'Erfordert erneute Auswahl und ausdrückliche Zustimmung in der KI-Werkstatt.'},
  {name:'Bestehende Projektdateien ändern',status:'freigabe',detail:'Nur über die vorhandene bestätigte KI-Übernahme mit Versionssicherung.'},
  {name:'Programme oder Tests automatisch ausführen',status:'nicht_verfuegbar',detail:'Dieser Agent besitzt keine sichere autonome Ausführungsumgebung.'},
  {name:'Projekt automatisch veröffentlichen',status:'nicht_verfuegbar',detail:'Kein automatischer Deployment-Zugriff.'}
 ];
}
const api={impactAnalysis,capabilityPreview,safePath};
root.SDStudioAgentSafety=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
