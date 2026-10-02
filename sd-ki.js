/* ==========================================================
   SD Suite – gemeinsame KI-Bausteine fuer alle Apps
   ==========================================================
   - SD Lotse: eigene KI, laeuft lokal im Browser (WebLLM, WebGPU),
     ohne Schluessel und ohne dass Texte das Geraet verlassen. Basiert auf
     offenen Modellen (Llama, Gemma, Qwen - siehe sd-lotse-modelle.js). Das Modell wird nur EINMAL
     heruntergeladen und steht dann allen SD-Apps auf thesdhub.com zur
     Verfuegung (gleicher Browser-Speicher).
   - Gemini: ueber gemini-modelle.js mit dem eigenen Gratis-Schluessel.
   - Gemeinsame Auswahl "Gemini / SD Lotse" (localStorage sdKiAnbieter).
   - Dialog "KI-Hilfe zum Dokument" (PDF-Studio, Scanner).

   Oeffentliche Schnittstelle: window.sdKi
   ========================================================== */
(function () {
  'use strict';

  const SKRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;
  const WORKER_URL = new URL('sd-lotse-worker.js', SKRIPT_URL).href;
  const INFO_URL = new URL('datenschutz.html#ki', SKRIPT_URL).href;
  const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.83';
  // Gleiche Modelle wie im KI-Assistenten -> derselbe Download fuer alle
  // Apps. Katalog, automatische Auswahl und Absturz-Schutz: sd-lotse-modelle.js
  const MODELLE_URL = new URL('sd-lotse-modelle.js?v=2', SKRIPT_URL).href;
  const modelleBereit = window.SDLotseModelle ? Promise.resolve(window.SDLotseModelle) : new Promise((ok, fehler) => {
    const sc = document.createElement('script');
    sc.src = MODELLE_URL;
    sc.onload = () => window.SDLotseModelle ? ok(window.SDLotseModelle) : fehler(new Error('sd-lotse-modelle.js'));
    sc.onerror = () => fehler(new Error('sd-lotse-modelle.js konnte nicht geladen werden'));
    (document.head || document.documentElement).appendChild(sc);
  });
  modelleBereit.catch(() => { /* Fehler zeigt sich erst beim Benutzen */ });
  const ANBIETER_STORAGE = 'sdKiAnbieter';
  const GEMINI_KEY_STORAGE = 'biGeminiApiKey';
  const LOTSE_MAX_ZEICHEN = 6000;   // ca. 2.000 Token - Llama 3.2 im Browser hat ~4.000 Token Kontext
  const GEMINI_MAX_ZEICHEN = 60000;

  const TEXTE = {
    de: {
      anbieter_titel: 'KI wählen',
      gemini: '☁️ Gemini', gemini_sub: 'online · Gemini-Schlüssel nötig · Texte gehen an Google',
      lotse: '🔒 SD Lotse', lotse_sub: 'eigene KI · lokal auf diesem Gerät · ohne Schlüssel',
      openai: '🟢 ChatGPT', openai_sub: 'OpenAI · eigener Schlüssel · Zahlung nach Nutzung',
      claude: '🟠 Claude', claude_sub: 'Anthropic · eigener Schlüssel · Zahlung nach Nutzung',
      key_link_openai: '🔗 Schlüssel bei OpenAI holen', key_link_claude: '🔗 Schlüssel bei Anthropic holen',
      key_lbl_openai: 'Dein OpenAI-API-Schlüssel', key_lbl_claude: 'Dein Anthropic-API-Schlüssel (Claude)',
      key_ph: 'Schlüssel hier einfügen …', key_speichern: 'Schlüssel speichern', key_dauerhaft: 'Dauerhaft in diesem Browser merken',
      key_gespeichert: '✓ Gespeichert', key_entfernt: 'Schlüssel entfernt',
      online_hinweis: 'Du zahlst direkt beim Anbieter nur, was du nutzt (vorher Guthaben aufladen, meist ab 5 $). Deine Texte gehen direkt von deinem Gerät an {firma} – nicht über uns. Derselbe Schlüssel gilt auch im KI-Assistenten.',
      kein_key_online: 'Für {name} ist ein eigener Schlüssel nötig – bitte oben im KI-Bereich eintragen.',
      online_key_falsch: '{name} hat den Schlüssel abgelehnt. Bitte prüfen.',
      online_guthaben: 'Bei {firma} ist kein Guthaben mehr vorhanden. Bitte beim Anbieter Guthaben aufladen.',
      online_rate: '{name}: zu viele Anfragen in kurzer Zeit. Bitte kurz warten.',
      online_fehler: '{name}-Anfrage fehlgeschlagen (Status {status}).',
      online_netz: 'Keine Verbindung zu {firma}. Bitte Internetverbindung prüfen.',
      online_leer: '{name} hat keinen Text geliefert.',
      dlg_privat_online: '☁️ Der Text wird zur Bearbeitung an {firma} gesendet.',
      lotse_hinweis: 'SD Lotse läuft komplett auf deinem Gerät (am besten PC/Laptop mit Chrome oder Edge). Er ist kleiner als Gemini – für kurze Texte gut, für lange Texte schwächer.',
      info: 'ℹ️ Datenschutz & Lizenzen',
      dl_titel: '🔒 SD Lotse einmalig herunterladen?',
      dl_text: 'Damit die eigene KI lokal auf deinem Gerät arbeiten kann, wird sie einmalig heruntergeladen (ca. {groesse}) und im Browser gespeichert. Danach steht sie in allen SD-Apps bereit – ohne Schlüssel, und deine Texte verlassen das Gerät nicht. Tipp: am besten im WLAN.',
      dl_ok: '⬇️ Herunterladen & starten', abbrechen: 'Abbrechen',
      laden_titel: '🔒 SD Lotse wird gestartet …', laden: 'Wird geladen …',
      abgebrochen: 'Abgebrochen.',
      unsupported: 'Dein Browser oder Gerät kann SD Lotse leider nicht lokal ausführen (WebGPU fehlt oder ist zu schwach). Am besten klappt es mit Chrome oder Edge am PC/Laptop – oder wähle ☁️ Gemini.',
      tech: 'Technischer Grund',
      laden_fehler: 'SD Lotse konnte nicht geladen werden: {msg}',
      kein_text: 'SD Lotse hat keinen Text geliefert. Bitte nochmal versuchen.',
      kein_key: 'Für ☁️ Gemini ist ein Gemini-Schlüssel nötig (z. B. im KI-Assistenten unter ⚙️ eintragen) – oder wähle 🔒 SD Lotse.',
      gemini_fehler: 'Google-Anfrage fehlgeschlagen (Status {status}).',
      gemini_key_falsch: 'Google hat den Gemini-Schlüssel abgelehnt.',
      gemini_kontingent: 'Das kostenlose Gemini-Kontingent ist gerade aufgebraucht – später nochmal versuchen oder 🔒 SD Lotse wählen.',
      netz: 'Keine Verbindung zu Google. Bitte Internetverbindung prüfen – oder 🔒 SD Lotse wählen.',
      ein_titel: '📥 Vorhandenes Dokument einlesen',
      ein_datei: '📎 Datei wählen (PDF, Word, Foto, Text)',
      ein_verbessern: 'Formulierungen dabei verbessern (Fakten wie Daten, Firmen und Abschlüsse bleiben unverändert)',
      ein_lesen: '📄 Lese „{name}“ …',
      ein_ocr: '🔎 Texterkennung … {p} %',
      ein_ki_laeuft: '🤖 Die KI ordnet die Angaben zu …',
      ein_leer: 'In der Datei wurde kein lesbarer Text gefunden.',
      ein_doc_alt: 'Alte Word-Dateien (.doc) gehen leider nicht – bitte als .docx oder PDF speichern.',
      ein_typ: 'Dieser Dateityp wird nicht unterstützt. Bitte PDF, Word (.docx), Foto oder Textdatei wählen.',
      ein_nichts: 'Die KI konnte keine Angaben zuordnen. Bitte eine andere Datei oder eine andere KI versuchen.',
      ein_pruefen: 'Bitte prüfen und bei Bedarf korrigieren. Nur angehakte Felder werden übernommen – bestehende Eingaben in diesen Feldern werden ersetzt.',
      ein_uebernehmen: '✅ Übernehmen', ein_gekuerzt: 'Hinweis: Das Dokument ist lang – SD Lotse hat nur den Anfang gelesen. Für das ganze Dokument eine Online-KI wählen.',
      ein_fertig: '✓ {n} Felder übernommen.',
      sp_titel: '🎤 Erzählen statt tippen',
      sp_ph: 'Tippe auf „🎤 Sprechen“ und erzähl einfach – oder schreib hier hinein …',
      sp_start: '🎤 Sprechen', sp_stopp: '⏹ Stopp', sp_eintragen: '🤖 Eintragen lassen',
      sp_info: 'Die Spracherkennung macht dein Browser (bei Chrome/Android über Google, bei Safari/iPhone über Apple).',
      sp_hoert: '🔴 Ich höre zu … Sprich ruhig in ganzen Sätzen. Mit „Stopp“ beenden.',
      sp_keine: 'Dein Browser hat keine eigene Spracherkennung. Tipp: Nutze das 🎤 auf deiner Handy-Tastatur und sprich in das Feld.',
      sp_verweigert: 'Das Mikrofon ist nicht erlaubt. Bitte in den Browser-Einstellungen das Mikrofon für diese Seite erlauben – oder das 🎤 der Tastatur nutzen.',
      sp_fehler: 'Spracherkennung: {msg}',
      sp_leer: 'Bitte zuerst etwas erzählen oder schreiben.',
      ein_lotse_tipp: 'SD Lotse ist für diese Aufgabe oft zu klein – mit Gemini, ChatGPT oder Claude klappt die Zuordnung deutlich besser.',
      ein_regeln: 'Hinweis: Ein Teil der Felder wurde ohne KI anhand des Aufbaus erkannt – bitte besonders genau prüfen. Mit Gemini, ChatGPT oder Claude wird die Zuordnung meist vollständiger.',
      ein_ki_fehler: 'Die KI hat nicht geantwortet ({msg}). Die Felder unten wurden ohne KI anhand des Aufbaus erkannt – bitte genau prüfen.',
      ein_privat_lotse: '🔒 SD Lotse liest lokal – die Datei verlässt dein Gerät nicht.',
      ein_privat_online: '☁️ Die Datei und ihr Text werden zur Zuordnung an {firma} gesendet.',
      ein_privat_online_text: '☁️ Dein Text wird zur Zuordnung an {firma} gesendet.',
      ein_privat_lotse_text: '🔒 SD Lotse ordnet lokal zu – dein Text verlässt das Gerät nicht.',
      dlg_titel: '🤖 KI-Hilfe zum Dokument',
      dlg_quelle: 'Erkannter Text: {n} Zeichen',
      dlg_gekuerzt: ' (für SD Lotse auf den Anfang gekürzt)',
      dlg_leer: 'Kein Text gefunden. Bei gescannten Dokumenten bitte zuerst die Texterkennung (OCR) ausführen.',
      dlg_schliessen: 'Schließen', dlg_kopieren: '📋 Kopieren', dlg_kopiert: 'Kopiert ✓', dlg_uebernehmen: '↩️ In den Text übernehmen',
      dlg_stopp: '■ Stopp', dlg_privat_lotse: '🔒 Läuft lokal – der Text verlässt dein Gerät nicht.',
      dlg_privat_gemini: '☁️ Der Text wird zur Bearbeitung an Google Gemini gesendet.',
      dlg_hinweis_recht: 'Hinweis: Die KI kann sich irren und ersetzt keine Rechts-, Steuer- oder Finanzberatung.',
      act_zusammenfassen: '📋 Zusammenfassen', act_erklaeren: '❓ Was will das Schreiben von mir?', act_antwort: '✍️ Antwort entwerfen', act_korrigieren: '🔤 Erkennungsfehler korrigieren',
      p_zusammenfassen: 'Fasse dieses Dokument kurz und verständlich in Stichpunkten zusammen: Worum geht es, wer schreibt an wen, was wird verlangt, wichtige Fristen, Beträge und Aktenzeichen (nur falls im Text vorhanden). Erfinde nichts dazu.',
      p_erklaeren: 'Erkläre in einfacher Sprache, was dieses Schreiben von mir möchte und was ich jetzt konkret tun sollte (mit Frist, falls im Text genannt). Wenn etwas unklar ist oder im Text fehlt, sag das ehrlich.',
      p_antwort: 'Entwirf eine höfliche, kurze Antwort auf dieses Schreiben (nur den Brieftext, ohne Briefkopf). Lass Angaben, die du nicht kennst, als [Lücke] in eckigen Klammern.',
      p_korrigieren: 'Dieser Text stammt aus einer automatischen Texterkennung (OCR). Korrigiere nur offensichtliche Erkennungs- und Rechtschreibfehler, ohne Inhalt, Zahlen oder Namen zu verändern. Gib ausschließlich den korrigierten Text aus.'
    },
    en: {
      anbieter_titel: 'Choose AI',
      gemini: '☁️ Gemini', gemini_sub: 'online · Gemini key needed · text is sent to Google',
      lotse: '🔒 SD Lotse', lotse_sub: 'own AI · local on this device · no key',
      openai: '🟢 ChatGPT', openai_sub: 'OpenAI · own key · pay per use',
      claude: '🟠 Claude', claude_sub: 'Anthropic · own key · pay per use',
      key_link_openai: '🔗 Get a key from OpenAI', key_link_claude: '🔗 Get a key from Anthropic',
      key_lbl_openai: 'Your OpenAI API key', key_lbl_claude: 'Your Anthropic API key (Claude)',
      key_ph: 'Paste key here …', key_speichern: 'Save key', key_dauerhaft: 'Remember permanently in this browser',
      key_gespeichert: '✓ Saved', key_entfernt: 'Key removed',
      online_hinweis: 'You pay the provider directly for what you use (top up credit first, usually from $5). Your texts go directly from your device to {firma} – not through us. The same key also works in the AI assistant.',
      kein_key_online: '{name} needs your own key – please enter it in the AI section above.',
      online_key_falsch: '{name} rejected the key. Please check it.',
      online_guthaben: 'Your {firma} credit is used up. Please top up with the provider.',
      online_rate: '{name}: too many requests in a short time. Please wait a moment.',
      online_fehler: '{name} request failed (status {status}).',
      online_netz: 'No connection to {firma}. Please check your internet connection.',
      online_leer: '{name} returned no text.',
      dlg_privat_online: '☁️ The text is sent to {firma} for processing.',
      lotse_hinweis: 'SD Lotse runs entirely on your device (best on a PC/laptop with Chrome or Edge). It is smaller than Gemini – good for short texts, weaker for long ones.',
      info: 'ℹ️ Privacy & licenses',
      dl_titel: '🔒 Download SD Lotse once?',
      dl_text: 'To work locally on your device, our own AI is downloaded once (approx. {groesse}) and stored in the browser. After that it is available in all SD apps – no key needed, and your texts never leave the device. Tip: best over Wi-Fi.',
      dl_ok: '⬇️ Download & start', abbrechen: 'Cancel',
      laden_titel: '🔒 Starting SD Lotse …', laden: 'Loading …',
      abgebrochen: 'Cancelled.',
      unsupported: 'Your browser or device cannot run SD Lotse locally (WebGPU missing or too weak). It works best with Chrome or Edge on a PC/laptop – or choose ☁️ Gemini.',
      tech: 'Technical reason',
      laden_fehler: 'SD Lotse could not be loaded: {msg}',
      kein_text: 'SD Lotse returned no text. Please try again.',
      kein_key: '☁️ Gemini needs a Gemini key (e.g. enter it in the AI assistant under ⚙️) – or choose 🔒 SD Lotse.',
      gemini_fehler: 'Google request failed (status {status}).',
      gemini_key_falsch: 'Google rejected the Gemini key.',
      gemini_kontingent: 'The free Gemini quota is used up for now – try again later or choose 🔒 SD Lotse.',
      netz: 'No connection to Google. Please check your internet connection – or choose 🔒 SD Lotse.',
      ein_titel: '📥 Import an existing document',
      ein_datei: '📎 Choose file (PDF, Word, photo, text)',
      ein_verbessern: 'Improve the wording (facts like dates, companies and degrees stay unchanged)',
      ein_lesen: '📄 Reading "{name}" …',
      ein_ocr: '🔎 Recognizing text … {p} %',
      ein_ki_laeuft: '🤖 The AI is sorting the details …',
      ein_leer: 'No readable text was found in the file.',
      ein_doc_alt: 'Old Word files (.doc) are not supported – please save as .docx or PDF.',
      ein_typ: 'This file type is not supported. Please choose PDF, Word (.docx), photo or text file.',
      ein_nichts: 'The AI could not assign any details. Please try another file or another AI.',
      ein_pruefen: 'Please check and correct if needed. Only ticked fields are applied – existing entries in these fields will be replaced.',
      ein_uebernehmen: '✅ Apply', ein_gekuerzt: 'Note: the document is long – SD Lotse only read the beginning. Choose an online AI for the whole document.',
      ein_fertig: '✓ {n} fields applied.',
      sp_titel: '🎤 Talk instead of typing',
      sp_ph: 'Tap "🎤 Speak" and just talk – or type here …',
      sp_start: '🎤 Speak', sp_stopp: '⏹ Stop', sp_eintragen: '🤖 Fill in for me',
      sp_info: 'Speech recognition is done by your browser (Chrome/Android via Google, Safari/iPhone via Apple).',
      sp_hoert: '🔴 Listening … feel free to speak in full sentences. Tap "Stop" to finish.',
      sp_keine: 'Your browser has no speech recognition of its own. Tip: use the 🎤 on your phone keyboard and speak into the field.',
      sp_verweigert: 'The microphone is not allowed. Please allow it for this site in the browser settings – or use the keyboard 🎤.',
      sp_fehler: 'Speech recognition: {msg}',
      sp_leer: 'Please say or write something first.',
      ein_lotse_tipp: 'SD Lotse is often too small for this task – Gemini, ChatGPT or Claude assign the details much better.',
      ein_regeln: 'Note: some fields were recognized without AI from the layout – please check them carefully. Gemini, ChatGPT or Claude usually assign more completely.',
      ein_ki_fehler: 'The AI did not answer ({msg}). The fields below were recognized without AI from the layout – please check carefully.',
      ein_privat_lotse: '🔒 SD Lotse reads locally – the file never leaves your device.',
      ein_privat_online: '☁️ The file and its text are sent to {firma} for sorting.',
      ein_privat_online_text: '☁️ Your text is sent to {firma} for sorting.',
      ein_privat_lotse_text: '🔒 SD Lotse sorts locally – your text never leaves the device.',
      dlg_titel: '🤖 AI help for this document',
      dlg_quelle: 'Recognized text: {n} characters',
      dlg_gekuerzt: ' (shortened to the beginning for SD Lotse)',
      dlg_leer: 'No text found. For scanned documents please run text recognition (OCR) first.',
      dlg_schliessen: 'Close', dlg_kopieren: '📋 Copy', dlg_kopiert: 'Copied ✓', dlg_uebernehmen: '↩️ Use in text',
      dlg_stopp: '■ Stop', dlg_privat_lotse: '🔒 Runs locally – the text never leaves your device.',
      dlg_privat_gemini: '☁️ The text is sent to Google Gemini for processing.',
      dlg_hinweis_recht: 'Note: the AI can be wrong and does not replace legal, tax or financial advice.',
      act_zusammenfassen: '📋 Summarize', act_erklaeren: '❓ What does this letter want from me?', act_antwort: '✍️ Draft a reply', act_korrigieren: '🔤 Fix recognition errors',
      p_zusammenfassen: 'Summarize this document briefly and clearly in bullet points: what it is about, who writes to whom, what is requested, important deadlines, amounts and reference numbers (only if present in the text). Do not invent anything.',
      p_erklaeren: 'Explain in plain language what this letter wants from me and what I should do now (with the deadline, if stated in the text). If something is unclear or missing in the text, say so honestly.',
      p_antwort: 'Draft a short, polite reply to this letter (letter body only, no letterhead). Leave details you do not know as a [gap] in square brackets.',
      p_korrigieren: 'This text comes from automatic text recognition (OCR). Fix only obvious recognition and spelling errors without changing content, numbers or names. Output only the corrected text.'
    }
  };

  function sprache() { return window.SD_LANG === 'en' ? 'en' : 'de'; }
  function tx(key, vars) {
    let s = (TEXTE[sprache()] || TEXTE.de)[key];
    if (s == null) s = TEXTE.de[key] || key;
    if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function lesen(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
  function schreiben(store, key, wert) { try { store.setItem(key, wert); } catch (e) { /* optional */ } }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ------------------------------------------------------------
  // Anbieter-Auswahl
  // ------------------------------------------------------------
  const ANBIETER_WERTE = ['gemini', 'openai', 'claude', 'lotse'];
  // OpenAI/Claude: gleiche Schluessel und Modellwahl wie im KI-Assistenten
  const ONLINE = {
    openai: { name: 'ChatGPT', firma: 'OpenAI', keyStorage: 'sdOpenAiApiKey', link: 'https://platform.openai.com/api-keys',
      modellOption: 'openaiModell', standardModell: 'gpt-5-mini', erlaubt: ['gpt-5-mini', 'gpt-5-nano'] },
    claude: { name: 'Claude', firma: 'Anthropic', keyStorage: 'sdClaudeApiKey', link: 'https://console.anthropic.com/settings/keys',
      modellOption: 'claudeModell', standardModell: 'claude-haiku-4-5-20251001', erlaubt: ['claude-haiku-4-5-20251001', 'claude-sonnet-5-5'] }
  };
  function anbieter() {
    const w = lesen(localStorage, ANBIETER_STORAGE);
    return ANBIETER_WERTE.includes(w) ? w : 'gemini';
  }
  function setzeAnbieter(wert) {
    schreiben(localStorage, ANBIETER_STORAGE, ANBIETER_WERTE.includes(wert) ? wert : 'gemini');
    document.dispatchEvent(new CustomEvent('sd-ki-anbieter', { detail: { anbieter: anbieter() } }));
  }

  // ------------------------------------------------------------
  // Styles (einmalig, mit eigenem Praefix, damit nichts kollidiert)
  // ------------------------------------------------------------
  function stylesEinfuegen() {
    if (document.getElementById('sdki-styles')) return;
    const st = document.createElement('style');
    st.id = 'sdki-styles';
    st.textContent = `
.sdki-wahl{border:1px solid #d8e0dc;border-radius:12px;padding:10px;background:#fbfdfc;margin:0 0 12px;font-family:inherit}
.sdki-wahl-titel{font-size:.72rem;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;color:#647482;margin-bottom:6px}
.sdki-optionen{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.sdki-opt{display:flex;flex-direction:column;gap:2px;border:1px solid #d8e0dc;border-radius:10px;padding:8px 10px;background:#fff;cursor:pointer;text-align:left;font-family:inherit;color:#172a3a;min-height:44px}
.sdki-opt strong{font-size:.9rem}
.sdki-opt small{font-size:.7rem;color:#647482;line-height:1.3}
.sdki-opt.aktiv{border-color:#2f7d72;background:#dcece7;box-shadow:inset 0 0 0 1px #2f7d72}
.sdki-hinweis,.sdki-box .sdki-hinweis{font-size:.75rem;color:#647482;margin:6px 2px 0;line-height:1.45}
.sdki-hinweis a{color:#2f7d72}
.sdki-key{display:grid;gap:6px;margin-top:8px}
.sdki-key a.sdki-keylink{display:inline-block;font-size:.85rem;font-weight:bold;color:#2f7d72}
.sdki-key label{font-size:.78rem;font-weight:bold;color:#172a3a}
.sdki-key input[type=password]{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #d8e0dc;border-radius:10px;font-size:16px;font-family:inherit;background:#fff}
.sdki-key .sdki-zeile{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:.8rem;color:#647482}
.sdki-key select{width:100%;max-width:100%;padding:8px 10px;border:1px solid #d8e0dc;border-radius:10px;font-size:15px;font-family:inherit;background:#fff}
@media (max-width:420px){.sdki-opt{padding:7px 8px}.sdki-opt small{font-size:.66rem}}
.sdki-badge{margin:0 auto 0 8px;font-size:.72rem;font-weight:bold;padding:2px 8px;border-radius:999px;background:#fff;color:#1c4a42;border:1px solid #2f7d72;white-space:nowrap}
.sdki-overlay{position:fixed;inset:0;background:rgba(23,42,58,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Trebuchet MS',Verdana,sans-serif}
.sdki-box{background:#fff;color:#172a3a;border-radius:16px;max-width:620px;width:100%;max-height:calc(100dvh - 32px);overflow:auto;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);display:grid;gap:10px}
.sdki-box h2{font-family:Georgia,serif;font-size:1.15rem;margin:0}
.sdki-box p{margin:0;line-height:1.55;font-size:.92rem}
.sdki-klein{font-size:.78rem!important;color:#647482}
.sdki-knoepfe{display:flex;flex-wrap:wrap;gap:8px}
.sdki-btn{border:1px solid #d8e0dc;background:#fff;color:#172a3a;border-radius:10px;padding:9px 14px;min-height:42px;font-family:inherit;font-weight:bold;font-size:.88rem;cursor:pointer}
.sdki-btn.prim{background:#2f7d72;border-color:#2f7d72;color:#fff}
.sdki-btn.akt{background:#dcece7;border-color:#2f7d72;color:#1c4a42}
.sdki-btn:disabled{opacity:.5;cursor:default}
.sdki-balken{height:10px;background:#dcece7;border-radius:999px;overflow:hidden}
.sdki-balken>div{height:100%;width:0;background:#2f7d72;transition:width .3s}
.sdki-ausgabe{white-space:pre-wrap;background:#fffdf8;border:1px solid #d8e0dc;border-radius:10px;padding:12px;min-height:80px;max-height:45dvh;overflow:auto;font-size:.92rem;line-height:1.55;overflow-wrap:anywhere}
.sdki-felder{display:grid;gap:8px;max-height:48dvh;overflow:auto;padding-right:2px}
.sdki-feld{display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center;border:1px solid #d8e0dc;border-radius:10px;padding:8px}
.sdki-feld input[type=checkbox]{width:18px;height:18px;margin:0}
.sdki-feld strong{font-size:.8rem}
.sdki-feld textarea{grid-column:1/-1;width:100%;box-sizing:border-box;border:1px solid #d8e0dc;border-radius:8px;padding:6px 8px;font:inherit;font-size:.88rem;resize:vertical;min-height:38px}
.sdki-diktat{width:100%;box-sizing:border-box;border:1px solid #d8e0dc;border-radius:10px;padding:10px;font:inherit;font-size:16px;line-height:1.5;resize:vertical;min-height:140px}
.sdki-check{display:flex;gap:8px;align-items:flex-start;font-size:.85rem;line-height:1.4}
.sdki-fehler{background:#fdf0ee;border:1px solid #f1c4bf;color:#b42318;border-radius:10px;padding:10px 12px;font-size:.88rem;white-space:pre-line}`;
    document.head.appendChild(st);
  }

  // ------------------------------------------------------------
  // Auswahl-Baustein (fuer die KI-Bereiche der Apps)
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // OpenAI / Claude: Schluessel-Feld im KI-Bereich der Apps
  // ------------------------------------------------------------
  function onlineKey(a) {
    const k = ONLINE[a].keyStorage;
    return lesen(sessionStorage, k) || lesen(localStorage, k) || '';
  }
  function onlineModell(a) {
    try {
      const o = JSON.parse(lesen(localStorage, 'sdAssistentOptionen') || '{}');
      const m = o[ONLINE[a].modellOption];
      return ONLINE[a].erlaubt.includes(m) ? m : ONLINE[a].standardModell;
    } catch (e) { return ONLINE[a].standardModell; }
  }
  function schluesselBoxHtml(a) {
    const o = ONLINE[a];
    const dauerhaft = !!lesen(localStorage, o.keyStorage);
    return '<div class="sdki-key">' +
      '<a class="sdki-keylink" href="' + o.link + '" target="_blank" rel="noopener">' + esc(tx('key_link_' + a)) + '</a>' +
      '<label for="sdki-key-' + a + '">' + esc(tx('key_lbl_' + a)) + '</label>' +
      '<input type="password" id="sdki-key-' + a + '" autocomplete="off" placeholder="' + esc(tx('key_ph')) + '" value="' + esc(onlineKey(a)) + '">' +
      '<div class="sdki-zeile"><label style="font-weight:normal;display:flex;gap:6px;align-items:center"><input type="checkbox" data-dauerhaft' + (dauerhaft ? ' checked' : '') + '> ' + esc(tx('key_dauerhaft')) + '</label></div>' +
      '<div class="sdki-zeile"><button type="button" class="sdki-btn prim" data-speichern>' + esc(tx('key_speichern')) + '</button><span data-status aria-live="polite"></span></div>' +
      '<p class="sdki-hinweis">' + esc(tx('online_hinweis', { firma: o.firma })) + '</p>' +
      '</div>';
  }
  function verbindeSchluesselBox(box, a) {
    const o = ONLINE[a];
    const feld = box.querySelector('#sdki-key-' + a);
    const status = box.querySelector('[data-status]');
    box.querySelector('[data-speichern]').onclick = () => {
      const wert = (feld.value || '').trim();
      const dauerhaft = box.querySelector('[data-dauerhaft]').checked;
      try { sessionStorage.removeItem(o.keyStorage); localStorage.removeItem(o.keyStorage); } catch (e) { /* egal */ }
      if (wert) schreiben(dauerhaft ? localStorage : sessionStorage, o.keyStorage, wert);
      status.textContent = wert ? tx('key_gespeichert') : tx('key_entfernt');
    };
  }

  function baueAuswahl(container) {
    if (!container) return;
    stylesEinfuegen();
    const box = document.createElement('div');
    box.className = 'sdki-wahl';
    container.prepend(box);
    const zeichnen = () => {
      const a = anbieter();
      box.innerHTML =
        '<div class="sdki-wahl-titel">' + esc(tx('anbieter_titel')) + '</div>' +
        '<div class="sdki-optionen" role="radiogroup">' +
        ANBIETER_WERTE.map(w => '<button type="button" class="sdki-opt' + (a === w ? ' aktiv' : '') + '" data-a="' + w + '" role="radio" aria-checked="' + (a === w) + '"><strong>' + esc(tx(w)) + '</strong><small>' + esc(tx(w + '_sub')) + '</small></button>').join('') +
        '</div>' +
        (a === 'lotse'
          ? '<p class="sdki-hinweis">' + esc(tx('lotse_hinweis')) + ' <a href="' + INFO_URL + '" target="_blank" rel="noopener">' + esc(tx('info')) + '</a></p>'
          : '') +
        (ONLINE[a] ? schluesselBoxHtml(a) : '');
      box.querySelectorAll('.sdki-opt').forEach(b => { b.onclick = () => setzeAnbieter(b.dataset.a); });
      if (ONLINE[a]) verbindeSchluesselBox(box, a);
    };
    zeichnen();
    document.addEventListener('sd-ki-anbieter', zeichnen);
    document.addEventListener('sd-lang-changed', zeichnen);
    return box;
  }

  // ------------------------------------------------------------
  // SD Lotse (lokal)
  // ------------------------------------------------------------
  const lotse = { lib: null, engine: null, modellId: null, gpu: null, ladeVersprechen: null, aktuellerStream: null };

  // Tatsaechlich benutztes Modell (Einstellung "Automatisch" oder fest gewaehlt)
  function variante() {
    const LM = window.SDLotseModelle;
    const gpu = lotse.gpu && lotse.gpu.ok ? lotse.gpu : null;
    return LM.variante(LM.gewaehlteEinstellung(), gpu);
  }

  function geraeteInfo() {
    const ua = navigator.userAgent || '';
    const kandidaten = [['SamsungBrowser', 'Samsung Internet'], ['EdgA', 'Edge'], ['Edg', 'Edge'], ['OPR', 'Opera'],
      ['Firefox', 'Firefox'], ['CriOS', 'Chrome (iOS)'], ['Chrome', 'Chrome'], ['Version', 'Safari']];
    let browser = 'Browser';
    for (const [kennung, name] of kandidaten) {
      const m = ua.match(new RegExp(kennung + '\\/(\\d+)'));
      if (m) { browser = name + ' ' + m[1]; break; }
    }
    const android = ua.match(/Android ([\d.]+)/);
    const ios = ua.match(/(?:iPhone|iPad).*? OS (\d+)[_.](\d+)/);
    const system = android ? 'Android ' + android[1] : ios ? 'iOS ' + ios[1] + '.' + ios[2] :
      /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    return browser + (system ? ' · ' + system : '') + (/; wv\)/.test(ua) ? ' · WebView' : '');
  }

  async function pruefeGeraet() {
    if (lotse.gpu) return lotse.gpu;
    try {
      if (!('gpu' in navigator) || !navigator.gpu) return (lotse.gpu = { ok: false, grund: 'WebGPU fehlt im Browser' });
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return (lotse.gpu = { ok: false, grund: 'WebGPU vorhanden, aber keine passende Grafikeinheit' });
      return (lotse.gpu = { ok: true, f16: adapter.features.has('shader-f16') });
    } catch (e) {
      return (lotse.gpu = { ok: false, grund: 'WebGPU-Fehler: ' + ((e && e.message) || e) });
    }
  }

  function modellId() {
    return window.SDLotseModelle.modellId(variante(), lotse.gpu);
  }

  async function ladeBibliothek() {
    if (!lotse.lib) lotse.lib = await import(WEBLLM_URL);
    return lotse.lib;
  }

  function overlay(innerHtml) {
    stylesEinfuegen();
    const o = document.createElement('div');
    o.className = 'sdki-overlay';
    o.innerHTML = '<div class="sdki-box" role="dialog" aria-modal="true">' + innerHtml + '</div>';
    document.body.appendChild(o);
    return o;
  }

  function dlGroesse() {
    const LM = window.SDLotseModelle;
    const key = variante();
    const gb = (LM.speicherBedarf(key, lotse.gpu) / 1000).toLocaleString(sprache() === 'en' ? 'en' : 'de', { maximumFractionDigits: 1 });
    return gb + ' GB · ' + LM.KATALOG[key].name;
  }

  function frageDownload() {
    return new Promise(resolve => {
      const o = overlay(
        '<h2>' + esc(tx('dl_titel')) + '</h2>' +
        '<p>' + esc(tx('dl_text', { groesse: dlGroesse() })) + '</p>' +
        '<p class="sdki-klein"><a href="' + INFO_URL + '" target="_blank" rel="noopener">' + esc(tx('info')) + '</a></p>' +
        '<div class="sdki-knoepfe"><button type="button" class="sdki-btn prim" data-ok>' + esc(tx('dl_ok')) + '</button>' +
        '<button type="button" class="sdki-btn" data-nein>' + esc(tx('abbrechen')) + '</button></div>');
      o.querySelector('[data-ok]').onclick = () => { o.remove(); resolve(true); };
      o.querySelector('[data-nein]').onclick = () => { o.remove(); resolve(false); };
    });
  }

  // Stellt sicher, dass SD Lotse geladen ist (fragt vor dem ersten
  // Download, zeigt Fortschritt). Wirft verstaendliche Fehler.
  async function bereitmachen() {
    await modelleBereit;
    if (lotse.engine && lotse.modellId === modellId()) return lotse.engine;
    if (lotse.ladeVersprechen) return lotse.ladeVersprechen;
    const gpu = await pruefeGeraet();
    if (!gpu.ok) throw new Error(tx('unsupported') + '\n\n' + tx('tech') + ': ' + (gpu.grund || '?') + ' · ' + geraeteInfo());
    lotse.ladeVersprechen = (async () => {
      const lib = await ladeBibliothek();
      const id = modellId();
      let imSpeicher = false;
      try { imSpeicher = await lib.hasModelInCache(id); } catch (e) { imSpeicher = false; }
      if (!imSpeicher && !(await frageDownload())) throw new Error(tx('abgebrochen'));
      const o = overlay('<h2>' + esc(tx('laden_titel')) + '</h2><div class="sdki-balken"><div></div></div><p class="sdki-klein" data-text>' + esc(tx('laden')) + '</p>');
      const balken = o.querySelector('.sdki-balken > div');
      const text = o.querySelector('[data-text]');
      const fortschritt = (r) => {
        balken.style.width = Math.round((r.progress || 0) * 100) + '%';
        text.textContent = tx('laden') + ' ' + Math.round((r.progress || 0) * 100) + ' %';
      };
      try {
        if (lotse.engine) { try { await lotse.engine.unload(); } catch (e) { /* egal */ } lotse.engine = null; }
        let engine;
        window.SDLotseModelle.startBeginnt(id);
        try {
          const worker = new Worker(WORKER_URL, { type: 'module' });
          engine = await lib.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: fortschritt });
        } catch (workerFehler) {
          engine = await lib.CreateMLCEngine(id, { initProgressCallback: fortschritt });
        }
        lotse.engine = engine;
        lotse.modellId = id;
        window.SDLotseModelle.startFertig(id, true);
        // Browser bitten, die Modelldateien dauerhaft zu behalten
        try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* egal */ }
        return engine;
      } catch (err) {
        window.SDLotseModelle.startFertig(id, false);
        throw new Error(tx('laden_fehler', { msg: (err && err.message) || String(err) }) + ' · ' + geraeteInfo());
      } finally {
        o.remove();
      }
    })();
    try {
      return await lotse.ladeVersprechen;
    } finally {
      lotse.ladeVersprechen = null;
    }
  }

  const LOTSE_SYSTEM =
    'You are "SD Lotse", the built-in AI of the web app "SD Bewerbungsstudio" (job applications, ' +
    'CVs, cover letters, letters, documents). You can write, improve, shorten and translate texts, explain ' +
    'documents and write simple code. Follow the user\'s instructions exactly. Output only the ' +
    'requested text, without explanations or introductions. Never invent facts, numbers, names, degrees ' +
    'or experience; if information is missing, leave a gap in [square brackets]. If asked which model ' +
    'you are based on, say honestly: {MODELL}, running locally in the browser.';

  /**
   * Text mit SD Lotse erzeugen.
   * optionen: { system (Zusatz), maxTokens, onToken(teiltext, gesamt) }
   */
  async function lotseSchreibe(prompt, optionen) {
    const opt = optionen || {};
    const engine = await bereitmachen();
    const spracheHinweis = sprache() === 'en' ? ' Write in English unless the task says otherwise.' : ' Write in German (Deutsch) unless the task says otherwise.';
    const LM = window.SDLotseModelle;
    const k = LM.KATALOG[LM.keyVonId(lotse.modellId) || variante()];
    const system = LOTSE_SYSTEM.replace('{MODELL}', k.name + ' by ' + k.firma);
    const stream = await engine.chat.completions.create(Object.assign({
      messages: [
        { role: 'system', content: system + spracheHinweis + (opt.system ? '\n\n' + opt.system : '') },
        { role: 'user', content: String(prompt) }
      ],
      stream: true,
      temperature: 0.4,
      top_p: 0.9,
      max_tokens: opt.maxTokens || 900
    }, LM.anfrageZusatz(lotse.modellId)));
    lotse.aktuellerStream = engine;
    let text = '';
    let roh = '';
    try {
      for await (const teil of stream) {
        const neu = (teil.choices && teil.choices[0] && teil.choices[0].delta && teil.choices[0].delta.content) || '';
        if (!neu) continue;
        roh += neu;
        const vorher = text;
        text = LM.bereinige(roh);
        if (opt.onToken && text.length > vorher.length) opt.onToken(text.slice(vorher.length), text);
      }
    } finally {
      lotse.aktuellerStream = null;
    }
    if (!text.trim()) throw new Error(tx('kein_text'));
    return text.trim();
  }

  function lotseStopp() {
    if (lotse.aktuellerStream) { try { lotse.aktuellerStream.interruptGenerate(); } catch (e) { /* egal */ } }
  }

  // ------------------------------------------------------------
  // Gemini (einfacher Text-Aufruf, Gratis-Flash-Modelle)
  // ------------------------------------------------------------
  function geminiKey() {
    return lesen(sessionStorage, GEMINI_KEY_STORAGE) || lesen(localStorage, GEMINI_KEY_STORAGE) || '';
  }

  async function geminiSchreibe(prompt, optionen) {
    const opt = optionen || {};
    const key = geminiKey();
    if (!key) throw new Error(tx('kein_key'));
    if (!window.sdGemini) throw new Error(tx('gemini_fehler', { status: 'gemini-modelle.js fehlt' }));
    // opt.datei = { mime, data (Base64), name }: Original-PDF/Foto mitschicken
    const teile = opt.datei ? [{ inlineData: { mimeType: opt.datei.mime, data: opt.datei.data } }] : [];
    const body = { contents: [{ role: 'user', parts: teile.concat([{ text: String(prompt) }]) }] };
    if (opt.system) body.system_instruction = { parts: [{ text: opt.system }] };
    let antwort;
    try {
      ({ antwort } = await window.sdGemini.anfrage(key, body));
    } catch (e) {
      throw new Error(tx('netz'));
    }
    if (!antwort.ok) {
      if (antwort.status === 429) throw new Error(tx('gemini_kontingent'));
      if (antwort.status === 400 || antwort.status === 401 || antwort.status === 403) throw new Error(tx('gemini_key_falsch'));
      throw new Error(tx('gemini_fehler', { status: antwort.status }));
    }
    const daten = await antwort.json();
    const text = (((daten.candidates || [])[0] || {}).content || {}).parts;
    const ergebnis = (text || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    if (!ergebnis) throw new Error(tx('gemini_fehler', { status: 'leer' }));
    return ergebnis;
  }

  // Text mit ChatGPT (OpenAI) oder Claude (Anthropic) erzeugen - direkt
  // vom Browser zum Anbieter, mit dem eigenen Schluessel der Person.
  async function onlineSchreibe(prompt, optionen, welcher) {
    const opt = optionen || {};
    const a = welcher || anbieter();
    const o = ONLINE[a];
    if (!o) throw new Error('Unbekannter Anbieter');
    const key = onlineKey(a);
    if (!key) throw new Error(tx('kein_key_online', { name: o.name }));
    const modell = onlineModell(a);
    const system = (opt.system ? opt.system + '\n\n' : '') + (sprache() === 'en'
      ? 'Write in English unless the task says otherwise. Never invent facts; leave missing details as [gaps].'
      : 'Schreibe auf Deutsch, außer die Aufgabe verlangt etwas anderes. Erfinde nichts; fehlende Angaben als [Lücke] in eckigen Klammern.');
    let antwort;
    try {
      if (a === 'openai') {
        antwort = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({ model: modell, instructions: system,
            input: opt.datei ? [{ role: 'user', content: [
              /^image\//.test(opt.datei.mime)
                ? { type: 'input_image', image_url: 'data:' + opt.datei.mime + ';base64,' + opt.datei.data }
                : { type: 'input_file', filename: opt.datei.name || 'dokument.pdf', file_data: 'data:' + opt.datei.mime + ';base64,' + opt.datei.data },
              { type: 'input_text', text: String(prompt) }] }] : String(prompt),
            reasoning: { effort: 'low' }, max_output_tokens: Math.max(2000, (opt.maxTokens || 1200) * 3), store: false })
        });
      } else {
        antwort = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
          body: JSON.stringify({ model: modell, max_tokens: Math.max(1500, opt.maxTokens || 1200), system,
            messages: [{ role: 'user', content: opt.datei ? [
              /^image\//.test(opt.datei.mime)
                ? { type: 'image', source: { type: 'base64', media_type: opt.datei.mime, data: opt.datei.data } }
                : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: opt.datei.data } },
              { type: 'text', text: String(prompt) }] : String(prompt) }] })
        });
      }
    } catch (e) {
      throw new Error(tx('online_netz', { firma: o.firma }));
    }
    if (!antwort.ok) {
      let detail = '', code = '';
      try { const d = await antwort.json(); detail = (d.error && d.error.message) || ''; code = (d.error && (d.error.code || d.error.type)) || ''; } catch (e) { /* egal */ }
      if (antwort.status === 401 || antwort.status === 403 || /invalid.?api.?key|authentication/i.test(code + ' ' + detail)) throw new Error(tx('online_key_falsch', { name: o.name }));
      if (/insufficient_quota|credit balance|billing/i.test(code + ' ' + detail)) throw new Error(tx('online_guthaben', { firma: o.firma }));
      if (antwort.status === 429) throw new Error(tx('online_rate', { name: o.name }));
      throw new Error(tx('online_fehler', { name: o.name, status: antwort.status }) + (detail ? ' – ' + detail : ''));
    }
    const daten = await antwort.json();
    let text = '';
    if (a === 'openai') {
      (daten.output || []).forEach(item => {
        if (item.type !== 'message') return;
        (item.content || []).forEach(c => { if (c.type === 'output_text') text += c.text || ''; });
      });
    } else {
      (daten.content || []).forEach(b => { if (b.type === 'text') text += b.text || ''; });
    }
    text = text.trim();
    if (!text) throw new Error(tx('online_leer', { name: o.name }));
    if (opt.onToken) opt.onToken(text, text);
    return text;
  }

  async function schreibe(prompt, optionen) {
    const a = anbieter();
    if (a === 'lotse') return lotseSchreibe(prompt, optionen);
    if (ONLINE[a]) return onlineSchreibe(prompt, optionen, a);
    return geminiSchreibe(prompt, optionen);
  }

  // ------------------------------------------------------------
  // Dokumente lesen (PDF, Word, Foto, Text) - alles im Browser
  // ------------------------------------------------------------
  const BIB = {
    pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs',
    pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs',
    mammoth: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
  };
  const skripte = {};
  function ladeSkript(url, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    if (!skripte[url]) {
      skripte[url] = new Promise((ok, fehler) => {
        const sc = document.createElement('script');
        sc.src = url; sc.async = true;
        sc.onload = () => window[globalName] ? ok(window[globalName]) : fehler(new Error(globalName));
        sc.onerror = () => { delete skripte[url]; fehler(new Error(tx('netz'))); };
        document.head.appendChild(sc);
      });
    }
    return skripte[url];
  }
  let pdfjsVersprechen = null;
  function ladePdfJs() {
    if (!pdfjsVersprechen) {
      pdfjsVersprechen = import(BIB.pdfjs).then(lib => { lib.GlobalWorkerOptions.workerSrc = BIB.pdfjsWorker; return lib; })
        .catch(e => { pdfjsVersprechen = null; throw e; });
    }
    return pdfjsVersprechen;
  }
  function normalisiere(text) {
    return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t ]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  async function ocr(quelle, status) {
    const Tesseract = await ladeSkript(BIB.tesseract, 'Tesseract');
    const { data } = await Tesseract.recognize(quelle, 'deu+eng', {
      logger: m => { if (m.status === 'recognizing text' && status) status(tx('ein_ocr', { p: Math.round((m.progress || 0) * 100) })); }
    });
    return normalisiere(data.text);
  }
  // Liefert den Text einer Datei. status(text) zeigt den Fortschritt.
  async function leseDatei(file, status) {
    const name = (file.name || '').toLowerCase();
    const typ = file.type || '';
    if (status) status(tx('ein_lesen', { name: file.name }));
    if (/\.doc$/.test(name) || typ === 'application/msword') throw new Error(tx('ein_doc_alt'));
    if (/\.docx$/.test(name) || typ === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await ladeSkript(BIB.mammoth, 'mammoth');
      return normalisiere((await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value);
    }
    if (/\.(txt|md|csv)$/.test(name) || /^text\//.test(typ)) return normalisiere(await file.text());
    if (/^image\//.test(typ)) return ocr(file, status);
    if (typ === 'application/pdf' || /\.pdf$/.test(name)) {
      const pdfjs = await ladePdfJs();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const seiten = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const inhalt = await (await pdf.getPage(n)).getTextContent();
        let t = '', y = null, ende = null;
        inhalt.items.forEach(it => {
          if (typeof it.str !== 'string') return;
          const x = it.transform ? it.transform[4] : null;
          const neuY = it.transform ? Math.round(it.transform[5]) : null;
          if (y !== null && neuY !== null && Math.abs(neuY - y) > 2) {
            if (!t.endsWith('\n')) t += '\n';
          } else if (ende !== null && x !== null && it.str && !t.endsWith('\n')) {
            // Luecken in einer Zeile: Leerzeichen bzw. " | " bei Tabellen/Spalten
            const luecke = x - ende;
            if (luecke > 25) t += ' | ';
            else if (luecke > 1.5 && !/\s$/.test(t) && !/^\s/.test(it.str)) t += ' ';
          }
          t += it.str;
          if (it.hasEOL) t += '\n';
          y = neuY;
          ende = x !== null ? x + (it.width || 0) : null;
        });
        seiten.push(t);
      }
      let text = normalisiere(seiten.join('\n\n'));
      if (text.replace(/\s/g, '').length < 20) {
        // Gescanntes PDF: die ersten Seiten per Texterkennung lesen
        const teile = [];
        for (let n = 1; n <= Math.min(pdf.numPages, 3); n++) {
          const seite = await pdf.getPage(n);
          const vp = seite.getViewport({ scale: 2 });
          const c = document.createElement('canvas');
          c.width = Math.round(vp.width); c.height = Math.round(vp.height);
          await seite.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
          teile.push(await ocr(c, status));
        }
        text = normalisiere(teile.join('\n\n'));
      }
      return text;
    }
    throw new Error(tx('ein_typ'));
  }

  // ------------------------------------------------------------
  // Vorhandenes Dokument einlesen und auf Formularfelder verteilen
  // ------------------------------------------------------------
  // optionen: { titel, beschreibung, dokumentArt, felder: [{ id, label, hinweis, optionen, mehrzeilig }],
  //             uebernehmen(werte) -> Anzahl, fertig(meldung) }
  function baueEinlesePrompt(opt, text, verbessern) {
    const liste = opt.felder.map(f => '### ' + f.id + '\n(' + f.label + (f.hinweis ? ' – ' + f.hinweis : '') +
      (f.optionen ? ' – nur genau einer dieser Werte: ' + f.optionen.join(' | ') : '') + ')').join('\n');
    return 'Hier ist der Text eines vorhandenen Dokuments (' + opt.dokumentArt + '). Übertrage die Angaben in die Felder unten.\n\n' +
      'REGELN:\n' +
      '- Übernimm nur, was wirklich im Dokument steht. Erfinde nichts und ergänze nichts.\n' +
      '- Fehlt eine Angabe im Dokument, schreibe unter die Überschrift nur: -\n' +
      '- ' + (verbessern
        ? 'Formuliere Texte sprachlich klar und professionell, ändere aber keine Fakten (Daten, Namen, Firmen, Orte, Abschlüsse, Zahlen).'
        : 'Übernimm den Wortlaut möglichst genau; korrigiere nur offensichtliche Tipp- und Erkennungsfehler.') + '\n' +
      '- Schreibe in der Sprache des Dokuments.\n' +
      '- Antworte NUR in diesem Format: jede Überschrift genau so wie unten (### feldname), darunter der Inhalt. Keine Einleitung, keine Erklärungen.\n\n' +
      'FELDER:\n' + liste + '\n\n=== DOKUMENT ANFANG ===\n' + text + '\n=== DOKUMENT ENDE ===';
  }
  function leseEinleseAntwort(antwort, felder) {
    const roh = String(antwort || '').replace(/```[a-z]*\n?/gi, '');
    const ids = felder.map(f => f.id);
    const marken = [];
    const re = /^[ \t]*#{2,4}[ \t]*([A-Za-z0-9_-]+)[ \t]*:?[ \t]*(.*)$/gm;
    let m;
    while ((m = re.exec(roh)) !== null) marken.push({ id: m[1].toLowerCase(), rest: m[2], start: m.index, ende: re.lastIndex });
    const werte = {};
    marken.forEach((mk, i) => {
      const id = ids.find(x => x.toLowerCase() === mk.id);
      if (!id) return;
      let v = (mk.rest ? mk.rest + '\n' : '') + roh.slice(mk.ende, i + 1 < marken.length ? marken[i + 1].start : undefined);
      v = v.replace(/^\s*\([^)\n]*\)\s*$/m, '').trim();
      if (!v || /^[-–—]+$/.test(v) || /^(keine angabe|nicht angegeben|unbekannt|n\/a|none|not stated)\.?$/i.test(v)) return;
      werte[id] = v;
    });
    // Kleine Modelle halten sich oft nicht an "### feld". Dann auch
    // Zeilen wie "Vorname: Anna" oder "- **vorname**: Anna" akzeptieren.
    if (Object.keys(werte).length < 2) {
      const norm = (x) => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
      const namen = {};
      felder.forEach(f => {
        namen[norm(f.id)] = f.id;
        namen[norm(f.label)] = f.id;
        const kurz = String(f.label).split(/[:\/(]/).pop();
        if (kurz) namen[norm(kurz)] = f.id;
      });
      let aktuell = null;
      roh.split('\n').forEach(zeile => {
        const m2 = zeile.match(/^\s*(?:[-*•]|\d+[.)])?\s*\**\s*([^:*\n]{2,40}?)\s*\**\s*:\s*(.*)$/);
        const id = m2 ? namen[norm(m2[1])] : null;
        if (id) {
          aktuell = id;
          const v = m2[2].replace(/\*\*/g, '').trim();
          if (v && !/^[-–—]+$/.test(v) && werte[id] == null) werte[id] = v;
          return;
        }
        // Folgezeilen gehoeren zum letzten mehrzeiligen Feld
        const f = felder.find(x => x.id === aktuell);
        if (f && f.mehrzeilig && zeile.trim() && !/^#{1,4}\s/.test(zeile)) {
          werte[aktuell] = (werte[aktuell] ? werte[aktuell] + '\n' : '') + zeile.replace(/^\s*[-*•]\s*/, '').trim();
        } else if (!zeile.trim()) {
          aktuell = null;
        }
      });
      Object.keys(werte).forEach(k => {
        if (/^(-|–|—|keine angabe|nicht angegeben|unbekannt|n\/a)$/i.test(String(werte[k]).trim())) delete werte[k];
      });
    }
    felder.forEach(f => {
      if (!f.optionen || werte[f.id] == null) return;
      const treffer = f.optionen.find(o => o.toLowerCase() === werte[f.id].toLowerCase().replace(/[.\s]+$/, ''));
      if (treffer) werte[f.id] = treffer; else delete werte[f.id];
    });
    return werte;
  }

  // ------------------------------------------------------------
  // Diktat: Sprache -> Text ueber die Spracherkennung des Browsers
  // (Chrome/Android: Google, Safari/iPhone: Apple). Gibt es sie nicht,
  // bleibt das Mikrofon der Handy-Tastatur.
  // ------------------------------------------------------------
  function spracherkennungVorhanden() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function diktatAnbinden(feld, knopf, info) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      knopf.hidden = true;
      info(tx('sp_keine'));
      return null;
    }
    info(tx('sp_info'));
    let rec = null, aktiv = false, basis = '';
    const anzeigen = () => { knopf.textContent = aktiv ? tx('sp_stopp') : tx('sp_start'); knopf.classList.toggle('prim', aktiv); };
    const starten = () => {
      rec = new SR();
      rec.lang = sprache() === 'en' ? 'en-US' : 'de-DE';
      rec.continuous = true;
      rec.interimResults = true;
      basis = feld.value ? feld.value.replace(/\s*$/, ' ') : '';
      rec.onresult = (ev) => {
        let fertig = '', vorlaeufig = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) fertig += r[0].transcript; else vorlaeufig += r[0].transcript;
        }
        if (fertig) basis = (basis + fertig.trim() + ' ');
        feld.value = basis + vorlaeufig;
        feld.scrollTop = feld.scrollHeight;
      };
      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { aktiv = false; info(tx('sp_verweigert')); }
        else if (ev.error !== 'no-speech' && ev.error !== 'aborted') info(tx('sp_fehler', { msg: ev.error }));
        anzeigen();
      };
      // Manche Browser (v. a. iPhone) beenden nach einer Pause von selbst:
      // dann weiterhoeren, solange nicht auf Stopp getippt wurde.
      rec.onend = () => { if (aktiv) { try { starten(); } catch (e) { aktiv = false; anzeigen(); } } };
      rec.start();
    };
    knopf.onclick = () => {
      if (aktiv) { aktiv = false; try { rec && rec.stop(); } catch (e) { /* egal */ } anzeigen(); return; }
      aktiv = true;
      try { starten(); info(tx('sp_hoert')); } catch (e) { aktiv = false; info(tx('sp_fehler', { msg: e.message || e })); }
      anzeigen();
    };
    anzeigen();
    return { stopp: () => { aktiv = false; try { rec && rec.stop(); } catch (e) { /* egal */ } anzeigen(); } };
  }

  function einleseDialog(opt) {
    stylesEinfuegen();
    const o = overlay(
      '<h2>' + esc(opt.titel || tx('ein_titel')) + '</h2>' +
      (opt.beschreibung ? '<p>' + esc(opt.beschreibung) + '</p>' : '') +
      '<div data-auswahl></div>' +
      '<label class="sdki-check"><input type="checkbox" data-verbessern> <span>' + esc(tx('ein_verbessern')) + '</span></label>' +
      '<p class="sdki-klein" data-privat></p>' +
      (opt.modus === 'sprechen'
        ? '<p class="sdki-klein">' + esc(opt.sprechHinweis || '') + '</p>' +
          '<textarea class="sdki-diktat" data-diktat rows="7" placeholder="' + esc(tx('sp_ph')) + '"></textarea>' +
          '<p class="sdki-klein" data-sp-info></p>' +
          '<div class="sdki-knoepfe"><button type="button" class="sdki-btn akt" data-mikro>' + esc(tx('sp_start')) + '</button>' +
          '<button type="button" class="sdki-btn prim" data-eintragen>' + esc(tx('sp_eintragen')) + '</button>' +
          '<button type="button" class="sdki-btn" data-schliessen>' + esc(tx('abbrechen')) + '</button></div>'
        : '<input type="file" data-datei hidden accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,.txt,.md,text/plain">' +
          '<div class="sdki-knoepfe"><button type="button" class="sdki-btn prim" data-waehlen>' + esc(tx('ein_datei')) + '</button>' +
          '<button type="button" class="sdki-btn" data-schliessen>' + esc(tx('abbrechen')) + '</button></div>') +
      '<p class="sdki-klein" data-status aria-live="polite"></p>' +
      '<div class="sdki-fehler" data-fehler hidden></div>' +
      '<div data-ergebnis hidden></div>');
    const $q = (sel) => o.querySelector(sel);
    baueAuswahl($q('[data-auswahl]'));
    if (opt.modus === 'sprechen') $q('[data-verbessern]').checked = true;
    const privat = () => {
      const a = anbieter();
      const sp = opt.modus === 'sprechen' ? '_text' : '';
      $q('[data-privat]').textContent = a === 'lotse' ? tx('ein_privat_lotse' + sp)
        : tx('ein_privat_online' + sp, { firma: ONLINE[a] ? ONLINE[a].firma : 'Google (Gemini)' });
    };
    privat();
    document.addEventListener('sd-ki-anbieter', privat);
    let diktat = null;
    const schliessen = () => { document.removeEventListener('sd-ki-anbieter', privat); lotseStopp(); if (diktat) diktat.stopp(); o.remove(); };
    $q('[data-schliessen]').onclick = schliessen;
    const status = (t) => { $q('[data-status]').textContent = t || ''; };
    const fehler = (t) => { const f = $q('[data-fehler]'); f.textContent = t || ''; f.hidden = !t; };
    const startKnopf = $q(opt.modus === 'sprechen' ? '[data-eintragen]' : '[data-waehlen]');
    if (opt.modus === 'sprechen') {
      const feld = $q('[data-diktat]');
      diktat = diktatAnbinden(feld, $q('[data-mikro]'), (t) => { $q('[data-sp-info]').textContent = t || ''; });
      startKnopf.onclick = () => {
        if (diktat) diktat.stopp();
        const text = (feld.value || '').trim();
        if (!text) { fehler(tx('sp_leer')); return; }
        verarbeite(text, null);
      };
    } else {
      $q('[data-waehlen]').onclick = () => $q('[data-datei]').click();
      $q('[data-datei]').onchange = async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!file) return;
        verarbeite(null, file);
      };
    }
    async function verarbeite(vorgabeText, file) {
      fehler('');
      $q('[data-ergebnis]').hidden = true;
      startKnopf.disabled = true;
      try {
        let text = vorgabeText;
        if (file) {
          text = await leseDatei(file, status);
          const kannOriginal = anbieter() !== 'lotse' && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '') || /^image\//.test(file.type || ''));
          if ((!text || !text.trim()) && !kannOriginal) throw new Error(tx('ein_leer'));
        }
        text = text || '';
        let gekuerzt = false;
        const istLotse = anbieter() === 'lotse';
        const grenze = istLotse ? 3000 : GEMINI_MAX_ZEICHEN;
        if (text.length > grenze) { text = text.slice(0, grenze); gekuerzt = istLotse; }
        // Einfache Regeln erkennen schon vieles ohne KI (E-Mail, Telefon,
        // Abschnitte wie "Berufserfahrung"); die KI ergaenzt und ordnet.
        const regeln = opt.heuristik ? (opt.heuristik(text) || {}) : {};
        status(tx('ein_ki_laeuft'));
        let werte = {};
        let kiFehler = null;
        // Online-KIs bekommen zusaetzlich das Original (PDF/Foto): sie sehen
        // dann auch das Layout (Spalten, Tabellen) statt nur den Rohtext.
        let datei = null;
        const typOk = !!file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '') || /^image\/(jpeg|png|webp|gif)$/.test(file.type || ''));
        if (!istLotse && typOk && file.size <= 12 * 1024 * 1024) {
          try {
            const url = await new Promise((ok, fehler) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = fehler; r.readAsDataURL(file); });
            datei = { mime: /\.pdf$/i.test(file.name || '') ? 'application/pdf' : file.type, data: String(url).split(',')[1] || '', name: file.name };
          } catch (e) { datei = null; }
        }
        try {
          const prompt = baueEinlesePrompt(Object.assign({}, opt, file ? {} : { dokumentArt: opt.diktatArt || opt.dokumentArt }), text, $q('[data-verbessern]').checked) +
            (datei ? '\n\nDas Original-Dokument ist zusätzlich angehängt – nutze es, um Spalten und Tabellen richtig zuzuordnen.' : '');
          const antwort = await schreibe(prompt, { maxTokens: istLotse ? 1100 : 2500, datei });
          werte = leseEinleseAntwort(antwort, opt.felder);
        } catch (err) {
          kiFehler = err;
        }
        let ausRegeln = 0;
        Object.keys(regeln).forEach(k => {
          if (werte[k] == null && regeln[k] && String(regeln[k]).trim()) { werte[k] = String(regeln[k]).trim(); ausRegeln++; }
        });
        status('');
        if (!Object.keys(werte).length) {
          if (kiFehler) throw kiFehler;
          throw new Error(tx('ein_nichts') + (istLotse ? ' ' + tx('ein_lotse_tipp') : ''));
        }
        zeigeErgebnis(werte, gekuerzt, kiFehler ? tx('ein_ki_fehler', { msg: kiFehler.message || String(kiFehler) }) : (ausRegeln && istLotse ? tx('ein_regeln') : ''));
      } catch (err) {
        status('');
        fehler((err && err.message) || String(err));
      } finally {
        startKnopf.disabled = false;
      }
    }
    function zeigeErgebnis(werte, gekuerzt, notiz) {
      const box = $q('[data-ergebnis]');
      box.innerHTML = (gekuerzt ? '<p class="sdki-klein">' + esc(tx('ein_gekuerzt')) + '</p>' : '') +
        (notiz ? '<p class="sdki-klein">' + esc(notiz) + '</p>' : '') +
        '<p class="sdki-klein">' + esc(tx('ein_pruefen')) + '</p><div class="sdki-felder"></div>' +
        '<div class="sdki-knoepfe" style="margin-top:8px"><button type="button" class="sdki-btn prim" data-ok>' + esc(tx('ein_uebernehmen')) + '</button>' +
        '<button type="button" class="sdki-btn" data-nein>' + esc(tx('abbrechen')) + '</button></div>';
      const liste = box.querySelector('.sdki-felder');
      opt.felder.forEach(f => {
        if (werte[f.id] == null) return;
        const zeile = document.createElement('div');
        zeile.className = 'sdki-feld';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.checked = true; cb.dataset.id = f.id; cb.id = 'sdki-ein-' + f.id;
        const lbl = document.createElement('label');
        lbl.htmlFor = cb.id;
        lbl.innerHTML = '<strong>' + esc(f.label) + '</strong>';
        const ta = document.createElement('textarea');
        ta.value = werte[f.id];
        ta.rows = f.mehrzeilig ? Math.min(8, Math.max(2, werte[f.id].split('\n').length)) : 1;
        ta.dataset.wert = f.id;
        zeile.append(cb, lbl, ta);
        liste.appendChild(zeile);
      });
      box.hidden = false;
      box.querySelector('[data-nein]').onclick = schliessen;
      box.querySelector('[data-ok]').onclick = () => {
        const auswahlWerte = {};
        liste.querySelectorAll('input[type=checkbox][data-id]').forEach(cb => {
          if (!cb.checked) return;
          const ta = liste.querySelector('textarea[data-wert="' + cb.dataset.id + '"]');
          auswahlWerte[cb.dataset.id] = ta ? ta.value.trim() : '';
        });
        const n = opt.uebernehmen ? opt.uebernehmen(auswahlWerte) : Object.keys(auswahlWerte).length;
        schliessen();
        if (opt.fertig) opt.fertig(tx('ein_fertig', { n: n == null ? Object.keys(auswahlWerte).length : n }));
      };
      box.scrollIntoView({ block: 'nearest' });
    }
  }

  // ------------------------------------------------------------
  // Dialog "KI-Hilfe zum Dokument" (PDF-Studio, Scanner)
  // ------------------------------------------------------------
  // optionen: { text, ocr (bool: Korrektur-Aktion anbieten), uebernehmen(text) }
  function dokumentDialog(optionen) {
    const opt = optionen || {};
    const voll = String(opt.text || '').replace(/[ \t]+\n/g, '\n').trim();
    const o = overlay(
      '<h2>' + esc(tx('dlg_titel')) + '</h2>' +
      '<div data-wahl></div>' +
      '<p class="sdki-klein" data-quelle></p>' +
      '<div class="sdki-knoepfe" data-aktionen></div>' +
      '<div class="sdki-ausgabe" data-ausgabe hidden></div>' +
      '<div class="sdki-fehler" data-fehler hidden></div>' +
      '<p class="sdki-klein" data-privat></p>' +
      '<p class="sdki-klein">' + esc(tx('dlg_hinweis_recht')) + '</p>' +
      '<div class="sdki-knoepfe" data-unten></div>');
    const $q = (sel) => o.querySelector(sel);
    baueAuswahl($q('[data-wahl]'));
    const ausgabe = $q('[data-ausgabe]');
    const fehler = $q('[data-fehler]');
    let laeuft = false;
    let ergebnis = '';

    const aktionen = [
      ['act_zusammenfassen', 'p_zusammenfassen'],
      ['act_erklaeren', 'p_erklaeren'],
      ['act_antwort', 'p_antwort']
    ];
    if (opt.ocr) aktionen.push(['act_korrigieren', 'p_korrigieren']);

    const unten = $q('[data-unten]');
    const kopieren = document.createElement('button');
    kopieren.type = 'button'; kopieren.className = 'sdki-btn'; kopieren.hidden = true;
    const uebernehmen = document.createElement('button');
    uebernehmen.type = 'button'; uebernehmen.className = 'sdki-btn'; uebernehmen.hidden = true;
    const stopp = document.createElement('button');
    stopp.type = 'button'; stopp.className = 'sdki-btn'; stopp.hidden = true;
    const schliessen = document.createElement('button');
    schliessen.type = 'button'; schliessen.className = 'sdki-btn';
    unten.append(kopieren, uebernehmen, stopp, schliessen);

    function textFuerAnbieter() {
      const grenze = anbieter() === 'lotse' ? LOTSE_MAX_ZEICHEN : GEMINI_MAX_ZEICHEN;
      return { text: voll.slice(0, grenze), gekuerzt: voll.length > grenze };
    }

    function zeichnen() {
      const { gekuerzt } = textFuerAnbieter();
      $q('[data-quelle]').textContent = voll ? tx('dlg_quelle', { n: voll.length.toLocaleString() }) + (gekuerzt ? tx('dlg_gekuerzt') : '') : '';
      $q('[data-privat]').textContent = anbieter() === 'lotse' ? tx('dlg_privat_lotse') : ONLINE[anbieter()] ? tx('dlg_privat_online', { firma: ONLINE[anbieter()].firma }) : tx('dlg_privat_gemini');
      const box = $q('[data-aktionen]');
      box.innerHTML = '';
      if (!voll) {
        fehler.textContent = tx('dlg_leer');
        fehler.hidden = false;
      }
      aktionen.forEach(([label, prompt]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'sdki-btn akt';
        b.textContent = tx(label);
        b.disabled = !voll || laeuft;
        b.onclick = () => ausfuehren(prompt, label === 'act_korrigieren');
        box.appendChild(b);
      });
      kopieren.textContent = tx('dlg_kopieren');
      uebernehmen.textContent = tx('dlg_uebernehmen');
      stopp.textContent = tx('dlg_stopp');
      schliessen.textContent = tx('dlg_schliessen');
    }

    async function ausfuehren(promptKey, istKorrektur) {
      if (laeuft) return;
      laeuft = true;
      ergebnis = '';
      fehler.hidden = true;
      ausgabe.hidden = false;
      ausgabe.textContent = '…';
      kopieren.hidden = true;
      uebernehmen.hidden = true;
      stopp.hidden = anbieter() !== 'lotse';
      zeichnen();
      const { text } = textFuerAnbieter();
      const prompt = tx(promptKey) + '\n\n---\n' + text + '\n---';
      try {
        ergebnis = await schreibe(prompt, {
          maxTokens: istKorrektur ? 1500 : 900,
          onToken: (_, gesamt) => { ausgabe.textContent = gesamt; ausgabe.scrollTop = ausgabe.scrollHeight; }
        });
        ausgabe.textContent = ergebnis;
        kopieren.hidden = false;
        uebernehmen.hidden = !(istKorrektur && typeof opt.uebernehmen === 'function');
      } catch (err) {
        if (ausgabe.textContent === '…') ausgabe.hidden = true;
        fehler.textContent = (err && err.message) || String(err);
        fehler.hidden = false;
      } finally {
        laeuft = false;
        stopp.hidden = true;
        zeichnen();
      }
    }

    kopieren.onclick = () => {
      const fertig = () => { kopieren.textContent = tx('dlg_kopiert'); setTimeout(() => { kopieren.textContent = tx('dlg_kopieren'); }, 1500); };
      const notfall = () => {
        const ta = document.createElement('textarea'); ta.value = ergebnis; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); fertig(); } catch (e) { /* egal */ }
        ta.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ergebnis).then(fertig, notfall);
      else notfall();
    };
    uebernehmen.onclick = () => { if (opt.uebernehmen) opt.uebernehmen(ergebnis); o.remove(); };
    stopp.onclick = () => lotseStopp();
    schliessen.onclick = () => { lotseStopp(); o.remove(); };
    const neuZeichnen = () => { if (document.body.contains(o)) zeichnen(); };
    document.addEventListener('sd-ki-anbieter', neuZeichnen);
    document.addEventListener('sd-lang-changed', neuZeichnen);
    zeichnen();
    return o;
  }

  // ------------------------------------------------------------
  // KI-Schreibhilfe-Bereich einer App verbinden: Auswahl oben, gewaehlte KI
  // als Plakette in der (auch zugeklappt sichtbaren) Ueberschrift, und bei
  // SD Lotse die Gemini-Schluesselfelder ausblenden (er braucht keinen).
  // ------------------------------------------------------------
  function verbindeKiPanel(panelBody, toggleButton) {
    if (!panelBody) return;
    stylesEinfuegen();
    const auswahl = baueAuswahl(panelBody);
    let plakette = null;
    if (toggleButton) {
      plakette = document.createElement('span');
      plakette.className = 'sdki-badge';
      const chev = toggleButton.querySelector('.chev');
      toggleButton.insertBefore(plakette, chev || null);
    }
    const aktualisieren = () => {
      const a = anbieter();
      if (plakette) plakette.textContent = tx(a);
      // Die Gemini-Felder der App nur bei Gemini zeigen
      [...panelBody.children].forEach(el => {
        if (el === auswahl || el.classList.contains('ki-hint')) return;
        el.style.display = a === 'gemini' ? '' : 'none';
      });
    };
    aktualisieren();
    document.addEventListener('sd-ki-anbieter', aktualisieren);
    document.addEventListener('sd-lang-changed', aktualisieren);
  }

  window.sdKi = {
    anbieter, setzeAnbieter, baueAuswahl, verbindeKiPanel,
    pruefeGeraet, bereitmachen, lotseSchreibe, lotseStopp,
    geminiSchreibe, onlineSchreibe, schreibe, dokumentDialog, einleseDialog, leseDatei,
    diktatAnbinden, spracherkennungVorhanden,
    _intern: { lotse }
  };
})();
