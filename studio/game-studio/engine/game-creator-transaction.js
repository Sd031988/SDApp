/* SD Creator: isolated reversible scene proposal. No live editor access. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDGameCreatorTransaction=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function propose(current,preview,core){
   if(!core||typeof core.validate!=='function'||typeof core.serialize!=='function'||
      typeof core.parse!=='function'||typeof core.createHistory!=='function')
     throw new TypeError('Unsupported editor core');
   if(!preview||preview.schema!=='sd-editor-compat-preview/v1'||
      preview.mode!=='dry-run'||preview.canApply!==false)
     throw new TypeError('Only reviewed dry-run previews can be proposed');
   const before=core.serialize(core.validate(current));
   const after=core.serialize(core.validate(preview.scene));
   // Snapshots are private, not a pointer to a mutable editor scene.
   const history=core.createHistory(core.parse(before));
   const next=core.parse(after);
   history.record(next);
   let state='proposed';
   return Object.freeze({
     get state(){return state;},
     get before(){return core.parse(before);},
     get proposed(){return core.parse(after);},
     confirmNewScene(){
       if(state!=='proposed')throw new Error('Proposal already handled');
       state='confirmed';
       return core.parse(after);
     },
     undo(){
       if(state!=='confirmed')throw new Error('Nothing to undo');
       const previous=history.undo();
       if(!previous)throw new Error('No previous snapshot');
       state='undone';
       return core.parse(core.serialize(previous));
     },
     redo(){
       if(state!=='undone')throw new Error('Nothing to redo');
       const restored=history.redo();
       if(!restored)throw new Error('No next snapshot');
       state='confirmed';
       return core.parse(core.serialize(restored));
     },
     cancel(){
       if(state!=='proposed')throw new Error('Cannot cancel handled proposal');
       state='cancelled';
       return core.parse(before);
     }
   });
 }
 return Object.freeze({propose});
});
