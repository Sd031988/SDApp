/* SD Lotse - Modell-Katalog und automatische Auswahl (gemeinsam fuer den
   KI-Assistenten und alle Apps mit sd-ki.js).

   Alle Modelle laufen ueber WebLLM lokal im Browser. Die Speicherangaben
   (mb) sind die Schaetzungen aus der WebLLM-Modellliste (Version 0.2.83).
   Ob ein Modell auf einem Geraet wirklich laeuft, merkt sich die Seite:
   stuerzt sie beim Laden ab, wird das Modell fuer dieses Geraet gesperrt
   und automatisch ein kleineres genommen. */
(function () {
  'use strict';

  // Reihenfolge = Groesse (klein -> gross)
  const KATALOG = {
    gemma:  { stufe: 1, name: 'Gemma 3 1B',    firma: 'Google',  f16: 'gemma3-1b-it-q4f16_1-MLC',           f32: null,                                mb16: 711,  mb32: null },
    '1b':   { stufe: 2, name: 'Llama 3.2 1B',  firma: 'Meta',    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',  f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', mb16: 879,  mb32: 1129 },
    qwen15: { stufe: 3, name: 'Qwen 2.5 1.5B', firma: 'Alibaba', f16: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', mb16: 1630, mb32: 1889 },
    qwen3:  { stufe: 4, name: 'Qwen 3 1.7B',   firma: 'Alibaba', f16: 'Qwen3-1.7B-q4f16_1-MLC',             f32: 'Qwen3-1.7B-q4f32_1-MLC',            mb16: 2037, mb32: 2635, denktLaut: true },
    '3b':   { stufe: 5, name: 'Llama 3.2 3B',  firma: 'Meta',    f16: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',  f32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC', mb16: 2264, mb32: 2952 }
  };
  const NACH_GROESSE = Object.keys(KATALOG).sort((a, b) => KATALOG[a].stufe - KATALOG[b].stufe);

  // iPhone/iPad: Safari gibt einer Webseite nur begrenzt Arbeitsspeicher.
  // Llama 3B (ca. 2,3 GB) ist dort nachweislich abgestuerzt.
  const IOS_MAX_MB = 1700;

  const ZU_GROSS_KEY = 'sdLotseZuGross';       // ["qwen3", ...] - auf diesem Geraet abgestuerzt
  const START_KEY = 'sdLotseStartLaeuft';      // Modell-ID waehrend des Ladens
  const OK_KEY = 'sdLotseOkModelle';           // Modell-IDs, die hier schon erfolgreich geladen wurden
  const ABSTURZ_KEY = 'sdLotseAbsturz';        // Info fuer die Anzeige im KI-Assistenten
  const OPTIONEN_KEY = 'sdAssistentOptionen';

  function lies(key, standard) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : standard; } catch (e) { return standard; }
  }
  function schreib(key, wert) {
    try { localStorage.setItem(key, JSON.stringify(wert)); } catch (e) { /* egal */ }
  }

  function istIos() {
    const ua = navigator.userAgent || '';
    return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  }
  function istHandy() {
    return istIos() || /Android|Mobi/i.test(navigator.userAgent || '');
  }

  function speicherBedarf(key, gpu) {
    const k = KATALOG[key];
    return (gpu && gpu.f16 && k.f16) ? k.mb16 : (k.f32 ? k.mb32 : k.mb16);
  }

  // Grundsaetzlich moeglich auf diesem Geraet? (unabhaengig von Abstuerzen)
  function moeglich(key, gpu) {
    const k = KATALOG[key];
    if (!k) return false;
    if (!(gpu && gpu.f16) && !k.f32) return false;   // Gemma gibt es nur in der f16-Variante
    if (istIos() && speicherBedarf(key, gpu) > IOS_MAX_MB) return false;
    return true;
  }

  function zuGrossListe() { return lies(ZU_GROSS_KEY, []); }

  function erlaubt(key, gpu) {
    return moeglich(key, gpu) && !zuGrossListe().includes(key);
  }

  // Empfehlung fuer dieses Geraet. navigator.deviceMemory gibt es nur in
  // Chrome/Edge/Android (gerundet: 0.5, 1, 2, 4, 8); Safari/Firefox: unbekannt.
  function empfehlung(gpu) {
    const ram = navigator.deviceMemory || 0;
    let ziel;
    if (istIos()) ziel = '1b';                       // auf iPhone bereits erprobt
    else if (istHandy()) ziel = ram >= 8 ? 'qwen3' : (ram >= 4 ? '1b' : 'gemma');
    else ziel = (ram === 0 || ram >= 8) ? 'qwen3' : (ram >= 4 ? 'qwen15' : '1b');
    // Von der Empfehlung abwaerts das erste erlaubte Modell nehmen
    const start = NACH_GROESSE.indexOf(ziel);
    for (let i = start; i >= 0; i--) if (erlaubt(NACH_GROESSE[i], gpu)) return NACH_GROESSE[i];
    for (let i = start + 1; i < NACH_GROESSE.length; i++) if (erlaubt(NACH_GROESSE[i], gpu)) return NACH_GROESSE[i];
    return '1b';
  }

  // Gewaehlte Einstellung ('auto' oder ein Schluessel) -> tatsaechliches Modell
  function variante(gewaehlt, gpu) {
    if (gewaehlt && gewaehlt !== 'auto' && erlaubt(gewaehlt, gpu)) return gewaehlt;
    return empfehlung(gpu);
  }

  function modellId(key, gpu) {
    const k = KATALOG[key] || KATALOG['1b'];
    return (gpu && gpu.f16 && k.f16) ? k.f16 : (k.f32 || k.f16);
  }

  function keyVonId(id) {
    for (const key of NACH_GROESSE) {
      if (KATALOG[key].f16 === id || KATALOG[key].f32 === id) return key;
    }
    return null;
  }

  function alleIds() {
    const ids = [];
    NACH_GROESSE.forEach(key => { if (KATALOG[key].f16) ids.push(KATALOG[key].f16); if (KATALOG[key].f32) ids.push(KATALOG[key].f32); });
    return ids;
  }

  function gewaehlteEinstellung() {
    const o = lies(OPTIONEN_KEY, {});
    return (o.llamaModell === 'auto' || KATALOG[o.llamaModell]) ? o.llamaModell : 'auto';
  }

  // Zusaetze fuer die Anfrage: Qwen 3 "denkt" sonst erst lange laut nach.
  function anfrageZusatz(id) {
    const key = keyVonId(id);
    return (key && KATALOG[key].denktLaut) ? { extra_body: { enable_thinking: false } } : {};
  }

  // Falls ein Modell trotzdem Denk-Text ausgibt: entfernen.
  function bereinige(text) {
    return String(text || '').replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/^\s+/, '');
  }

  function okListe() { return lies(OK_KEY, []); }

  // Verlaesst man die Seite waehrend des Ladens (App gewechselt, Tab im
  // Hintergrund), darf das Betriebssystem sie beenden - das ist kein
  // Absturz. Deshalb gilt der Merker nur, solange die Seite sichtbar ist.
  let laufendeId = null;
  function merkerSetzen(an) {
    try { if (an && laufendeId) localStorage.setItem(START_KEY, laufendeId); else localStorage.removeItem(START_KEY); } catch (e) { /* egal */ }
  }
  document.addEventListener('visibilitychange', () => {
    if (laufendeId) merkerSetzen(document.visibilityState === 'visible');
  });
  window.addEventListener('pagehide', () => { if (laufendeId) merkerSetzen(false); });

  function startBeginnt(id) {
    laufendeId = id;
    merkerSetzen(document.visibilityState !== 'hidden');
  }
  function startFertig(id, erfolgreich) {
    laufendeId = null;
    try { localStorage.removeItem(START_KEY); } catch (e) { /* egal */ }
    if (erfolgreich) {
      const ok = okListe();
      if (!ok.includes(id)) { ok.push(id); schreib(OK_KEY, ok); }
    }
  }

  // Beim Laden jeder Seite: Steht der Start-Merker noch da, ist die Seite
  // beim letzten Laden des Modells abgestuerzt (meist zu wenig Speicher).
  // Dann das Modell fuer dieses Geraet sperren und auf "Automatisch"
  // stellen - ausser es war schon das kleinste moegliche Modell.
  function pruefeAbsturz() {
    let id = null;
    try { id = localStorage.getItem(START_KEY); localStorage.removeItem(START_KEY); } catch (e) { return; }
    if (!id) return;
    const key = keyVonId(id);
    const info = { id, key, name: key ? KATALOG[key].name : id, gesperrt: false };
    if (key) {
      const kleinere = NACH_GROESSE.filter(k => KATALOG[k].stufe < KATALOG[key].stufe && moeglich(k, null) && !zuGrossListe().includes(k));
      // Ohne GPU-Info pruefen wir grob: gibt es noch ein kleineres Modell?
      if (kleinere.length) {
        const liste = zuGrossListe();
        if (!liste.includes(key)) { liste.push(key); schreib(ZU_GROSS_KEY, liste); }
        info.gesperrt = true;
        const o = lies(OPTIONEN_KEY, {});
        if (o.llamaModell === key) { o.llamaModell = 'auto'; schreib(OPTIONEN_KEY, o); }
      }
    }
    schreib(ABSTURZ_KEY, info);
  }

  function holeAbsturzInfo() {
    const info = lies(ABSTURZ_KEY, null);
    try { localStorage.removeItem(ABSTURZ_KEY); } catch (e) { /* egal */ }
    return info;
  }

  // Gesperrte Modelle wieder freigeben (z. B. nach Loeschen aller Modelle)
  function sperrenZuruecksetzen() {
    try { localStorage.removeItem(ZU_GROSS_KEY); } catch (e) { /* egal */ }
  }

  pruefeAbsturz();

  // Feste Antworten auf kurze Fragen wie "Bist du noch da?" oder "Wer bist
  // du?". Kleine Modelle (1 Mrd. Parameter) erfinden hier sonst Unsinn
  // ("Ich bin ein Llama-Modell auf der Plattform Gemea"). Nur fuer sehr
  // kurze Nachrichten, die genau so eine Frage sind - alles andere geht an
  // das Modell. modell z. B. "Llama 3.2 1B by Meta".
  function schnellAntwort(nachricht, sprache, modell) {
    const m = String(nachricht || '').trim().toLowerCase()
      .replace(/[!?.…,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
      .replace(/^(hallo|hey|hi|hello|ok|okay|sd lotse|lotse) /, '').replace(/ (sd lotse|lotse|bitte|please)$/, '');
    if (!m || m.length > 60) return null;
    const en = sprache === 'en';
    const name = String(modell || '').replace(' by ', en ? ' by ' : ' von ');
    const A = en ? {
      da: 'Yes, I am here! 😊 What can I help you with – a CV, a cover letter, a letter or something else?',
      wer: 'I am SD Lotse, the AI of SD Hub. I run directly here on your device – your messages are not sent anywhere. I help with CVs, cover letters, letters and other texts.',
      modell: 'I am SD Lotse, the AI of SD Hub. Technically, the model ' + name + ' is running here – locally in your browser, without an internet server. It is a small model: for difficult questions, ☁️ Gemini is more accurate.',
      kann: 'For example, I can help you with:\n- writing or improving your CV and cover letter\n- wording letters and e-mails\n- shortening, improving or translating texts\n- summarising documents you attach\n- explaining things simply\n\nWhat would you like to do?',
      danke: 'You are welcome! Let me know if you need anything else.'
    } : {
      da: 'Ja, ich bin da! 😊 Wobei kann ich dir helfen – Lebenslauf, Anschreiben, ein Brief oder etwas anderes?',
      wer: 'Ich bin SD Lotse, die KI von SD Hub. Ich laufe direkt hier auf deinem Gerät – deine Nachrichten werden nirgendwohin gesendet. Ich helfe dir bei Lebenslauf, Anschreiben, Briefen und anderen Texten.',
      modell: 'Ich bin SD Lotse, die KI von SD Hub. Technisch läuft hier gerade das Modell ' + name + ' – lokal in deinem Browser, ohne Internet-Server. Es ist ein kleines Modell: Für schwierige Fragen ist ☁️ Gemini genauer.',
      kann: 'Ich kann dir zum Beispiel helfen:\n- Lebenslauf und Anschreiben schreiben oder verbessern\n- Briefe und E-Mails formulieren\n- Texte kürzen, verbessern oder übersetzen\n- Dokumente zusammenfassen, die du anhängst\n- Dinge einfach erklären\n\nWas möchtest du machen?',
      danke: 'Gern geschehen! Sag Bescheid, wenn du noch etwas brauchst.'
    };
    if (/^((bist|biste) du (noch |immer noch )?(da|wach|online|dran|bereit)|noch da|jemand da|hallo|are you (still )?(there|online|awake|ready)|still there|anyone there)$/.test(m)) return A.da;
    if (/^(wer bist du( eigentlich)?|was bist du( eigentlich)?|wie hei(ß|ss)t du|stell dich (mal )?vor|who are you|what are you|what is your name|what's your name|introduce yourself)$/.test(m)) return A.wer;
    if (/^(welches|was für ein|welche|auf welchem) (ki-?)?(modell|ki|llm|sprachmodell|ki-modell)( bist du| nutzt du| benutzt du| läuft| basierst du)?|(which|what) (ai )?(model|llm)( are you| do you use)?|^(bist du|are you) (chatgpt|gpt|gemini|llama|gemma|qwen|claude|eine ki|ein mensch|ein roboter|ein bot|a human|human|an ai|a robot|a bot)$/.test(m)) return A.modell;
    if (/^(was kannst du( alles)?( machen| tun)?|wobei kannst du (mir )?helfen|wie kannst du (mir )?helfen|what can you do|how can you help( me)?)$/.test(m)) return A.kann;
    if (/^(danke( schön| sehr| dir)?|vielen dank|dankeschön|thanks?( a lot)?|thank you( very much)?|merci|super danke)$/.test(m)) return A.danke;
    return null;
  }

  window.SDLotseModelle = {
    KATALOG, NACH_GROESSE, istIos, istHandy, moeglich, erlaubt, empfehlung, variante,
    modellId, keyVonId, alleIds, gewaehlteEinstellung, speicherBedarf, anfrageZusatz, bereinige,
    okListe, startBeginnt, startFertig, holeAbsturzInfo, zuGrossListe, sperrenZuruecksetzen, schnellAntwort
  };
})();
