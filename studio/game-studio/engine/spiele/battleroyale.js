// ═══════════════════════════════════════════════════════════════
//  LUFTLANDUNG – Battle Royale wie PUBG, gebaut mit sd.battleRoyale
//  Flugzeug → abspringen (F / Leertaste) → Fallschirm → Beute suchen → Zone → Letzter gewinnt
//  Ändere die Zahlen unten und drücke „▶ Neu starten“.
// ═══════════════════════════════════════════════════════════════
const SEED = 77, r = sd.zufall(SEED);
sd.himmel({ zeit: 'tag' });
sd.tageszeit({ stunde: 16, minutenProTag: 20 });

// Insel mit drei flachen Orten
const orte = [[0, 0, 60, 3], [-220, 160, 45, 6], [210, -150, 50, 4]];
sd.gelaende({ groesse: 900, hoehe: 34, seed: SEED, wasser: -3, flach: orte });
sd.wasserWellen();

// Dörfer: begehbare Häuser mit Innentreppen und Einrichtung
const farben = ['#efe4d2', '#ffffff', '#e6d8c2', '#d9d4cc', '#c9b8a0'];
for (const [ox, oz, radius] of orte) {
  const anzahl = Math.floor(radius / 5);
  for (let i = 0; i < anzahl; i++) {
    const w = (i / anzahl) * Math.PI * 2, abst = radius * (0.3 + r() * 0.5), x = ox + Math.cos(w) * abst, z = oz + Math.sin(w) * abst;
    sd.haus({ pos: [x, null, z], breite: 9 + r() * 5, tiefe: 8 + r() * 4, stockwerke: 1 + Math.floor(r() * 3), material: r() < 0.5 ? 'putz' : 'ziegel', farbe: farben[i % 5], drehung: Math.round(-w * 180 / Math.PI + 90), dachTreppe: r() < 0.3 });
  }
}
sd.baeume({ anzahl: 700, bereich: 420, seed: SEED, art: 'gemischt', minHoehe: 1, frei: orte.map(o => [o[0], o[1], o[2] + 6]) });
sd.gras();
// ein paar Fahrzeuge an den Orten
sd.auto({ pos: [orte[0][0] + 12, null, orte[0][1] - 40], typ: 'suv', farbe: '#3a5a3a' });
sd.motorrad({ pos: [orte[1][0] + 30, null, orte[1][1]], farbe: '#d23a1a' });
sd.auto({ pos: [orte[2][0] - 35, null, orte[2][1] + 10], typ: 'pickup', farbe: '#8a6a3a' });

// Das eigentliche Spiel: 20 Gegner, 50 Kisten mit Beute, Zone, Absprung aus dem Flugzeug
sd.battleRoyale({ gegner: 20, beute: 50, aussehen: 'mensch', absprung: true, seed: SEED });
