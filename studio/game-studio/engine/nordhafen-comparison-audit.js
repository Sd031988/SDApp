/* Independent, opt-in audit of completed Nordhafen benchmark comparisons.
 * Never infer GPU, draw-call or heap measurements from missing data. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenComparisonAudit=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MODES=Object.freeze(['Ohne Streaming','Streaming','Streaming + LOD','Streaming + LOD + Thin Instances','Streaming + LOD + Thin Instances + PBR']);
 const METRICS=Object.freeze(['drawCallsP50','drawCallsP95','drawCallsMax','heapP50','heapMax']);
 function audit(runs){
  if(!Array.isArray(runs)||runs.length!==MODES.length)throw new TypeError('five benchmark runs required');
  const failures=[];
  const modes=new Set();
  let profile=null,route=null;
  const output={};
  for(const run of runs){
   if(!run||!MODES.includes(run.mode)||modes.has(run.mode)){
    failures.push('duplicate or unknown mode');continue;
   }
   modes.add(run.mode);
   if(typeof run.profile!=='string'||!run.profile||typeof run.routeId!=='string'||!run.routeId)
    failures.push(run.mode+': missing profile or route');
   if(profile===null)profile=run.profile;
   else if(run.profile!==profile)failures.push(run.mode+': profile mismatch');
   if(route===null)route=run.routeId;
   else if(run.routeId!==route)failures.push(run.mode+': route mismatch');
   const result=run.summary;
   if(!result||result.complete!==true||!Number.isInteger(result.samples)||result.samples<1){
    failures.push(run.mode+': incomplete or empty');continue;
   }
   const values={};
   for(const key of METRICS){
    const value=result[key];
    if(value===null)values[key]=null;
    else if(typeof value==='number'&&Number.isFinite(value)&&value>=0)values[key]=value;
    else failures.push(run.mode+': invalid '+key);
   }
   if(values.drawCallsP50!==null&&values.drawCallsP95!==null&&values.drawCallsP50>values.drawCallsP95)
    failures.push(run.mode+': draw percentile order');
   if(values.drawCallsP95!==null&&values.drawCallsMax!==null&&values.drawCallsP95>values.drawCallsMax)
    failures.push(run.mode+': draw max order');
   if(values.heapP50!==null&&values.heapMax!==null&&values.heapP50>values.heapMax)
    failures.push(run.mode+': heap max order');
   output[run.mode]=Object.freeze(values);
  }
  for(const mode of MODES)if(!modes.has(mode))failures.push(mode+': missing run');
  return Object.freeze({comparable:failures.length===0,failures:Object.freeze(failures),values:
   failures.length===0?Object.freeze(output):null});
 }
 return Object.freeze({audit,MODES,METRICS});
});
