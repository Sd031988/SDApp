/* Ops D: pure pause, terminal and restart state machine. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsLifecycle=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function initial(){return {paused:false,ended:false,health:100,elapsed:0,hits:0,defeated:0};}
 function transition(state,event){switch(event.type){
  case 'pause':return state.ended?state:{...state,paused:true};
  case 'resume':return {...state,paused:false};
  case 'tick':return state.paused||state.ended?state:{...state,elapsed:state.elapsed+Math.max(0,event.dt||0)};
  case 'finish':return {...state,paused:false,ended:true};
  case 'restart':return initial();
  default:return state;
 }}
 function cleanupCount(before,after){return after-before;}
 return Object.freeze({initial,transition,cleanupCount});
});