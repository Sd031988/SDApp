/* SD Code-Studio: offline, read-only web-project checks. */
(function (root) {
'use strict';
const SKIP = /^(?:https?:|\/\/|data:|blob:|mailto:|tel:|#|javascript:)/i;
function lineAt(s, i) {return (s.slice(0,i).match(/\n/g)||[]).length+1;}
function resolvePath(owner, ref) {
  if(typeof ref!=='string')return null;
  ref=ref.trim().replace(/&amp;/gi,'&').replace(/[?#].*$/,'');
  if(!ref||SKIP.test(ref)||/[\u0000-\u001f<>*{}]/.test(ref))return null;
  try{ref=decodeURIComponent(ref)}catch(_){}
  if(ref.startsWith('//')||/^[a-z][a-z0-9+.-]*:/i.test(ref))return null;
  const parts=ref.startsWith('/')?[]:owner.split('/').slice(0,-1);
  for(const p of ref.replace(/^\/+/,'').split('/')){
    if(!p||p==='.')continue;
    if(p==='..'){if(!parts.length)return null;parts.pop()}else parts.push(p);
  }
  return parts.join('/')||null;
}
function attr(tag,name){
  const m=new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))','i').exec(tag);
  return m?(m[1]??m[2]??m[3]):null;
}
function inspect(input){
 const issues=[],files=input&&typeof input==='object'?input:{};
 const has=p=>Object.prototype.hasOwnProperty.call(files,p);
 function add(file,source,at,kind,text,suggestion,severity='error'){
   if(issues.length<100)issues.push({file,line:lineAt(source,at),kind,text,suggestion,severity});
 }
 function reference(file,source,at,ref,kind){
   if(!ref||SKIP.test(ref))return;
   const path=resolvePath(file,ref);
   if(!path||has(path))return;
   if(kind==='import'&&!/\.[a-z\d]+$/i.test(path))return; // bundler can resolve extensionless imports
   add(file,source,at,kind,'Verknüpfte Datei fehlt: '+ref,
     'Datei "'+path+'" importieren oder den Pfad in "'+file+'" korrigieren.');
 }
 for(const [file,source] of Object.entries(files)){
   if(issues.length>=100)break;
   if(!/\.(?:html?|css|m?js|cjs|json)$/i.test(file)||typeof source!=='string'||source.startsWith('data:'))continue;
   if(source.length>500000){add(file,'',0,'limit','Datei zu groß für automatische Prüfung.','Einzeln prüfen.','warning');continue;}
   if(/\.html?$/i.test(file)){
     for(const m of source.matchAll(/<(script|link|img|source|video|audio)\b[^>]*>/gi)){
       const tag=m[0],name=m[1].toLowerCase();
       if(name==='link'&&!/\b(?:stylesheet|icon|preload|modulepreload)\b/i.test(attr(tag,'rel')||''))continue;
       const ref=attr(tag,name==='link'?'href':'src');
       if(ref)reference(file,source,m.index,ref,'asset');
     }
     for(const m of source.matchAll(/<base\b[^>]*>/gi)){
       const href=attr(m[0],'href');
       if(href&&href.startsWith('/'))add(file,source,m.index,'base','Absoluter <base>-Pfad kann die Studio-Vorschau umgehen: '+href,'Relative Pfade verwenden oder <base> entfernen.','warning');
     }
   }else if(/\.css$/i.test(file)){
     for(const m of source.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/gi))reference(file,source,m.index,m[1],'asset');
     for(const m of source.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^'")\s]+))\s*\)/gi))reference(file,source,m.index,m[1]||m[2]||m[3],'asset');
   }else if(/\.json$/i.test(file)){
     try{JSON.parse(source)}catch(e){
       const detail=String(e.message||'Ungültiges JSON'),m=/position\s+(\d+)/i.exec(detail);
       add(file,source,m?Math.min(source.length,+m[1]):0,'json','JSON-Syntaxfehler: '+detail,'Kommas, Anführungszeichen und Klammern prüfen.');
     }
   }else if(/\.(?:js|mjs|cjs)$/i.test(file)){
     for(const m of source.matchAll(/\b(?:import\s*(?:[^'";]*?\s+from\s*)?|export\s+[^'";]*?\s+from\s*|require\s*\(\s*)["'](\.{1,2}\/[^"']+)["']/g))
       reference(file,source,m.index,m[1],'import');
     // Syntax-only compile; never run imported code. ES modules need a module parser.
     if(/\.(?:js|cjs)$/i.test(file)&&!/^\s*(?:import|export)\b/m.test(source)&&typeof Function==='function'){
       try{new Function(source)}catch(e){if(e instanceof SyntaxError)add(file,source,0,'javascript','JavaScript-Syntaxfehler: '+e.message,'Klammern, Strings und Kommas prüfen.');}
     }
   }
 }
 return issues;
}
function fixPrompt(issues,projectName){
 const fence=String.fromCharCode(96).repeat(3);
 return ['Prüfe und repariere mein Webprojekt im SD Code-Studio.',
  'Projekt: '+String(projectName||'mein-projekt').slice(0,100),
  'Erkannte Probleme (nur Meldungen und Dateinamen, keine privaten Datei-Inhalte):',
  ...(Array.isArray(issues)?issues:[]).slice(0,40).map((i,n)=>(n+1)+'. '+i.file+':'+i.line+' - '+i.text+' Vorschlag: '+i.suggestion),
  'Erkläre kurz die Ursachen. Liefere anschließend jede tatsächlich zu ändernde Datei vollständig:',
  '### Datei: pfad/datei.ext',fence+'javascript','(vollständiger Inhalt mit passender Sprachkennung)',fence,
  'Keine geheimen Zugangsdaten anfordern. Bestehende Dateien möglichst unverändert lassen.',
  'Wenn Informationen fehlen, benötigte Datei nennen statt sie zu erfinden.'].join('\n');
}
const api={inspect,resolvePath,fixPrompt};
root.SDKIDiagnose=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
