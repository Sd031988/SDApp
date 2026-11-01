/* User-triggered selection bridge. No ChatGPT login, cookies or history access. */
'use strict';
const ID='sd-send-selection';
const TARGET='https://www.thesdhub.com/studio/';
const MAX_CHARS=250000;
const TTL=15*60*1000;
function providerFor(url){
 try{
  const u=new URL(url);
  if(u.protocol!=='https:')return null;
  if(u.hostname==='chatgpt.com'||u.hostname==='chat.openai.com')return 'chatgpt';
  if(u.hostname==='gemini.google.com')return 'gemini';
 }catch(_){}
 return null;
}
function isStudio(url){
 try{
  const u=new URL(url);
  return u.protocol==='https:'&&['www.thesdhub.com','thesdhub.com'].includes(u.hostname)&&
    (u.pathname==='/studio/'||u.pathname==='/studio/index.html');
 }catch(_){return false}
}
chrome.runtime.onInstalled.addListener(()=>{
 chrome.contextMenus.create({
  id:ID,title:'Ausgewählten KI-Text an SD Code-Studio senden',
  contexts:['selection'],
  documentUrlPatterns:['https://chatgpt.com/*','https://chat.openai.com/*','https://gemini.google.com/*']
 });
});
chrome.contextMenus.onClicked.addListener(async(info,tab)=>{
 if(info.menuItemId!==ID)return;
 const provider=providerFor(info.pageUrl||tab?.url||'');
 const chosen=typeof info.selectionText==='string'?info.selectionText.trim():'';
 if(!provider||!chosen||chosen.length>MAX_CHARS){
  await chrome.action.setBadgeText({text:'!'});return;
 }
 const nonce=crypto.randomUUID();
 // Chrome session storage belongs to this browser session, not a web server.
 await chrome.storage.session.set({sdPending:{nonce,provider,text:chosen,at:Date.now()}});
 await chrome.action.setBadgeText({text:'1'});
 const tabs=await chrome.tabs.query({url:['https://www.thesdhub.com/studio/*','https://thesdhub.com/studio/*']});
 const existing=tabs.find(t=>isStudio(t.url||''));
 if(existing?.id!==undefined){
  await chrome.tabs.update(existing.id,{active:true});
  if(existing.windowId!==undefined)await chrome.windows.update(existing.windowId,{focused:true});
  chrome.tabs.sendMessage(existing.id,{type:'SD_BRIDGE_REFRESH'}).catch(()=>{});
 }else await chrome.tabs.create({url:TARGET,active:true});
});
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(!isStudio(sender?.url||'')||!m||typeof m.type!=='string')return;
 if(m.type==='SD_BRIDGE_GET'){
  chrome.storage.session.get('sdPending').then(({sdPending})=>{
   if(!sdPending||Date.now()-sdPending.at>TTL){
    chrome.storage.session.remove('sdPending').catch(()=>{});
    reply({pending:null});return;
   }
   reply({pending:sdPending});
  }).catch(()=>reply({pending:null}));
  return true;
 }
 if(m.type==='SD_BRIDGE_ACK'&&typeof m.nonce==='string'){
  chrome.storage.session.get('sdPending').then(async({sdPending})=>{
   if(sdPending?.nonce===m.nonce){
    await chrome.storage.session.remove('sdPending');
    await chrome.action.setBadgeText({text:''});
   }
   reply({ok:sdPending?.nonce===m.nonce});
  }).catch(()=>reply({ok:false}));
  return true;
 }
});
