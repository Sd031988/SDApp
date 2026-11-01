#!/usr/bin/env node
/* SD Lotze native PC release assistant: never commit ADMIN_CODE or unencrypted files.
   Step 1 prepares a new ZIP in a private directory; step 2 is a reviewed release.
   No network requests, no silent updates and no modification of installed chats. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),AGENT=path.join(ROOT,'agent');
const EXT=new Set(['.html','.js','.css','.json','.webmanifest','.svg']);
function fail(message){throw new Error(message)}
function inside(repo,file){const rel=path.relative(repo,file);return rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel))}
function validDir(dir){
 const folder=path.resolve(dir);
 if(inside(ROOT,folder))fail('Ausgabeverzeichnis muss außerhalb des GitHub-Repositories liegen.');
 return folder;
}
function digest(buffer){return crypto.createHash('sha256').update(buffer).digest('hex')}
function fileDigest(file){return digest(fs.readFileSync(file))}
function studioDigest(){
 const dir=path.join(ROOT,'studio');
 const names=fs.readdirSync(dir).filter(n=>{
  const file=path.join(dir,n);return fs.statSync(file).isFile()&&EXT.has(path.extname(n))&&!n.startsWith('.');
 }).sort();
 const h=crypto.createHash('sha256');
 for(const name of names){h.update(name);h.update('\0');h.update(fs.readFileSync(path.join(dir,name)));h.update('\0')}
 return h.digest('hex');
}
function version(){
 const data=JSON.parse(fs.readFileSync(path.join(AGENT,'zugang.json'),'utf8'));
 if(!/^\d{14}$/.test(data.ver))fail('Ungültige Release-Version.');
 return data.ver;
}
function run(command,args,env){
 const result=cp.spawnSync(command,args,{cwd:ROOT,env:env||process.env,stdio:'inherit',shell:false});
 if(result.error)fail(command+' konnte nicht gestartet werden: '+result.error.message);
 if(result.status!==0)fail(command+' fehlgeschlagen (Exit '+result.status+'). Keine Veröffentlichung.');
}
function python(){
 if(process.env.SD_PYTHON)return [process.env.SD_PYTHON,[]];
 return process.platform==='win32'?['py',['-3']]:['python3',[]];
}
function requireAdmin(){
 const z=require('../agent/zugang-krypto.js');
 const normalized=z.normalisiere(process.env.ADMIN_CODE||'');
 if(!normalized||normalized.id!=='ADMN')fail('ADMIN_CODE nicht gesetzt oder falsch formatiert. Nie im Quellcode speichern.');
}
function paths(folder){return {app:path.join(folder,'app.html'),original:path.join(folder,'pc.zip'),
 updated:path.join(folder,'pc-aktualisiert.zip'),manifest:path.join(folder,'release-plan.json')}}
function prepare(folder){
 requireAdmin();
 if(fs.existsSync(folder))fail('Verzeichnis ist bereits vorhanden. Verwende einen neuen, privaten Pfad für jede Aktualisierung.');
 fs.mkdirSync(folder,{recursive:true,mode:0o700});
 try {
  const p=paths(folder),current=version();
  run(process.execPath,['tools/agent_zugang.cjs','entschluesseln',folder]);
  const [py,initial]=python();
  run(py,[...initial,'tools/pc_studio_sync.py','--zip',p.original,'--out',p.updated,'--studio','studio']);
  const plan={format:1,version:current,created:new Date().toISOString(),
    studioSha256:studioDigest(),originalPcSha256:fileDigest(p.original),
    updatedPcSha256:fileDigest(p.updated),onlineHtmlSha256:fileDigest(p.app),
    warning:'Nach sicherem Test des nativen PC-Agenten explizit release --tested ausführen.'};
  fs.writeFileSync(p.manifest,JSON.stringify(plan,null,2)+'\n',{mode:0o600});
  console.log('Neue PC-ZIP vorbereitet. ACHTUNG: Im Ausgabeordner liegen entschlüsselte Dateien.');
  console.log('PC-Update zuerst in einer Testumgebung prüfen. Nichts wurde veröffentlicht.');
 }catch(e){
  // Do not leave a half-broken update staging directory.
  fs.rmSync(folder,{recursive:true,force:true});
  throw e;
 }
}
function release(folder,confirmed){
 requireAdmin();
 if(!confirmed)fail('Vor Veröffentlichung den bestehenden PC-Agenten testen; release verlangt ausdrücklich --tested.');
 const p=paths(folder);
 if(!fs.existsSync(p.manifest))fail('Keine geprüfte Vorbereitung gefunden.');
 const plan=JSON.parse(fs.readFileSync(p.manifest,'utf8'));
 if(plan.format!==1||plan.version!==version())fail('Vorbereitung ist veraltet; bitte neu vorbereiten.');
 if(plan.studioSha256!==studioDigest())fail('Online-Studio hat sich seit der Vorbereitung verändert; bitte neu vorbereiten.');
 for(const [file,sha] of [[p.original,plan.originalPcSha256],[p.updated,plan.updatedPcSha256],[p.app,plan.onlineHtmlSha256]]){
  if(!fs.existsSync(file)||fileDigest(file)!==sha)fail('Eine vorbereitete Datei wurde geändert: '+path.basename(file));
 }
 run(process.execPath,['tools/agent_zugang.cjs','verschluesseln',p.app,p.updated]);
 console.log('Neues verschlüsseltes Release lokal vorbereitet.');
 console.log('Jetzt nur die neuen verschlüsselten Dateien und agent/zugang.json in GitHub committen/pushen.');
 console.log('Vorhandene Agenten und Chat-Dateien wurden von diesem Tool nicht installiert oder verändert.');
}
function main(argv){
 const [command,folder,...rest]=argv;
 if(!['prepare','release'].includes(command)||!folder)
  fail('Benutzung: node tools/agent_pc_update.cjs prepare <privater-ordner> | release <privater-ordner> --tested');
 const target=validDir(folder);
 if(command==='prepare'){if(rest.length)fail('Unbekannte Zusatzargumente.');prepare(target)}
 else {if(rest.some(x=>x!=='--tested'))fail('Unbekannte Zusatzargumente.');release(target,rest.includes('--tested'))}
}
if(require.main===module){
 try{main(process.argv.slice(2))}catch(e){console.error('SD Lotze Update gestoppt: '+e.message);process.exitCode=1}
}
module.exports={validDir,digest,studioDigest,paths,main};
