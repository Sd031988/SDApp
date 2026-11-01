/* Mein SD Hub – on-device dashboard, tasks, lessons, projects and speech. */
(function(){
"use strict";
const D=window.SDPersonalData;
if(!D){document.body.insertAdjacentText("afterbegin","SD Hub konnte die Lerninhalte nicht laden. Bitte die Seite neu laden.");return}
const $=id=>document.getElementById(id);
const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const node=(tag,cls,text,parent)=>{const e=mk(tag,cls,text);if(parent)parent.append(e);return e};
const findItem=id=>D.items.find(x=>x.id===id);
const findCourse=id=>D.academy.find(x=>x.id===id);
const findPath=id=>D.paths.find(x=>x.id===id);
const findProject=id=>D.projects.find(x=>x.id===id);
const REC=window.SpeechRecognition||window.webkitSpeechRecognition;
let recognizer=null,storageWorks=true;
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
if(scroll)window.scrollTo({top:document.querySelector(".tabs-shell").offsetTop,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
}
document.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>setTab(btn.dataset.tab,true)));
document.querySelectorAll("[data-tablink]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();setTab(a.dataset.tablink,true)}));
document.addEventListener("click",e=>{const b=e.target.closest("[data-goto]");if(b)setTab(b.dataset.goto,true);const a=e.target.closest("a[data-track]");if(a)track(a.dataset.track)});
window.addEventListener("hashchange",()=>setTab(location.hash.slice(1),false));
function clearChildren(id){$(id).replaceChildren()}
function simpleLink(item){const a=itemLink(item,null,"simple-link");a.replaceChildren();node("span","",item.icon+"  "+item.title,a);node("span","","↗",a);return a}
function renderDashboard(){
$("greeting").textContent=state.nickname?"Hallo, "+state.nickname+"!":"Willkommen im SD Hub!";
if($("nickname")!==document.activeElement)$("nickname").value=state.nickname;
$("statLessons").textContent=String(state.completedLessons.length);
$("statSteps").textContent=String(state.completedSteps.length);
$("statFavs").textContent=String(state.favorites.length);
clearChildren("favoritesList");clearChildren("recentList");
const favs=state.favorites.map(findItem).filter(Boolean),recent=state.recent.map(findItem).filter(Boolean);
if(!favs.length)node("p","panel-sub","Noch keine Favoriten. Wähle im Wegweiser einen Stern.",$("favoritesList"));
else favs.forEach(it=>$("favoritesList").append(simpleLink(it)));
if(!recent.length)node("p","panel-sub","Hier ist es noch leer. Öffne eines deiner Werkzeuge.",$("recentList"));
else recent.forEach(it=>$("recentList").append(simpleLink(it)));
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
function renderWayResults(){const target=$("wayResults");target.replaceChildren();const items=wayItems.length?wayItems:D.goals[0].itemIds.map(findItem).filter(Boolean);
items.forEach(it=>{const card=node("div","tool-card",undefined,target);node("span","icon",it.icon,card);const body=node("div","body",undefined,card);node("b","",it.title,body);node("p","",it.description,body);body.append(itemLink(it,"Öffnen ↗","open"));const star=node("button","star"+(state.favorites.includes(it.id)?" on":""),state.favorites.includes(it.id)?"★":"☆",card);star.type="button";star.setAttribute("aria-label",(state.favorites.includes(it.id)?"Aus Favoriten entfernen: ":"Zu Favoriten hinzufügen: ")+it.title);star.setAttribute("aria-pressed",String(state.favorites.includes(it.id)));star.addEventListener("click",()=>toggleFavorite(it.id))});
}
D.goals.forEach(goal=>{const btn=node("button","goal",undefined,$("goalGrid"));btn.type="button";btn.dataset.goal=goal.id;node("span","emoji",goal.emoji,btn);node("b","",goal.title,btn);node("small","",goal.subtitle,btn);
btn.addEventListener("click",()=>{activeGoal=goal.id;wayItems=goal.itemIds.map(findItem).filter(Boolean);$("goalSearch").value="";$("goalStatus").textContent="Passende Angebote für „"+goal.title+"“";document.querySelectorAll(".goal").forEach(g=>{g.classList.toggle("active",g===btn);g.setAttribute("aria-pressed",String(g===btn))});renderWayResults()})});
$("goalSearchBtn").addEventListener("click",()=>searchGoal());
$("goalSearch").addEventListener("keydown",e=>{if(e.key==="Enter")searchGoal()});
function searchGoal(){const text=$("goalSearch").value.trim();if(!text){$("goalStatus").textContent="Bitte beschreibe kurz dein Ziel.";return}wayItems=D.recommend(text,6);document.querySelectorAll(".goal").forEach(x=>{x.classList.remove("active");x.setAttribute("aria-pressed","false")});if(!wayItems.length){$("goalStatus").textContent="Dazu gibt es noch keine eindeutige Empfehlung. Du kannst die Kategorien oben auswählen.";wayItems=[];return renderWayResults()}$("goalStatus").textContent=wayItems.length+" passende Werkzeuge gefunden (lokale Stichwortsuche).";renderWayResults()}
document.querySelector('.goal[data-goal="lernen"]').click();
// Akademie
let courseId="german",lessonId="g-1",answered=false;
function renderCourses(){
clearChildren("courses");D.academy.forEach(course=>{const complete=course.lessons.filter(l=>state.completedLessons.includes(l.id)).length;const btn=node("button","course"+(course.id===courseId?" active":""),undefined,$("courses"));btn.type="button";btn.setAttribute("aria-pressed",String(course.id===courseId));node("span","emoji",course.icon,btn);node("b","",course.name,btn);node("small","",course.summary,btn);const track=node("div","progress-track",undefined,btn),bar=node("div","progress-bar",undefined,track);bar.style.width=(complete/course.lessons.length*100)+"%";node("div","progress-label",complete+" / "+course.lessons.length+" Lektionen",btn);btn.addEventListener("click",()=>{courseId=course.id;lessonId=course.lessons[0].id;answered=false;renderCourses()})});
renderLessonList();
}
function renderLessonList(){const c=findCourse(courseId);if(!c)return;$("courseHeading").textContent=c.icon+" "+c.name;$("courseSummary").textContent=c.summary;clearChildren("lessonList");
c.lessons.forEach(l=>{const btn=node("button","lesson-btn"+(l.id===lessonId?" active":""),undefined,$("lessonList"));btn.type="button";btn.setAttribute("aria-pressed",String(l.id===lessonId));const left=node("span","",undefined,btn);node("b","",l.title,left);node("small","",l.minutes+" Minuten · Übungsfrage",left);node("span",state.completedLessons.includes(l.id)?"done-tag":"panel-sub",state.completedLessons.includes(l.id)?"✓ Gelernt":"Öffnen ↗",btn);btn.addEventListener("click",()=>{lessonId=l.id;answered=false;renderLessonList()})});renderLesson()}
function renderLesson(){clearChildren("lessonDetail");const l=findCourse(courseId).lessons.find(x=>x.id===lessonId);if(!l)return;const q=node("div","quiz",undefined,$("lessonDetail"));node("span","badge","LEKTION · "+l.minutes+" MIN",q);node("h4","",l.title,q);node("p","",l.explanation,q);node("h4","",l.question,q);const answers=node("div","answers",undefined,q),feedback=node("div","",undefined,q);let locked=false;
l.choices.forEach((choice,i)=>{const b=node("button","",choice,answers);b.type="button";b.addEventListener("click",()=>{if(locked)return;locked=true;const correct=i===l.answer;[...answers.children].forEach((option,j)=>{option.disabled=true;if(j===l.answer)option.classList.add("correct");else if(j===i)option.classList.add("wrong")});feedback.className="feedback"+(correct?"":" error");feedback.textContent=(correct?"✓ Richtig! Lektion abgeschlossen. ":"Das war noch nicht richtig. ") +l.tip;
if(correct&&!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderCourses();}else if(!correct){const retry=node("button","btn outline small","Noch einmal versuchen ↻",q);retry.type="button";retry.style.marginTop="12px";retry.addEventListener("click",()=>renderLesson())}
})});
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