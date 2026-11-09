/* SD Hub cross-app workspace navigation. Public, local, no credentials or telemetry.
   Does not modify existing app state or intercept native application actions.
   2026-11-09: einheitlicher Stil nach der Startseite, eine Kopfzeile pro Seite, schlichte Icons statt Emojis. */
(function(){
'use strict';
if(window.top!==window)return; // Never inject controls into user-designed previews or iframes.
const script=document.currentScript;
const category=script?.dataset.sdApp||'';
// The game universe has its own navigation and must not inherit the work-app shell.
if(['spiele','pibo','blockworld'].includes(category))return;
const mode=script?.dataset.sdMode==='compact'?'compact':'standard';

/* ---------- Icons (eigene, schlichte Linien-Icons, 24er Raster) ---------- */
const P={
 home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 dash:'<rect x="4" y="4" width="7" height="9" rx="1"/><rect x="13" y="4" width="7" height="5" rx="1"/><rect x="13" y="11" width="7" height="9" rx="1"/><rect x="4" y="15" width="7" height="5" rx="1"/>',
 spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
 camera:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
 clip:'<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5"/>',
 file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
 save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
 folder:'<path d="M3 6h6l2 2h10v11H3z"/>',
 down:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
 up:'<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 pen:'<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
 cal:'<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 10h16M8 3v4M16 3v4"/>',
 share:'<path d="M12 4v11M8 8l4-4 4 4"/><path d="M5 12v8h14v-8"/>',
 search:'<circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/>',
 print:'<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1"/><path d="M7 14h10v6H7z"/>',
 clipboard:'<rect x="6" y="5" width="12" height="16" rx="1"/><path d="M9 5V3h6v2M9 11h6M9 15h6"/>',
 sound:'<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
 play:'<path d="M8 5l11 7-11 7z"/>',
 refresh:'<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
 warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
 video:'<rect x="3" y="6" width="13" height="12" rx="1"/><path d="M16 10l5-3v10l-5-3"/>',
 chat:'<path d="M4 5h16v11H9l-5 4z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
 receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
 chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
 pin:'<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
 link:'<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17v.5"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
 brief:'<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V4h6v3M3 12h18"/>',
 book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
 cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
 code:'<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
 palette:'<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-1.2-1-1.5-1-2.5S13.5 15 15 15h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
 money:'<rect x="3" y="6" width="18" height="12" rx="1"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.5M18 14.5v.5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 ruler:'<path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/>',
 cloud:'<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-1 9z"/>',
 bot:'<rect x="5" y="8" width="14" height="11" rx="2"/><path d="M12 4v4M9 13v1M15 13v1M9 17h6"/>',
 award:'<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>',
 key:'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>',
 check:'<path d="M5 12l5 5 9-10"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 broom:'<path d="M14 4l6 6M13 11l-7 7c-1 1-3 1-3 1s0-2 1-3l7-7"/><path d="M10 9l5 5"/>',
 heart:'<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
 child:'<circle cx="12" cy="6" r="3"/><path d="M8 21l1-8-3-2M16 21l-1-8 3-2M9 13h6"/>',
 gift:'<rect x="4" y="9" width="16" height="12" rx="1"/><path d="M3 9h18M12 9v12M12 9c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1"/>',
 car:'<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM7 19v1M17 19v1M5 11h14"/>',
 bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
 plane:'<path d="M3 13l18-8-6 16-3-6z"/><path d="M12 15l-3 4"/>',
 tool:'<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8-1.5-1.5a4 4 0 0 0-5-5z"/><path d="M3 21l5-5"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 keys:'<rect x="2" y="6" width="20" height="12" rx="1"/><path d="M6 10h.5M10 10h.5M14 10h.5M18 10h.5M7 14h10"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'
};
function svg(name,size){
 const p=P[name];if(!p)return null;
 const t=document.createElement('template');t.innerHTML='<svg></svg>';const s=t.content.firstChild; // HTML-Parser setzt den SVG-Namensraum
 s.setAttribute('viewBox','0 0 24 24');s.setAttribute('width',size||18);s.setAttribute('height',size||18);
 s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.8');
 s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');s.setAttribute('aria-hidden','true');
 s.setAttribute('class','sd-ic');s.innerHTML=p;return s;
}
// Emoji -> Icon (nur für Knöpfe/Links). In Überschriften fallen Emojis ganz weg.
const EMO={'📷':'camera','📸':'camera','🎥':'video','📎':'clip','📄':'file','📑':'file','📃':'file','💾':'save','📂':'folder','📁':'folder','🗂':'folder','🗃':'folder',
 '⬇':'down','📥':'down','⬆':'up','🗑':'trash','✏':'pen','📝':'pen','✍':'pen','📅':'cal','📆':'cal','🗓':'cal','📤':'share','🔍':'search','🔎':'search','🖨':'print',
 '📋':'clipboard','🔊':'sound','🎤':'mic','▶':'play','🔁':'refresh','🔄':'refresh','⚙':'gear','ℹ':'info','⚠':'warn','🔒':'lock','🔐':'lock','🌐':'globe','🌍':'globe',
 '🏠':'home','💬':'chat','📬':'mail','✉':'mail','📨':'mail','📧':'mail','🧾':'receipt','📊':'chart','📈':'chart','📉':'chart','📌':'pin','📍':'pin','🔗':'link','❓':'help',
 '🤖':'bot','✨':'spark','🧹':'broom','👤':'user','👥':'users','💼':'brief','📚':'book','📖':'book','🎓':'cap','💻':'code','🎨':'palette','💶':'money','💰':'money',
 '💸':'money','🕒':'clock','⏰':'clock','⏱':'clock','📏':'ruler','📐':'ruler','🧮':'calc','☁':'cloud','🏅':'award','🔑':'key','✅':'check','❌':'x','💡':'bulb','🚗':'car',
 '👶':'child','🛠':'tool','🔧':'tool','🔨':'tool','👁':'eye','👀':'eye','⌨':'keys','🖼':'image','🌄':'image','🎁':'gift','🩺':'heart','🏋':'award','✈':'plane'};
const EMO_RE=/^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2}|[ℹ⬇⬆▶⚙⚠✏✍✉☁✈⌨])(?:️|‍(?:\p{Extended_Pictographic})|\p{Emoji_Modifier})*)\s*/u;
const ITEM_ICON={deutsch:'book',b1:'cap',ki:'spark',agent:'bot',studio:'code',design:'palette',pdf:'file',schreibstudio:'pen',rechnungen:'receipt',
 bewerbungen:'brief',post:'mail',scanner:'camera',fristen:'cal',haushalt:'money',wohnung:'home',vertraege:'file',arbeiten:'brief',jobsuche:'search',
 anerkennung:'award',mappe:'folder',messen:'ruler',ordnen:'folder',steuer:'calc',stunden:'clock',training:'chat','online-upload':'cloud',passfoto:'camera'};

