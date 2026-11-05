'use strict';
// Isolierte Regressionstests für die neue SD-Nordhafen-Szene.
// GPU/Browser/Physik werden bewusst nicht behauptet oder simuliert.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sceneCode = fs.readFileSync(path.join(__dirname,'spiele','nordhafen.js'),'utf8');
const template = JSON.parse(fs.readFileSync(path.join(__dirname,'szenen','nordhafen.json'),'utf8'));

function fakeBab() {
  const vector = () => ({ x:0, y:0, z:0, set(x,y,z) {this.x=x;this.y=y;this.z=z;} });
  const mesh = () => ({
    position:vector(), rotation:vector(), scaling:vector(), material:null,
    createInstance() { return mesh(); }, dispose() {},
    getChildMeshes() { return []; }
  });
  class Texture {
    constructor(url) {this.url=url; this.uScale=1;this.vScale=1;this.level=1;}
    dispose() {}
  }
  Texture.TRILINEAR_SAMPLINGMODE = 3;
  return {
    MeshBuilder: {
      CreateGround:mesh, CreateBox:mesh, CreateCylinder:mesh, CreateSphere:mesh
    },
    TransformNode:class { constructor() {this.position=vector();this.rotation=vector();} },
    PointLight:class {constructor() {this.position=vector();}},
    Vector3:class {constructor(x,y,z) {this.x=x;this.y=y;this.z=z;}},
    PBRMaterial:class {constructor() {this.albedoColor=null;this.emissiveIntensity=1;}},
    Color3:{FromHexString(x) {return x;}},
    Texture
  };
}
async function build(device, savedAssets=[]) {
  const calls=[], missions=[], anim=[], bab=fakeBab(), bots=[];
  const sd=new Proxy({
    BABYLON:bab, szene:{}, engine:{getRenderWidth:()=>device==='mobile'?600:1400},
    zufall:(seed)=>{let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};},
    hoehe:()=>4,
    eigeneDateien:()=>savedAssets,
    jedenFrame:fn=>anim.push(fn),
    mission:spec=>missions.push(spec),
    gegner:spec=>{let b={tot:false,name:spec.name};bots.push(b);calls.push({name:'gegner',args:[spec]});return b;},
    box:()=>({position:{set(){}},rotation:{},createInstance(){return this;}}),
    zylinder:()=>({position:{set(){}},rotation:{},createInstance(){return this;}}),
    teileModell:()=>({wurzel:{}}),
    modell:async(...args)=>{calls.push({name:'modell',args});return {wurzel:{}};}
  },{
    get(target,key) {
      if(key in target)return target[key];
      return (...args)=>{calls.push({name:key,args});return {};};
    }
  });
  const ctx={sd,window:{SDBauplanPakete:require('./sd-bauplan-pakete.js')},
    matchMedia:()=>({matches:device==='mobile'}),console:{warn(){},log(){}},Math};
  await vm.runInNewContext('(async function(){\n'+sceneCode+'\n})()',ctx,{filename:'nordhafen.js',timeout:1500});
  return {calls,missions,anim,bots};
}

test('Editor-Grundkarte besteht den echten SD-Szenenvalidator',()=>{
  const ctx={window:{},SDEngine:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'sd-szene.js'),'utf8'),ctx);
  const clean=ctx.window.SDSzene.pruefen(template);
  assert.equal(clean.name,'nordhafen');
  assert.equal(clean.welt.groesse,820);
  assert.equal(clean.objekte.length,template.objekte.length);
  assert.equal(clean.objekte.filter(x=>x.art==='spieler').length,1);
  assert.ok(clean.objekte.some(x=>x.art==='haus'));
  assert.ok(clean.objekte.some(x=>x.art==='ziel'));
  assert.ok(clean.objekte.some(x=>x.art==='auto'));
});
for(const device of ['desktop','mobile']){
  test('Nordhafen '+device+': Skriptaufrufe erzeugen Spielwelt, Missionskette und 10 Gegner',async()=>{
    const game=await build(device);
    assert.equal(game.missions.length,4);
    assert.equal(game.bots.length,10);
    assert.ok(game.anim.length===1);
    assert.ok(game.calls.some(x=>x.name==='gelaende'));
    assert.ok(game.calls.some(x=>x.name==='auto'));
    assert.ok(game.calls.some(x=>x.name==='motorrad'));
    assert.ok(game.calls.some(x=>x.name==='spieler'));
    assert.ok(game.calls.some(x=>x.name==='kiste'));
    assert.equal(game.calls.some(x=>x.name==='gras'),device==='desktop');
    assert.ok(game.missions.every(x=>x.schritte.length>0));
    assert.equal(game.missions[0].schritte.at(-1).erzeugen().length,4);
    assert.equal(game.missions[1].schritte.at(-1).erzeugen().length,3);
    assert.equal(game.missions[2].schritte[1].erzeugen().length,3);
    const todo=game.missions[3];
    assert.equal(todo.schritte[0].art,'fahre');
    todo.beiErfolg();
    assert.ok(game.calls.some(x=>x.name==='sieg'));
    game.anim[0](.016,155);
    game.anim[0](.016,280);
    assert.ok(game.calls.some(x=>x.name==='wetter'));
  });
}
test('Optionales eigenes GLB wird nur auf ausdrücklichen Dateinamen hin geladen',async()=>{
 const testFall=await build('desktop',[{typ:'modell',name:'nordhafen-funkanlage.glb'}]);
 assert.equal(testFall.calls.filter(c=>c.name==='modell').length,1);
 assert.equal(testFall.calls.find(c=>c.name==='modell').args[0],'nordhafen-funkanlage.glb');
});
test('Spielskript bleibt ohne beliebige Netzwerkcode-Ausführung',()=>{
  assert.doesNotMatch(sceneCode,/\beval\s*\(/);
  assert.doesNotMatch(sceneCode,/innerHTML\s*=/);
  assert.match(sceneCode,/polyhaven\.org/);
});
