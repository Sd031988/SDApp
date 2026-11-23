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
function setTab(id,scroll){if(!["uebersicht","wegweiser","akademie","leben","projekte","sprache"].includes(id))id="uebersicht";try{if(id!=="akademie"&&kursOffen){kursOffen=false;$("akademie").classList.remove("kurs-offen");document.body.classList.remove("ak-raum")}}catch(e){}
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
let courseId="german",lessonId="g-1",answered=false,kursOffen=false;
const kursLadevorgaenge=new Map();
function ladeKurs(id){
 const kurs=findCourse(id);
 if(!kurs)return Promise.reject(new Error("Kurs nicht gefunden"));
 if(kurs.lessons)return Promise.resolve(kurs);
 if(kursLadevorgaenge.has(id))return kursLadevorgaenge.get(id);
 const p=new Promise((resolve,reject)=>{
  const script=document.createElement("script");
  script.src="./kurse/"+encodeURIComponent(id)+".js?v=20261123u";
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
const A=window.SDAkademieI18n;
function akNode(tag,cls,text,parent){const el=node(tag,cls,text,parent);if(["ak-practice-step","code-step"].includes(cls)){el.lang="de";el.dir="ltr"}if(text!==undefined)A.bind(el,text);return el}
const BEREICHE=["Programmieren","Python & KI","C++ & Rust","Uni-Kurse & Videos","Computer & Internet","Deutsch","Arbeit & Beruf"];
const BEREICH_KLASSE={"Programmieren":"programmieren","Python & KI":"python-ki","C++ & Rust":"cpp-rust","Uni-Kurse & Videos":"uni","Computer & Internet":"computer","Deutsch":"deutsch","Arbeit & Beruf":"arbeit"};
const akFilter={text:"",bereich:"",stufe:""};
function stufenGruppe(s){const n=parseInt(s,10);return !n?"":n<=1?"1":n<=3?"2":"3"}
function dauerText(min){return min>=90?(Math.round(min/30)/2).toLocaleString("de-DE")+" Std.":min+" Min."}
function passtFilter(c){
 if(akFilter.bereich&&c.bereich!==akFilter.bereich)return false;
 if(akFilter.stufe&&stufenGruppe(c.stufe)!==akFilter.stufe&&c.stufe!=="Alle Stufen")return false;
 const q=akFilter.text.trim().toLowerCase();if(!q)return true;
 return [c.name,c.summary,c.bereich,A.t(c.name),A.t(c.summary)].join(" ").toLowerCase().includes(q);
}
function renderAkStats(){
 const box=$("akStats");if(!box||box.dataset.fertig)return;box.dataset.fertig="1";
 const lektionen=D.academy.reduce((n,c)=>n+c.anzahl,0),stunden=Math.round(D.academy.reduce((n,c)=>n+(c.dauer||0),0)/60);
 [[D.academy.length,"Kurse"],[lektionen,"Lektionen"],[stunden+"+","Stunden Lernzeit"],[BEREICHE.length,"Fachbereiche"],["0 €","kostenlos, ohne Konto"]].forEach(([zahl,text])=>{const s=akNode("div","ak-stat",undefined,box);node("b","",String(zahl),s);akNode("span","",text,s)});
}
function renderAkToolbar(){
 const chips=$("akBereiche");if(!chips||chips.dataset.fertig)return;chips.dataset.fertig="1";
 const knopf=(wert,text)=>{const b=akNode("button","",text,chips);b.type="button";b.dataset.wert=wert;b.setAttribute("aria-pressed",String(akFilter.bereich===wert));
  b.onclick=()=>{akFilter.bereich=wert;[...chips.children].forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.wert===wert)));kursOffen=false;renderCourses();zeigeKursOben()}};
 knopf("","Alle Bereiche");BEREICHE.forEach(b=>knopf(b,b));
 $("akSuche").addEventListener("input",e=>{akFilter.text=e.target.value;renderCourses()});
 $("akStufe").addEventListener("change",e=>{akFilter.stufe=e.target.value;renderCourses()});
}
function renderCourses(){
 renderAkStats();renderAkToolbar();renderUniKatalog();
 clearChildren("courses");let treffer=0;
 for(const bereich of BEREICHE){
  const kurse=D.academy.filter(c=>c.bereich===bereich),sichtbar=kurse.filter(passtFilter);
  if(!sichtbar.length)continue;
  const group=akNode("section","course-group",undefined,$("courses"));
  akNode("h3","",bereich,group);
  const entries=akNode("div","course-group-list",undefined,group);
  for(const course of sichtbar){
   treffer++;
   const ids=D.academyLessonIds[course.id]||[];
   const complete=ids.filter(id=>state.completedLessons.includes(id)).length;
   const btn=akNode("button","course"+(course.id===courseId?" active":""),undefined,entries);
   btn.type="button";btn.dataset.kurs=course.id;btn.setAttribute("aria-pressed",String(course.id===courseId));
   const banner=node("span","ak-banner ak-b-"+(BEREICH_KLASSE[bereich]||"programmieren"),undefined,btn);banner.setAttribute("aria-hidden","true");
   node("span","ak-icon",course.icon,banner);akNode("span","ak-bereich",bereich,banner);
   akNode("span","emoji",course.icon,btn);
   akNode("b","",course.name,btn);
   akNode("span","badge",course.stufe,btn);
   akNode("small","",course.summary,btn);
   const meta=node("span","ak-meta",undefined,btn);node("span","","⏱ "+dauerText(course.dauer||ids.length*30),meta);akNode("span","","📘 "+ids.length+" Lektionen",meta);
   akNode("small","","Empfohlene Reihenfolge: "+(kurse.indexOf(course)+1)+" · "+(course.voraussetzungen.length?course.voraussetzungen.join(", "):"Keine Voraussetzungen"),btn);
   const track=akNode("div","progress-track",undefined,btn),bar=akNode("div","progress-bar",undefined,track);
   bar.style.width=(ids.length?complete/ids.length*100:0)+"%";
   akNode("div","progress-label",complete+" / "+ids.length+" Lektionen",btn);
   akNode("span","ak-cta",complete===ids.length&&ids.length?"✓ Abgeschlossen – wiederholen":complete?"Weiterlernen →":"Kurs starten →",btn);
   btn.addEventListener("click",()=>{courseId=course.id;lessonId=ids.find(id=>!state.completedLessons.includes(id))||ids[0];answered=false;kursOffen=true;renderCourses();zeigeKursOben()});
  }
 }
 const info=$("akTreffer");if(info)A.set(info,treffer===D.academy.length?"":treffer?treffer+" Kurse gefunden":"Kein Kurs passt zu deiner Suche.");
 renderLessonList();
}
function renderUniKatalog(){
 const grid=$("akUniGrid"),filter=$("akUniFilter"),K=window.SDUniKatalog;if(!grid||!Array.isArray(K))return;
 if(!filter.dataset.fertig){filter.dataset.fertig="1";[["","Alle"],["frei","Komplett kostenlos"],["vorschau","Coursera (Vorschau kostenlos)"]].forEach(([w,t])=>{const b=akNode("button","",t,filter);b.type="button";b.dataset.wert=w;b.setAttribute("aria-pressed",String(w===""));
  b.onclick=()=>{filter.dataset.wahl=w;[...filter.children].forEach(x=>x.setAttribute("aria-pressed",String(x.dataset.wert===w)));renderUniKatalog()}})}
 const wahl=filter.dataset.wahl||"";grid.replaceChildren();
 const erlaubt=["cs50.harvard.edu","ocw.mit.edu","programming-26.mooc.fi","www.elementsofai.com","open.hpi.de","ki-campus.org","www.coursera.org"];
 const farben={HU:"#a51c30",MIT:"#8a8b8c",UH:"#1d4f91",HPI:"#b1063a",KI:"#2b6cb0",UM:"#00274c",SU:"#8c1515",UI:"#e84a27",DU:"#012169",MSU:"#18453b"};
 for(const k of K){
  if(wahl&&k.kosten!==wahl)continue;if(akFilter.bereich&&k.bereich!==akFilter.bereich&&k.bereich!=="Alle Stufen")continue;
  let url;try{url=new URL(k.url)}catch(e){continue}if(url.protocol!=="https:"||!erlaubt.includes(url.hostname))continue;
  const c=node("article","ak-uni-karte",undefined,grid),kopf=node("div","ak-uni-kopf",undefined,c),mono=node("span","ak-mono",k.kurz,kopf);mono.style.background=farben[k.kurz]||"#334155";mono.setAttribute("aria-hidden","true");
  const w=node("div","",undefined,kopf);node("b","",k.uni,w);node("small","",k.anbieter,w);
  node("h4","",k.titel,c);
  const tags=node("div","ak-tags",undefined,c);akNode("span",k.kosten==="frei"?"ak-frei":"ak-vorschau",k.kosten==="frei"?"Kostenlos":"Vorschau kostenlos",tags);akNode("span","",k.stufe,tags);node("span","",k.sprache,tags);if(k.video)akNode("span","","Videos",tags);
  if(k.kosten==="vorschau")akNode("p","ak-kosten","Das erste Modul ist kostenlos. Für den ganzen Kurs und das Zertifikat verlangt Coursera Geld; Finanzhilfe kann man dort beantragen.",c);
  const a=akNode("a","",k.anbieter==="Coursera"?"Bei Coursera ansehen ↗":"Zum Kurs ↗",c);a.href=url.href;a.target="_blank";a.rel="noopener noreferrer";
 }
}
/* Geöffneter Kurs steht oben (vor den Kurskarten), damit niemand weit nach unten scrollen muss. */
/* Kursraum: Ein geöffneter Kurs füllt den ganzen Bildschirm, ohne Menüs und Katalog drumherum.
   „← Alle Kurse“, Esc und die Zurück-Taste des Browsers verlassen den Raum. */
let raumPopIgnorieren=false;
function kursRaumVerlassen(){kursOffen=false;zeigeKursOben();$("courses").scrollIntoView({block:"start"})}
function zeigeKursOben(){const ak=$("akademie"),z=$("kursZurueck");
 if(z&&!z.dataset.an){z.dataset.an="1";
  z.addEventListener("click",()=>{const zurueck=history.state&&history.state.akRaum;kursRaumVerlassen();if(zurueck){raumPopIgnorieren=true;history.back()}});
  addEventListener("popstate",()=>{if(raumPopIgnorieren){raumPopIgnorieren=false;return}if(kursOffen)kursRaumVerlassen()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&kursOffen&&!e.target.closest("textarea,input"))z.click()})}
 ak.classList.toggle("kurs-offen",kursOffen);document.body.classList.toggle("ak-raum",kursOffen);
 if(!kursOffen)return;
 if(!(history.state&&history.state.akRaum))history.pushState({akRaum:1},"",location.href);
 const p=$("coursePanel");p.scrollTop=0;$("courseHeading").focus({preventScroll:true})}
