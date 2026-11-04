// ═══════════════════════════════════════════════════════════════
//  INSELSTURM – Third-Person-Shooter im Battle-Royale-Stil
//  Geschrieben in SD-Skript (JavaScript + SD-API). Ändere etwas und
//  drücke „▶ Neu starten“ – z. B. mehr Gegner, andere Tageszeit.
// ═══════════════════════════════════════════════════════════════

const SEED = 2026;                 // gleiche Zahl = gleiche Insel
const GEGNER = 14;                 // Anzahl Bots
const r = sd.zufall(SEED);

// 1) Himmel und Licht:  'morgen' | 'tag' | 'abend' | 'nacht'
sd.himmel({ zeit: 'tag', nebel: 0.0024 });

// 2) Gelände: 640 × 640 m, Hügel, Meer am Rand, zwei flache Stellen für Dörfer
const doerfer = [[0, 0, 55, 2], [150, -120, 40, 6]];
sd.gelaende({ groesse: 640, aufloesung: 200, hoehe: 32, seed: SEED, wasser: -3, flach: doerfer });

// 3) Dörfer mit begehbaren Häusern
const farben = ['#cdbb9d', '#b9a68a', '#d6c9b4', '#a89a86', '#c4b08e'];
for (const [dx, dz, radius] of doerfer) {
  const anzahl = Math.floor(radius / 6);
  for (let i = 0; i < anzahl; i++) {
    const w = (i / anzahl) * Math.PI * 2, abst = radius * (0.35 + r() * 0.45);
    const x = dx + Math.cos(w) * abst, z = dz + Math.sin(w) * abst;
    sd.haus({ pos: [x, null, z], breite: 8 + r() * 5, tiefe: 7 + r() * 3, stockwerke: r() < 0.35 ? 2 : 1,
      dachTreppe: r() < 0.4, drehung: -w * 180 / Math.PI + 90, farbe: farben[i % farben.length] });
    if (r() < 0.8) sd.kiste({ pos: [x + (r() - 0.5) * 3, null, z + (r() - 0.5) * 3],
      inhalt: ['waffe:gewehr', 'munition', 'medikit', 'ruestung', 'waffe:schrotflinte'][i % 5] });
  }
  // Fässer und Kisten, die man umschießen kann (Physik)
  for (let i = 0; i < 6; i++) sd.zylinder({ pos: [dx + (r() - 0.5) * 20, sd.hoehe(dx, dz) + 3, dz + (r() - 0.5) * 20],
    radius: 0.4, hoehe: 1.1, farbe: i % 2 ? '#7a2e22' : '#2f4f6a', metall: 0.6, rauheit: 0.4, masse: 30 });
}

// 4) Natur: Wald (Instanzen, sehr schnell) und Felsen
sd.baeume({ anzahl: 420, bereich: 290, seed: SEED, minHoehe: -1, frei: doerfer.map(d => [d[0], d[1], d[2] + 8]) });
for (let i = 0; i < 45; i++) { const x = (r() - 0.5) * 540, z = (r() - 0.5) * 540;
  if (doerfer.some(d => Math.hypot(x - d[0], z - d[1]) < d[2] + 10)) continue;
  sd.fels({ pos: [x, sd.hoehe(x, z) - 0.4, z], groesse: 1 + r() * 3, seed: i + 1 }); }

// 5) Ein Militärlager auf dem Hügel mit dem Scharfschützengewehr
const lx = -170, lz = 150, ly = sd.hoehe(lx, lz);
for (const [ox, oz, w, t] of [[0, -8, 16, 1], [0, 8, 16, 1], [-8, 0, 1, 16]])
  sd.box({ pos: [lx + ox, ly + 1, lz + oz], groesse: [w, 2.4, t], farbe: '#6b6b5a' });
sd.kiste({ pos: [lx, null, lz], inhalt: 'waffe:scharfschuetze' });
sd.kiste({ pos: [lx + 3, null, lz + 2], inhalt: 'ruestung' });

// Startplatz des Spielers: trockenes Land am Südrand der Insel
const START = [-40, -230];
for (let i = 0; i < 80 && sd.hoehe(START[0], START[1]) < 1.5; i++) { START[0] += (r() - 0.5) * 30; START[1] += 3; }

// 6) Gegner verteilen (staerke 0 = leicht … 1 = schwer)
for (let i = 0; i < GEGNER; i++) {
  let w = r() * Math.PI * 2, abst = 60 + r() * 200;
  for (let v = 0; v < 30 && (sd.hoehe(Math.cos(w) * abst, Math.sin(w) * abst) < 1 || Math.hypot(Math.cos(w) * abst - START[0], Math.sin(w) * abst - START[1]) < 110); v++) { w = r() * Math.PI * 2; abst = 40 + r() * 220; }   // nicht ins Wasser, nicht neben den Spieler
  sd.gegner({ pos: [Math.cos(w) * abst, null, Math.sin(w) * abst], staerke: 0.3 + r() * 0.5 });
}

// 7) Die Zone schrumpft nach 45 s in 4 Minuten auf 25 m
sd.zone({ mitte: [20, -10], radius: 300, endRadius: 25, warte: 45, dauer: 240, schaden: 5 });

// 8) Der Spieler startet am Strand mit einer Pistole
sd.spieler({ pos: [START[0], null, START[1]], leben: 100, waffen: ['pistole'] });
sd.nachricht('Finde Waffen in den Häusern · bleib in der Zone · schalte alle Gegner aus', 6);

// 9) Eigene Logik pro Bild – hier: alle 60 s eine Durchsage
let naechste = 60;
sd.jedenFrame((dt, zeit) => {
  if (zeit > naechste) { naechste += 60; sd.meldung('📢 Noch ' + sd.bots.filter(b => !b.tot).length + ' Gegner übrig'); }
});
