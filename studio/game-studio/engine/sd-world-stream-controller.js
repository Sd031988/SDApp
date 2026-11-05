/* SD Engine: opt-in coordinator joining residency planning and async cell lifecycles.
 * No Babylon scene mutation: caller owns load/dispose and rendering integration. */
(function(root,factory){'use strict';const api=factory(
 typeof module==='object'&&module.exports?require('./sd-world-stream-plan.js'):root.SDWorldStreamPlan,
 typeof module==='object'&&module.exports?require('./sd-world-stream-runtime.js'):root.SDWorldStreamRuntime
);if(typeof module==='object'&&module.exports)module.exports=api;else root.SDWorldStreamController=api;})(typeof globalThis!=='undefined'?globalThis:this,function(planner,runtimeApi){
'use strict';
function create(options){
 if(!options||typeof options!=='object'||!planner||!runtimeApi)throw new TypeError('options/dependencies');
 const {load,dispose,onError,maxConcurrent,...world}=options;
 const runtime=runtimeApi.create({load,dispose,onError,maxConcurrent});
 let closed=false,chain=Promise.resolve();
 // Serialize the entire plan->load cycle so each plan uses the actual resident set.
 function move(playerX,playerZ){
  if(closed)return Promise.reject(new Error('controller closed'));
  const job=chain.then(async()=>{
   if(closed)throw new Error('controller closed');
   const before=runtime.snapshot();
   const plan=planner.plan({...world,playerX,playerZ,loaded:before.loaded});
   const after=await runtime.reconcile(plan);
   return Object.freeze({center:plan.center,desired:plan.desired,loaded:after.loaded,pending:after.pending});
  });
  chain=job.catch(()=>{});
  return job;
 }
 let shutdown;
 function close(){
  if(shutdown)return shutdown;
  closed=true;
  // Runtime aborts in-flight loads immediately; queued moves reject.
  shutdown=runtime.close();return shutdown;
 }
 return Object.freeze({move,snapshot:runtime.snapshot,close});
}
return Object.freeze({create});
});
