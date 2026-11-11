/* Gemeinsame Darstellung für Startseite und Mein SD Hub.
   Übersetzte Steuerelemente sind maschinell erstellt und nicht muttersprachlich geprüft. */
(function(root){
"use strict";
const key="sdhub-appearance-v2",choices=["auto","light","dark"];
let preference="auto";try{const value=localStorage.getItem(key);if(choices.includes(value))preference=value;else if(value===null&&localStorage.getItem("sdhub-theme-v1")==="dark")preference="dark"}catch{}
const media=root.matchMedia("(prefers-color-scheme: dark)");
const labels={
 de:["Darstellung","Automatisch","Hell","Dunkel"],en:["Appearance","Automatic","Light","Dark"],
 fa:["ظاهر","خودکار","روشن","تیره"],ar:["المظهر","تلقائي","فاتح","داكن"],
 ur:["انداز","خودکار","روشن","تاریک"],uk:["Вигляд","Автоматично","Світлий","Темний"],ti:["ትርኢት","ኣውቶማቲክ","ብርሃን","ጸልማት"]
};
function controls(){const text=labels[root.SD_LANG]||labels.de;document.querySelectorAll("[data-sd-theme-choice]").forEach(select=>{select.value=preference;select.setAttribute("aria-label",text[0]);for(const option of select.options)option.textContent=text[{auto:1,light:2,dark:3}[option.value]]})}
function apply(value,persist){
 preference=choices.includes(value)?value:"auto";
 const mode=preference==="auto"?(media.matches?"dark":"light"):preference;
 document.documentElement.dataset.sdTheme=mode;document.documentElement.dataset.sdThemePreference=preference;
 document.documentElement.style.colorScheme=mode;
 if(persist)try{localStorage.setItem(key,preference)}catch{}
 controls();
}
apply(preference,false);
function bind(){document.querySelectorAll("[data-sd-theme-choice]").forEach(select=>select.addEventListener("change",()=>apply(select.value,true)));controls()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind);else bind();
const update=()=>{if(preference==="auto")apply("auto",false)};
if(media.addEventListener)media.addEventListener("change",update);else media.addListener(update);
root.addEventListener("storage",event=>{if(event.key===key)apply(event.newValue,false)});
document.addEventListener("sd-lang-changed",controls);
root.SDTheme={set:value=>apply(value,true),get:()=>preference};
})(window);
