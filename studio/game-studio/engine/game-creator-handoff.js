/* SD Game-Creator: safe, explicit scene handoff contract. Never edits a live scene. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SDGameCreatorHandoff=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const allowed=new Set(['terrain','building','road','vegetation','vehicle','character','enemy']);
  function prepare(blueprint,validate) {
    if(typeof validate!=='function'||!validate(blueprint))throw new TypeError('Invalid blueprint');
    if(!blueprint.world||!Number.isInteger(blueprint.world.width)||
       !Number.isInteger(blueprint.world.depth))throw new TypeError('Invalid world');
    const items=blueprint.objects.map(o=>{
      if(!allowed.has(o.type))throw new TypeError('Unsupported type');
      if(o.asset!==null||o.position!==null&&o.type!=='terrain')
        throw new TypeError('Handoff only supports unassigned placeholders');
      return Object.freeze({id:o.id,type:o.type,asset:null,
        position:o.type==='terrain'?[0,0,0]:null});
    });
    return Object.freeze({
      schema:'sd-scene-handoff/v1',
      mode:'dry-run',
      target:'new-scene-only',
      world:Object.freeze({width:blueprint.world.width,depth:blueprint.world.depth}),
      placeholders:Object.freeze(items),
      requiresReview:true,
      canApply:false
    });
  }
  return Object.freeze({prepare});
});
