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
   let previousCost=0;
   do{
    if(signal?.aborted)throw new Error('cell build aborted');
    const before=now();
    build(items[index],index);
    index++;
    previousCost=Math.max(0,now()-before);
    // Avoid predictable overshoot; individual synchronous calls cannot be preempted.
   }while(index<items.length&&now()-started+previousCost<budgetMs-1e-6);
   const elapsed=now()-started;
   recordSlice(elapsed);
   if(index<items.length)await nextFrame();
  }
 }
 return Object.freeze({run});
});
