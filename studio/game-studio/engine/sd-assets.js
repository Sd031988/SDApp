/* SD Assets – eigene Dateien (3D-Modelle, Foto-Gebäude, Foto-Materialien) im Browser speichern.
   Alles bleibt auf diesem Gerät (IndexedDB "sdAssets"), nichts wird hochgeladen.
   Werkstatt und Engine benutzen denselben Speicher. */
'use strict';
(function () {
  const DB = 'sdAssets', ST = 'dateien';
  function oeffnen() { return new Promise((ok, nein) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(ST, { keyPath: 'name' }); r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); }); }
  async function tx(modus, fn) { const db = await oeffnen(); return new Promise((ok, nein) => { const t = db.transaction(ST, modus), s = t.objectStore(ST); let erg; Promise.resolve(fn(s)).then(r => { erg = r; }); t.oncomplete = () => { db.close(); ok(erg); }; t.onerror = () => { db.close(); nein(t.error); }; }); }
  const req = r => new Promise((ok, nein) => { r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); });
  /** Name säubern: Buchstaben, Zahlen, -, _, . */
  const name = n => String(n || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9äöüß._-]/g, '').slice(0, 60);
  const api = {
    name,
    speichern: (eintrag) => tx('readwrite', s => req(s.put(Object.assign({ t: Date.now() }, eintrag, { name: name(eintrag.name) })))),
    holen: (n) => tx('readonly', s => req(s.get(name(n)))),
    alle: () => tx('readonly', s => req(s.getAll())),
    loeschen: (n) => tx('readwrite', s => req(s.delete(name(n)))),
    /** Speicherplatz (geschätzt) */
    platz: async () => { try { const e = await navigator.storage.estimate(); return { belegt: e.usage, frei: e.quota - e.usage }; } catch (e) { return null; } },
  };
  window.SDAssets = api;
})();
