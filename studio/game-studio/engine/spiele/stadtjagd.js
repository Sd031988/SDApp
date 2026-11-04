// ═══════════════════════════════════════════════════════════════
//  STADTJAGD – Open-World-Demo der SD Engine
//  Stadt mit Verkehr und Passanten, Autos zum Einsteigen (F), Tag & Nacht,
//  Regen, Wasser, Gras – und eine Gang, die sich im Nordosten verschanzt hat.
//  Ändere etwas und drücke „▶ Neu starten“.
// ═══════════════════════════════════════════════════════════════

const SEED = 77;
const r = sd.zufall(SEED);

// 1) Welt: Himmel, Gelände mit See, flache Fläche für die Stadt
sd.himmel({ zeit: 'tag', nebel: 0.0016 });
sd.gelaende({ groesse: 700, aufloesung: 160, hoehe: 24, seed: SEED, wasser: -2, flach: [[0, 0, 215, 1.5]] });
sd.wasserWellen();                                   // bewegtes Wasser im See
sd.tageszeit({ stunde: 17, minutenProTag: 10 });     // Abend → Nacht → Morgen (10 Minuten pro Tag)
sd.wetter({ wind: 0.4 });

// 2) Stadt: 4 × 4 Blöcke mit Hochhäusern in der Mitte, Parks, Laternen
const netz = sd.stadt({ mitte: [0, 0], bloecke: [4, 4], block: 54, strasse: 14, seed: SEED });
sd.verkehr({ anzahl: 12 });                          // Autos fahren selbst durch die Stadt
sd.passanten({ anzahl: 24 });                        // Menschen auf den Gehwegen

// 3) Natur rund um die Stadt
sd.baeume({ anzahl: 320, bereich: 340, seed: SEED, art: 'gemischt', minHoehe: 0, frei: [[0, 0, 225]] });
sd.baeume({ anzahl: 30, bereich: 340, seed: SEED + 1, art: 'palme', minHoehe: -1, maxHoehe: 1, frei: [[0, 0, 225]] });
sd.gras();                                           // Gras in der Nähe des Spielers (wiegt sich im Wind)

// 4) Geparkte Autos am Straßenrand – mit F einsteigen
const typen = ['sport', 'limousine', 'suv', 'pickup', 'limousine', 'sport'];
const lacke = ['#e8b020', '#b8202a', '#2a4a8a', '#3a5a3a', '#e8e8e8', '#1c1c1c'];
for (let i = 0; i < 6; i++) {
  const k = netz.knoten[3 + i * 3], quer = i % 2 === 0;
  sd.auto({ pos: [k[0] + (quer ? 14 : 4.8), null, k[1] + (quer ? 4.8 : 14)], drehung: quer ? 90 : 0, typ: typen[i], farbe: lacke[i] });
}

// 5) Die Gang im nordöstlichen Block (Menschen mit Schutzweste und Gewehr)
const gangBlock = netz.bloecke[netz.bloecke.length - 1];
for (let i = 0; i < 8; i++) {
  const w = (i / 8) * Math.PI * 2, abst = gangBlock.groesse / 2 + 4;
  sd.gegner({ pos: [gangBlock.x + Math.cos(w) * abst, null, gangBlock.z + Math.sin(w) * abst], staerke: 0.35 + r() * 0.4, name: 'Gangmitglied ' + (i + 1),
    aussehen: 'mensch', mensch: { oberteil: '#2a2a2a', hose: '#3a3226', weste: true, westeFarbe: '#5a2a2a', helm: i % 3 === 0, haut: ['#d9a77c', '#b07a52', '#7a5236'][i % 3] } });
}
for (let i = 0; i < 3; i++) sd.kiste({ pos: [netz.knoten[i * 6][0] + 9, null, netz.knoten[i * 6][1] + 9], inhalt: ['waffe:gewehr', 'ruestung', 'waffe:schrotflinte'][i] });

// 6) Spieler startet im Südwesten auf dem Gehweg
const s0 = netz.bloecke[0];
sd.spieler({ pos: [s0.x - s0.groesse / 2 + 1.5, null, s0.z - s0.groesse / 2 + 1.5], leben: 100, waffen: ['pistole'],
  aussehen: 'mensch', mensch: { oberteil: '#2a4a8a', hose: '#22262c', weste: true, westeFarbe: '#3d4433' } });
sd.nachricht('Die Gang hat sich im Nordosten verschanzt. Hol dir Waffen aus den Kisten, nimm ein Auto (F) – und räum auf.', 7);

// 7) Wetter: nach 2 Minuten zieht Regen auf, später klart es wieder auf
let regen = false;
sd.jedenFrame((dt, zeit) => {
  if (!regen && zeit > 120) { regen = true; sd.wetter({ regen: 0.7, wind: 0.8 }); sd.meldung('🌧 Es fängt an zu regnen'); }
  if (regen && zeit > 300) { regen = null; sd.wetter({ regen: 0, wind: 0.3 }); sd.meldung('☀ Der Regen hört auf'); }
});
