/* SD Code-Studio: safe, provider-neutral AI code package importer (no API/auth). */
(function(root){
'use strict';
const languageFiles={html:'index.html',htm:'index.html',css:'style.css',scss:'style.scss',less:'style.less',javascript:'app.js',js:'app.js',node:'app.js',mjs:'app.mjs',cjs:'app.cjs',typescript:'app.ts',ts:'app.ts',tsx:'App.tsx',jsx:'App.jsx',json:'data.json',python:'main.py',py:'main.py',java:'Main.java',kotlin:'Main.kt',kt:'Main.kt',php:'index.php',sql:'query.sql',yaml:'config.yaml',yml:'config.yml',xml:'data.xml',svg:'image.svg',go:'main.go',golang:'main.go',rust:'src/main.rs',rs:'src/main.rs',c:'main.c',cpp:'main.cpp','c++':'main.cpp',csharp:'Program.cs','c#':'Program.cs',cs:'Program.cs',bash:'script.sh',sh:'script.sh',shell:'script.sh',powershell:'script.ps1',ps1:'script.ps1',ruby:'main.rb',rb:'main.rb',swift:'main.swift',dart:'main.dart',lua:'main.lua',r:'main.r',toml:'config.toml',dockerfile:'Dockerfile',md:'README.md',markdown:'README.md'};
const langExt={html:['html','htm'],htm:['htm','html'],css:['css'],scss:['scss'],less:['less'],javascript:['js','mjs','cjs','jsx'],js:['js','mjs','cjs','jsx'],node:['js','mjs','cjs'],mjs:['mjs','js'],cjs:['cjs','js'],typescript:['ts','tsx'],ts:['ts','tsx'],tsx:['tsx'],jsx:['jsx','js'],json:['json'],python:['py'],py:['py'],java:['java'],kotlin:['kt'],kt:['kt'],php:['php'],sql:['sql'],yaml:['yml','yaml'],yml:['yml','yaml'],xml:['xml'],svg:['svg'],go:['go'],golang:['go'],rust:['rs'],rs:['rs'],c:['c','h'],cpp:['cpp','cc','cxx','hpp','h'],'c++':['cpp','cc','cxx','hpp','h'],csharp:['cs'],'c#':['cs'],cs:['cs'],bash:['sh'],sh:['sh'],shell:['sh'],powershell:['ps1'],ps1:['ps1'],ruby:['rb'],rb:['rb'],swift:['swift'],dart:['dart'],lua:['lua'],r:['r'],toml:['toml'],dockerfile:['Dockerfile'],md:['md'],markdown:['md']};
const MAX_FILES=40,MAX_TOTAL=320000,MAX_SINGLE=180000;
function safePath(input){
 if(typeof input!=='string')return null;
 const p=input.trim().replace(/^["'\x60]+|["'\x60]+$/g,'').replace(/\\/g,'/');
 if(!p||p.length>220||p.startsWith('/')||p.startsWith('~')||/^[a-z]:/i.test(p)||/[<>"'|?*\x00-\x1f:]/.test(p)||p.includes('//'))return null;
 const parts=p.split('/');
 if(parts.some(x=>!x||x==='.'||x==='..'||x.startsWith('.')||['node_modules','dist','build','vendor','__pycache__'].includes(x.toLowerCase())))return null;
 if(p!=='Dockerfile'&&!/\.(?:html?|css|scss|less|m?js|cjs|jsx|tsx?|json|py|php|sql|ya?ml|xml|svg|go|rs|java|kt|c|cc|cpp|cxx|h|hpp|cs|sh|ps1|rb|swift|dart|lua|r|toml|md|txt)$/i.test(p))return null;
 return p;
}
function languageName(line){
 const t=(String(line||'').trim().match(/^([a-z][\w+#.-]*)/i)||[])[1]?.toLowerCase()||'';
 return Object.prototype.hasOwnProperty.call(languageFiles,t)?t:'';
}
function filename(s){
 const t=String(s||'').trim().replace(/^[\x60"'(]+|[\x60"'),:;]+$/g,'');
 return /^([a-z0-9_-]+\/)*[a-z0-9_-]+(?:\.[a-z0-9_-]+)+$/i.test(t)||t==='Dockerfile'?t:null;
}
function filenameFromFence(info){
 const s=String(info||'').trim(),m=s.match(/(?:^|\s)(?:file|datei|filename|path|pfad)\s*[:=]\s*["'\x60]?([^\s"'\x60]+)["'\x60]?/i);
 if(m)return m[1];
 const parts=s.split(/\s+/);
 if(filename(parts[0])&&!languageName(parts[0]))return filename(parts[0]);
 for(const p of parts.slice(1)){if(filename(p))return filename(p)}
 return null;
}
function fileFromHeading(line){
 let s=String(line||'').trim().replace(/^#{1,6}\s*/,'').replace(/^[-*]\s+/,'').replace(/^\*{1,2}|\*{1,2}$/g,'').trim();
 const labeled=s.match(/^(?:Datei|File(?:name)?|Pfad|Path|Dateiname)\s*[:\-–]\s*(.+)$/i);
 if(labeled)s=labeled[1].trim();
 s=s.replace(/^\x60+|\x60+$/g,'').replace(/[\x60]+/g,'').replace(/:\s*$/,'').trim();
 const m=s.match(/^([^\s]+)\s*(?:\([a-zA-Z+#\s]+\))?$/);
 return filename(m?m[1]:s);
}
function recentHeading(gap){
 const lines=String(gap||'').trimEnd().split('\n').slice(-6);
 for(let i=lines.length-1;i>=0;i--){
  const line=lines[i].trim();if(!line)continue;
  const p=fileFromHeading(line);if(p)return p;
  if(line.length>130||/[.!?]\s*$/.test(line))break;
 }
 return null;
}
function guessLanguage(code){
 const s=String(code||'').trim();if(!s)return '';
 if(/^(?:<!doctype\s+html\b|<html\b|<head\b|<body\b|<main\b|<div\b|<h[1-6]\b|<script\b)/i.test(s))return 'html';
 if(/^<svg\b/i.test(s))return 'svg';
 if(/^<\?xml\b/i.test(s))return 'xml';
 if(/^#include\s*[<"]/m.test(s))return 'cpp';
 if(/\bpublic\s+(?:static\s+)?class\s+\w+|\bpublic\s+static\s+void\s+main\s*\(/.test(s))return 'java';
 if(/^package\s+main\b/m.test(s)&&/\bfunc\s+main\s*\(/.test(s))return 'go';
 if(/\bfn\s+main\s*\(|^\s*use\s+std::/m.test(s))return 'rust';
 if(/^\s*(?:def\s+\w+\s*\(|from\s+\w+\s+import\s|print\s*\(|import\s+\w+)/m.test(s)&&!/;\s*(?:\n|$)/.test(s))return 'python';
 if(/^\s*(?:const|let|var)\s+\w+|^\s*(?:export|import)\s+.*from\s+['"]|^\s*(?:async\s+)?function\s+\w+\s*\(/m.test(s))return 'javascript';
 if(/^\s*(?:SELECT|INSERT|UPDATE|CREATE\s+TABLE)\b/im.test(s))return 'sql';
 try{const obj=JSON.parse(s);if(obj&&typeof obj==='object')return 'json'}catch(e){}
 if(/^\s*[@.#a-z][^{}]*\{[\s\S]*:\s*[^{}]+;[\s\S]*\}/i.test(s)&&!/<[a-z]/i.test(s))return 'css';
 return '';
}
function languageFits(p,lang){
 if(!lang||!Object.prototype.hasOwnProperty.call(langExt,lang))return true;
 if(lang==='dockerfile')return p==='Dockerfile';
 return langExt[lang].includes(p.split('.').pop().toLowerCase());
}
function chooseExisting(lang,existing,used){
 if(!lang||!existing||typeof existing!=='object')return null;
 const matches=Object.keys(existing).filter(p=>safePath(p)&&!used.has(p.toLowerCase())&&languageFits(p,lang)&&typeof existing[p]==='string');
 return matches.length===1?matches[0]:null;
}
function numberedPath(p,used){
 const dot=p.lastIndexOf('.'),base=dot<0?p:p.slice(0,dot),ext=dot<0?'':p.slice(dot);
 for(let i=2;i<MAX_FILES+2;i++){const next=base+'-'+i+ext;if(safePath(next)&&!used.has(next.toLowerCase()))return next}
 return null;
}
function parse(text,activeFile,existingFiles){
 const errors=[],warnings=[],files=[],used=new Set(),existing=existingFiles||{};
 const input=String(text||'').replace(/\r\n?/g,'\n');
 if(input.length>MAX_TOTAL){errors.push('KI-Antwort zu groß (maximal 320 KB).');return {files,errors,warnings,skipped:0}}
 const fence=/^[ \t]*(\x60{3,}|~{3,})[ \t]*([^\n]*)\n([\s\S]*?)^[ \t]*(?:\x60{3,}|~{3,})[ \t]*(?=\n|$)/gm;
 let match,lastEnd=0,blockCount=0,skipped=0;
 while((match=fence.exec(input))){
  blockCount++;
  if(blockCount>MAX_FILES){errors.push('Maximal 40 Codeblöcke zulässig.');break}
  const info=match[2].trim(),code=match[3].replace(/\n+$/,'')+'\n';
  const declared=filenameFromFence(info)||recentHeading(input.slice(lastEnd,match.index));
  lastEnd=fence.lastIndex;
  if(!code.trim()){skipped++;continue}
  const lang=languageName(info)||guessLanguage(code);
  if(!declared&&!lang){skipped++;continue}
  if(!declared&&['bash','shell','sh','powershell','ps1'].includes(lang)&&/^\s*(?:npm|npx|pip|pip3|git|cd|mkdir|curl|wget|apt|brew|yarn|pnpm)\s+/m.test(code)){
   skipped++;warnings.push('Ein Shell-Befehlsblock wurde nicht als Programmdatei übernommen.');continue;
  }
  const active=safePath(activeFile||'');
  let p=declared;
  if(!p&&blockCount===1&&active&&languageFits(active,lang))p=active;
  if(!p)p=chooseExisting(lang,existing,used)||languageFiles[lang]||null;
  if(!p){skipped++;warnings.push('Codeblock '+blockCount+' konnte keiner Sprache zugeordnet werden.');continue}
  p=safePath(p);
  if(!p){errors.push('Codeblock '+blockCount+': Unsicherer oder nicht unterstützter Dateipfad.');continue}
  if(lang&&!languageFits(p,lang)){errors.push('Codeblock '+blockCount+': Sprache „'+lang+'“ passt nicht zu „'+p+'“.');continue}
  if(code.length>MAX_SINGLE){errors.push('Datei '+p+' zu groß (maximal 180 KB).');continue}
  if(used.has(p.toLowerCase())){
   if(declared){errors.push('Datei „'+p+'“ mehrfach ausdrücklich angegeben.');continue}
   const next=numberedPath(p,used);
   if(!next){errors.push('Kein eindeutiger Dateiname für '+p);continue}
   warnings.push('Weiterer '+lang+'-Block wurde als „'+next+'“ eingeordnet.');p=next;
  }
  used.add(p.toLowerCase());files.push({path:p,content:code,language:lang||p.split('.').pop()});
 }
 if(!blockCount&&input.trim()){
  const lang=guessLanguage(input),active=safePath(activeFile||'');
  const path=active&&lang&&languageFits(active,lang)?active:languageFiles[lang];
  if(!lang||!path)errors.push('Keine Codeblöcke erkannt. Bitte die ganze KI-Antwort inklusive Codeblöcken einfügen.');
  else if(input.length>MAX_SINGLE)errors.push('Code zu groß (maximal 180 KB pro Datei).');
  else {files.push({path,content:input.replace(/\n+$/,'')+'\n',language:lang});warnings.push('Ein einzelner Rohcodeblock wurde erkannt.');}
 }
 if(!files.length&&!errors.length)errors.push('Kein Programmcode erkannt. Bitte die gesamte KI-Antwort kopieren.');
 if(skipped)warnings.push(skipped+' Erklärungs-/Ausgabeblock'+(skipped===1?'':'e')+' ignoriert.');
 return {files,errors,warnings,skipped};
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