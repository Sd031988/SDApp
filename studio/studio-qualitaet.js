/* SD Code-Studio: pure quality checks and bounded code comparisons. No external requests. */
(function(root){
'use strict';
function fileDiff(oldValue,newValue){
 const a=String(oldValue==null?'':oldValue).replace(/\r\n/g,'\n').split('\n');
 const b=String(newValue==null?'':newValue).replace(/\r\n/g,'\n').split('\n');
 let head=0, tail=0;
 while(head<a.length&&head<b.length&&a[head]===b[head])head++;
 while(tail<a.length-head&&tail<b.length-head&&a[a.length-1-tail]===b[b.length-1-tail])tail++;
 const removed=a.slice(head,a.length-tail),added=b.slice(head,b.length-tail);
 return {unchanged:oldValue===newValue,startLine:head+1,oldLines:removed.length,newLines:added.length,
  before:removed.slice(0,140).join('\n'),after:added.slice(0,140).join('\n'),
  truncated:removed.length>140||added.length>140};
}
function preflight(files,diagnose){
 const src=files||{},issues=[];
 const add=(file,kind,severity,text)=>issues.push({file,kind,severity,text});
 const paths=Object.keys(src);
 if(!paths.length)add('', 'empty','error','Projekt hat keine Dateien.');
 const pages=paths.filter(p=>/(^|\/)[^/]+\.html?$/i.test(p));
 if(!pages.length)add('', 'index','error','Keine HTML-Datei für eine statische Webseite vorhanden.');
 for(const [file,value] of Object.entries(src)){
  if(typeof value!=='string'||value.startsWith('data:'))continue;
  if(/(^|\/)(?:\.env(?:\..*)?|id_rsa|id_ed25519|credentials\.json|secrets?\.[^/]*)$/i.test(file)||
     /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:sk-proj-|sk_live_|github_pat_|ghp_)[A-Za-z0-9_-]{8,}/i.test(value))
    add(file,'secret','error','Mögliche Zugangsdaten oder private Schlüssel: nicht veröffentlichen.');
  if(/\.html?$/i.test(file)){
    if(/<script\b[^>]*\bsrc\s*=\s*["']https?:\/\//i.test(value))
      add(file,'external','warning','Externe Skripte werden geladen: Datenschutz und Anbieter prüfen.');
    if(/<script\b[^>]*\btype\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["'](?:\.\/|\.\.\/)/i.test(value)||
       /<script\b[^>]*\bsrc\s*=\s*["'][^"']+\.tsx?["']/i.test(value))
      add(file,'module','warning','Module oder TypeScript können einen Build bzw. Modulserver benötigen.');
  }
  if(/\.(?:js|mjs|cjs)$/i.test(file)&&/\b(?:eval\s*\(|new\s+Function\s*\()/i.test(value))
    add(file,'eval','warning','Dynamische Code-Ausführung gefunden: vor Veröffentlichung prüfen.');
  if(file==='package.json'){
    try{const pkg=JSON.parse(value);if(pkg.scripts?.build)
      add(file,'build','warning','Framework-Build vorhanden: Quellprojekt nicht ohne Build als fertige statische Webseite veröffentlichen.');}
    catch(_){add(file,'json','error','package.json ist kein gültiges JSON.');}
  }
 }
 if(typeof diagnose==='function'){
  for(const i of diagnose(src)||[]){
   if(issues.length>=100)break;
   if(i.severity!=='warning'||i.kind==='base')add(i.file||'',i.kind||'static',i.severity||'warning',i.text);
  }
 }
 return issues.slice(0,100);
}
const api={fileDiff,preflight};
root.SDStudioQualitaet=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
