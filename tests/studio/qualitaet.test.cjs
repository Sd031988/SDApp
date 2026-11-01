'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {fileDiff,preflight}=require('../../studio/studio-qualitaet.js');
const diag=require('../../studio/studio-diagnose.js');
test('diff shows real changed range without mutating old/new code',()=>{
 const before='first\nold\nlast',after='first\nnew\nlast';
 const d=fileDiff(before,after);
 assert.equal(d.startLine,2);
 assert.equal(d.oldLines,1);
 assert.equal(d.newLines,1);
 assert.equal(d.before,'old');assert.equal(d.after,'new');
 assert.equal(fileDiff(before,before).unchanged,true);
});
test('preflight detects missing linked files before publication',()=>{
 const d=preflight({'index.html':'<link rel="stylesheet" href="missing.css"><h1>Test</h1>'},diag.inspect);
 assert(d.some(x=>x.severity==='error'&&x.kind==='asset'));
});
test('preflight prevents accidental private keys and invalid package JSON',()=>{
 const d=preflight({'index.html':'ok','private.pem':'-----BEGIN PRIVATE KEY-----','package.json':'{'});
 assert(d.some(x=>x.kind==='secret'&&x.severity==='error'));
 assert(d.some(x=>x.kind==='json'));
});
test('preflight warns about unsafe script patterns, external JS and framework-build requirements',()=>{
 const d=preflight({'index.html':'<script src="https://cdn.example/a.js"></script>',
 'app.js':'eval("unsafe")','package.json':'{"scripts":{"build":"vite build"}}'});
 assert(d.some(x=>x.kind==='external'&&x.severity==='warning'));
 assert(d.some(x=>x.kind==='eval'&&x.severity==='warning'));
 assert(d.some(x=>x.kind==='build'));
});
test('preflight passes complete plain HTML/CSS/JS project',()=>{
 const d=preflight({'index.html':'<link rel="stylesheet" href="style.css"><script src="app.js"></script>',
 'style.css':'body{}','app.js':'console.log(1)'},diag.inspect);
 assert.equal(d.length,0);
});
