/* SD Studio safe text-only updates for simple HTML elements (no user code execution). */
(function(root){
'use strict';
const ALLOWED=new Set(['h1','h2','h3','h4','p','button','a','label','span','li']);
function escape(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function replaceText(html,tag,previous,next){
 if(typeof html!=='string'||typeof next!=='string'||next.length>600||!next.trim())throw Error('Bitte einen Text mit maximal 600 Zeichen eingeben.');
 tag=String(tag||'').toLowerCase();
 if(!ALLOWED.has(tag))throw Error('Dieses Element kann hier nicht visuell geändert werden.');
 const rx=/<(h1|h2|h3|h4|p|button|a|label|span|li)\b([^>]*)>([^<>]*)<\/\1\s*>/gi;
 const matches=[];
 for(const match of html.matchAll(rx)){
  if(match[1].toLowerCase()===tag&&match[3].trim()===String(previous).trim())
   matches.push(match);
 }
 if(matches.length!==1)throw Error(matches.length?'Der Text kommt mehrfach vor. Bitte die Datei im Code-Editor bearbeiten.':'Text wurde nur dynamisch erzeugt oder enthält verschachtelte Elemente. Bitte im Code-Editor bearbeiten.');
 const m=matches[0],replacement='<'+m[1]+m[2]+'>'+escape(next)+'</'+m[1]+'>';
 const result=html.slice(0,m.index)+replacement+html.slice(m.index+m[0].length);
 return {content:result,line:(html.slice(0,m.index).match(/\n/g)||[]).length+1};
}
const api={replaceText};root.SDStudioVisualText=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
