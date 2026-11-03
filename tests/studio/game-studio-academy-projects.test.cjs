'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const folder=path.resolve(__dirname,'../../studio/game-studio/academy');
test('The learning portal links to separate four-project workshop',()=>{
 const home=fs.readFileSync(path.join(folder,'index.html'),'utf8');
 const page=fs.readFileSync(path.join(folder,'projects.html'),'utf8');
 const css=fs.readFileSync(path.join(folder,'projects.css'),'utf8');
 assert.match(home,/href="\.\/projects\.html"/);
 assert.match(page,/href="\.\/projects\.css\?v=1"/);
 assert.match(page,/src="\.\/projects\.js\?v=1"/);
 assert.match(page,/id="projectCards"/);
 assert.match(page,/id="projectContent"/);
 assert.match(css,/@media\(max-width:700px\)/);
});
test('Four self-assessed capstones use a separate local key and contain realistic scope notes',()=>{
 const src=fs.readFileSync(path.join(folder,'projects.js'),'utf8');
 new vm.Script(src,{filename:'projects.js'});
 assert.equal((src.match(/code:'PROJECT \/ 0[1-4]'/g)||[]).length,4);
 for(const id of ['forest','outpost','showroom','world'])assert.match(src,new RegExp("id:'"+id+"'"));
 for(const term of ['Wald-Parcours','Wüsten-Außenposten','3D-Asset-Showroom','Open-World-Techniklabor','In-Memory-Cell-Culling'])assert(src.includes(term));
 assert.match(src,/sd-game-academy-capstones-v1/);
 assert.doesNotMatch(src,/\b(?:fetch|XMLHttpRequest|eval|indexedDB)\s*\(/);
 assert.doesNotMatch(src,/\b(?:SDGameCore|SDGameProject|SDLargeWorld)\b/);
 assert.match(src,/Hake die Aufgabe erst ab/);
});
