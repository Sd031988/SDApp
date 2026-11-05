'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const pakete = require('./sd-bauplan-pakete.js');

const kontext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'sd-teile.js'), 'utf8'), kontext, { filename: 'sd-teile.js' });
const validieren = kontext.window.SDTeile.pruefen;

for (const vorlage of pakete.liste) {
  for (const detail of ['hoch', 'sparsam']) {
    test(vorlage.id + ': ' + detail + ' erzeugt gültige SDTeile-Daten', () => {
      const modell = pakete.erzeugen(vorlage.id, { detail, farbe: '#123abc' });
      const { daten, fehler } = validieren(modell);
      assert.deepEqual(Array.from(fehler), []);
      assert.ok(daten.teile.length >= 30);
      assert.ok(daten.teile.length <= 1500);
      const ids = new Set();
      const eltern = new Map();
      for (const teil of daten.teile) {
        assert.ok(!ids.has(teil.id), 'doppelte ID: ' + teil.id);
        ids.add(teil.id);
        eltern.set(teil.id, teil.eltern);
        assert.ok(teil.pos.every(Number.isFinite));
        assert.match(teil.farbe, /^#[\da-f]{6}$/i);
      }
      for (const id of ids) {
        const besuchte = new Set();
        let cursor = id;
        while (cursor) {
          assert.ok(!besuchte.has(cursor), 'Zyklische Eltern-Beziehung');
          besuchte.add(cursor);
          cursor = eltern.get(cursor);
        }
      }
      for (const bewegung of daten.bewegungen) assert.ok(ids.has(bewegung.teil));
    });
  }
  test(vorlage.id + ': Sparmodus reduziert Bauteile', () => {
    const leicht = pakete.erzeugen(vorlage.id, { detail: 'sparsam' }).teile.length;
    const hoch = pakete.erzeugen(vorlage.id, { detail: 'hoch' }).teile.length;
    assert.ok(leicht < hoch, vorlage.id + ': ' + leicht + ' vs ' + hoch);
  });
}
test('Unbekannte Vorlage wird kontrolliert abgewiesen', () => {
  assert.throws(() => pakete.erzeugen('falsche-vorlage'), RangeError);
});
test('Ungültige Farbe bekommt sicheren Standardwert', () => {
  const modell = pakete.erzeugen('kampfroboter', { farbe: 'red; script()' });
  assert.ok(modell.teile.every(t => /^#[\da-f]{6}$/i.test(t.farbe)));
});
