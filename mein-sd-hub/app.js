/* Mein SD Hub – on-device dashboard, tasks, lessons, projects and speech. */
(function(){
"use strict";
const D=window.SDPersonalData;
/* Text mit `Code` sicher als Textknoten und <code> einsetzen (kein innerHTML). */
function mitCode(el,text){String(text||"").split("`").forEach((teil,i)=>{if(!teil)return;if(i%2){const c=document.createElement("code");c.textContent=teil;el.appendChild(c)}else el.appendChild(document.createTextNode(teil))});return el}
if(!D){document.body.insertAdjacentText("afterbegin","SD Hub konnte die Lerninhalte nicht laden. Bitte die Seite neu laden.");return}
const $=id=>document.getElementById(id);
const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const node=(tag,cls,text,parent)=>{const e=mk(tag,cls,text);if(parent)parent.append(e);return e};
const findItem=id=>D.items.find(x=>x.id===id);
// Preserve legacy game favorites in stored data without advertising games in the professional workspace.
const workspaceItems=D.items.filter(it=>it.category!=="Spiele");
const inWorkspace=it=>Boolean(it&&it.category!=="Spiele");
const findCourse=id=>D.academy.find(x=>x.id===id);
const findPath=id=>D.paths.find(x=>x.id===id);
const findProject=id=>D.projects.find(x=>x.id===id);
const REC=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognizer=null,storageWorks=true;
let appFilter="Alle",appSearch="";
function readState(){try{const value=localStorage.getItem(D.storageKey);return value?D.sanitizeState(JSON.parse(value)):D.initial()}catch(e){storageWorks=false;return D.initial()}}
let state=readState();
function flash(message){$("storageStatus").textContent=message}
function save(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(D.storageKey,JSON.stringify(state));storageWorks=true}catch(e){storageWorks=false;flash("Speichern ist in diesem Browser nicht möglich. Fortschritt ist nur bis zum Schließen dieser Seite verfügbar.")}renderDashboard()}
function track(id){if(!findItem(id))return;state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,8);save()}
function toggleFavorite(id){if(!findItem(id))return;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[id,...state.favorites];save();renderWayResults()}
function itemLink(it, label, cls){const a=mk("a",cls||"",label||it.title+" ↗");a.href=it.href;a.dataset.track=it.id;return a}
function setTab(id,scroll){if(!["uebersicht","wegweiser","akademie","leben","projekte","sprache"].includes(id))id="uebersicht";
document.querySelectorAll(".module").forEach(m=>m.hidden=m.id!==id);
document.querySelectorAll(".tab").forEach(b=>{const active=b.dataset.tab===id;b.classList.toggle("active",active);b.setAttribute("aria-selected",String(active));if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
try{history.replaceState(null,"","#"+id)}catch(e){}
if(id!=="sprache")stopSpeech();
const more=$("mobileMore"),menu=$("mobileNavMenu");if(more&&menu){more.setAttribute("aria-expanded","false");menu.hidden=true;more.classList.toggle("active",["leben","sprache"].includes(id));}
if(scroll)window.scrollTo({top:document.querySelector(".tabs-shell").offsetTop,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>setTab(btn.dataset.tab,true)));
const mobileMore=$("mobileMore"),mobileMenu=$("mobileNavMenu");
mobileMore?.addEventListener("click",()=>{
 const open=mobileMenu.hidden;
 mobileMenu.hidden=!open;
 mobileMore.setAttribute("aria-expanded",String(open));
});
mobileMenu?.querySelectorAll("[data-mobile-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.mobileTab,true)));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&mobileMenu&&!mobileMenu.hidden){mobileMenu.hidden=true;mobileMore.setAttribute("aria-expanded","false");mobileMore.focus()}});
document.addEventListener("click",e=>{if(mobileMenu&&!mobileMenu.hidden&&!e.target.closest(".tabs-shell")){mobileMenu.hidden=true;mobileMore.setAttribute("aria-expanded","false")}});
document.querySelectorAll("[data-tablink]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();setTab(a.dataset.tablink,true)}));
document.addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(b)setTab(b.dataset.goto,true);const a=e.target.closest("a[data-track]");if(a)track(a.dataset.track)});
window.addEventListener("hashchange",()=>setTab(location.hash.slice(1),false));
function clearChildren(id){$(id).replaceChildren()}
function simpleLink(item){const a=itemLink(item,null,"simple-link");a.replaceChildren();node("span","",item.icon+"  "+item.title,a);node("span","","↗",a);return a}
function renderApps(){
 const box=$("appDirectory");if(!box)return;
 box.replaceChildren();
 const cats=["Alle",...new Set(workspaceItems.map(it=>it.category))];
 const filters=$("appFilters");filters.replaceChildren();
 cats.forEach(cat=>{
  const b=node("button","",cat,filters);
  b.type="button";b.setAttribute("aria-pressed",String(cat===appFilter));
  b.addEventListener("click",()=>{appFilter=cat;renderApps()});
 });
 let visible=0;
 for(const it of workspaceItems){
  const term=(it.title+" "+it.description+" "+it.category+" "+it.keywords).toLocaleLowerCase("de");
  const match=(appFilter==="Alle"||it.category===appFilter)&&(!appSearch||term.includes(appSearch));
  if(!match)continue;
  visible++;
  const card=node("article","sd-app-card",undefined,box);
  const a=node("a","sd-app-open",undefined,card);a.href=it.href;a.dataset.track=it.id;
  const icon=node("span","sd-app-icon",it.icon,a);icon.style.setProperty("--sd-icon-bg",it.color+"33");
  const copy=node("span","sd-app-copy",undefined,a);
  node("span","sd-app-name",it.title,copy);
  node("small","sd-app-description",it.description,copy);
  const star=node("button","sd-app-star",state.favorites.includes(it.id)?"★":"☆",card);
  star.type="button";
  star.setAttribute("aria-pressed",String(state.favorites.includes(it.id)));
  star.setAttribute("aria-label",(state.favorites.includes(it.id)?"Aus Favoriten entfernen: ":"Als Favorit merken: ")+it.title);
  star.addEventListener("click",()=>toggleFavorite(it.id));
 }
 $("appEmpty").hidden=visible!==0;
}
$("appSearch").addEventListener("input",e=>{appSearch=e.target.value.trim().toLocaleLowerCase("de");renderApps()});
const themeBtn=$("themeSwitch");
let mode="light";try{mode=localStorage.getItem("sdhub-theme-v1")==="dark"?"dark":"light"}catch(e){}
function setTheme(value){
 mode=value==="dark"?"dark":"light";
 document.documentElement.dataset.sdTheme=mode;
 themeBtn.setAttribute("aria-pressed",String(mode==="dark"));
 themeBtn.setAttribute("aria-label",mode==="dark"?"Helles Design aktivieren":"Dunkles Design aktivieren");
 themeBtn.querySelector("span").textContent=mode==="dark"?"Hell":"Dunkel";
 try{localStorage.setItem("sdhub-theme-v1",mode)}catch(e){}
}
themeBtn.addEventListener("click",()=>setTheme(mode==="dark"?"light":"dark"));
setTheme(mode);
function renderDashboard(){
$("greeting").textContent=state.nickname?"Hallo, "+state.nickname+"!":"Willkommen im SD Hub!";
if($("nickname")!==document.activeElement)$("nickname").value=state.nickname;
$("statLessons").textContent=String(state.completedLessons.length);
$("statSteps").textContent=String(state.completedSteps.length);
$("statFavs").textContent=String(state.favorites.map(findItem).filter(inWorkspace).length);
clearChildren("favoritesList");clearChildren("recentList");
const favs=state.favorites.map(findItem).filter(inWorkspace),recent=state.recent.map(findItem).filter(inWorkspace);
if(!favs.length)node("p","panel-sub","Noch keine Favoriten. Wähle im Wegweiser einen Stern.",$("favoritesList"));
else favs.forEach(it=>$("favoritesList").append(simpleLink(it)));
if(!recent.length)node("p","panel-sub","Hier ist es noch leer. Öffne eines deiner Werkzeuge.",$("recentList"));
else recent.forEach(it=>$("recentList").append(simpleLink(it)));
renderApps();
}
$("nickname").addEventListener("input",e=>{state.nickname=e.target.value.slice(0,40).replace(/[<>]/g,"");save()});
$("exportState").addEventListener("click",()=>downloadText("mein-sd-hub-sicherung.json",JSON.stringify({...state,version:1},null,2),"application/json;charset=utf-8"));
$("importState").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",async e=>{const file=e.target.files&&e.target.files[0];e.target.value="";if(!file)return;
if(file.size>256000){flash("Diese Datei ist zu groß. Bitte wähle eine gültige SD-Hub-Sicherung.");return}
try{const raw=JSON.parse(await file.text());if(raw===null||typeof raw!=="object"||Array.isArray(raw)||raw.version!==1)throw Error("invalid");if(!confirm("Die gespeicherten Fortschritte und Favoriten auf diesem Gerät durch die Sicherung ersetzen?"))return;state=D.sanitizeState(raw);save();renderCourses();renderPaths();renderWayResults();flash("Die Sicherung wurde importiert.")}catch(err){flash("Die Datei ist keine gültige SD-Hub-Sicherung.")}});
$("clearState").addEventListener("click",()=>{if(!confirm("Wirklich alle persönlichen Fortschritte und Favoriten dieses SD-Hub-Bereichs auf diesem Gerät löschen?"))return;state={...D.initial(),favorites:[]};try{localStorage.removeItem(D.storageKey)}catch(e){}renderDashboard();renderCourses();renderPaths();renderWayResults();flash("Die lokalen SD-Hub-Daten wurden gelöscht.")});
if(!storageWorks)flash("Private Browser-Einstellungen können die lokale Speicherung verhindern.");
function downloadText(filename,text,type){const blob=new Blob([text],{type:type||"text/html;charset=utf-8"}),url=URL.createObjectURL(blob),a=mk("a");a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
// Wayfinder: deterministic, private, no network requests.
let activeGoal="lernen",wayItems=[];
function renderWayResults(){const target=$("wayResults");target.replaceChildren();const items=(wayItems.length?wayItems:D.goals[0].itemIds.map(findItem)).filter(inWorkspace);
items.forEach(it=>{const card=node("div","tool-card",undefined,target);node("span","icon",it.icon,card);const body=node("div","body",undefined,card);node("b","",it.title,body);node("p","",it.description,body);body.append(itemLink(it,"Öffnen ↗","open"));const star=node("button","star"+(state.favorites.includes(it.id)?" on":""),state.favorites.includes(it.id)?"★":"☆",card);star.type="button";star.setAttribute("aria-label",(state.favorites.includes(it.id)?"Aus Favoriten entfernen: ":"Zu Favoriten hinzufügen: ")+it.title);star.setAttribute("aria-pressed",String(state.favorites.includes(it.id)));star.addEventListener("click",()=>toggleFavorite(it.id))});
}
D.goals.forEach(goal=>{const btn=node("button","goal",undefined,$("goalGrid"));btn.type="button";btn.dataset.goal=goal.id;node("span","emoji",goal.emoji,btn);node("b","",goal.title,btn);node("small","",goal.subtitle,btn);
btn.addEventListener("click",()=>{activeGoal=goal.id;wayItems=goal.itemIds.map(findItem).filter(Boolean);$("goalSearch").value="";$("goalStatus").textContent="Passende Angebote für „"+goal.title+"“";document.querySelectorAll(".goal").forEach(g=>{g.classList.toggle("active",g===btn);g.setAttribute("aria-pressed",String(g===btn))});renderWayResults()})});
$("goalSearchBtn").addEventListener("click",()=>searchGoal());
$("goalSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchGoal()});
function searchGoal(){const text=$("goalSearch").value.trim();if(!text){$("goalStatus").textContent="Bitte beschreibe kurz dein Ziel.";return}wayItems=D.recommend(text,8).filter(inWorkspace).slice(0,6);document.querySelectorAll(".goal").forEach(x=>{x.classList.remove("active");x.setAttribute("aria-pressed","false")});if(!wayItems.length){$("goalStatus").textContent="Dazu gibt es noch keine eindeutige Empfehlung. Du kannst die Kategorien oben auswählen.";wayItems=[];return renderWayResults()}$("goalStatus").textContent=wayItems.length+" passende Werkzeuge gefunden (lokale Stichwortsuche).";renderWayResults()}
document.querySelector('.goal[data-goal="lernen"]').click();
// Akademie
let courseId="german",lessonId="g-1",answered=false;
const kursLadevorgaenge=new Map();
function ladeKurs(id){
 const kurs=findCourse(id);
 if(!kurs)return Promise.reject(new Error("Kurs nicht gefunden"));
 if(kurs.lessons)return Promise.resolve(kurs);
 if(kursLadevorgaenge.has(id))return kursLadevorgaenge.get(id);
 const p=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="./kurse/"+encodeURIComponent(id)+".js";
  script.onload=()=>{
   const lessons=window.SDAkademieKurse?.[id];
   if(!Array.isArray(lessons)){reject(new Error("Lektionsdaten fehlen"));return}
   kurs.lessons=lessons;resolve(kurs);
  };
  script.onerror=()=>reject(new Error("Kursdatei konnte nicht geladen werden"));
  document.head.appendChild(script);
 }).catch(error=>{kursLadevorgaenge.delete(id);throw error});
 kursLadevorgaenge.set(id,p);return p;
}
function renderCourses(){
 clearChildren("courses");
 for(const bereich of ["Programmieren","Computer & Internet","Deutsch","Arbeit & Beruf"]){
  const group=node("section","course-group",undefined,$("courses"));
  node("h3","",bereich,group);
  const entries=node("div","course-group-list",undefined,group);
  for(const course of D.academy.filter(c=>c.bereich===bereich)){
   const ids=D.academyLessonIds[course.id]||[];
   const complete=ids.filter(id=>state.completedLessons.includes(id)).length;
   const btn=node("button","course"+(course.id===courseId?" active":""),undefined,entries);
   btn.type="button";btn.setAttribute("aria-pressed",String(course.id===courseId));
   node("span","emoji",course.icon,btn);
   node("b","",course.name,btn);
   node("span","badge",course.stufe,btn);
   node("small","",course.summary,btn);
   node("small","","Empfohlene Reihenfolge: "+(D.academy.filter(c=>c.bereich===bereich).indexOf(course)+1)+" · "+(course.voraussetzungen.length?course.voraussetzungen.join(", "):"Keine Voraussetzungen"),btn);
   const track=node("div","progress-track",undefined,btn),bar=node("div","progress-bar",undefined,track);
   bar.style.width=(ids.length?complete/ids.length*100:0)+"%";
   node("div","progress-label",complete+" / "+ids.length+" Lektionen",btn);
   btn.addEventListener("click",()=>{courseId=course.id;lessonId=ids[0];answered=false;renderCourses()});
  }
 }
 renderLessonList();
}
function renderLessonList(){
 const c=findCourse(courseId);if(!c)return;
 $("courseHeading").textContent=c.icon+" "+c.name;
 $("courseSummary").textContent=c.summary;
 clearChildren("lessonList");clearChildren("lessonDetail");
 if(!c.lessons){
  const status=node("p","panel-sub","Lade Kurs …",$("lessonDetail"));
  status.setAttribute("role","status");
  ladeKurs(c.id).then(()=>{if(courseId===c.id)renderLessonList()}).catch(()=>{if(courseId===c.id)status.textContent="Der Kurs konnte nicht geladen werden. Bitte erneut öffnen."});
  return;
 }
 c.lessons.forEach(l=>{
  const btn=node("button","lesson-btn"+(l.id===lessonId?" active":""),undefined,$("lessonList"));
  btn.type="button";btn.setAttribute("aria-pressed",String(l.id===lessonId));
  const left=node("span","",undefined,btn);
  node("b","",l.title,left);
  node("small","",l.minutes+" Minuten · "+(l.schritte?"Praxis & Quiz":"Übungsfrage"),left);
  node("span",state.completedLessons.includes(l.id)?"done-tag":"panel-sub",state.completedLessons.includes(l.id)?"✓ Gelernt":"Öffnen ↗",btn);
  btn.addEventListener("click",()=>{lessonId=l.id;answered=false;renderLessonList()});
 });
 renderLesson();renderCourseFinal(c);
}
function renderCourseFinal(course){
 const target=$("lessonDetail"),completed=course.lessons.every(l=>state.completedLessons.includes(l.id));
 const section=node("section","ak-course-final",undefined,target);
 node("h4","","Kursabschluss",section);
 if(!completed){node("p","","Schließe zuerst alle Lektionen dieses Kurses ab. Danach kannst du den Abschlusstest machen.",section);return}
 const start=node("button","btn outline small","Abschlusstest starten (10 Fragen)",section);start.type="button";
 start.onclick=()=>{
  start.disabled=true;
  const pool=course.lessons.flatMap(l=>l.quiz?.map(q=>({frage:q.frage,antworten:q.antworten,richtig:q.richtig}))||(l.question?[{frage:l.question,antworten:l.choices,richtig:l.answer}]:[]));
  if(!pool.length){node("p","","Für diesen Kurs fehlen noch Abschlussfragen.",section);return}
  let index=0,points=0;
  const area=node("div","ak-final-questions",undefined,section);
  const next=()=>{
   area.replaceChildren();
   if(index===10){
    node("p","",points+" von 10 Fragen richtig beantwortet.",area);
    if(points<7){const retry=node("button","btn outline small","Erneut versuchen",area);retry.onclick=()=>{index=0;points=0;next()};return}
    const certificate=node("section","ak-certificate",undefined,area);
    node("h2","","Teilnahmebestätigung",certificate);
    node("p","","Du hast den Kurs „"+course.name+"“ abgeschlossen.",certificate);
    const label=node("label","","Name (freiwillig): ",certificate),input=node("input","",undefined,label);input.placeholder="Dein Name";
    node("p","","Datum: "+new Date().toLocaleDateString("de-DE"),certificate);
    node("p","","Diese Teilnahmebestätigung ist KEIN offizielles Zertifikat.",certificate);
    const print=node("button","btn primary","Teilnahmebestätigung drucken",certificate);print.type="button";print.onclick=()=>window.print();
    return;
   }
   const q=pool[index%pool.length];
   node("h5","",(index+1)+". "+q.frage,area);
   const answers=node("div","answers",undefined,area);
   q.antworten.forEach((text,i)=>{const btn=node("button","",text,answers);btn.type="button";btn.onclick=()=>{if(i===q.richtig)points++;index++;next()}});
  };
  next();
 };
}
function renderLesson(){clearChildren("lessonDetail");const l=findCourse(courseId).lessons.find(x=>x.id===lessonId);if(!l)return;if(l.schritte){renderCodeLesson(l);return}const q=node("div","quiz",undefined,$("lessonDetail"));node("span","badge","LEKTION · "+l.minutes+" MIN",q);node("h4","",l.title,q);node("p","",l.explanation,q);node("h4","",l.question,q);const answers=node("div","answers",undefined,q),feedback=node("div","",undefined,q);let locked=false;
if(l.uebungen&&window.SDAkademieUebungen)l.uebungen.forEach(u=>window.SDAkademieUebungen.render(q,u));
l.choices.forEach((choice,i)=>{const b=node("button","",choice,answers);b.type="button";b.addEventListener("click",()=>{if(locked)return;locked=true;const correct=i===l.answer;[...answers.children].forEach((option,j)=>{option.disabled=true;if(j===l.answer)option.classList.add("correct");else if(j===i)option.classList.add("wrong")});feedback.className="feedback"+(correct?"":" error");feedback.textContent=(correct?"✓ Richtig! Lektion abgeschlossen. ":"Das war noch nicht richtig. ") +l.tip;
if(correct&&!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderCourses();}else if(!correct){const retry=node("button","btn outline small","Noch einmal versuchen ↻",q);retry.type="button";retry.style.marginTop="12px";retry.addEventListener("click",()=>renderLesson())}
})});
}

const academyDrafts=new Map();
function previewHtml(code){
 const style=code.css.replace(new RegExp("<"+"/style","gi"),"<" + "/style");
 const script=code.js.replace(new RegExp("<"+"/script","gi"),"<" + "/script");
 return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+style+'</style></head><body>'+code.html+'<script>'+script+'<'+'/script></body></html>';
}
function academyToStudio(baseName,code){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open("sdCodeStudio",1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("projekte"))db.createObjectStore("projekte",{keyPath:"name"})};
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const db=req.result;
   let number=1;
   const choose=()=>{
    const name=baseName+(number===1?"":" ("+number+")");
    const tx=db.transaction("projekte","readwrite"),store=tx.objectStore("projekte");
    const check=store.get(name);
    check.onsuccess=()=>{
     if(check.result){number++;return}
     const html=['<!doctype html>','<html lang="de">','<head>','  <meta charset="utf-8">','  <meta name="viewport" content="width=device-width, initial-scale=1">','  <link rel="stylesheet" href="style.css">','</head>','<body>',code.html,'  <script src="script.js"><'+'/script>','</body>','</html>'].join("\n");
     store.add({name,dateien:{"index.html":html,"style.css":code.css,"script.js":code.js},haupt:"index.html",versionen:[],erstellt:Date.now(),t:Date.now()});
    };
    tx.oncomplete=()=>{if(check.result){choose()}else{db.close();resolve(name)}};
    tx.onerror=()=>{db.close();reject(tx.error)};
   };
   choose();
  };
 });
}
function renderCodeLesson(l){
 const area=$("lessonDetail"),wrap=node("section","code-lesson",undefined,area);
 node("span","badge","PRAXIS · "+l.minutes+" MIN",wrap);
 node("h4","",l.title,wrap);node("h5","","Dein Ziel",wrap);node("p","",l.ziel,wrap);
 l.schritte.forEach((step,i)=>{const sec=node("section","code-step",undefined,wrap);node("h5","",(i+1)+". "+step.titel,sec);const erkl=String(step.erklaerung||"").trim(),voll=String(step.text||"").trim(),ohneDoppel=erkl&&voll.endsWith(erkl)?voll.slice(0,-erkl.length).trim():voll;mitCode(node("p","",undefined,sec),ohneDoppel);if(step.code){const pre=node("pre","code-example",undefined,sec);node("code","",step.code,pre);if(erkl)mitCode(node("p","",undefined,sec),erkl)}});
 node("h5","","Häufige Fehler",wrap);const errors=node("ul","",undefined,wrap);l.fehler.forEach(f=>{const li=node("li","",undefined,errors);node("b","",f.titel+": ",li);mitCode(li,f.text)});
 node("h5","","Jetzt selbst schreiben",wrap);
 const code=academyDrafts.get(l.id)||{...l.beispiel};academyDrafts.set(l.id,code);
 const grid=node("div","code-workspace",undefined,wrap),editor=node("div","code-editor",undefined,grid);
 const tabs=node("div","code-tabs",undefined,editor),label=node("label","",undefined,editor),textarea=node("textarea","code-textarea",undefined,editor);
 textarea.spellcheck=false;textarea.autocapitalize="off";textarea.autocomplete="off";textarea.autocorrect="off";
 const keys=[["html","HTML"],["css","CSS"],["js","JavaScript"]];
 let active="html",timer;
 function select(key){active=key;label.textContent=key.toUpperCase()+" bearbeiten";textarea.value=code[key];keys.forEach(([k])=>buttons[k].setAttribute("aria-pressed",String(k===key)))}
 const buttons={};
 keys.forEach(([key,title])=>{const b=node("button","",title,tabs);b.type="button";buttons[key]=b;b.onclick=()=>select(key)});
 const view=node("div","code-preview",undefined,grid);node("strong","","Live-Vorschau",view);
 const frame=node("iframe","code-frame",undefined,view);frame.setAttribute("sandbox","allow-scripts");frame.title="Vorschau deiner Webseite";
 const update=()=>{frame.srcdoc=previewHtml(code)};
 textarea.addEventListener("input",()=>{code[active]=textarea.value;clearTimeout(timer);timer=setTimeout(update,400)});
 select(active);update();
 const reset=node("button","btn outline small","Zurücksetzen",editor);reset.type="button";reset.onclick=()=>{if(!confirm("Deinen Code durch den Startcode ersetzen?"))return;Object.assign(code,l.beispiel);select(active);update()};
 node("h5","","Deine Aufgabe",wrap);node("p","",l.aufgabe.text,wrap);
 if(l.projektLink&&/^\/mein-sd-hub\/p4-(?:quiz\.html|module\/index\.html)$/.test(l.projektLink)){const link=node("a","btn outline small","Vollständiges Praxisprojekt öffnen",wrap);link.href=l.projektLink;link.target="_blank";link.rel="noopener noreferrer";}
 const checks=node("div","code-checks",undefined,wrap),check=node("button","btn outline small code-pruefen","Prüfen",wrap);check.type="button";
 const hint=node("p","hint",l.aufgabe.tipp,wrap);hint.hidden=true;
 const solution=node("button","btn outline small","Lösung zeigen",wrap);solution.type="button";solution.hidden=true;
 let failures=0,passed=false;
 check.onclick=()=>{checks.replaceChildren();const doc=new DOMParser().parseFromString(code.html,"text/html");
  const results=l.aufgabe.pruefungen.map(p=>{const ok=D.pruefeCode(p.test,code,doc);node("p",ok?"code-ok":"code-error",(ok?"✓ ":"✗ ")+p.beschreibung,checks);return ok});
  passed=results.every(Boolean);if(!passed)failures++;hint.hidden=failures<2;solution.hidden=failures<3;
  if(passed)node("p","code-ok","Sehr gut! Jetzt beantworte die Quizfragen.",checks);
 };
 solution.onclick=()=>{Object.assign(code,l.aufgabe.loesung);select(active);update();checks.replaceChildren();passed=false};
 node("h5","","Wissen prüfen",wrap);
 let correct=0;const quizBoxes=[];
 l.quiz.forEach((q,qi)=>{const box=node("section","code-quiz",undefined,wrap);quizBoxes.push(box);node("h5","",(qi+1)+". "+q.frage,box);const answers=node("div","answers",undefined,box),feedback=node("p","feedback",undefined,box);feedback.hidden=true;
 q.antworten.forEach((answer,i)=>{const b=node("button","",answer,answers);b.type="button";b.onclick=()=>{if(box.dataset.done)return;box.dataset.done="1";[...answers.children].forEach(x=>x.disabled=true);if(i===q.richtig)correct++;feedback.hidden=false;feedback.textContent=(i===q.richtig?"✓ Richtig. ":"Noch nicht richtig. ")+(q.begruendungen?.[i]||"")+" "+q.erklaerung;feedback.classList.toggle("error",i!==q.richtig);if(quizBoxes.every(x=>x.dataset.done)&&correct===l.quiz.length&&passed&&!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderDashboard();renderCourses()}}});
 });
 if(l.uebungen&&window.SDAkademieUebungen){node("h5","","Weitere Übungen",wrap);l.uebungen.forEach(u=>window.SDAkademieUebungen.render(wrap,u))}
 node("h5","","Das merkst du dir",wrap);const ul=node("ul","",undefined,wrap);l.merke.forEach(x=>mitCode(node("li","",undefined,ul),x));
 const studio=node("button","btn primary","Im Code-Studio öffnen ↗",wrap);studio.type="button";
 const status=node("p","message","",wrap);
 studio.onclick=async()=>{studio.disabled=true;const baseName="Akademie – "+l.title;try{const name=await academyToStudio(baseName,code);location.href="/studio/index.html?projekt="+encodeURIComponent(name)}catch(e){status.textContent="Projekt konnte nicht gespeichert werden: "+e.message;studio.disabled=false}};
}
// Deutschland Pfade
let pathId="start";
function renderPaths(){clearChildren("pathGrid");D.paths.forEach(p=>{const done=p.steps.filter((s,i)=>state.completedSteps.includes(p.id+":"+i)).length;const btn=node("button","path"+(p.id===pathId?" active":""),undefined,$("pathGrid"));btn.type="button";btn.setAttribute("aria-pressed",String(p.id===pathId));node("span","emoji",p.icon,btn);node("b","",p.title,btn);node("small","",p.description,btn);const track=node("div","progress-track",undefined,btn);const bar=node("div","progress-bar",undefined,track);bar.style.width=(done/p.steps.length*100)+"%";node("span","progress-label",done+" / "+p.steps.length+" Schritte",btn);btn.addEventListener("click",()=>{pathId=p.id;renderPaths()})});renderSteps()}
function renderSteps(){const p=findPath(pathId);if(!p)return;$("pathHeading").textContent=p.icon+" "+p.title;$("pathSummary").textContent=p.description;clearChildren("pathSteps");
p.steps.forEach(([title,description,href],index)=>{const key=p.id+":"+index;const row=node("div","step-row",undefined,$("pathSteps"));const label=node("label","step-check",undefined,row);const input=node("input","",undefined,label);input.type="checkbox";input.checked=state.completedSteps.includes(key);input.setAttribute("aria-label",title+" als erledigt markieren");const text=node("span","text",undefined,label);node("b","",title,text);node("small","",description,text);
const go=node("a","step-go","Zum Werkzeug ↗",row);go.href=href;const it=D.items.find(x=>x.href===href);if(it)go.dataset.track=it.id;
input.addEventListener("change",()=>{if(input.checked){if(!state.completedSteps.includes(key))state.completedSteps.push(key)}else state.completedSteps=state.completedSteps.filter(x=>x!==key);save();renderPaths()});
})}
// Project workshop: templates are static strings, no user HTML injection.
let projectId="profile";
const templateCss="*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;color:#1d3f3c;background:#f5faf7}main{max-width:880px;margin:30px auto;padding:24px}h1{font-size:clamp(30px,6vw,54px);letter-spacing:-.04em;margin-bottom:12px}p{line-height:1.6}a{color:#146b58}section{background:white;padding:24px;border-radius:17px;margin:15px 0;box-shadow:0 6px 25px #123c2712}button,input{font:inherit;padding:9px;border-radius:8px;border:1px solid #ceded7}button{cursor:pointer;background:#125d4c;color:white}footer{margin-top:25px;color:#5e8175;font-size:12px}";
function htmlBase(title,body,extra,accent){const col=accent||"#146b58";return '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+templateCss+'h1{color:'+col+'}'+(extra||"")+'</style></head><body><main>'+body+'</main></body></html>'}
function projectHtml(id){
if(id==="profile")return htmlBase("Meine persönliche Seite",'<header><p>HALLO, ICH BIN</p><h1>Dein Name</h1><p>Willkommen auf meiner persönlichen Webseite.</p></header><section><h2>Über mich</h2><p>Beschreibe dich, deine Interessen und deine Ziele in wenigen Sätzen.</p></section><section><h2>Was ich mache</h2><p>Hier kannst du deine Erfahrungen, Kenntnisse oder Hobbys vorstellen.</p></section><section><h2>Kontakt</h2><p>Ergänze hier später deine gewünschten Kontaktmöglichkeiten – veröffentliche nur Daten, die du teilen möchtest.</p></section><footer>Erstellt mit der SD Hub Projektwerkstatt.</footer>');
if(id==="invite")return htmlBase("Meine Einladung",'<section style="text-align:center;padding:50px 25px;border:3px solid #d7c1f2"><p>DU BIST EINGELADEN!</p><h1>Wir feiern zusammen</h1><p>Ein schöner Anlass zum Zusammensein.</p><p><strong>Samstag · 15:00 Uhr</strong></p><p>Ort: Hier den Veranstaltungsort eintragen</p><p>Wir freuen uns auf dich!</p></section>',"body{background:#f8f2ff;color:#4a326d}section{background:#fffafb}", "#8052a9");
if(id==="portfolio")return htmlBase("Mein Portfolio",'<header><p>MEIN KREATIVES PORTFOLIO</p><h1>Ideen, die ich gestaltet habe</h1><p>Hier zeige ich eine Auswahl meiner Projekte.</p></header><div class="cards"><section><h2>Projekt 1</h2><p>Eine Beschreibung der ersten Idee.</p></section><section><h2>Projekt 2</h2><p>Was mich an diesem Projekt begeistert hat.</p></section><section><h2>Projekt 3</h2><p>Ein weiteres Beispiel meiner Arbeit.</p></section></div><footer>Erstellt mit SD Hub.</footer>',".cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.cards section{min-height:150px;background:#e5f4ff}","#315e88");
if(id==="task")return htmlBase("Meine Aufgabenliste",'<h1>Meine Aufgaben</h1><p>Erledige deine Aufgaben Schritt für Schritt. Die Daten bleiben in deinem Browser.</p><section><form id="form"><label for="task">Neue Aufgabe:</label><br><input id="task" required maxlength="100" autocomplete="off" placeholder="Was möchtest du tun?"><button type="submit">Hinzufügen</button></form><ul id="list"></ul><button id="clear" type="button">Erledigte entfernen</button></section><footer>Erstellt mit SD Hub.</footer><script>(function(){"use strict";var key="sdhub.template.tasks.v1",list=document.getElementById("list"),input=document.getElementById("task");var tasks=[];try{tasks=JSON.parse(localStorage.getItem(key)||"[]");if(!Array.isArray(tasks))tasks=[]}catch(e){}function save(){try{localStorage.setItem(key,JSON.stringify(tasks))}catch(e){}}function draw(){list.replaceChildren();tasks.forEach(function(item,index){var li=document.createElement("li"),check=document.createElement("input");check.type="checkbox";check.checked=!!item.done;check.addEventListener("change",function(){item.done=check.checked;save();draw()});var span=document.createElement("span");span.textContent=item.text;span.style.textDecoration=item.done?"line-through":"none";li.append(check,span);list.append(li)})}document.getElementById("form").addEventListener("submit",function(e){e.preventDefault();var value=input.value.trim();if(!value)return;tasks.push({text:value.slice(0,100),done:false});input.value="";save();draw()});document.getElementById("clear").addEventListener("click",function(){tasks=tasks.filter(function(x){return !x.done});save();draw()});draw()})();</script>');
return htmlBase("SD Hub Projekt","<h1>Mein Projekt</h1>")}
function renderProjects(){clearChildren("projectGrid");D.projects.forEach(p=>{const b=node("button","project"+(p.id===projectId?" active":""),undefined,$("projectGrid"));b.type="button";b.setAttribute("aria-pressed",String(p.id===projectId));const icon=node("span","project-icon",p.icon,b);icon.style.background=p.colors[1];node("b","",p.title,b);node("small","",p.subtitle,b);b.addEventListener("click",()=>{projectId=p.id;renderProjects()})});
const p=findProject(projectId);$("projectHeading").textContent=p.icon+" "+p.title;$("projectDescription").textContent=p.subtitle;$("projectPreview").srcdoc=projectHtml(projectId);
}
$("downloadProject").addEventListener("click",()=>{const p=findProject(projectId);downloadText(p.file,projectHtml(projectId))});
// German phrase cards: speech synthesis on device/browser, optional browser voice-recognition on explicit click.
function stopSpeech(){try{if(window.speechSynthesis)window.speechSynthesis.cancel()}catch(e){}if(recognizer){try{recognizer.abort()}catch(e){}recognizer=null}}
function speaking(text){if(!("speechSynthesis"in window)||typeof SpeechSynthesisUtterance==="undefined"){$("speechStatus").textContent="Dein Browser bietet hier keine Sprachausgabe an.";return}stopSpeech();const u=new SpeechSynthesisUtterance(text);u.lang="de-DE";u.rate=Number($("speechSpeed").value)||.78;u.onstart=()=>$("speechStatus").textContent="Der deutsche Satz wird vorgelesen.";u.onend=()=>$("speechStatus").textContent="Wiedergabe beendet.";u.onerror=()=>$("speechStatus").textContent="Die Sprachausgabe ist auf diesem Gerät nicht verfügbar.";window.speechSynthesis.speak(u)}
function practice(phrase,status){if(!REC){status.textContent="Spracherkennung wird von deinem Browser nicht unterstützt.";return}
if(!confirm("Du möchtest die Browser-Spracherkennung starten. Dabei kann deine Stimme an den Anbieter des Browsers übertragen werden. Fortfahren?")){status.textContent="Spracherkennung nicht gestartet.";return}
stopSpeech();let r;try{r=new REC();r.lang="de-DE";r.interimResults=false;r.maxAlternatives=1;recognizer=r;r.onresult=e=>{const text=e.results&&e.results[0]&&e.results[0][0]&&e.results[0][0].transcript||"";const expected=D.normalize(phrase.de).replace(/[.,!?]/g,""),actual=D.normalize(text).replace(/[.,!?]/g,"");const hits=expected.split(" ").filter(x=>actual.includes(x)).length;status.textContent="Erkannt: „"+text+"“. "+(actual===expected||hits>=Math.ceil(expected.split(" ").length*.8)?"Sehr ähnlich!":"Versuche es noch einmal langsam.");recognizer=null};
r.onerror=e=>{status.textContent="Spracherkennung nicht verfügbar ("+e.error+").";recognizer=null};r.onend=()=>{if(recognizer===r)recognizer=null};r.start();status.textContent="Sprich jetzt den Satz. Die Browser-Spracherkennung kann Audio an den Sprachanbieter übertragen."}catch(e){status.textContent="Die Spracherkennung konnte nicht gestartet werden. Bitte prüfe die Mikrofonberechtigung.";recognizer=null}}
function renderPhrases(){const lang=$("translateLang").value;clearChildren("phraseList");D.phrases.forEach(p=>{const card=node("article","phrase",undefined,$("phraseList"));node("h3","",p.de,card);const trans=node("div","translated",p[lang]||"Übersetzung nicht verfügbar",card);trans.lang=lang;trans.dir=["fa","ur"].includes(lang)?"rtl":"auto";node("small","",p.hint,card);const actions=node("div","phrase-actions",undefined,card);const play=node("button","","🔊 Anhören",actions);play.type="button";play.addEventListener("click",()=>speaking(p.de));if(REC){const mic=node("button","","🎙 Nachsprechen",actions);mic.type="button";const status=node("div","message",undefined,card);mic.addEventListener("click",()=>practice(p,status))}})}
$("translateLang").addEventListener("change",()=>{stopSpeech();renderPhrases()});
$("speechSpeed").addEventListener("change",()=>stopSpeech());
window.addEventListener("pagehide",()=>stopSpeech());
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopSpeech()});
renderDashboard();renderCourses();renderPaths();renderProjects();renderPhrases();setTab(location.hash.slice(1),false);
})();