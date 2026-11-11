/* Übungstypen der SD Akademie: lokal, ohne fremde Bibliotheken. */
(function(root){
"use strict";
const norm=value=>String(value??"").trim().toLocaleLowerCase("de");
function pruefen(uebung,antwort){
 const typ=uebung.typ;
 if(typ==="auswahl"){const expected=[...(uebung.richtig||[])].sort().join(",");return {ok:[...(Array.isArray(antwort)?antwort:[])].sort().join(",")===expected,erklaerung:uebung.erklaerung||"Vergleiche die gewählten Antworten."}}
 if(typ==="luecke"){const richtig=uebung.loesung||[];return {ok:Array.isArray(antwort)&&richtig.length===antwort.length&&richtig.every((x,i)=>norm(x)===norm(antwort[i])),erklaerung:uebung.erklaerung||"Prüfe jedes fehlende Wort."}}
 if(typ==="zuordnen"){const pairs=uebung.paare||[];return {ok:Array.isArray(antwort)&&pairs.length===antwort.length&&pairs.every((p,i)=>norm(p[1])===norm(antwort[i])),erklaerung:uebung.erklaerung||"Prüfe, was zusammengehört."}}
 if(typ==="reihenfolge"){return {ok:Array.isArray(antwort)&&antwort.join("|")===(uebung.loesung||[]).join("|"),erklaerung:uebung.erklaerung||"Prüfe die Reihenfolge der Schritte."}}
 if(typ==="schreiben"){return {ok:null,erklaerung:"Hier gibt es keine automatische Bewertung. Vergleiche deine Antwort selbst mit der Musterlösung und der Checkliste."}}
 if(typ==="hoeren"){return {ok:norm(antwort)===norm(uebung.loesung),erklaerung:uebung.erklaerung||"Lies oder höre den Text noch einmal."}}
 throw new Error("Unbekannter Übungstyp: "+typ);
}
function render(container,uebung){
 const A=root.SDAkademieI18n||{bind:()=>{},set:(el,t)=>{el.textContent=t},attr:(el,k,t)=>el.setAttribute(k,t)};
 const el=(tag,txt,parent=container)=>{const n=document.createElement(tag);if(txt!==undefined){n.textContent=txt;A.bind(n,txt)}parent.appendChild(n);return n};
 const box=el("section");box.className="ak-uebung";
 el("h5",uebung.titel||"Übung",box);
 el("p",uebung.aufgabe||"",box);
 let read;
 if(uebung.typ==="auswahl"){
  const options=(uebung.antworten||[]).map((text,i)=>{const label=el("label",undefined,box),input=el("input",undefined,label);input.type="checkbox";input.value=String(i);label.appendChild(document.createTextNode(" "+text));return input});
  read=()=>options.flatMap((x,i)=>x.checked?[i]:[]);
 }else if(uebung.typ==="luecke"){
  const fields=(uebung.luecken||[]).map((labelText,i)=>{const label=el("label",labelText+" ",box),input=el("input",undefined,label);input.type="text";input.autocomplete="off";A.attr(input,"aria-label",labelText||"Lücke "+(i+1));return input});
  read=()=>fields.map(x=>x.value);
 }else if(uebung.typ==="zuordnen"){
  const selects=(uebung.paare||[]).map(([left],i)=>{const label=el("label",left+" → ",box),select=el("select",undefined,label);el("option","Bitte wählen",select).value="";for(const [,right] of uebung.paare){const option=el("option",right,select);option.value=right}A.attr(select,"aria-label","Zuordnung für "+left);return select});
  read=()=>selects.map(x=>x.value);
 }else if(uebung.typ==="reihenfolge"){
  const values=[...(uebung.start||uebung.loesung||[])],list=el("ol",undefined,box);
  const draw=()=>{list.replaceChildren();values.forEach((value,i)=>{const li=el("li",value+" ",list);for(const [text,delta] of [["Hoch",-1],["Runter",1]]){const button=el("button",text,li);button.type="button";button.disabled=i+delta<0||i+delta>=values.length;A.attr(button,"aria-label",value+" "+text);button.onclick=()=>{[values[i],values[i+delta]]=[values[i+delta],values[i]];draw()}}})};
  draw();read=()=>[...values];
 }else if(uebung.typ==="schreiben"){
  const label=el("label","Deine Antwort",box),field=el("textarea",undefined,label);field.rows=5;
  read=()=>field.value;
 }else if(uebung.typ==="hoeren"){
  const spoken=el("p",uebung.text||"",box);
  const speak=el("button","Text vorlesen",box);speak.type="button";
  if(!("speechSynthesis" in window)){speak.disabled=true;el("p","Vorlesen ist hier nicht verfügbar. Du kannst den Text oben lesen.",box)}
  else speak.onclick=()=>{window.speechSynthesis.cancel();const msg=new SpeechSynthesisUtterance(uebung.text||"");msg.lang="de-DE";window.speechSynthesis.speak(msg)};
  const label=el("label","Deine Antwort ",box),field=el("input",undefined,label);field.type="text";read=()=>field.value;
 }else{el("p","Dieser Übungstyp wird nicht unterstützt.",box);return}
 const button=el("button","Prüfen",box);button.type="button";button.className="btn outline small uebung-pruefen";
 const status=el("p","",box);status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const hint=el("p","Tipp: "+(uebung.tipp||"Lies die Aufgabe noch einmal."),box);hint.hidden=true;
 const show=el("button","Lösung zeigen",box);show.type="button";show.hidden=true;
 const answer=el("div","",box);answer.hidden=true;
 let failures=0;
 const solution=()=>uebung.typ==="auswahl"?(uebung.richtig||[]).map(i=>uebung.antworten[i]).join(", "):uebung.typ==="zuordnen"?(uebung.paare||[]).map(p=>p.join(" → ")).join("; "):uebung.typ==="schreiben"?uebung.musterloesung||"":Array.isArray(uebung.loesung)?uebung.loesung.join(" → "):String(uebung.loesung??"");
 show.onclick=()=>{answer.hidden=false;answer.replaceChildren();el("p","Musterlösung: "+solution(),answer);if(uebung.typ==="schreiben"){const list=el("ul",undefined,answer);for(const point of uebung.checkliste||[])el("li",point,list)}};
 button.onclick=()=>{
  const result=pruefen(uebung,read());
  if(result.ok===null){A.set(status,"Selbstkontrolle: Vergleiche deinen Text mit der Musterlösung. Es gibt keine automatische Note.");show.hidden=false;show.onclick();return}
  A.set(status,(result.ok?"✓ Richtig. ":"✗ Noch nicht richtig. ")+result.erklaerung);
  if(!result.ok)failures++;
  hint.hidden=failures<2;show.hidden=failures<3;
 };
 return box;
}
const api={pruefen,render};
root.SDAkademieUebungen=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
