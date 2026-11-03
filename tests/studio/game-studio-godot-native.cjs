'use strict';
/* Native Godot 4 import/runtime test for legacy v1 and GLB-enhanced v2 projects. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const Core=require('../../studio/game-studio/scene-core.js');
const Project=require('../../studio/game-studio/project-assets.js');
const Exporter=require('../../studio/game-studio/godot-export-core.js');
const {makeGLB}=require('./glb-fixture.cjs');
const godot=process.env.GODOT_BIN;
if(!godot){console.error('GODOT_BIN fehlt: native Prüfung nicht ausgeführt.');process.exit(2);}
function check(scene,label){
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'sd-godot-export-'));
  try{
    const zip=Buffer.from(Exporter.build(scene).bytes);
    let at=0,files=0;
    while(at+30<=zip.length&&zip.readUInt32LE(at)===0x04034b50){
      const namelen=zip.readUInt16LE(at+26),extralen=zip.readUInt16LE(at+28),length=zip.readUInt32LE(at+18);
      const filename=zip.subarray(at+30,at+30+namelen).toString('utf8');
      assert(/^[a-z0-9_./-]+$/i.test(filename)&&!filename.includes('..'));
      const start=at+30+namelen+extralen,end=start+length;
      assert(end<=zip.length);
      const target=path.join(directory,filename);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,zip.subarray(start,end));
      at=end;files++;
    }
    assert(files>=6);
    function run(args,step){
      const result=spawnSync(godot,args,{cwd:directory,timeout:120000,encoding:'utf8'});
      const output=(result.stdout||'')+'\n'+(result.stderr||'');
      console.log(label+' '+step+': '+output.slice(-5500));
      if(result.error)throw result.error;
      assert.equal(result.status,0,label+' '+step+' returned nonzero');
      assert.doesNotMatch(output,/SCRIPT ERROR|Parse Error|Invalid get index|Invalid call/i,label+' reported GDScript errors');
    }
    run(['--headless','--path',directory,'--editor','--import'],'project import');
    run(['--headless','--path',directory,'--quit-after','10'],'runtime');
    console.log('Godot '+label+': project imported and started without script parser errors.');
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
}
check(Core.fresh(),'v1');
const withModel=Core.fresh();
Project.addModel(withModel,makeGLB(),'Imported Sample',2,2);
check(withModel,'v2 GLB');
