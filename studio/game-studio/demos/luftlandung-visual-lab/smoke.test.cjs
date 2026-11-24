'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'game.js'),'utf8');
test('document links the matching script with pinned engine',()=>{
 assert.match(html,/babylonjs@9\.31\.3\/babylon\.min\.js/);
 assert.match(html,/src="\.\/game\.js"/);
 assert.match(html,/id="intro"/);assert.match(html,/id="game"/);
});
test('game actually renders live 3D and handles missing CDN',()=>{
 assert.match(js,/new BAB\.Scene\(engine\)/);
 assert.match(js,/scene\.render\(\)/);
 assert.match(js,/!BAB.*status\.textContent/);
 assert.match(js,/thinInstanceSetBuffer/);
 assert.match(js,/BAB\.DefaultRenderingPipeline/);
});
test('isolated from other projects and avoids browser persistent writes',()=>{
 assert.doesNotMatch(js,/localStorage|indexedDB|fetch\s*\(|eval\s*\(/);
 assert.doesNotMatch(html,/<iframe/);
});
test('mouse, touch, keyboard and cleanup paths available',()=>{
 for(const x of ['pointerdown','pointermove','pointercancel','pointerup','keydown','keyup','pagehide']) assert.ok(js.includes(x),x);
 assert.match(js,/engine\.dispose\(\)/);
});
