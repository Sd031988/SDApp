/* SD Engine multiplayer: opt-in inbound snapshot validation. No network calls. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.SDNetGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_PLAYERS=8, MAX_ID=64;
  function finite(n,min,max){return typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;}
  function validId(id){return typeof id==='string'&&id.length>=1&&id.length<=MAX_ID&&/^[a-zA-Z0-9_-]+$/.test(id)&&id!=='__proto__'&&id!=='constructor'&&id!=='prototype';}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function record(o){return o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)===Object.prototype;}
  function validateSnapshot(input,options){
    if(!record(input)) throw new TypeError('snapshot must be a plain object');
    const opts=options===undefined?{}:options;
    if(!record(opts)) throw new TypeError('options must be a plain object');
    const maxPlayers=own(opts,'maxPlayers')?opts.maxPlayers:MAX_PLAYERS;
    const worldHalfSize=own(opts,'worldHalfSize')?opts.worldHalfSize:320;
    if(!Number.isInteger(maxPlayers)||maxPlayers<1||maxPlayers>MAX_PLAYERS) throw new RangeError('invalid player budget');
    if(!finite(worldHalfSize,1,100000)) throw new RangeError('invalid world bounds');
    if(!Array.isArray(input.players)||input.players.length>maxPlayers) throw new RangeError('invalid players');
    if(own(input,'tick')&&(!Number.isSafeInteger(input.tick)||input.tick<0)) throw new RangeError('invalid tick');
    const ids=new Set();
    const players=input.players.map((p)=>{
      if(!record(p)||!validId(p.id)||ids.has(p.id)) throw new TypeError('invalid or duplicate player id');
      ids.add(p.id);
      if(!Array.isArray(p.p)||p.p.length!==3||!finite(p.p[0],-worldHalfSize,worldHalfSize)||!finite(p.p[2],-worldHalfSize,worldHalfSize)||!finite(p.p[1],-1000,10000)) throw new RangeError('invalid position');
      if(!finite(p.g,-Math.PI*2,Math.PI*2)) throw new RangeError('invalid yaw');
      if(!finite(p.l,0,100)) throw new RangeError('invalid health');
      return Object.freeze({id:p.id,p:Object.freeze(p.p.slice()),g:p.g,l:p.l});
    });
    return Object.freeze({tick:own(input,'tick')?input.tick:null,players:Object.freeze(players)});
  }
  function acceptNewer(snapshot,lastTick){
    if(!Number.isSafeInteger(lastTick)||lastTick< -1) throw new RangeError('invalid last tick');
    if(!record(snapshot)||!Number.isSafeInteger(snapshot.tick)) throw new TypeError('invalid snapshot');
    return snapshot.tick>lastTick;
  }
  return Object.freeze({validateSnapshot,acceptNewer});
});