function zeigeLektionOben(){const d=$("lessonDetail"),a=document.querySelector(".lesson-btn.active");if(a)a.scrollIntoView({block:"nearest",inline:"center"});d.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"})}
function renderLessonList(){
 const c=findCourse(courseId);if(!c)return;
 $("courseHeading").replaceChildren();$("courseHeading").append(document.createTextNode(c.icon+" "));akNode("span","",c.name,$("courseHeading"));
 $("courseSummary").replaceChildren();akNode("span","",c.summary,$("courseSummary"));
 if(c.id==="deutsch-b1"){const a=akNode("a","btn outline small","B1-Prüfungstraining öffnen ↗",$("courseSummary"));a.href="/deutsch/b1-pruefung.html";}

 clearChildren("lessonList");clearChildren("lessonDetail");$("lessonList").dataset.kurs=c.id;
 if(!c.lessons){
  const status=akNode("p","panel-sub","Lade Kurs …",$("lessonDetail"));
  status.setAttribute("role","status");
  ladeKurs(c.id).then(()=>{if(courseId===c.id)renderLessonList()}).catch(()=>{if(courseId===c.id)A.set(status,"Der Kurs konnte nicht geladen werden. Bitte erneut öffnen.")});
  return;
 }
 {const alt=$("akKurskopf");if(alt)alt.remove();
  const kopf=node("div","ak-kurskopf",undefined);kopf.id="akKurskopf";$("lessonList").before(kopf);
  const ids=D.academyLessonIds[c.id]||[],fertig=ids.filter(id=>state.completedLessons.includes(id)).length;
  const meta=node("div","ak-kursmeta",undefined,kopf);
  [c.bereich,c.stufe,"⏱ "+dauerText(c.dauer||ids.length*30),"📘 "+ids.length+" Lektionen","✓ "+fertig+" / "+ids.length+" erledigt","Kostenlos · ohne Konto"].forEach(x=>akNode("span","",x,meta));
  const ziele=c.lessons.map(l=>l.ziel||l.explanation).filter(Boolean).slice(0,6);
  if(ziele.length){const box=node("details","ak-lernziele",undefined,kopf);akNode("summary","","Was du in diesem Kurs lernst",box);const ul=node("ul","",undefined,box);ul.lang="de";ziele.forEach(z=>node("li","",z,ul))}}
 c.lessons.forEach(l=>{
  const btn=akNode("button","lesson-btn"+(l.id===lessonId?" active":""),undefined,$("lessonList"));
  btn.type="button";btn.setAttribute("aria-pressed",String(l.id===lessonId));
  const left=akNode("span","",undefined,btn);
  akNode("b","",l.title,left);
  akNode("small","",l.minutes+" Minuten · "+(l.schritte?"Praxis & Quiz":"Übungsfrage"),left);
  akNode("span",state.completedLessons.includes(l.id)?"done-tag":"panel-sub",state.completedLessons.includes(l.id)?"✓ Gelernt":"Öffnen ↗",btn);
  btn.addEventListener("click",()=>{lessonId=l.id;answered=false;renderLessonList();zeigeLektionOben()});
 });
 renderLesson();
 const pos=c.lessons.findIndex(l=>l.id===lessonId),nav=akNode("nav","ak-lektion-nav",undefined,$("lessonDetail"));A.attr(nav,"aria-label","Lektionen blättern");
 if(pos>0){const b=akNode("button","btn outline small","← "+c.lessons[pos-1].title,nav);b.type="button";b.onclick=()=>{lessonId=c.lessons[pos-1].id;answered=false;renderLessonList();zeigeLektionOben()}}
 if(pos>=0&&pos<c.lessons.length-1){const b=akNode("button","btn primary small","Nächste Lektion: "+c.lessons[pos+1].title+" →",nav);b.type="button";b.onclick=()=>{lessonId=c.lessons[pos+1].id;answered=false;renderLessonList();zeigeLektionOben()}}
 renderCourseFinal(c);
}
function renderCourseFinal(course){
 const target=$("lessonDetail"),completed=course.lessons.every(l=>state.completedLessons.includes(l.id));
 const section=akNode("section","ak-course-final",undefined,target);
 akNode("h4","","Kursabschluss",section);
 if(!completed){akNode("p","","Schließe zuerst alle Lektionen dieses Kurses ab. Danach kannst du den Abschlusstest machen.",section);return}
 const start=akNode("button","btn outline small","Abschlusstest starten (10 Fragen)",section);start.type="button";
 start.onclick=()=>{
  start.disabled=true;
  const pool=course.lessons.flatMap(l=>l.quiz?.map(q=>({frage:q.frage,antworten:q.antworten,richtig:q.richtig}))||(l.question?[{frage:l.question,antworten:l.choices,richtig:l.answer}]:[]));
  if(!pool.length){akNode("p","","Für diesen Kurs fehlen noch Abschlussfragen.",section);return}
  let index=0,points=0;
  const area=akNode("div","ak-final-questions",undefined,section);
  const next=()=>{
   area.replaceChildren();
   if(index===10){
    akNode("p","",points+" von 10 Fragen richtig beantwortet.",area);
    if(points<7){const retry=akNode("button","btn outline small","Erneut versuchen",area);retry.onclick=()=>{index=0;points=0;next()};return}
    const certificate=akNode("section","ak-certificate",undefined,area);
    akNode("h2","","Teilnahmebestätigung",certificate);
    akNode("p","","Du hast den Kurs „"+course.name+"“ abgeschlossen.",certificate);
    const label=akNode("label","","Name (freiwillig): ",certificate),input=akNode("input","",undefined,label);A.attr(input,"placeholder","Dein Name");
    akNode("p","","Datum: "+new Date().toLocaleDateString("de-DE"),certificate);
    akNode("p","","Diese Teilnahmebestätigung ist KEIN offizielles Zertifikat.",certificate);
    const print=akNode("button","btn primary","Teilnahmebestätigung drucken",certificate);print.type="button";print.onclick=()=>window.print();
    return;
   }
   const q=pool[index%pool.length];
   akNode("h5","",(index+1)+". "+q.frage,area);
   const answers=akNode("div","answers",undefined,area);
   q.antworten.forEach((text,i)=>{const btn=akNode("button","",text,answers);btn.type="button";btn.onclick=()=>{if(i===q.richtig)points++;index++;next()}});
  };
  next();
 };
}
function academySourceUrl(raw){
 let url;try{url=new URL(raw)}catch{return null}
 const hosts=["docs.python.org","doc.rust-lang.org","www.learncpp.com","en.cppreference.com","cs50.harvard.edu","ocw.mit.edu","programming-26.mooc.fi","open.hpi.de","ki-campus.org","www.elementsofai.com","www.freecodecamp.org","developers.google.com","course.fast.ai","www.khanacademy.org","www.rust-lang.org","www.python.org","numpy.org","www.gesetze-im-internet.de","www.bmas.de","www.arbeitsagentur.de","www.anerkennung-in-deutschland.de","www.kfw.de","www.existenzgruendungsportal.de","www.verbraucherzentrale.de","www.make-it-in-germany.com","desy.zoll-portal.de","www.dinmedia.de"];
 return url.protocol==="https:"&&!url.username&&!url.password&&hosts.includes(url.hostname)?url:null;
}
function renderLesson(){clearChildren("lessonDetail");const l=findCourse(courseId).lessons.find(x=>x.id===lessonId);if(!l)return;A.notice($("lessonDetail"));if(l.sprache){renderProgrammLektion(l);return}if(l.schritte){renderCodeLesson(l);return}const q=akNode("div","quiz",undefined,$("lessonDetail"));akNode("span","badge","LEKTION · "+l.minutes+" MIN",q);akNode("h4","",l.title,q);akNode("p","",l.explanation,q);
if(l.standHinweis&&l.standQuelle){
 const url=academySourceUrl(l.standQuelle.url);
 if(url){
  const note=akNode("aside","ak-legal-note",undefined,q);note.setAttribute("role","note");
  akNode("p","",l.standHinweis,note);
  const link=akNode("a","",l.standQuelle.titel+" ↗",note);link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";
 }
}
if(Array.isArray(l.schrittePraxis)){
 const details=akNode("section","ak-practice-steps",undefined,q);
 akNode("h5","","Schritt für Schritt",details);
 l.schrittePraxis.forEach((step,i)=>{const item=akNode("section","ak-practice-step",undefined,details);akNode("h5","",(i+1)+". "+step.titel,item);mitCode(akNode("p","",undefined,item),step.text)});
 if(Array.isArray(l.fehler)){const problems=akNode("section","ak-practice-errors",undefined,q);akNode("h5","","Typische Fehler und richtige Wege",problems);l.fehler.forEach(f=>{akNode("h6","",f.titel,problems);mitCode(akNode("p","",undefined,problems),f.text)})}
 if(Array.isArray(l.merke)){const memory=akNode("section","ak-practice-memory",undefined,q);akNode("h5","","Merksätze",memory);l.merke.forEach(t=>mitCode(akNode("p","",undefined,memory),t))}
}
if(Array.isArray(l.quellen)){
 const sources=akNode("section","ak-sources",undefined,q);
 akNode("h5","","Quellen und weiterer Prüfweg",sources);
 const list=akNode("ul","",undefined,sources);
 for(const source of l.quellen){
  const url=academySourceUrl(source.url);if(!url)continue;
  const item=akNode("li","",undefined,list),a=akNode("a","",source.titel,item);
  a.href=url.href;a.target="_blank";a.rel="noopener noreferrer";
  if(/^\d{4}-\d{2}-\d{2}$/.test(source.stand||""))akNode("small",""," · geprüft: "+source.stand,item);
 }
}
if(Array.isArray(l.quiz)){
 if(l.uebungen&&window.SDAkademieUebungen)l.uebungen.forEach(u=>window.SDAkademieUebungen.render(q,u));
 const quizArea=akNode("section","ak-lesson-quiz",undefined,q);
 let index=0;
 const showQuestion=()=>{
  quizArea.replaceChildren();
  if(index>=l.quiz.length){
   akNode("p","feedback","✓ Alle drei Verständnisfragen richtig beantwortet.",quizArea);
   if(!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderCourses()}
   return;
  }
  const current=l.quiz[index];
  akNode("h4","",(index+1)+"/"+l.quiz.length+" · "+current.frage,quizArea);
  const choices=akNode("div","answers",undefined,quizArea),feedback=akNode("p","feedback",undefined,quizArea);
  current.antworten.forEach((choice,i)=>{
   const button=akNode("button","",choice,choices);button.type="button";
   button.onclick=()=>{
    const correct=i===current.richtig;
    feedback.className="feedback"+(correct?"":" error");
    A.set(feedback,(correct?"✓ Richtig. ":"Noch nicht richtig. ")+(current.erklaerung||l.tip||""));
    if(!correct)return;
    [...choices.children].forEach(b=>b.disabled=true);
    button.classList.add("correct");
    const next=akNode("button","btn outline small",index===l.quiz.length-1?"Lektion abschließen":"Nächste Frage",quizArea);
    next.type="button";next.onclick=()=>{index++;showQuestion()};
   };
  });
 };
 showQuestion();
 return;
}
akNode("h4","",l.question,q);const answers=akNode("div","answers",undefined,q),feedback=akNode("div","",undefined,q);let locked=false;
if(l.uebungen&&window.SDAkademieUebungen)l.uebungen.forEach(u=>window.SDAkademieUebungen.render(q,u));
l.choices.forEach((choice,i)=>{const b=akNode("button","",choice,answers);b.type="button";b.addEventListener("click",()=>{if(locked)return;locked=true;const correct=i===l.answer;[...answers.children].forEach((option,j)=>{option.disabled=true;if(j===l.answer)option.classList.add("correct");else if(j===i)option.classList.add("wrong")});feedback.className="feedback"+(correct?"":" error");A.set(feedback,(correct?"✓ Richtig! Lektion abgeschlossen. ":"Das war noch nicht richtig. ") +l.tip);
if(correct&&!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderCourses();}else if(!correct){const retry=akNode("button","btn outline small","Noch einmal versuchen ↻",q);retry.type="button";retry.style.marginTop="12px";retry.addEventListener("click",()=>renderLesson())}
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
/* Lektionen Schritt für Schritt (Aufbau wie bei boot.dev): eine Erklärung pro Seite, Fortschrittsbalken oben,
   „Weiter“ schaltet die nächste Seite frei. Die eigene Aufgabe und das Quiz müssen bestanden sein, bevor es weitergeht.
   Der Stand bleibt beim Neuzeichnen erhalten (nur im Speicher dieser Seite). */
const lektionsStand=new Map();
function lektionsStepper(wrap,l){
 const gelernt=state.completedLessons.includes(l.id);
 const kopf=node("div","ak-step-kopf",undefined,wrap),balken=node("ol","ak-step-balken",undefined,kopf),zahl=akNode("span","ak-step-zahl","Schritt 1 von 1",kopf);
 A.attr(balken,"aria-label","Fortschritt in dieser Lektion");
 const inhalt=node("div","ak-step-inhalt",undefined,wrap),nav=node("div","ak-step-nav",undefined,wrap);
 const zur=akNode("button","btn outline small ak-zurueck","← Zurück",nav),wei=akNode("button","btn primary small ak-weiter","Weiter →",nav);zur.type="button";wei.type="button";
 const sperrHinweis=akNode("span","ak-step-sperre","",nav);
 const merk=lektionsStand.get(l.id)||{pos:0,frei:0};lektionsStand.set(l.id,merk);
 const seiten=[];
 function zeige(i,scroll){
  i=Math.max(0,Math.min(i,seiten.length-1));merk.pos=i;if(gelernt)merk.frei=seiten.length-1;
  seiten.forEach((s,k)=>{s.el.hidden=k!==i;s.seg.classList.toggle("aktiv",k===i);s.seg.classList.toggle("fertig",k<i||k<merk.frei||gelernt);s.seg.disabled=k>merk.frei;s.seg.setAttribute("aria-current",k===i?"step":"false")});
  A.set(zahl,"Schritt "+(i+1)+" von "+seiten.length);
  zur.disabled=i===0;const letzte=i===seiten.length-1;wei.hidden=letzte;wei.disabled=!seiten[i].offen;wei.classList.remove("ak-puls");
  A.set(sperrHinweis,letzte||seiten[i].offen?"":seiten[i].sperrText);
  $("lessonDetail").classList.toggle("ak-am-ende",letzte);
  if(scroll)wrap.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
 }
 function seite(name,sperrText){
  const el=node("section","ak-seite",undefined,inhalt);el.hidden=true;
  const li=node("li","",undefined,balken),seg=node("button","",undefined,li);seg.type="button";A.attr(seg,"aria-label",name);A.attr(seg,"title",name);
  const s={el,seg,name,sperrText:sperrText||"",offen:!sperrText||gelernt};
  s.freigeben=()=>{if(s.offen)return;s.offen=true;if(seiten[merk.pos]===s){wei.disabled=false;wei.classList.add("ak-puls");A.set(sperrHinweis,"")}};
  seg.onclick=()=>{const k=seiten.indexOf(s);if(k<=merk.frei)zeige(k,true)};
  seiten.push(s);return s;
 }
 wei.onclick=()=>{const i=merk.pos;if(!seiten[i].offen)return;merk.frei=Math.max(merk.frei,i+1);zeige(i+1,true)};
 zur.onclick=()=>zeige(merk.pos-1,true);
 return {seite,start(){zeige(merk.pos,false)}};
}
function lektionsUeberblick(st,l,label){
 const w=st.seite("Übersicht").el;
 akNode("span","badge",label,w);
 if(state.completedLessons.includes(l.id))akNode("p","code-ok","✓ Lektion abgeschlossen.",w);
 akNode("h4","",l.title,w);if(l.explanation)akNode("p","ak-intro",l.explanation,w);
 akNode("h5","","Dein Ziel",w);akNode("p","",l.ziel,w);
 akNode("h5","","In dieser Lektion",w);const ol=node("ol","ak-step-plan",undefined,w);
 l.schritte.forEach(s=>akNode("li","",s.titel,ol));
 akNode("li","","Häufige Fehler",ol);akNode("li","","Jetzt selbst schreiben",ol);akNode("li","","Wissen prüfen",ol);
}
function tieferAbschnitt(sec,step){
 if(!Array.isArray(step.tiefer)||!step.tiefer.length)return;
 const box=node("div","ak-tiefer",undefined,sec);akNode("h6","","Genauer erklärt",box);
 step.tiefer.forEach(t=>mitCode(akNode("p","",undefined,box),t));
}
function lektionsFehler(st,l){
 const w=st.seite("Häufige Fehler").el;akNode("h5","","Häufige Fehler",w);
 const ul=node("ul","ak-fehler-liste",undefined,w);
 l.fehler.forEach(f=>{const li=akNode("li","",undefined,ul);akNode("b","",f.titel+": ",li);mitCode(li,f.text)});
}
function lektionsQuiz(st,l,beiFertig){
 const s=st.seite("Wissen prüfen","Beantworte alle Fragen richtig, dann geht es weiter."),w=s.el;
 akNode("h5","","Wissen prüfen",w);let richtig=0;
 l.quiz.forEach((q,qi)=>{const box=akNode("section","code-quiz",undefined,w);akNode("h5","",(qi+1)+". "+q.frage,box);const answers=akNode("div","answers",undefined,box),fb=akNode("p","feedback",undefined,box);fb.hidden=true;
  q.antworten.forEach((a,i)=>{const b=akNode("button","",a,answers);b.type="button";b.onclick=()=>{if(box.dataset.done)return;
   if(i!==q.richtig){fb.hidden=false;fb.className="feedback error";A.set(fb,"Noch nicht richtig. "+(q.begruendungen?.[i]||"Lies die Erklärung oben noch einmal."));b.classList.add("falsch");return}
   box.dataset.done="1";[...answers.children].forEach(x=>x.disabled=true);b.classList.add("correct");fb.hidden=false;fb.className="feedback";A.set(fb,"✓ Richtig. "+q.erklaerung);richtig++;
   if(richtig===l.quiz.length){s.freigeben();beiFertig()}}})});
}
function lektionsAbschluss(st,l,extra){
 const w=st.seite("Das merkst du dir").el;
 if(state.completedLessons.includes(l.id)){const b=akNode("p","ak-xp","🏆 Lektion geschafft · +100 XP",w);b.setAttribute("role","status");akNode("p","hint","Dein Stand: "+(state.completedLessons.length*100)+" XP",w)}
 akNode("h5","","Das merkst du dir",w);const ul=akNode("ul","",undefined,w);l.merke.forEach(x=>mitCode(akNode("li","",undefined,ul),x));
 if(Array.isArray(l.quellen)&&l.quellen.length){akNode("h5","","Weiterlernen (kostenlos)",w);const ql=akNode("ul","",undefined,w);
  for(const q of l.quellen){const url=academySourceUrl(q.url);if(!url)continue;const li=akNode("li","",undefined,ql),a=akNode("a","",q.titel+" ↗",li);a.href=url.href;a.target="_blank";a.rel="noopener noreferrer";if(q.info)akNode("small",""," · "+q.info,li)}}
 extra(w);
}
let pythonNichtVerfuegbar=false;
async function pythonLauf(code,stdin,out){
 out.hidden=false;out.textContent=A.t("Python wird geladen …");
 try{await pythonBereit()}catch(e){pythonNichtVerfuegbar=true;throw e}
 const vorher=window.ausgabe;let text="";window.ausgabe=t=>{text=String(t);out.textContent=text};
 try{const r=await window.SDPython.starten({dateien:{"main.py":code},haupt:"main.py",stdin:stdin||"",zeitlimit:30000});
  if(r==="fallback"){pythonNichtVerfuegbar=true;out.textContent=A.t("Python lässt sich gerade nicht im Browser starten (z. B. offline). Öffne die Lektion im Code-Studio.");return null}
  return r==="ok"?text.split("\n").slice(2).join("\n"):null}
 finally{window.ausgabe=vorher}
}
function schrittSeiten(st,l,python){
 l.schritte.forEach((step,i)=>{const sec=akNode("section","code-step",undefined,st.seite(step.titel).el);akNode("h5","",(i+1)+". "+step.titel,sec);
  const erkl=String(step.erklaerung||"").trim(),voll=String(step.text||"").trim(),ohneDoppel=erkl&&voll.endsWith(erkl)&&voll!==erkl?voll.slice(0,-erkl.length).trim():voll;
  mitCode(akNode("p","",undefined,sec),ohneDoppel);
  if(step.code){const pre=akNode("pre","code-example",undefined,sec);node("code","",step.code,pre);
   if(python&&!/input\(/.test(step.code)){const b=akNode("button","btn outline small","▶ Beispiel ausführen",sec);b.type="button";const out=akNode("pre","code-example prog-ausgabe",undefined,sec);out.hidden=true;out.setAttribute("aria-live","polite");
    b.onclick=async()=>{b.disabled=true;try{await pythonLauf(step.code,"",out)}catch(e){out.textContent=e.message}finally{b.disabled=false}}}}
  if(erkl&&erkl!==ohneDoppel)mitCode(akNode("p","",undefined,sec),erkl);
  tieferAbschnitt(sec,step);
 });
}
function renderCodeLesson(l){
 const area=$("lessonDetail"),wrap=akNode("section","code-lesson ak-stepper",undefined,area),st=lektionsStepper(wrap,l);
 lektionsUeberblick(st,l,"PRAXIS · "+l.minutes+" MIN");
 schrittSeiten(st,l,false);
 lektionsFehler(st,l);
 const code=academyDrafts.get(l.id)||{...l.beispiel};academyDrafts.set(l.id,code);
 const auf=st.seite("Jetzt selbst schreiben","Bestehe zuerst alle Prüfungen deiner Aufgabe."),split=node("div","ak-split",undefined,auf.el);
 const links=node("div","ak-split-text",undefined,split),rechts=node("div","ak-split-code",undefined,split);
 akNode("h5","","Jetzt selbst schreiben",links);akNode("p","",l.aufgabe.text,links);
 if(l.projektLink&&/^\/mein-sd-hub\/p4-(?:quiz\.html|module\/index\.html)$/.test(l.projektLink)){const link=akNode("a","btn outline small","Vollständiges Praxisprojekt öffnen",links);link.href=l.projektLink;link.target="_blank";link.rel="noopener noreferrer"}
 const editor=node("div","code-editor",undefined,rechts);
 const tabs=akNode("div","code-tabs",undefined,editor),label=akNode("label","",undefined,editor),textarea=akNode("textarea","code-textarea",undefined,editor);
 textarea.spellcheck=false;textarea.autocapitalize="off";textarea.autocomplete="off";textarea.autocorrect="off";
 const keys=[["html","HTML"],["css","CSS"],["js","JavaScript"]];let active="html",timer;const buttons={};
 function select(key){active=key;A.set(label,key.toUpperCase()+" bearbeiten");textarea.value=code[key];keys.forEach(([k])=>buttons[k].setAttribute("aria-pressed",String(k===key)))}
 keys.forEach(([key,title])=>{const b=akNode("button","",title,tabs);b.type="button";buttons[key]=b;b.onclick=()=>select(key)});
 const view=akNode("div","code-preview",undefined,rechts);akNode("strong","","Live-Vorschau",view);
 const frame=akNode("iframe","code-frame",undefined,view);frame.setAttribute("sandbox","allow-scripts");A.attr(frame,"title","Vorschau deiner Webseite");
 const update=()=>{frame.srcdoc=previewHtml(code)};
 textarea.addEventListener("input",()=>{code[active]=textarea.value;clearTimeout(timer);timer=setTimeout(update,400)});
 select(active);update();
 const reset=akNode("button","btn outline small","Zurücksetzen",editor);reset.type="button";reset.onclick=()=>{if(!confirm(A.t("Deinen Code durch den Startcode ersetzen?")))return;Object.assign(code,l.beispiel);select(active);update()};
 const check=akNode("button","btn primary small code-pruefen","Prüfen",links);check.type="button";
 const checks=akNode("div","code-checks",undefined,links),hint=akNode("p","hint","Tipp: "+l.aufgabe.tipp,links);hint.hidden=true;
 const solution=akNode("button","btn outline small","Lösung zeigen",links);solution.type="button";solution.hidden=true;
 let failures=0;
 check.onclick=()=>{checks.replaceChildren();const doc=new DOMParser().parseFromString(code.html,"text/html");
  const results=l.aufgabe.pruefungen.map(p=>{const ok=D.pruefeCode(p.test,code,doc);akNode("p",ok?"code-ok":"code-error",(ok?"✓ ":"✗ ")+p.beschreibung,checks);return ok});
  const passed=results.every(Boolean);if(!passed)failures++;hint.hidden=failures<2;solution.hidden=failures<3;
  if(passed){akNode("p","code-ok","Sehr gut! Weiter geht es mit dem Quiz.",checks);auf.freigeben()}};
 solution.onclick=()=>{Object.assign(code,l.aufgabe.loesung);select(active);update();checks.replaceChildren()};
 lektionsQuiz(st,l,()=>{if(!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderDashboard();renderCourses()}});
 if(l.uebungen&&window.SDAkademieUebungen){const w=st.seite("Weitere Übungen").el;akNode("h5","","Weitere Übungen",w);l.uebungen.forEach(u=>window.SDAkademieUebungen.render(w,u))}
 lektionsAbschluss(st,l,w=>{
  const studio=akNode("button","btn primary","Im Code-Studio öffnen ↗",w);studio.type="button";const status=akNode("p","message","",w);
  studio.onclick=async()=>{studio.disabled=true;try{const name=await academyToStudio("Akademie – "+l.title,code);location.href="/studio/index.html?projekt="+encodeURIComponent(name)}catch(e){A.set(status,"Projekt konnte nicht gespeichert werden: "+e.message);studio.disabled=false}}});
 st.start();
}
/* Programmier-Lektionen (Python, C++, Rust): Code schreiben, prüfen, Python direkt im Browser ausführen (Pyodide wie im Code-Studio),
   C++/Rust im Code-Studio ausführen. Prüfungen sind Textmuster (kein eval) plus – bei Python – die erwartete Ausgabe. */
const SPRACHEN={python:{name:"Python",datei:"main.py"},cpp:{name:"C++",datei:"main.cpp"},rust:{name:"Rust",datei:"src/main.rs"}};
let pythonLaden=null;
function pythonBereit(){
 if(window.SDPython)return Promise.resolve();
 if(!pythonLaden)pythonLaden=new Promise((ok,nein)=>{const s=document.createElement("script");s.src="/studio/python-browser.js";s.onload=()=>window.SDPython?ok():nein(new Error("Python fehlt"));s.onerror=()=>{pythonLaden=null;nein(new Error("Python konnte nicht geladen werden"))};document.head.appendChild(s)});
 return pythonLaden;
}
function programmZuStudio(baseName,datei,code){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open("sdCodeStudio",1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains("projekte"))db.createObjectStore("projekte",{keyPath:"name"})};
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{const db=req.result;let number=1;
   const choose=()=>{const name=baseName+(number===1?"":" ("+number+")");const tx=db.transaction("projekte","readwrite"),store=tx.objectStore("projekte");const check=store.get(name);
    check.onsuccess=()=>{if(check.result){number++;return}store.add({name,dateien:{[datei]:code},haupt:datei,versionen:[],erstellt:Date.now(),t:Date.now()})};
    tx.oncomplete=()=>{if(check.result)choose();else{db.close();resolve(name)}};tx.onerror=()=>{db.close();reject(tx.error)}};
   choose()};
 });
}
function renderProgrammLektion(l){
 const sp=SPRACHEN[l.sprache]||SPRACHEN.python,area=$("lessonDetail"),wrap=akNode("section","code-lesson ak-stepper",undefined,area),st=lektionsStepper(wrap,l);
 lektionsUeberblick(st,l,sp.name.toUpperCase()+" · "+l.minutes+" MIN");
 schrittSeiten(st,l,l.sprache==="python");
 lektionsFehler(st,l);
 const key="prog:"+l.id;if(!academyDrafts.has(key))academyDrafts.set(key,{code:l.start,eingabe:l.aufgabe.eingabe||""});const d=academyDrafts.get(key);
 const auf=st.seite("Jetzt selbst schreiben","Bestehe zuerst alle Prüfungen deiner Aufgabe."),split=node("div","ak-split",undefined,auf.el);
 const links=node("div","ak-split-text",undefined,split),rechts=node("div","ak-split-code",undefined,split);
 akNode("h5","","Jetzt selbst schreiben",links);akNode("p","",l.aufgabe.text,links);
 const label=akNode("label","",sp.name+"-Code ("+sp.datei+")",rechts),ta=akNode("textarea","code-textarea",undefined,rechts);label.style.fontWeight="700";
 ta.spellcheck=false;ta.autocapitalize="off";ta.autocomplete="off";ta.value=d.code;ta.oninput=()=>{d.code=ta.value};
 ta.addEventListener("keydown",e=>{if(e.key==="Tab"&&!e.shiftKey){e.preventDefault();const s=ta.selectionStart;ta.setRangeText("    ",s,ta.selectionEnd,"end");d.code=ta.value}});
 if(l.sprache==="python"&&/input\(/.test(l.start+(l.aufgabe.loesung||""))){akNode("label","","Eingaben für das Programm (eine pro Zeile)",rechts);const eingabe=akNode("textarea","code-textarea",undefined,rechts);eingabe.style.minHeight="60px";eingabe.value=d.eingabe;eingabe.oninput=()=>{d.eingabe=eingabe.value}}
 const leiste=akNode("div","code-tabs",undefined,rechts),out=akNode("pre","code-example prog-ausgabe",undefined,rechts);out.hidden=true;out.setAttribute("aria-live","polite");
 let letzteAusgabe=null;
 if(l.sprache==="python"){const run=akNode("button","btn primary small","▶ Ausführen",leiste);run.type="button";
  run.onclick=async()=>{run.disabled=true;try{letzteAusgabe=await pythonLauf(d.code,d.eingabe,out)}catch(e){out.textContent=e.message}finally{run.disabled=false}}}
 const pruef=akNode("button","btn outline small code-pruefen","Prüfen",leiste);pruef.type="button";
 const checks=akNode("div","code-checks",undefined,links),hint=akNode("p","hint","Tipp: "+l.aufgabe.tipp,links);hint.hidden=true;
 const loes=akNode("button","btn outline small","Lösung zeigen",links);loes.type="button";loes.hidden=true;let fehlversuche=0;
 pruef.onclick=()=>{checks.replaceChildren();
  const erg=l.aufgabe.muster.map(m=>{let ok=false;try{ok=new RegExp(m.regex,m.flags||"").test(d.code)}catch(e){ok=false}akNode("p",ok?"code-ok":"code-error",(ok?"✓ ":"✗ ")+m.beschreibung,checks);return ok});
  if(l.sprache==="python"&&Array.isArray(l.aufgabe.ausgabe)&&l.aufgabe.ausgabe.length&&pythonNichtVerfuegbar&&letzteAusgabe===null)akNode("p","hint","Python läuft auf diesem Gerät gerade nicht. Die Ausgabe wird deshalb nicht geprüft.",checks);
  else if(l.sprache==="python"&&Array.isArray(l.aufgabe.ausgabe)&&l.aufgabe.ausgabe.length){
   const ok=letzteAusgabe!==null&&l.aufgabe.ausgabe.every(s=>letzteAusgabe.includes(s));
   akNode("p",ok?"code-ok":"code-error",(ok?"✓ ":"✗ ")+(letzteAusgabe===null?"Führe dein Programm zuerst mit ▶ Ausführen aus.":"Die Ausgabe enthält: "+l.aufgabe.ausgabe.join(" · ")),checks);erg.push(ok)}
  else if(l.sprache!=="python")akNode("p","hint","Diese Prüfung liest deinen Code. Ausführen kannst du ihn mit „Im Code-Studio öffnen“.",checks);
  const alle=erg.every(Boolean);if(!alle)fehlversuche++;hint.hidden=fehlversuche<1;loes.hidden=fehlversuche<2;
  if(alle){akNode("p","code-ok","Sehr gut! Weiter geht es mit dem Quiz.",checks);auf.freigeben()}};
 loes.onclick=()=>{d.code=l.aufgabe.loesung;ta.value=d.code;checks.replaceChildren()};
 lektionsQuiz(st,l,()=>{if(!state.completedLessons.includes(l.id)){state.completedLessons.push(l.id);save();renderCourses()}});
 lektionsAbschluss(st,l,w=>{
  const studio=akNode("button","btn primary","Im Code-Studio öffnen ↗",w);studio.type="button";const status=akNode("p","message","",w);
  studio.onclick=async()=>{studio.disabled=true;try{const name=await programmZuStudio("Akademie – "+l.title,sp.datei,d.code);location.href="/studio/index.html?projekt="+encodeURIComponent(name)}catch(e){A.set(status,"Projekt konnte nicht gespeichert werden: "+e.message);studio.disabled=false}}});
 st.start();
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
function renderPhrases(){const lang=$("translateLang").value;clearChildren("phraseList");D.phrases.forEach(p=>{const card=node("article","phrase",undefined,$("phraseList"));{const h=node("h3","",p.de,card);h.lang="de";h.dir="ltr";h.style.textAlign="start"}const trans=node("div","translated",p[lang]||"Übersetzung nicht verfügbar",card);trans.lang=lang;trans.dir=["fa","ur"].includes(lang)?"rtl":"auto";node("small","",p.hint,card);const actions=node("div","phrase-actions",undefined,card);const play=node("button","","🔊 Anhören",actions);play.type="button";play.addEventListener("click",()=>speaking(p.de));if(REC){const mic=node("button","","🎙 Nachsprechen",actions);mic.type="button";const status=node("div","message",undefined,card);mic.addEventListener("click",()=>practice(p,status))}})}
$("translateLang").addEventListener("change",()=>{stopSpeech();renderPhrases()});
$("speechSpeed").addEventListener("change",()=>stopSpeech());
window.addEventListener("pagehide",()=>stopSpeech());
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopSpeech()});
{const l=A.lang(),wahl=$("translateLang");if(wahl&&[...wahl.options].some(o=>o.value===l))wahl.value=l}
renderDashboard();renderCourses();renderPaths();renderProjects();renderPhrases();setTab(location.hash.slice(1),false);
})();
