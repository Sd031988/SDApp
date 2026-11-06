/* Cooperative per-frame work scheduler for isolated Nordhafen cell builds. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenBuildSlices=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 async function run(items,build,{now=()=>performance.now(),nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve)),
  budgetMs=4,signal,recordSlice=()=>{}}={}){
  if(!Array.isArray(items)||typeof build!=='function'||!Number.isFinite(budgetMs)||budgetMs<=0)
   throw new TypeError('items, build, positive budget required');
  let index=0;
  while(index<items.length){
   if(signal?.aborted)throw new Error('cell build aborted');
   const started=now();
   do{
    if(signal?.aborted)throw new Error('cell build aborted');
    build(items[index],index);
    index++;
    // A single synchronous build() must itself fit budget; JS cannot preempt it.
   }while(index<items.length&&now()-started<budgetMs);
   const elapsed=now()-started;
   recordSlice(elapsed);
   if(index<items.length)await nextFrame();
  }
 }
 return Object.freeze({run});
});
