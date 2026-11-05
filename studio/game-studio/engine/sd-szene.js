/* SD Szene – gemeinsamer Teil von Szenen-Editor und Engine: Objektarten, Prüfung und Code-Erzeugung.
   Eine Szene ist reine Daten ({ welt, objekte }). pruefen() lässt nur bekannte Arten, Felder und Werte durch –
   deshalb kann eine Szene aus dem Mehrspieler (von anderen Spielern) kein eigenes Programm einschleusen. */
'use strict';
(function () {
/* ---------- Objektarten ---------- */
const ARTEN = {
  haus: { icon: '🏢', name: 'Haus', felder: [['breite', 'Breite', 'zahl', 10, 5, 30, 0.5], ['tiefe', 'Tiefe', 'zahl', 8, 5, 24, 0.5], ['stockwerke', 'Stockwerke', 'zahl', 2, 1, 12, 1], ['material', 'Fassade', 'wahl', 'putz', ['putz', 'ziegel', 'beton', 'holz', 'metall']], ['farbe', 'Farbe', 'farbe', '#efe4d2'], ['dach', 'Dach', 'wahl', 'flach', ['flach', 'sattel']], ['balkone', 'Balkone', 'an', false], ['dachTreppe', 'Treppe aufs Dach', 'an', false]] },
  wald: { icon: '🌳', name: 'Wald', felder: [['radius', 'Fläche (m)', 'zahl', 25, 5, 150, 1], ['anzahl', 'Bäume', 'zahl', 30, 1, 400, 1], ['art', 'Art', 'wahl', 'gemischt', ['gemischt', 'laub', 'nadel', 'palme', 'herbst', 'busch']]] },
  auto: { icon: '🚗', name: 'Fahrzeug', felder: [['typ', 'Typ', 'wahl', 'limousine', ['limousine', 'suv', 'sport', 'pickup', 'bus', 'motorrad', 'boot', 'flugzeug']], ['farbe', 'Lack', 'farbe', '#b8202a']] },
  gegner: { icon: '🎯', name: 'Gegner', felder: [['aussehen', 'Aussehen', 'wahl', 'mensch', ['mensch', 'roboter']], ['staerke', 'Stärke', 'zahl', 0.5, 0, 1, 0.05], ['waffe', 'Waffe', 'wahl', 'gewehr', ['gewehr', 'schrotflinte', 'pistole', 'scharfschuetze']], ['mission', 'Erscheint in Mission (0 = von Anfang an)', 'zahl', 0, 0, 9, 1]] },
  ziel: { icon: '🚩', name: 'Missionsziel', felder: [['mission', 'Mission Nr.', 'zahl', 1, 1, 9, 1], ['schritt', 'Schritt Nr.', 'zahl', 1, 1, 20, 1], ['art', 'Aufgabe', 'wahl', 'gehe', ['gehe', 'fahre', 'sammle']], ['text', 'Text', 'text', 'Geh hierher'], ['titel', 'Missionsname (bei Schritt 1)', 'text', 'Neue Mission'], ['belohnung', 'Belohnung 💰 (bei Schritt 1)', 'zahl', 100, 0, 2000, 10], ['zeitlimit', 'Zeitlimit s (0 = keins, bei Schritt 1)', 'zahl', 0, 0, 600, 5]], hinweis: 'Ziele mit gleicher Mission-Nr. bilden eine Mission, der Reihe nach (Schritt 1, 2, 3 …). Gegner mit dieser Mission-Nr. müssen am Ende besiegt werden.' },
  laden: { icon: '🏪', name: 'Laden', felder: [['name', 'Name', 'text', 'Laden']] },
  kiste: { icon: '📦', name: 'Kiste', felder: [['inhalt', 'Inhalt', 'wahl', 'munition', ['munition', 'medikit', 'ruestung', 'waffe:gewehr', 'waffe:schrotflinte', 'waffe:scharfschuetze']]] },
  box: { icon: '🧱', name: 'Block', felder: [['b', 'Breite', 'zahl', 4, 0.5, 40, 0.5], ['h', 'Höhe', 'zahl', 2, 0.3, 30, 0.1], ['t', 'Tiefe', 'zahl', 4, 0.5, 40, 0.5], ['textur', 'Oberfläche', 'wahl', 'beton', ['beton', 'ziegel', 'putz', 'holz', 'metall', 'platten', 'asphalt']], ['farbe', 'Tönung', 'farbe', '#ffffff'], ['masse', 'Gewicht (0 = fest)', 'zahl', 0, 0, 500, 10]] },
  fels: { icon: '🪨', name: 'Fels', felder: [['groesse', 'Größe', 'zahl', 2, 0.5, 8, 0.1]] },
  stadt: { icon: '🏙', name: 'Stadt', felder: [['bx', 'Blöcke (Breite)', 'zahl', 3, 1, 6, 1], ['bz', 'Blöcke (Tiefe)', 'zahl', 3, 1, 6, 1], ['block', 'Blockgröße', 'zahl', 54, 36, 80, 2], ['verkehr', 'Autos im Verkehr', 'zahl', 8, 0, 25, 1], ['passanten', 'Passanten', 'zahl', 12, 0, 40, 1]], hinweis: 'Vorschau: graue Klötze = Häuserblöcke. Die echten Häuser, Straßen und Laternen entstehen beim Spielen.' },
  fotohaus: { icon: '📷', name: 'Foto-Haus', felder: [['name', 'Foto-Haus', 'eigen', '', 'foto-gebaeude']] },
  modell: { icon: '🧍', name: 'Modell', felder: [['name', 'Modell (.glb)', 'eigen', '', 'modell'], ['skalierung', 'Größe', 'zahl', 1, 0.05, 20, 0.05]] },
  person: { icon: '💬', name: 'Person', felder: [['name', 'Name', 'text', 'Tony'], ['text', 'Was sie sagt (Zeilen mit | trennen)', 'langtext', 'Hallo! | Schön, dich zu sehen.'], ['oberteil', 'Kleidung', 'farbe', '#6a5a3a']], hinweis: 'Mit E ansprechen. Mehrere Sätze mit | trennen.' },
  kimodell: { icon: '🤖', name: 'KI-Modell', felder: [['name', 'KI-Bauplan (Werkstatt)', 'eigen', '', 'teile'], ['skalierung', 'Größe', 'zahl', 1, 0.05, 20, 0.05]], hinweis: 'Baupläne entstehen in der Werkstatt unter 🤖 KI-Bauplan (z. B. mit ChatGPT).' },
  spieler: { icon: '🙋', name: 'Spieler-Start', felder: [['aussehen', 'Aussehen', 'wahl', 'mensch', ['mensch', 'roboter']]], einmal: true },
};
const WELT = [['modus', 'Spielart', 'wahl', 'frei', ['frei', 'battleroyale']], ['brGegner', 'Battle Royale: Gegner', 'zahl', 20, 0, 40, 1], ['brBeute', 'Battle Royale: Beutekisten', 'zahl', 45, 0, 150, 5], ['brAbsprung', 'Battle Royale: Start mit Flugzeug und Fallschirm', 'an', true], ['musik', 'Musik', 'wahl', 'auto', ['aus', 'auto', 'ruhig', 'spannung', 'action']], ['groesse', 'Weltgröße (m) – ab 1000 m große Welt aus Kacheln', 'zahl', 400, 150, 2400, 10], ['hoehe', 'Hügel', 'zahl', 16, 0, 50, 1], ['seed', 'Gelände-Variante', 'zahl', 5, 1, 999, 1], ['wasserAn', 'Wasser', 'an', false], ['wasser', 'Wasserhöhe', 'zahl', -2, -20, 10, 0.5],
  ['stunde', 'Uhrzeit', 'zahl', 10, 0, 23.5, 0.5], ['tagMinuten', 'Minuten pro Tag (0 = Zeit steht)', 'zahl', 0, 0, 60, 1], ['regen', 'Regen', 'zahl', 0, 0, 1, 0.05], ['wind', 'Wind', 'zahl', 0.3, 0, 1, 0.05], ['gras', 'Gras', 'an', true], ['kampagne', 'Geld & Spielstand (Krankenhaus statt Spielende)', 'an', false], ['startgeld', 'Startgeld 💰', 'zahl', 100, 0, 5000, 50]];
const leer = () => ({ welt: Object.fromEntries(WELT.map(f => [f[0], f[3]])), objekte: [{ art: 'spieler', x: 0, z: 0, dreh: 0, p: { aussehen: 'mensch' } }] });

const klemme = (v, a, b) => Math.max(a, Math.min(b, v));
function wert(f, v) {   // f = [schluessel, name, art, standard, min/optionen, max, schritt]
  const [, , art, std] = f;
  if (art === 'zahl') { const n = Number(v); return Number.isFinite(n) ? klemme(n, f[4], f[5]) : std; }
  if (art === 'wahl') return f[4].includes(v) ? v : std;
  if (art === 'an') return v === true || v === false ? v : !!std;
  if (art === 'farbe') return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : std;
  if (art === 'langtext') return typeof v === 'string' ? v.replace(/['"\\<>`$\r\n\u2028\u2029]/g, '').slice(0, 400) : std;
  if (art === 'text') return typeof v === 'string' ? v.replace(/['"\\<>`$\r\n\u2028\u2029]/g, '').slice(0, 80) : std;
  if (art === 'eigen') return typeof v === 'string' && /^[\w .()-]{1,80}$/.test(v) ? v : '';
  return std;
}
/** Säubert eine Szene: unbekannte Arten/Felder fallen weg, Zahlen werden begrenzt, Texte von Sonderzeichen befreit */
function pruefen(s, o) {
  o = o || {}; s = s && typeof s === 'object' ? s : {}; const w = s.welt && typeof s.welt === 'object' ? s.welt : {}, welt = {};
  for (const f of WELT) welt[f[0]] = wert(f, w[f[0]]);
  const fm = w.formen; if (fm && typeof fm === 'object' && Number.isInteger(fm.n) && fm.n >= 8 && fm.n <= 128 && typeof fm.d === 'string' && /^[A-Za-z0-9+/=]*$/.test(fm.d) && fm.d.length <= ((fm.n + 1) * (fm.n + 1) + 2) * 4 / 3 + 4) welt.formen = { n: fm.n, d: fm.d };
  const objekte = []; let spieler = false;
  for (const x of (Array.isArray(s.objekte) ? s.objekte : []).slice(0, 600)) {
    if (!x || typeof x !== 'object' || !Object.prototype.hasOwnProperty.call(ARTEN, x.art)) continue; const def = ARTEN[x.art];
    if (def.einmal) { if (spieler) continue; spieler = true; }
    if (o.ohneEigene && def.felder.some(f => f[2] === 'eigen')) continue;
    const p = {}; for (const f of def.felder) p[f[0]] = wert(f, x.p && x.p[f[0]]);
    const zahl = (v, g) => { const n = Number(v); return Number.isFinite(n) ? +klemme(n, -g, g).toFixed(2) : 0; };
    objekte.push({ art: x.art, x: zahl(x.x, 2000), z: zahl(x.z, 2000), dreh: ((Math.round(zahl(x.dreh, 3600)) % 360) + 360) % 360, p });
  }
  if (!spieler) objekte.unshift({ art: 'spieler', x: 0, z: 0, dreh: 0, p: { aussehen: 'mensch' } });
  return { name: typeof s.name === 'string' ? s.name.replace(/[^a-z0-9-]/gi, '').slice(0, 40) : '', welt, objekte };
}
function flachListe(szene, formenGitter) { const roh = SDEngine.hoehenFunktion(Object.assign({}, szene.welt, { formen: formenGitter || szene.welt.formen })), l = [];
  for (const o of szene.objekte) { if (o.art === 'haus') l.push([o.x, o.z, Math.max(o.p.breite, o.p.tiefe) * 0.75 + 2, roh(o.x, o.z)]); if (o.art === 'fotohaus') l.push([o.x, o.z, 12, roh(o.x, o.z)]);
    if (o.art === 'stadt') { const W = o.p.bx * o.p.block + (o.p.bx + 1) * 14, D = o.p.bz * o.p.block + (o.p.bz + 1) * 14; l.push([o.x, o.z, Math.max(W, D) * 0.55 + 6, roh(o.x, o.z)]); } }
  return l.map(f => f.map(v => +v.toFixed(2))); }
function code(roh, formenGitter) {
  const txt = t => "'" + String(t || '').replace(/['\\<>`$]/g, '') + "'";
  const szene = pruefen(roh), w = szene.welt, o = szene.objekte, f = v => JSON.stringify(v).replace(/"/g, "'"), z = [];
  z.push('// Erstellt mit dem SD Szenen-Editor – du kannst hier alles weiter ändern', "sd.himmel({ zeit: 'tag' });",
    'sd.gelaende({ groesse: ' + w.groesse + ', aufloesung: ' + Math.round(w.groesse / 3.5) + ', hoehe: ' + w.hoehe + ', seed: ' + w.seed + (w.wasserAn ? ', wasser: ' + w.wasser : '') + ', flach: ' + JSON.stringify(flachListe(szene, formenGitter)) + (w.formen ? ', formen: ' + JSON.stringify(w.formen).replace(/"/g, "'") : '') + ' });');
  if (w.wasserAn) z.push('sd.wasserWellen();'); z.push('sd.tageszeit({ stunde: ' + w.stunde + ', minutenProTag: ' + w.tagMinuten + ' });', 'sd.wetter({ wind: ' + w.wind + (w.regen > 0 ? ', regen: ' + w.regen : '') + ' });'); if (w.gras) z.push('sd.gras();'); if (w.musik && w.musik !== 'aus') z.push("sd.musik('" + w.musik + "');   // 'auto' = ruhig, bei Kampf Action");
  o.forEach((x, i) => { const p = x.p, pos = '[' + x.x + ', null, ' + x.z + ']';
    if (x.art === 'haus') z.push('sd.haus({ pos: ' + pos + ', drehung: ' + x.dreh + ', breite: ' + p.breite + ', tiefe: ' + p.tiefe + ', stockwerke: ' + p.stockwerke + ", material: '" + p.material + "', farbe: '" + p.farbe + "', dach: '" + p.dach + "', balkone: " + p.balkone + ', dachTreppe: ' + p.dachTreppe + ', seed: ' + (i + 1) + ' });');
    else if (x.art === 'wald') z.push('sd.baeume({ mitte: [' + x.x + ', ' + x.z + '], bereich: ' + Math.round(p.radius * 0.8) + ', anzahl: ' + p.anzahl + ", art: '" + p.art + "', seed: " + (i + 3) + ' });');
    else if (x.art === 'auto') z.push('sd.auto({ pos: ' + pos + ', drehung: ' + x.dreh + ", typ: '" + p.typ + "', farbe: '" + p.farbe + "' });");
    else if (x.art === 'gegner' && !(p.mission > 0)) z.push('sd.gegner({ pos: ' + pos + ', staerke: ' + p.staerke + ", waffe: '" + p.waffe + "', aussehen: '" + p.aussehen + "'" + (p.aussehen === 'mensch' ? ", mensch: { oberteil: '#2a2a2a', weste: true, westeFarbe: '#5a2a2a' }" : '') + ' });');
    else if (x.art === 'person') z.push('sd.person({ pos: ' + pos + ', drehung: ' + x.dreh + ', name: ' + txt(p.name) + ', text: [' + String(p.text).split('|').map(t => t.trim()).filter(Boolean).map(txt).join(', ') + "], mensch: { oberteil: '" + p.oberteil + "' } });");
    else if (x.art === 'kimodell' && p.name) z.push("sd.teileModell('" + p.name + "', { pos: " + pos + ', drehung: ' + x.dreh + ', skalierung: ' + p.skalierung + ' });');
    else if (x.art === 'kiste') z.push('sd.kiste({ pos: ' + pos + ", inhalt: '" + p.inhalt + "' });");
    else if (x.art === 'fels') z.push('sd.fels({ pos: [' + x.x + ', sd.hoehe(' + x.x + ', ' + x.z + ') - 0.3, ' + x.z + '], groesse: ' + p.groesse + ', seed: ' + (i + 1) + ' });');
    else if (x.art === 'box') z.push('sd.box({ pos: [' + x.x + ', sd.hoehe(' + x.x + ', ' + x.z + ') + ' + (p.h / 2 + (p.masse ? 0.2 : 0)) + ', ' + x.z + '], groesse: [' + p.b + ', ' + p.h + ', ' + p.t + "], textur: '" + p.textur + "', farbe: '" + p.farbe + "', masse: " + p.masse + ', drehung: [0, ' + x.dreh + ', 0] });');
    else if (x.art === 'stadt') { z.push('sd.stadt({ mitte: [' + x.x + ', ' + x.z + '], bloecke: [' + p.bx + ', ' + p.bz + '], block: ' + p.block + ', strasse: 14, seed: ' + (i + 7) + ' });'); if (p.verkehr) z.push('sd.verkehr({ anzahl: ' + p.verkehr + ' });'); if (p.passanten) z.push('sd.passanten({ anzahl: ' + p.passanten + ' });'); }
    else if (x.art === 'fotohaus' && p.name) z.push("sd.fotoHaus('" + p.name + "', { pos: " + pos + ', drehung: ' + x.dreh + ' });');
    else if (x.art === 'modell' && p.name) z.push("{ const m = await sd.modell('" + p.name + "', { pos: [" + x.x + ', sd.hoehe(' + x.x + ', ' + x.z + '), ' + x.z + '], skalierung: ' + p.skalierung + ' }); m.wurzel.rotation.y = ' + (x.dreh * Math.PI / 180).toFixed(3) + '; }');
  });
  const sp = o.find(x => x.art === 'spieler') || { x: 0, z: 0, p: { aussehen: 'mensch' } };
  const gegnerCode = x => 'sd.gegner({ pos: [' + x.x + ', null, ' + x.z + '], staerke: ' + x.p.staerke + ", waffe: '" + x.p.waffe + "', aussehen: '" + x.p.aussehen + "'" + (x.p.aussehen === 'mensch' ? ", mensch: { oberteil: '#2a2a2a', weste: true, westeFarbe: '#5a2a2a' }" : '') + ' })';
  if (w.kampagne) z.push("const stand = sd.spielstand('szene-" + String(szene.name || 'eigen').replace(/[^a-z0-9-]/gi, '') + "', { startgeld: " + w.startgeld + ', wiederbeleben: [' + sp.x + ', ' + sp.z + '] });');
  o.filter(x => x.art === 'laden').forEach(x => z.push('sd.laden({ pos: [' + x.x + ', null, ' + x.z + '], drehung: ' + x.dreh + ', name: ' + txt(x.p.name) + ' });'));
  const nrn = [...new Set(o.filter(x => x.art === 'ziel').map(x => x.p.mission).concat(o.filter(x => x.art === 'gegner' && x.p.mission > 0).map(x => x.p.mission)))].sort((a, b) => a - b);
  for (const nr of nrn) { const ziele = o.filter(x => x.art === 'ziel' && x.p.mission === nr).sort((a, b) => a.p.schritt - b.p.schritt), erster = ziele[0] ? ziele[0].p : { titel: 'Mission ' + nr, belohnung: 100, zeitlimit: 0 }, feinde = o.filter(x => x.art === 'gegner' && x.p.mission === nr);
    const schritte = ziele.map(x => "{ art: '" + x.p.art + "', pos: [" + x.x + ', ' + x.z + '], text: ' + txt(x.p.text) + ' }');
    if (feinde.length) schritte.push("{ art: 'besiege', text: 'Besiege alle Gegner', erzeugen: () => [" + feinde.map(gegnerCode).join(', ') + '] }');
    z.push("sd.mission({ id: 'm" + nr + "', titel: " + txt(erster.titel) + (erster.zeitlimit ? ', zeitlimit: ' + erster.zeitlimit : '') + ', belohnung: { geld: ' + (erster.belohnung || 0) + ' }, schritte: [\n  ' + schritte.join(',\n  ') + '\n] });'); }
  z.push('sd.spieler({ pos: [' + sp.x + ', null, ' + sp.z + "], waffen: " + (w.modus === 'battleroyale' ? "['pistole']" : "['pistole', 'gewehr']") + ", aussehen: '" + sp.p.aussehen + "'" + (sp.p.aussehen === 'mensch' ? ", mensch: { oberteil: '#2a4a8a', weste: true }" : '') + ' });');
  if (w.modus === 'battleroyale') z.push('sd.battleRoyale({ gegner: ' + w.brGegner + ', beute: ' + w.brBeute + ', absprung: ' + w.brAbsprung + ", aussehen: '" + sp.p.aussehen + "' });   // wie PUBG: Zone, Beute, Gegner" + (w.brAbsprung ? ', Absprung' : ''));
  else if (!o.some(x => x.art === 'gegner')) z.push("sd.nachricht('Freies Spiel – erkunde deine Welt. F = Auto, Esc = Pause', 5);");
  return z.join('\n');
}

window.SDSzene = { ARTEN, WELT, leer, pruefen, flachListe, code };
})();
