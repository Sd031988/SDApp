/* SD Game-Studio editor workspace controls.
 * Presentation-only state: no project writes, storage, network or scene mutations. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document){
root.SDGameWorkspace=api;
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>api.mount(root.document),{once:true});
else api.mount(root.document);
}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function createState(){
let state={assets:true,inspector:true,focus:false};
return Object.freeze({
read(){return{...state};},
dispatch(action){
if(action==='focus')state={...state,focus:!state.focus};
else if(action==='exit')state={...state,focus:false};
else if(action==='assets')state={...state,assets:!state.assets,focus:false};
else if(action==='inspector')state={...state,inspector:!state.inspector,focus:false};
else if(action==='restore')state={assets:true,inspector:true,focus:false};
else throw Error('Unbekannte Editor-Ansicht.');
return{...state};
}
});
}
function mount(doc){
const layout=doc.querySelector('.layout'),body=doc.body,
focus=doc.getElementById('focusViewport'),
assets=doc.getElementById('toggleAssetPanel'),
inspector=doc.getElementById('toggleInspectorPanel'),
hint=doc.getElementById('workspaceLayoutStatus');
if(!layout||!focus||!assets||!inspector)return null;
const controller=createState();
function display(){
const state=controller.read();
layout.classList.toggle('focus-mode',state.focus);
layout.classList.toggle('assets-closed',!state.assets);
layout.classList.toggle('inspector-closed',!state.inspector);
body.classList.toggle('viewport-focus',state.focus);
body.dataset.workspaceView=state.focus?'focus':state.assets&&state.inspector?'standard':'custom';
focus.setAttribute('aria-pressed',String(state.focus));
assets.setAttribute('aria-pressed',String(state.assets));
inspector.setAttribute('aria-pressed',String(state.inspector));
assets.setAttribute('aria-expanded',String(!state.focus&&state.assets));
inspector.setAttribute('aria-expanded',String(!state.focus&&state.inspector));
focus.querySelector('span').textContent=state.focus?'Editor zeigen':'Fokusansicht';
focus.setAttribute('aria-label',state.focus?'Fokusansicht beenden':'3D-Arbeitsfläche maximieren');
if(hint)hint.textContent=state.focus?'Fokusansicht · Esc oder F zum Beenden':
!state.assets&&!state.inspector?'Arbeitsfläche breit · F für Fokus':
'Lokaler Level Editor · WebGL';
}
function command(name){controller.dispatch(name);display();}
focus.addEventListener('click',()=>command('focus'));
assets.addEventListener('click',()=>command('assets'));
inspector.addEventListener('click',()=>command('inspector'));
doc.addEventListener('keydown',event=>{
if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
const el=event.target;
if(el&&((el.closest&&el.closest('input,textarea,select,[contenteditable="true"]'))||el.isContentEditable))return;
if(event.key==='Escape'&&controller.read().focus){event.preventDefault();command('exit');}
if(event.key.toLowerCase()==='f'&&event.key.length===1&&doc.getElementById('modePlay')?.getAttribute('aria-pressed')!=='true'){event.preventDefault();command('focus');}
});
display();
return controller;
}
return Object.freeze({createState,mount});
});
