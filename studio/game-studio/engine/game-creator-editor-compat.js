/* Opt-in read-only compatibility adapter for the existing SDGameCore v1 editor.
 * Produces a NEW validated preview scene, never imports or saves anything.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDGameCreatorEditorCompat=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const map=Object.freeze({building:'box',vegetation:'tree',road:'column'});
 function preview(handoff,core){
   if(!handoff||handoff.schema!=='sd-scene-handoff/v1'||
      handoff.mode!=='dry-run'||handoff.target!=='new-scene-only'||
      handoff.canApply!==false||handoff.requiresReview!==true||
      !Array.isArray(handoff.placeholders))
     throw new TypeError('Unreviewed or unsupported handoff');
   if(!core||core.VERSION!==1||typeof core.fresh!=='function'||
      typeof core.add!=='function'||typeof core.validate!=='function')
     throw new TypeError('Unsupported scene editor version');
   // Existing editor supports only primitives and 70 objects; don't pretend
   // that vehicles, enemies, imported GLBs or roads are functional.
   const scene=core.fresh();
   scene.name='Game-Creator Vorschau';
   scene.objects=[];
   const skipped={};
   let count=0;
   for(const p of handoff.placeholders){
     if(!p||typeof p.id!=='string'||p.asset!==null||p.position!==null&&p.type!=='terrain')
       throw new TypeError('Invalid placeholder');
     const kind=map[p.type];
     if(!kind){skipped[p.type]=(skipped[p.type]||0)+1;continue;}
     if(count>=Math.min(core.LIMIT,60)){skipped.capacity=(skipped.capacity||0)+1;continue;}
     // All coordinates remain inside the editor's small +-19m world.
     const x=-15+(count%10)*3, z=-15+Math.floor(count/10)*5;
     core.add(scene,kind,x,z);count++;
   }
   const validated=core.validate(scene);
   return {
     schema:'sd-editor-compat-preview/v1',
     mode:'dry-run',
     canApply:false,
     scene:validated,
     placed:count,
     skipped,
     warnings:['Primitive preview only: not a playable 3D asset import.',
       'Never overwrite an existing scene. Review and import manually in a separate future workflow.']
   };
 }
 return Object.freeze({preview});
});
