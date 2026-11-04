/* SD Game-Studio: opt-in versioned World-v3 cell deltas. No storage writes. */
(function(root,factory){
const api=factory(typeof module==='object'&&module.exports?require('./large-world-core.js'):root.SDLargeWorld);
if(typeof module==='object'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldCellDeltas=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core){
'use strict';
const VERSION=1,MAX_BYTES=250000,MAX_CHANGES=64;
function fail(){throw Error('Invalid World-v3 cell delta.');}
function clean(o,fields){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>fields.includes(k));}
function snapshot(c){return c===null?null:{cx:c.cx,cz:c.cz,ground:c.ground,objects:c.objects.map(o=>({...o}))};}
function validate(p){
if(!core||!clean(p,['deltaVersion','worldVersion','changes'])||p.deltaVersion!==VERSION||p.worldVersion!==3||!Array.isArray(p.changes)||p.changes.length>MAX_CHANGES)fail();
const seen=new Set(),changes=[];
for(const c of p.changes){
if(!clean(c,['cx','cz','before','after'])||!Number.isSafeInteger(c.cx)||!Number.isSafeInteger(c.cz)||c.cx<0||c.cz<0||c.cx>=core.GRID||c.cz>=core.GRID)fail();
const id=c.cx+':'+c.cz;if(seen.has(id))fail();seen.add(id);
for(const field of ['before','after'])if(c[field]!==null&&(!clean(c[field],['cx','cz','ground','objects'])||c[field].cx!==c.cx||c[field].cz!==c.cz||!Array.isArray(c[field].objects)))fail();
changes.push({cx:c.cx,cz:c.cz,before:snapshot(c.before),after:snapshot(c.after)});
}
return {deltaVersion:VERSION,worldVersion:3,changes};
}
function encode(p){const out=JSON.stringify(validate(p));if(out.length>MAX_BYTES)fail();return out;}
function decode(text){if(typeof text!=='string'||text.length>MAX_BYTES)fail();let p;try{p=JSON.parse(text);}catch(_){fail();}return validate(p);}
function diff(before,after){
const a=core.validate(before),b=core.validate(after);
for(const field of ['name','size','cellSize','seed','spawn'])if(JSON.stringify(a[field])!==JSON.stringify(b[field]))fail();
const ma=new Map(a.cells.map(c=>[c.cx+':'+c.cz,c])),mb=new Map(b.cells.map(c=>[c.cx+':'+c.cz,c])),changes=[];
for(const id of new Set([...ma.keys(),...mb.keys()])){
const old=ma.get(id)||null,next=mb.get(id)||null;
if(JSON.stringify(old)!==JSON.stringify(next)){const c=next||old;changes.push({cx:c.cx,cz:c.cz,before:old,after:next});}
}
changes.sort((a,b)=>a.cz-b.cz||a.cx-b.cx);
return decode(encode({deltaVersion:VERSION,worldVersion:3,changes}));
}
function apply(world,patch){
const source=core.validate(world),p=decode(encode(patch));
const map=new Map(source.cells.map(c=>[c.cx+':'+c.cz,c]));
for(const c of p.changes){
const id=c.cx+':'+c.cz,old=map.get(id)||null;
if(JSON.stringify(old)!==JSON.stringify(c.before))fail();
if(c.after===null)map.delete(id);else map.set(id,snapshot(c.after));
}
return core.validate({...source,cells:[...map.values()].sort((a,b)=>a.cz-b.cz||a.cx-b.cx)});
}
return Object.freeze({VERSION,MAX_BYTES,MAX_CHANGES,diff,apply,encode,decode});
});