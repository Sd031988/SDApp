/* Pibo Premium controls: all native game handlers remain in kids/index.html.
   This file controls only which action buttons are visible and never edits saved games. */
(function(root){
'use strict';
const GROUPS=Object.freeze({
 care:['pet','feed','sleep','wash','scrub','rinse','dry','lamp','foodchoice','potty','flush'],
 games:['play','minigame','mousegame','gardenPlay'],
 style:['outfit','decorate','photo'],
 extras:['sound','catVoice','talk','surprise']
});
function groupOf(button){
 const name=button.dataset?.act||button.id;
 return Object.keys(GROUPS).find(group=>GROUPS[group].includes(name))||'extras';
}
function init(document){
 const tabs=document.getElementById('piboActionTabs'),
 actions=document.getElementById('piboActions');
 if(!tabs||!actions)return false;
 const buttons=Array.from(actions.querySelectorAll('button'));
 const modeTabs=Array.from(tabs.querySelectorAll('[data-pibo-tab]'));
 function setTab(value){
  if(!GROUPS[value])return false;
  for(const button of buttons)button.hidden=groupOf(button)!==value;
  for(const tab of modeTabs)tab.setAttribute('aria-pressed',String(tab.dataset.piboTab===value));
  tabs.dataset.current=value;
  return true;
 }
 modeTabs.forEach(tab=>tab.addEventListener('click',()=>setTab(tab.dataset.piboTab)));
 setTab('care');
 const food=document.getElementById('foodShelf');
 // Food choice always belongs to care. The original game still owns its visibility.
 const roomNav=document.querySelector('.rooms');
 roomNav?.addEventListener('click',event=>{
  const room=event.target.closest('[data-room]')?.dataset.room;
  if(room==='kitchen'||room==='bathroom'||room==='bedroom'||room==='toilet')setTab('care');
 });
 const showCategory=button=>{
  const group=groupOf(button);
  setTab(group);
 };
 root.PiboPremiumUI={setTab,showCategory,get current(){return tabs.dataset.current}};
 return true;
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(document),{once:true});
 else init(document);
}
if(typeof module!=='undefined'&&module.exports)module.exports={GROUPS,groupOf,init};
})(typeof window!=='undefined'?window:globalThis);
