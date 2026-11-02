/* SD Code-Studio: ECC-inspired, deterministic project review. No network, no execution, no writes.
   Concept inspired by https://github.com/affaan-m/ECC (MIT); no ECC source copied. */
(function(root){
'use strict';
const TEXT_LIMIT=240, MAX_ISSUES=80;
function text(value,limit){return String(value==null?'':value).slice(0,limit||TEXT_LIMIT);}
function secretPath(path){
 return /(?:^|\/)(?:\.env(?:\..*)?|id_rsa|id_ed25519|credentials?(?:\.[^/]*)?|secrets?(?:\.[^/]*)?|private[-_]?keys?(?:\.[^/]*)?)$/i.test(path);
}
function language(path){
 const ext=String(path).toLowerCase().split('.').pop();
 return ({html:'HTML',htm:'HTML',css:'CSS',scss:'SCSS',js:'JavaScript',mjs:'JavaScript',cjs:'JavaScript',
  jsx:'React/JSX',ts:'TypeScript',tsx:'React/TSX',json:'JSON',py:'Python',java:'Java',
  kt:'Kotlin',cpp:'C++',cc:'C++',c:'C',cs:'C#',rs:'Rust',go:'Go',php:'PHP',
  rb:'Ruby',swift:'Swift',dart:'Dart',sql:'SQL',sh:'Shell',ps1:'PowerShell'})[ext]||'Andere';
}
function analyze(files,engines){
 const src=files&&typeof files==='object'&&!Array.isArray(files)?files:{};
 const paths=Object.keys(src).slice(0,500), options=engines||{};
 const kinds=[...new Set(paths.map(language))].sort();
 const web=paths.some(p=>/\.html?$/i.test(p));
 const sourceCount=paths.filter(p=>typeof src[p]==='string'&&!src[p].startsWith('data:')).length;
 let findings=[];
 function push(file,kind,severity,description){
  if(findings.length>=MAX_ISSUES)return;
  findings.push({file:text(file,160),kind:text(kind,48),severity:severity==='error'?'error':'warning',description:text(description)});
 }
 if(!paths.length)push('','empty','error','Das Projekt enthält keine Dateien.');
 if(Object.keys(src).length>500)push('','limit','warning','Mehr als 500 Dateien: Die Übersicht ist begrenzt.');
 try{
  if(typeof options.preflight==='function'){
   const prior=options.preflight(src,typeof options.diagnose==='function'?options.diagnose:null)||[];
   for(const item of prior){
    if(!web&&item.kind==='index')continue; // CLI/Python/Java projects need no HTML page.
    push(item.file,item.kind,item.severity,item.text);
   }
  }else if(typeof options.diagnose==='function'){
   for(const item of options.diagnose(src)||[])push(item.file,item.kind,item.severity,item.text);
  }
 }catch(_){push('','engine','warning','Die vorhandene statische Projektprüfung konnte nicht abgeschlossen werden.');}
 // Independently protect non-web projects and runs without preflight.
 for(const path of paths){
  if(secretPath(path)&&!findings.some(x=>x.kind==='secret'&&x.file===path))
   push(path,'secret','error','Datei mit potenziell vertraulichem Namen: nicht veröffentlichen.');
  const value=src[path];
  if(typeof value==='string'&&!value.startsWith('data:')&&value.length>500000)
   push(path,'large','warning','Große Textdatei: automatischer Review ist möglicherweise unvollständig.');
 }
 const errors=findings.filter(f=>f.severity==='error').length;
 const warnings=findings.length-errors;
 const testPaths=paths.filter(p=>/(?:^|\/)(?:tests?|__tests__)\/|(?:\.test|\.spec)\.[cm]?[jt]sx?$|(?:_test\.py|test_[^/]+\.py)$/i.test(p));
 let scripts=[];
 if(typeof src['package.json']==='string'){
  try{
   const pkg=JSON.parse(src['package.json']);
   if(pkg&&pkg.scripts&&typeof pkg.scripts==='object'){
    scripts=Object.keys(pkg.scripts).filter(k=>['test','lint','typecheck','build'].includes(k)).slice(0,4);
   }
  }catch(_){} // reported by the existing static checker
 }
 const suggested=[
  'Dateien und Abhängigkeiten prüfen; gewünschte Änderung auf wenige Dateien begrenzen.',
  'Vor Änderungen eine Projektkopie oder Version sichern.',
  web?'HTML/CSS/JavaScript-Verknüpfungen und Vorschau manuell prüfen.':'Laufzeit, Compiler und benötigte Abhängigkeiten in einer sicheren Umgebung prüfen.',
  testPaths.length||scripts.includes('test')?'Vorhandene Tests ausführen und Ergebnisse kontrollieren.':'Automatisierte Tests für die Kernfunktionen ergänzen.',
  'Sicherheit, Datenschutz und Responsivität prüfen; Veröffentlichung erst nach manueller Freigabe.'
 ];
 const stages=[
  {role:'Planer',title:'Projekt verstehen',detail:sourceCount+' lesbare Textdatei(en); Technologien: '+(kinds.join(', ')||'unbekannt')+'.'},
  {role:'Entwickler',title:'Änderungen vorbereiten',detail:'Nur ausdrücklich gewählte Dateien ändern. Vorher eine Version oder Projektkopie sichern.'},
  {role:'Tester',title:'Tests und Vorschau',detail:testPaths.length+' Testdatei(en) erkannt; '+(scripts.length?'package.json: '+scripts.join(', '):'kein erkannter npm-Testbefehl')+'. Statische Analyse ersetzt keinen Testlauf.'},
  {role:'Sicherheitsprüfer',title:'Risiken prüfen',detail:errors+' Fehler, '+warnings+' Warnung(en) in der lokalen Vorprüfung. Keine Zugangsdaten an KI-Dienste kopieren.'},
  {role:'Reviewer',title:'Manuelle Freigabe',detail:'Funktionen, Barrierefreiheit und Darstellung kontrollieren. Keine automatische Veröffentlichung.'}
 ];
 // Manual prompt: only minimal aggregate metadata, never project source or issue text.
 const prompt=['Du bist mein Projekt-Reviewer im SD Code-Studio.',
  'Arbeite in dieser Reihenfolge: Planen, minimale Änderungen, Tests, Sicherheit, Review.',
  'Projekt-Metadaten (keine Quelltexte): '+paths.length+' Dateien; Technologien: '+(kinds.join(', ')||'unbekannt')+'.',
  'Statische Vorprüfung: '+errors+' Fehler, '+warnings+' Warnungen. Testdateien: '+testPaths.length+'.',
  'Schlage einen priorisierten Test- und Reparaturplan vor. Fordere nötige Dateien einzeln an.',
  'Gehe nicht davon aus, dass Tests bereits ausgeführt wurden. Keine Zugangsdaten erfragen.',
  'Verändere niemals bestehende Funktionen ohne ausdrückliche Anweisung.'].join('\n');
 return {status:errors?'blocked':warnings?'attention':'manual',fileCount:paths.length,sourceCount,
  technologies:kinds,web,findings,errors,warnings,testCount:testPaths.length,
  scripts,stages,suggested,prompt,testsExecuted:false,filesModified:false};
}
const api={analyze,language,secretPath};
root.SDStudioAgentReview=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
