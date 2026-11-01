'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const repo=path.resolve(__dirname,'../..');
test('SD Lotze encrypted online and advanced PC assets have one matching release version',()=>{
 const z=JSON.parse(fs.readFileSync(path.join(repo,'agent/zugang.json'),'utf8'));
 assert.match(z.ver,/^\d{14}$/);
 for(const prefix of ['agent/app-','agent/pc-agent/pc-']){
  const file=path.join(repo,prefix+z.ver+'.enc');
  assert(fs.existsSync(file),'Missing paired encrypted release: '+file);
  const p=JSON.parse(fs.readFileSync(file,'utf8'));
  assert(typeof p.i==='string'&&p.i.length>10);
  assert(typeof p.d==='string'&&p.d.length>100);
 }
 assert(z.eintraege&&z.dl,'Separate online and desktop access policies must remain active');
});
test('Publishing guard requires a freshly compiled native PC ZIP',()=>{
 const source=fs.readFileSync(path.join(repo,'tools/agent_zugang.cjs'),'utf8');
 assert.match(source,/if \(!a1 \|\| !a2\)/);
 assert.match(source,/Buffer\.compare\(Buffer\.from\(zip\), Buffer\.from\(alt\)\)/);
 assert.match(source,/Das PC-Paket ist unverändert/);
});
