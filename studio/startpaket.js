/* SD Code-Studio · Startpaket
   Prüft ein Projekt vor dem Herunterladen (ohne fremden Code auszuführen) und legt eine Startdatei bei:
   START-WINDOWS.cmd (Windows), start-mac-linux.sh (macOS/Linux) und SO-STARTEN.txt.
   Python: eigene Umgebung (.venv), Pakete aus requirements.txt, dann Start. Node.js: npm install, dann Start.
   Die Prüfung ist statisch (Textanalyse). Sie findet typische Lücken, garantiert aber nicht, dass ein Programm fehlerfrei läuft. */
(function (global) {
  'use strict';

  /* ---------- Hilfen ---------- */
  const PIP = { cv2: 'opencv-python', PIL: 'pillow', yaml: 'pyyaml', sklearn: 'scikit-learn', skimage: 'scikit-image', bs4: 'beautifulsoup4',
    docx: 'python-docx', pptx: 'python-pptx', fitz: 'pymupdf', dotenv: 'python-dotenv', serial: 'pyserial', speech_recognition: 'SpeechRecognition',
    telegram: 'python-telegram-bot', telebot: 'pyTelegramBotAPI', yt_dlp: 'yt-dlp', googleapiclient: 'google-api-python-client', win32api: 'pywin32',
    win32con: 'pywin32', win32gui: 'pywin32', win32com: 'pywin32', pythoncom: 'pywin32', dateutil: 'python-dateutil', jwt: 'PyJWT', Crypto: 'pycryptodome',
    magic: 'python-magic', discord: 'discord.py', attr: 'attrs', OpenGL: 'PyOpenGL', usb: 'pyusb', socketio: 'python-socketio', engineio: 'python-engineio',
    multipart: 'python-multipart', mysql: 'mysql-connector-python', psycopg2: 'psycopg2-binary', MySQLdb: 'mysqlclient', ldap: 'python-ldap', gi: 'PyGObject',
    wx: 'wxPython', vlc: 'python-vlc', sounddevice: 'sounddevice', pyaudio: 'PyAudio', Levenshtein: 'python-Levenshtein', slugify: 'python-slugify', docopt: 'docopt' };
  // Bekannte Pakete: Import-Name = pip-Name (für die Unterscheidung "Paket" oder "fehlende eigene Datei")
  const BEKANNT = new Set(('requests flask fastapi uvicorn starlette numpy pandas matplotlib seaborn plotly dash scipy django streamlit gradio openai anthropic groq ollama ' +
    'pygame selenium aiohttp httpx pydantic sqlalchemy alembic torch torchvision tensorflow keras transformers datasets rich click typer pyautogui pyttsx3 ' +
    'googletrans qrcode reportlab openpyxl xlsxwriter xlrd psutil pynput keyboard mouse schedule tqdm colorama jinja2 werkzeug boto3 pytube moviepy ' +
    'PyQt5 PyQt6 PySide6 kivy customtkinter ttkbootstrap nltk spacy langchain pymongo redis celery gunicorn waitress pytest bcrypt cryptography paramiko ' +
    'websockets websocket feedparser lxml markdown emoji pyperclip playsound pydub gtts deep_translator textblob wikipedia pyjokes pywhatkit tweepy praw ' +
    'folium geopy shapely networkx sympy statsmodels xgboost lightgbm catboost joblib imageio pytesseract easyocr mediapipe face_recognition dlib ' +
    'ultralytics onnxruntime arrow pendulum pytz tabulate prettytable termcolor art pyfiglet faker mutagen pyzbar barcode fpdf pypdf PyPDF2 pdfplumber ' +
    'camelot docx2pdf xmltodict toml tomli ujson orjson msgpack zmq grpc protobuf peewee tortoise motor beanie kafka pika paho flask_cors flask_sqlalchemy ' +
    'flask_login flask_wtf wtforms marshmallow pydantic_settings sqlmodel nicegui flet eel webview pywebview pystray plyer win10toast notify2 pyscreeze ' +
    'pygetwindow pymsgbox mss pillow tkcalendar pandastable').split(/\s+/));
  const PY_STD_EXTRA = new Set(('abc argparse array ast asyncio base64 bisect builtins calendar cmath collections concurrent contextlib copy csv ctypes ' +
    'dataclasses datetime decimal difflib email enum errno fileinput fnmatch fractions functools gc getpass glob gzip hashlib heapq hmac html http ' +
    'imaplib importlib inspect io ipaddress itertools json keyword locale logging lzma math mimetypes multiprocessing numbers operator os pathlib pickle ' +
    'platform pprint queue random re sched secrets select shelve shlex shutil signal smtplib socket socketserver sqlite3 ssl stat statistics string ' +
    'struct subprocess sys tempfile textwrap threading time timeit tkinter token tokenize traceback turtle types typing unicodedata unittest urllib uuid ' +
    'venv warnings wave weakref webbrowser winreg winsound xml zipfile zlib zoneinfo __future__ msvcrt curses').split(/\s+/));
  const NODE_STD = new Set(('assert async_hooks buffer child_process cluster console constants crypto dgram diagnostics_channel dns domain events fs ' +
    'http http2 https inspector module net os path perf_hooks process punycode querystring readline repl stream string_decoder timers tls trace_events ' +
    'tty url util v8 vm wasi worker_threads zlib test').split(/\s+/));

  const istText = v => typeof v === 'string' && !/^data:(?!text\/)[^,]*;base64,/.test(v);
  const norm = n => String(n).toLowerCase().replace(/[-_.]+/g, '-');
  const crlf = s => s.replace(/\r?\n/g, '\r\n');
  const ascii = s => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss').replace(/[^\x20-\x7e\r\n\t]/g, '');
  const IGNORIER = /(^|\/)(\.venv|venv|env|node_modules|__pycache__|\.git|dist|build)\//;

  function pyStd(k) { return (global.PY_STD && global.PY_STD.has && global.PY_STD.has(k)) || PY_STD_EXTRA.has(k); }

  /* Klammern in Python grob prüfen (Strings und Kommentare werden übersprungen) */
  function pyKlammern(t) {
    const st = []; const paar = { ')': '(', ']': '[', '}': '{' }; let i = 0, zeile = 1;
    while (i < t.length) {
      const c = t[i];
      if (c === '\n') { zeile++; i++; continue; }
      if (c === '#') { while (i < t.length && t[i] !== '\n') i++; continue; }
      if (c === '"' || c === "'") {
        const drei = t.substr(i, 3) === c + c + c; const ende = drei ? c + c + c : c; i += drei ? 3 : 1;
        while (i < t.length) {
          if (t[i] === '\\') { i += 2; continue; }
          if (t[i] === '\n') { zeile++; if (!drei) break; }
          if (t.substr(i, ende.length) === ende) { i += ende.length; break; }
          i++;
        }
        continue;
      }
      if ('([{'.includes(c)) st.push([c, zeile]);
      else if (')]}'.includes(c)) { const o = st.pop(); if (!o || o[0] !== paar[c]) return 'Zeile ' + zeile + ': „' + c + '“ ohne passende öffnende Klammer'; }
      i++;
    }
    if (st.length) return 'Zeile ' + st[st.length - 1][1] + ': „' + st[st.length - 1][0] + '“ wird nicht geschlossen';
    return '';
  }

  /* ---------- Python ---------- */
  function pythonAnalyse(d, aktiv, m) {
    const py = Object.keys(d).filter(p => p.endsWith('.py') && !IGNORIER.test(p) && istText(d[p]));
    const eigene = new Set();
    py.forEach(p => { const teile = p.split('/'); eigene.add(teile[teile.length - 1].slice(0, -3)); if (teile.length > 1) eigene.add(teile[0]); });
    Object.keys(d).forEach(p => { const t = p.split('/'); if (t.length > 1) eigene.add(t[0]); });
    const hatMain = p => /if\s+__name__\s*==\s*['"]__main__['"]/.test(d[p]);
    const prio = ['main.py', 'app.py', 'run.py', 'start.py', 'manage.py', 'bot.py', 'server.py', 'gui.py', 'game.py', 'spiel.py', 'programm.py'];
    let einstieg = (aktiv && aktiv.endsWith('.py') && hatMain(aktiv)) ? aktiv : null;
    if (!einstieg && d['manage.py']) einstieg = 'manage.py';
    if (!einstieg) for (const n of prio) { const f = py.find(p => p === n) || py.find(p => p.endsWith('/' + n) && p.split('/').length === 2); if (f) { einstieg = f; break; } }
    if (!einstieg) einstieg = py.find(hatMain) || (aktiv && aktiv.endsWith('.py') ? aktiv : null) || py.find(p => !p.includes('/')) || py[0];
    if (!einstieg) { m.push(['fehler', 'Keine Python-Datei gefunden.']); return null; }
    m.push(['ok', 'Startdatei: ' + einstieg + (hatMain(einstieg) ? '' : ' (gewählt nach Dateiname)')]);

    // Imports
    const pakete = new Map(); let fenster = false; const fehlendLokal = [];
    for (const p of py) {
      const t = d[p]; const ordner = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
      for (const mm of t.matchAll(/^[ \t]*(?:import\s+([\w.]+(?:\s+as\s+\w+)?(?:\s*,\s*[\w.]+(?:\s+as\s+\w+)?)*)|from\s+(\.*[\w.]*)\s+import\s+([\w*, ()]+))/gm)) {
        if (mm[2] !== undefined && mm[2].startsWith('.')) {
          const ebenen = mm[2].match(/^\.+/)[0].length; let basis = ordner.split('/').filter(Boolean); basis = basis.slice(0, basis.length - (ebenen - 1));
          const rest = mm[2].slice(ebenen); const pfadBasis = (basis.length ? basis.join('/') + '/' : '') + rest.replace(/\./g, '/');
          const namen = rest ? [pfadBasis] : mm[3].replace(/[()]/g, '').split(',').map(x => (basis.length ? basis.join('/') + '/' : '') + x.trim().split(/\s+as\s+/)[0]).filter(x => !x.endsWith('*'));
          for (const n of namen) if (n && d[n + '.py'] == null && !Object.keys(d).some(k => k.startsWith(n + '/'))) fehlendLokal.push(n.replace(/\//g, '.') + ' (in ' + p + ')');
          continue;
        }
        const liste = mm[1] ? mm[1].split(',') : [mm[2]];
        for (const teil of liste) {
          const voll = teil.trim().split(/\s+as\s+/)[0]; const k = voll.split('.')[0]; if (!k) continue;
          if (k === 'tkinter' || k === 'turtle') { fenster = true; continue; }
          if (pyStd(k) || eigene.has(k)) continue;
          let pip = PIP[k] || k;
          if (k === 'google') { if (/^google\.generativeai/.test(voll)) pip = 'google-generativeai'; else if (/^google\.genai/.test(voll)) pip = 'google-genai'; else if (/^google\.cloud/.test(voll)) pip = 'google-cloud-' + (voll.split('.')[2] || 'core'); else pip = 'protobuf'; }
          if (!pakete.has(pip)) pakete.set(pip, { name: k, bekannt: !!(PIP[k] || BEKANNT.has(k) || k === 'google'), datei: p });
        }
      }
    }
    if (fehlendLokal.length) m.push(['fehler', 'Eigene Module fehlen im Projekt: ' + [...new Set(fehlendLokal)].slice(0, 6).join(', ')]);
    const unbekannt = [...pakete.values()].filter(x => !x.bekannt);
    if (unbekannt.length) {
      // Unbekannte Namen nicht automatisch installieren: Ein falscher Eintrag würde die ganze Paket-Installation abbrechen.
      unbekannt.forEach(x => { for (const [k, v] of pakete) if (v === x) pakete.delete(k); });
      const reqText = d['requirements.txt'] != null ? String(d['requirements.txt']).toLowerCase() : '';
      const offen = unbekannt.filter(x => !reqText.includes(x.name.toLowerCase()));
      if (offen.length) m.push(['warn', 'Unbekannte Module: ' + offen.map(x => x.name).join(', ') + '. Wenn das eigene Dateien sind, fehlen sie im Projekt. Wenn es Pakete sind, trage sie in requirements.txt ein – sonst kommt beim Start „ModuleNotFoundError“.']);
    }

    // Framework und Startbefehl
    const alle = py.map(p => d[p]).join('\n'); const e = d[einstieg];
    const s = { art: 'python', einstieg, url: '', befehl: [], vorher: [] };
    const modul = einstieg.slice(0, -3).replace(/\//g, '.');
    if (einstieg === 'manage.py' || /\bdjango\b/.test(e) && d['manage.py']) {
      s.einstieg = 'manage.py'; s.vorher = ['manage.py migrate --noinput']; s.befehl = ['manage.py', 'runserver', '127.0.0.1:8000']; s.url = 'http://127.0.0.1:8000';
    } else if (/^\s*import\s+streamlit|^\s*from\s+streamlit/m.test(e)) {
      s.befehl = ['-m', 'streamlit', 'run', einstieg]; s.url = ''; ensure(pakete, 'streamlit');
      m.push(['ok', 'Streamlit-App erkannt – der Browser öffnet sich von selbst.']);
    } else if (/(\w+)\s*=\s*FastAPI\s*\(/.test(e) && !/uvicorn\.run\s*\(/.test(e)) {
      const app = e.match(/(\w+)\s*=\s*FastAPI\s*\(/)[1];
      s.befehl = ['-m', 'uvicorn', modul + ':' + app, '--host', '127.0.0.1', '--port', '8000']; s.url = 'http://127.0.0.1:8000' + (/@\w+\.get\(\s*["']\/["']/.test(e) ? '' : '/docs');
      if (ensure(pakete, 'uvicorn')) m.push(['ok', 'FastAPI erkannt – uvicorn wird zum Starten mitinstalliert.']);
    } else if (/uvicorn\.run\s*\(/.test(e)) {
      s.befehl = [einstieg]; const port = (e.match(/uvicorn\.run\s*\([^)]*port\s*=\s*(\d{2,5})/) || [])[1] || '8000'; s.url = 'http://127.0.0.1:' + port; ensure(pakete, 'uvicorn');
    } else if (/\bFlask\s*\(/.test(e)) {
      if (/\.run\s*\(/.test(e)) { s.befehl = [einstieg]; const port = (e.match(/\.run\s*\([^)]*port\s*=\s*(\d{2,5})/) || [])[1] || '5000'; s.url = 'http://127.0.0.1:' + port; }
      else { s.befehl = ['-m', 'flask', '--app', modul, 'run', '--port', '5000']; s.url = 'http://127.0.0.1:5000'; m.push(['ok', 'Flask-App ohne app.run() – Start mit „flask run“.']); }
    } else if (/gradio/.test(e) && /\.launch\s*\(/.test(e)) {
      s.befehl = [einstieg]; s.url = /inbrowser\s*=\s*True/.test(e) ? '' : 'http://127.0.0.1:7860';
    } else s.befehl = [einstieg];
    if (s.url) m.push(['ok', 'Webserver erkannt – nach dem Start öffnet sich ' + s.url]);

    // requirements.txt abgleichen
    const reqPfad = d['requirements.txt'] != null ? 'requirements.txt' : null;
    const zusatz = {};
    if (pakete.size) {
      if (reqPfad) {
        const vorhanden = new Set(String(d[reqPfad]).split(/\r?\n/).map(z => z.replace(/#.*/, '').trim()).filter(z => z && !z.startsWith('-')).map(z => norm(z.split(/[<>=!~;\[ ]/)[0])));
        const fehlt = [...pakete.keys()].filter(k => !vorhanden.has(norm(k)));
        if (fehlt.length) {
          zusatz['requirements.txt'] = String(d[reqPfad]).replace(/\s*$/, '\n') + '# Vom SD Code-Studio ergänzt (im Code importiert, fehlte hier):\n' + fehlt.join('\n') + '\n';
          m.push(['warn', 'In requirements.txt fehlten: ' + fehlt.join(', ') + ' – im Startpaket ergänzt.']);
        } else m.push(['ok', 'requirements.txt passt zu den Imports (' + pakete.size + ' Pakete).']);
      } else {
        zusatz['requirements.txt'] = '# Vom SD Code-Studio aus den Imports erstellt\n' + [...pakete.keys()].join('\n') + '\n';
        m.push(['ok', 'requirements.txt erstellt: ' + [...pakete.keys()].join(', ')]);
      }
    } else if (!reqPfad) m.push(['ok', 'Keine zusätzlichen Pakete nötig.']);
    else m.push(['ok', 'requirements.txt vorhanden.']);

    // Weitere Prüfungen
    for (const p of py) {
      const t = d[p];
      const kl = pyKlammern(t); if (kl) m.push(['fehler', p + ': ' + kl + ' – das Programm startet so nicht.']);
      const zeilen = t.split('\n'); const tabs = zeilen.some(z => /^\t+\S/.test(z)), leer = zeilen.some(z => /^ +\S/.test(z) && !/^ +#/.test(z));
      if (tabs && leer) m.push(['warn', p + ': Einrückung mischt Tabs und Leerzeichen – das führt in Python oft zu Fehlern.']);
      const imp = new Set([...t.matchAll(/^[ \t]*(?:import\s+([\w.,\s]+?)(?:\s+as\s+\w+)?$|from\s+(\w+))/gm)].flatMap(x => (x[1] || x[2] || '').split(',').map(y => y.trim().split(/\s+/)[0].split('.')[0])));
      const ohne = ['os', 'sys', 'json', 're', 'time', 'random', 'math', 'datetime', 'subprocess', 'shutil'].filter(k => !imp.has(k) && new RegExp('(^|[^\\w.])' + k + '\\.\\w').test(t.replace(/#.*$/gm, '').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""')) && !new RegExp('\\b(def|class)\\s+' + k + '\\b|\\b' + k + '\\s*=').test(t));
      if (ohne.length) m.push(['fehler', p + ': benutzt ' + ohne.join(', ') + ' ohne „import“ – das gibt beim Start einen NameError.']);
      if (/^(<{7}|>{7}|={7})( |$)/m.test(t)) m.push(['fehler', p + ': Enthält Konfliktmarken (<<<<<<< / >>>>>>>) – Datei ist unvollständig zusammengeführt.']);
      if (/^\s*(\.\.\.|# ?\.\.\.)\s*$/m.test(t) && /(rest|weitere|übrige|code|hier)/i.test(t.split(/^\s*(?:\.\.\.|# ?\.\.\.)\s*$/m)[0].slice(-200))) m.push(['warn', p + ': Enthält „…“ als Platzhalter – vermutlich fehlt hier Code.']);
      for (const mm of t.matchAll(/(?:open|read_csv|read_excel|read_json|load_workbook|Image\.open|imread|loadtxt|Path)\(\s*[rfb]?["']([^"'{}\n]+\.\w{2,5})["']\s*(?:,\s*["']([rwab+xt]+)["'])?/g)) {
        const datei = mm[1], modus = mm[2] || 'r'; if (/[wax]/.test(modus) || /^(\/|[A-Za-z]:|https?:)/.test(datei)) continue;
        const basis = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
        if (d[datei] == null && d[basis + datei] == null) m.push(['warn', p + ' liest „' + datei + '“, die Datei ist nicht im Projekt.']);
      }
      for (const mm of t.matchAll(/["'](?:DEIN|YOUR|IHR)[_\- ]?[A-Z_\- ]*(?:KEY|SCHLUESSEL|SCHLÜSSEL|TOKEN|PASSWORT|PASSWORD)[^"']*["']|["']sk-x{3,}[^"']*["']|["']<[^"'<>]*(?:key|token|schlüssel)[^"'<>]*>["']/gi)) {
        m.push(['warn', p + ': Platzhalter ' + mm[0].slice(0, 30) + ' muss durch einen echten Wert ersetzt werden.']); break;
      }
    }
    const env = new Set([...alle.matchAll(/os\.(?:getenv|environ\.get)\(\s*["'](\w+)["']\s*\)|os\.environ\[\s*["'](\w+)["']\s*\]/g)].map(x => x[1] || x[2]));
    if (env.size && !Object.keys(d).some(p => /(^|\/)\.env$/.test(p))) m.push(['warn', 'Braucht Umgebungsvariablen: ' + [...env].slice(0, 5).join(', ') + '. Ohne sie startet es eventuell nicht (in SO-STARTEN.txt steht, wie man sie setzt).']);
    if (fenster) m.push(['ok', 'Fenster-Programm (tkinter/turtle) – läuft mit dem normalen Python von python.org.']);
    if ([...pakete.keys()].includes('pywin32')) m.push(['warn', 'pywin32 gibt es nur unter Windows – auf Mac/Linux startet das Programm nicht.']);
    s.pakete = [...pakete.keys()]; s.env = [...env]; s.fenster = fenster;
    return { start: s, zusatz };
  }
  function ensure(pakete, name) { if ([...pakete.keys()].some(k => norm(k) === norm(name))) return false; pakete.set(name, { name, bekannt: true }); return true; }

  /* ---------- Node.js ---------- */
  function nodeAnalyse(d, aktiv, m) {
    let pkg = null; const zusatz = {};
    if (d['package.json'] != null) { try { pkg = JSON.parse(d['package.json']); } catch (e) { m.push(['fehler', 'package.json ist kein gültiges JSON: ' + e.message]); return null; } }
    const js = Object.keys(d).filter(p => /\.(m?js|cjs|ts)$/.test(p) && !IGNORIER.test(p) && istText(d[p]));
    const deps = Object.assign({}, pkg && pkg.dependencies, pkg && pkg.devDependencies);
    const scripts = (pkg && pkg.scripts) || {};
    const fremd = new Set(); const fehlendLokal = [];
    for (const p of js) {
      const t = d[p];
      for (const mm of t.matchAll(/(?:require\(\s*|import\s+(?:[\w*{}\s,]+\s+from\s+)?|import\(\s*)["']([^"']+)["']/g)) {
        const n = mm[1];
        if (n.startsWith('.')) {
          const basis = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : ''; const teile = (basis + n).split('/'); const out = [];
          teile.forEach(x => { if (x === '..') out.pop(); else if (x && x !== '.') out.push(x); }); const z = out.join('/');
          if (![z, z + '.js', z + '.mjs', z + '.cjs', z + '.ts', z + '.json', z + '/index.js'].some(k => d[k] != null)) fehlendLokal.push(n + ' (in ' + p + ')');
          continue;
        }
        if (n.startsWith('node:') || /^https?:/.test(n)) continue;
        const name = n.startsWith('@') ? n.split('/').slice(0, 2).join('/') : n.split('/')[0];
        if (NODE_STD.has(name)) continue; fremd.add(name);
      }
    }
    if (fehlendLokal.length) m.push(['fehler', 'Dateien fehlen im Projekt: ' + [...new Set(fehlendLokal)].slice(0, 6).join(', ')]);
    const fehlt = [...fremd].filter(n => !deps[n]);
    let start = null, url = '';
    const einstiegKandidat = (pkg && pkg.main && d[pkg.main] != null) ? pkg.main : (['server.js', 'index.js', 'app.js', 'main.js', 'bot.js', 'src/index.js', 'src/server.js'].find(n => d[n] != null) || (aktiv && /\.(m?js|cjs)$/.test(aktiv) ? aktiv : js.find(p => !p.includes('/'))));
    if (scripts.start) start = ['npm', 'start'];
    else if (scripts.dev) start = ['npm', 'run', 'dev'];
    else if (einstiegKandidat) start = ['node', einstiegKandidat];
    if (!start) { m.push(['fehler', 'Kein Startpunkt gefunden (package.json ohne "start"/"dev" und keine index.js/server.js).']); return null; }
    m.push(['ok', 'Start mit: ' + start.join(' ')]);
    if (fehlt.length) {
      const neu = pkg ? JSON.parse(JSON.stringify(pkg)) : { name: 'sd-projekt', version: '1.0.0', private: true };
      neu.dependencies = Object.assign({}, neu.dependencies); fehlt.forEach(n => { neu.dependencies[n] = '*'; });
      if (!pkg && start[0] === 'node') neu.scripts = { start: 'node ' + start[1] };
      zusatz['package.json'] = JSON.stringify(neu, null, 2) + '\n';
      m.push([pkg ? 'warn' : 'ok', (pkg ? 'In package.json fehlten: ' : 'package.json erstellt mit: ') + fehlt.join(', ') + (pkg ? ' – im Startpaket ergänzt (neueste Version).' : '')]);
    } else if (pkg) m.push(['ok', 'package.json passt zu den Imports.']);
    const alle = js.map(p => d[p]).join('\n');
    if (deps.vite && /vite/.test(scripts.dev || scripts.start || '')) url = 'http://localhost:5173';
    else if (deps.next) url = 'http://localhost:3000';
    else { const l = alle.match(/\.listen\(\s*(?:process\.env\.PORT\s*\|\|\s*)?(\d{2,5})/); if (l) url = 'http://localhost:' + l[1]; else if (/\.listen\(\s*(?:PORT|port)\b/.test(alle)) { const v = alle.match(/(?:PORT|port)\s*=\s*(?:process\.env\.PORT\s*\|\|\s*)?(\d{2,5})/); if (v) url = 'http://localhost:' + v[1]; } }
    if (url) m.push(['ok', 'Webserver erkannt – nach dem Start öffnet sich ' + url]);
    const env = new Set([...alle.matchAll(/process\.env\.([A-Z_][A-Z0-9_]*)/g)].map(x => x[1]).filter(x => x !== 'PORT' && x !== 'NODE_ENV'));
    if (env.size && !Object.keys(d).some(p => /(^|\/)\.env$/.test(p))) m.push(['warn', 'Braucht Umgebungsvariablen: ' + [...env].slice(0, 5).join(', ') + '.']);
    if (Object.keys(d).some(p => p.split('/').includes('node_modules'))) m.push(['warn', 'node_modules liegt im Projekt – wird nicht mitgepackt, npm install lädt es neu.']);
    return { start: { art: 'node', befehl: start, url, npm: !!(pkg || fehlt.length), env: [...env] }, zusatz };
  }

  /* ---------- Webseite ---------- */
  function webAnalyse(d, m) {
    const html = d['index.html'] != null ? 'index.html' : Object.keys(d).find(p => /\.html?$/i.test(p) && !IGNORIER.test(p));
    if (!html) return null;
    m.push(['ok', 'Webseite – Startseite: ' + html]);
    if (typeof global.projektPruefen === 'function') {
      try { (global.projektPruefen(d).meldungen || []).filter(x => /fehlt/.test(x)).slice(0, 10).forEach(x => m.push(['warn', x.replace(/^⚠\s*/, '')])); } catch (e) { /* Prüfung optional */ }
    }
    const modul = Object.values(d).some(t => istText(t) && /type=["']module["']|fetch\(\s*["'](?!https?:)/.test(t));
    if (modul) m.push(['ok', 'Die Seite nutzt Module oder lädt Dateien – deshalb startet sie über einen kleinen lokalen Server (mit Python), sonst direkt im Browser.']);
    return { start: { art: 'web', einstieg: html, server: modul }, zusatz: {} };
  }

  /* ---------- Gesamtprüfung ---------- */
  function analysieren(dateien, aktiv) {
    const d = {}; Object.keys(dateien || {}).forEach(k => { if (!/(^|\/)(\.venv|venv|node_modules|__pycache__|\.git)\//.test(k)) d[k] = dateien[k]; });
    const m = []; const pfade = Object.keys(d);
    if (!pfade.length) { m.push(['fehler', 'Das Projekt ist leer.']); return { art: 'leer', meldungen: m, zusatz: {} }; }
    const hatPy = pfade.some(p => p.endsWith('.py')), hatPkg = d['package.json'] != null, hatJs = pfade.some(p => /\.(m?js|cjs)$/.test(p));
    const hatHtml = pfade.some(p => /\.html?$/i.test(p));
    const pyIstHaupt = hatPy && (!aktiv || aktiv.endsWith('.py') || !hatHtml);
    let r = null, art = 'andere';
    if (pyIstHaupt) { art = 'python'; r = pythonAnalyse(d, aktiv, m); }
    else if (hatPkg || (hatJs && !hatHtml)) { art = 'node'; r = nodeAnalyse(d, aktiv, m); }
    else if (hatHtml) { art = 'web'; r = webAnalyse(d, m); }
    else { const spr = pfade.map(p => p.split('.').pop()).find(e => /^(java|c|cpp|cs|go|rs|rb|php|kt|swift)$/.test(e)); m.push(['warn', 'Für ' + (spr ? '.' + spr + '-Projekte' : 'dieses Projekt') + ' gibt es noch keine automatische Startdatei. Das ZIP enthält den Quellcode.']); }
    const fehler = m.filter(x => x[0] === 'fehler').length, warn = m.filter(x => x[0] === 'warn').length;
    return { art, start: r && r.start, zusatz: (r && r.zusatz) || {}, meldungen: m, fehler, warn };
  }

  /* ---------- Startdateien ---------- */
  function winPython(s, name) {
    const py = '"%~dp0.venv\\Scripts\\python.exe"';
    const arg = a => /[\s&()^]/.test(a) ? '"' + a + '"' : a;
    const ordner = s.einstieg.includes('/') && s.befehl[0] === s.einstieg ? s.einstieg.slice(0, s.einstieg.lastIndexOf('/')).replace(/\//g, '\\') : '';
    const befehl = s.befehl.map((a, i) => (ordner && i === 0) ? s.einstieg.split('/').pop() : arg(a.replace(/\//g, i === 0 && a.endsWith('.py') ? '\\' : '/'))).join(' ');
    return crlf(ascii([
      '@echo off', 'setlocal', 'chcp 65001 >nul', 'cd /d "%~dp0"', 'title ' + name.replace(/[&|<>^%]/g, ''),
      'echo "%~dp0" | find /i "\\appdata\\local\\temp\\" >nul && goto zip',
      'echo ==== ' + name.replace(/[&|<>^%]/g, '') + ' ====', 'echo.',
      'set "PYEXE="',
      'py -3 --version >nul 2>&1 && set "PYEXE=py -3"',
      'if not defined PYEXE python --version >nul 2>&1 && set "PYEXE=python"',
      'if not defined PYEXE goto keinpython',
      'if not exist ".venv\\Scripts\\python.exe" (',
      '  echo Einmalige Einrichtung: eigene Python-Umgebung wird erstellt ...',
      '  %PYEXE% -m venv .venv',
      '  if errorlevel 1 goto fehler',
      ')',
      'if exist requirements.txt (',
      '  fc /b requirements.txt .venv\\sd-pakete.txt >nul 2>&1',
      '  if errorlevel 1 (',
      '    echo Pakete werden installiert - beim ersten Mal kann das ein paar Minuten dauern ...',
      '    ' + py + ' -m pip install --disable-pip-version-check -r requirements.txt',
      '    if errorlevel 1 goto fehler',
      '    copy /y requirements.txt .venv\\sd-pakete.txt >nul',
      '  )',
      ')',
    ].concat(s.vorher.map(v => py + ' ' + v.replace(/\//g, '\\') + '\r\nif errorlevel 1 goto fehler'))
     .concat(s.url ? ['echo Der Browser oeffnet sich gleich: ' + s.url, 'start "" /min cmd /c "ping -n 5 127.0.0.1 >nul & start ' + s.url + '"'] : [])
     .concat(['echo Programm startet. Zum Beenden dieses Fenster schliessen oder Strg+C druecken.', 'echo.'])
     .concat(ordner ? ['pushd "' + ordner + '"'] : [])
     .concat([py + ' ' + befehl, 'set "CODE=%errorlevel%"'])
     .concat(ordner ? ['popd'] : [])
     .concat([
      'echo.', 'if not "%CODE%"=="0" goto fehler', 'echo Programm beendet.', 'pause', 'exit /b 0',
      ':keinpython', 'echo Python ist auf diesem PC nicht installiert.',
      'echo Bitte Python 3 von https://www.python.org/downloads/ installieren.',
      'echo WICHTIG: Im Installer den Haken bei "Add python.exe to PATH" setzen.',
      'echo Danach diese Datei noch einmal starten.', 'start "" https://www.python.org/downloads/', 'pause', 'exit /b 1',
      ':zip', 'echo Diese Datei wurde direkt aus dem ZIP gestartet.',
      'echo Bitte das ZIP zuerst entpacken: Rechtsklick auf das ZIP - "Alle extrahieren".',
      'echo Danach im entpackten Ordner START-WINDOWS.cmd starten.', 'pause', 'exit /b 1',
      ':fehler', 'echo.', 'echo Es ist ein Fehler aufgetreten - die Meldung steht oben.',
      'echo Tipp: Fehlermeldung kopieren und im SD Code-Studio der KI zeigen.', 'pause', 'exit /b 1', ''
    ]).join('\n')));
  }
  function shPython(s, name) {
    const q = a => "'" + String(a).replace(/'/g, "'\\''") + "'";
    const ordner = s.einstieg.includes('/') && s.befehl[0] === s.einstieg ? s.einstieg.slice(0, s.einstieg.lastIndexOf('/')) : '';
    const befehl = s.befehl.map((a, i) => (ordner && i === 0) ? q(s.einstieg.split('/').pop()) : q(a)).join(' ');
    return [
      '#!/usr/bin/env bash', '# Startdatei vom SD Code-Studio – im Terminal: bash start-mac-linux.sh', 'cd "$(dirname "$0")" || exit 1',
      'echo "==== ' + name.replace(/["$`\\]/g, '') + ' ===="',
      'PY="$(command -v python3 || command -v python)"',
      'if [ -z "$PY" ]; then echo "Python 3 ist nicht installiert: https://www.python.org/downloads/"; exit 1; fi',
      'if [ ! -x .venv/bin/python ]; then',
      '  echo "Einmalige Einrichtung: eigene Python-Umgebung …"',
      '  "$PY" -m venv .venv || { echo "Konnte .venv nicht anlegen. Linux: sudo apt install python3-venv"; exit 1; }',
      'fi',
      'if [ -f requirements.txt ] && ! cmp -s requirements.txt .venv/sd-pakete.txt; then',
      '  echo "Pakete werden installiert …"',
      '  .venv/bin/python -m pip install --disable-pip-version-check -r requirements.txt || { echo "Paket-Installation fehlgeschlagen (Meldung oben)."; exit 1; }',
      '  cp requirements.txt .venv/sd-pakete.txt',
      'fi',
    ].concat(s.vorher.map(v => '.venv/bin/python ' + v + ' || exit 1'))
     .concat(s.url ? ['( sleep 4; if command -v open >/dev/null && [ "$(uname)" = "Darwin" ]; then open ' + q(s.url) + '; elif command -v xdg-open >/dev/null; then xdg-open ' + q(s.url) + ' >/dev/null 2>&1; fi ) &', 'echo "Browser öffnet sich gleich: ' + s.url + '"'] : [])
     .concat(['PYV="$PWD/.venv/bin/python"'])
     .concat(ordner ? ['cd ' + q(ordner) + ' || exit 1'] : [])
     .concat(['"$PYV" ' + befehl, '']).join('\n');
  }
  function winNode(s, name) {
    const b = s.befehl[0] === 'npm' ? 'call npm ' + s.befehl.slice(1).join(' ') : 'node "' + s.befehl[1].replace(/\//g, '\\') + '"';
    return crlf(ascii([
      '@echo off', 'setlocal', 'chcp 65001 >nul', 'cd /d "%~dp0"', 'title ' + name.replace(/[&|<>^%]/g, ''),
      'echo "%~dp0" | find /i "\\appdata\\local\\temp\\" >nul && goto zip',
      'where node >nul 2>&1 || goto keinnode',
    ].concat(s.npm ? ['if not exist node_modules (', '  echo Pakete werden installiert ...', '  call npm install', '  if errorlevel 1 goto fehler', ')'] : [])
     .concat(s.url ? ['start "" /min cmd /c "ping -n 6 127.0.0.1 >nul & start ' + s.url + '"'] : [])
     .concat(['echo Programm startet. Zum Beenden Fenster schliessen oder Strg+C.', b, 'if errorlevel 1 goto fehler', 'pause', 'exit /b 0',
      ':keinnode', 'echo Node.js ist nicht installiert. Bitte die LTS-Version von https://nodejs.org installieren und diese Datei erneut starten.', 'start "" https://nodejs.org/', 'pause', 'exit /b 1',
      ':zip', 'echo Bitte das ZIP zuerst entpacken: Rechtsklick - "Alle extrahieren". Danach START-WINDOWS.cmd im entpackten Ordner starten.', 'pause', 'exit /b 1',
      ':fehler', 'echo Es ist ein Fehler aufgetreten - die Meldung steht oben.', 'pause', 'exit /b 1', '']).join('\n')));
  }
  function shNode(s) {
    const b = s.befehl[0] === 'npm' ? 'npm ' + s.befehl.slice(1).join(' ') : "node '" + s.befehl[1] + "'";
    return ['#!/usr/bin/env bash', 'cd "$(dirname "$0")" || exit 1',
      'command -v node >/dev/null || { echo "Node.js fehlt: https://nodejs.org"; exit 1; }']
      .concat(s.npm ? ['[ -d node_modules ] || npm install || exit 1'] : [])
      .concat(s.url ? ['( sleep 5; if [ "$(uname)" = "Darwin" ]; then open \'' + s.url + '\'; else xdg-open \'' + s.url + '\' >/dev/null 2>&1; fi ) &'] : [])
      .concat([b, '']).join('\n');
  }
  function winWeb(s) {
    const e = s.einstieg.replace(/\//g, '\\');
    return crlf(ascii(['@echo off', 'cd /d "%~dp0"', 'echo "%~dp0" | find /i "\\appdata\\local\\temp\\" >nul && goto zip']
      .concat(s.server ? [
        'set "PYEXE="', 'py -3 --version >nul 2>&1 && set "PYEXE=py -3"', 'if not defined PYEXE python --version >nul 2>&1 && set "PYEXE=python"',
        'if not defined PYEXE (', '  start "" "' + e + '"', '  exit /b 0', ')',
        'start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start http://127.0.0.1:8000/' + s.einstieg + '"',
        'echo Lokaler Server laeuft. Zum Beenden Fenster schliessen.', '%PYEXE% -m http.server 8000 --bind 127.0.0.1', 'exit /b 0'
      ] : ['start "" "' + e + '"', 'exit /b 0'])
      .concat([':zip', 'echo Bitte das ZIP zuerst entpacken: Rechtsklick - "Alle extrahieren".', 'pause', 'exit /b 1', '']).join('\n')));
  }
  function shWeb(s) {
    return ['#!/usr/bin/env bash', 'cd "$(dirname "$0")" || exit 1']
      .concat(s.server ? ['PY="$(command -v python3 || command -v python)"',
        'if [ -n "$PY" ]; then ( sleep 2; if [ "$(uname)" = "Darwin" ]; then open "http://127.0.0.1:8000/' + s.einstieg + '"; else xdg-open "http://127.0.0.1:8000/' + s.einstieg + '" >/dev/null 2>&1; fi ) & exec "$PY" -m http.server 8000 --bind 127.0.0.1; fi']
        : [])
      .concat(['if [ "$(uname)" = "Darwin" ]; then open \'' + s.einstieg + '\'; else xdg-open \'' + s.einstieg + '\'; fi', '']).join('\n');
  }
  function anleitung(a, name) {
    const s = a.start || {}; const L = [];
    L.push(name + ' – so startest du das Projekt', '='.repeat(Math.min(60, name.length + 30)), '');
    L.push('1. ZIP entpacken', '   Windows: Rechtsklick auf die ZIP-Datei → „Alle extrahieren …“.', '   Wichtig: Nicht direkt im ZIP doppelklicken – erst entpacken.', '');
    L.push('2. Starten', '   Windows:     Doppelklick auf START-WINDOWS.cmd', '   Mac / Linux: Terminal im Ordner öffnen und eingeben:  bash start-mac-linux.sh', '');
    if (s.art === 'python') L.push('   Beim ersten Start wird eine eigene Python-Umgebung (.venv) angelegt und die Pakete', '   werden installiert. Das dauert einmalig etwas. Danach startet es schnell.', '   Voraussetzung: Python 3 von https://www.python.org/downloads/', '   (beim Installieren den Haken „Add python.exe to PATH“ setzen).', '');
    if (s.art === 'node') L.push('   Voraussetzung: Node.js (LTS) von https://nodejs.org', '');
    L.push('3. Falls Windows den Start blockiert', '',
      '   a) Meldung „Der Computer wurde durch Windows geschützt“:', '      auf „Weitere Informationen“ klicken, dann „Trotzdem ausführen“.', '',
      '   b) Es passiert gar nichts oder die Datei ist gesperrt:', '      ZIP-Datei löschen, neu herunterladen und VOR dem Entpacken:', '      Rechtsklick auf das ZIP → Eigenschaften → unten Haken bei „Zulassen“ → OK.', '      Dann entpacken. Damit gibt Windows alle Dateien im Ordner frei.', '',
      '   c) Ohne Doppelklick: Ordner öffnen, oben in die Adresszeile klicken,', '      „cmd“ eintippen und Enter drücken. Im schwarzen Fenster eingeben:', '         START-WINDOWS.cmd', '      und Enter drücken.', '');
    if (s.art === 'python') {
      L.push('4. Von Hand (falls gar nichts anderes geht)', '   Im Ordner ein Terminal/CMD öffnen und nacheinander eingeben:', '      py -m venv .venv            (Mac/Linux: python3 -m venv .venv)',
        '      .venv\\Scripts\\activate      (Mac/Linux: source .venv/bin/activate)');
      if (Object.keys(a.zusatz).includes('requirements.txt') || s.pakete && s.pakete.length) L.push('      pip install -r requirements.txt');
      (s.vorher || []).forEach(v => L.push('      python ' + v));
      L.push('      python ' + s.befehl.join(' '), '');
    }
    if (s.env && s.env.length) L.push('Zugangsdaten / Umgebungsvariablen', '   Das Programm liest: ' + s.env.join(', '), '   Windows (CMD, vor dem Start):  set NAME=wert', '   Mac/Linux:                      export NAME=wert', '   Oder eine Datei .env im Ordner anlegen (wenn das Programm python-dotenv nutzt).', '');
    const w = a.meldungen.filter(x => x[0] !== 'ok');
    if (w.length) { L.push('Hinweise aus der Prüfung im SD Code-Studio', ''); w.forEach(x => L.push('   ' + (x[0] === 'fehler' ? '[Problem] ' : '[Hinweis] ') + x[1])); L.push(''); }
    L.push('Erstellt mit dem SD Code-Studio (thesdhub.com/studio).');
    return '﻿' + crlf(L.join('\n'));
  }

  /* Dateien für das ZIP zusammenstellen */
  function bauen(dateien, aktiv, name) {
    const a = analysieren(dateien, aktiv);
    const out = {}; Object.keys(dateien).forEach(k => { if (!/(^|\/)(node_modules|\.venv|__pycache__)\//.test(k)) out[k] = dateien[k]; });
    Object.assign(out, a.zusatz);
    const ausfuehrbar = [];
    const s = a.start;
    if (s) {
      let win = '', sh = '';
      if (s.art === 'python') { win = winPython(s, name); sh = shPython(s, name); }
      else if (s.art === 'node') { win = winNode(s, name); sh = shNode(s); }
      else if (s.art === 'web') { win = winWeb(s); sh = shWeb(s); }
      if (win && out['START-WINDOWS.cmd'] == null) out['START-WINDOWS.cmd'] = win;
      if (sh && out['start-mac-linux.sh'] == null) { out['start-mac-linux.sh'] = sh; ausfuehrbar.push('start-mac-linux.sh'); }
    }
    if (out['SO-STARTEN.txt'] == null) out['SO-STARTEN.txt'] = anleitung(a, name);
    return { analyse: a, dateien: out, ausfuehrbar };
  }

  /* ZIP mit Unix-Rechten (damit start-mac-linux.sh ausführbar bleibt) */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipBytes(dateien, ausfuehrbar, ordner) {
    const enc = new TextEncoder(), teile = [], zentral = []; let off = 0; const exe = new Set(ausfuehrbar || []);
    const jetzt = new Date(); const dosZeit = (jetzt.getHours() << 11) | (jetzt.getMinutes() << 5) | (jetzt.getSeconds() >> 1);
    const dosDatum = ((jetzt.getFullYear() - 1980) << 9) | ((jetzt.getMonth() + 1) << 5) | jetzt.getDate();
    const pre = ordner ? ordner.replace(/\/?$/, '/') : '';
    for (const [pfad0, inhalt] of Object.entries(dateien)) {
      const pfad = pre + pfad0; let daten;
      if (!istText(inhalt)) { const b = (typeof atob === 'function' ? atob : s => Buffer.from(s, 'base64').toString('binary'))(inhalt.split(',')[1]); daten = Uint8Array.from(b, c => c.charCodeAt(0)); }
      else daten = enc.encode(inhalt);
      const name = enc.encode(pfad), crc = crc32(daten), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, dosZeit, true); h.setUint16(12, dosDatum, true); h.setUint32(14, crc, true); h.setUint32(18, daten.length, true); h.setUint32(22, daten.length, true); h.setUint16(26, name.length, true);
      teile.push(new Uint8Array(h.buffer), name, daten);
      const z = new DataView(new ArrayBuffer(46));
      z.setUint32(0, 0x02014b50, true); z.setUint16(4, (3 << 8) | 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint16(12, dosZeit, true); z.setUint16(14, dosDatum, true);
      z.setUint32(16, crc, true); z.setUint32(20, daten.length, true); z.setUint32(24, daten.length, true); z.setUint16(28, name.length, true);
      z.setUint32(38, ((exe.has(pfad0) ? 0o100755 : 0o100644) << 16) >>> 0, true); z.setUint32(42, off, true);
      zentral.push(new Uint8Array(z.buffer), name); off += 30 + name.length + daten.length;
    }
    const zLaenge = zentral.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22)), n = Object.keys(dateien).length;
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, n, true); e.setUint16(10, n, true); e.setUint32(12, zLaenge, true); e.setUint32(16, off, true);
    return [...teile, ...zentral, new Uint8Array(e.buffer)];
  }

  /* ---------- Dialog im Studio ---------- */
  function dialog(a, name) {
    return new Promise(ok => {
      const o = document.createElement('div'); o.className = 'dialog'; o.id = 'startpaketDialog';
      const symbol = { ok: '✓', warn: '!', fehler: '✕' };
      const titel = a.fehler ? 'Achtung: Das Projekt wird so wahrscheinlich nicht laufen' : a.warn ? 'Projekt geprüft – mit Hinweisen' : 'Projekt geprüft – alles bereit';
      o.innerHTML = '<div class="karte" style="width:min(620px,96vw);max-height:90vh;overflow:auto"><b style="font-size:16px"></b>' +
        '<p style="margin:6px 0 10px;font-size:13px;opacity:.85"></p><ul style="list-style:none;margin:0;padding:0;display:grid;gap:6px;font:13px/1.45 system-ui"></ul>' +
        '<p style="margin:12px 0 0;font-size:12.5px;opacity:.8">Im ZIP: dein Projekt, START-WINDOWS.cmd, start-mac-linux.sh und SO-STARTEN.txt (mit Hilfe, falls Windows den Start blockiert). Die Prüfung liest nur den Code – sie führt ihn nicht aus.</p>' +
        '<div class="reihe" style="margin-top:14px;gap:8px;flex-wrap:wrap"><button type="button" data-w="nur">Nur Quellcode</button><span style="flex:1"></span><button type="button" data-w="ab">Abbrechen</button><button type="button" class="primary" data-w="ja"></button></div></div>';
      o.querySelector('b').textContent = titel;
      o.querySelector('p').textContent = a.art === 'python' ? 'Python-Projekt: Die Startdatei richtet beim ersten Start alles selbst ein (eigene Umgebung, Pakete).' :
        a.art === 'node' ? 'Node.js-Projekt: Die Startdatei installiert die Pakete und startet das Projekt.' :
        a.art === 'web' ? 'Webseite: Die Startdatei öffnet die Seite im Browser.' : 'Für diesen Projekttyp gibt es keine automatische Startdatei.';
      const ul = o.querySelector('ul');
      a.meldungen.forEach(([stufe, text]) => { const li = document.createElement('li'); li.style.cssText = 'display:flex;gap:8px;align-items:flex-start';
        const s = document.createElement('span'); s.textContent = symbol[stufe]; s.style.cssText = 'flex:0 0 20px;height:20px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:12px;color:#fff;background:' + (stufe === 'ok' ? '#2c7a4b' : stufe === 'warn' ? '#b7791f' : '#c0392b');
        const t = document.createElement('span'); t.textContent = text; li.append(s, t); ul.appendChild(li); });
      o.querySelector('[data-w="ja"]').textContent = a.fehler ? 'Trotzdem herunterladen' : 'Startpaket herunterladen';
      document.body.appendChild(o);
      const zu = w => { o.remove(); ok(w); };
      o.querySelectorAll('[data-w]').forEach(b => { b.onclick = () => zu(b.dataset.w); });
      o.onclick = e => { if (e.target === o) zu('ab'); };
      o.querySelector('[data-w="ja"]').focus();
    });
  }
  async function exportieren(projekt, aktiv, slugName, herunterladenFn, toastFn) {
    const b = bauen(projekt.dateien, aktiv, projekt.name || slugName);
    const w = await dialog(b.analyse, projekt.name || slugName);
    if (w === 'ab') return false;
    const dateien = w === 'nur' ? projekt.dateien : b.dateien;
    const blob = new Blob(zipBytes(dateien, w === 'nur' ? [] : b.ausfuehrbar, slugName), { type: 'application/zip' });
    herunterladenFn(blob, slugName + '.zip');
    if (toastFn) toastFn('⬇ ' + slugName + '.zip gespeichert' + (w === 'nur' ? '' : ' – entpacken und START-WINDOWS.cmd starten'));
    return true;
  }

  global.SDStartpaket = { analysieren, bauen, zipBytes, exportieren, _intern: { pyKlammern, winPython, shPython } };
})(typeof window !== 'undefined' ? window : globalThis);
