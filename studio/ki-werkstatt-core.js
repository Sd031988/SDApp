/* SD Code-Studio: safe, provider-neutral AI code package importer (no API/auth). */
(function(root){
'use strict';
const languageFiles={html:'index.html',htm:'index.html',css:'style.css',scss:'style.scss',javascript:'app.js',js:'app.js',mjs:'app.mjs',typescript:'app.ts',ts:'app.ts',tsx:'App.tsx',jsx:'App.jsx',json:'data.json',python:'main.py',py:'main.py',php:'index.php',sql:'query.sql',yaml:'config.yaml',yml:'config.yml',xml:'data.xml',svg:'image.svg',go:'main.go',rust:'src/main.rs',rs:'src/main.rs',java:'Main.java',c:'main.c',cpp:'main.cpp',cs:'Program.cs',bash:'script.sh',sh:'script.sh',md:'README.md',markdown:'README.md'};
const langExt={html:['html','htm'],css:['css'],scss:['scss'],javascript:['js','mjs','cjs','jsx'],js:['js','mjs','cjs','jsx'],mjs:['mjs','js'],typescript:['ts','tsx'],ts:['ts','tsx'],tsx:['tsx'],jsx:['jsx'],json:['json'],python:['py'],py:['py'],php:['php'],sql:['sql'],yaml:['yml','yaml'],yml:['yml','yaml'],xml:['xml'],svg:['svg'],go:['go'],rust:['rs'],rs:['rs'],java:['java'],c:['c'],cpp:['cpp','cc','cxx','h','hpp'],cs:['cs'],bash:['sh'],sh:['sh'],md:['md'],markdown:['md']};
const MAX_FILES=40,MAX_TOTAL=320000,MAX_SINGLE=180000;
function safePath(input){
 if(typeof input!=='string')return null;
 let p=input.trim().replace(/^["'\x60]+|["'\x60]+$/g,'').replace(/\\/g,'/');
 if(!p||p.length>220||p.startsWith('/')||p.startsWith('~')||/^[a-z]:/i.test(p)||/[<>"'|?*\x00-\x1f]/.test(p)||/[:]/.test(p)||p.includes('//'))return null;
 const parts=p.split('/');
 if(parts.some(x=>!x||x==='.'||x==='..'||x.startsWith('.')||x==='node_modules'||x==='dist'||x==='build'||x==='vendor'||x==='__pycache__'))return null;
 if(!/\.(?:html?|css|scss|less|m?js|cjs|jsx|tsx?|json|py|php|sql|ya?ml|xml|svg|go|rs|java|c|cc|cpp|h|hpp|cs|sh|md|txt)$/i.test(p))return null;
 return p;
}
function languageName(line){
 let a=String(line||'').trim();
 return (a.match(/^([a-z][\w+-]*)/i)||[])[1]?.toLowerCase()||'';
}
function fileFromHeading(line){
 let txt=String(line||'').trim().replace(/^#{1,6}\s*/,'').replace(/^\*\*|\*\*$/g,'').trim();
 let match=txt.match(/^(?:Datei|File|Filename|Pfad|Path)\s*:\s*(\S+)/i);
 return match?match[1].replace(/[\x60"'<>]+/g,''):null;
}
function filenameFromFence(info){
 const m=String(info||'').match(/(?:file|datei|filename|path)\s*[:=]\s*["'\x60]?([A-Za-z0-9_./-]+\.[A-Za-z0-9]+)["'\x60]?/i);
 return m?m[1]:null;
}
function languageFits(path,language){
 if(!language||!langExt[language])return true;
 const ext=path.split('.').pop().toLowerCase();
 return langExt[language].includes(ext);
}
function parse(text,activeFile){
 const errors=[],warnings=[],files=[],seen=new Set();
 const input=String(text||'').replace(/\r\n/g,'\n');
 if(input.length>MAX_TOTAL){errors.push('KI-Antwort zu groß (maximal 320 KB).');return {files,errors,warnings}}
 const fence=/^[ \t]*\x60{3,}[ \t]*([^\n]*)\n([\s\S]*?)\n?[ \t]*\x60{3,}[ \t]*(?=\n|$)/gm;
 let match,lastEnd=0,blockCount=0;
 while((match=fence.exec(input))){
  blockCount++;
  if(blockCount>MAX_FILES){errors.push('Maximal 40 Codeblöcke zulässig.');break}
  const info=match[1].trim(),language=languageName(info),content=match[2].replace(/\n+$/,'')+'\n';
  let stated=filenameFromFence(info);
  if(!stated){
   const before=input.slice(lastEnd,match.index);
   const heading=before.trimEnd().split('\n').slice(-2).reverse().find(line=>fileFromHeading(line));
   if(heading)stated=fileFromHeading(heading);
  }
  const active=safePath(activeFile||'');
  if(!stated&&active&&blockCount===1&&languageFits(active,language))stated=active;
  if(!stated)stated=languageFiles[language]||null;
  if(!stated){errors.push('Codeblock '+blockCount+': Kein Dateiname erkennbar. Verwende „### Datei: ordner/datei.js“.');lastEnd=fence.lastIndex;continue}
  const path=safePath(stated);
  if(!path){errors.push('Codeblock '+blockCount+': Unsicherer oder nicht unterstützter Dateipfad „'+stated+'“.');lastEnd=fence.lastIndex;continue}
  if(!languageFits(path,language)){errors.push('Datei '+path+': Sprache „'+language+'“ passt nicht zur Endung.');lastEnd=fence.lastIndex;continue}
  if(content.length>MAX_SINGLE){errors.push('Datei '+path+' zu groß (maximal 180 KB).');lastEnd=fence.lastIndex;continue}
  if(seen.has(path.toLowerCase())){errors.push('Datei „'+path+'“ mehrfach vorhanden.');lastEnd=fence.lastIndex;continue}
  if(!content.trim()){errors.push('Datei „'+path+'“ ist leer.');lastEnd=fence.lastIndex;continue}
  seen.add(path.toLowerCase());files.push({path,content,language:language||path.split('.').pop()});
  lastEnd=fence.lastIndex;
 }
 if(!blockCount&&input.trim()){
  const path=safePath(activeFile||'');
  if(path&&/(?:<\w[\s>]|[{;}=]|^\s*(?:import|export|def |class |function |const |let |var |print\(|#include))/m.test(input))
    files.push({path,content:input.replace(/\n+$/,'')+'\n',language:path.split('.').pop()});
  else errors.push('Kein Codeblock erkannt. Bitte KI-Code mit „### Datei: datei.ext“ und drei Backticks einfügen.');
 }
 if(!files.length&&!errors.length)errors.push('Noch kein KI-Code eingefügt.');
 if(files.length&&!blockCount)warnings.push('Rohcode wird der aktuell geöffneten Datei zugeordnet.');
 return {files,errors,warnings};
}
function buildPlan(parsed,existing){
 const current=existing&&typeof existing==='object'?existing:{};
 const files=(parsed&&parsed.files)||[];
 return files.map(f=>({path:f.path,content:f.content,status:Object.prototype.hasOwnProperty.call(current,f.path)?(current[f.path]===f.content?'unverändert':'ersetzt in Kopie'):'neu',oldLength:typeof current[f.path]==='string'?current[f.path].length:0}));
}
function buildPrompt(goal,project,selectedFile,source){
 const task=String(goal||'').trim().slice(0,3000);
 if(!task)return '';
 const projectName=String(project?.name||'neues-projekt');
 const paths=project?.dateien?Object.keys(project.dateien).slice(0,90):[];
 const active=safePath(selectedFile||'');
 const lines=['Du bist mein Programmierassistent im SD Code-Studio.','Ziel: '+task,'Projekt: '+projectName,'Vorhandene Dateipfade: '+(paths.join(', ')||'(noch keine Dateien)'),active?'Aktuelle Datei: '+active:'','Bitte erstelle möglichst wenige, vollständig lauffähige Dateien.','Gib keine ZIP-Datei, keine Diffs, keine Shell-Befehle und keine Geheimnisse aus.','Gib zu JEDER zu ändernden/anzulegenden Datei exakt dieses Format aus:','### Datei: relativer/pfad.ext','\x60\x60\x60html','(vollständiger Dateiinhalt, Sprache passend zur Datei)','\x60\x60\x60','Bitte bestehende Dateien nicht unnötig verändern. Keine Zugangsdaten in den Code schreiben.'];
 if(active&&source)lines.push('Inhalt der aktuellen Datei, von mir ausdrücklich zur KI-Freigabe gewählt:\n\x60\x60\x60text\n'+String(source).slice(0,12000).replace(/\x60{3,}/g,'---')+'\n\x60\x60\x60');
 return lines.filter(Boolean).join('\n\n');
}
const api={safePath,parse,buildPlan,buildPrompt,languageFiles};
root.SDKICoding=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);