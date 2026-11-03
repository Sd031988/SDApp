/* Opt-in v3 world data and visibility index. Not connected to the v1/v2 editor runtime.
 * Pure data: no network, storage, DOM, GPU allocations or automatic saves. */
(function(root,factory){
const api=factory(typeof module!=='undefined'&&module.exports?require('./scene-core.js'):root.SDGameCore,
typeof module!=='undefined'&&module.exports?require('./project-assets.js'):root.SDGameProject);
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDWorldCells=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Project){
'use strict';
if(!Core||!Project)throw Error('Game-Studio Szenenmodule fehlen.');
const VERSION=3,CELL_SIZE=40,MAX_CELLS=1024,MAX_OBJECTS=8192,MAX_COORD=1000000,MAX_CHARS=12000000;
const indexes=new WeakSet();
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const integer=v=>Number.isSafeInteger(v);
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
function fail(message){throw Error('Weltformat v3: '+message);}
function coordinate(value){if(!finite(value,-MAX_COORD,MAX_COORD))fail('Ungültige Weltkoordinate.');return Math.floor((value+CELL_SIZE/2)/CELL_SIZE);}
function cellId(cx,cz){if(!integer(cx)||!integer(cz)||Math.abs(cx)>25001||Math.abs(cz)>25001)fail('Ungültiger Zellindex.');return 'cell:'+cx+':'+cz;}
function cellAt(x,z){return {cx:coordinate(x),cz:coordinate(z)};}
function cleanNode(node,cx,cz,assetIds){
if(!record(node)||!integer(node.id)||node.id<1||node.id>10000000||
node.parentId!==null||!finite(node.x,-MAX_COORD,MAX_COORD)||!finite(node.z,-MAX_COORD,MAX_COORD)||
!finite(node.scale,.4,3)||!Core.PALETTE.includes(node.color))fail('Ungültiger Szenenknoten.');
const position=cellAt(node.x,node.z);
if(position.cx!==cx||position.cz!==cz)fail('Objekt liegt in der falschen Zelle.');
const model=node.type==='model';
if(!model&&!Core.KINDS.includes(node.type))fail('Unbekannter Objekttyp.');
const allowed=model?['id','parentId','type','x','z','scale','color','assetId','rotationY']:
['id','parentId','type','x','z','scale','color'];
if(Object.keys(node).some(k=>!allowed.includes(k)))fail('Unerlaubtes Objektfeld.');
if(model&&(!assetIds.has(node.assetId)||!finite(node.rotationY??0,-Math.PI,Math.PI)))
fail('Ungültige Modellreferenz oder Rotation.');
const result={id:node.id,parentId:null,type:node.type,x:node.x,z:node.z,scale:node.scale,color:node.color};
if(model){result.assetId=node.assetId;result.rotationY=node.rotationY??0;}
return result;
}
function validateWorld(input){
if(!record(input)||input.version!==VERSION||![1,2].includes(input.sourceVersion)||
input.cellSize!==CELL_SIZE||!record(input.origin)||input.origin.x!==0||input.origin.z!==0||
!Array.isArray(input.cells)||input.cells.length>MAX_CELLS||!Array.isArray(input.assets)||
typeof input.name!=='string'||!input.name.trim()||input.name.length>80)fail('Ungültiger Weltkopf.');
const defaults=Core.fresh();
const header=Core.validate({...defaults,name:input.name,ground:input.ground,lighting:input.lighting,avatar:input.avatar});
if(input.sourceVersion===1&&input.assets.length)fail('v1-Welt darf keine Modellassets besitzen.');
const assetProject=Project.parse(Project.serialize({...defaults,version:2,objects:[],assets:input.assets}));
const assets=assetProject.assets,assetIds=new Set(assets.map(a=>a.id));
const cells=[],ids=new Set(),objectIds=new Set();
let count=0;
for(const cell of input.cells){
if(!record(cell)||!integer(cell.cx)||!integer(cell.cz)||cell.id!==cellId(cell.cx,cell.cz)||
ids.has(cell.id)||!Array.isArray(cell.objects))fail('Ungültige oder doppelte Zelle.');
ids.add(cell.id);
const terrain=cell.terrain===null?null:Core.validate({...defaults,terrain:cell.terrain}).terrain;
const objects=[];
for(const node of cell.objects){
const cleaned=cleanNode(node,cell.cx,cell.cz,assetIds);
if(objectIds.has(cleaned.id))fail('Doppelte globale Objekt-ID.');
objectIds.add(cleaned.id);
objects.push(cleaned);
if(++count>MAX_OBJECTS)fail('Objektbudget überschritten.');
}
cells.push({id:cell.id,cx:cell.cx,cz:cell.cz,terrain,objects});
}
cells.sort((a,b)=>a.cx-b.cx||a.cz-b.cz);
return {version:VERSION,sourceVersion:input.sourceVersion,name:header.name,
ground:header.ground,lighting:header.lighting,avatar:header.avatar,
cellSize:CELL_SIZE,origin:{x:0,z:0},assets,cells};
}
function migrateLegacy(input){
if(!record(input)||![1,2].includes(input.version))fail('Nur v1/v2 kann migriert werden.');
const old=input.version===1?Core.validate(input):Project.parse(Project.serialize(input));
const objects=old.objects.map(o=>({...o,parentId:null}));
return validateWorld({version:VERSION,sourceVersion:old.version,name:old.name,ground:old.ground,
lighting:old.lighting,avatar:old.avatar,cellSize:CELL_SIZE,origin:{x:0,z:0},
assets:old.version===2?old.assets:[],cells:[{id:cellId(0,0),cx:0,cz:0,terrain:old.terrain,objects}]});
}
function toLegacy(input){
const world=validateWorld(input);
if(world.cells.length!==1||world.cells[0].id!==cellId(0,0)||!world.cells[0].terrain||
world.cells[0].objects.length>Core.LIMIT)fail('Diese Welt passt nicht verlustfrei in das alte Szenenformat.');
const objects=world.cells[0].objects.map(({parentId,...obj})=>obj);
if(objects.some(o=>!finite(o.x,-Core.WORLD,Core.WORLD)||!finite(o.z,-Core.WORLD,Core.WORLD))||
(world.sourceVersion===1&&objects.some(o=>o.type==='model')))
fail('Diese Welt kann nicht als v1/v2 exportiert werden.');
const base={version:world.sourceVersion,name:world.name,ground:world.ground,
lighting:world.lighting,avatar:world.avatar,terrain:world.cells[0].terrain,objects};
if(world.sourceVersion===1)return Core.validate(base);
return Project.parse(Project.serialize({...base,assets:world.assets}));
}
function serializeWorld(input){
const value=JSON.stringify(validateWorld(input),null,2)+'\n';
if(value.length>MAX_CHARS)fail('Projektdatei zu groß.');
return value;
}
function parseWorld(text){
if(typeof text!=='string'||text.length>MAX_CHARS)fail('Projektdatei zu groß.');
let input;try{input=JSON.parse(text);}catch(_){fail('Ungültiges JSON.');}
return validateWorld(input);
}
function indexWorld(input){
const world=validateWorld(input);
const entries=world.cells.map(c=>Object.freeze({id:c.id,cx:c.cx,cz:c.cz,objectCount:c.objects.length}));
const index=Object.freeze({cellSize:CELL_SIZE,entries:Object.freeze(entries)});
indexes.add(index);return index;
}
function selectVisibleCells(index,x,z,radius=1){
if(!indexes.has(index)||!integer(radius)||radius<0||radius>32)fail('Ungültiger Sichtbarkeitsindex oder Radius.');
const {cx,cz}=cellAt(x,z);
return index.entries.filter(c=>Math.abs(c.cx-cx)<=radius&&Math.abs(c.cz-cz)<=radius)
.sort((a,b)=>Math.max(Math.abs(a.cx-cx),Math.abs(a.cz-cz))-
Math.max(Math.abs(b.cx-cx),Math.abs(b.cz-cz))||a.id.localeCompare(b.id));
}
return Object.freeze({VERSION,CELL_SIZE,MAX_CELLS,MAX_OBJECTS,cellId,cellAt,
validateWorld,migrateLegacy,toLegacy,serializeWorld,parseWorld,indexWorld,selectVisibleCells});
});