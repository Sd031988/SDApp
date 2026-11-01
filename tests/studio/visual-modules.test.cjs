'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const visual=require('../../studio/studio-visual-text.js');
const modules=require('../../studio/studio-modules.js');

test('visual text edits only an exact unique element and escapes HTML',()=>{
 const source='<h1 class="title">Hallo</h1><p>Unverändert</p>';
 const r=visual.replaceText(source,'h1','Hallo','Neue <Überschrift> & mehr');
 assert.equal(r.content,'<h1 class="title">Neue &lt;Überschrift&gt; &amp; mehr</h1><p>Unverändert</p>');
 assert.equal(r.line,1);
 assert.equal(source.includes('Neue'),false);
});
test('visual editor rejects duplicate, nested and dynamically generated content',()=>{
 assert.throws(()=>visual.replaceText('<h1>A</h1><h1>A</h1>','h1','A','B'),/mehrfach/);
 assert.throws(()=>visual.replaceText('<h1><em>A</em></h1>','h1','A','B'),/dynamisch/);
 assert.throws(()=>visual.replaceText('<script>hello()</script>','script','A','B'),/nicht/);
});
test('local ES modules resolve nested paths in inline data module graph',()=>{
 const files={
  'js/main.js':'import {answer} from "./lib/answer.js";\nwindow.answer=answer;',
  'js/lib/answer.js':'export const answer=42;'
 };
 const url=modules.bundle('js/main.js',files);
 assert(url.startsWith('data:text/javascript;charset=utf-8,'));
 const text=decodeURIComponent(url.split(',').slice(1).join(','));
 assert(text.includes('window.answer=answer'));
 assert(text.includes('data:text/javascript;charset=utf-8,'));
 const embedded=text.match(/from "(data:[^"]+)"/);
 assert(embedded,'nested import rewritten');
 assert(decodeURIComponent(embedded[1].split(',').slice(1).join(',')).includes('answer=42'));
});
test('module graph rejects unsafe paths, missing files and circular dependencies',()=>{
 assert.throws(()=>modules.bundle('src/main.js',{'src/main.js':'import "../outside.js";'}),/fehlt/);
 assert.throws(()=>modules.bundle('main.js',{'main.js':'import "../outside.js";'}),/verlässt das Projekt/);
 assert.throws(()=>modules.bundle('a.js',{'a.js':'import "./b.js";','b.js':'import "./a.js";'}),/Zyklischer/);
});