const items=[
 {id:'deutsch',title:'Deutsch lernen',url:'/deutsch/',group:'Lernen'},
 {id:'b1',title:'B1-Prüfung',url:'/deutsch/b1-pruefung.html',group:'Lernen'},
 {id:'ki',title:'KI-Assistent',url:'/assistent/',group:'Lernen'},
 {id:'agent',title:'SD KI-Agent',url:'/agent/',group:'Lernen'},
 {id:'studio',title:'Code-Studio',url:'/studio/',group:'Kreativ'},
 {id:'design',title:'Design-Studio',url:'/design/',group:'Kreativ'},
 {id:'pdf',title:'PDF-Studio',url:'/pdf-studio/',group:'Kreativ'},
 {id:'schreibstudio',title:'Schreibstudio',url:'/schreibstudio/',group:'Kreativ'},
 {id:'rechnungen',title:'Rechnungen',url:'/rechnungen/',group:'Kreativ'},
 {id:'bewerbungen',title:'Bewerbungen',url:'/bewerbungen/',group:'Alltag'},
 {id:'post',title:'Briefe verstehen',url:'/post/',group:'Alltag'},
 {id:'scanner',title:'Scanner',url:'/scanner/',group:'Alltag'},
 {id:'fristen',title:'Fristen',url:'/fristen/',group:'Alltag'},
 {id:'haushalt',title:'Haushaltsbuch',url:'/haushalt/',group:'Alltag'},
 {id:'wohnung',title:'Wohnung',url:'/wohnung/',group:'Alltag'},
 {id:'vertraege',title:'Verträge',url:'/vertraege/',group:'Alltag'}
];
const others={arbeiten:'Arbeiten in Deutschland',jobsuche:'Arbeit finden',anerkennung:'Anerkennung',mappe:'Dokumentenmappe',messen:'Messen',ordnen:'Ordner aufräumen',
 steuer:'Steuern',stunden:'Arbeitszeiten',training:'Gesprächstraining','online-upload':'Online-Upload',passfoto:'Passfoto'};
