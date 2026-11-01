/* Runs ONLY on the SD Code-Studio site. Transfers the explicitly selected
   text to the existing KI-Coding review UI without writing or executing files. */
(function(){
'use strict';
if(window.top!==window)return;
const MAX=250000;
let latest=null;
function receive(){
 chrome.runtime.sendMessage({type:'SD_BRIDGE_GET'},response=>{
  if(chrome.runtime.lastError)return;
  const p=response?.pending;
  if(!p||typeof p.nonce!=='string'||typeof p.text!=='string'||p.text.length>MAX)return;
  latest=p.nonce;
  window.postMessage({type:'SD_STUDIO_SELECTED_CHAT_TEXT',version:1,
    nonce:p.nonce,provider:p.provider,text:p.text},location.origin);
 });
}
window.addEventListener('message',e=>{
 if(e.source!==window||e.origin!==location.origin)return;
 const m=e.data;
 if(m?.type==='SD_STUDIO_SELECTED_CHAT_ACK'&&m.version===1&&m.nonce===latest){
  chrome.runtime.sendMessage({type:'SD_BRIDGE_ACK',nonce:m.nonce},()=>{void chrome.runtime.lastError});
  latest=null;
 }
});
chrome.runtime.onMessage.addListener(m=>{if(m?.type==='SD_BRIDGE_REFRESH')receive()});
receive();
const timer=setInterval(receive,2200);
setTimeout(()=>clearInterval(timer),15*60*1000);
})();
