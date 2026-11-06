/* SD Engine: objective performance-budget evaluation, not a renderer. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDGameQualityGates=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const presets=Object.freeze({
   desktop60:Object.freeze({fpsMin:60,frameP95MsMax:20,drawCallsMax:1500,memoryMbMax:4096,loadSecondsMax:15}),
   desktop120:Object.freeze({fpsMin:120,frameP95MsMax:10,drawCallsMax:1200,memoryMbMax:6144,loadSecondsMax:12})
 });
 function evaluate(metrics,preset='desktop60'){
   const budget=presets[preset];
   if(!budget)throw new RangeError('Unknown performance preset');
   if(!metrics||typeof metrics!=='object'||Array.isArray(metrics))
     throw new TypeError('Metrics object required');
   const checks=[
     ['fps','min',budget.fpsMin],
     ['frameP95Ms','max',budget.frameP95MsMax],
     ['drawCalls','max',budget.drawCallsMax],
     ['memoryMb','max',budget.memoryMbMax],
     ['loadSeconds','max',budget.loadSecondsMax]
   ].map(([name,mode,limit])=>{
     const value=metrics[name];
     if(typeof value!=='number'||!Number.isFinite(value)||value<0)
       throw new TypeError('Invalid metric: '+name);
     return Object.freeze({name,value,limit,pass:mode==='min'?value>=limit:value<=limit});
   });
   return Object.freeze({schema:'sd-game-quality-gates/v1',preset,pass:checks.every(c=>c.pass),checks:Object.freeze(checks)});
 }
 return Object.freeze({presets,evaluate});
});
