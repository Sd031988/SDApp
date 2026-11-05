/* SD Game-Studio · KI-Bauplan Spielpakete.
   Reine JSON-Geometrie für SDTeile; keine Änderungen an laufenden Spielen,
   keine Netzwerkanfragen und keine automatischen Projektänderungen. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SDBauplanPakete = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const VORLAGEN = Object.freeze([
    { id: 'kampfroboter', titel: 'Kampfroboter XR-7', beschreibung: 'Gepanzerter Roboter mit animierten Armen, Beinen und Visier', art: 'dekoration' },
    { id: 'gelaendewagen', titel: 'Geländewagen AT-4', beschreibung: 'Offroad-Fahrzeug mit Rädern, Licht, Kabine und Innenraum', art: 'dekoration' },
    { id: 'wachturm', titel: 'Militärischer Aussichtsposten', beschreibung: 'Begehbar wirkender Turm mit Treppen, Plattform und Scheinwerfern', art: 'dekoration' }
  ]);
  function erzeugen(id, optionen) {
    if (!VORLAGEN.some(v => v.id === id)) throw new RangeError('Unbekannte KI-Bauplan-Vorlage: ' + id);
    const o = optionen || {};
    const hoch = o.detail !== 'sparsam';
    const lack = typeof o.farbe === 'string' && /^#[a-f\d]{6}$/i.test(o.farbe) ? o.farbe : '#617486';
    const metall = '#1c2832', alu = '#8d9baa', gummi = '#151b20', licht = '#84d9ff', warn = '#ffb655';
    const teile = [], bewegungen = [], ids = new Set();
    function add(id, form, pos, extras) {
      if (ids.has(id)) throw new Error('Doppelte Bauteil-ID: ' + id);
      ids.add(id);
      const t = Object.assign({ id, form, pos, farbe: lack, material: 'metall' }, extras || {});
      teile.push(t); return id;
    }
    function box(id, pos, groesse, farbe, material, eltern, dreh) {
      return add(id, 'kiste', pos, { groesse, farbe: farbe || lack, material: material || 'metall', ...(eltern ? { eltern } : {}), ...(dreh ? { dreh } : {}) });
    }
    function cyl(id, pos, durchmesser, hoehe, farbe, material, eltern, achse) {
      return add(id, 'zylinder', pos, { durchmesser, hoehe, farbe: farbe || lack, material: material || 'metall', ...(eltern ? { eltern } : {}), ...(achse ? { achse } : {}), segmente: hoch ? 24 : 12 });
    }
    function sphere(id, pos, durchmesser, farbe, material, eltern) {
      return add(id, 'kugel', pos, { durchmesser, farbe: farbe || alu, material: material || 'metall', ...(eltern ? { eltern } : {}), segmente: hoch ? 24 : 12 });
    }
    function gelenk(id, pos, eltern) {
      return add(id, 'kiste', pos, { unsichtbar: true, ...(eltern ? { eltern } : {}) });
    }
    if (id === 'kampfroboter') {
      // 2,35 m hohe Figur. Gelenke sind echte Eltern-Kind-Knoten im SDTeile-Format.
      box('becken', [0, 1.13, 0], [0.63, 0.34, 0.43], metall);
      box('bauch', [0, 1.42, 0], [0.65, 0.49, 0.36], gummi, 'gummi');
      box('panzerbrust', [0, 1.70, 0], [0.81, 0.54, 0.48], lack);
      box('brustschutz', [0, 1.73, 0.255], [0.73, 0.41, 0.07], alu);
      box('rueckenmodul', [0, 1.67, -0.30], [0.59, 0.66, 0.23], metall);
      cyl('hals', [0, 2.045, 0], 0.23, 0.19, metall);
      box('helm', [0, 2.235, 0.02], [0.51, 0.45, 0.46], lack);
      box('visier', [0, 2.27, 0.277], [0.43, 0.17, 0.035], licht, 'leuchten');
      box('kinnschutz', [0, 2.075, 0.27], [0.35, 0.09, 0.08], alu);
      for (const s of [-1, 1]) {
        const seit = s < 0 ? 'l' : 'r';
        box('helm_ohr_' + seit, [s * 0.285, 2.23, 0], [0.095, 0.29, 0.33], metall);
        sphere('sensor_' + seit, [s * 0.305, 2.30, 0.11], 0.10, licht, 'leuchten');
        box('brustplatte_' + seit, [s * 0.21, 1.71, 0.31], [0.28, 0.28, 0.055], lack);
        box('hueftpanzer_' + seit, [s * 0.31, 1.08, 0], [0.17, 0.28, 0.42], alu);
        const arm = gelenk('schulter_' + seit, [s * 0.54, 1.89, 0], null);
        sphere('schultergelenk_' + seit, [0, 0, 0], 0.23, metall, 'gummi', arm);
        box('schulterpanzer_' + seit, [s * 0.07, -0.10, 0], [0.35, 0.29, 0.43], lack, 'metall', arm);
        box('oberarm_' + seit, [0, -0.28, 0], [0.22, 0.42, 0.25], alu, 'metall', arm);
        const ellenbogen = gelenk('ellenbogen_' + seit, [0, -0.51, 0], arm);
        sphere('gelenkkapsel_' + seit, [0, 0, 0], 0.22, metall, 'gummi', ellenbogen);
        box('unterarm_' + seit, [0, -0.24, 0.05], [0.27, 0.43, 0.31], lack, 'metall', ellenbogen);
        box('hand_' + seit, [0, -0.51, 0.11], [0.21, 0.18, 0.28], metall, 'gummi', ellenbogen);
        const bein = gelenk('huefte_' + seit, [s * 0.24, 1.04, 0], null);
        sphere('hueftgelenk_' + seit, [0, 0, 0], 0.24, metall, 'gummi', bein);
        box('oberschenkel_' + seit, [0, -0.24, 0], [0.32, 0.42, 0.35], lack, 'metall', bein);
        const knie = gelenk('knie_' + seit, [0, -0.49, 0], bein);
        sphere('kniescheibe_' + seit, [0, 0, 0.20], 0.23, alu, 'metall', knie);
        box('schienbein_' + seit, [0, -0.23, 0], [0.31, 0.38, 0.32], lack, 'metall', knie);
        box('stiefel_' + seit, [0, -0.47, 0.15], [0.34, 0.17, 0.58], gummi, 'gummi', knie);
        bewegungen.push({ teil: arm, art: 'pendeln', achse: 'x', tempo: 165, weite: 16, phase: s < 0 ? 0 : 180 });
        bewegungen.push({ teil: bein, art: 'pendeln', achse: 'x', tempo: 165, weite: 14, phase: s < 0 ? 180 : 0 });
        bewegungen.push({ teil: knie, art: 'pendeln', achse: 'x', tempo: 165, weite: 9, phase: s < 0 ? 0 : 180 });
        if (hoch) {
          for (let j = 0; j < 4; j++) {
            box('brust_lamelle_' + seit + '_' + j, [s * 0.21, 1.48 + j * 0.085, 0.32], [0.20, 0.025, 0.025], metall);
            box('unterarm_rippe_' + seit + '_' + j, [s * 0.142, -0.11 - j * 0.085, 0.07], [0.027, 0.026, 0.27], alu, 'metall', ellenbogen);
          }
          cyl('kolben_' + seit, [s * 0.16, -0.22, -0.06], 0.055, 0.40, alu, 'chrom', arm);
          box('kniepanzer_' + seit, [0, 0, 0.215], [0.29, 0.20, 0.06], lack, 'metall', knie);
          box('stiefel_sohle_' + seit, [0, -0.56, 0.15], [0.35, 0.055, 0.61], gummi, 'gummi', knie);
        }
      }
      box('energiezelle', [0, 1.7, -0.445], [0.26, 0.35, 0.05], licht, 'leuchten');
      if (hoch) {
        for (let i = 0; i < 6; i++) box('ruecken_lueftung_' + i, [-0.21 + i * 0.084, 1.44, -0.45], [0.042, 0.19, 0.025], alu);
        for (let i = 0; i < 4; i++) box('helm_naht_' + i, [-0.18 + i * 0.12, 2.47, 0.01], [0.018, 0.015, 0.32], metall);
      }
    } else if (id === 'gelaendewagen') {
      box('rahmen', [0, 0.69, 0], [1.84, 0.34, 4.32], metall);
      box('karosserie', [0, 0.99, 0.0], [1.92, 0.66, 4.18], lack);
      box('motorhaube', [0, 1.32, 1.32], [1.82, 0.12, 1.25], lack);
      box('kabine', [0, 1.66, -0.55], [1.74, 0.82, 2.43], lack);
      box('dach', [0, 2.13, -0.59], [1.84, 0.115, 2.50], metall);
      box('windschutzscheibe', [0, 1.74, 0.77], [1.56, 0.69, 0.045], '#36596a', 'glas', null, [20, 0, 0]);
      box('heckscheibe', [0, 1.76, -1.87], [1.52, 0.67, 0.048], '#36596a', 'glas', null, [-12, 0, 0]);
      box('frontstossstange', [0, 0.77, 2.16], [2.08, 0.22, 0.22], metall);
      box('heckstossstange', [0, 0.77, -2.16], [2.08, 0.22, 0.22], metall);
      box('kuehlergrill', [0, 1.07, 2.105], [0.89, 0.27, 0.045], metall);
      for (const s of [-1, 1]) {
        const seit = s < 0 ? 'l' : 'r';
        box('seitenscheibe_vorn_' + seit, [s * 0.884, 1.75, 0.13], [0.04, 0.58, 0.95], '#36596a', 'glas');
        box('seitenscheibe_hinten_' + seit, [s * 0.884, 1.75, -1.07], [0.04, 0.58, 0.78], '#36596a', 'glas');
        box('seitenstufe_' + seit, [s * 1.01, 0.64, -0.28], [0.18, 0.08, 2.45], metall);
        box('spiegel_' + seit, [s * 1.02, 1.48, 0.70], [0.25, 0.16, 0.16], metall);
        box('spiegelglas_' + seit, [s * 1.155, 1.48, 0.70], [0.025, 0.11, 0.13], '#6c8a96', 'chrom');
        box('scheinwerfer_' + seit, [s * 0.70, 1.10, 2.146], [0.35, 0.23, 0.04], '#ffe2b4', 'leuchten');
        box('ruecklicht_' + seit, [s * 0.73, 1.05, -2.14], [0.27, 0.35, 0.044], '#ff4242', 'leuchten');
        box('dachreling_' + seit, [s * 0.76, 2.24, -0.60], [0.055, 0.07, 2.3], alu);
        for (const [n, z] of [['vorn', 1.34], ['hinten', -1.31]]) {
          const x = s * 0.98;
          const wid = seit + '_' + n;
          add('reifen_' + wid, 'rad', [x, 0.48, z], { durchmesser: 0.93, dicke: 0.28, achse: 'x', farbe: gummi, material: 'gummi', segmente: hoch ? 28 : 14 });
          add('felge_' + wid, 'rad', [x + s * 0.155, 0.48, z], { durchmesser: 0.55, dicke: 0.045, achse: 'x', farbe: alu, material: 'metall', segmente: hoch ? 28 : 14 });
          sphere('nabenkappe_' + wid, [x + s * 0.19, 0.48, z], 0.13, metall);
          if (hoch) for (let k = 0; k < 8; k++) {
            const a = 2 * Math.PI * k / 8;
            box('reifenprofil_' + wid + '_' + k, [x, 0.48 + 0.474 * Math.sin(a), z + 0.474 * Math.cos(a)], [0.30, 0.065, 0.12], gummi, 'gummi', null, [a * 180 / Math.PI, 0, 0]);
          }
        }
        if (hoch) for (let k = 0; k < 5; k++) box('grillrippe_' + seit + '_' + k, [s * (0.10 + k * 0.078), 1.06, 2.14], [0.028, 0.21, 0.025], alu);
      }
      if (hoch) {
        box('armaturenbrett', [0, 1.38, 0.37], [1.48, 0.12, 0.42], metall);
        box('mittelkonsole', [0, 1.02, -0.37], [0.22, 0.30, 1.20], metall);
        for (const s of [-1, 1]) {
          box('sitz_' + s, [s * 0.44, 1.19, -0.21], [0.59, 0.18, 0.58], '#293039', 'stoff');
          box('lehne_' + s, [s * 0.44, 1.54, -0.49], [0.60, 0.69, 0.19], '#293039', 'stoff');
        }
      }
    } else {
      for (const x of [-2.02, 2.02]) for (const z of [-2.02, 2.02]) {
        box('traeger_' + x + '_' + z, [x, 3.38, z], [0.27, 6.76, 0.27], metall);
        box('fundament_' + x + '_' + z, [x, 0.12, z], [0.67, 0.25, 0.67], '#7c7e7c', 'beton');
      }
      box('plattform', [0, 6.86, 0], [4.8, 0.25, 4.8], '#656d68', 'metall');
      box('wachstube', [0, 7.94, 0], [3.45, 1.95, 3.4], '#a4a49a', 'beton');
      box('dach', [0, 9.03, 0], [4.15, 0.17, 4.08], metall);
      for (const s of [-1, 1]) {
        box('fensterx_' + s, [s * 1.745, 8.02, 0], [0.06, 0.79, 2.75], '#4f7586', 'glas');
        box('fensterz_' + s, [0, 8.02, s * 1.72], [2.78, 0.79, 0.06], '#4f7586', 'glas');
        box('gelaenderx_' + s, [s * 2.30, 7.40, 0], [0.08, 1.06, 4.66], alu);
        box('gelaenderz_' + s, [0, 7.40, s * 2.30], [4.66, 1.06, 0.08], alu);
      }
      // Diagonale Verstrebungen, Geländer und Treppe von 0 auf 6,7 m.
      for (const s of [-1, 1]) for (const z of [-1, 1]) {
        box('diagonal_' + s + '_' + z, [s * 1.99, 3.42, z * 1.99], [0.14, 6.15, 0.14], alu, 'metall', null, [s * 25, 0, z * 25]);
      }
      for (let k = 0; k < 18; k++) {
        const y = 0.31 + k * 0.36, z = -1.95 + k * 0.215;
        box('treppe_' + k, [0, y, z], [1.36, 0.075, 0.34], '#646f77', 'metall');
        if (hoch) for (const s of [-1, 1]) box('treppenseite_' + s + '_' + k, [s * 0.74, y + 0.15, z], [0.065, 0.31, 0.36], alu);
      }
      box('antenne', [0.96, 9.72, -0.96], [0.065, 1.3, 0.065], alu);
      sphere('antennenkopf', [0.96, 10.41, -0.96], 0.18, licht, 'leuchten');
      cyl('scheinwerfer_schwenk', [0, 9.36, 1.73], 0.23, 0.35, metall, 'metall', null, 'z');
      box('scheinwerfer', [0, 9.36, 1.95], [0.50, 0.35, 0.30], metall);
      box('scheinwerferglas', [0, 9.36, 2.126], [0.37, 0.24, 0.035], warn, 'leuchten');
      if (hoch) for (let k = 0; k < 12; k++) box('bodenrost_' + k, [-2.05 + k * 0.37, 6.99, 0], [0.055, 0.015, 4.25], '#8c9196');
    }
    return {
      name: VORLAGEN.find(v => v.id === id).titel + (hoch ? ' Detail' : ' Mobil'),
      teile,
      bewegungen
    };
  }
  return Object.freeze({ liste: VORLAGEN, erzeugen });
});
