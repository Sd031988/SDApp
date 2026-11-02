/* SD Code-Studio KI-Code-Werkstatt: reviewed manual ChatGPT/Gemini workflow. */
(function(){
'use strict';
const core=window.SDKICoding;
if(!core)return;
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
let parsed=null,stagedProject=null,stagedSnapshot=null,busy=false,changeMode=false;
let repairDraft=null,repairSource=null,testResult=null;
function currentFiles(){
 const p=typeof S!=='undefined'&&S.p;
 if(!p)return {};
 const files={...p.dateien};
 Object.entries(S.docs||{}).forEach(([name,doc])=>{
  if(doc&&typeof doc.getValue==='function')files[name]=doc.getValue();
  else if(doc&&typeof doc.wert==='string')files[name]=doc.wert;
 });
 return files;
}
function status(msg,problem){
 const e=$('kiStatus');e.textContent=msg;e.dataset.error=problem?'true':'false';
}
function renderChangeSources(){
 const list=$('kiSources');list.replaceChildren();
 if(!S.p)return;
 const files=currentFiles(),suggested=new Set(core.suggestChangeFiles({dateien:files},S.aktiv));
 const paths=Object.keys(files).filter(p=>core.changeFileAllowed(p,files[p])).sort((a,b)=>
   Number(suggested.has(b))-Number(suggested.has(a))||a.localeCompare(b));
 for(const path of paths.slice(0,120)){
  const label=node('label','kiSource'),check=node('input');check.type='checkbox';
  check.checked=suggested.has(path);check.dataset.path=path;
  const detail=node('span','kiFileName');detail.append(node('strong','',path),
   node('small','',files[path].length.toLocaleString('de-DE')+' Zeichen'+(suggested.has(path)?' · vorgeschlagen':'')));
  label.append(check,detail);list.append(label);
 }
 if(!paths.length)list.append(node('p','kiHint','Keine geeigneten Code-Dateien gefunden.'));
}
function selectMode(mode){
 changeMode=mode==='change';
 $('kiChangeBox').hidden=!changeMode;
 $('kiIncludeRow').hidden=changeMode;
 $('kiGoalLabel').textContent=changeMode?'1. Welche Änderung möchtest du an deinem bestehenden Projekt?':'1. Was möchtest du programmieren?';
 $('kiGoal').placeholder=changeMode?'Zum Beispiel: Füge auf meiner Quittungsseite einen Drucken-Knopf hinzu und behalte alle bisherigen Funktionen.':'Zum Beispiel: Baue eine Webseite mit Startseite, Galerie und Kontakt.';
 $('kiCopy').textContent=changeMode?'📋 Änderungsanfrage kopieren':'📋 Anfrage kopieren';
 $('kiChangeConsent').checked=false;
 $('kiClipboard').hidden=true;
 if(changeMode)renderChangeSources();
}
function clearRepairDraft(){
 repairDraft=null;repairSource=null;testResult=null;
 const list=$('kiRepairProposals'),stage=$('kiRepairStage'),copy=$('kiRepairCopy');
 const testBtn=$('kiTestRun'),report=$('kiTestResults');
 if(testBtn)testBtn.disabled=true;
 if(report)report.replaceChildren();
 if($('kiTestStatus'))$('kiTestStatus').textContent='Noch keine lokalen Tests ausgeführt.';
 if(list)list.replaceChildren();
 if(stage)stage.disabled=true;
 if(copy)copy.disabled=true;
 if($('kiRepairStatus'))$('kiRepairStatus').textContent='Korrekturen werden nur vorgeschlagen und nie automatisch gespeichert.';
}
function openDialog(mode){
 if(!S.gestartet){toast('Bitte Code-Studio zuerst vollständig starten.');return}
 $('kiProject').textContent=S.p?'Aktuelles Projekt: '+S.p.name:'Noch kein Projekt geöffnet.';
 $('kiOverlay').hidden=false;
 parsed=null;stagedSnapshot=null;stagedProject=null;
 clearRepairDraft();
 $('kiResult').value='';$('kiFiles').replaceChildren();$('kiDiff').hidden=true;$('kiApply').disabled=true;$('kiDirect').disabled=true;
 $('kiReview').hidden=true;$('kiReviewFindings').replaceChildren();
 $('kiInclude').checked=false;$('kiClipboard').hidden=true;
 selectMode(mode);
 status('Beschreibe die Aufgabe. Erstelle die Anfrage und füge danach den KI-Code hier ein.');
 $('kiGoal').focus();
}
function openChangeDialog(){openDialog('change');}
/* Local Agent -> KI-Werkstatt: task and suggested file paths only.
   Source contents remain behind the existing explicit consent checkbox. */
function openChangeDialogWithGoal(goal,paths){
 if(typeof goal!=='string'||!goal.trim())return false;
 openDialog('change');
 if($('kiOverlay').hidden)return false;
 $('kiGoal').value=goal.slice(0,3000);
 $('kiChangeConsent').checked=false;
 $('kiClipboard').value='';
 $('kiClipboard').hidden=true;
 if(Array.isArray(paths)){
  const wanted=new Set(paths.filter(p=>typeof p==='string').slice(0,12));
  $('kiSources').querySelectorAll('input[data-path]').forEach(check=>{
   check.checked=wanted.has(check.dataset.path)&&core.changeFileAllowed(check.dataset.path,currentFiles()[check.dataset.path]);
  });
 }
 status('Agent-Plan übernommen. Bitte vorgeschlagene Dateien überprüfen. Inhalte werden erst nach deiner ausdrücklichen Zustimmung in die KI-Anfrage kopiert.');
 return true;
}
function openServices(){
 if(!S.gestartet){toast('Bitte Code-Studio zuerst vollständig starten.');return}
 $('kiOverlay').hidden=true;
 $('kiServicesOverlay').hidden=false;
 $('kiServicesQuestion').focus();
}
function closeServices(){$('kiServicesOverlay').hidden=true;}
function servicesPrompt(){
 const goal=$('kiServicesQuestion').value.trim();
 if(!goal){$('kiServicesStatus').textContent='Bitte zuerst eine Frage oder gewünschte Änderung eingeben.';return ''}
 // Include project filenames and stable output format, but never transfer source or credentials.
 return core.buildPrompt(goal,{name:S.p?.name||'SD-Projekt',dateien:currentFiles()},S.aktiv,null);
}
async function copyServicesPrompt(){
 const request=servicesPrompt();if(!request)return;
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
  await navigator.clipboard.writeText(request);
  $('kiServicesStatus').textContent='✓ Anfrage kopiert. Öffne Google KI und füge sie dort ein. Keine Projektinhalte wurden automatisch übermittelt.';
  $('kiServicesClipboard').hidden=true;
 }catch(e){
  const box=$('kiServicesClipboard');box.hidden=false;box.value=request;
  box.focus();box.select();
  $('kiServicesStatus').textContent='Manuelles Kopieren: Der Text ist markiert. Danach Google KI öffnen.';
 }
}
function openDialogWithCode(text){
 openDialog();
 if($('kiOverlay').hidden)return false;
 $('kiResult').value=String(text||'');
 if($('kiResult').value.trim())analyse();
 $('kiResult').scrollIntoView({block:'nearest'});
 return true;
}
// Trusted local hand-off from the optional, explicitly installed Chrome bridge.
// No ChatGPT cookies, passwords, browsing history or browser storage are requested.
const bridgeSeen=new Set();
function acceptBrowserBridge(event){
 if(event.source!==window||event.origin!==location.origin)return;
 const m=event.data;
 if(!m||m.type!=='SD_STUDIO_SELECTED_CHAT_TEXT'||m.version!==1||
   typeof m.nonce!=='string'||!/^[-a-f0-9]{12,80}$/i.test(m.nonce)||
   !['chatgpt','gemini'].includes(m.provider)||
   typeof m.text!=='string'||!m.text.trim()||m.text.length>250000)return;
 if(bridgeSeen.has(m.nonce))return;
 if(!S.gestartet||!S.p)return; // Browser extension keeps the pending selection until the Studio is ready.
 if(!openDialogWithCode(m.text))return;
 bridgeSeen.add(m.nonce);
 if(bridgeSeen.size>100)bridgeSeen.delete(bridgeSeen.values().next().value);
 status('✓ '+(m.provider==='chatgpt'?'ChatGPT':'Gemini')+'-Auswahl angekommen. Nur erkannte Code-Dateien sind vorbereitet. Bitte prüfen, vergleichen und die Übernahme ausdrücklich bestätigen.');
 window.postMessage({type:'SD_STUDIO_SELECTED_CHAT_ACK',version:1,nonce:m.nonce},location.origin);
}
function closeDialog(){$('kiOverlay').hidden=true;}
function selectedSource(){
 if(!$('kiInclude').checked||!S.p||!S.aktiv)return null;
 const code=currentFiles()[S.aktiv];
 if(typeof code!=='string'||code.startsWith('data:'))return null;
 if(/(?:secret|api[_-]?key|token|password|passwd|private[_-]?key)/i.test(code)||/\.env|secret|credential/i.test(S.aktiv)){
  status('Mögliche Zugangsdaten erkannt. Dieser Dateiinhalt wird nicht geteilt.',true);
  return null;
 }
 return code;
}
function promptText(){
 let prompt='';
 if(changeMode){
  if(!$('kiChangeConsent').checked){status('Bitte zuerst ausdrücklich bestätigen, dass du die ausgewählten Code-Dateien in die KI-Anfrage kopieren möchtest.',true);return ''}
  const chosen=[...$('kiSources').querySelectorAll('input:checked')].map(el=>el.dataset.path);
  try{prompt=core.buildChangePrompt($('kiGoal').value,{name:S.p?.name,dateien:currentFiles()},chosen);}
  catch(e){status(e.message||String(e),true);return ''}
 }else{
  prompt=core.buildPrompt($('kiGoal').value,S.p,S.aktiv,selectedSource());
 }
 if(!prompt)status('Bitte die Programmieraufgabe beschreiben.',true);
 return prompt;
}
async function copyPrompt(){
 const prompt=promptText();if(!prompt)return;
 try{await navigator.clipboard.writeText(prompt);status('Anfrage kopiert. Jetzt bei ChatGPT oder Gemini einfügen und Antwort zurückkopieren.');}
 catch{
  $('kiClipboard').hidden=false;$('kiClipboard').value=prompt;$('kiClipboard').focus();$('kiClipboard').select();
  status('Kopieren blockiert. Text ist markiert: bitte manuell kopieren.',true);
 }
}
function showPromptPreview(){
 const prompt=promptText();if(!prompt)return;
 $('kiClipboard').hidden=false;$('kiClipboard').value=prompt;
 $('kiClipboard').focus();
 $('kiClipboard').scrollIntoView({block:'nearest'});
 status('Änderungsanfrage angezeigt. Prüfe die Inhalte, bevor du sie kopierst.');
}
function openAI(url){
 const prompt=promptText();if(!prompt)return;
 window.open(url,'_blank','noopener,noreferrer'); // user click: avoids popup blockers
 const fallback=()=>{
  $('kiClipboard').hidden=false;$('kiClipboard').value=prompt;$('kiClipboard').focus();$('kiClipboard').select();
  status('KI geöffnet. Kopieren wurde blockiert: die Anfrage ist zum manuellen Kopieren markiert.',true);
 };
 try{
  navigator.clipboard.writeText(prompt).then(()=>status('KI-Seite geöffnet und Anfrage kopiert. Bitte dort einfügen.')).catch(fallback);
 }catch{fallback()}
}
function selectedFiles(){
 const chosen=new Set([...$('kiFiles').querySelectorAll('input[type=checkbox]:checked')].map(x=>x.dataset.path));
 return parsed?.files.filter(f=>chosen.has(f.path))||[];
}
function renderCodeReview(){
 const panel=$('kiReview'),items=$('kiReviewFindings'),headline=$('kiReviewSummary');
 if(!panel||!items||!headline)return null;
 items.replaceChildren();
 if(!parsed||parsed.errors.length||!selectedFiles().length){panel.hidden=true;return null;}
 panel.hidden=false;
 const engine=window.SDKICodeReview;
 if(!engine||typeof engine.review!=='function'){
  headline.textContent='Lokale Codeprüfung nicht verfügbar. Bitte Studio neu laden.';
  headline.dataset.state='blocked';return null;
 }
 const report=engine.review(selectedFiles(),stagedSnapshot||currentFiles());
 headline.dataset.state=report.blocked||report.skipped?'blocked':report.warnings?'warning':'ok';
 headline.textContent=report.blocked
  ?'⛔ '+report.critical+' mögliche Zugangsdaten-Funde: Übernahme gesperrt.'
  :report.skipped
   ?'⚠️ '+report.skipped+' Datei(en) konnten nicht vollständig geprüft werden.'
   :report.findings.length
    ?'🛡 '+report.warnings+' Warnung(en), '+report.infos+' Hinweis(e). Bitte Vorschläge prüfen.'
    :'✓ Keine Befunde bei den vorhandenen lokalen Prüfregeln.';
 for(const finding of report.findings.slice(0,50)){
  const line=node('article','kiReviewFinding');
  line.dataset.severity=finding.severity;
  line.append(node('strong','',finding.file+':'+finding.line+' · '+finding.title),
    node('p','',finding.advice));
  items.append(line);
 }
 if(report.truncated)items.append(node('p','kiHint','Weitere Befunde nicht angezeigt. Bitte Code zusätzlich manuell prüfen.'));
 return report;
}

function createRepairDraft(){
 clearRepairDraft();
 if(!parsed||parsed.errors.length||!selectedFiles().length){
  $('kiRepairStatus').textContent='Bitte zuerst KI-Code-Dateien analysieren und auswählen.';
  return;
 }
 if(stagedProject!==(S.p?S.p.name:null)){
  $('kiRepairStatus').textContent='Projekt wurde gewechselt. Bitte neu analysieren.';
  return;
 }
 const selected=selectedFiles(), latest=currentFiles();
 if(selected.some(f=>(latest[f.path]??null)!==(stagedSnapshot?.[f.path]??null))){
  $('kiRepairStatus').textContent='Projektdateien wurden geändert. Bitte erneut analysieren.';
  return;
 }
 const engine=window.SDKIRepairAssistant, report=renderCodeReview();
 if(!engine||!report){
  $('kiRepairStatus').textContent='Reparaturprüfung nicht verfügbar. Bitte Studio neu laden.';
  return;
 }
 repairDraft=engine.createPlan(selected,stagedSnapshot||{},report);
 if(repairDraft.blocked){
  $('kiRepairStatus').textContent='Reparatur gesperrt: '+repairDraft.reason;
  repairDraft=null;return;
 }
 repairSource=new Map(selected.map(f=>[f.path,f.content]));
 const list=$('kiRepairProposals');
 for(const p of repairDraft.proposals){
  const item=node('article','kiRepairItem');
  item.append(node('strong','',p.path+':'+p.line+' · '+p.title));
  const before=node('pre','kiRepairBefore',p.before);
  const after=node('pre','kiRepairAfter',p.after);
  const columns=node('div','kiRepairDiff');
  const left=node('div','');left.append(node('b','','Bisheriger KI-Vorschlag'),before);
  const right=node('div','');right.append(node('b','','Vorgeschlagene Korrektur'),after);
  columns.append(left,right);item.append(columns);
  list.append(item);
 }
 for(const p of repairDraft.manual){
  const item=node('article','kiRepairItem');
  item.append(node('strong','',p.path+':'+p.line+' · '+p.title+' (manuell prüfen)'),
    node('p','',p.advice));
  list.append(item);
 }
 if(!repairDraft.proposals.length&&!repairDraft.manual.length)
  list.append(node('p','kiHint','Keine Reparaturhinweise für die ausgewählten Dateien.'));
 $('kiRepairStatus').textContent=repairDraft.proposals.length+' sichere, lokal vorbereitete Korrektur(en); '+
  repairDraft.manual.length+' weitere Hinweise zur manuellen oder KI-gestützten Prüfung. Noch nichts verändert.';
 $('kiRepairStage').disabled=true;
 $('kiTestRun').disabled=!repairDraft.updatedFiles.length;
 $('kiRepairCopy').disabled=!repairDraft.manual.length;
 if(repairDraft.updatedFiles.length)$('kiTestStatus').textContent='Korrekturen vorhanden: jetzt lokale Vorher/Nachher-Tests ausführen.';
}

function runRepairChecks(selected,plan){
 const engine=window.SDKITestLoop,review=window.SDKICodeReview?.review,
  graph=window.SDStudioTaskAgent?.projectGraph;
 if(!engine||!review||!graph)return null;
 return engine.compareRepair(selected,stagedSnapshot||{},plan,review,graph);
}
function testRepairDraft(){
 const report=$('kiTestResults'),summary=$('kiTestStatus');report.replaceChildren();
 testResult=null;$('kiRepairStage').disabled=true;
 if(!repairDraft||repairDraft.blocked||!repairDraft.updatedFiles?.length){
  summary.textContent='Keine sichere Korrektur zum Prüfen vorbereitet.';return;
 }
 if(!parsed||parsed.errors.length||stagedProject!==(S.p?S.p.name:null)){
  summary.textContent='Projekt oder KI-Dateien haben sich geändert. Bitte neu analysieren.';return;
 }
 const files=selectedFiles(),current=new Map(files.map(f=>[f.path,f.content]));
 const latest=currentFiles();
 if(!repairSource||repairSource.size!==current.size||
   [...current].some(([path,content])=>repairSource.get(path)!==content)||
   files.some(f=>(latest[f.path]??null)!==(stagedSnapshot?.[f.path]??null))){
  summary.textContent='Veraltete Testbasis: Dateiauswahl oder Projekt wurden verändert. Bitte Reparatur neu planen.';
  return;
 }
 testResult=runRepairChecks(files,repairDraft);
 if(!testResult){
  summary.textContent='Lokale Testengine fehlt. Eine Übernahme ohne Vergleich ist nicht erlaubt.';return;
 }
 const before=testResult.before,after=testResult.after;
 summary.dataset.state=testResult.canStage?'improved':'blocked';
 summary.textContent='Vorher: '+before.fail+' fehlgeschlagene Prüfungen, '+before.warnings+' Warnungen. '+
  'Nachher: '+after.fail+' fehlgeschlagene Prüfungen, '+after.warnings+' Warnungen. '+
  testResult.fixed.length+' behoben, '+testResult.introduced.length+' neu. '+
  (testResult.canStage?'✓ Korrektur darf als Entwurf vorbereitet werden.':'⚠️ Korrektur nicht freigegeben.');
 for(const item of testResult.fixed.slice(0,12)){
  const li=node('li','','Behoben: '+item.file+' · '+item.label);report.append(li);
 }
 for(const item of testResult.introduced.slice(0,12)){
  const li=node('li','','Neu: '+item.file+' · '+item.label);report.append(li);
 }
 if(!testResult.fixed.length&&!testResult.introduced.length)
  report.append(node('li','','Keine nachweisbare Verbesserung. Statische Prüfungen sind kein Laufzeittest.'));
 $('kiRepairStage').disabled=!testResult.canStage;
}

function stageRepair(){
 if(!repairDraft||repairDraft.blocked||!repairDraft.updatedFiles.length)return;
 if(!parsed||parsed.errors.length||stagedProject!==(S.p?S.p.name:null)){
  $('kiRepairStatus').textContent='Veralteter Plan. Bitte den Code erneut analysieren.';
  clearRepairDraft();return;
 }
 const selected=selectedFiles(),current=new Map(selected.map(f=>[f.path,f.content]));
 if(!repairSource||repairSource.size!==current.size||[...current].some(([name,code])=>repairSource.get(name)!==code)){
  clearRepairDraft();
  $('kiRepairStatus').textContent='Dateiauswahl oder Code verändert. Bitte neue Reparaturvorschläge erstellen.';
  return;
 }
 const latest=currentFiles();
 if(selected.some(f=>(latest[f.path]??null)!==(stagedSnapshot?.[f.path]??null))){
  clearRepairDraft();
  $('kiRepairStatus').textContent='Projektdateien verändert. Bitte erneut analysieren.';
  return;
 }
 if(!checkSelectedCodeReview())return;
 // Rerun trusted static checks on current candidate immediately before stage.
 const verified=runRepairChecks(selected,repairDraft);
 if(!testResult?.canStage||!verified?.canStage){
  $('kiRepairStage').disabled=true;
  $('kiTestStatus').textContent='Sicherheits- oder Regressionstest fehlgeschlagen. Bitte erneut prüfen.';
  return;
 }
 const updates=new Map(repairDraft.updatedFiles.map(f=>[f.path,f.content]));
 const count=updates.size,first=repairDraft.updatedFiles[0].path;
 const selectedNames=new Set(selected.map(f=>f.path));
 parsed={...parsed,files:parsed.files.map(f=>updates.has(f.path)?{...f,content:updates.get(f.path)}:f)};
 repairDraft=null;repairSource=null;
 renderPlan();
 $('kiFiles').querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=selectedNames.has(c.dataset.path));
 updateActions();
 $('kiRepairStage').disabled=true;
 $('kiTestRun').disabled=true;
 $('kiRepairCopy').disabled=true;
 $('kiRepairStatus').textContent=count+' Datei(en) NUR in der KI-Code-Vorschau korrigiert. Bitte den Unterschied prüfen und die Übernahme später ausdrücklich bestätigen.';
 diffAnzeigen(first);
}
async function copyRepairRequest(){
 if(!repairDraft||repairDraft.blocked)return;
 const text=window.SDKIRepairAssistant?.repairPrompt(repairDraft);
 if(!text)return;
 try{
  if(!navigator.clipboard?.writeText)throw Error('Clipboard not available');
  await navigator.clipboard.writeText(text);
  $('kiRepairStatus').textContent='Reparaturanfrage kopiert: nur Befunde, Zeilen und Pfade; keine Quelltexte.';
 }catch(_){
  const field=$('kiClipboard');
  field.hidden=false;field.value=text;field.focus();field.select();
  $('kiRepairStatus').textContent='Reparaturanfrage zum manuellen Kopieren markiert. Keine Quelltexte.';
 }
}