const active=items.find(i=>i.id===category);
const name=active?.title||others[category]||'SD Hub';
const iconName=ITEM_ICON[category]||'grid';

// Einheitlicher Stil: hell wie die Startseite, dunkle Werkzeuge in einer dunklen Variante
const DUNKEL=['studio','design','deutsch','b1'];
document.documentElement.dataset.sdStil=DUNKEL.includes(category)?'hub-dunkel':'hub';

let rootDock,launch,panel,moreButtons=[];
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function buildLinks(){
 panel=el('section','sd-ws-panel');
 panel.id='sdWorkspacePanel';panel.hidden=true;panel.setAttribute('role','region');
 panel.setAttribute('aria-label','Alle SD Hub Anwendungen');
 const top=el('div','sd-ws-panel-head'),heading=el('strong','','Alle Bereiche');
 const close=el('button','sd-ws-close');close.append(svg('x',18));
 close.type='button';close.setAttribute('aria-label','Schließen');close.addEventListener('click',()=>toggle(false));
 top.append(heading,close);panel.append(top);
 for(const group of ['Lernen','Kreativ','Alltag']){
  const section=el('div','sd-ws-section');
  section.append(el('span','sd-ws-section-label',group));
  const grid=el('div','sd-ws-app-grid');
  for(const item of items.filter(i=>i.group===group)){
   const a=el('a','sd-ws-app');a.href=item.url;
   if(item.id===category)a.setAttribute('aria-current','page');
   const ic=el('span','sd-ws-app-icon');ic.append(svg(ITEM_ICON[item.id]||'grid',18));
   a.append(ic,el('span','',item.title));grid.append(a);
  }
  section.append(grid);panel.append(section);
 }
 const alle=el('a','sd-ws-all','Startseite mit allen Bereichen');alle.href='/#bereiche';panel.append(alle);
 document.body.append(panel);
}
function toggle(force){
 if(!panel)return;
 const open=typeof force==='boolean'?force:panel.hidden;
 panel.hidden=!open;
 for(const b of moreButtons)b.setAttribute('aria-expanded',String(open));
 if(open)panel.querySelector('.sd-ws-close')?.focus();
}
function menuButton(cls){
 const button=el('button',cls);
 button.type='button';button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-controls','sdWorkspacePanel');
 button.setAttribute('aria-label','Alle Bereiche anzeigen');
 button.addEventListener('click',()=>toggle());
 moreButtons.push(button);return button;
}
function create(){
 if(document.getElementById('sdWorkspacePanel')||!document.body)return;
 document.body.dataset.sdWsMode=mode;
 buildLinks();
 if(mode==='standard'){
  // Nur eine Kopfzeile: Hat die Seite eine eigene, kommt dort ein kleiner Knopf hinein.
  const eigene=document.querySelector('body > header, .topbar, body > .kopf, .app-header, .studio-header');
  if(eigene){
   const b=menuButton('sd-ws-kopf-knopf');b.append(svg('grid',18),el('span','','Bereiche'));
   (eigene.querySelector('.topbar-right,.top-actions,.header-actions,.actions')||eigene).append(b);
  }else{
   const bar=el('div','sd-ws-bar');
   bar.setAttribute('role','navigation');bar.setAttribute('aria-label','SD Hub Navigation');
   const home=el('a','sd-ws-brand');home.href='/';
   const logo=el('span','sd-ws-logo');logo.append(svg(iconName,18));
   home.append(logo,el('strong','',name));
   const b=menuButton('sd-ws-kopf-knopf');b.append(svg('grid',18),el('span','','Bereiche'));
   bar.append(home,b);
   document.body.insertBefore(bar,document.body.firstChild);
  }
  rootDock=el('nav','sd-ws-dock');
  rootDock.setAttribute('aria-label','SD Hub Schnellnavigation');
  const entries=[['home','Start','/'],['dash','Mein SD Hub','/mein-sd-hub/'],['spark','KI-Assistent','/assistent/']];
  for(const [icon,label,url] of entries){
   const a=el('a',url===active?.url?'sd-ws-current':'');
   a.href=url;a.append(svg(icon,22),el('span','',label));rootDock.append(a);
  }
  const more=menuButton('');more.append(svg('grid',22),el('span','','Bereiche'));
  rootDock.append(more);
  document.body.append(rootDock);
 }else{
  launch=menuButton('sd-ws-launch');launch.append(svg('grid',20));
  launch.title='Alle Bereiche';
  document.body.append(launch);
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.preventDefault();toggle(false);moreButtons[0]?.focus();}});
 document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!panel.contains(e.target)&&!moreButtons.some(b=>b.contains(e.target)))toggle(false);});
}

