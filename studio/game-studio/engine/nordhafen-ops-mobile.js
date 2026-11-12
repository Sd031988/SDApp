/* Nordhafen Ops mobile on-foot controls. Opt-in, no global engine changes.
 * Pointer events support simultaneous movement, interaction and camera touch.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsMobile=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY_NAMES=Object.freeze({KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',Space:' ',ShiftLeft:'Shift',ControlLeft:'Control',KeyE:'e',KeyR:'r'});
function look(alpha,beta,dx,dy,limits={lower:.35,upper:2.7,sensitivity:.006}){
 const sensitivity=Number.isFinite(limits.sensitivity)?limits.sensitivity:.006;
 const lower=Number.isFinite(limits.lower)?limits.lower:.35;
 const upper=Number.isFinite(limits.upper)?limits.upper:2.7;
 return {alpha:alpha-dx*sensitivity,beta:Math.max(lower,Math.min(upper,beta-dy*sensitivity))};
}
function create({canvas,camera,document:doc,signal,fire=()=>{},onVehicle=()=>{}}={}){
 if(!canvas||!camera||!doc||!signal)throw new TypeError('mobile controls require canvas, camera, document and abort signal');
 const held=new Map();
 let lookPointer=null,lookX=0,lookY=0;
 const KeyEvent=doc.defaultView?.KeyboardEvent;
 function emit(type,code){
  if(!KeyEvent)return;
  canvas.dispatchEvent(new KeyEvent(type,{code,key:KEY_NAMES[code]||code,bubbles:true,cancelable:true}));
 }
 function release(pointerId){
  const code=held.get(pointerId);
  if(code){held.delete(pointerId);if(![...held.values()].includes(code))emit('keyup',code);}
 }
 function releaseAll(){
  const ids=[...held.keys()];
  for(const id of ids)release(id);
  lookPointer=null;
 }
 const foot=doc.getElementById('footControls');
 for(const button of doc.querySelectorAll('[data-foot-key],[data-foot-action]')){
  const code=button.dataset.footKey,action=button.dataset.footAction;
  button.addEventListener('pointerdown',e=>{
   e.preventDefault();
   button.setPointerCapture?.(e.pointerId);
   if(code){const wasHeld=[...held.values()].includes(code);held.set(e.pointerId,code);if(!wasHeld)emit('keydown',code);}
   else if(action==='fire')fire();
   else if(action==='reload'){emit('keydown','KeyR');emit('keyup','KeyR');}
   else if(action==='vehicle')onVehicle();
  },{signal});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])
   button.addEventListener(name,e=>{release(e.pointerId);},{signal});
 }
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||lookPointer!==null)return;
  lookPointer=e.pointerId;lookX=e.clientX;lookY=e.clientY;
  canvas.setPointerCapture?.(e.pointerId);
 },{signal});
 canvas.addEventListener('pointermove',e=>{
  if(e.pointerId!==lookPointer)return;
  const next=look(camera.alpha,camera.beta,e.clientX-lookX,e.clientY-lookY,
   {lower:camera.lowerBetaLimit??.35,upper:camera.upperBetaLimit??2.7,sensitivity:.006});
  camera.alpha=next.alpha;camera.beta=next.beta;lookX=e.clientX;lookY=e.clientY;
 },{signal});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])
  canvas.addEventListener(name,e=>{if(e.pointerId===lookPointer)lookPointer=null;},{signal});
 doc.defaultView?.addEventListener('blur',releaseAll,{signal});
 function setMode(active,driving){
  if(foot)foot.hidden=!active||!!driving;
  // A separate enter/exit button is present while driving; do not overlap pads.
  const drive=doc.getElementById('driveControls');
  if(drive)drive.hidden=!active||!driving;
  if(!active)releaseAll();
 }
 return Object.freeze({setMode,releaseAll});
}
return Object.freeze({KEY_NAMES,look,create});
});