function checkSelectedCodeReview(){
 const report=renderCodeReview();
 if(!report||report.blocked||report.skipped){
  status('Codeprüfung blockiert die Übernahme: Bitte Zugangsdaten entfernen oder unvollständig geprüfte Dateien korrigieren.',true);
  return false;
 }
 return true;
}
function updateActions(){
 const review=renderCodeReview();
 const ready=!busy&&!!parsed&&!parsed.errors.length&&selectedFiles().length>0&&
  !!review&&!review.blocked&&!review.skipped;
 $('kiApply').disabled=!ready;
 $('kiDirect').disabled=!ready;
}
function openSelectedInEditor(files){
 const preferred=files.find(f=>f.path==='index.html')||
   files.find(f=>/(^|\/)index\.html?$/i.test(f.path))||
   files.find(f=>/\.html?$/i.test(f.path))||files[0];
 for(const file of files){
  if(!S.tabs.includes(file.path)&&S.tabs.length<18)S.tabs.push(file.path);
  const parts=file.path.split('/').slice(0,-1);
  parts.forEach((_,i)=>S.offen.add(parts.slice(0,i+1).join('/')));
 }
 baum();
 dateiOeffnen(preferred.path);
 if(typeof ansicht==='function')ansicht('code');
}
function diffAnzeigen(path){
 const file=parsed?.files.find(f=>f.path===path);if(!file)return;
 const old=currentFiles()[path]??'';
 const q=window.SDStudioQualitaet;
 const d=q?q.fileDiff(old,file.content):{oldLines:0,newLines:0,startLine:1};
 $('kiDiff').hidden=false;
 $('kiDiffName').textContent=path;
 $('kiDiffInfo').textContent=(old?'Ersetzte/geänderte Zeilen ab ':'Neue Datei ab ')+'Zeile '+d.startLine+
   ' · alt: '+d.oldLines+' Zeile(n), neu: '+d.newLines+' Zeile(n). '+
   'Die Vorschau zeigt den vollständigen Code bis maximal 70.000 Zeichen pro Seite.';
 $('kiDiffOld').textContent=old.slice(0,70000)||(old?'':'(neue Datei)');
 $('kiDiffNew').textContent=file.content.slice(0,70000);
 $('kiDiff').scrollIntoView({block:'nearest'});
}
function renderPlan(){
 const list=$('kiFiles');list.replaceChildren();
 if(!parsed)return;
 const plan=core.buildPlan(parsed,currentFiles());
 for(const err of parsed.errors.concat(parsed.warnings)){
  const p=node('p','kiMessage',err);if(parsed.errors.includes(err))p.classList.add('error');list.append(p);
 }
 for(const file of plan){
  const label=node('label','kiFile'),checkbox=node('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.dataset.path=file.path;
  const detail=node('span','kiFileName');detail.append(node('strong','',file.path),node('small','',(file.status==='ersetzt in Kopie'?'bestehende Datei – Änderung prüfen':file.status)+' · '+file.language.toUpperCase()+' · '+file.content.split('\n').length+' Zeilen'));
 const compare=node('button','kiDiffShow','🔎 Vergleichen');compare.type='button';compare.dataset.path=file.path;
 label.append(checkbox,detail,compare);list.append(label);
 }
 updateActions();
 status(parsed.errors.length?parsed.errors.length+' Problem(e) mit Dateipfaden. Bitte korrigieren.':plan.length+' reine Code-Datei(en) erkannt; Erklärungstext ignoriert. Noch nichts gespeichert.',parsed.errors.length>0);
}
function analyse(){
 clearRepairDraft();
 $('kiDiff').hidden=true;
 parsed=core.parse($('kiResult').value,S.aktiv,currentFiles());
 stagedProject=S.p?S.p.name:null;
 stagedSnapshot=currentFiles();
 renderPlan();
}
async function pasteWholeAnswer(){
 try{
  if(!navigator.clipboard||!navigator.clipboard.readText)throw Error('no clipboard');
  const content=await navigator.clipboard.readText();
  if(!content.trim()){status('Zwischenablage ist leer. Bitte die gesamte KI-Antwort kopieren.',true);return}
  $('kiResult').value=content;
  analyse();
 }catch(e){
  $('kiResult').focus();
  status('Zwischenablage nicht freigegeben. Bitte in das große Textfeld tippen und die gesamte KI-Antwort mit Einfügen einsetzen.',true);
 }
}
async function uniqueName(base){
 const p=typeof slug==='function'?slug(base):String(base).replace(/[^a-z0-9._-]+/gi,'-').toLowerCase();
 let name=p||'ki-projekt',n=2;
 while(await projLesen(name))name=p+'-'+n++;
 return name;
}
async function applyDirect(){
 if(busy||!parsed||parsed.errors.length||!parsed.files.length){status('Bitte zuerst den KI-Code analysieren.',true);return}
 if(!S.gestartet||!S.p){status('Bitte zuerst ein Projekt im Code-Studio öffnen.',true);return}
 if(stagedProject!==S.p.name){status('Projekt wurde gewechselt. Bitte erneut analysieren.',true);return}
 const selected=selectedFiles();
 if(!selected.length){status('Wähle mindestens eine Datei aus.',true);return}
 if(!checkSelectedCodeReview())return;
 const latest=currentFiles();
 for(const f of selected)if((latest[f.path]??null)!==(stagedSnapshot[f.path]??null)){
  status('Datei „'+f.path+'“ wurde inzwischen verändert. Bitte erneut analysieren.',true);return;
 }
 const changes=selected.filter(f=>latest[f.path]!==f.content);
 const risk=window.SDStudioQualitaet?.preflight(
   Object.fromEntries(changes.map(f=>[f.path,f.content])),null)||[];
 const secrets=risk.filter(i=>i.kind==='secret');
 if(secrets.length){status('Sicherheitsprüfung blockiert den Import: '+secrets.map(i=>i.file).join(', ')+'. Bitte Zugangsdaten entfernen.',true);return}
 const replaced=changes.filter(f=>Object.prototype.hasOwnProperty.call(latest,f.path)).length;
 if(changes.length&&!window.confirm(
  'Ausgewählte KI-Dateien DIREKT in das geöffnete Projekt „'+S.p.name+'“ übernehmen?\n\n'+
  changes.length+' neue/geänderte Datei(en), davon '+replaced+' bestehende Datei(en) ersetzen.\n'+
  changes.map(f=>'• '+f.path).join('\n')+
  '\n\nVorher wird eine Sicherung unter 🕘 Versionen gespeichert. Der Code wird NICHT automatisch ausgeführt.'
 ))return;
 busy=true;updateActions();
 const project=S.p;
 try{
  if(changes.length){
   await versionNeu('Vor direktem KI-Code-Import',true);
   if(S.p!==project)throw Error('Projekt wurde während des Imports gewechselt');
   const now=currentFiles();
   for(const f of selected)if((now[f.path]??null)!==(latest[f.path]??null))
    throw Error('Datei '+f.path+' wurde inzwischen geändert. Bitte erneut analysieren.');
   // Any old iframe is stopped; the new untrusted code only runs after ▶ Ausführen.
   const frame=$('frame');
   frame.removeAttribute('src');frame.srcdoc='';frame.setAttribute('sandbox','allow-scripts allow-forms');
   $('vorschau').hidden=true;
   const before={...project.dateien},hadTag=Object.prototype.hasOwnProperty.call(project,'kiQuelle'),tag=project.kiQuelle;
   for(const f of changes)project.dateien[f.path]=f.content;
   project.kiQuelle=tag||project.name;
   try{await projSchreiben(project)}
   catch(e){
    project.dateien=before;
    if(hadTag)project.kiQuelle=tag;else delete project.kiQuelle;
    throw e;
   }
   for(const f of changes)delete S.docs[f.path]; // Do not restore stale CodeMirror documents.
  }
  openSelectedInEditor(selected);
  closeDialog();
  ausgabe('➡️ KI-Code direkt in den Code-Editor übernommen: '+selected.map(f=>f.path).join(', ')+
   '\n'+(changes.length?'Vorherige Version gespeichert. ':'Dateien waren bereits vorhanden. ')+
   'Nicht automatisch ausgeführt – mit ▶ Ausführen prüfen.');
  toast('✅ '+selected.length+' Datei(en) im Code-Editor geöffnet.');
 }catch(e){console.error(e);status('Direkte Übernahme fehlgeschlagen: '+(e?.message||String(e)),true)}
 finally{busy=false;updateActions()}
}
async function apply(){
 if(busy||!parsed||parsed.errors.length||!parsed.files.length){status('Zuerst Code ohne Fehler analysieren.',true);return}
 if(!S.gestartet||stagedProject!==(S.p?S.p.name:null)){status('Projekt gewechselt. Bitte KI-Code neu analysieren.',true);return}
 const chosen=new Set([...$('kiFiles').querySelectorAll('input[type=checkbox]:checked')].map(x=>x.dataset.path));
 const selected=parsed.files.filter(f=>chosen.has(f.path));
 if(!selected.length){status('Wähle mindestens eine Datei aus.',true);return}
 if(!checkSelectedCodeReview())return;
 const latest=currentFiles();
 for(const file of selected)if((latest[file.path]??null)!==(stagedSnapshot[file.path]??null)){
  status('Datei '+file.path+' wurde inzwischen bearbeitet. Bitte erneut analysieren.',true);return;
 }
 const original=S.p;
 const name=await uniqueName((original?original.name:'mein-projekt')+'-ki-'+Date.now().toString(36));
 const overwrite=core.buildPlan({files:selected},latest).filter(f=>f.status==='ersetzt in Kopie').length;
 const list=selected.map(f=>'• '+f.path).join('\n');
 if(!window.confirm('KI-Code in NEUE PROJEKTKOPIE übernehmen?\n\n'+name+
   '\n'+selected.length+' Datei(en), '+overwrite+' vorhandene Datei(en) werden NUR in der Kopie geändert.\n\n'+list+
   '\n\nDas Original bleibt unverändert. Bitte KI-Code prüfen.'))return;
 busy=true;$('kiApply').disabled=true;status('Neue Projektkopie wird angelegt …');
 try{
  if(original){await speichernJetzt();if(S.p!==original)throw Error('Projektwechsel während Speichern');}
  const files={...latest};for(const file of selected)files[file.path]=file.content;
  const project={name,dateien:files,haupt:original?.haupt||selected.find(f=>/(^|\/)index\.html$/i.test(f.path))?.path||selected[0].path,
   versionen:[],erstellt:Date.now(),kiQuelle:original?.name||null};
  await projSchreiben(project);
  await projektOeffnen(name,selected[0].path,{keineAutoVorschau:true});
  if(S.p?.name!==name)throw Error('Neue Projektkopie konnte nicht geöffnet werden');
  closeDialog();
  ausgabe('✨ KI-Code in einer neuen Projektkopie gespeichert: '+name+'\n'+list+
   '\nOriginal nicht überschrieben. Prüfen und mit ▶ Ausführen testen.');
  if(typeof ansicht==='function')ansicht('code');
  toast('✨ KI-Code gespeichert, NICHT ausgeführt. ▶ Ausführen zum Testen.');
 }catch(e){console.error(e);status('Import fehlgeschlagen: '+(e?.message||String(e))+'. Original bleibt erhalten.',true);}
 finally{busy=false;updateActions()}
}
function setup(){
 window.addEventListener('message',acceptBrowserBridge);
 const button=$('kiCodeBtn'),overlay=$('kiOverlay');if(!button||!overlay)return;
 button.addEventListener('click',()=>openDialog());
 $('kiChangeBtn').addEventListener('click',openChangeDialog);
 const serviceBtn=$('kiServicesBtn'),serviceOverlay=$('kiServicesOverlay');
 if(serviceBtn&&serviceOverlay){
  serviceBtn.addEventListener('click',openServices);
  $('kiServicesClose').addEventListener('click',closeServices);
  serviceOverlay.addEventListener('click',e=>{if(e.target===serviceOverlay)closeServices()});
  $('kiServicesCopy').addEventListener('click',copyServicesPrompt);
  $('kiServicesCode').addEventListener('click',()=>{closeServices();openDialog();$('kiResult').focus()});
  $('kiServicesChange').addEventListener('click',()=>{closeServices();openChangeDialog()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!serviceOverlay.hidden){e.preventDefault();closeServices()}});
 }
 $('kiSources').addEventListener('change',()=>{$('kiChangeConsent').checked=false;$('kiClipboard').value='';$('kiClipboard').hidden=true;status('Dateiauswahl geändert. Bitte die Freigabe der Inhalte erneut bestätigen.');});
 $('kiChangeConsent').addEventListener('change',()=>{$('kiClipboard').value='';$('kiClipboard').hidden=true;});
 $('kiGoal').addEventListener('input',()=>{$('kiClipboard').value='';$('kiClipboard').hidden=true;});
 $('kiPromptPreview').addEventListener('click',showPromptPreview);
 $('kiClose').addEventListener('click',closeDialog);
 overlay.addEventListener('click',e=>{if(e.target===overlay)closeDialog()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();closeDialog()}});
 $('kiCopy').addEventListener('click',copyPrompt);
 $('kiChatGPT').addEventListener('click',()=>openAI('https://chatgpt.com/'));
 $('kiGemini').addEventListener('click',()=>openAI('https://gemini.google.com/'));
 $('kiAnalyse').addEventListener('click',analyse);
 $('kiFiles').addEventListener('change',()=>{clearRepairDraft();updateActions()});
 $('kiRepairPrepare').addEventListener('click',createRepairDraft);
 $('kiTestRun').addEventListener('click',testRepairDraft);
 $('kiRepairStage').addEventListener('click',stageRepair);
 $('kiRepairCopy').addEventListener('click',copyRepairRequest);
 $('kiFiles').addEventListener('click',e=>{const b=e.target.closest('.kiDiffShow');if(b)diffAnzeigen(b.dataset.path)});
 $('kiDiffClose').addEventListener('click',()=>{$('kiDiff').hidden=true});
 $('kiDirect').addEventListener('click',applyDirect);
 $('kiPaste').addEventListener('click',pasteWholeAnswer);
 $('kiApply').addEventListener('click',apply);
 $('kiResult').addEventListener('input',()=>{clearRepairDraft();parsed=null;stagedSnapshot=null;updateActions();status('Antwort geändert – analysieren oder den vollständigen Text einfügen.')});
 $('kiResult').addEventListener('paste',()=>setTimeout(()=>{if(!$('kiOverlay').hidden)analyse()},30));
 // A mobile route without a sixth tab avoids shrinking the existing navigation.
 if($('handyNav'))$('handyNav').querySelector('[data-a="mehr"]')?.setAttribute('title','Mehr Funktionen, darunter ✨ KI Coding');
 window.SDKICodingUI={openDialog,openChangeDialog,openChangeDialogWithGoal,openServices,openDialogWithCode,analyse,apply,applyDirect,currentFiles,diffAnzeigen};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();