/* ---------- Emojis aufräumen: Überschriften ohne, Knöpfe mit schlichtem Icon ---------- */
const NICHT='textarea,input,select,script,style,svg,canvas,iframe,[contenteditable=""],[contenteditable=true],.sd-ws-panel,.sd-ws-dock,.sd-roh,.preview,.vorschau,.sheet-preview,.page-canvas,.cm-editor,.CodeMirror,.chat-verlauf,.nachricht,.msg,.bubble,[data-sd-roh]';
const KOPF='h1,h2,h3,h4,h5,legend,summary,.label,.sheet-title,.sd-p-kicker,strong,.hinweis p,.hinweis li,.info-box p,.info-box li,.tipp,.hint';
const KNOPF='button,a,label,.chip,.tab,[role=tab],option';
function ersteTextknoten(e){
 const w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;
 while((n=w.nextNode())){if(n.nodeValue.trim())return n;}
 return null;
}
function aufraeumen(e){
 if(!e||e.nodeType!==1||e.closest(NICHT))return;
 const n=ersteTextknoten(e);if(!n)return;
 const m=n.nodeValue.match(EMO_RE);if(!m)return;
 // Nur, wenn das Emoji wirklich am Anfang dieses Elements steht
 const vor=n.parentElement;if(!vor||!e.contains(vor))return;
 const istKnopf=e.matches(KNOPF)&&!e.matches(KOPF);
 const rest=n.nodeValue.slice(m[0].length);
 if(!rest.trim()){
  // Emoji steht allein in einem eigenen Element (z. B. <span>📁</span>Dateien)
  const sonst=e.textContent.replace(m[0],'').trim();
  if(!sonst)return; // reine Symbol-Knöpfe (z. B. ◀ ▶) nicht anfassen
  const key=[...m[1]][0],name=EMO[key];
  const istK=e.matches(KNOPF)&&!e.matches(KOPF);
  if(vor!==e&&vor.childNodes.length===1&&!vor.children.length){
   if(name){vor.replaceChildren(svg(name,istK?20:18));vor.classList.add('sd-ic-platz');}
   else if(!istK)vor.remove();
  }else if(name||!istK){n.nodeValue='';if(istK&&name)vor.insertBefore(svg(name,17),n);}
  return;
 }
 n.nodeValue=(n.nodeValue.match(/^\s*/)[0])+rest;
 if(istKnopf&&e.tagName!=='OPTION'){
  const key=[...m[1]][0];const name=EMO[key];
  const alt=e.querySelector(':scope > .sd-ic');
  if(name&&!alt){const s=svg(name,17);vor.insertBefore(s,n);}
 }
}
function durchgang(wurzel){
 if(!wurzel||wurzel.nodeType!==1)return;
 if(wurzel.matches&&(wurzel.matches(KOPF)||wurzel.matches(KNOPF)))aufraeumen(wurzel);
 wurzel.querySelectorAll&&wurzel.querySelectorAll(KOPF+','+KNOPF).forEach(aufraeumen);
}
let laeuft=false;
function startAufraeumen(){
 durchgang(document.body);
 new MutationObserver(ms=>{
  if(laeuft)return;laeuft=true;
  try{for(const m of ms){
   if(m.type==='characterData'){const p=m.target.parentElement;const z=p&&p.closest(KOPF+','+KNOPF);if(z)aufraeumen(z);}
   else m.addedNodes.forEach(x=>{if(x.nodeType===1)durchgang(x);else if(x.nodeType===3&&x.parentElement){const z=x.parentElement.closest(KOPF+','+KNOPF);if(z)aufraeumen(z);}});
  }}finally{laeuft=false;}
 }).observe(document.body,{subtree:true,childList:true,characterData:true});
}
function nachLaden(){create();setTimeout(startAufraeumen,0);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',nachLaden,{once:true});
else nachLaden();
window.SDWorkspace={items:items.map(({id,title,url,group})=>({id,title,url,group})),get mode(){return mode},toggle,icon:svg};
})();
