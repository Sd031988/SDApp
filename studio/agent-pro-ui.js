/* SD Agent Pro: task board UI for existing SD Code-Studio.
   No remote model, no project writes, no automatic execution or deployment. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const LABELS={open:'Offen',working:'In Arbeit',testing:'Testen',approval:'Freigabe',done:'Erledigt'};
let tasks=[],key='',lastButton=null;
function node(tag,className,text){
 const e=document.createElement(tag);
 if(className)e.className=className;
 if(text!==undefined)e.textContent=text;
 return e;
}
function button(parent,id,text,callback){
 const b=node('button','',text);if(id)b.id=id;b.type='button';
 b.addEventListener('click',callback);parent.append(b);return b;
}
function currentProject(){
 if(typeof S==='undefined'||!S.p||!S.p.name)return null;
 return String(S.p.name);
}
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
function message(text,error){
 const target=$('agentProMessage');target.textContent=text||'';
 target.dataset.error=error?'true':'false';
}
function store(){
 try{localStorage.setItem(key,JSON.stringify(tasks));return true;}
 catch(_){message('Aufgaben konnten nicht lokal gespeichert werden. Browser-Speicher prüfen.',true);return false;}
}
function open(){
 const project=currentProject();
 if(!project){alert('Bitte zuerst ein Projekt öffnen.');return;}
 key='sd-agent-pro:v1:'+encodeURIComponent(project);
 try{tasks=window.SDStudioAgentPro.hydrate(JSON.parse(localStorage.getItem(key)||'[]'));}
 catch(_){tasks=[];message('Gespeicherte Aufgaben konnten nicht gelesen werden.',true);}
 $('agentProProject').textContent='Projekt: '+project+' · nur lokale Metadaten';
 $('agentProGoal').value='';
 $('agentProOverlay').hidden=false;lastButton=document.activeElement;
 render();$('agentProGoal').focus();
}
function close(){
 $('agentProOverlay').hidden=true;
 if(lastButton&&typeof lastButton.focus==='function')lastButton.focus();
}
function mutate(fn){
 try{const next=fn();if(next)tasks=next;store();render();}
 catch(error){message(error.message||'Aktion konnte nicht ausgeführt werden.',true);}
}
function createTask(){
 const engine=window.SDStudioAgentPro,planner=window.SDStudioTaskAgent;
 const goal=$('agentProGoal').value.trim();
 const files=currentFiles();
 if(!planner||!engine){message('Agentenmodule fehlen.',true);return;}
 try{
  const plan=planner.makePlan(goal,files,{errors:0,warnings:0},typeof S!=='undefined'?S.aktiv:null);
  if(plan.error)throw Error(plan.error);
  const random=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():
   Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const task=engine.create(goal,plan,files,'task-'+random,new Date().toISOString());
  tasks=engine.add(tasks,task);store();$('agentProGoal').value='';render();
  message('Aufgabe gespeichert. Noch keine KI-Ausführung und keine Dateiänderung.');
 }catch(error){message(error.message||'Aufgabe nicht angelegt.',true);}
}
function change(task,to,confirmed){
 const engine=window.SDStudioAgentPro;
 mutate(()=>{
  const files=currentFiles();
  return tasks.map(t=>t.id===task.id?engine.transition(t,to,files,new Date().toISOString(),confirmed):t);
 });
}
function runStatic(task){
 const files=currentFiles(),engine=window.SDStudioAgentPro;
 if(task.paths.some(p=>!engine.eligible(p)||typeof files[p]!=='string')){
  message('Dateien fehlen oder sind nicht mehr lesbar. Auftrag prüfen.',true);return;
 }
 const chosen=task.paths.map(path=>({path,content:files[path]}));
 if(!window.SDKITestLoop||!window.SDKICodeReview||!window.SDStudioTaskAgent){
  message('Statische Prüfroutinen sind nicht verfügbar.',true);return;
 }
 try{
  const result=window.SDKITestLoop.run(chosen,files,
   window.SDKICodeReview.review,window.SDStudioTaskAgent.projectGraph);
  tasks=tasks.map(t=>t.id===task.id?engine.recordStaticTest(t,result,files,new Date().toISOString()):t);
  store();render();
  message('Lokale statische Prüfung: '+result.fail+' Fehler, '+result.warnings+
   ' Warnungen, '+result.passes+' bestandene Einzelprüfungen. Kein Projektcode ausgeführt.'+
   (result.blocked?' Befunde müssen behoben werden.':' Laufzeit- und Gerätetests bleiben offen.'),result.blocked);
 }catch(error){message(error.message||'Statische Prüfung fehlgeschlagen.',true);}
}
function handoff(task){
 const bridge=window.SDKICodingUI;
 if(!bridge||typeof bridge.openChangeDialogWithGoal!=='function'){
  message('KI-Werkstatt nicht verfügbar.',true);return;
 }
 // Existing workshop resets consent. This board never supplies source content.
 const ok=bridge.openChangeDialogWithGoal(task.goal,task.paths);
 if(ok)close();
 else message('Übergabe konnte nicht geöffnet werden.',true);
}
function render(){
 const root=$('agentProTasks');root.replaceChildren();
 $('agentProCount').textContent=tasks.length+' / '+window.SDStudioAgentPro.MAX_TASKS+' Aufgaben';
 if(!tasks.length)root.append(node('p','agentProEmpty','Noch keine Aufgaben. Beschreibe oben einen Auftrag.'));
 const files=currentFiles(),engine=window.SDStudioAgentPro;
 for(const task of tasks){
  const card=node('article','agentProTask');
  const header=node('div','agentProTaskHeader');
  header.append(node('strong','agentProGoalText',task.goal));
  const status=node('span','agentProState',LABELS[task.status]);status.dataset.state=task.status;
  header.append(status);card.append(header);
  card.append(node('p','agentProSmall','Dateien: '+task.paths.join(', ')));
  const controls=node('div','agentProActions');card.append(controls);
  if(task.status==='open')button(controls,null,'▶ Beginnen',()=>change(task,'working'));
  if(task.status==='working'){
   button(controls,null,'✨ Zur KI-Werkstatt',()=>handoff(task));
   button(controls,null,'🧪 Prüfphase starten',()=>change(task,'testing'));
  }
  if(task.status==='testing'){
   button(controls,null,'🧪 Statisch prüfen',()=>runStatic(task));
   const approve=button(controls,null,'➡ Zur Freigabe',()=>change(task,'approval'));
   approve.disabled=!task.lastTest||task.lastTest.fail>0||task.lastTest.warnings>0||
    task.lastTest.snapshot!==engine.fingerprint(files,task.paths);
  }
  if(task.lastTest){
   card.append(node('p','agentProSmall','Letzte statische Prüfung: '+task.lastTest.fail+
    ' Fehler / '+task.lastTest.warnings+' Warnungen · Keine Laufzeittests'));
  }
  if(task.status==='approval'){
   const box=node('label','agentProConfirm');
   const check=node('input');check.type='checkbox';
   box.append(check,document.createTextNode(' Echte Funktionstests und Änderungen selbst geprüft; Freigabe erteilt.'));
   card.append(box);
   button(controls,null,'✓ Abschließen',()=>{
    if(!check.checked){message('Bitte zuerst echte Tests und Freigabe bestätigen.',true);return;}
    if(window.confirm('Auftrag als manuell freigegeben und erledigt markieren?'))change(task,'done',true);
   });
  }
  if(task.status==='done')card.append(node('p','agentProSmall','Manuell als erledigt bestätigt. Kein automatisches Deployment.'));
  button(controls,null,'Entfernen',()=>{
   if(!window.confirm('Diesen Aufgaben-Eintrag lokal entfernen? Projektdateien bleiben erhalten.'))return;
   mutate(()=>tasks.filter(t=>t.id!==task.id));
  });
  root.append(card);
 }
}
function setup(){
 if(!$('agentReviewBtn')||!window.SDStudioAgentPro||!window.SDStudioTaskAgent)return;
 const entry=button(document.createDocumentFragment(),'agentProBtn','🤖 SD Agent Pro',open);
 entry.title='Aufgaben verwalten, KI-Werkstatt nutzen und Prüfstände kontrollieren';
 $('agentReviewBtn').insertAdjacentElement('afterend',entry);
 const overlay=node('section','agentProOverlay');overlay.id='agentProOverlay';overlay.hidden=true;
 overlay.setAttribute('aria-label','SD Agent Pro Aufgaben');
 const dialog=node('div','agentProDialog');dialog.setAttribute('role','dialog');
 dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','agentProTitle');
 const head=node('div','agentProHead');
 const intro=node('div');const title=node('h2','', '🤖 SD Agent Pro');title.id='agentProTitle';
 intro.append(title,node('p','agentProSmall','Aufträge · Implementierung · Tests · Freigabe'));
 const exit=button(head,'agentProClose','✕ Schließen',close);
 head.prepend(intro);dialog.append(head);
 const info=node('p','agentProSmall');info.id='agentProProject';dialog.append(info);
 const label=node('label','agentProLabel','Neuer Entwicklungsauftrag');
 label.htmlFor='agentProGoal';dialog.append(label);
 const goal=node('textarea','agentProInput');goal.id='agentProGoal';goal.rows=3;goal.maxLength=1200;
 goal.placeholder='Zum Beispiel: Repariere die Navigation; bestehende Funktionen behalten.';
 dialog.append(goal);
 const action=node('div','agentProActions');
 button(action,'agentProAdd','＋ Aufgabe anlegen',createTask);
 dialog.append(action);
 const msg=node('p','agentProMessage');msg.id='agentProMessage';msg.setAttribute('role','status');
 msg.setAttribute('aria-live','polite');dialog.append(msg);
 const count=node('h3','agentProCount');count.id='agentProCount';dialog.append(count);
 const list=node('div','agentProTasks');list.id='agentProTasks';dialog.append(list);
 dialog.append(node('p','agentProSmall',
  'Nur lokale Aufgaben-Metadaten im Browser. Kein Modellzugriff, keine automatische Codeausführung, keine Dateiveränderung und keine Veröffentlichung. KI-Quelltextfreigabe erfolgt ausschließlich separat in der vorhandenen KI-Werkstatt.'));
 overlay.append(dialog);document.body.append(overlay);
 overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden){event.preventDefault();close();}});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
else setup();
})();
