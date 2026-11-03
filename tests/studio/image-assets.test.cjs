'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=require('../../studio/image-assets.js');

test('JPEG XL wird mit JPEG/PNG-Fallback als picture eingebunden',()=>{
  const html=api.picture({jxl:'wald.jxl',modern:'wald.avif',fallback:'wald.jpg',
    folder:'assets/fotos',alt:'Wald im Morgenlicht'});
  assert.match(html,/<source srcset="assets\/fotos\/wald\.jxl" type="image\/jxl">/);
  assert.match(html,/<source srcset="assets\/fotos\/wald\.avif" type="image\/avif">/);
  assert.match(html,/<img src="assets\/fotos\/wald\.jpg" alt="Wald im Morgenlicht"/);
  assert(html.indexOf('image/jxl')<html.indexOf('image/avif'));
  assert(html.indexOf('image/avif')<html.indexOf('<img '));
});
test('Ohne Zusatzformat bleibt klassischer Fallback nutzbar',()=>{
  const html=api.picture({jxl:'bild.JXL',fallback:'bild.png',folder:'',alt:'Produktfoto'});
  assert.match(html,/srcset="bild\.JXL"/);
  assert.match(html,/src="bild\.png"/);
  assert.doesNotMatch(html,/image\/webp/);
});
test('Sonderzeichen werden sicher als Pfad und HTML-Text kodiert',()=>{
  const html=api.picture({jxl:'Straße & Sonne.jxl',fallback:'Straße & Sonne.jpg',
    folder:'assets/Überblick',alt:'Haus "Morgen" & <Wald>'});
  assert.match(html,/assets\/%C3%9Cberblick\/Stra%C3%9Fe%20%26%20Sonne\.jxl/);
  assert.match(html,/alt="Haus &quot;Morgen&quot; &amp; &lt;Wald&gt;"/);
});
test('Ungültige Dateien, Pfad-Traversal und externe URLs werden abgelehnt',()=>{
  const base={jxl:'bild.jxl',fallback:'bild.jpg',folder:'assets',alt:'Foto'};
  assert.throws(()=>api.picture({...base,jxl:'bild.png'}),/Bildformat/);
  assert.throws(()=>api.picture({...base,fallback:'bild.webp'}),/Bildformat/);
  assert.throws(()=>api.picture({...base,folder:'../private'}),/Bildordner/);
  assert.throws(()=>api.picture({...base,folder:'https://evil.example'}),/Bildordner/);
  assert.throws(()=>api.picture({...base,jxl:'../bild.jxl'}),/Bilddatei/);
  assert.throws(()=>api.picture({...base,alt:''}),/Alternativtext/);
});
test('Code-Studio und Vorschau-Server erkennen image/jxl',()=>{
  const studio=fs.readFileSync('studio/studio.js','utf8');
  const sw=fs.readFileSync('studio/vorschau-sw.js','utf8');
  const start=studio.indexOf('function mimeVon('),end=studio.indexOf('function herunterladen(',start);
  assert(start>=0&&end>start);
  const ctx=vm.createContext({});
  vm.runInContext(studio.slice(start,end)+'\nthis.mimeVon=mimeVon',ctx);
  assert.equal(ctx.mimeVon('assets/bild.jxl'),'image/jxl');
  assert.match(sw,/\bjxl:\s*'image\/jxl'/);
  assert.match(studio,/webp\|ico\|avif\|jxl/);
});
test('JPEG XL Werkzeug ist im Studio verlinkt',()=>{
  const html=fs.readFileSync('studio/index.html','utf8');
  const tool=fs.readFileSync('studio/jpeg-xl.html','utf8');
  assert.match(html,/href="\.\/jpeg-xl\.html"/);
  assert.match(tool,/src="\.\/image-assets\.js"/);
  assert.match(tool,/id="fallbackFile"/);
});