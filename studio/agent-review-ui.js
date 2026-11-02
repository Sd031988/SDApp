/* SD Code-Studio: read-only review workflow. UI intentionally never saves or runs project code. */
(function(){
'use strict';
function byId(id){return document.getElementById(id);}
function element(tag,klass,content){
 const e=document.createElement(tag);
 if(klass)e.className=klass;
 if(content!==undefined)e.textContent=content;
 return e;
}
let report=null,taskPlan=null;
function currentFiles(){
 if(window.SDKICodingUI&&typeof window.SDKICodingUI.currentFiles==='function')
  return window.SDKICodingUI.currentFiles();
 if(typeof S==='undefined'||!S.p)return {};
 const files={...S.p.dateien};
 for(const [name,doc] of Object.entries(S.docs||{})){
  if(doc&&typeof doc.getValue==='function')files[name]=doc.getValue();
  else if(doc&&typeof doc.wert==='string')files[name]=doc.wert;
 }
 return files;
}
function appendLine(parent,heading,body){
 const line=element('li','agentReviewStep');
 line.append(element('strong','',heading),element('p','',body));
 parent.append(line);
}
function render(result){
 const summary=byId('agentReviewSummary');
 const label=result.status==='blocked'?'Handlungsbedarf: Fehler gefunden':
  result.status==='attention'?'Warnungen prüfen':'Statische Prüfung ohne Befund';
 summary.textContent=label+' · '+result.fileCount+' Dateien · '+result.errors+
  ' Fehler · '+result.warnings+' Warnungen · '+result.testCount+' erkannte Testdateien';
 summary.dataset.state=result.status;
 byId('agentReviewNote').textContent='Nur statische Analyse: keine Anwendung ausgeführt, '+
  'keine Tests gestartet, keine Dateien verändert und nichts an externe Dienste gesendet.';
 const stages=byId('agentReviewStages');stages.replaceChildren();
 for(const stage of result.stages)appendLine(stages,stage.role+' · '+stage.title,stage.detail);
 const issues=byId('agentReviewIssues');issues.replaceChildren();
 const shown=result.findings.slice(0,30);
 if(!shown.length)appendLine(issues,'Keine statischen Befunde',
  'Die Freigabe erfordert weiterhin echte Funktionstests und einen manuellen Review.');
 for(const item of shown)appendLine(issues,
  (item.severity==='error'?'Fehler':'Warnung')+' · '+(item.file||'Projekt'),
  item.description);
 if(result.findings.length>shown.length)appendLine(issues,'Weitere Befunde',
  (result.findings.length-shown.length)+' zusätzliche Befunde: Projektdateien einzeln prüfen.');
 const todo=byId('agentReviewTodo');todo.replaceChildren();
 for(const item of result.suggested)appendLine(todo,item,'');
 byId('agentReviewManualCopy').hidden=true;
 byId('agentReviewCopy').disabled=false;
}
function runReview(){
 const engine=window.SDStudioAgentReview;
 if(!engine)return;
 const files=currentFiles();
 report=engine.analyze(files,{
  preflight:window.SDStudioQualitaet&&window.SDStudioQualitaet.preflight,
  diagnose:window.SDKIDiagnose&&window.SDKIDiagnose.inspect
 });
 render(report);
 taskPlan=null;
 byId('agentReviewHandoff').disabled=true;
 byId('agentReviewTargets').replaceChildren();
 byId('agentReviewTaskSteps').replaceChildren();
 byId('agentReviewTaskStatus').textContent='Beschreibe eine Aufgabe, um passende Dateien und konkrete Prüfschritte vorzuschlagen.';
}
function makeTaskPlan(){
 if(!report)return;
 const goal=byId('agentReviewGoal').value.trim();
 const engine=window.SDStudioTaskAgent;
 if(!engine){byId('agentReviewTaskStatus').textContent='Aufgabenanalyse konnte nicht geladen werden.';return;}
 const files=currentFiles();
 taskPlan=engine.makePlan(goal,files,report,typeof S!=='undefined'?S.aktiv:null);
 const suggestions=byId('agentReviewTargets'),steps=byId('agentReviewTaskSteps');
 suggestions.replaceChildren();steps.replaceChildren();
 if(taskPlan.error){
  byId('agentReviewTaskStatus').textContent=taskPlan.error;
  byId('agentReviewHandoff').disabled=true;
  return;
 }
 byId('agentReviewTaskStatus').textContent='Lokaler Vorschlag: '+taskPlan.graph.edges.length+
  ' erkannte Dateiverknüpfungen, '+taskPlan.paths.length+' relevante Dateien. Keine Tests ausgeführt.';
 for(const path of taskPlan.paths)appendLine(suggestions,path,'Vorgeschlagener Kontext – keine automatische Datenfreigabe.');
 if(!taskPlan.paths.length)appendLine(suggestions,'Keine geeigneten Textdateien','Dateien im Editor auswählen oder Projekt öffnen.');
 for(const step of taskPlan.steps)appendLine(steps,step.role,step.description);
 byId('agentReviewHandoff').disabled=false;
}
function handoffTask(){
 if(!taskPlan||!taskPlan.goal)return;
 const bridge=window.SDKICodingUI;
 if(!bridge||typeof bridge.openChangeDialogWithGoal!=='function'){
  byId('agentReviewTaskStatus').textContent='KI-Werkstatt ist nicht verfügbar.';
  return;
 }
 const result=bridge.openChangeDialogWithGoal(taskPlan.goal,taskPlan.paths);
 if(result)closeReview();
}
function openReview(){
 const overlay=byId('agentReviewOverlay');
 overlay.hidden=false;
 byId('agentReviewGoal').value='';
 runReview();
 byId('agentReviewClose').focus();
}
function closeReview(){byId('agentReviewOverlay').hidden=true;}
async function copyPrompt(){
 if(!report)return;
 const prompt=taskPlan&&taskPlan.goal?taskPlan.prompt:report.prompt;
 const note=byId('agentReviewCopyStatus');
 try{
  if(!navigator.clipboard||!navigator.clipboard.writeText)throw Error('Clipboard not available');
  await navigator.clipboard.writeText(prompt);
  note.textContent='Anfrage kopiert. Kein Quelltext und keine Dateinamen übertragen (nur dein Auftrag und Metadaten).';
  byId('agentReviewManualCopy').hidden=true;
 }catch(_){
  const field=byId('agentReviewManualCopy');
  field.value=prompt;field.hidden=false;field.focus();field.select();
  note.textContent='Automatisches Kopieren nicht verfügbar. Text unten ist zum Kopieren markiert.';
 }
}
function setup(){
 const overlay=byId('agentReviewOverlay');
 if(!overlay||!byId('agentReviewBtn')||!window.SDStudioAgentReview)return;
 byId('agentReviewBtn').addEventListener('click',openReview);
 byId('agentReviewClose').addEventListener('click',closeReview);
 byId('agentReviewAgain').addEventListener('click',runReview);
 byId('agentReviewPlan').addEventListener('click',makeTaskPlan);
 byId('agentReviewHandoff').addEventListener('click',handoffTask);
 byId('agentReviewGoal').addEventListener('input',()=>{taskPlan=null;byId('agentReviewHandoff').disabled=true;byId('agentReviewTaskStatus').textContent='Aufgabe geändert – Plan neu erstellen.';});
 byId('agentReviewCopy').addEventListener('click',copyPrompt);
 overlay.addEventListener('click',event=>{if(event.target===overlay)closeReview();});
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!overlay.hidden){event.preventDefault();closeReview();}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
else setup();
})();
