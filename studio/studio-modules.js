/* Lightweight dependency bundler for native browser ES modules (no build tools).
   Supports local acyclic JS/MJS import/export graphs with explicit paths. */
(function(root){
'use strict';
function resolve(from,ref){
 if(typeof ref!=='string'||!/^\.\.?\//.test(ref))return null;
 const parts=from.split('/').slice(0,-1);
 for(const segment of ref.split(/[?#]/)[0].split('/')){
  if(segment==='.'||!segment)continue;
  if(segment==='..'){if(!parts.length)throw Error('Modulpfad verlässt das Projekt: '+ref);parts.pop();}
  else parts.push(segment);
 }
 return parts.join('/');
}
function bundle(entry,files){
 const data=files||{},cache=new Map(),maximum=40;
 function build(path,stack){
  if(cache.has(path))return cache.get(path);
  if(stack.includes(path))throw Error('Zyklischer Modulimport: '+stack.concat(path).join(' → '));
  if(stack.length>maximum)throw Error('Modul-Abhängigkeiten zu tief.');
  const source=data[path];
  if(typeof source!=='string'||source.startsWith('data:'))throw Error('Moduldatei fehlt: '+path);
  if(!/\.m?js$/i.test(path))throw Error('Nur lokale JavaScript-Module werden direkt unterstützt: '+path);
  const expanded=source.replace(/(\b(?:from|import)\s*(?:\(\s*)?)(["'])(\.{1,2}\/[^"'\n]+)\2/g,(full,prefix,quote,ref)=>{
   let target=resolve(path,ref);
   if(data[target]==null&&data[target+'.js']!=null)target+='.js';
   if(data[target]==null&&data[target+'.mjs']!=null)target+='.mjs';
   return prefix+quote+build(target,stack.concat(path))+quote;
  });
  const url='data:text/javascript;charset=utf-8,'+encodeURIComponent(expanded+'\n//# sourceURL=sd-studio-preview/'+encodeURIComponent(path));
  cache.set(path,url);
  return url;
 }
 return build(entry,[]);
}
const api={bundle,resolve};root.SDStudioModules=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
