/* =====================================================================
   SD Code-Studio (online) – professioneller Code-Editor im Browser
   Projekte liegen im Browser-Speicher (IndexedDB). Webseiten laufen über
   einen Vorschau-Server im Browser (vorschau-sw.js). Programme in Python,
   C, C++, C#, Java, Rust und Go laufen über den kostenlosen Dienst wandbox.org.
   ===================================================================== */
'use strict';
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* voll */ } } };
const CM_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
const S = { p: null, tabs: [], aktiv: null, docs: {}, cm: null, ta: null, offen: new Set(), swBereit: false, problemeVorschau: [], problemeProgramm: [], konsole: [], frei: false };

/* ---------------- Speicher ---------------- */
let dbP = null;
function db() {
  if (!dbP) dbP = new Promise((ok, nein) => { const r = indexedDB.open('sdCodeStudio', 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('projekte')) r.result.createObjectStore('projekte', { keyPath: 'name' }); };
    r.onsuccess = () => ok(r.result); r.onerror = () => nein(r.error); });
  return dbP;
}
async function dbTx(modus, fn) { const d = await db(); return new Promise((ok, nein) => { const t = d.transaction('projekte', modus); const os = t.objectStore('projekte'); let erg; const q = fn(os); if (q) q.onsuccess = () => { erg = q.result; }; t.oncomplete = () => ok(erg); t.onerror = () => nein(t.error); t.onabort = () => nein(t.error); }); }
const projAlle = () => dbTx('readonly', os => os.getAll());
const projLesen = name => dbTx('readonly', os => os.get(name));
const projSchreiben = p => { p.t = Date.now(); return dbTx('readwrite', os => os.put(p)); };
const projLoeschen = name => dbTx('readwrite', os => os.delete(name));

