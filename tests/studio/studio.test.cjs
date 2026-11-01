'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = fs.readFileSync('studio/studio.js', 'utf8');
function extract(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert(a >= 0 && b > a, 'Funktion nicht gefunden: ' + start);
  return source.slice(a, b);
}
const code = [
  extract('function slug(', 'function icon('),
  extract('function frameworkErkennen(', 'function frameworkBuildExport('),
  extract('function projektPruefen(', 'async function projektAssistent()')
].join('\n');
const ctx = vm.createContext({});
vm.runInContext(code + '\nthis.api={slug,sicherPfad,frameworkErkennen,projektPruefen};', ctx);
const {slug,sicherPfad,frameworkErkennen,projektPruefen} = ctx.api;

test('Pfadvalidierung verhindert Traversal', () => {
  assert.equal(sicherPfad('../secret'), null);
  assert.equal(sicherPfad('css/style.css'), 'css/style.css');
});
test('HTML-Projekt und fehlende Dateien erkennen', () => {
  const result = projektPruefen({'index.html':'<link href="css/missing.css" rel="stylesheet">'});
  assert.equal(result.html, 'index.html');
  assert(result.meldungen.some(m => m.includes('css/missing.css')));
});
test('React und Build-Skript erkennen', () => {
  const info = frameworkErkennen({'package.json':JSON.stringify({dependencies:{react:'^19.0.0'},scripts:{build:'vite build'}})});
  assert.equal(info.name, 'React');
  assert.equal(info.build, true);
});
test('Vue, Angular, Svelte und Next.js erkennen', () => {
  for (const [dependency,expected] of [['vue','Vue'],['@angular/core','Angular'],['svelte','Svelte'],['next','Next.js']]) {
    assert.equal(frameworkErkennen({'package.json':JSON.stringify({dependencies:{[dependency]:'1.0.0'}})}).name,expected);
  }
});
test('Kaputtes package.json melden', () => {
  assert(projektPruefen({'package.json':'{broken'}).meldungen.some(m=>m.includes('kein gültiges JSON')));
});
test('Umgebungsdateien als Risiko melden', () => {
  assert(projektPruefen({'index.html':'<h1>OK</h1>','.env':'TOKEN=example'}).meldungen.some(m=>m.includes('Zugangsdaten')));
});
test('Desktop- und ZIP-Export bleiben vorhanden', () => {
  assert(source.includes('async function desktopExport()'));
  assert(source.includes('async function zipEinlesen('));
  assert(source.includes('async function hochladen(dateien)'));
  assert(source.includes('async function projektAssistent()'));
});
test('Electron-Export enthält Workflow für drei Betriebssysteme', () => {
  assert(source.includes('windows-latest'));
  assert(source.includes('macos-latest'));
  assert(source.includes('ubuntu-latest'));
});
