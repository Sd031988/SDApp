/* Nordhafen reproducible synthetic benchmark fixture.
 * This generates workload descriptors, NOT a rendered world or measured FPS.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenBenchmark=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const presets=Object.freeze({
  small:Object.freeze({grid:4,buildingsPerChunk:4,treesPerChunk:12}),
  medium:Object.freeze({grid:8,buildingsPerChunk:8,treesPerChunk:24}),
  large:Object.freeze({grid:16,buildingsPerChunk:12,treesPerChunk:48})
 });
 function create(level='small',seed=1337){
   const p=presets[level];
   if(!p)throw new RangeError('Unknown Nordhafen level');
   if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)
     throw new TypeError('Seed must be a 32-bit unsigned integer');
   let s=seed>>>0;
   function next(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;}
   const chunks=[];
   for(let z=0;z<p.grid;z++)for(let x=0;x<p.grid;x++){
     const objects=[];
     for(const [type,count] of [['building',p.buildingsPerChunk],['vegetation',p.treesPerChunk]]){
       for(let i=0;i<count;i++){
         const localX=Number((next()*64).toFixed(3));
         const localZ=Number((next()*64).toFixed(3));
         objects.push(Object.freeze({id:type+'-'+x+'-'+z+'-'+i,type,x:localX,z:localZ}));
       }
     }
     chunks.push(Object.freeze({id:'chunk-'+x+'-'+z,x,z,objects:Object.freeze(objects)}));
   }
   return Object.freeze({
     schema:'sd-nordhafen-benchmark-fixture/v1',level,seed,
     chunkSize:64,grid:p.grid,chunks:Object.freeze(chunks),
     objectCount:chunks.reduce((n,c)=>n+c.objects.length,0),
     synthetic:true,measured:false
   });
 }
 return Object.freeze({presets,create});
});