/* ---------------- kleine Helfer ---------------- */
function toast(t) { let n = $('toast'); n.textContent = t; n.classList.add('an'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('an'), 3000); }
function einst() { return store.get('sdStudioEinst', {}); }
function einstSetzen(k, v) { const e = einst(); e[k] = v; store.set('sdStudioEinst', e); }
function slug(t) { return String(t || '').trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'projekt'; }
function sicherPfad(p) { p = String(p || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim(); if (!p || p.split('/').some(x => x === '..' || x === '.')) return null; return p; }
function istBinaer(inhalt) { return typeof inhalt === 'string' && /^data:(?!text\/)[^,]*;base64,/.test(inhalt); }
function icon(p) { return /\.html?$/i.test(p) ? '🌐' : /\.(css|scss|less)$/i.test(p) ? '🎨' : /\.py$/i.test(p) ? '🐍' : /\.(m?js|jsx)$/i.test(p) ? '🟨' : /\.(ts|tsx)$/i.test(p) ? '🔷' : /\.json$/i.test(p) ? '🧩' : /\.(md|txt)$/i.test(p) ? '📄' : /\.(png|jpe?g|gif|webp|svg|ico|avif)$/i.test(p) ? '🖼' : /\.(c|cc|cpp|h|hpp)$/i.test(p) ? '⚙️' : /\.java$/i.test(p) ? '☕' : /\.cs$/i.test(p) ? '🟪' : /\.rs$/i.test(p) ? '🦀' : /\.go$/i.test(p) ? '🐹' : /\.(mp3|wav|ogg)$/i.test(p) ? '🎵' : '📃'; }
function modus(p) { const e = (p.split('.').pop() || '').toLowerCase();
  return { html: 'htmlmixed', htm: 'htmlmixed', svg: 'xml', xml: 'xml', vue: 'htmlmixed', css: 'css', scss: 'text/x-scss', less: 'text/x-less', js: 'javascript', mjs: 'javascript', jsx: 'jsx', json: { name: 'javascript', json: true },
    ts: 'text/typescript', tsx: 'text/typescript-jsx', py: 'python', c: 'text/x-csrc', h: 'text/x-csrc', cc: 'text/x-c++src', cpp: 'text/x-c++src', hpp: 'text/x-c++src', cs: 'text/x-csharp', java: 'text/x-java', kt: 'text/x-kotlin',
    rs: 'rust', go: 'go', md: 'markdown', sql: 'sql', sh: 'shell', yml: 'yaml', yaml: 'yaml', toml: 'toml', php: 'php' }[e] || 'text/plain'; }
function sprachName(p) { const e = (p || '').split('.').pop().toLowerCase(); return { html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', js: 'JavaScript', mjs: 'JavaScript', jsx: 'JSX', ts: 'TypeScript', tsx: 'TSX', json: 'JSON', py: 'Python', c: 'C', h: 'C', cc: 'C++', cpp: 'C++', hpp: 'C++', cs: 'C#', java: 'Java', rs: 'Rust', go: 'Go', md: 'Markdown', svg: 'SVG', xml: 'XML', txt: 'Text', sql: 'SQL', yml: 'YAML', yaml: 'YAML', php: 'PHP', kt: 'Kotlin' }[e] || 'Text'; }

/* ---------------- Vorlagen ---------------- */
const STIL_MODERN = `:root {
  --farbe: #6d28d9;
  --farbe2: #db2777;
  --text: #1f2937;
  --grau: #6b7280;
  --hell: #f8fafc;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, "Segoe UI", sans-serif; color: var(--text); background: var(--hell); line-height: 1.6; }
.leiste { display: flex; justify-content: space-between; align-items: center; padding: 18px 6vw; }
.logo { font-weight: 800; font-size: 1.3rem; color: var(--farbe); text-decoration: none; }
nav a { margin-left: 22px; color: var(--text); text-decoration: none; }
nav a:hover { color: var(--farbe); }
.held { padding: 12vh 6vw; background: linear-gradient(135deg, var(--farbe), var(--farbe2)); color: white; }
.held h1 { font-size: clamp(2.2rem, 6vw, 4rem); line-height: 1.1; margin: 0 0 16px; max-width: 14ch; }
.held p { font-size: 1.2rem; max-width: 45ch; opacity: .92; }
.knopf { display: inline-block; margin-top: 18px; padding: 14px 26px; border-radius: 999px; background: white; color: var(--farbe); font-weight: 700; text-decoration: none; transition: transform .2s; }
.knopf:hover { transform: translateY(-2px); }
.raster { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px; padding: 8vh 6vw; }
.karte { background: white; border-radius: 18px; padding: 26px; box-shadow: 0 10px 30px rgba(0, 0, 0, .06); }
.karte span { font-size: 2rem; }
footer { text-align: center; padding: 30px; color: var(--grau); }
@media (max-width: 600px) { nav { display: none; } }
`;
const VORLAGEN = [
  { id: 'web', label: '🌐 Webseite', info: 'HTML + CSS + JavaScript', haupt: 'index.html', dateien: {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Meine Seite</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header class="leiste">\n    <a class="logo" href="#">● Meine Seite</a>\n    <nav><a href="#angebot">Angebot</a><a href="#kontakt">Kontakt</a></nav>\n  </header>\n  <section class="held">\n    <h1>Willkommen auf meiner Seite</h1>\n    <p>Hier steht, was du anbietest – kurz, klar und freundlich.</p>\n    <a class="knopf" id="knopf" href="#angebot">Mehr erfahren</a>\n  </section>\n  <section class="raster" id="angebot">\n    <div class="karte"><span>⚡</span><h3>Schnell</h3><p>Lädt in Sekunden.</p></div>\n    <div class="karte"><span>📱</span><h3>Fürs Handy</h3><p>Sieht überall gut aus.</p></div>\n    <div class="karte"><span>💜</span><h3>Mit Liebe</h3><p>Gemacht mit dem SD Code-Studio.</p></div>\n  </section>\n  <footer id="kontakt">© <span id="jahr"></span> Meine Seite</footer>\n  <script src="script.js"></script>\n</body>\n</html>\n',
    'style.css': STIL_MODERN,
    'script.js': 'document.getElementById("jahr").textContent = new Date().getFullYear();\n\ndocument.getElementById("knopf").addEventListener("click", () => {\n  console.log("Knopf geklickt!");\n});\n' } },
  { id: 'landing', label: '🚀 Landingpage (Produkt)', info: 'Startbereich, Vorteile, Preise, FAQ', haupt: 'index.html', dateien: {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Produkt</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header class="leiste"><a class="logo" href="#">◆ Produkt</a><nav><a href="#vorteile">Vorteile</a><a href="#preise">Preise</a><a href="#faq">FAQ</a></nav></header>\n  <section class="held">\n    <h1>Die einfachste Art, mehr zu schaffen</h1>\n    <p>Ein Satz, der erklärt, warum dein Produkt das Leben leichter macht.</p>\n    <a class="knopf" href="#preise">Jetzt starten</a>\n  </section>\n  <section class="raster" id="vorteile">\n    <div class="karte"><span>🎯</span><h3>Klar</h3><p>Ohne Schnickschnack.</p></div>\n    <div class="karte"><span>🔒</span><h3>Sicher</h3><p>Deine Daten bleiben deine.</p></div>\n    <div class="karte"><span>🤝</span><h3>Hilfsbereit</h3><p>Wir antworten schnell.</p></div>\n  </section>\n  <section class="raster" id="preise">\n    <div class="karte preis"><h3>Start</h3><b>0 €</b><p>Zum Ausprobieren</p></div>\n    <div class="karte preis beliebt"><h3>Plus</h3><b>9 €</b><p>Für die meisten</p></div>\n    <div class="karte preis"><h3>Team</h3><b>29 €</b><p>Für Firmen</p></div>\n  </section>\n  <section class="faq" id="faq">\n    <h2>Häufige Fragen</h2>\n    <details><summary>Kann ich jederzeit kündigen?</summary><p>Ja, mit einem Klick.</p></details>\n    <details><summary>Gibt es eine App?</summary><p>Die Seite funktioniert auf jedem Handy.</p></details>\n  </section>\n  <footer>© Produkt</footer>\n</body>\n</html>\n',
    'style.css': STIL_MODERN + '.preis b { font-size: 2.4rem; display: block; }\n.beliebt { outline: 3px solid var(--farbe); transform: scale(1.03); }\n.faq { max-width: 720px; margin: 0 auto; padding: 4vh 6vw 10vh; }\ndetails { background: white; border-radius: 12px; padding: 14px 18px; margin: 10px 0; box-shadow: 0 4px 14px rgba(0,0,0,.05); }\nsummary { cursor: pointer; font-weight: 600; }\n' } },
  { id: 'portfolio', label: '👤 Portfolio / Lebenslauf', info: 'Über mich, Projekte, Kontakt', haupt: 'index.html', dateien: {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Mein Portfolio</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="seite">\n    <img class="foto" src="foto.svg" alt="Foto">\n    <h1>Dein Name</h1>\n    <p class="rolle">Webdesigner · Entwickler</p>\n    <p>Ein paar Sätze über dich: was du machst, was dich begeistert.</p>\n    <h2>Projekte</h2>\n    <ul class="projekte" id="projekte"></ul>\n    <a class="knopf" href="mailto:name@beispiel.de">Kontakt aufnehmen</a>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>\n',
    'style.css': 'body { margin: 0; font-family: Georgia, serif; background: #faf7f2; color: #2d2a26; }\n.seite { max-width: 680px; margin: 0 auto; padding: 8vh 24px; text-align: center; }\n.foto { width: 140px; height: 140px; border-radius: 50%; }\nh1 { font-size: 2.6rem; margin: 16px 0 0; }\n.rolle { color: #b45309; font-family: system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; font-size: .85rem; }\n.projekte { list-style: none; padding: 0; text-align: left; }\n.projekte li { background: white; border-radius: 12px; padding: 14px 18px; margin: 10px 0; box-shadow: 0 4px 14px rgba(0,0,0,.05); }\n.knopf { display: inline-block; margin-top: 20px; padding: 12px 24px; border-radius: 10px; background: #2d2a26; color: white; text-decoration: none; font-family: system-ui, sans-serif; }\n',
    'script.js': 'const projekte = [\n  { name: "Webseite für ein Café", jahr: 2026 },\n  { name: "Online-Shop", jahr: 2025 },\n  { name: "Handy-App", jahr: 2025 }\n];\n\ndocument.getElementById("projekte").innerHTML = projekte\n  .map(p => `<li><b>${p.name}</b> · ${p.jahr}</li>`)\n  .join("");\n',
    'foto.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#db2777"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="40" r="18" fill="#fff" opacity=".9"/><path d="M18 92c4-20 18-28 32-28s28 8 32 28" fill="#fff" opacity=".9"/></svg>\n' } },
  { id: 'spiel', label: '🎮 Spiel (Canvas)', info: 'Fang-den-Punkt mit Punkten', haupt: 'index.html', dateien: {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Mini-Spiel</title>\n  <style>\n    body { margin: 0; background: #0f172a; color: white; font-family: system-ui; display: grid; place-items: center; height: 100vh; }\n    canvas { background: #1e293b; border-radius: 16px; max-width: 95vw; touch-action: none; }\n  </style>\n</head>\n<body>\n  <div>\n    <h2>Punkte: <span id="punkte">0</span></h2>\n    <canvas id="feld" width="480" height="360"></canvas>\n  </div>\n  <script src="spiel.js"></script>\n</body>\n</html>\n',
    'spiel.js': 'const feld = document.getElementById("feld");\nconst ctx = feld.getContext("2d");\nlet ziel = neuesZiel(), punkte = 0;\n\nfunction neuesZiel() {\n  return { x: 30 + Math.random() * 420, y: 30 + Math.random() * 300, r: 22 };\n}\n\nfeld.addEventListener("pointerdown", e => {\n  const b = feld.getBoundingClientRect();\n  const x = (e.clientX - b.left) * feld.width / b.width;\n  const y = (e.clientY - b.top) * feld.height / b.height;\n  if (Math.hypot(x - ziel.x, y - ziel.y) < ziel.r) {\n    punkte++;\n    document.getElementById("punkte").textContent = punkte;\n    ziel = neuesZiel();\n  }\n});\n\nfunction malen(t) {\n  ctx.clearRect(0, 0, feld.width, feld.height);\n  const puls = Math.sin(t / 200) * 4;\n  ctx.beginPath();\n  ctx.arc(ziel.x, ziel.y, ziel.r + puls, 0, Math.PI * 2);\n  ctx.fillStyle = "#f472b6";\n  ctx.fill();\n  requestAnimationFrame(malen);\n}\nrequestAnimationFrame(malen);\n' } },
  { id: 'app', label: '🧮 Kleine App (Rechner)', info: 'Formular + JavaScript-Logik', haupt: 'index.html', dateien: {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Trinkgeld-Rechner</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <form class="app" id="form">\n    <h1>💶 Trinkgeld-Rechner</h1>\n    <label>Rechnung (€) <input id="betrag" type="number" step="0.01" value="42"></label>\n    <label>Trinkgeld <input id="prozent" type="range" min="0" max="25" value="10"> <b id="pz">10 %</b></label>\n    <label>Personen <input id="personen" type="number" min="1" value="2"></label>\n    <output id="ergebnis"></output>\n  </form>\n  <script src="app.js"></script>\n</body>\n</html>\n',
    'style.css': 'body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui; background: linear-gradient(135deg, #a7f3d0, #93c5fd); }\n.app { background: white; padding: 28px; border-radius: 20px; width: min(380px, 92vw); display: grid; gap: 14px; box-shadow: 0 20px 50px rgba(0,0,0,.15); }\nlabel { display: grid; gap: 6px; font-weight: 600; }\ninput[type=number] { font-size: 1.1rem; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; }\noutput { font-size: 1.4rem; background: #f1f5f9; border-radius: 12px; padding: 14px; text-align: center; }\n',
    'app.js': 'const $ = id => document.getElementById(id);\n\nfunction rechnen() {\n  const betrag = parseFloat($("betrag").value) || 0;\n  const prozent = parseInt($("prozent").value, 10);\n  const personen = Math.max(1, parseInt($("personen").value, 10) || 1);\n  const gesamt = betrag * (1 + prozent / 100);\n  $("pz").textContent = prozent + " %";\n  $("ergebnis").textContent = `Pro Person: ${(gesamt / personen).toFixed(2)} €`;\n}\n\n$("form").addEventListener("input", rechnen);\nrechnen();\n' } },
  { id: 'python', label: '🐍 Python-Programm', info: 'läuft online über wandbox.org', haupt: 'main.py', dateien: { 'main.py': 'def main():\n    namen = ["Anna", "Ben", "Cem"]\n    for i, name in enumerate(namen, 1):\n        print(f"{i}. Hallo {name}!")\n\n\nif __name__ == "__main__":\n    main()\n' } },
  { id: 'cpp', label: '⚙️ C++-Programm', info: 'läuft online über wandbox.org', haupt: 'main.cpp', dateien: { 'main.cpp': '#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> zahlen{3, 1, 4, 1, 5};\n    int summe = 0;\n    for (int z : zahlen) summe += z;\n    std::cout << "Summe: " << summe << std::endl;\n    return 0;\n}\n' } },
  { id: 'java', label: '☕ Java-Programm', info: 'läuft online über wandbox.org', haupt: 'Main.java', dateien: { 'Main.java': 'public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 3; i++) {\n            System.out.println("Hallo aus Java " + i);\n        }\n    }\n}\n' } },
  { id: 'csharp', label: '🟪 C#-Programm', info: 'läuft online über wandbox.org', haupt: 'Program.cs', dateien: { 'Program.cs': 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hallo aus C#!");\n    }\n}\n' } },
  { id: 'rust', label: '🦀 Rust-Programm', info: 'läuft online über wandbox.org', haupt: 'src/main.rs', dateien: { 'src/main.rs': 'fn main() {\n    let zahlen = vec![1, 2, 3];\n    let summe: i32 = zahlen.iter().sum();\n    println!("Rust sagt: {}", summe);\n}\n' } },
  { id: 'go', label: '🐹 Go-Programm', info: 'läuft online über wandbox.org', haupt: 'main.go', dateien: { 'main.go': 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hallo aus Go!")\n}\n' } },
  { id: 'leer', label: '📄 Leeres Projekt', info: 'ohne Dateien', haupt: null, dateien: {} }
];

/* ---------------- Projekte ---------------- */
async function projektOeffnen(name, datei) {
  const p = await projLesen(name); if (!p) { toast('Projekt nicht gefunden'); return; }
  S.p = p; S.tabs = []; S.docs = {}; S.aktiv = null; S.problemeVorschau = []; S.problemeProgramm = []; probleme();
  store.set('sdStudioLetztes', name); $('projektName').textContent = name;
  const dat = Object.keys(p.dateien).sort();
  const haupt = datei && p.dateien[datei] != null ? datei : (p.haupt && p.dateien[p.haupt] != null ? p.haupt : dat.find(d => /(^|\/)index\.html$/.test(d)) || dat.find(d => !istBinaer(p.dateien[d])) || null);
  S.offen = new Set(dat.map(d => d.split('/').slice(0, -1).join('/')).filter(Boolean).map(o => o.split('/')[0]));
  baum(); if (haupt) dateiOeffnen(haupt); else { editorLeer(); }
  tabsZeigen(); status(); projektListe();
  if (istWebProjekt()) vorschau(true); else { $('vorschau').hidden = true; }
}
async function projektNeu(vorlageId, nameVorschlag) {
  const v = VORLAGEN.find(x => x.id === vorlageId) || VORLAGEN[0];
  let name = (prompt('Name des neuen Projekts (' + v.label.replace(/^\S+\s/, '') + '):', nameVorschlag || slug(v.label.replace(/^\S+\s/, '')) ) || '').trim();
  if (!name) return; name = name.replace(/[\/\\<>:"|?*]+/g, '-');
  if (await projLesen(name)) { if (!confirm('„' + name + '“ gibt es schon. Trotzdem überschreiben?')) return; }
  await projSchreiben({ name, dateien: JSON.parse(JSON.stringify(v.dateien)), haupt: v.haupt, versionen: [], erstellt: Date.now() });
  await projektOeffnen(name); ausgabe('＋ Projekt „' + name + '“ angelegt (' + v.label + '). ▶ Ausführen oder F5 startet es.');
}
/* ---------------- Firmen-Vorlagen (fertige, professionelle One-Page-Webseiten) ---------------- */
const FIRMEN = [
  { id: 'cafe', name: 'Café', emoji: '☕', titel: 'Café Sonnenschein', slogan: 'Frisch gerösteter Kaffee, hausgemachter Kuchen und ein Lächeln.', a: '#7c4a2d', b: '#d97706', hell: '#fdf6ee', schrift: 'Georgia, "Times New Roman", serif',
    leistungen: [['☕', 'Kaffee-Spezialitäten', 'Espresso, Cappuccino, Flat White', 'ab 2,50 €'], ['🍰', 'Hausgemachter Kuchen', 'Jeden Tag frisch gebacken', 'ab 3,20 €'], ['🥐', 'Frühstück', 'Bis 12 Uhr, auch vegan', 'ab 6,90 €']],
    galerie: ['☕', '🍰', '🥐', '🫖', '🧁', '🍪'], zeiten: [['Mo–Fr', '07:30', '18:00'], ['Sa', '08:00', '17:00'], ['So', '09:00', '16:00']], knopf: 'Tisch reservieren' },
  { id: 'friseur', name: 'Friseur', emoji: '💇', titel: 'Salon Schnitt & Stil', slogan: 'Dein neuer Look – mit Zeit, Beratung und Liebe zum Detail.', a: '#111827', b: '#db2777', hell: '#fdf2f8', schrift: '"Segoe UI", system-ui, sans-serif',
    leistungen: [['✂️', 'Damenschnitt', 'Waschen, Schneiden, Föhnen', 'ab 39 €'], ['💈', 'Herrenschnitt', 'Inklusive Bartpflege', 'ab 24 €'], ['🎨', 'Farbe & Strähnen', 'Individuelle Beratung', 'ab 59 €']],
    galerie: ['💇', '💈', '✂️', '💅', '🪮', '✨'], zeiten: [['Di–Fr', '09:00', '19:00'], ['Sa', '08:00', '14:00']], knopf: 'Termin buchen' },
  { id: 'handwerk', name: 'Handwerker', emoji: '🔧', titel: 'Meisterbetrieb Müller', slogan: 'Sanitär, Heizung und Reparaturen – schnell, sauber, zuverlässig.', a: '#1e3a8a', b: '#f59e0b', hell: '#f8fafc', schrift: '"Segoe UI", system-ui, sans-serif',
    leistungen: [['🚿', 'Badsanierung', 'Planung bis Fertigstellung', 'Angebot'], ['🔥', 'Heizung', 'Wartung und Notdienst', 'ab 89 €'], ['🔧', 'Reparaturen', 'Kleine und große Aufträge', 'ab 49 €']],
    galerie: ['🔧', '🚿', '🔥', '🛠️', '🏠', '⚡'], zeiten: [['Mo–Fr', '07:00', '17:00'], ['Notdienst', '00:00', '23:59']], knopf: 'Angebot anfragen' },
  { id: 'restaurant', name: 'Restaurant', emoji: '🍝', titel: 'Trattoria Bella', slogan: 'Echte italienische Küche – wie bei Nonna zu Hause.', a: '#14532d', b: '#dc2626', hell: '#fffbeb', schrift: '"Palatino Linotype", Palatino, Georgia, serif',
    leistungen: [['🍕', 'Pizza aus dem Steinofen', 'Teig 48 Stunden gereift', 'ab 9,50 €'], ['🍝', 'Pasta fresca', 'Täglich frisch gemacht', 'ab 11,90 €'], ['🍷', 'Weine', 'Aus kleinen Weingütern', 'ab 5,50 €']],
    galerie: ['🍕', '🍝', '🍷', '🥗', '🍮', '🫒'], zeiten: [['Di–Sa', '17:00', '23:00'], ['So', '12:00', '22:00']], knopf: 'Tisch reservieren' },
  { id: 'foto', name: 'Fotograf', emoji: '📷', titel: 'Lichtblick Fotografie', slogan: 'Hochzeiten, Porträts und Firmenfotos, die Geschichten erzählen.', a: '#0f172a', b: '#a855f7', hell: '#faf5ff', schrift: '"Segoe UI", system-ui, sans-serif',
    leistungen: [['💍', 'Hochzeit', 'Ganzer Tag, alle Bilder bearbeitet', 'ab 1.290 €'], ['🙂', 'Porträt', '1 Stunde Shooting, 10 Bilder', 'ab 149 €'], ['🏢', 'Business', 'Team- und Produktfotos', 'Angebot']],
    galerie: ['📷', '💍', '🌅', '🌸', '🏙️', '🎞️'], zeiten: [['Termine', '09:00', '20:00']], knopf: 'Shooting anfragen' },
  { id: 'praxis', name: 'Praxis', emoji: '🩺', titel: 'Physiotherapie am Park', slogan: 'Wieder schmerzfrei bewegen – mit Zeit für dich.', a: '#0f766e', b: '#38bdf8', hell: '#f0fdfa', schrift: '"Segoe UI", system-ui, sans-serif',
    leistungen: [['🦴', 'Krankengymnastik', 'Alle Kassen und privat', 'Rezept'], ['💆', 'Massage', 'Klassisch und Faszien', 'ab 35 €'], ['🏃', 'Training', 'Rücken und Haltung', 'ab 25 €']],
    galerie: ['🩺', '🦴', '💆', '🏃', '🧘', '🌿'], zeiten: [['Mo–Do', '08:00', '19:00'], ['Fr', '08:00', '15:00']], knopf: 'Termin vereinbaren' },
  { id: 'verein', name: 'Verein', emoji: '⚽', titel: 'SV Grün-Weiß 1920', slogan: 'Sport, Gemeinschaft und Spaß – für alle Altersgruppen.', a: '#166534', b: '#facc15', hell: '#f7fee7', schrift: '"Trebuchet MS", Verdana, sans-serif',
    leistungen: [['⚽', 'Fußball', 'Bambini bis Senioren', 'ab 8 €/Monat'], ['🏓', 'Tischtennis', 'Training Di und Do', 'ab 6 €/Monat'], ['🎉', 'Vereinsleben', 'Feste, Ausflüge, Turniere', 'inklusive']],
    galerie: ['⚽', '🏆', '🏓', '🎉', '👟', '🥅'], zeiten: [['Training', '17:00', '21:00']], knopf: 'Probetraining' },
  { id: 'hochzeit', name: 'Hochzeit / Event', emoji: '💍', titel: 'Anna & Ben', slogan: 'Wir heiraten! Feiert mit uns am 12. Juni.', a: '#9d174d', b: '#f9a8d4', hell: '#fff1f2', schrift: 'Georgia, "Times New Roman", serif',
    leistungen: [['⛪', 'Trauung', '14:00 Uhr, Stadtkirche', ''], ['🥂', 'Empfang', '15:30 Uhr im Garten', ''], ['💃', 'Feier', 'Ab 18:00 Uhr mit Musik', '']],
    galerie: ['💍', '💐', '🥂', '🎂', '💃', '📸'], zeiten: [], knopf: 'Zusage geben' },
  { id: 'shop', name: 'Laden / Shop', emoji: '🛍️', titel: 'Kleiner Laden', slogan: 'Schöne Dinge aus der Region – handverlesen für dich.', a: '#7c2d12', b: '#fb923c', hell: '#fff7ed', schrift: '"Segoe UI", system-ui, sans-serif',
    leistungen: [['🕯️', 'Kerzen', 'Handgegossen aus Bienenwachs', 'ab 8 €'], ['🧺', 'Geschenkkörbe', 'Individuell gepackt', 'ab 25 €'], ['🍯', 'Feinkost', 'Honig, Öle, Gewürze', 'ab 4 €']],
    galerie: ['🛍️', '🕯️', '🧺', '🍯', '🎁', '🌻'], zeiten: [['Mo–Fr', '10:00', '18:30'], ['Sa', '10:00', '16:00']], knopf: 'Jetzt vorbeikommen' },
  { id: 'links', name: 'Link-Seite (Bio)', emoji: '🔗', titel: '@deinname', slogan: 'Alle meine Links an einem Ort.', a: '#4c1d95', b: '#ec4899', hell: '#faf5ff', schrift: '"Segoe UI", system-ui, sans-serif', bio: true,
    leistungen: [['📸', 'Instagram', '', ''], ['▶️', 'YouTube', '', ''], ['🎵', 'TikTok', '', ''], ['✉️', 'E-Mail schreiben', '', '']], galerie: [], zeiten: [], knopf: '' }
];
function firmaDateien(f) {
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  if (f.bio) return {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + e(f.titel) + '</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <main class="karte">\n    <div class="bild">' + f.emoji + '</div>\n    <h1>' + e(f.titel) + '</h1>\n    <p>' + e(f.slogan) + '</p>\n    <nav class="links">\n' +
      f.leistungen.map(l => '      <a href="#">' + l[0] + ' ' + e(l[1]) + '</a>').join('\n') + '\n    </nav>\n    <footer>Erstellt mit dem SD Code-Studio</footer>\n  </main>\n</body>\n</html>\n',
    'style.css': ':root {\n  --farbe: ' + f.a + ';\n  --farbe2: ' + f.b + ';\n}\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; font-family: ' + f.schrift + '; background: linear-gradient(135deg, var(--farbe), var(--farbe2)); color: #fff; }\n.karte { width: min(420px, 100%); text-align: center; }\n.bild { width: 110px; height: 110px; margin: 0 auto 14px; border-radius: 50%; display: grid; place-items: center; font-size: 52px; background: rgba(255,255,255,.2); border: 3px solid rgba(255,255,255,.6); }\nh1 { margin: 0; }\n.links { display: grid; gap: 12px; margin-top: 24px; }\n.links a { display: block; padding: 16px; border-radius: 16px; background: rgba(255,255,255,.95); color: var(--farbe); font-weight: 700; text-decoration: none; transition: transform .2s; }\n.links a:hover { transform: scale(1.03); }\nfooter { margin-top: 30px; opacity: .7; font-size: .85rem; }\n' };
  const zeitenHtml = f.zeiten.length ? '\n  <section class="bereich zeiten" id="zeiten">\n    <h2>Öffnungszeiten</h2>\n    <p class="jetzt" id="jetzt"></p>\n    <table>\n' + f.zeiten.map(z => '      <tr><td>' + e(z[0]) + '</td><td>' + z[1] + ' – ' + z[2] + ' Uhr</td></tr>').join('\n') + '\n    </table>\n  </section>' : '';
  return {
    'index.html': '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + e(f.titel) + '</title>\n  <meta name="description" content="' + e(f.slogan) + '">\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <header class="leiste">\n    <a class="logo" href="#">' + f.emoji + ' ' + e(f.titel) + '</a>\n    <button class="menue" id="menue" aria-label="Menü">☰</button>\n    <nav id="nav">\n      <a href="#leistungen">' + (f.id === 'hochzeit' ? 'Ablauf' : 'Angebot') + '</a>\n      <a href="#galerie">Galerie</a>\n' + (f.zeiten.length ? '      <a href="#zeiten">Öffnungszeiten</a>\n' : '') + '      <a href="#kontakt">Kontakt</a>\n    </nav>\n  </header>\n\n' +
      '  <section class="held">\n    <div class="held-text">\n      <h1>' + e(f.titel) + '</h1>\n      <p>' + e(f.slogan) + '</p>\n      <a class="knopf" href="#kontakt">' + e(f.knopf) + '</a>\n    </div>\n    <div class="held-bild">' + f.emoji + '</div>\n  </section>\n\n' +
      '  <section class="bereich" id="leistungen">\n    <h2>' + (f.id === 'hochzeit' ? 'Der Ablauf' : 'Unser Angebot') + '</h2>\n    <div class="raster">\n' + f.leistungen.map(l => '      <article class="karte erscheinen">\n        <span class="symbol">' + l[0] + '</span>\n        <h3>' + e(l[1]) + '</h3>\n        <p>' + e(l[2]) + '</p>\n' + (l[3] ? '        <b class="preis">' + e(l[3]) + '</b>\n' : '') + '      </article>').join('\n') + '\n    </div>\n  </section>\n\n' +
      '  <section class="bereich" id="galerie">\n    <h2>Galerie</h2>\n    <div class="galerie">\n' + f.galerie.map((g, i) => '      <div class="kachel erscheinen" style="--i:' + i + '">' + g + '</div>').join('\n') + '\n    </div>\n    <p class="hinweis">Tipp: Ersetze die Symbole durch eigene Fotos – Datei hochladen und &lt;img src="foto.jpg"&gt; einsetzen.</p>\n  </section>\n' + zeitenHtml + '\n\n' +
      '  <section class="bereich kontakt" id="kontakt">\n    <h2>Kontakt</h2>\n    <div class="raster zwei">\n      <div>\n        <p>📍 Musterstraße 1, 69117 Heidelberg</p>\n        <p>📞 <a href="tel:+490000000000">0000 000000</a></p>\n        <p>✉️ <a href="mailto:info@beispiel.de">info@beispiel.de</a></p>\n      </div>\n      <form class="formular" id="formular">\n        <input name="name" placeholder="Dein Name" required>\n        <input name="email" type="email" placeholder="Deine E-Mail" required>\n        <textarea name="nachricht" rows="4" placeholder="Deine Nachricht" required></textarea>\n        <button class="knopf" type="submit">Absenden</button>\n      </form>\n    </div>\n  </section>\n\n' +
      '  <footer>© <span id="jahr"></span> ' + e(f.titel) + ' · <a href="#">Impressum</a> · <a href="#">Datenschutz</a></footer>\n  <script src="script.js"></script>\n</body>\n</html>\n',
    'style.css': ':root {\n  --farbe: ' + f.a + ';\n  --farbe2: ' + f.b + ';\n  --hell: ' + f.hell + ';\n  --text: #1f2937;\n  --schrift: ' + f.schrift + ';\n}\n* { box-sizing: border-box; }\nhtml { scroll-behavior: smooth; }\nbody { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: var(--text); background: var(--hell); line-height: 1.6; }\nh1, h2, h3, .logo { font-family: var(--schrift); }\na { color: var(--farbe); }\n\n' +
      '.leiste { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 14px 6vw; background: rgba(255,255,255,.85); backdrop-filter: blur(10px); box-shadow: 0 1px 0 rgba(0,0,0,.06); }\n.logo { font-weight: 700; font-size: 1.2rem; text-decoration: none; color: var(--farbe); }\nnav a { margin-left: 22px; text-decoration: none; color: var(--text); font-weight: 500; }\nnav a:hover { color: var(--farbe2); }\n.menue { display: none; background: none; border: 0; font-size: 1.6rem; cursor: pointer; }\n\n' +
      '.held { display: grid; grid-template-columns: 1.3fr 1fr; align-items: center; gap: 30px; padding: 10vh 6vw; background: linear-gradient(135deg, var(--farbe), var(--farbe2)); color: #fff; }\n.held h1 { font-size: clamp(2.2rem, 6vw, 4rem); line-height: 1.1; margin: 0 0 14px; }\n.held p { font-size: 1.2rem; opacity: .92; max-width: 40ch; }\n.held-bild { font-size: clamp(6rem, 18vw, 12rem); text-align: center; filter: drop-shadow(0 20px 30px rgba(0,0,0,.3)); animation: schweben 4s ease-in-out infinite; }\n@keyframes schweben { 50% { transform: translateY(-14px); } }\n\n' +
      '.knopf { display: inline-block; margin-top: 16px; padding: 14px 28px; border: 0; border-radius: 999px; background: #fff; color: var(--farbe); font-weight: 700; text-decoration: none; cursor: pointer; font-size: 1rem; box-shadow: 0 8px 20px rgba(0,0,0,.15); transition: transform .2s; }\n.knopf:hover { transform: translateY(-2px); }\n.kontakt .knopf, .formular .knopf { background: var(--farbe); color: #fff; }\n\n' +
      '.bereich { padding: 9vh 6vw; }\n.bereich h2 { font-size: clamp(1.7rem, 4vw, 2.4rem); margin: 0 0 24px; text-align: center; }\n.raster { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 22px; max-width: 1100px; margin: 0 auto; }\n.raster.zwei { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: start; }\n.karte { background: #fff; border-radius: 20px; padding: 26px; box-shadow: 0 10px 30px rgba(0,0,0,.06); }\n.symbol { font-size: 2.4rem; }\n.preis { display: inline-block; margin-top: 6px; color: var(--farbe2); font-size: 1.15rem; }\n\n' +
      '.galerie { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; max-width: 1100px; margin: 0 auto; }\n.kachel { aspect-ratio: 1; border-radius: 18px; display: grid; place-items: center; font-size: 3.5rem; background: linear-gradient(135deg, color-mix(in srgb, var(--farbe) 18%, #fff), color-mix(in srgb, var(--farbe2) 28%, #fff)); }\n.hinweis { text-align: center; color: #6b7280; font-size: .9rem; }\n\n' +
      '.zeiten table { margin: 0 auto; border-collapse: collapse; font-size: 1.1rem; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.06); }\n.zeiten td { padding: 12px 26px; border-bottom: 1px solid #eee; }\n.jetzt { text-align: center; font-weight: 700; }\n.jetzt.offen { color: #16a34a; }\n.jetzt.zu { color: #dc2626; }\n\n' +
      '.formular { display: grid; gap: 12px; }\n.formular input, .formular textarea { padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 12px; font: inherit; }\nfooter { text-align: center; padding: 30px; color: #6b7280; }\n\n' +
      '.erscheinen { opacity: 0; transform: translateY(24px); transition: opacity .6s, transform .6s; transition-delay: calc(var(--i, 0) * 60ms); }\n.erscheinen.da { opacity: 1; transform: none; }\n\n' +
      '@media (max-width: 760px) {\n  .menue { display: block; }\n  nav { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; flex-direction: column; padding: 10px 6vw; box-shadow: 0 10px 20px rgba(0,0,0,.08); }\n  nav.offen { display: flex; }\n  nav a { margin: 8px 0; }\n  .held { grid-template-columns: 1fr; text-align: center; }\n  .held p { margin: 0 auto; }\n}\n',
    'script.js': '// Jahr im Fußbereich\ndocument.getElementById("jahr").textContent = new Date().getFullYear();\n\n// Menü auf dem Handy\nconst nav = document.getElementById("nav");\ndocument.getElementById("menue").addEventListener("click", () => nav.classList.toggle("offen"));\nnav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("offen")));\n\n// Elemente beim Scrollen sanft einblenden\nconst beobachter = new IntersectionObserver(eintraege => {\n  eintraege.forEach(e => { if (e.isIntersecting) e.target.classList.add("da"); });\n}, { threshold: 0.15 });\ndocument.querySelectorAll(".erscheinen").forEach(el => beobachter.observe(el));\n\n' +
      (f.zeiten.length ? '// „Jetzt geöffnet“ anzeigen – Tage: 0 = Sonntag … 6 = Samstag\nconst ZEITEN = ' + JSON.stringify(f.zeiten.map(z => ({ tage: tageAus(z[0]), von: z[1], bis: z[2] }))) + ';\nfunction offenJetzt() {\n  const d = new Date(), tag = d.getDay(), min = d.getHours() * 60 + d.getMinutes();\n  const m = t => { const [h, mm] = t.split(":").map(Number); return h * 60 + mm; };\n  return ZEITEN.some(z => z.tage.includes(tag) && min >= m(z.von) && min <= m(z.bis));\n}\nconst jetzt = document.getElementById("jetzt");\nif (jetzt) {\n  const offen = offenJetzt();\n  jetzt.textContent = offen ? "🟢 Jetzt geöffnet" : "🔴 Gerade geschlossen";\n  jetzt.className = "jetzt " + (offen ? "offen" : "zu");\n}\n\n' : '') +
      '// Kontaktformular: öffnet das E-Mail-Programm (für echtes Versenden einen Formular-Dienst eintragen)\ndocument.getElementById("formular").addEventListener("submit", e => {\n  e.preventDefault();\n  const f = new FormData(e.target);\n  location.href = "mailto:info@beispiel.de?subject=" + encodeURIComponent("Anfrage von " + f.get("name")) + "&body=" + encodeURIComponent(f.get("nachricht") + "\\n\\n" + f.get("email"));\n});\n' };
}
function tageAus(t) { const T = { Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6, So: 0 }; const m = /^(Mo|Di|Mi|Do|Fr|Sa|So)(?:–(Mo|Di|Mi|Do|Fr|Sa|So))?$/.exec(t); if (!m) return [0, 1, 2, 3, 4, 5, 6];
  const r = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], a = r.indexOf(m[1]), b = m[2] ? r.indexOf(m[2]) : a, aus = []; for (let i = a; ; i = (i + 1) % 7) { aus.push(T[r[i]]); if (i === b) break; } return aus; }
FIRMEN.forEach(f => VORLAGEN.splice(VORLAGEN.length - 1, 0, { id: 'firma-' + f.id, label: f.emoji + ' ' + f.name, info: 'Fertige Firmen-Webseite', haupt: 'index.html', firma: true, get dateien() { return firmaDateien(f); } }));
/* Galerie mit Live-Vorschau */
function vorschauHtml(dateien) { let h = dateien['index.html'] || ''; if (dateien['style.css']) h = h.replace(/<link rel="stylesheet" href="style.css">/, '<style>' + dateien['style.css'] + '</style>'); return h.replace(/<script src="[^"]+"><\/script>/g, '').replace('class="karte erscheinen"', 'class="karte"').replace(/erscheinen/g, 'erscheinen da'); }
function vorlagenWaehlen() {
  const box = $('galerie'); box.hidden = false; const raster = $('galRaster'); raster.innerHTML = ''; let gruppe = 'firma';
  const zeigen = () => { raster.innerHTML = ''; document.querySelectorAll('#galTabs button').forEach(b => b.classList.toggle('an', b.dataset.g === gruppe));
    VORLAGEN.filter(v => gruppe === 'firma' ? v.firma : !v.firma).forEach(v => { const k = document.createElement('button'); k.className = 'galKarte';
      const d = v.dateien, web = !!d['index.html'];
      k.innerHTML = '<div class="galBild">' + (web ? '<iframe tabindex="-1" loading="lazy" sandbox="" title=""></iframe>' : '<pre></pre>') + '</div><b></b><small></small>';
      k.querySelector('b').textContent = v.label; k.querySelector('small').textContent = v.info;
      if (web) k.querySelector('iframe').srcdoc = vorschauHtml(d); else k.querySelector('pre').textContent = (Object.values(d)[0] || 'Leeres Projekt – ganz ohne Dateien').slice(0, 400);
      k.onclick = () => { box.hidden = true; projektNeu(v.id, v.firma ? slug(v.label.replace(/^\S+\s/, '')) + '-seite' : undefined); }; raster.appendChild(k); }); requestAnimationFrame(() => raster.querySelectorAll('.galBild iframe').forEach(f => { f.style.transform = 'scale(' + (f.parentNode.clientWidth / 1280) + ')'; })); };
  document.querySelectorAll('#galTabs button').forEach(b => b.onclick = () => { gruppe = b.dataset.g; zeigen(); });
  $('galZu').onclick = () => { box.hidden = true; }; box.onclick = e => { if (e.target === box) box.hidden = true; };
  zeigen();
}

async function projektListe() { const l = (await projAlle()).sort((a, b) => b.t - a.t); const s = $('projektWahl'); s.innerHTML = '';
  l.forEach(p => { const o = document.createElement('option'); o.value = p.name; o.textContent = p.name; if (S.p && p.name === S.p.name) o.selected = true; s.appendChild(o); });
  const neu = document.createElement('option'); neu.value = '__neu'; neu.textContent = '＋ Neues Projekt …'; s.appendChild(neu); }
async function speichernJetzt() { if (!S.p) return; for (const [pfad, doc] of Object.entries(S.docs)) S.p.dateien[pfad] = doc.getValue ? doc.getValue() : doc.wert; await projSchreiben(S.p); S.geaendert = false; status(); }
let speicherT = null;
function speichernBald() { S.geaendert = true; status(); clearTimeout(speicherT); speicherT = setTimeout(async () => { await speichernJetzt(); if (einst().live !== false && istWebDatei(S.aktiv) && !$('vorschau').hidden) vorschau(false); }, 450); }
function istWebDatei(p) { return /\.(html?|css|m?js|json|svg)$/i.test(p || ''); }
function istWebProjekt() { if (!S.p) return false; const d = Object.keys(S.p.dateien); return d.some(x => /\.html?$/i.test(x)) && !(S.aktiv && programmSprache(S.aktiv)); }

/* ---------------- Editor ---------------- */
function editorLaden() {
  return new Promise(ok => {
    const lade = (u, css) => new Promise((ja, nein) => { const e = document.createElement(css ? 'link' : 'script'); if (css) { e.rel = 'stylesheet'; e.href = u; } else e.src = u; e.onload = ja; e.onerror = nein; document.head.appendChild(e); });
    const opt = u => lade(CM_BASE + u + '.min.js').catch(() => {});
    lade(CM_BASE + 'codemirror.min.css', true).then(() => lade(CM_BASE + 'codemirror.min.js'))
      .then(() => Promise.all(['mode/clike/clike', 'mode/rust/rust', 'mode/go/go', 'mode/python/python', 'mode/javascript/javascript', 'mode/xml/xml', 'mode/css/css', 'mode/toml/toml', 'mode/shell/shell', 'mode/sql/sql', 'mode/markdown/markdown', 'mode/yaml/yaml',
        'addon/search/searchcursor', 'addon/dialog/dialog', 'addon/edit/matchbrackets', 'addon/edit/closebrackets', 'addon/selection/active-line', 'addon/comment/comment', 'addon/fold/foldcode', 'addon/hint/show-hint', 'addon/edit/matchtags', 'addon/display/placeholder'].map(opt)))
      .then(() => Promise.all(['mode/htmlmixed/htmlmixed', 'mode/jsx/jsx', 'mode/php/php', 'addon/search/search', 'addon/search/jump-to-line', 'addon/edit/closetag', 'addon/fold/foldgutter', 'addon/fold/brace-fold', 'addon/fold/indent-fold', 'addon/fold/xml-fold', 'addon/hint/anyword-hint', 'addon/hint/javascript-hint', 'addon/hint/css-hint', 'addon/hint/xml-hint', 'addon/hint/html-hint'].map(opt)))
      .then(() => Promise.all(['theme/material-darker', 'addon/dialog/dialog', 'addon/fold/foldgutter', 'addon/hint/show-hint'].map(u => lade(CM_BASE + u + '.min.css', true).catch(() => {}))))
      .then(() => ok(!!window.CodeMirror)).catch(() => ok(false));
  });
}
function editorBauen(mitCM) {
  const box = $('editor');
  if (mitCM) {
    S.cm = CodeMirror(box, { value: '', lineNumbers: true, indentUnit: 2, tabSize: 2, theme: 'material-darker', autoCloseBrackets: true, matchBrackets: true, autoCloseTags: true, matchTags: { bothTags: true }, styleActiveLine: true, foldGutter: true,
      lineWrapping: !!einst().umbruch, gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'], placeholder: 'Hier Code schreiben oder einfügen …',
      extraKeys: { Tab: c => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection(' '.repeat(c.getOption('indentUnit'))), 'Shift-Tab': c => c.indentSelection('subtract'),
        'Ctrl-/': 'toggleComment', 'Cmd-/': 'toggleComment', 'Ctrl-Space': 'autocomplete', 'Ctrl-H': 'replace', 'Ctrl-G': 'jumpToLine', 'Alt-Up': 'swapLineUp', 'Alt-Down': 'swapLineDown',
        'Ctrl-D': c => { const s = c.getCursor(); c.replaceRange(c.getLine(s.line) + '\n', { line: s.line, ch: 0 }); }, 'Shift-Alt-F': () => formatieren() } });
    S.cm.on('change', (c, ch) => { if (ch.origin !== 'setValue' && S.aktiv) { S.p.dateien[S.aktiv] = c.getValue(); tabsZeigen(); speichernBald(); } farbChipsBald(); });
    S.cm.on('cursorActivity', status); S.cm.on('viewportChange', farbChipsBald);
    S.cm.on('inputRead', (c, ch) => { if (einst().vorschlaege === false) return; const t = ch.text[0]; const m = c.getMode().name; if (/^[a-zA-Z]$/.test(t) && !c.state.completionActive && /css|javascript|xml/.test(m)) { const tok = c.getTokenAt(c.getCursor()); if (tok.string.length >= 2) c.showHint({ completeSingle: false }); } });
    S.cm.on('paste', (c, e) => { const t = e.clipboardData && e.clipboardData.getData('text'); if (t && abIstAnleitung(t)) { e.preventDefault(); einfuegenDialog(t); } });
  } else {
    S.ta = document.createElement('textarea'); S.ta.className = 'roh'; S.ta.spellcheck = false; box.appendChild(S.ta);
    S.ta.oninput = () => { if (S.aktiv) { S.p.dateien[S.aktiv] = S.ta.value; tabsZeigen(); speichernBald(); } };
    S.ta.addEventListener('paste', e => { const t = e.clipboardData && e.clipboardData.getData('text'); if (t && abIstAnleitung(t)) { e.preventDefault(); einfuegenDialog(t); } });
  }
  schrift(0);
}
function editorLeer() { $('leer').hidden = false; if (S.cm) S.cm.getWrapperElement().style.display = 'none'; if (S.ta) S.ta.style.display = 'none'; $('bildAnsicht').hidden = true; }
function dateiOeffnen(pfad, zeile) {
  if (!S.p || S.p.dateien[pfad] == null) return;
  if (!S.tabs.includes(pfad)) S.tabs.push(pfad);
  S.aktiv = pfad; $('leer').hidden = true;
  const inhalt = S.p.dateien[pfad];
  if (istBinaer(inhalt) || /\.(png|jpe?g|gif|webp|ico|avif)$/i.test(pfad)) {
    if (S.cm) S.cm.getWrapperElement().style.display = 'none'; if (S.ta) S.ta.style.display = 'none';
    const b = $('bildAnsicht'); b.hidden = false; b.innerHTML = '<img alt=""><p></p>'; b.querySelector('img').src = inhalt; b.querySelector('p').textContent = pfad + ' · ' + Math.round(inhalt.length * 0.75 / 1024) + ' KB';
  } else {
    $('bildAnsicht').hidden = true;
    if (S.cm) { S.cm.getWrapperElement().style.display = '';
      if (!S.docs[pfad]) { S.docs[pfad] = CodeMirror.Doc(inhalt, modus(pfad)); }
      if (S.cm.getDoc() !== S.docs[pfad]) S.cm.swapDoc(S.docs[pfad]);
      const iu = /\.(py|java|cs|go|rs|c|cpp|cc|h|hpp|kt)$/i.test(pfad) ? 4 : 2; S.cm.setOption('indentUnit', iu); S.cm.setOption('tabSize', iu);
      setTimeout(() => { S.cm.refresh(); S.cm.focus(); if (zeile) { S.cm.setCursor({ line: zeile - 1, ch: 0 }); S.cm.scrollIntoView({ line: zeile - 1, ch: 0 }, 120); S.cm.addLineClass(zeile - 1, 'background', 'blitz'); setTimeout(() => S.cm.removeLineClass(zeile - 1, 'background', 'blitz'), 1400); } farbChips(); }, 10);
    } else { S.ta.style.display = ''; S.ta.value = inhalt; S.docs[pfad] = { wert: inhalt, getValue: () => S.p.dateien[pfad] }; }
  }
  tabsZeigen(); baumMarkieren(); status();
}
function tabZu(pfad) { const i = S.tabs.indexOf(pfad); if (i < 0) return; S.tabs.splice(i, 1); delete S.docs[pfad];
  if (S.aktiv === pfad) { const n = S.tabs[Math.max(0, i - 1)]; if (n) dateiOeffnen(n); else { S.aktiv = null; editorLeer(); } } tabsZeigen(); status(); }
function tabsZeigen() { const box = $('tabs'); box.innerHTML = ''; S.tabs.forEach(p => { const t = document.createElement('div'); t.className = 'tab' + (p === S.aktiv ? ' an' : ''); t.title = p;
    t.innerHTML = '<span></span><button title="Schließen (Strg+W)">×</button>'; t.querySelector('span').textContent = icon(p) + ' ' + p.split('/').pop();
    t.onclick = e => { if (e.target.tagName === 'BUTTON') tabZu(p); else dateiOeffnen(p); }; t.onauxclick = e => { if (e.button === 1) tabZu(p); }; box.appendChild(t); }); }

/* ---------------- Dateibaum ---------------- */
function baum() {
  const box = $('baum'); box.innerHTML = ''; if (!S.p) return;
  const dateien = Object.keys(S.p.dateien).sort((a, b) => { const A = a.split('/'), B = b.split('/'); for (let i = 0; i < Math.min(A.length, B.length); i++) { if (A[i] !== B[i]) { const aO = i < A.length - 1, bO = i < B.length - 1; if (aO !== bO) return aO ? -1 : 1; return A[i].localeCompare(B[i]); } } return A.length - B.length; });
  const gezeigt = new Set();
  dateien.forEach(d => { const teile = d.split('/');
    for (let i = 0; i < teile.length - 1; i++) { const o = teile.slice(0, i + 1).join('/'); if (gezeigt.has(o)) continue; const eltern = teile.slice(0, i).join('/'); if (i && !S.offen.has(eltern)) break; gezeigt.add(o);
      const z = zeile((S.offen.has(o) ? '📂 ' : '📁 ') + teile[i], i, 'ordner'); z.dataset.ordner = o; z.onclick = e => { if (e.target.tagName === 'BUTTON') return; S.offen.has(o) ? S.offen.delete(o) : S.offen.add(o); baum(); };
      knoepfe(z, [['＋', 'Neue Datei in diesem Ordner', () => neueDatei(o + '/')], ['✎', 'Umbenennen', () => umbenennen(o, true)], ['🗑', 'Löschen', () => loeschen(o, true)]]); box.appendChild(z); }
    const ordner = teile.slice(0, -1).join('/'); if (ordner && !teile.slice(0, -1).every((_, i) => S.offen.has(teile.slice(0, i + 1).join('/')))) return;
    if (/(^|\/)\.gitkeep$/.test(d)) return;
    const z = zeile(icon(d) + ' ' + teile[teile.length - 1], teile.length - 1, 'datei'); z.dataset.pfad = d; z.onclick = e => { if (e.target.tagName !== 'BUTTON') dateiOeffnen(d); };
    knoepfe(z, [['✎', 'Umbenennen', () => umbenennen(d)], ['🗑', 'Löschen', () => loeschen(d)]]); box.appendChild(z); });
  if (!dateien.length) box.innerHTML = '<div class="hinweis">Noch keine Dateien. ＋ Datei, 📋 Einfügen oder ⬆ Hochladen.</div>';
  baumMarkieren();
}
function zeile(text, tiefe, art) { const z = document.createElement('div'); z.className = 'bz ' + art; z.style.paddingLeft = (8 + tiefe * 14) + 'px'; const s = document.createElement('span'); s.textContent = text; z.appendChild(s); return z; }
function knoepfe(z, liste) { const k = document.createElement('i'); k.className = 'bk'; liste.forEach(([t, ti, fn]) => { const b = document.createElement('button'); b.textContent = t; b.title = ti; b.onclick = e => { e.stopPropagation(); fn(); }; k.appendChild(b); }); z.appendChild(k); }
function baumMarkieren() { document.querySelectorAll('#baum .bz.datei').forEach(z => z.classList.toggle('an', z.dataset.pfad === S.aktiv)); }
async function neueDatei(vorne) {
  if (!S.p) { await projektNeu('leer'); if (!S.p) return; }
  const p = sicherPfad(prompt('Name der neuen Datei (mit Ordner möglich, z. B. css/stil.css):', vorne || '')); if (!p) return;
  if (S.p.dateien[p] != null) { dateiOeffnen(p); return; }
  S.p.dateien[p] = vorlageFuer(p); await projSchreiben(S.p); const o = p.split('/').slice(0, -1); o.forEach((_, i) => S.offen.add(o.slice(0, i + 1).join('/'))); baum(); dateiOeffnen(p);
}
function vorlageFuer(p) { if (/\.html?$/i.test(p)) return '<!doctype html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>' + esc(p.split('/').pop().replace(/\.html?$/, '')) + '</title>\n</head>\n<body>\n  \n</body>\n</html>\n'; return ''; }
async function umbenennen(alt, istOrdner) {
  const neu = sicherPfad(prompt('Neuer Name:', alt)); if (!neu || neu === alt) return;
  const d = S.p.dateien, map = {};
  Object.keys(d).forEach(k => { if (istOrdner ? k.startsWith(alt + '/') : k === alt) map[k] = istOrdner ? neu + k.slice(alt.length) : neu; });
  if (Object.values(map).some(n => d[n] != null && !map[n])) { alert('Dort gibt es schon eine Datei mit diesem Namen.'); return; }
  await speichernJetzt();
  Object.entries(map).forEach(([a, n]) => { d[n] = d[a]; delete d[a]; const i = S.tabs.indexOf(a); if (i >= 0) S.tabs[i] = n; if (S.docs[a]) { S.docs[n] = S.docs[a]; delete S.docs[a]; } if (S.aktiv === a) S.aktiv = n; });
  await projSchreiben(S.p); baum(); tabsZeigen(); status(); ausgabe('✎ Umbenannt: ' + alt + ' → ' + neu);
}
async function loeschen(pfad, istOrdner) {
  const betroffen = Object.keys(S.p.dateien).filter(k => istOrdner ? k.startsWith(pfad + '/') : k === pfad);
  if (!confirm((istOrdner ? 'Ordner „' + pfad + '“ mit ' + betroffen.length + ' Datei(en)' : '„' + pfad + '“') + ' löschen?\n\nVorher wird automatisch eine Version gespeichert – in 🕘 Versionen kannst du alles zurückholen.')) return;
  await versionNeu('Vor dem Löschen von ' + pfad, true);
  betroffen.forEach(k => { delete S.p.dateien[k]; if (S.tabs.includes(k)) tabZu(k); });
  await projSchreiben(S.p); baum(); ausgabe('🗑 Gelöscht: ' + pfad + ' (in 🕘 Versionen wiederherstellbar)');
}
async function hochladen(dateien) {
  if (!S.p) { await projektNeu('leer', 'hochgeladen'); if (!S.p) return; }
  let n = 0;
  for (const f of dateien) { const pfad = sicherPfad(f.webkitRelativePath ? f.webkitRelativePath.split('/').slice(1).join('/') : f.name); if (!pfad || f.size > 8e6) continue;
    if (/\.zip$/i.test(f.name)) { n += await zipEinlesen(f); continue; }
    S.p.dateien[pfad] = await dateiLesen(f); n++; }
  await projSchreiben(S.p); baum(); ausgabe('⬆ ' + n + ' Datei(en) hinzugefügt.');
  if (istWebProjekt()) vorschau(true);
}
function dateiLesen(f) { return new Promise(ok => { const r = new FileReader(); const text = /^text\/|json|javascript|xml|svg/.test(f.type) || /\.(html?|css|js|mjs|ts|tsx|jsx|json|md|txt|py|java|cs|c|cc|cpp|h|hpp|rs|go|kt|php|rb|sql|yml|yaml|toml|svg|xml|csv|env|gitignore|vue|svelte)$/i.test(f.name);
  r.onload = () => ok(r.result); if (text) r.readAsText(f); else r.readAsDataURL(f); }); }

/* ---------------- ZIP (ohne Bibliothek) ---------------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipBauen(dateien) {
  const enc = new TextEncoder(), teile = [], zentral = []; let off = 0;
  for (const [pfad, inhalt] of Object.entries(dateien)) {
    let daten; if (istBinaer(inhalt)) { const b = atob(inhalt.split(',')[1]); daten = Uint8Array.from(b, c => c.charCodeAt(0)); } else daten = enc.encode(inhalt);
    const name = enc.encode(pfad), crc = crc32(daten), h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, crc, true); h.setUint32(18, daten.length, true); h.setUint32(22, daten.length, true); h.setUint16(26, name.length, true);
    teile.push(new Uint8Array(h.buffer), name, daten);
    const z = new DataView(new ArrayBuffer(46)); z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint32(16, crc, true); z.setUint32(20, daten.length, true); z.setUint32(24, daten.length, true); z.setUint16(28, name.length, true); z.setUint32(42, off, true);
    zentral.push(new Uint8Array(z.buffer), name); off += 30 + name.length + daten.length;
  }
  const zLaenge = zentral.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, Object.keys(dateien).length, true); e.setUint16(10, Object.keys(dateien).length, true); e.setUint32(12, zLaenge, true); e.setUint32(16, off, true);
  return new Blob([...teile, ...zentral, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
async function zipEinlesen(f) {
  const buf = new Uint8Array(await f.arrayBuffer()), dv = new DataView(buf.buffer); let ende = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { ende = i; break; }
  if (ende < 0) { alert('Das ist keine gültige ZIP-Datei.'); return 0; }
  const anzahl = dv.getUint16(ende + 10, true); let p = dv.getUint32(ende + 16, true), n = 0; const dec = new TextDecoder();
  const namen = [];
  for (let i = 0; i < anzahl; i++) { const art = dv.getUint16(p + 10, true), gr = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), kl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    namen.push({ name: dec.decode(buf.subarray(p + 46, p + 46 + nl)), art, gr, lo }); p += 46 + nl + xl + kl; }
  const gemeinsam = (() => { const erste = namen.filter(x => !x.name.endsWith('/')).map(x => x.name.split('/')[0]); return erste.length && erste.every(x => x === erste[0]) && namen.every(x => x.name.includes('/')) ? erste[0] + '/' : ''; })();
  for (const z of namen) { if (z.name.endsWith('/') || /(^|\/)(__MACOSX|\.git|node_modules)\//.test(z.name)) continue;
    const pfad = sicherPfad(z.name.slice(gemeinsam.length)); if (!pfad) continue;
    const nl = dv.getUint16(z.lo + 26, true), xl = dv.getUint16(z.lo + 28, true), start = z.lo + 30 + nl + xl;
    let daten = buf.subarray(start, start + z.gr);
    if (z.art === 8) { try { daten = new Uint8Array(await new Response(new Blob([daten]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); } catch (e) { continue; } }
    else if (z.art !== 0) continue;
    const textArt = /\.(html?|css|js|mjs|ts|tsx|jsx|json|md|txt|py|java|cs|c|cc|cpp|h|hpp|rs|go|kt|php|rb|sql|ya?ml|toml|svg|xml|csv|env|gitignore|vue|svelte|lock)$/i.test(pfad) || !/\./.test(pfad.split('/').pop());
    if (textArt) S.p.dateien[pfad] = dec.decode(daten);
    else { let s = ''; for (let i = 0; i < daten.length; i += 0x8000) s += String.fromCharCode.apply(null, daten.subarray(i, i + 0x8000)); S.p.dateien[pfad] = 'data:' + (mimeVon(pfad)) + ';base64,' + btoa(s); }
    n++; }
  return n;
}
function mimeVon(p) { const e = (p.split('.').pop() || '').toLowerCase(); return { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon', avif: 'image/avif', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', mp4: 'video/mp4', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', pdf: 'application/pdf' }[e] || 'application/octet-stream'; }
function herunterladen(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
async function zipExport() { if (!S.p) return; await speichernJetzt(); herunterladen(zipBauen(S.p.dateien), slug(S.p.name) + '.zip'); toast('⬇ ' + slug(S.p.name) + '.zip gespeichert (Downloads)'); }
async function einzelHtml() {
  if (!S.p) return; await speichernJetzt(); const d = S.p.dateien; const start = Object.keys(d).find(x => /(^|\/)index\.html$/.test(x)) || Object.keys(d).find(x => /\.html?$/.test(x));
  if (!start) { alert('In diesem Projekt gibt es keine HTML-Datei.'); return; }
  herunterladen(new Blob([htmlZusammenbauen(start)], { type: 'text/html' }), slug(S.p.name) + '.html'); toast('⬇ Eine einzige HTML-Datei mit allem drin gespeichert');
}

/* ---------------- Vorschau ---------------- */
async function swStarten() {
  if (!('serviceWorker' in navigator)) return false;
  try { const reg = await navigator.serviceWorker.register('vorschau-sw.js', { scope: 'vorschau/' });
    const w = reg.installing || reg.waiting || reg.active; if (w && w.state !== 'activated') await new Promise(ok => { w.addEventListener('statechange', () => { if (w.state === 'activated') ok(); }); setTimeout(ok, 4000); });
    S.swBereit = !!(reg.active || w); return S.swBereit; } catch (e) { return false; }
}
function relAufloesen(basis, ref) { if (/^(https?:|data:|blob:|mailto:|tel:|#|\/\/|javascript:)/i.test(ref)) return null; const t = (basis.includes('/') ? basis.slice(0, basis.lastIndexOf('/') + 1) : '') + ref.split(/[?#]/)[0]; const out = []; t.split('/').forEach(x => { if (x === '..') out.pop(); else if (x && x !== '.') out.push(x); }); return out.join('/'); }
function htmlZusammenbauen(start) {   // für die Einzeldatei und als Notlösung ohne Service Worker
  const d = S.p.dateien; let h = d[start];
  h = h.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (m, href) => { if (!/stylesheet/i.test(m)) return m; const p = relAufloesen(start, href); return p && d[p] != null ? '<style>/* ' + p + ' */\n' + d[p] + '\n</style>' : m; });
  h = h.replace(/<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (m, a, src, b) => { const p = relAufloesen(start, src); return p && d[p] != null ? '<script' + a + b + '>/* ' + p + ' */\n' + d[p].replace(/<\/script/gi, '<\\/script') + '\n<\/script>' : m; });
  h = h.replace(/(src|href)=["']([^"']+\.(?:png|jpe?g|gif|webp|svg|ico|avif))["']/gi, (m, attr, ref) => { const p = relAufloesen(start, ref); if (!p || d[p] == null) return m; const v = d[p]; return attr + '="' + (istBinaer(v) ? v : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(v)) + '"'; });
  return h;
}
function startSeite() { const d = Object.keys(S.p.dateien); if (S.aktiv && /\.html?$/i.test(S.aktiv)) return S.aktiv; return d.find(x => x === 'index.html') || d.find(x => /(^|\/)index\.html$/.test(x)) || d.find(x => /\.html?$/i.test(x)); }
async function vorschau(neu) {
  if (!S.p) return; const start = startSeite(); if (!start) { $('vorschau').hidden = true; return; }
  await speichernJetzt(); $('vorschau').hidden = false; S.problemeVorschau = []; probleme(); if (neu) S.konsole = [];
  const f = $('frame');
  if (S.swBereit) { const url = 'vorschau/' + encodeURIComponent(S.p.name) + '/' + start.split('/').map(encodeURIComponent).join('/');
    if (neu || !f.src.includes('/vorschau/') || !f.src.includes('/vorschau/' + encodeURIComponent(S.p.name) + '/')) { f.removeAttribute('srcdoc'); f.src = url; } else { try { f.contentWindow.location.reload(); } catch (e) { f.src = url; } }
    $('url').value = new URL(url, location.href).pathname.replace(/^.*\/vorschau\//, '/'); }
  else { f.removeAttribute('src'); f.srcdoc = htmlZusammenbauen(start); $('url').value = '/' + start + ' (einfache Vorschau)'; }
  if (neu) konfetti();
}
window.addEventListener('message', e => { const m = e.data; if (!m || !m.sdVorschau || e.source !== $('frame').contentWindow) return;
  S.konsole.push(m); if (S.konsole.length > 300) S.konsole.shift(); konsoleZeigen();
  if (m.typ === 'fehler' || m.typ === 'error') { const s = /\(([^():]+):(\d+)\)\s*$/.exec(m.text); S.problemeVorschau.push({ text: m.text, datei: s ? s[1] : null, zeile: s ? +s[2] : null }); probleme(); } });
function konsoleZeigen() { const box = $('konsoleAus'); if (!box) return; box.innerHTML = ''; S.konsole.slice(-200).forEach(m => { const z = document.createElement('div'); z.className = 'kz ' + m.typ; z.textContent = ({ error: '⨯ ', fehler: '⨯ ', warn: '⚠ ', ergebnis: '← ' }[m.typ] || '') + m.text; box.appendChild(z); }); box.scrollTop = box.scrollHeight;
  const n = S.konsole.filter(m => m.typ === 'error' || m.typ === 'fehler').length; $('konsoleAnz').textContent = n ? n : ''; }
function geraet(w) { $('frame').style.width = w; document.querySelectorAll('#geraete button').forEach(b => b.classList.toggle('an', b.dataset.w === w)); }

/* ---------------- Programme über wandbox.org ---------------- */
const WB = 'https://wandbox.org/api/', WB_STD = { cpp: 'gcc-13.2.0', c: 'gcc-13.2.0-c', csharp: 'mono-6.12.0.199', java: 'openjdk-jdk-21+35', rust: 'rust-1.82.0', go: 'go-1.23.2', python: 'cpython-3.12.7' };
const SPR = { cpp: 'C++', c: 'C', csharp: 'C#', java: 'Java', rust: 'Rust', go: 'Go', python: 'Python' };
let wbListe = null, wbKette = Promise.resolve();
function programmSprache(p) { const e = (p || '').split('.').pop().toLowerCase(); return { py: 'python', c: 'c', cc: 'cpp', cpp: 'cpp', cxx: 'cpp', cs: 'csharp', java: 'java', rs: 'rust', go: 'go' }[e] || null; }
async function wbCompiler(sp) { if (!wbListe) wbListe = fetch(WB + 'list.json').then(r => r.json()).catch(() => []); const l = await wbListe;
  const regel = { cpp: x => x.language === 'C++' && /^gcc-\d/.test(x.name), c: x => x.language === 'C' && /^gcc-\d/.test(x.name), csharp: x => x.language === 'C#' && /^mono-/.test(x.name), java: x => x.language === 'Java' && /^openjdk-/.test(x.name), rust: x => x.language === 'Rust' && /^rust-\d/.test(x.name), go: x => x.language === 'Go' && /^go-\d/.test(x.name), python: x => x.language === 'Python' && /^cpython-3\.\d+\.\d+$/.test(x.name) }[sp];
  const f = Array.isArray(l) && regel ? l.find(regel) : null; return f ? f.name : WB_STD[sp]; }
function wbSenden(body) { const lauf = wbKette.then(async () => { for (let i = 0; i < 4; i++) { const r = await fetch(WB + 'compile.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const tx = await r.text();
    if (/^Error: Too many/i.test(tx) || r.status === 429) { await new Promise(ok => setTimeout(ok, 2500 * (i + 1))); continue; } try { return JSON.parse(tx); } catch (e) { throw new Error('Online-Compiler antwortet nicht richtig: ' + tx.slice(0, 120)); } }
    throw new Error('Online-Compiler ist gerade überlastet – bitte gleich nochmal.'); }); wbKette = lauf.catch(() => {}); return lauf; }
async function programmStarten() {
  const sp = programmSprache(S.aktiv); await speichernJetzt();
  if (!store.get('sdStudioWbOk', false)) { if (!confirm('▶ Programme in ' + SPR[sp] + ' werden kostenlos über den Online-Dienst wandbox.org gebaut und ausgeführt.\nDafür wird dein Code dorthin geschickt.\n\nEinverstanden?')) return; store.set('sdStudioWbOk', true); }
  const d = S.p.dateien, alle = Object.keys(d).filter(x => programmSprache(x) === sp || (sp === 'cpp' && /\.(h|hpp)$/.test(x)) || (sp === 'c' && /\.h$/.test(x)));
  let haupt = S.aktiv; const t = d[haupt];
  const mainRe = { cpp: /\bint\s+main\s*\(/, c: /\bint\s+main\s*\(/, java: /static\s+void\s+main\s*\(/, csharp: /static\s+(async\s+)?\S+\s+Main\s*\(/, rust: /fn\s+main\s*\(/, go: /func\s+main\s*\(/, python: /./ }[sp];
  if (!mainRe.test(t)) haupt = alle.find(x => mainRe.test(d[x])) || haupt;
  const basis = haupt.includes('/') ? haupt.slice(0, haupt.lastIndexOf('/') + 1) : '';
  const neben = alle.filter(n => n !== haupt && n.startsWith(basis)).map(n => ({ file: n.slice(basis.length), code: d[n] }));
  let code = d[haupt]; if (sp === 'java') code = code.replace(/\bpublic\s+((?:final\s+|abstract\s+)?class\s+)/, '$1');
  const roh = []; if (sp === 'cpp' || sp === 'c' || sp === 'csharp') neben.filter(f => /\.(c|cc|cpp|cxx|cs)$/.test(f.file)).forEach(f => roh.push(f.file)); if (sp === 'cpp') roh.push('-std=c++17'); if (sp === 'c') roh.push('-std=c11');
  unten('ausgabe'); ansicht('ausgabe'); ausgabe('⏳ Baue und starte ' + haupt + ' (' + SPR[sp] + ', online über wandbox.org) …'); S.problemeProgramm = []; probleme(); $('starten').disabled = true;
  try { const r = await wbSenden({ compiler: await wbCompiler(sp), code, codes: neben, stdin: $('eingabe').value || '', 'compiler-option-raw': roh.join('\n') });
    const cErr = String(r.compiler_error || ''), out = String(r.program_output || ''), pErr = String(r.program_error || ''), st = String(r.status == null ? '' : r.status), name = haupt.split('/').pop();
    const fehlerText = (cErr + '\n' + pErr).replace(/\bprog\.(cc|c|java|rs|go|py|cs)\b/g, name);
    if (st !== '0' && /error/i.test(cErr) && !out) { ausgabe('❌ BAUFEHLER (' + SPR[sp] + ')\n\n' + fehlerText.trim()); fehlerSammeln(fehlerText, haupt); }
    else if (st !== '0' || r.signal) { ausgabe('❌ LAUFZEITFEHLER (Exit-Code ' + (st || '?') + (r.signal ? ', ' + r.signal : '') + ')\n\n' + (out ? 'Ausgabe:\n' + out + '\n' : '') + fehlerText.trim()); fehlerSammeln(fehlerText, haupt); }
    else { ausgabe('✅ Gebaut und ausgeführt (' + SPR[sp] + ', online über wandbox.org)\n\n' + (out || '(keine Ausgabe)') + (cErr.trim() ? '\n\nHinweise vom Compiler:\n' + cErr.trim() : '')); if (!S.p.erfolg) { S.p.erfolg = 1; konfetti(); } }
  } catch (e) { ausgabe('❌ ' + e.message + (navigator.onLine ? '' : '\n➜ Keine Internetverbindung. Webseiten (HTML/CSS/JS) laufen auch offline, Programme brauchen Internet.')); }
  finally { $('starten').disabled = false; }
}
function fehlerSammeln(text, haupt) { const zeilen = text.split('\n'); const funde = []; zeilen.forEach(z => { for (const m of z.matchAll(/([\w./-]+\.(?:c|cc|cpp|cxx|h|hpp|cs|java|rs|go|py))(?::(\d+)|\((\d+),\d+\)|", line (\d+))/g)) { let k = m[1].replace(/^\.\//, ''); const nr = +(m[2] || m[3] || m[4]); const voll = S.p.dateien[k] != null ? k : Object.keys(S.p.dateien).find(x => x.endsWith('/' + k) || x.split('/').pop() === k.split('/').pop()) || haupt; funde.push({ text: z.trim(), datei: voll, zeile: nr }); } });
  const letzte = zeilen.reverse().find(z => /^\w*(Error|Exception)\b/.test(z.trim())); if (letzte && funde.length) funde[funde.length - 1].text = letzte.trim() + '  ·  ' + funde[funde.length - 1].datei + ':' + funde[funde.length - 1].zeile;
  S.problemeProgramm = funde.slice(0, 50); probleme(); if (funde.length) unten('probleme'); }
function probleme() { const box = $('problemListe'); box.innerHTML = ''; const alle = [...S.problemeProgramm, ...S.problemeVorschau];
  alle.forEach(p => { const z = document.createElement('div'); z.className = 'pr'; z.textContent = '⨯ ' + (p.datei ? p.datei + (p.zeile ? ':' + p.zeile : '') + '  ' : '') + p.text; if (p.datei && S.p && S.p.dateien[p.datei] != null) z.onclick = () => dateiOeffnen(p.datei, p.zeile); box.appendChild(z); });
  if (!alle.length) box.innerHTML = '<div class="hinweis">Keine Probleme gefunden. ✨</div>'; $('problemAnz').textContent = alle.length || ''; $('sbProbleme').textContent = '⨯ ' + alle.length; }

/* ---------------- Ausführen ---------------- */
async function ausfuehren() {
  if (!S.p) { vorlagenWaehlen(); return; }
  if (S.aktiv && programmSprache(S.aktiv)) return programmStarten();
  if (startSeite()) { vorschau(true); ansicht('vorschau'); ausgabe('▶ Vorschau gestartet: ' + startSeite() + (S.swBereit ? ' – läuft wie auf einem echten Server (nur in deinem Browser).' : ' – einfache Vorschau (dein Browser unterstützt keinen Vorschau-Server).')); return; }
  const prog = Object.keys(S.p.dateien).find(programmSprache); if (prog) { dateiOeffnen(prog); return programmStarten(); }
  ausgabe('Nichts zum Ausführen gefunden. Lege eine index.html (Webseite) oder z. B. main.py an.');
}

/* ---------------- Unteres Feld ---------------- */
function unten(n) { document.querySelectorAll('#untenTabs button[data-u]').forEach(b => b.classList.toggle('an', b.dataset.u === n)); document.querySelectorAll('#unten [data-feld]').forEach(f => f.hidden = f.dataset.feld !== n); $('haupt').classList.remove('untenZu'); }
function ausgabe(t) { $('ausgabe').textContent = t; if (!$('unten').querySelector('[data-feld="ausgabe"]').hidden) return; }

/* ---------------- Seitenleiste ---------------- */
function seite(n) { document.querySelectorAll('#akt button[data-s]').forEach(b => b.classList.toggle('an', b.dataset.s === n && !$('app').classList.contains('seiteZu')));
  document.querySelectorAll('#seite [data-panel]').forEach(p => p.hidden = p.dataset.panel !== n); if (n === 'versionen') versionenZeigen(); if (n === 'suche') setTimeout(() => $('suchQ').focus(), 30); }
function sucheLaufen() { const q = $('suchQ').value, box = $('suchErg'); box.innerHTML = ''; if (!q || !S.p) return; const gross = $('suchGross').checked; let treffer = 0, dateien = 0;
  for (const [pfad, inhalt] of Object.entries(S.p.dateien)) { if (istBinaer(inhalt)) continue; const zeilen = inhalt.split('\n'); const funde = [];
    zeilen.forEach((z, i) => { if ((gross ? z : z.toLowerCase()).includes(gross ? q : q.toLowerCase())) funde.push([i + 1, z]); });
    if (!funde.length) continue; dateien++; treffer += funde.length; const k = document.createElement('div'); k.className = 'sd'; k.textContent = icon(pfad) + ' ' + pfad + ' (' + funde.length + ')'; box.appendChild(k);
    funde.slice(0, 50).forEach(([nr, z]) => { const r = document.createElement('div'); r.className = 'sz'; r.textContent = nr + ': ' + z.trim().slice(0, 120); r.onclick = () => dateiOeffnen(pfad, nr); box.appendChild(r); }); }
  const kopf = document.createElement('div'); kopf.className = 'hinweis'; kopf.textContent = treffer + ' Treffer in ' + dateien + ' Datei(en)'; box.prepend(kopf); }
async function ersetzenAlle() { const q = $('suchQ').value, n = $('ersetzQ').value; if (!q || !S.p) return; const gross = $('suchGross').checked; let z = 0;
  await versionNeu('Vor „Alle ersetzen“: ' + q, true);
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), gross ? 'g' : 'gi');
  for (const [pfad, inhalt] of Object.entries(S.p.dateien)) { if (istBinaer(inhalt)) continue; const neu = inhalt.replace(re, () => { z++; return n; }); if (neu !== inhalt) { S.p.dateien[pfad] = neu; if (S.docs[pfad] && S.docs[pfad].setValue) S.docs[pfad].setValue(neu); } }
  await projSchreiben(S.p); sucheLaufen(); toast('↻ ' + z + '× ersetzt (Version davor gespeichert)'); if (istWebProjekt() && !$('vorschau').hidden) vorschau(false); }
async function versionNeu(text, still) { if (!S.p) return; await speichernJetzt(); S.p.versionen = S.p.versionen || []; S.p.versionen.unshift({ t: Date.now(), text: text || 'Version', dateien: JSON.parse(JSON.stringify(S.p.dateien)) });
  S.p.versionen = S.p.versionen.slice(0, 30); try { await projSchreiben(S.p); } catch (e) { S.p.versionen = S.p.versionen.slice(0, 5); await projSchreiben(S.p); } if (!still) { toast('🕘 Version gespeichert'); versionenZeigen(); } }
function versionenZeigen() { const box = $('versListe'); box.innerHTML = ''; const l = (S.p && S.p.versionen) || [];
  if (!l.length) box.innerHTML = '<div class="hinweis">Noch keine Versionen. Speichere einen Stand, bevor du größere Änderungen machst.</div>';
  l.forEach((v, i) => { const r = document.createElement('div'); r.className = 'vz'; r.innerHTML = '<b></b><small></small><button>↺ Zurückholen</button>'; r.querySelector('b').textContent = '● ' + v.text; r.querySelector('small').textContent = new Date(v.t).toLocaleString('de-DE') + ' · ' + Object.keys(v.dateien).length + ' Dateien';
    r.querySelector('button').onclick = async () => { if (!confirm('Projekt auf „' + v.text + '“ zurücksetzen? Der jetzige Stand wird vorher als Version gespeichert.')) return; await versionNeu('Vor dem Zurückholen', true); S.p.dateien = JSON.parse(JSON.stringify(v.dateien)); await projSchreiben(S.p); await projektOeffnen(S.p.name); toast('↺ Zurückgeholt: ' + v.text); }; box.appendChild(r); }); }

/* ---------------- Palette (Strg+P / Strg+Umschalt+P) ---------------- */
let PAL = null;
function palette(items, platzhalter, fn) { PAL = { alle: items, liste: items, wahl: 0, fn }; $('palette').hidden = false; const inp = $('palIn'); inp.value = ''; inp.placeholder = platzhalter;
  inp.oninput = () => { const q = inp.value.toLowerCase().trim(); PAL.liste = !q ? PAL.alle : PAL.alle.filter(x => { let i = 0; const t = (x.label + ' ' + (x.info || '')).toLowerCase(); for (const ch of q) { i = t.indexOf(ch, i); if (i < 0) return false; i++; } return true; }); PAL.wahl = 0; palZeigen(); };
  inp.onkeydown = e => { if (e.key === 'ArrowDown') { e.preventDefault(); PAL.wahl = Math.min(PAL.liste.length - 1, PAL.wahl + 1); palZeigen(); } else if (e.key === 'ArrowUp') { e.preventDefault(); PAL.wahl = Math.max(0, PAL.wahl - 1); palZeigen(); } else if (e.key === 'Enter') { e.preventDefault(); const x = PAL.liste[PAL.wahl]; palZu(); if (x) PAL.fn(x); } else if (e.key === 'Escape') { e.preventDefault(); palZu(); } };
  palZeigen(); inp.focus(); setTimeout(() => inp.focus(), 20); }
function palZeigen() { const box = $('palListe'); box.innerHTML = ''; PAL.liste.slice(0, 80).forEach((x, i) => { const e = document.createElement('div'); e.className = i === PAL.wahl ? 'an' : ''; e.innerHTML = '<span></span><small></small>'; e.querySelector('span').textContent = x.label; e.querySelector('small').textContent = x.info || ''; e.onclick = () => { palZu(); PAL.fn(x); }; box.appendChild(e); }); if (!PAL.liste.length) box.innerHTML = '<div style="opacity:.6;padding:8px">Nichts gefunden</div>'; }
function palZu() { $('palette').hidden = true; if (S.cm) S.cm.focus(); }
function dateiSuchen() { if (!S.p) return; palette(Object.keys(S.p.dateien).filter(d => !/\.gitkeep$/.test(d)).map(d => ({ label: icon(d) + ' ' + d.split('/').pop(), info: d, d })), 'Datei öffnen …', x => dateiOeffnen(x.d)); }
function befehle() { const B = [
  ['▶ Ausführen', 'F5', ausfuehren], ['＋ Neue Datei', '', () => neueDatei('')], ['＋ Neues Projekt (Vorlage)', '', vorlagenWaehlen], ['📋 Anleitung/Code einfügen → Projekt aufbauen', '', () => einfuegenDialog('')],
  ['📄 Datei öffnen …', 'Strg+P', dateiSuchen], ['✨ Code formatieren', 'Umschalt+Alt+F', formatieren], ['🔍 In allen Dateien suchen', 'Strg+Umschalt+F', () => seite('suche')], ['🕘 Version speichern', '', () => { seite('versionen'); }],
  ['⬆ Dateien hochladen', '', () => $('hochDatei').click()], ['⬆ Ordner hochladen', '', () => $('hochOrdner').click()], ['⬆ ZIP öffnen', '', () => $('hochZip').click()],
  ['🌐 Online stellen (eigener Link)', '', onlineDialog], ['🌐 Meine Seiten online', '', meineSeiten], ['🗑 Seite offline nehmen', '', seiteLoeschen], ['⬇ Projekt als ZIP', '', zipExport], ['⬇ Als eine HTML-Datei', '', einzelHtml], ['🎨 Im Design-Studio gestalten', '', designOeffnen],
  ['✎ Projekt umbenennen', '', projektUmbenennen], ['⧉ Projekt duplizieren', '', projektDuplizieren], ['🗑 Projekt löschen', '', projektLoeschen],
  ['🧘 Fokus-Modus', '', fokus], ['🌈 Farbthema wechseln …', '', () => setTimeout(() => palette(Object.keys(THEMEN).map(n => ({ label: '🌈 ' + n, info: (einst().thema || 'Mitternacht') === n ? 'aktiv' : '', n })), 'Farbthema …', x => thema(x.n)), 30)],
  ['A+ Schrift größer', 'Strg+=', () => schrift(1)], ['A− Schrift kleiner', 'Strg+-', () => schrift(-1)], ['↵ Zeilenumbruch an/aus', 'Alt+Z', () => { einstSetzen('umbruch', !einst().umbruch); if (S.cm) S.cm.setOption('lineWrapping', !!einst().umbruch); }],
  ['⌨ Konsole', '', () => unten('konsole')], ['⨯ Probleme', '', () => unten('probleme')], ['🖥 Vorschau: PC', '', () => geraet('100%')], ['📱 Vorschau: Handy', '', () => geraet('390px')], ['⟳ Vorschau neu laden', '', () => vorschau(false)], ['↗ Vorschau in neuem Tab', '', () => $('neuTab').click()],
  ['⎋ Alle Tabs schließen', '', () => { [...S.tabs].forEach(tabZu); }], ['⌨ Tastenkürzel', '', () => ausgabe(KUERZEL)] ];
  palette(B.map(([l, k, fn]) => ({ label: l, info: k, fn })), 'Befehl eingeben …', x => x.fn()); }
const KUERZEL = 'Tastenkürzel:\nF5 / Strg+Enter  Ausführen\nStrg+S  Speichern (passiert auch automatisch)\nStrg+P  Datei öffnen\nStrg+Umschalt+P  Alle Befehle\nStrg+Umschalt+F  In allen Dateien suchen\nStrg+F / Strg+H  Suchen / Ersetzen in der Datei\nStrg+G  Gehe zu Zeile\nStrg+/  Kommentar an/aus\nStrg+D  Zeile verdoppeln\nAlt+↑/↓  Zeile verschieben\nStrg+Leertaste  Vorschläge\nUmschalt+Alt+F  Code formatieren\nStrg+W  Tab schließen\nStrg+B  Seitenleiste ein/aus\nStrg+J  Unteres Feld ein/aus';
async function projektUmbenennen() { if (!S.p) return; const n = (prompt('Neuer Projektname:', S.p.name) || '').trim(); if (!n || n === S.p.name) return; if (await projLesen(n)) { alert('Den Namen gibt es schon.'); return; } await speichernJetzt(); const alt = S.p.name; S.p.name = n; await projSchreiben(S.p); await projLoeschen(alt); await projektOeffnen(n); }
async function projektDuplizieren() { if (!S.p) return; const n = (prompt('Name der Kopie:', S.p.name + '-kopie') || '').trim(); if (!n) return; await speichernJetzt(); await projSchreiben({ ...JSON.parse(JSON.stringify(S.p)), name: n }); await projektOeffnen(n); toast('⧉ Kopie angelegt'); }
async function projektLoeschen() { if (!S.p) return; if (!confirm('Projekt „' + S.p.name + '“ wirklich löschen? Tipp: vorher ⬇ als ZIP sichern.')) return; if (prompt('Zum Bestätigen den Projektnamen eintippen:') !== S.p.name) return; await projLoeschen(S.p.name); S.p = null; const l = await projAlle(); if (l.length) projektOeffnen(l[0].name); else { baum(); editorLeer(); projektListe(); } }

/* ---------------- Code formatieren (Prettier, wird erst bei Bedarf geladen) ---------------- */
let prettierP = null;
function prettierLaden() { if (!prettierP) { const B = 'https://cdn.jsdelivr.net/npm/prettier@3.3.3/'; const lade = u => new Promise((ok, nein) => { const s = document.createElement('script'); s.src = B + u; s.onload = ok; s.onerror = nein; document.head.appendChild(s); });
  prettierP = lade('standalone.js').then(() => Promise.all(['plugins/html.js', 'plugins/postcss.js', 'plugins/babel.js', 'plugins/estree.js', 'plugins/markdown.js', 'plugins/typescript.js'].map(lade))).then(() => window.prettier).catch(e => { prettierP = null; throw e; }); } return prettierP; }
async function formatieren() { if (!S.aktiv || !S.cm) return; const e = S.aktiv.split('.').pop().toLowerCase();
  const parser = { html: 'html', htm: 'html', vue: 'vue', css: 'css', scss: 'scss', less: 'less', js: 'babel', mjs: 'babel', jsx: 'babel', json: 'json', ts: 'typescript', tsx: 'typescript', md: 'markdown' }[e];
  if (!parser) { toast('Formatieren gibt es für HTML, CSS, JavaScript, TypeScript, JSON und Markdown.'); return; }
  try { toast('✨ Formatiere …'); const pr = await prettierLaden(); const neu = await pr.format(S.cm.getValue(), { parser, plugins: window.prettierPlugins ? Object.values(window.prettierPlugins) : [], tabWidth: 2, printWidth: 110 });
    const pos = S.cm.getCursor(); S.cm.setValue(neu); S.cm.setCursor(pos); S.p.dateien[S.aktiv] = neu; speichernBald(); toast('✨ Formatiert'); }
  catch (err) { toast('Formatieren ging nicht: ' + String(err.message || err).split('\n')[0].slice(0, 120)); } }

/* ---------------- Design-Studio-Verbindung ---------------- */
function designOeffnen() {
  if (S.p && S.p.dateien['design.json']) { try { const j = JSON.parse(S.p.dateien['design.json']); const l = store.get('oc_designs', {}); l[j.name || S.p.name] = { d: j.design, t: Date.now() }; localStorage.setItem('oc_designs', JSON.stringify(l)); store.set('oc_design_letztes', j.name || S.p.name); store.set('sdDesignZiel', S.p.name); } catch (e) { /* egal */ } }
  location.href = '../design/index.html';
}
async function designUebernehmen() {   // vom Design-Studio: ?neu=<name>
  const q = new URLSearchParams(location.search); const n = q.get('projekt'); if (n && await projLesen(n)) { await projektOeffnen(n, 'index.html'); history.replaceState(null, '', location.pathname); return true; } return false; }

/* ---------------- Einstellungen, Themen, Kreatives ---------------- */
const THEMEN={"VS Dunkel":{"--sbg":"#1e1e1e","--sside":"#252526","--sakt":"#333333","--sline":"#3c3c3c","--stext":"#d4d4d4","--smut":"#9d9d9d","--sacc":"#0e639c","--shov":"#2a2d2e","--ssel":"#37373d","--sstat":"#007acc"},"Hell":{"--sbg":"#ffffff","--sside":"#f3f3f3","--sakt":"#e8e8e8","--sline":"#e0e0e0","--stext":"#1f1f1f","--smut":"#6b6b6b","--sacc":"#7c3aed","--shov":"#ececec","--ssel":"#e4e6f1","--sstat":"#7c3aed"},
 "Mitternacht":{"--sbg":"#1a1530","--sside":"#221b3d","--sakt":"#150f29","--sline":"#382d5e","--stext":"#e6e1ff","--smut":"#a59bd0","--sacc":"#8b5cf6","--shov":"#2c2450","--ssel":"#3b2f6b","--sstat":"#7c3aed"},
 "Ozean":{"--sbg":"#0b1d2e","--sside":"#0f2a40","--sakt":"#08172a","--sline":"#1d4060","--stext":"#d6ecff","--smut":"#86aac8","--sacc":"#0891b2","--shov":"#163650","--ssel":"#1b4466","--sstat":"#0e7490"},
 "Sonnenuntergang":{"--sbg":"#2a1420","--sside":"#361a28","--sakt":"#20101a","--sline":"#55283c","--stext":"#ffe4d6","--smut":"#d39a9a","--sacc":"#f97316","--shov":"#452033","--ssel":"#5a2840","--sstat":"#db2777"},
 "Wald":{"--sbg":"#13201a","--sside":"#192a22","--sakt":"#0e1914","--sline":"#2b4637","--stext":"#dcefe2","--smut":"#93b8a0","--sacc":"#16a34a","--shov":"#21362b","--ssel":"#294536","--sstat":"#15803d"},
 "Kaffee":{"--sbg":"#231c17","--sside":"#2d241e","--sakt":"#1b1511","--sline":"#47392f","--stext":"#efe3d6","--smut":"#b8a08b","--sacc":"#b45309","--shov":"#3a2f27","--ssel":"#4a3b30","--sstat":"#92400e"},
 "Neon":{"--sbg":"#0a0a0f","--sside":"#111118","--sakt":"#07070b","--sline":"#262640","--stext":"#e0fffb","--smut":"#7f8fa8","--sacc":"#d946ef","--shov":"#1a1a2a","--ssel":"#2a1f3d","--sstat":"#06b6d4"}};

function thema(name) { einstSetzen('thema', name); const t = THEMEN[name] || THEMEN.Mitternacht; const app = $('app'); Object.entries(t).forEach(([k, v]) => document.documentElement.style.setProperty(k, v)); app.classList.toggle('hell', name === 'Hell');
  if (S.cm) S.cm.setOption('theme', name === 'Hell' ? 'default' : 'material-darker'); if ($('themaWahl')) $('themaWahl').value = name; }
function schrift(r) { const fs = Math.max(10, Math.min(26, (einst().fs || 14) + r)); if (r) einstSetzen('fs', fs); $('app').style.setProperty('--fs', fs + 'px'); if (S.cm) setTimeout(() => S.cm.refresh(), 20); }
function fokus() { $('app').classList.toggle('fokus'); setTimeout(() => S.cm && S.cm.refresh(), 60); }
const FARB_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*[\d.]+\s*)?\)|hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/g;
let chipT = null; function farbChipsBald() { clearTimeout(chipT); chipT = setTimeout(farbChips, 250); }
function hex(c) { try { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = c; const v = x.fillStyle; return /^#/.test(v) ? v : '#000000'; } catch (e) { return '#000000'; } }
function farbChips() { const cm = S.cm; if (!cm) return; (S.chips || []).forEach(m => m.clear()); S.chips = []; if (einst().chips === false || !/\.(css|scss|less|html?|vue|svelte|jsx?|tsx?|json|svg|py)$/i.test(S.aktiv || '')) return;
  const vp = cm.getViewport(); let n = 0;
  for (let l = vp.from; l < vp.to && n < 300; l++) { const z = cm.getLine(l) || ''; if (z.length > 2000) continue; FARB_RE.lastIndex = 0; let m;
    while ((m = FARB_RE.exec(z)) && n < 300) { if (m[0][0] === '#' && /[\w&]/.test(z[m.index - 1] || '')) continue; const farbe = m[0]; const w = document.createElement('span'); w.className = 'chip'; w.style.background = farbe; w.title = 'Farbe ändern: ' + farbe;
      const bm = cm.setBookmark({ line: l, ch: m.index }, { widget: w, insertLeft: true }); S.chips.push(bm); n++;
      w.onmousedown = ev => { ev.preventDefault(); ev.stopPropagation(); const pos = bm.find(); if (!pos) return; const inp = document.createElement('input'); inp.type = 'color'; inp.value = hex(farbe); inp.style.cssText = 'position:fixed;left:' + ev.clientX + 'px;top:' + ev.clientY + 'px;opacity:0;width:1px;height:1px'; document.body.appendChild(inp);
        let akt = farbe; inp.oninput = () => { const p = bm.find() || pos; cm.replaceRange(inp.value, p, { line: p.line, ch: p.ch + akt.length }, '+farbe'); akt = inp.value; }; inp.onchange = () => { inp.remove(); farbChipsBald(); }; inp.onblur = () => setTimeout(() => inp.remove(), 300); inp.click(); }; } } }
function konfetti() { if (einst().konfetti === false || matchMedia('(prefers-reduced-motion: reduce)').matches || S.konfettiGezeigt === (S.p && S.p.name)) return; S.konfettiGezeigt = S.p && S.p.name;
  const c = document.createElement('canvas'); c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:90'; c.width = innerWidth; c.height = innerHeight; document.body.appendChild(c);
  const x = c.getContext('2d'), F = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#fff'], t = []; for (let i = 0; i < 120; i++) t.push({ x: innerWidth * (.4 + Math.random() * .2), y: innerHeight * .3, vx: (Math.random() - .5) * 13, vy: -Math.random() * 12 - 3, r: Math.random() * 6 + 3, f: F[i % 6], w: Math.random() * 6 });
  let n = 0; (function lauf() { x.clearRect(0, 0, c.width, c.height); t.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.w += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.w); x.fillStyle = p.f; x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); x.restore(); }); if (++n < 100) requestAnimationFrame(lauf); else c.remove(); })(); }
function status() { const cm = S.cm, a = S.aktiv; $('sbDatei').textContent = a ? icon(a) + ' ' + a : '—'; $('sbSprache').textContent = a ? sprachName(a) : '';
  $('sbPos').textContent = cm && a && $('leer').hidden ? 'Zeile ' + (cm.getCursor().line + 1) + ', Spalte ' + (cm.getCursor().ch + 1) : '';
  $('sbGesp').textContent = S.geaendert ? '● speichert …' : '✓ gespeichert'; $('starten').title = a && programmSprache(a) ? '▶ Programm bauen und starten (online über wandbox.org) – F5' : '▶ Vorschau starten – F5'; }

/* ---------------- Anleitung einfügen → Projekt aufbauen ---------------- */
function nameAusInhalt(code,lang){const t=code.slice(0,3000);let m;
  const L={kotlin:"Main.kt",kt:"Main.kt",bash:"script.sh",sh:"script.sh",shell:"script.sh",powershell:"script.ps1",ps1:"script.ps1",bat:"start.bat",sql:"abfrage.sql",php:"index.php",ruby:"main.rb",rb:"main.rb",swift:"main.swift",lua:"main.lua",dart:"main.dart",yaml:"config.yaml",yml:"config.yaml",xml:"daten.xml",markdown:"README.md",md:"README.md",jsx:"App.jsx",tsx:"App.tsx",vue:"App.vue",scss:"style.scss"};
  if(L[lang])return L[lang];
  if(/<html|<!doctype/i.test(t))return "index.html";
  if(m=/public\s+(?:final\s+)?class\s+(\w+)/.exec(t))return /using\s+System|Console\.Write/.test(t)?"Program.cs":m[1]+".java";
  if(/using\s+System|static\s+void\s+Main\s*\(|Console\.Write/.test(t))return "Program.cs";
  if(/#include\s*<(iostream|vector|string|bits)|std::|cout\s*<</.test(t))return "main.cpp";
  if(/#include\s*<stdio\.h>|printf\s*\(/.test(t)&&!/print\(/.test(t))return "main.c";
  if(/\bfn\s+main\s*\(|println!\s*\(/.test(t))return "src/main.rs";
  if(/^package\s+main\b|\bfunc\s+main\s*\(/m.test(t))return "main.go";
  if(/^\s*(def |import |from \w+ import|print\(|if __name__)/m.test(t))return "main.py";
  if(/^\s*[.#]?[\w-]+\s*\{[^}]*:[^}]*\}/m.test(t)&&!/function|=>|;\s*$/m.test(t))return "style.css";
  if(/\b(function|const|let|var)\b|=>|document\.|console\.log/.test(t))return "script.js";
  return null}
const AB_DATEI_RE=/(?:^|[\s`*"'(\[])((?:[\w.\-]+\/)*(?:[\w\-]+\.(?:py|pyw|txt|js|mjs|cjs|ts|tsx|jsx|html?|css|scss|json|md|toml|ya?ml|cfg|ini|sql|sh|bat|ps1|java|kt|c|cc|cpp|h|hpp|cs|csproj|rs|go|php|rb|swift|dart|vue|svelte|xml|svg|lock|example)|\.env(?:\.\w+)?|\.gitignore|\.dockerignore|Dockerfile|Makefile|Procfile|README))(?=$|[\s`*"'),:;\]])/g;
const AB_SHELL_SPR=/^(bash|sh|shell|zsh|console|terminal|powershell|ps|ps1|cmd|bat|batch)$/i;
const AB_BEFEHL=/^\s*(\$|>|PS>)?\s*(pip3?|python3?|py|uvicorn|gunicorn|flask|django-admin|npm|npx|node|yarn|pnpm|cd|mkdir|git|docker|docker-compose|cargo|go|dotnet|java|javac|mvn|gradle|streamlit|alembic|pytest|curl|brew|winget|apt|sudo|set|export|source|\.\\|venv)\b/i;
function abBaumParsen(code){
  // Ordnerbaum („├── app/“, „│   └── main.py  # Kommentar“) -> Pfade
  const zeilen=code.split("\n").filter(z=>z.trim()&&!/^[│|\s]*$/.test(z));let wurzel="",stapel=[],dateien=[],ordner=[];
  for(const roh of zeilen){
    const ohneKomm=roh.replace(/\s+#.*$/,"").replace(/\s+\/\/.*$/,"").replace(/\s+$/,"");
    const m=ohneKomm.match(/^([\s│|├└─┬┼`+\-\\]*)(.+)$/);if(!m)continue;
    let name=m[2].trim().replace(/^[-*]\s+/,"");if(!name||/\s/.test(name.replace(/\/$/,"")))continue;
    const tiefe=Math.round(m[1].replace(/\t/g,"    ").length/4);
    const istOrdner=/\/$/.test(name)||(!/\./.test(name)&&!/^(Dockerfile|Makefile|Procfile|README|LICENSE)$/i.test(name));
    name=name.replace(/\/$/,"");
    if(tiefe===0&&!wurzel&&istOrdner&&!dateien.length&&!ordner.length){wurzel=name;stapel=[];continue}
    const ebene=wurzel?tiefe-1:tiefe;stapel=stapel.slice(0,Math.max(0,ebene));
    const pfad=[...stapel,name].join("/");
    if(istOrdner){ordner.push(pfad);stapel.push(name)}else dateien.push(pfad)}
  return {wurzel,dateien,ordner}}
function anleitungParsen(text){
  text=String(text||"").replace(/\r\n?/g,"\n");
  const erg={name:"",dateien:{},ordner:[],befehle:[],baum:[]};
  const re=/```([^\n`]*)\n([\s\S]*?)```/g;let m,letztesEnde=0;const bloecke=[];
  while((m=re.exec(text)))bloecke.push({lang:(m[1]||"").trim().toLowerCase().split(/\s+/)[0],code:m[2].replace(/\s+$/,""),davor:text.slice(letztesEnde,m.index),start:m.index}),letztesEnde=re.lastIndex;
  // 1) Ordnerbaum
  for(const b of bloecke){if(/[├└]──|\|--|`--/.test(b.code)||(/^[\w.\-]+\/\s*$/m.test(b.code)&&/^\s+[\w.\-]+/m.test(b.code)&&!/[=(){};]/.test(b.code))){
    const t=abBaumParsen(b.code);if(t.dateien.length+t.ordner.length){b.baum=true;if(t.wurzel&&!erg.name)erg.name=t.wurzel;
      t.ordner.forEach(o=>{if(!erg.ordner.includes(o))erg.ordner.push(o)});t.dateien.forEach(d=>{if(!(d in erg.dateien))erg.dateien[d]="";erg.baum.push(d)})}}}
  // 2) Projektname aus dem Text („Ordner … (z. B. `marketplace-backend`)“)
  if(!erg.name){const n=text.match(/(?:ordner|projekt|folder|project)[^\n`]{0,60}`([\w.\-]+)`/i);if(n&&!/\./.test(n[1]))erg.name=n[1]}
  // 3) Code-Blöcke den Dateien zuordnen
  const bekannt=()=>Object.keys(erg.dateien);
  for(const b of bloecke){if(b.baum)continue;
    const zeilen=b.code.split("\n").filter(z=>z.trim());
    const shell=AB_SHELL_SPR.test(b.lang)||(zeilen.length&&zeilen.length<=6&&zeilen.every(z=>AB_BEFEHL.test(z)||/^\s*#/.test(z)));
    // Dateiname: erste Kommentarzeile („# app/main.py“) oder letzte Nennung kurz vor dem Block
    let datei=null;const k=(zeilen[0]||"").match(/^\s*(?:#|\/\/|<!--|--|\/\*)\s*((?:[\w.\-]+\/)*[\w.\-]+\.\w+)\s*(?:-->|\*\/)?\s*$/);
    if(k)datei=k[1];
    if(!datei){const vorne=b.davor.split("\n").slice(-6).join("\n");const funde=[...vorne.matchAll(AB_DATEI_RE)].map(x=>x[1]).filter(x=>!/^https?:/.test(x));
      if(funde.length){const imBaum=funde.filter(f=>bekannt().some(d=>d===f||d.endsWith("/"+f)));datei=(imBaum.length?imBaum:funde)[ (imBaum.length?imBaum:funde).length-1 ]}}
    if(shell&&(!datei||!/\.(sh|bat|ps1)$/.test(datei))){zeilen.forEach(z=>{const c=z.replace(/^\s*(\$|>|PS>)\s*/,"").trim();if(c&&!c.startsWith("#")&&!erg.befehle.includes(c))erg.befehle.push(c)});continue}
    if(!datei)datei=nameAusInhalt(b.code,b.lang)||("code-"+(Object.keys(erg.dateien).length+1)+".txt");
    // Datei aus dem Baum mit vollem Pfad bevorzugen (z. B. „main.py“ -> „app/main.py“)
    if(!datei.includes("/")){const voll=bekannt().filter(d=>d.endsWith("/"+datei));if(voll.length===1)datei=voll[0]}
    if(erg.dateien[datei]&&erg.dateien[datei].trim()&&erg.dateien[datei]!==b.code+"\n"){let i=2;const pkt=datei.lastIndexOf(".");while(erg.dateien[datei.slice(0,pkt)+"-"+i+datei.slice(pkt)])i++;datei=datei.slice(0,pkt)+"-"+i+datei.slice(pkt)}
    erg.dateien[datei]=b.code+"\n"}
  // Befehle auch aus dem Fließtext („Installiere sie mit: `pip install -r requirements.txt`“)
  for(const x of text.matchAll(/`((?:pip3?|npm|npx|uvicorn|python3?|node|yarn|pnpm|docker|cargo|go|dotnet|streamlit|alembic|pytest)\s[^`\n]{2,120})`/gi)){const c=x[1].trim();if(!erg.befehle.includes(c))erg.befehle.push(c)}
  const rang=c=>/\b(install|add|venv|init|mkdir)\b|^cd\s/i.test(c)?0:/\b(migrate|upgrade|build|alembic)\b/i.test(c)?1:2;
  erg.befehle.sort((a,b)=>rang(a)-rang(b));
  return erg}
function abIstAnleitung(t){t=String(t||"");const fences=(t.match(/```/g)||[]).length/2;return fences>=2||(fences>=1&&/[├└]──/.test(t))}

function einfuegenDialog(text) {
  const box = $('einfuegen'); box.hidden = false; const ta = $('efText'), vor = $('efVorschau'); let erg = null, nameHand = false;
  const zeigen = () => { erg = anleitungParsen(ta.value); if (!nameHand) $('efName').value = erg.name || (S.p ? '' : 'mein-projekt') || 'mein-projekt';
    const dat = Object.keys(erg.dateien).sort(); vor.innerHTML = ''; const h = (t, k) => { const e = document.createElement('div'); if (k) e.className = k; e.textContent = t; vor.appendChild(e); };
    if (!dat.length && !erg.ordner.length) { h('Noch nichts erkannt.', 'grau'); h('Tipp: Code muss zwischen ``` stehen, Dateinamen davor (z. B. „app/main.py“).', 'grau'); return; }
    h('📁 ' + ($('efName').value || S.p && S.p.name || 'projekt') + '/', 'fett');
    erg.ordner.filter(o => !dat.some(d => d.startsWith(o + '/'))).forEach(o => h('   📁 ' + o + '/  (leer)', 'mono grau'));
    dat.forEach(d => { const z = erg.dateien[d].split('\n').filter(Boolean).length; h('   ' + icon(d) + ' ' + d + '  ' + (z ? z + ' Zeilen' : '(leer)'), 'mono'); });
    if (erg.befehle.length) { h('⌨ Befehle aus der Anleitung (laufen nur in der PC-Version):', 'fett'); erg.befehle.forEach(c => h('   ❯ ' + c, 'mono grau')); } };
  ta.oninput = zeigen; $('efName').oninput = () => { nameHand = true; zeigen(); };
  $('efZu').onclick = () => { box.hidden = true; };
  $('efNurText').onclick = () => { const t = ta.value; box.hidden = true; if (S.cm && S.aktiv) S.cm.replaceSelection(t); };
  $('efLos').onclick = async () => { if (!erg) zeigen(); const leer = !Object.keys(erg.dateien).length && !erg.ordner.length; if (leer) { alert('In dem Text habe ich keine Dateien erkannt.'); return; }
    const name = ($('efName').value.trim() || 'mein-projekt').replace(/[\/\\<>:"|?*]+/g, '-'); let p = await projLesen(name);
    if (p && !confirm('Das Projekt „' + name + '“ gibt es schon.\n\nOK = Dateien dort hinzufügen bzw. aktualisieren (vorheriger Stand kommt in 🕘 Versionen).')) return;
    if (p) { S.p = p; await versionNeu('Vor dem Einfügen', true); p = S.p; } else p = { name, dateien: {}, versionen: [], erstellt: Date.now() };
    erg.ordner.forEach(o => { if (!Object.keys({ ...p.dateien, ...erg.dateien }).some(d => d.startsWith(o + '/'))) p.dateien[o + '/.gitkeep'] = ''; });
    Object.entries(erg.dateien).forEach(([pfad, inhalt]) => { const sp = sicherPfad(pfad); if (sp && (inhalt.trim() || p.dateien[sp] == null)) p.dateien[sp] = inhalt; });
    await projSchreiben(p); box.hidden = true;
    const haupt = Object.keys(erg.dateien).find(d => /(^|\/)(main|app|server|index)\.(py|js|ts|html)$/.test(d)) || Object.keys(erg.dateien).find(d => erg.dateien[d].trim()) || Object.keys(erg.dateien)[0];
    await projektOeffnen(name, haupt);
    ausgabe('🏗 Projekt „' + name + '“ aufgebaut: ' + Object.keys(erg.dateien).length + ' Dateien' + (erg.ordner.length ? ', ' + erg.ordner.length + ' Ordner' : '') + '.\n' + Object.keys(erg.dateien).map(d => '  ' + d).join('\n') +
      (erg.befehle.length ? '\n\nDie Befehle aus der Anleitung (' + erg.befehle.join(' · ') + ') brauchen einen echten PC – online laufen Webseiten und Programme in Python, C++, Java, C#, Rust und Go.' : '')); };
  ta.value = text || ''; zeigen(); setTimeout(() => ta.focus(), 30);
}

/* ---------------- 🌐 Online stellen (nur mit Zugangsschlüssel) ---------------- */
const HUB = 'https://sd-maschinen-kenner.onrender.com';
function gemerkterCode() { try { return sessionStorage.getItem('sdAgentZugang') || localStorage.getItem('sdAgentZugang') || ''; } catch (e) { return ''; } }
async function hubPost(pfad, daten, wartenText) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 100000); let wach = null;
  if (wartenText) wach = setTimeout(() => wartenText('⏳ Der Server wacht gerade auf (kann bis zu einer Minute dauern) …'), 6000);
  try { const r = await fetch(HUB + pfad, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten), signal: ctrl.signal });
    const j = await r.json().catch(() => ({ error: 'Server-Antwort unlesbar (' + r.status + ')' })); return j; }
  catch (e) { return { error: e.name === 'AbortError' ? 'Der Server hat nicht rechtzeitig geantwortet. Bitte gleich nochmal.' : 'Server nicht erreichbar – bist du online?' }; }
  finally { clearTimeout(t); clearTimeout(wach); }
}
function onlineDialog() {
  if (!S.p) return; const code = gemerkterCode();
  if (!S.frei || !code) { sperre(true); $('spTitel').textContent = '🔑 Online stellen braucht einen Zugangsschlüssel'; $('spText').innerHTML = 'Damit keine Betrugsseiten entstehen, können nur Menschen mit <b>Zugangsschlüssel vom KI-Agenten</b> Seiten veröffentlichen. Gib deinen Schlüssel ein – danach kannst du direkt online stellen.'; return; }
  if (!startSeite()) { alert('Zum Online-Stellen braucht das Projekt eine HTML-Datei (z. B. index.html).'); return; }
  const box = $('online'); box.hidden = false; $('onErg').innerHTML = ''; $('onLos').disabled = false;
  $('onName').value = (S.p.online && S.p.online.name) || slug(S.p.name).replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const vorschau = () => { $('onUrl').textContent = 'https://sd031988.github.io/sd-seiten/' + ($('onName').value.trim().toLowerCase() || '…') + '/'; }; $('onName').oninput = vorschau; vorschau();
  $('onRecht').checked = false; $('onZu').onclick = () => { box.hidden = true; }; box.onclick = e => { if (e.target === box) box.hidden = true; };
  $('onLos').onclick = async () => {
    if (!$('onRecht').checked) { $('onErg').innerHTML = '<p class="fehlerText">Bitte bestätige die Regeln (Häkchen).</p>'; return; }
    const name = $('onName').value.trim().toLowerCase(); await speichernJetzt();
    $('onLos').disabled = true; const info = t => { $('onErg').innerHTML = '<p>' + esc(t) + '</p>'; }; info('⏳ Wird veröffentlicht …');
    const j = await hubPost('/hub/seite/veroeffentlichen', { code, name, dateien: S.p.dateien }, info); $('onLos').disabled = false;
    if (!j.ok) { $('onErg').innerHTML = '<p class="fehlerText">⨯ ' + esc(j.error || 'Fehler') + '</p>' + (j.gruende ? '<ul>' + j.gruende.map(g => '<li>' + esc(g) + '</li>').join('') + '</ul>' : ''); return; }
    S.p.online = { name, url: j.url, t: Date.now() }; await projSchreiben(S.p);
    $('onErg').innerHTML = '<p class="okText">✅ ' + (j.neu ? 'Veröffentlicht!' : 'Aktualisiert!') + '</p><div class="reihe"><input readonly id="onLink" style="flex:1"><button id="onKopie">📋 Kopieren</button><a class="knopfLink" target="_blank" rel="noopener" id="onOeffnen">↗ Öffnen</a></div><p class="hinweis" style="padding:0">' + esc(j.hinweis || '') + ' Änderungen später: einfach nochmal „Online stellen“ – die Adresse bleibt gleich.</p>';
    $('onLink').value = j.url; $('onOeffnen').href = j.url; $('onKopie').onclick = () => { navigator.clipboard.writeText(j.url).then(() => toast('📋 Link kopiert')); };
    konfetti(); S.konfettiGezeigt = null;
  };
  setTimeout(() => $('onName').focus(), 30);
}
async function meineSeiten() {
  const code = gemerkterCode(); if (!S.frei || !code) { onlineDialog(); return; }
  toast('⏳ Lade deine Seiten …'); const j = await hubPost('/hub/seite/meine', { code });
  if (j.error) { alert(j.error); return; }
  if (!j.seiten.length) { toast('Du hast noch keine Seite online.'); return; }
  palette(j.seiten.map(s => ({ label: '🌐 ' + s.name, info: new Date(s.t * 1000).toLocaleDateString('de-DE') + ' · öffnen', s })), 'Deine Seiten online – Enter öffnet', x => window.open(x.s.url, '_blank'));
}
async function seiteLoeschen() {
  const code = gemerkterCode(); if (!S.frei || !code) { onlineDialog(); return; }
  const name = (prompt('Welche Seite soll offline genommen werden? (Name, z. B. mein-cafe)', (S.p && S.p.online && S.p.online.name) || '') || '').trim().toLowerCase(); if (!name) return;
  if (!confirm('Seite „' + name + '“ wirklich aus dem Internet nehmen?')) return;
  const j = await hubPost('/hub/seite/loeschen', { code, name }); if (j.ok) { if (S.p && S.p.online && S.p.online.name === name) { delete S.p.online; projSchreiben(S.p); } toast('🗑 Offline genommen: ' + name); } else alert(j.error);
}

/* ---------------- Handy: eine Ansicht nach der anderen + Zeichen-Leiste ---------------- */
const istHandy = () => matchMedia('(max-width:800px)').matches;
function ansicht(n) { if (!istHandy()) return; const app = $('app');
  if (n === 'mehr') { handyMehr(); return; }
  app.dataset.ansicht = n; document.querySelectorAll('#handyNav button').forEach(b => b.classList.toggle('an', b.dataset.a === n));
  if (n === 'dateien') { app.classList.remove('seiteZu'); if (!document.querySelector('#seite [data-panel]:not([hidden])')) seite('explorer'); }
  if (n === 'vorschau' && $('vorschau').hidden) { if (startSeite && S.p && startSeite()) vorschau(true); else { toast('Keine Webseite zum Anzeigen – ▶ startet Programme in der Ausgabe.'); } }
  if (n === 'ausgabe') { const sichtbar = document.querySelector('#unten [data-feld]:not([hidden])'); if (!sichtbar) unten('ausgabe'); $('haupt').classList.remove('untenZu'); }
  setTimeout(() => S.cm && S.cm.refresh(), 40); }
function handyMehr() { const B = [['＋ Neue Datei', () => neueDatei('')], ['＋ Neues Projekt (Vorlagen)', vorlagenWaehlen], ['📋 Anleitung/Code einfügen', () => einfuegenDialog('')], ['🎨 Im Design-Studio gestalten', designOeffnen],
  [(S.frei ? '🌐' : '🔒') + ' Online stellen', onlineDialog], ['🔍 In allen Dateien suchen', () => { ansicht('dateien'); seite('suche'); }], ['🕘 Versionen', () => { ansicht('dateien'); seite('versionen'); }], ['⚙ Einstellungen', () => { ansicht('dateien'); seite('einst'); }],
  ['✨ Code formatieren', formatieren], ['⬇ Als ZIP herunterladen', zipExport], ['⬆ Dateien hochladen', () => $('hochDatei').click()], ['⌘ Alle Befehle …', () => setTimeout(befehle, 30)]];
  palette(B.map(([l, fn]) => ({ label: l, fn })), 'Was möchtest du tun?', x => x.fn()); }
const TASTEN = ['⇥', '<', '>', '/', '=', '"', "'", '{', '}', '(', ')', '[', ']', ';', ':', '.', ',', '#', '-', '_', '+', '*', '!', '&', '|', '$', '`', '←', '→', '↶', '↷'];
function handyEinrichten() {
  const leiste = $('tasten'); leiste.innerHTML = '';
  TASTEN.forEach(t => { const b = document.createElement('button'); b.textContent = t; b.type = 'button';
    b.onmousedown = e => e.preventDefault(); b.onpointerdown = e => e.preventDefault();
    b.onclick = () => { const cm = S.cm; if (!cm) { if (S.ta) { const ta = S.ta; ta.setRangeText(t === '⇥' ? '  ' : t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); ta.focus(); } return; }
      if (t === '⇥') cm.execCommand('indentMore'); else if (t === '←') cm.execCommand('goCharLeft'); else if (t === '→') cm.execCommand('goCharRight'); else if (t === '↶') cm.undo(); else if (t === '↷') cm.redo();
      else cm.replaceSelection(t); cm.focus(); };
    leiste.appendChild(b); });
  document.querySelectorAll('#handyNav button').forEach(b => b.onclick = () => ansicht(b.dataset.a));
  $('baum').addEventListener('click', e => { if (istHandy() && e.target.closest('.bz.datei') && e.target.tagName !== 'BUTTON') ansicht('code'); });
  $('suchErg').addEventListener('click', e => { if (istHandy() && e.target.closest('.sz')) ansicht('code'); });
  $('problemListe').addEventListener('click', e => { if (istHandy() && e.target.closest('.pr')) ansicht('code'); });
  const mq = matchMedia('(max-width:800px)'); const wechsel = () => { if (mq.matches) ansicht($('app').dataset.ansicht || 'code'); else { delete $('app').dataset.ansicht; } setTimeout(() => S.cm && S.cm.refresh(), 60); };
  mq.addEventListener ? mq.addEventListener('change', wechsel) : mq.addListener(wechsel); wechsel();
  // roter Punkt bei neuen Problemen
  const beob = new MutationObserver(() => { const n = +($('problemAnz').textContent || 0) + +($('konsoleAnz').textContent || 0); const k = document.querySelector('#handyNav [data-a="ausgabe"]'); if (k) k.classList.toggle('punkt', n > 0 && $('app').dataset.ansicht !== 'ausgabe'); });
  beob.observe($('problemAnz'), { childList: true, characterData: true, subtree: true }); beob.observe($('konsoleAnz'), { childList: true, characterData: true, subtree: true });
}
/* ---------------- Zugang: 10× Öffnen in 24 Stunden ohne Schlüssel ---------------- */
const FREI = 10, ZAEHL = 'sdStudioOeffnungen';
function oeffnungen() { const j = Date.now(); return (store.get(ZAEHL, []) || []).filter(t => j - t < 864e5); }
async function schluesselOk(code) { try { const zug = await (await fetch('../agent/zugang.json?t=' + Date.now(), { cache: 'no-store' })).json(); return !!(await sdZugang.oeffnen(zug, code)); } catch (e) { return false; } }
function zaehlerZeigen() { const ob = $('onlineBtn'); if (ob) { ob.firstChild.textContent = S.frei ? '🌐 ' : '🔒 '; ob.title = S.frei ? 'Online stellen – eigener Link für alle' : 'Online stellen geht nur mit Zugangsschlüssel – klicken zum Eingeben'; } const n = $('kont'); if (S.frei) { n.innerHTML = '🔓<span class="lang"> Unbegrenzt</span>'; n.title = 'Mit Zugangsschlüssel freigeschaltet'; return; } const rest = Math.max(0, FREI - oeffnungen().length); n.innerHTML = '🎟 ' + rest + '<span class="lang">/' + FREI + ' heute</span>'; n.title = 'Ohne Zugangsschlüssel kannst du das Code-Studio ' + FREI + '× in 24 Stunden öffnen. Klick: Schlüssel eingeben'; }
async function zugangPruefen() {
  const gemerkt = (() => { try { return sessionStorage.getItem('sdAgentZugang') || localStorage.getItem('sdAgentZugang'); } catch (e) { return null; } })();
  if (gemerkt && await schluesselOk(gemerkt)) { S.frei = true; return true; }
  let gezaehlt = false; try { gezaehlt = sessionStorage.getItem('sdStudioSitzung') === '1'; } catch (e) { /* egal */ }
  if (gezaehlt) return true;                       // Neuladen im selben Tab zählt nicht nochmal
  const l = oeffnungen(); if (l.length < FREI) { l.push(Date.now()); store.set(ZAEHL, l); try { sessionStorage.setItem('sdStudioSitzung', '1'); } catch (e) { /* egal */ } return true; }
  return false;
}
function sperre(nurSchluessel) {
  const o = $('sperre'); o.hidden = false; const l = oeffnungen();
  $('spText').innerHTML = nurSchluessel ? 'Gib deinen Zugangsschlüssel vom KI-Agenten ein, um das Code-Studio unbegrenzt zu nutzen.' :
    'Ohne Schlüssel kannst du das Code-Studio <b>' + FREI + '× in 24 Stunden</b> öffnen. Wieder frei ab <b>' + new Date(Math.min(...l) + 864e5).toLocaleString('de-DE', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) + '</b>.<br><br>Für unbegrenzte Nutzung brauchst du den <b>Zugangsschlüssel vom KI-Agenten</b> (SD Lotze). Damit bekommst du auch den KI-Agenten und den PC-Agenten.';
  $('spTitel').textContent = nurSchluessel ? '🔑 Zugangsschlüssel eingeben' : '🔒 Deine ' + FREI + ' kostenlosen Öffnungen für heute sind aufgebraucht';
  $('spZu').hidden = !nurSchluessel; $('spZu').onclick = () => { o.hidden = true; };
  $('spLos').onclick = async () => { const c = $('spCode').value.trim(); if (!c) { $('spFehler').textContent = 'Bitte den Schlüssel eingeben.'; return; }
    $('spLos').disabled = true; $('spLos').textContent = 'Prüfe …'; const ok = await schluesselOk(c); $('spLos').disabled = false; $('spLos').textContent = '🔓 Freischalten';
    if (!ok) { $('spFehler').textContent = 'Dieser Schlüssel ist nicht gültig.'; return; }
    try { sessionStorage.setItem('sdAgentZugang', c); if ($('spMerken').checked) localStorage.setItem('sdAgentZugang', c); } catch (e) { /* egal */ }
    S.frei = true; o.hidden = true; zaehlerZeigen(); if (!S.gestartet) starten(); else toast('🔓 Freigeschaltet – unbegrenzt'); };
  setTimeout(() => $('spCode').focus(), 30);
}

/* ---------------- Start ---------------- */
async function starten() {
  S.gestartet = true; $('app').hidden = false; zaehlerZeigen();
  thema(einst().thema || 'Mitternacht');
  const [cm] = await Promise.all([editorLaden(), swStarten()]);
  editorBauen(cm); thema(einst().thema || 'Mitternacht');
  if (!(await designUebernehmen())) { const l = (await projAlle()).sort((a, b) => b.t - a.t); const letztes = store.get('sdStudioLetztes', '');
    if (l.length) await projektOeffnen(l.find(p => p.name === letztes) ? letztes : l[0].name);
    else { await projSchreiben({ name: 'meine-webseite', dateien: JSON.parse(JSON.stringify(VORLAGEN[0].dateien)), haupt: 'index.html', versionen: [], erstellt: Date.now() }); await projektOeffnen('meine-webseite'); ausgabe('👋 Willkommen im SD Code-Studio! Das ist deine erste Webseite – ändere den Code, die Vorschau rechts aktualisiert sich sofort.\n\n＋ Projekt = neue Vorlage · 📋 Einfügen = Anleitung aus ChatGPT & Co. automatisch als Projekt · F5 = Ausführen'); } }
  await projektListe(); verdrahten(); setTimeout(() => S.cm && S.cm.refresh(), 300);
}
function verdrahten() {
  document.querySelectorAll('#akt button[data-s]').forEach(b => b.onclick = () => { const offen = !$('app').classList.contains('seiteZu') && b.classList.contains('an'); $('app').classList.toggle('seiteZu', offen); seite(b.dataset.s); setTimeout(() => S.cm && S.cm.refresh(), 50); });
  document.querySelectorAll('#untenTabs button[data-u]').forEach(b => b.onclick = () => unten(b.dataset.u)); $('untenZu').onclick = () => { $('haupt').classList.toggle('untenZu'); setTimeout(() => S.cm && S.cm.refresh(), 50); };
  $('projektWahl').onchange = () => { const v = $('projektWahl').value; if (v === '__neu') { projektListe(); vorlagenWaehlen(); } else projektOeffnen(v); };
  $('neuDatei').onclick = () => neueDatei(''); $('neuProjekt').onclick = vorlagenWaehlen; $('einfuegenBtn').onclick = () => einfuegenDialog(''); $('designBtn').onclick = designOeffnen; $('onlineBtn').onclick = onlineDialog;
  $('starten').onclick = ausfuehren; $('befehleBtn').onclick = befehle; $('baumNeu').onclick = () => neueDatei(''); $('baumOrdner').onclick = () => { const o = sicherPfad(prompt('Name des neuen Ordners:')); if (o) { S.p.dateien[o + '/.gitkeep'] = ''; S.offen.add(o); projSchreiben(S.p); baum(); } };
  $('baumHoch').onclick = () => $('hochDatei').click(); $('zipBtn').onclick = zipExport; $('htmlBtn').onclick = einzelHtml;
  ['hochDatei', 'hochOrdner', 'hochZip'].forEach(id => $(id).onchange = () => { hochladen([...$(id).files]); $(id).value = ''; });
  $('kont').onclick = () => { if (!S.frei) sperre(true); };
  $('suchQ').oninput = sucheLaufen; $('suchGross').onchange = sucheLaufen; $('ersetzAlle').onclick = ersetzenAlle;
  $('versNeu').onclick = () => { versionNeu($('versText').value.trim() || 'Version vom ' + new Date().toLocaleString('de-DE')); $('versText').value = ''; };
  $('themaWahl').innerHTML = Object.keys(THEMEN).map(n => '<option>' + n + '</option>').join(''); $('themaWahl').value = einst().thema || 'Mitternacht'; $('themaWahl').onchange = () => thema($('themaWahl').value);
  $('grosser').onclick = () => schrift(1); $('kleiner').onclick = () => schrift(-1);
  const schalter = (id, k, def, fn) => { $(id).checked = einst()[k] == null ? def : !!einst()[k]; $(id).onchange = () => { einstSetzen(k, $(id).checked); if (fn) fn(); }; };
  schalter('eUmbruch', 'umbruch', false, () => S.cm && S.cm.setOption('lineWrapping', !!einst().umbruch)); schalter('eLive', 'live', true); schalter('eChips', 'chips', true, farbChips); schalter('eKonfetti', 'konfetti', true); schalter('eVorschlaege', 'vorschlaege', true);
  $('fokusBtn').onclick = fokus;
  document.querySelectorAll('#geraete button').forEach(b => b.onclick = () => geraet(b.dataset.w)); $('neuLaden').onclick = () => vorschau(false);
  $('neuTab').onclick = () => { if (S.swBereit) window.open($('frame').src, '_blank'); else { const w = window.open(); if (w) { w.document.write($('frame').srcdoc); w.document.close(); } } };
  $('vZu').onclick = () => { $('vorschau').hidden = true; setTimeout(() => S.cm && S.cm.refresh(), 50); };
  $('konsoleEin').onkeydown = e => { if (e.key === 'Enter' && $('konsoleEin').value.trim()) { const c = $('konsoleEin').value; S.konsole.push({ typ: 'befehl', text: '❯ ' + c }); konsoleZeigen(); try { $('frame').contentWindow.postMessage({ sdEval: c }, '*'); } catch (x) { /* egal */ } $('konsoleEin').value = ''; } };
  $('konsoleLeer').onclick = () => { S.konsole = []; konsoleZeigen(); };
  $('leerNeu').onclick = () => neueDatei(''); $('leerVorlage').onclick = vorlagenWaehlen; $('leerEinf').onclick = () => einfuegenDialog('');
  // Tastatur
  document.addEventListener('keydown', e => { const st = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (!$('sperre').hidden) return;
    if (e.key === 'F5' || (st && e.key === 'Enter')) { e.preventDefault(); ausfuehren(); }
    else if (st && e.shiftKey && k === 'p') { e.preventDefault(); befehle(); }
    else if (st && !e.shiftKey && k === 'p') { e.preventDefault(); dateiSuchen(); }
    else if (st && e.shiftKey && k === 'f') { e.preventDefault(); $('app').classList.remove('seiteZu'); seite('suche'); }
    else if (st && k === 's') { e.preventDefault(); speichernJetzt().then(() => { toast('💾 Gespeichert'); if (istWebProjekt() && !$('vorschau').hidden) vorschau(false); }); }
    else if (st && k === 'w' && S.aktiv) { e.preventDefault(); tabZu(S.aktiv); }
    else if (st && k === 'b') { e.preventDefault(); $('app').classList.toggle('seiteZu'); setTimeout(() => S.cm && S.cm.refresh(), 50); }
    else if (st && k === 'j') { e.preventDefault(); $('haupt').classList.toggle('untenZu'); setTimeout(() => S.cm && S.cm.refresh(), 50); }
    else if (st && (k === '=' || k === '+')) { e.preventDefault(); schrift(1); } else if (st && k === '-') { e.preventDefault(); schrift(-1); }
    else if (e.altKey && k === 'z') { e.preventDefault(); einstSetzen('umbruch', !einst().umbruch); if (S.cm) S.cm.setOption('lineWrapping', !!einst().umbruch); }
    else if (e.key === 'Escape' && !$('palette').hidden) palZu(); }, true);
  $('palette').onclick = e => { if (e.target.id === 'palette') palZu(); };
  // Dateien hineinziehen
  $('app').addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); $('app').classList.add('ziehen'); } });
  $('app').addEventListener('dragleave', e => { if (e.target === $('app') || !$('app').contains(e.relatedTarget)) $('app').classList.remove('ziehen'); });
  $('app').addEventListener('drop', e => { $('app').classList.remove('ziehen'); if (e.dataTransfer.files.length) { e.preventDefault(); hochladen([...e.dataTransfer.files]); } });
  window.addEventListener('resize', () => { clearTimeout(S.rz); S.rz = setTimeout(() => S.cm && S.cm.refresh(), 120); });
  window.addEventListener('beforeunload', () => { if (S.geaendert) speichernJetzt(); });
  // Handy: Seitenleiste zu Beginn zu
  handyEinrichten();
}
(async () => { if (await zugangPruefen()) starten(); else sperre(false); })();
