'use strict';
// Guards against page-breaking syntax errors in inline scripts, which module
// tests cannot see (a broken HUD string once stopped the whole game).
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
test('every inline script of nordhafen-ops.html compiles',()=>{
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-ops.html'),'utf8');
 const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.ok(scripts.length>0,'page has inline script');
 scripts.forEach((code,i)=>assert.doesNotThrow(()=>new vm.Script(code,{filename:'inline-'+i+'.js'}),'inline script '+i));
});
