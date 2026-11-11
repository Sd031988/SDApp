'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test('vendored runtime contains exactly the pinned, hash-verified browser core',()=>{
 const dir=path.resolve(__dirname,'../../studio/vendor/pyodide/314.0.7'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
 assert.equal(manifest.version,'314.0.7');assert.equal(Object.keys(manifest.files).length,5);
 for(const [name,file] of Object.entries(manifest.files)){const bytes=fs.readFileSync(path.join(dir,name));assert.equal(bytes.length,file.bytes,name);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256,name);}
 assert(fs.statSync(path.join(dir,'LICENSE')).size>1000);assert(fs.statSync(path.join(dir,'LICENSE-CPYTHON')).size>1000);
});
