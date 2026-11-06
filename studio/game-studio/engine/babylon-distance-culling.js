/* Opt-in Babylon mesh distance culling. Only explicitly registered meshes.
 * No scene traversal, no automatic wiring, no world-state mutation until update().
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDGameDistanceCulling=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function create({near=100,far=120}={}){
   if(!Number.isFinite(near)||near<0||!Number.isFinite(far)||far<=near)
     throw new RangeError('Require 0 <= near < far');
   const entries=new Map();
   function register(mesh){
     if(!mesh||typeof mesh.setEnabled!=='function'||typeof mesh.isEnabled!=='function'||
        typeof mesh.getAbsolutePosition!=='function')throw new TypeError('Babylon mesh adapter required');
     if(entries.has(mesh))return false;
     const enabled=mesh.isEnabled();
     if(typeof enabled!=='boolean')throw new TypeError('isEnabled must return boolean');
     // Never turn on meshes which were disabled by another system.
     entries.set(mesh,{original:enabled,hiddenByUs:false});
     return true;
   }
   function update(cameraPosition){
     if(!cameraPosition||!['x','y','z'].every(k=>Number.isFinite(cameraPosition[k])))
       throw new TypeError('Finite camera coordinates required');
     let culled=0,visible=0,untouched=0;
     for(const [mesh,entry] of entries){
       if(!entry.original){untouched++;continue;}
       const p=mesh.getAbsolutePosition();
       if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k])))
         throw new TypeError('Finite mesh coordinates required');
       const d2=(p.x-cameraPosition.x)**2+(p.y-cameraPosition.y)**2+(p.z-cameraPosition.z)**2;
       if(!Number.isFinite(d2))throw new RangeError('Distance overflow');
       if(!entry.hiddenByUs&&d2>far*far){
         if(mesh.isEnabled()){mesh.setEnabled(false);entry.hiddenByUs=true;culled++;}
         else untouched++;
       }else if(entry.hiddenByUs&&d2<near*near){
         // Caller exclusively owns registered meshes during active culling.
         mesh.setEnabled(true);entry.hiddenByUs=false;visible++;
       }else untouched++;
     }
     return Object.freeze({culled,visible,untouched,registered:entries.size});
   }
   function unregister(mesh){
     const entry=entries.get(mesh);
     if(!entry)return false;
     if(entry.hiddenByUs)mesh.setEnabled(entry.original);
     entries.delete(mesh);
     return true;
   }
   function dispose(){for(const mesh of Array.from(entries.keys()))unregister(mesh);}
   return Object.freeze({register,update,unregister,dispose,get size(){return entries.size;}});
 }
 return Object.freeze({create});
});
