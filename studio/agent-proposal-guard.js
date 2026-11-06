/* SD Code-Studio: fail-closed validation for future agent-generated file proposals.
   This module only prepares context and validates previews. It does not call a model,
   write project files, execute code, or grant authorization. Server-side validation is
   still required before any hosted model or runner is connected. */
(function(root){
'use strict';
const LIMITS=Object.freeze({selectedFiles:12,proposalFiles:40,fileChars:30000,contextChars:100000,proposalFileChars:70000,proposalChars:320000,pathChars:240});
const SECRET_PATH=/(?:^|\/)(?:\.env(?:\.[^/]*)?|\.git|\.ssh|credentials?(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|private[-_]?keys?(?:\.[^/]*)?|id_rsa|id_ed25519)(?:$|\/)/i;
const BINARY_EXT=/\.(?:png|jpe?g|gif|webp|avif|ico|pdf|zip|gz|7z|rar|mp3|wav|ogg|mp4|mov|glb|gltf|woff2?|ttf|otf|eot|wasm|exe|dll|so|dylib|p12|pfx|pem|key|keystore)$/i;
const SECRET_VALUE=/(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9_]{30,}\b|\bsk-[A-Za-z0-9_-]{24,}\b|\bAIza[0-9A-Za-z_-]{30,}\b|\b(?:password|passwd|client_secret|api_key|access_token)\s*[:=]\s*["'][^"'\s]{8,}["'])/i;
function asText(value){return typeof value==='string'?value:'';}
function safePath(path){
 if(typeof path!=='string'||!path||path.length>LIMITS.pathChars||/[\\\x00-\x1f\x7f:]/.test(path)||path.startsWith('/'))return false;
 const parts=path.split('/');
 if(parts.some(part=>!part||part==='.'||part==='..'))return false;
 return !SECRET_PATH.test(path)&&!BINARY_EXT.test(path);
}
function hashText(value){
 // FNV-1a is only a change/staleness marker, never a security hash.
 let hash=0x811c9dc5;
 for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,0x01000193);}
 return (hash>>>0).toString(16).padStart(8,'0');
}
function prepareContext(input){
 const data=input&&typeof input==='object'?input:{};
 if(data.consent!==true)return {ok:false,error:'Quelltext erst nach ausdrücklicher Freigabe bereitstellen.'};
 const goal=asText(data.goal).trim().slice(0,2000);
 if(!goal)return {ok:false,error:'Bitte zuerst das Entwicklungsziel beschreiben.'};
 const files=data.files&&typeof data.files==='object'&&!Array.isArray(data.files)?data.files:{};
 const selected=[...new Set(Array.isArray(data.selectedPaths)?data.selectedPaths:[])];
 if(!selected.length||selected.length>LIMITS.selectedFiles)return {ok:false,error:'Wähle 1 bis '+LIMITS.selectedFiles+' Projektdateien aus.'};
 const context=[];let total=0;
 for(const path of selected){
  if(!safePath(path))return {ok:false,error:'Der ausgewählte Dateipfad ist nicht freigegeben: '+String(path).slice(0,80)};
  if(!Object.prototype.hasOwnProperty.call(files,path)||typeof files[path]!=='string')return {ok:false,error:'Die Datei ist nicht mehr verfügbar: '+path};
  const content=files[path];
  if(content.length>LIMITS.fileChars)return {ok:false,error:'Die Datei ist zu groß für die sichere Kontextauswahl: '+path};
  if(SECRET_VALUE.test(content))return {ok:false,error:'Mögliche Zugangsdaten in '+path+' gefunden. Entferne sie oder wähle die Datei ab.'};
  total+=content.length;
  if(total>LIMITS.contextChars)return {ok:false,error:'Die ausgewählten Dateien überschreiten das Kontextlimit.'};
  context.push({path,content,baseHash:hashText(content)});
 }
 return {ok:true,request:{goal,files:context},limits:{...LIMITS}};
}
function validateProposal(proposal,options){
 const opts=options&&typeof options==='object'?options:{};
 const originals=opts.files&&typeof opts.files==='object'?opts.files:{};
 const allowed=new Set(Array.isArray(opts.allowedPaths)?opts.allowedPaths.filter(safePath):[]);
 if(opts.allowNewFiles===true&&Array.isArray(opts.newFilePaths)){
  for(const path of opts.newFilePaths)if(safePath(path))allowed.add(path);
 }
 if(!proposal||typeof proposal!=='object'||!Array.isArray(proposal.changes))return {ok:false,error:'Der Agent-Vorschlag hat kein gültiges changes-Format.'};
 if(proposal.changes.length<1||proposal.changes.length>LIMITS.proposalFiles)return {ok:false,error:'Ein Vorschlag muss 1 bis '+LIMITS.proposalFiles+' Dateiänderungen enthalten.'};
 const seen=new Set(),changes=[];let total=0;
 for(const item of proposal.changes){
  if(!item||typeof item!=='object'||!safePath(item.path))return {ok:false,error:'Der Vorschlag enthält einen ungültigen oder geschützten Dateipfad.'};
  const path=item.path;
  if(seen.has(path))return {ok:false,error:'Der Vorschlag nennt denselben Pfad mehrfach: '+path};
  seen.add(path);
  if(!allowed.has(path))return {ok:false,error:'Der Agent darf diese Datei nicht ändern: '+path};
  if(item.operation!=='create'&&item.operation!=='replace')return {ok:false,error:'Nur neue Dateien und vollständige Ersetzungen sind zulässig.'};
  if(typeof item.content!=='string'||item.content.length>LIMITS.proposalFileChars)return {ok:false,error:'Der Inhalt ist ungültig oder überschreitet das Dateilimit: '+path};
  if(SECRET_VALUE.test(item.content))return {ok:false,error:'Im Änderungsvorschlag wurden mögliche Zugangsdaten erkannt: '+path};
  const exists=Object.prototype.hasOwnProperty.call(originals,path);
  if(item.operation==='create'&&exists)return {ok:false,error:'Die neue Datei existiert bereits: '+path};
  if(item.operation==='replace'&&!exists)return {ok:false,error:'Die zu ersetzende Datei wurde nicht gefunden: '+path};
  if(item.operation==='replace'&&item.baseHash!==hashText(asText(originals[path])))return {ok:false,error:'Die Datei hat sich seit der Analyse geändert. Aktualisiere den Vorschlag: '+path};
  if(item.operation==='create'&&item.baseHash!=null)return {ok:false,error:'Neue Dateien dürfen keinen alten Dateistand referenzieren: '+path};
  total+=item.content.length;
  if(total>LIMITS.proposalChars)return {ok:false,error:'Der gesamte Vorschlag überschreitet das Größenlimit.'};
  changes.push({path,operation:item.operation,previous:item.operation==='replace'?originals[path]:'',content:item.content,
   reason:asText(item.reason).trim().slice(0,500),baseHash:item.operation==='replace'?item.baseHash:null});
 }
 return {ok:true,changes,summary:{count:changes.length,created:changes.filter(x=>x.operation==='create').length,
  replaced:changes.filter(x=>x.operation==='replace').length,totalChars:total,
  note:'Vorschau: Dateien wurden nicht gespeichert und kein Code wurde ausgeführt.'}};
}
const api=Object.freeze({LIMITS,safePath,hashText,prepareContext,validateProposal});
root.SDStudioAgentProposal=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
