/* SD Hub cross-app workspace navigation. Public, local, no credentials or telemetry.
   Does not modify existing app state or intercept native application actions. */
(function(){
'use strict';
if(window.top!==window)return; // Never inject controls into user-designed previews or iframes.
const script=document.currentScript;
const category=script?.dataset.sdApp||'';
const mode=script?.dataset.sdMode==='compact'?'compact':'standard';
const items=[
 {id:'deutsch',title:'Deutsch lernen',icon:'📚',url:'/deutsch/',group:'Lernen'},
 {id:'b1',title:'B1-Prüfung',icon:'🎓',url:'/deutsch/b1-pruefung.html',group:'Lernen'},
 {id:'ki',title:'KI-Assistent',icon:'✨',url:'/assistent/',group:'Lernen'},
 {id:'agent',title:'SD KI-Agent',icon:'🤖',url:'/agent/',group:'Lernen'},
 {id:'studio',title:'Code-Studio',icon:'💻',url:'/studio/',group:'Kreativ'},
 {id:'design',title:'Design-Studio',icon:'🎨',url:'/design/',group:'Kreativ'},
 {id:'pdf',title:'PDF-Studio',icon:'📄',url:'/pdf-studio/',group:'Kreativ'},
 {id:'schreibstudio',title:'Schreibstudio',icon:'✍️',url:'/schreibstudio/',group:'Kreativ'},
 {id:'rechnungen',title:'Rechnungen',icon:'🧾',url:'/rechnungen/',group:'Kreativ'},
 {id:'bewerbungen',title:'Bewerbungen',icon:'💼',url:'/bewerbungen/',group:'Alltag'},
 {id:'post',title:'Briefe verstehen',icon:'📬',url:'/post/',group:'Alltag'},
 {id:'scanner',title:'Scanner',icon:'📷',url:'/scanner/',group:'Alltag'},
 {id:'fristen',title:'Fristen',icon:'📅',url:'/fristen/',group:'Alltag'},
 {id:'haushalt',title:'Haushaltsbuch',icon:'💶',url:'/haushalt/',group:'Alltag'},
 {id:'wohnung',title:'Wohnung',icon:'🏠',url:'/wohnung/',group:'Alltag'},
 {id:'vertraege',title:'Verträge',icon:'📑',url:'/vertraege/',group:'Alltag'},
 {id:'spiele',title:'Spiele',icon:'🎮',url:'/kids/games/',group:'Spiele'},
 {id:'pibo',title:'Pibo 3D',icon:'🐱',url:'/kids/',group:'Spiele'},
 {id:'blockworld',title:'BlockWorld',icon:'🧱',url:'/kids/blockworld/',group:'Spiele'}
];
const others={
 arbeiten:['Arbeiten','💼'],anerkennung:['Anerkennung','🏅'],mappe:['Dokumentenmappe','🗂️'],
 messen:['Werkzeuge','📏'],ordnen:['Dokumente ordnen','🗃️'],steuer:['Steuern','🧮'],
 stunden:['Arbeitszeiten','🕒'],training:['Training','🏋️'], 'online-upload':['Online-Upload','☁️'],
 passfoto:['Passfoto','📸']
};
const active=items.find(i=>i.id===category);
const name=active?.title||others[category]?.[0]||'SD Hub App';
const symbol=active?.icon||others[category]?.[1]||'▦';
let rootBar,rootDock,launch,panel,moreButtons=[];
function el(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
}
function link(title,href,cls,icon){
 const a=el('a',cls);
 a.href=href;
 if(icon)a.append(el('span','',icon));
 a.append(document.createTextNode(title));
 return a;
}
function buildLinks(){
 panel=el('section','sd-ws-panel');
 panel.id='sdWorkspacePanel';panel.hidden=true;panel.setAttribute('role','region');
 panel.setAttribute('aria-label','Alle SD Hub Anwendungen');
 const top=el('div','sd-ws-panel-head'),heading=el('strong','', 'Alle SD Hub Apps');
 const close=el('button','sd-ws-close','✕');
 close.type='button';close.setAttribute('aria-label','App-Auswahl schließen');close.addEventListener('click',()=>toggle(false));
 top.append(heading,close);panel.append(top,el('p','sd-ws-panel-sub','Wechsle die Anwendung, ohne deine Arbeit im aktuellen Bereich zu verändern.'));
 for(const group of ['Lernen','Kreativ','Alltag','Spiele']){
  const section=el('div','sd-ws-section');
  section.append(el('span','sd-ws-section-label',group));
  const grid=el('div','sd-ws-app-grid');
  for(const item of items.filter(i=>i.group===group)){
   const a=el('a','sd-ws-app');a.href=item.url;
   if(item.id===category)a.setAttribute('aria-current','page');
   a.append(el('span','sd-ws-app-icon',item.icon),el('span','',item.title));
   grid.append(a);
  }
  section.append(grid);panel.append(section);
 }
 document.body.append(panel);
}
function toggle(force){
 if(!panel)return;
 const open=typeof force==='boolean'?force:panel.hidden;
 panel.hidden=!open;
 for(const b of moreButtons)b.setAttribute('aria-expanded',String(open));
 if(open)panel.querySelector('.sd-ws-close')?.focus();
}
function menuButton(text,cls){
 const button=el('button',cls,text);
 button.type='button';button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-controls','sdWorkspacePanel');
 button.setAttribute('aria-label','Alle SD Hub Apps anzeigen');
 button.addEventListener('click',()=>toggle());
 moreButtons.push(button);return button;
}
function create(){
 if(document.getElementById('sdWorkspacePanel')||!document.body)return;
 document.body.dataset.sdWsMode=mode;
 buildLinks();
 if(mode==='standard'){
  rootBar=el('div','sd-ws-bar');
  rootBar.setAttribute('role','navigation');rootBar.setAttribute('aria-label','SD Hub App-Navigation');
  const brand=el('div','sd-ws-brand'),logo=el('span','sd-ws-logo',symbol);
  logo.setAttribute('aria-hidden','true');
  const labels=el('span','sd-ws-brand-label');
  labels.append(el('strong','',name),el('small','','SD Hub · App-Arbeitsplatz'));
  brand.append(logo,labels);
  const actions=el('div','sd-ws-links');
  actions.append(link('⌂ Dashboard','/mein-sd-hub/','sd-ws-link sd-ws-main'),
    link('⌂ Startseite','/','sd-ws-link sd-ws-secondary'),
    menuButton('☰ Alle Apps','sd-ws-menu-toggle'));
  rootBar.append(brand,actions);
  document.body.insertBefore(rootBar,document.body.firstChild);
  rootDock=el('nav','sd-ws-dock');
  rootDock.setAttribute('aria-label','SD Hub Schnellnavigation');
  const entries=[['🏠','Dashboard','/mein-sd-hub/'],
                 ['💻','Code-Studio','/studio/'],
                 ['✨','KI','/assistent/']];
  for(const [icon,label,url] of entries){
    const a=el('a',url===active?.url?'sd-ws-current':'');
    a.href=url;a.append(el('em','',icon),el('span','',label));
    rootDock.append(a);
  }
  const more=menuButton('','');
  more.append(el('em','','☰'),el('span','','Alle Apps'));
  rootDock.append(more);
  document.body.append(rootDock);
 }else{
  launch=menuButton('','sd-ws-launch');
  launch.append(el('span','','▦'),el('span','','SD Hub Apps'));
  document.body.append(launch);
 }
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!panel.hidden){e.preventDefault();toggle(false);moreButtons[0]?.focus();}
 });
 document.addEventListener('pointerdown',e=>{
  if(!panel.hidden&&!panel.contains(e.target)&&!moreButtons.some(b=>b.contains(e.target)))toggle(false);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create,{once:true});
else create();
window.SDWorkspace={items:items.map(({id,title,url,group})=>({id,title,url,group})),get mode(){return mode},toggle};
})();
