/* SD Code-Studio – Vorschau-Server im Browser.
   Liefert /studio/vorschau/<projekt>/<datei> direkt aus dem Browser-Speicher (IndexedDB "sdCodeStudio"),
   damit Webseiten mit mehreren Dateien (HTML, CSS, JS, Bilder, fetch) wie auf einem echten Server laufen.
   Nichts wird ins Internet geschickt. */
'use strict';
const BASIS = new URL(self.registration.scope).pathname;   // /studio/vorschau/
const TYPEN = { html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', svg: 'image/svg+xml',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon', avif: 'image/avif', txt: 'text/plain', md: 'text/plain',
  xml: 'application/xml', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', webm: 'video/webm', wasm: 'application/wasm', csv: 'text/csv' };
// kleine Brücke: Konsole und Fehler der Vorschau ans Studio melden
const BRUECKE = '<script>(function(){var P=parent!==window?parent:null;if(!P)return;function s(t,a){try{P.postMessage({sdVorschau:1,typ:t,text:Array.prototype.map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}catch(e){}}' +
  '["log","info","warn","error"].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});' +
  'addEventListener("error",function(e){var d=(e.filename||"").split("/vorschau/")[1]||"";d=d.split("/").slice(1).join("/");s("fehler",[e.message+(d?" ("+decodeURIComponent(d)+":"+e.lineno+")":"")])});' +
  'addEventListener("unhandledrejection",function(e){s("fehler",["Promise: "+(e.reason&&e.reason.message||e.reason)])});' +
  'addEventListener("message",function(e){if(e.data&&e.data.sdEval!=null){try{var r=(0,eval)(e.data.sdEval);s("ergebnis",[r])}catch(x){s("fehler",[x.message])}}});})();<\/script>';

function dbOeffnen() {
  return new Promise((ok, nein) => { const r = indexedDB.open('sdCodeStudio', 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('projekte')) r.result.createObjectStore('projekte', { keyPath: 'name' }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); });
}
async function projektLesen(name) {
  const db = await dbOeffnen();
  return new Promise((ok, nein) => { const q = db.transaction('projekte').objectStore('projekte').get(name); q.onsuccess = () => ok(q.result || null); q.onerror = () => nein(q.error); });
}
function antwort(inhalt, typ, status) {
  return new Response(inhalt, { status: status || 200, headers: { 'Content-Type': typ + (/^text|json|javascript|svg|xml/.test(typ) ? '; charset=utf-8' : ''), 'Cache-Control': 'no-store' } });
}
function dataUrlZuBlob(u) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(u); if (!m) return null;
  const roh = m[2] ? Uint8Array.from(atob(m[3]), c => c.charCodeAt(0)) : decodeURIComponent(m[3]);
  return new Blob([roh], { type: m[1] || 'application/octet-stream' });
}
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASIS)) return;
  e.respondWith((async () => {
    const teile = url.pathname.slice(BASIS.length).split('/');
    const projekt = decodeURIComponent(teile.shift() || '');
    let pfad = teile.map(decodeURIComponent).join('/');
    const p = await projektLesen(projekt).catch(() => null);
    if (!p) return antwort('<h1>Projekt nicht gefunden</h1>', 'text/html', 404);
    const d = p.dateien || {};
    if (!pfad || pfad.endsWith('/')) pfad += 'index.html';
    if (d[pfad] == null && d[pfad + '.html'] != null) pfad += '.html';
    if (d[pfad] == null && d[pfad + '/index.html'] != null) pfad += '/index.html';
    if (d[pfad] == null) {
      // einzelne HTML-Datei ohne index.html: diese zeigen
      const html = Object.keys(d).filter(x => /\.html?$/i.test(x));
      if (/index\.html$/.test(pfad) && html.length && pfad === 'index.html') pfad = html.sort((a, b) => a.split('/').length - b.split('/').length)[0];
      else return antwort('<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:24px"><h2>404 – Datei nicht gefunden</h2><p><code>' + pfad.replace(/</g, '&lt;') + '</code> gibt es in diesem Projekt nicht.</p>', 'text/html', 404);
    }
    const typ = TYPEN[(pfad.split('.').pop() || '').toLowerCase()] || 'text/plain';
    let inhalt = d[pfad];
    if (typeof inhalt === 'string' && inhalt.startsWith('data:') && !/^text\/(html|css|javascript)/.test(typ)) { const b = dataUrlZuBlob(inhalt); if (b) return new Response(b, { headers: { 'Content-Type': b.type || typ, 'Cache-Control': 'no-store' } }); }
    if (typ === 'text/html') inhalt = /<head[^>]*>/i.test(inhalt) ? inhalt.replace(/<head[^>]*>/i, m => m + BRUECKE) : BRUECKE + inhalt;
    return antwort(inhalt, typ);
  })());
});
