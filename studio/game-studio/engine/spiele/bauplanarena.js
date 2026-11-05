// BAUPLAN-ARENA – neue, optionale Spielszene. Bestehende Claude-Spiele bleiben unverändert.
// Detaillierte PBR-Bauteile sind geometrische Prototypen, keine fotorealistischen 3D-Scans.
const SEED = 7628;
const zufall = sd.zufall(SEED);
const detail = (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) ? 'sparsam' : 'hoch';
if (!window.SDBauplanPakete) throw new Error('sd-bauplan-pakete.js fehlt – bitte Bauplan-Arena neu laden');

sd.himmel({ zeit: 'abend', nebel: 0.0015 });
sd.gelaende({ groesse: 420, aufloesung: 160, hoehe: 9, seed: SEED, flach: [[0, 0, 115, 4]] });
sd.baeume({ anzahl: 115, bereich: 190, art: 'gemischt', minHoehe: 1, seed: SEED, frei: [[0, 0, 110]] });

// Drei eigenständige Modelle – als Kulisse, nicht als Ersatz für das Gegner-KI-Skelett.
// Bewegliche Roboter ohne statischen Kollisionskörper; Fahrzeuge mit einfachen Kollisionen.
const pakete = window.SDBauplanPakete;
sd.teileModell(pakete.erzeugen('wachturm', { detail, farbe: '#5f6a63' }), { pos: [27, null, 15], drehung: -25 });
sd.teileModell(pakete.erzeugen('gelaendewagen', { detail, farbe: '#4f6554' }), { pos: [-24, null, 15], drehung: 38 });
sd.teileModell(pakete.erzeugen('kampfroboter', { detail, farbe: '#6d7e8e' }), { pos: [6, null, 19], drehung: 155, kollision: false });

// Spielmechanik und fahrbares Fahrzeug kommen weiterhin aus Claudes bestehender SD Engine.
sd.auto({ pos: [-14, null, -20], typ: 'suv', farbe: '#5c707b' });
for (const [x, z, d] of [[-49, 30, 0], [54, -34, 90], [40, 54, 135]]) {
  sd.haus({ pos: [x, null, z], breite: 9, tiefe: 8, stockwerke: 1, dach: 'flach', farbe: '#b4b3aa', drehung: d });
}
for (const p of [[-12, 4], [18, -8], [30, 28], [-43, 45], [53, -32], [-46, -43]]) {
  sd.kiste({ pos: [p[0], null, p[1]], inhalt: ['munition', 'medikit', 'waffe:gewehr'][Math.floor(zufall() * 3)] });
}
for (const [x, z, staerke] of [[-53, 8, 0.35], [46, -48, 0.4], [50, 48, 0.5], [-39, 58, 0.65], [57, 22, 0.55]]) {
  sd.gegner({ pos: [x, null, z], staerke, aussehen: 'roboter', roboter: { stil: 'kampf', farbe: '#667780', akzent: '#232f34', augen: '#ff9248' } });
}
sd.zone({ mitte: [0, 0], radius: 190, endRadius: 32, warte: 60, dauer: 230, schaden: 4 });
sd.spieler({ pos: [0, null, -39], leben: 100, waffen: ['pistole', 'gewehr'], aussehen: 'mensch', mensch: { oberteil: '#445a6d', weste: true } });
sd.nachricht('BAUPLAN-ARENA: Sieh dir die 3D-Modelle an, fahr den SUV und besiege die Gegner.', 9);
