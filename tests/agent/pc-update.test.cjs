'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const api=require('../../tools/agent_pc_update.cjs');
test('PC update refuses plaintext staging inside GitHub repository',()=>{
 const repo=path.resolve(__dirname,'../..');
 assert.throws(()=>api.validDir(path.join(repo,'staging')),/außerhalb/);
 assert.throws(()=>api.validDir(repo),/außerhalb/);
 assert.equal(api.validDir(path.join(os.tmpdir(),'sd-test-pc-update')),path.resolve(os.tmpdir(),'sd-test-pc-update'));
});
test('PC update without ADMIN_CODE fails safely and never creates decrypted files',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sd-pc-test-'));
 const target=path.join(temp,'new');
 const previous=process.env.ADMIN_CODE;
 delete process.env.ADMIN_CODE;
 try{
  assert.throws(()=>api.main(['prepare',target]),/ADMIN_CODE/);
  assert.equal(fs.existsSync(target),false);
  assert.throws(()=>api.main(['release',target,'--tested']),/ADMIN_CODE/);
 }finally{
  if(previous!==undefined)process.env.ADMIN_CODE=previous;
  fs.rmSync(temp,{recursive:true,force:true});
 }
});
test('release requires explicit successful native app test and integrity manifest',()=>{
 const result=api.digest(Buffer.from('safe'));
 assert.match(result,/^[a-f0-9]{64}$/);
 assert.equal(result,api.digest(Buffer.from('safe')));
 assert.notEqual(result,api.digest(Buffer.from('different')));
 const p=api.paths(path.join(os.tmpdir(),'pc-stage'));
 assert.match(p.updated,/pc-aktualisiert\.zip$/);
 assert.match(p.manifest,/release-plan\.json$/);
});
test('unknown command and accidental extra options are refused',()=>{
 assert.throws(()=>api.main(['update','/tmp/test']),/Benutzung/);
 assert.throws(()=>api.main(['prepare','/tmp/test','--force']),/Zusatzargumente/);
});
