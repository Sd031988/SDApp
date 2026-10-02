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

  function startBeginnt(id) {
    try { localStorage.setItem(START_KEY, id); } catch (e) { /* egal */ }
  }
  function startFertig(id, erfolgreich) {
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

  window.SDLotseModelle = {
    KATALOG, NACH_GROESSE, istIos, istHandy, moeglich, erlaubt, empfehlung, variante,
    modellId, keyVonId, alleIds, gewaehlteEinstellung, speicherBedarf, anfrageZusatz, bereinige,
    okListe, startBeginnt, startFertig, holeAbsturzInfo, zuGrossListe, sperrenZuruecksetzen
  };
})();
