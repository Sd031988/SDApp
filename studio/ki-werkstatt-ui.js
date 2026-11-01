/* SD Code-Studio KI-Code-Werkstatt: reviewed manual ChatGPT/Gemini workflow. */
(function(){
'use strict';
const core=window.SDKICoding;
if(!core)return;
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
let parsed=null,stagedProject=null,stagedSnapshot=null,busy=false;
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
function openDialog(){
 if(!S.gestartet){toast('Bitte Code-Studio zuerst vollständig starten.');return}
 $('kiProject').textContent=S.p?'Aktuelles Projekt: '+S.p.name:'Noch kein Projekt geöffnet.';
 $('kiOverlay').hidden=false;
 parsed=null;stagedSnapshot=null;stagedProject=null;
 $('kiResult').value='';$('kiFiles').replaceChildren();$('kiApply').disabled=true;$('kiDirect').disabled=true;
 $('kiInclude').checked=false;$('kiClipboard').hidden=true;
 status('Beschreibe die Aufgabe. Erstelle die Anfrage und füge danach den KI-Code hier ein.');
 $('kiGoal').focus();
}
function openDialogWithCode(text){
 openDialog();
 if($('kiOverlay').hidden)return false;
 $('kiResult').value=String(text||'');
 if($('kiResult').value.trim())analyse();
 $('kiResult').scrollIntoView({block:'nearest'});
 return true;
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
 const prompt=core.buildPrompt($('kiGoal').value,S.p,S.aktiv,selectedSource());
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
function updateActions(){
 const ready=!busy&&!!parsed&&!parsed.errors.length&&selectedFiles().length>0;
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
function renderPlan(){
 const list=$('kiFiles');list.replaceChildren();
 if(!parsed)return;
 const plan=core.buildPlan(parsed,currentFiles());
 for(const err of parsed.errors.concat(parsed.warnings)){
  const p=node('p','kiMessage',err);if(parsed.errors.includes(err))p.classList.add('error');list.append(p);
 }
 for(const file of plan){
  const label=node('label','kiFile'),checkbox=node('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.dataset.path=file.path;
  const detail=node('span','kiFileName');detail.append(node('strong','',file.path),node('small','',file.status+' · '+file.language.toUpperCase()+' · '+file.content.split('\n').length+' Zeilen'));label.append(checkbox,detail);list.append(label);
 }
 updateActions();
 status(parsed.errors.length?parsed.errors.length+' Problem(e) mit Dateipfaden. Bitte korrigieren.':plan.length+' reine Code-Datei(en) erkannt; Erklärungstext ignoriert. Noch nichts gespeichert.',parsed.errors.length>0);
}
function analyse(){
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
 const latest=currentFiles();
 for(const f of selected)if((latest[f.path]??null)!==(stagedSnapshot[f.path]??null)){
  status('Datei „'+f.path+'“ wurde inzwischen verändert. Bitte erneut analysieren.',true);return;
 }
 const changes=selected.filter(f=>latest[f.path]!==f.content);
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
 const button=$('kiCodeBtn'),overlay=$('kiOverlay');if(!button||!overlay)return;
 button.addEventListener('click',openDialog);
 $('kiClose').addEventListener('click',closeDialog);
 overlay.addEventListener('click',e=>{if(e.target===overlay)closeDialog()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();closeDialog()}});
 $('kiCopy').addEventListener('click',copyPrompt);
 $('kiChatGPT').addEventListener('click',()=>openAI('https://chatgpt.com/'));
 $('kiGemini').addEventListener('click',()=>openAI('https://gemini.google.com/'));
 $('kiAnalyse').addEventListener('click',analyse);
 $('kiFiles').addEventListener('change',updateActions);
 $('kiDirect').addEventListener('click',applyDirect);
 $('kiPaste').addEventListener('click',pasteWholeAnswer);
 $('kiApply').addEventListener('click',apply);
 $('kiResult').addEventListener('input',()=>{parsed=null;stagedSnapshot=null;updateActions();status('Antwort geändert – analysieren oder den vollständigen Text einfügen.')});
 $('kiResult').addEventListener('paste',()=>setTimeout(()=>{if(!$('kiOverlay').hidden)analyse()},30));
 // A mobile route without a sixth tab avoids shrinking the existing navigation.
 if($('handyNav'))$('handyNav').querySelector('[data-a="mehr"]')?.setAttribute('title','Mehr Funktionen, darunter ✨ KI Coding');
 window.SDKICodingUI={openDialog,openDialogWithCode,analyse,apply,applyDirect,currentFiles};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();