/* SD Code-Studio: local review of selected AI code changes.
   Original, rule-based implementation inspired by Sourcery's review UX.
   No Sourcery API, network requests, user-code execution or writes. */
(function(root){
'use strict';
const MAX_FINDINGS=75;
function changedLines(oldText,newText){
 const newer=String(newText||'').replace(/\r\n?/g,'\n').split('\n');
 if(typeof oldText!=='string')return {start:1,end:newer.length};
 const older=oldText.replace(/\r\n?/g,'\n').split('\n');
 let head=0,tail=0;
 while(head<older.length&&head<newer.length&&older[head]===newer[head])head++;
 while(tail<older.length-head&&tail<newer.length-head&&older[older.length-1-tail]===newer[newer.length-1-tail])tail++;
 return {start:head+1,end:newer.length-tail};
}
function review(files,original){
 const inputs=Array.isArray(files)?files.slice(0,40):[];
 const previous=original&&typeof original==='object'?original:{};
 const findings=[];
 let scanned=0,skipped=0;
 function add(path,line,severity,rule,title,advice){
  if(findings.length>=MAX_FINDINGS)return;
  findings.push({file:String(path).slice(0,220),line,rule,severity,title,advice});
 }
 for(const f of inputs){
  if(!f||typeof f.path!=='string'||typeof f.content!=='string'||f.content.startsWith('data:')){skipped++;continue;}
  const path=f.path,body=f.content;
  if(body.length>180000){skipped++;add(path,1,'warning','size','Datei nicht vollständig geprüft','Große Datei separat prüfen.');continue;}
  scanned++;
  const code=body.replace(/\r\n?/g,'\n'), lines=code.split('\n');
  // Credentials are always checked across the entire chosen file, even if pre-existing.
  if(/(?:^|\/)(?:\.env(?:\..*)?|credentials?(?:\..+)?|secrets?(?:\..+)?|id_rsa|id_ed25519|[^/]*private[-_]?key[^/]*)$/i.test(path))
   add(path,1,'critical','secret-path','Mögliche Zugangsdaten-Datei','Datei nicht als KI-Code übernehmen oder veröffentlichen.');
  const secret=/(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:sk-proj-|sk_live_|github_pat_|ghp_)[a-z0-9_-]{12,}|AIza[a-zA-Z0-9_-]{25,})/;
  for(let i=0;i<lines.length&&findings.length<MAX_FINDINGS;i++)
   if(secret.test(lines[i]))add(path,i+1,'critical','secret-value','Möglicher echter Zugangsschlüssel','Geheimnis entfernen und gegebenenfalls widerrufen. Der Wert wird hier nicht angezeigt.');
  const span=changedLines(Object.prototype.hasOwnProperty.call(previous,path)?previous[path]:undefined,code);
  if(span.end<span.start)continue;
  for(let i=span.start-1;i<span.end&&findings.length<MAX_FINDINGS;i++){
   const line=lines[i]||'',trim=line.trim();
   if(!trim||/^(?:\/\/|#(?!include\b)|\*|\/\*|<!--)/.test(trim))continue;
   const js=/\.(?:[cm]?js|jsx|tsx?|ts)$/i.test(path);
   const py=/\.py$/i.test(path);
   const html=/\.html?$/i.test(path);
   if((js||py)&&/\b(?:eval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['"][^'"]+['"])/.test(line))
    add(path,i+1,'warning','dynamic-code','Dynamische Codeausführung','Möglichst ohne eval oder String-basierte Ausführung arbeiten; Benutzereingaben niemals direkt ausführen.');
   if(js&&/\.\s*innerHTML\s*=/.test(line)&&!/\.\s*innerHTML\s*=\s*['"](?:[^'"]*)['"]\s*;?\s*$/.test(trim))
    add(path,i+1,'warning','html-injection','HTML-Inhalt wird dynamisch eingesetzt','Für reine Texte textContent verwenden; sonst HTML-Eingaben zuverlässig bereinigen.');
   if(js&&/\bdocument\.write\s*\(/.test(line))
    add(path,i+1,'warning','document-write','document.write gefunden','Stattdessen sichere DOM-Methoden verwenden.');
   if(js&&/\bcatch\s*\([^)]*\)\s*\{\s*\}/.test(line))
    add(path,i+1,'info','silent-error','Leerer Fehlerhandler','Fehler wenigstens protokollieren oder kontrolliert behandeln.');
   if(py&&/\bshell\s*=\s*True\b/.test(line))
    add(path,i+1,'warning','shell','Shell-Ausführung in Python','Argumente als Liste übergeben und shell=True vermeiden.');
   if(py&&/\b(?:pickle\.loads?\s*\(|yaml\.load\s*\()/i.test(line))
    add(path,i+1,'warning','unsafe-deserialization','Unsichere Datenverarbeitung möglich','Keine nicht vertrauenswürdigen Daten deserialisieren; sichere Formate und Loader wählen.');
   if(html&&/<a\b[^>]*\btarget\s*=\s*["']_blank["']/i.test(line)&&!/\brel\s*=\s*["'][^"']*\bnoopener\b/.test(line))
    add(path,i+1,'info','external-tab','Link öffnet einen neuen Tab','rel="noopener noreferrer" ergänzen, wo passend.');
   if(html&&/<img\b(?![^>]*\balt\s*=)[^>]*>/i.test(line))
    add(path,i+1,'info','image-alt','Bild ohne Alternativtext','Bei informativen Bildern einen beschreibenden alt-Text ergänzen.');
   if((html||js)&&/\bhttp:\/\/[a-z0-9.-]+/i.test(line)&&!/localhost|127\.0\.0\.1/.test(line))
    add(path,i+1,'info','plain-http','Unverschlüsselte HTTP-Adresse','Wenn möglich HTTPS nutzen.');
  }
 }
 const order={critical:0,warning:1,info:2};
 findings.sort((a,b)=>order[a.severity]-order[b.severity]||a.file.localeCompare(b.file)||a.line-b.line);
 const critical=findings.filter(f=>f.severity==='critical').length;
 const warnings=findings.filter(f=>f.severity==='warning').length;
 const infos=findings.filter(f=>f.severity==='info').length;
 return {findings,critical,warnings,infos,scanned,skipped,truncated:findings.length>=MAX_FINDINGS,
  blocked:critical>0,checksExecuted:false,localOnly:true};
}
const api={review,changedLines};
root.SDKICodeReview=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
