/* SD Hub – Ordner aufräumen
   Weg 1: im Browser (File System Access API, Chrome/Edge am Computer)
   Weg 2: Skript zum Herunterladen (PowerShell für Windows, bash für Mac/Linux)
   Beide nutzen dieselben Regeln: Dateiendung -> Unterordner. Nichts wird gelöscht oder überschrieben. */
(function () {
    'use strict';

    // ---------------- Regeln ----------------
    const STANDARD = [
        { id: 'bilder', ext: 'jpg, jpeg, png, gif, webp, heic, heif, bmp, tif, tiff, svg' },
        { id: 'dokumente', ext: 'pdf, doc, docx, odt, rtf, txt, md, pages' },
        { id: 'tabellen', ext: 'xls, xlsx, xlsm, ods, csv, numbers' },
        { id: 'praesentationen', ext: 'ppt, pptx, odp, key' },
        { id: 'videos', ext: 'mp4, mov, avi, mkv, webm, m4v, wmv' },
        { id: 'musik', ext: 'mp3, wav, m4a, aac, ogg, flac, wma' },
        { id: 'archive', ext: 'zip, rar, 7z, tar, gz, tgz' },
        { id: 'programme', ext: 'exe, msi, dmg, pkg, apk', aus: true }
    ];
    // Dateien, die gerade heruntergeladen werden, nie anfassen
    const IMMER_LASSEN = ['crdownload', 'part', 'partial', 'download', 'tmp', 'opdownload'];
    const PROTOKOLL_PREFIX = 'SD-Aufraeumen-Protokoll';

    function endungenAus(text) {
        return String(text || '').toLowerCase().split(/[\s,;]+/).map(e => e.replace(/^\*?\./, '').trim()).filter(e => /^[a-z0-9_+-]{1,12}$/.test(e));
    }
    function sichererOrdnerName(name) {
        const n = String(name || '').replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 60);
        return n || 'Ordner';
    }
    function endungVon(name) {
        const i = name.lastIndexOf('.');
        return i > 0 ? name.slice(i + 1).toLowerCase() : '';
    }
    // aktive Regeln -> [{ordner, endungen[]}]
    function aktiveRegeln(kats, nameVon) {
        return kats.filter(k => k.an !== false).map(k => ({ ordner: sichererOrdnerName(nameVon(k)), endungen: endungenAus(k.ext) })).filter(r => r.endungen.length);
    }
    function zielFuer(name, regeln, sonstiges) {
        if (name.startsWith('.') || name.startsWith(PROTOKOLL_PREFIX)) return null;
        const e = endungVon(name);
        if (IMMER_LASSEN.includes(e)) return null;
        for (const r of regeln) if (r.endungen.includes(e)) return r.ordner;
        return sonstiges || null;
    }
    function nummerierterName(name, n) {
        const i = name.lastIndexOf('.');
        return i > 0 ? name.slice(0, i) + ' (' + n + ')' + name.slice(i) : name + ' (' + n + ')';
    }

    // ---------------- Skripte erzeugen ----------------
    const psStr = (s) => "'" + String(s).replace(/'/g, "''") + "'";
    const shStr = (s) => "'" + String(s).replace(/'/g, "'\\''") + "'";

    const SKRIPT_TEXTE = {
        de: {
            kopf: 'SD Hub - Ordner aufräumen (thesdhub.com/ordnen)',
            erkl: 'Verschiebt Dateien nach Dateiendung in Unterordner. Löscht nichts und überschreibt nichts.',
            ordner: 'Ordner', fehlt: 'Ordner nicht gefunden', nichts: 'Nichts zu sortieren - keine Datei passt zu den Regeln.',
            vorschau: 'Vorschau - so würde sortiert:', dateien: 'Dateien', frage: 'Jetzt verschieben? (j/n)', abbruch: 'Abgebrochen - nichts wurde verschoben.',
            fertig: 'Fertig', verschoben: 'verschoben', uebersprungen: 'übersprungen (gab es schon)', fehler: 'Fehler', protokoll: 'Protokoll gespeichert', enter: 'Enter zum Schließen'
        },
        en: {
            kopf: 'SD Hub - Tidy up folders (thesdhub.com/ordnen)',
            erkl: 'Moves files into subfolders by file extension. Deletes nothing and overwrites nothing.',
            ordner: 'Folder', fehlt: 'Folder not found', nichts: 'Nothing to sort - no file matches the rules.',
            vorschau: 'Preview - files would be sorted like this:', dateien: 'files', frage: 'Move them now? (y/n)', abbruch: 'Cancelled - nothing was moved.',
            fertig: 'Done', verschoben: 'moved', uebersprungen: 'skipped (already existed)', fehler: 'errors', protokoll: 'Log saved', enter: 'Press Enter to close'
        }
    };

    function powershellSkript(o) {
        const T = SKRIPT_TEXTE[o.lang] || SKRIPT_TEXTE.de;
        let ordnerAusdruck;
        if (o.ordner === 'desktop') ordnerAusdruck = "[Environment]::GetFolderPath('Desktop')";
        else if (o.ordner === 'dokumente') ordnerAusdruck = "[Environment]::GetFolderPath('MyDocuments')";
        else if (o.ordner === 'eigen') ordnerAusdruck = psStr(o.pfad);
        else ordnerAusdruck = "$(try { (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path } catch { Join-Path $env:USERPROFILE 'Downloads' })";
        const z = [];
        z.push('# ' + T.kopf, '# ' + T.erkl, '');
        z.push('$Ordner = ' + ordnerAusdruck);
        z.push('$Regeln = [ordered]@{');
        o.regeln.forEach(r => z.push('    ' + psStr(r.ordner) + ' = @(' + r.endungen.map(e => psStr('.' + e)).join(', ') + ')'));
        z.push('}');
        z.push('$Sonstiges = ' + psStr(o.sonstiges || ''));
        z.push('$Doppelt = ' + psStr(o.doppelt === 'umbenennen' ? 'umbenennen' : 'ueberspringen'));
        z.push('$ImmerLassen = @(' + IMMER_LASSEN.map(e => psStr('.' + e)).join(', ') + ')');
        z.push('');
        z.push('try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}');
        z.push('function Ende { Write-Host ""; [void](Read-Host ' + psStr(T.enter) + '); exit }');
        z.push('Write-Host ' + psStr(T.kopf) + ' -ForegroundColor Cyan');
        z.push('Write-Host (' + psStr(T.ordner + ': ') + ' + $Ordner)');
        z.push('if (-not $Ordner -or -not (Test-Path -LiteralPath $Ordner -PathType Container)) { Write-Host (' + psStr(T.fehlt + ': ') + ' + $Ordner) -ForegroundColor Red; Ende }');
        z.push('$Zuordnung = @{}');
        z.push('foreach ($k in $Regeln.Keys) { foreach ($e in $Regeln[$k]) { if (-not $Zuordnung.ContainsKey($e)) { $Zuordnung[$e] = $k } } }');
        z.push('$Ich = $PSCommandPath');
        z.push('$Plan = @()');
        z.push('foreach ($f in (Get-ChildItem -LiteralPath $Ordner -Force | Where-Object { -not $_.PSIsContainer })) {');
        z.push('    if ($f.Attributes -band [IO.FileAttributes]::Hidden) { continue }');
        z.push("    if ($f.Name.StartsWith('.') -or $f.Name.StartsWith(" + psStr(PROTOKOLL_PREFIX) + ')) { continue }');
        z.push('    if ($Ich -and $f.FullName -eq $Ich) { continue }');
        z.push('    $e = $f.Extension.ToLowerInvariant()');
        z.push('    if ($ImmerLassen -contains $e) { continue }');
        z.push('    $ziel = $null');
        z.push('    if ($e -and $Zuordnung.ContainsKey($e)) { $ziel = $Zuordnung[$e] } elseif ($Sonstiges) { $ziel = $Sonstiges }');
        z.push('    if ($ziel) { $Plan += [pscustomobject]@{ Datei = $f; Ziel = $ziel } }');
        z.push('}');
        z.push('if ($Plan.Count -eq 0) { Write-Host ' + psStr(T.nichts) + ' -ForegroundColor Yellow; Ende }');
        z.push('Write-Host ""');
        z.push('Write-Host ' + psStr(T.vorschau));
        z.push("$Plan | Group-Object Ziel | Sort-Object Name | ForEach-Object { Write-Host ('  {0,-22} {1} ' -f ($_.Name + '\\'), $_.Count) -NoNewline; Write-Host " + psStr(T.dateien) + ' }');
        z.push('Write-Host ""');
        z.push('$a = Read-Host ' + psStr(T.frage));
        z.push("if ($a -notmatch '^\\s*[jJyY]') { Write-Host " + psStr(T.abbruch) + '; Ende }');
        z.push('$ok = 0; $skip = 0; $fehl = 0; $Log = @()');
        z.push('foreach ($p in $Plan) {');
        z.push('    try {');
        z.push('        $zielOrdner = Join-Path $Ordner $p.Ziel');
        z.push('        if (-not (Test-Path -LiteralPath $zielOrdner -PathType Container)) { [void][IO.Directory]::CreateDirectory($zielOrdner) }');
        z.push('        $name = $p.Datei.Name');
        z.push('        $zielDatei = Join-Path $zielOrdner $name');
        z.push('        if (Test-Path -LiteralPath $zielDatei) {');
        z.push("            if ($Doppelt -ne 'umbenennen') { $skip++; continue }");
        z.push('            $n = 2');
        z.push('            do { $name = "{0} ({1}){2}" -f $p.Datei.BaseName, $n, $p.Datei.Extension; $zielDatei = Join-Path $zielOrdner $name; $n++ } while (Test-Path -LiteralPath $zielDatei)');
        z.push('        }');
        z.push('        [IO.File]::Move($p.Datei.FullName, $zielDatei)');
        z.push('        $ok++; $Log += ($p.Datei.Name + "  ->  " + $p.Ziel + "\\" + $name)');
        z.push('    } catch { $fehl++; Write-Host ("  " + $p.Datei.Name + ": " + $_.Exception.Message) -ForegroundColor Red }');
        z.push('}');
        z.push('if ($Log.Count) { $lp = Join-Path $Ordner (' + psStr(PROTOKOLL_PREFIX + '-') + " + (Get-Date -Format 'yyyy-MM-dd_HH-mm') + '.txt'); $Log | Set-Content -LiteralPath $lp -Encoding UTF8; Write-Host (" + psStr(T.protokoll + ': ') + ' + $lp) }');
        z.push('Write-Host ""');
        z.push('Write-Host (' + psStr(T.fertig + ': ') + " + $ok + ' ' + " + psStr(T.verschoben) + " + ', ' + $skip + ' ' + " + psStr(T.uebersprungen) + " + ', ' + $fehl + ' ' + " + psStr(T.fehler) + ') -ForegroundColor Green');
        z.push('Ende');
        return z.join('\r\n') + '\r\n';
    }

    function bashSkript(o) {
        const T = SKRIPT_TEXTE[o.lang] || SKRIPT_TEXTE.de;
        let ordner;
        if (o.ordner === 'eigen') ordner = shStr(o.pfad);
        else if (o.system === 'linux') {
            const xdg = { downloads: 'DOWNLOAD', desktop: 'DESKTOP', dokumente: 'DOCUMENTS' }[o.ordner] || 'DOWNLOAD';
            const ers = { downloads: 'Downloads', desktop: 'Desktop', dokumente: 'Documents' }[o.ordner] || 'Downloads';
            ordner = '"$(xdg-user-dir ' + xdg + ' 2>/dev/null || echo "$HOME/' + ers + '")"';
        } else ordner = '"$HOME/' + ({ downloads: 'Downloads', desktop: 'Desktop', dokumente: 'Documents' }[o.ordner] || 'Downloads') + '"';
        const z = [];
        z.push('#!/bin/bash', '# ' + T.kopf, '# ' + T.erkl, '');
        z.push('ORDNER=' + ordner);
        z.push('SONSTIGES=' + shStr(o.sonstiges || ''));
        z.push('DOPPELT=' + shStr(o.doppelt === 'umbenennen' ? 'umbenennen' : 'ueberspringen'));
        z.push('');
        z.push('kategorie() {');
        z.push('    case "$1" in');
        z.push('        ' + IMMER_LASSEN.join('|') + ') echo "" ;;');
        o.regeln.forEach(r => z.push('        ' + r.endungen.join('|') + ') echo ' + shStr(r.ordner) + ' ;;'));
        z.push('        *) echo "$SONSTIGES" ;;');
        z.push('    esac');
        z.push('}');
        z.push('');
        z.push('echo ' + shStr(T.kopf));
        z.push('echo ' + shStr(T.ordner + ': ') + '"$ORDNER"');
        z.push('if [ ! -d "$ORDNER" ]; then echo ' + shStr(T.fehlt + ': ') + '"$ORDNER"; exit 1; fi');
        z.push('PLAN="$(mktemp)"; trap \'rm -f "$PLAN"\' EXIT');
        z.push('for f in "$ORDNER"/*; do');
        z.push('    [ -f "$f" ] || continue');
        z.push('    [ -L "$f" ] && continue');
        z.push('    [ "$f" -ef "$0" ] && continue');
        z.push('    name="${f##*/}"');
        z.push('    case "$name" in ' + PROTOKOLL_PREFIX + '*) continue ;; esac');
        z.push('    case "$name" in ?*.*) ext="${name##*.}" ;; *) ext="" ;; esac');
        z.push("    ext=\"$(printf '%s' \"$ext\" | tr '[:upper:]' '[:lower:]')\"");
        z.push('    if [ -n "$ext" ]; then ziel="$(kategorie "$ext")"; else ziel="$SONSTIGES"; fi');
        z.push('    case "$ext" in ' + IMMER_LASSEN.join('|') + ') continue ;; esac');
        z.push('    [ -n "$ziel" ] && printf \'%s\\t%s\\n\' "$ziel" "$name" >> "$PLAN"');
        z.push('done');
        z.push('if [ ! -s "$PLAN" ]; then echo ' + shStr(T.nichts) + '; exit 0; fi');
        z.push('echo');
        z.push('echo ' + shStr(T.vorschau));
        z.push("cut -f1 \"$PLAN\" | sort | uniq -c | while read -r anzahl ordner; do printf '  %-22s %s %s\\n' \"$ordner/\" \"$anzahl\" " + shStr(T.dateien) + '; done');
        z.push('echo');
        z.push('printf \'%s \' ' + shStr(T.frage));
        z.push('read -r antwort < /dev/tty');
        z.push('case "$antwort" in [jJyY]*) ;; *) echo ' + shStr(T.abbruch) + '; exit 0 ;; esac');
        z.push('ok=0; skip=0; fehl=0');
        z.push('LOG="$ORDNER/' + PROTOKOLL_PREFIX + '-$(date +%Y-%m-%d_%H-%M).txt"');
        z.push("while IFS=\"$(printf '\\t')\" read -r ziel name; do");
        z.push('    mkdir -p "$ORDNER/$ziel" || { fehl=$((fehl+1)); continue; }');
        z.push('    neu="$name"');
        z.push('    if [ -e "$ORDNER/$ziel/$neu" ]; then');
        z.push('        if [ "$DOPPELT" != "umbenennen" ]; then skip=$((skip+1)); continue; fi');
        z.push('        case "$name" in ?*.*) basis="${name%.*}"; end=".${name##*.}" ;; *) basis="$name"; end="" ;; esac');
        z.push('        n=2; while [ -e "$ORDNER/$ziel/$basis ($n)$end" ]; do n=$((n+1)); done');
        z.push('        neu="$basis ($n)$end"');
        z.push('    fi');
        z.push('    if mv -n "$ORDNER/$name" "$ORDNER/$ziel/$neu" && [ -e "$ORDNER/$ziel/$neu" ] && [ ! -e "$ORDNER/$name" ]; then');
        z.push('        ok=$((ok+1)); printf \'%s  ->  %s/%s\\n\' "$name" "$ziel" "$neu" >> "$LOG"');
        z.push('    else');
        z.push('        fehl=$((fehl+1)); echo "  $name: ' + T.fehler + '"');
        z.push('    fi');
        z.push('done < "$PLAN"');
        z.push('[ -f "$LOG" ] && echo ' + shStr(T.protokoll + ': ') + '"$LOG"');
        z.push('echo');
        z.push('echo "' + T.fertig + ': $ok ' + T.verschoben + ', $skip ' + T.uebersprungen + ', $fehl ' + T.fehler + '"');
        return z.join('\n') + '\n';
    }

    const api = { STANDARD, endungenAus, sichererOrdnerName, zielFuer, nummerierterName, aktiveRegeln, powershellSkript, bashSkript, IMMER_LASSEN };
    if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
    window.SDOrdnen = api;

    // =====================================================================
    // Oberfläche
    // =====================================================================
    const { $, t, esc } = SD;
    const KEY = 'sdOrdnen';
    let d = SD.lesen(KEY, {}) || {};
    const speichern = () => SD.schreiben(KEY, d);
    const en = () => (window.SD_LANG || document.documentElement.lang) === 'en';
    if (!Array.isArray(d.kats)) d.kats = STANDARD.map(k => ({ id: k.id, ext: k.ext, an: !k.aus }));
    const nameVon = (k) => k.name || t('k_' + (STANDARD.some(s => s.id === k.id) ? k.id : 'neu'));
    const regeln = () => aktiveRegeln(d.kats, nameVon);
    const sonstigesName = () => d.sonstige ? sichererOrdnerName(t('sonstiges')) : '';

    // ---------- Regeln zeichnen ----------
    function zeichneKategorien() {
        $('kategorien').innerHTML = d.kats.map((k, i) =>
            '<div class="kat"><input type="checkbox" data-i="' + i + '" data-f="an"' + (k.an !== false ? ' checked' : '') + ' aria-label="an">' +
            '<input type="text" data-i="' + i + '" data-f="name" value="' + esc(nameVon(k)) + '" aria-label="' + esc(t('kat_name')) + '">' +
            '<input type="text" class="endungen" data-i="' + i + '" data-f="ext" value="' + esc(k.ext) + '" placeholder="' + esc(t('kat_endungen')) + '" aria-label="' + esc(t('kat_endungen')) + '">' +
            '<button type="button" class="btn klein gefahr" data-weg="' + i + '" aria-label="' + esc(t('kat_weg')) + '">✕</button></div>').join('');
        $('doppelt').value = d.doppelt || 'ueberspringen';
        $('sonstige').checked = !!d.sonstige;
    }
    $('kategorien').addEventListener('input', (e) => {
        const el = e.target, i = +el.dataset.i, k = d.kats[i];
        if (!k) return;
        if (el.dataset.f === 'an') k.an = el.checked;
        else if (el.dataset.f === 'name') k.name = el.value.trim() || null;
        else if (el.dataset.f === 'ext') k.ext = el.value;
        speichern(); regelnGeaendert();
    });
    $('kategorien').addEventListener('click', (e) => {
        const b = e.target.closest('[data-weg]');
        if (!b) return;
        d.kats.splice(+b.dataset.weg, 1); speichern(); zeichneKategorien(); regelnGeaendert();
    });
    $('katNeu').addEventListener('click', () => { d.kats.push({ id: 'eigen' + Date.now(), name: t('k_neu'), ext: '', an: true }); speichern(); zeichneKategorien(); const f = document.querySelectorAll('#kategorien .endungen'); f[f.length - 1].focus(); });
    $('katStandard').addEventListener('click', () => { d.kats = STANDARD.map(k => ({ id: k.id, ext: k.ext, an: !k.aus })); speichern(); zeichneKategorien(); regelnGeaendert(); });
    $('doppelt').addEventListener('change', () => { d.doppelt = $('doppelt').value; speichern(); regelnGeaendert(); });
    $('sonstige').addEventListener('change', () => { d.sonstige = $('sonstige').checked; speichern(); regelnGeaendert(); });
    function regelnGeaendert() { if (b.dateien) zeichnePlan(); zeichneSkript(); }

    // ---------- Tabs ----------
    function zeigeTab(tab, rollen) {
        d.tab = tab; speichern();
        document.querySelectorAll('.tabs [data-tab]').forEach(x => x.classList.toggle('an', x.dataset.tab === tab));
        if (rollen) window.scrollTo({ top: document.querySelector('.tabs').offsetTop - 70, behavior: 'smooth' });
        document.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== tab; });
    }
    document.querySelectorAll('[data-tab]').forEach(x => x.addEventListener('click', () => zeigeTab(x.dataset.tab, !x.closest('.tabs'))));

    // ---------- Weg 1: im Browser ----------
    const b = { dir: null, dateien: null, plan: null, log: [] };
    const kannOrdner = typeof window.showDirectoryPicker === 'function';
    $('bNichtMoeglich').hidden = kannOrdner;
    $('bStartBox').hidden = !kannOrdner;

    function fehlerZeigen(text) { $('bFehler').textContent = text; $('bFehler').hidden = !text; }

    async function einlesen() {
        const liste = [];
        for await (const [name, h] of b.dir.entries()) if (h.kind === 'file') liste.push({ name, handle: h });
        liste.sort((x, y) => x.name.localeCompare(y.name));
        b.dateien = liste;
        $('bOrdnerName').textContent = t('b_ordner', { name: b.dir.name, n: liste.length });
        zeichnePlan();
    }
    function zeichnePlan() {
        const r = regeln(), so = sonstigesName();
        const gruppen = new Map();
        let rest = 0;
        b.plan = [];
        b.dateien.forEach(f => {
            const z = zielFuer(f.name, r, so);
            if (!z) { rest++; return; }
            b.plan.push({ datei: f, ziel: z });
            if (!gruppen.has(z)) gruppen.set(z, []);
            gruppen.get(z).push(f.name);
        });
        $('bVorschau').hidden = false;
        $('bFertig').hidden = true;
        $('bPlan').innerHTML = gruppen.size ? [...gruppen].map(([z, namen]) => '<details><summary><span>📁 ' + esc(z) + '/</span><b>' + esc(t('b_dateien', { n: namen.length })) + '</b></summary><ul>' + namen.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul></details>').join('') : '<p class="info">' + esc(t('b_nichts')) + '</p>';
        $('bRest').textContent = rest ? t('b_rest', { n: rest }) : '';
        $('bLos').disabled = !b.plan.length;
    }

    async function gibtEs(dir, name) {
        try { await dir.getFileHandle(name); return true; } catch (e) {
            if (e && e.name === 'TypeMismatchError') return true;   // gleichnamiger Ordner
            return false;
        }
    }
    // Datei verschieben: move() wenn vorhanden, sonst kopieren + pruefen + Original entfernen
    async function verschiebe(handle, vonDir, alterName, zielDir, neuerName) {
        if (typeof handle.move === 'function') {
            try { await handle.move(zielDir, neuerName); return; } catch (e) { if (e && e.name === 'NotAllowedError') throw e; /* sonst Kopie versuchen */ }
            if (!(await gibtEs(vonDir, alterName)) && (await gibtEs(zielDir, neuerName))) return;   // move hat doch geklappt
        }
        const datei = await handle.getFile();
        const neu = await zielDir.getFileHandle(neuerName, { create: true });
        const w = await neu.createWritable();
        try { await w.write(datei); await w.close(); } catch (e) { try { await w.abort(); } catch (e2) { /* egal */ } try { await zielDir.removeEntry(neuerName); } catch (e3) { /* egal */ } throw e; }
        const kopie = await neu.getFile();
        if (kopie.size !== datei.size) { try { await zielDir.removeEntry(neuerName); } catch (e) { /* egal */ } throw new Error('size'); }
        await vonDir.removeEntry(alterName);
    }

    $('bWaehlen').addEventListener('click', async () => {
        fehlerZeigen('');
        try {
            $('bZuSkript').hidden = true;
            const dir = await window.showDirectoryPicker({ id: 'sd-ordnen', mode: 'readwrite', startIn: 'documents' });
            const recht = dir.requestPermission ? await dir.requestPermission({ mode: 'readwrite' }) : 'granted';
            if (recht !== 'granted') { fehlerZeigen(t('b_kein_recht')); return; }
            b.dir = dir; b.log = [];
            await einlesen();
        } catch (e) {
            if (e && e.name === 'AbortError') { fehlerZeigen(t('b_abbruch_tipp')); $('bZuSkript').hidden = false; return; }
            fehlerZeigen(e && e.name === 'SecurityError' ? t('b_gesperrt') : t('b_fehler', { msg: (e && e.message) || String(e) }));
            if (e && e.name === 'SecurityError') $('bZuSkript').hidden = false;
        }
    });
    $('bNeuLesen').addEventListener('click', () => { if (b.dir) einlesen().catch(e => fehlerZeigen(t('b_fehler', { msg: e.message }))); });

    $('bLos').addEventListener('click', async () => {
        if (!b.plan || !b.plan.length) return;
        fehlerZeigen('');
        $('bVorschau').hidden = true; $('bLaeuft').hidden = false; $('bFertig').hidden = true;
        let ok = 0, skip = 0;
        const fehler = [];
        b.log = [];
        const ordnerCache = new Map();
        const n = b.plan.length;
        for (let i = 0; i < n; i++) {
            const { datei, ziel } = b.plan[i];
            $('bBalken').style.width = Math.round(100 * i / n) + '%';
            $('bStatus').textContent = t('b_status', { i: i + 1, n, name: datei.name });
            try {
                if (!ordnerCache.has(ziel)) ordnerCache.set(ziel, await b.dir.getDirectoryHandle(ziel, { create: true }));
                const zielDir = ordnerCache.get(ziel);
                let neu = datei.name;
                if (await gibtEs(zielDir, neu)) {
                    if ((d.doppelt || 'ueberspringen') !== 'umbenennen') { skip++; continue; }
                    let k = 2;
                    while (await gibtEs(zielDir, nummerierterName(datei.name, k))) k++;
                    neu = nummerierterName(datei.name, k);
                }
                await verschiebe(datei.handle, b.dir, datei.name, zielDir, neu);
                ok++;
                b.log.push({ alt: datei.name, ziel, neu, zielDir });
            } catch (e) {
                fehler.push(datei.name + ' – ' + ((e && e.message) || (e && e.name) || String(e)));
            }
        }
        $('bBalken').style.width = '100%';
        $('bLaeuft').hidden = true;
        $('bFertig').hidden = false;
        $('bErgebnis').textContent = [t('b_fertig', { ok }), skip ? t('b_skip', { n: skip }) : ''].filter(Boolean).join(' ');
        $('bFehlerListe').innerHTML = fehler.length ? '<p class="fehler">' + esc(t('b_fehl', { n: fehler.length })) + '</p><ul class="info">' + fehler.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : '';
        $('bRueck').disabled = !b.log.length;
        try { await einlesen(); } catch (e) { /* egal */ } $('bVorschau').hidden = true; $('bFertig').hidden = false;
    });

    $('bRueck').addEventListener('click', async () => {
        let n = 0;
        const fehler = [];
        for (const l of b.log.slice().reverse()) {
            try {
                if (await gibtEs(b.dir, l.alt)) { fehler.push(l.alt); continue; }
                const h = await l.zielDir.getFileHandle(l.neu);
                await verschiebe(h, l.zielDir, l.neu, b.dir, l.alt);
                n++;
            } catch (e) { fehler.push(l.alt + ' – ' + ((e && e.message) || String(e))); }
        }
        b.log = [];
        $('bRueck').disabled = true;
        $('bErgebnis').textContent = t('b_rueck_ok', { n });
        $('bFehlerListe').innerHTML = fehler.length ? '<p class="fehler">' + esc(t('b_fehl', { n: fehler.length })) + '</p><ul class="info">' + fehler.map(f => '<li>' + esc(f) + '</li>').join('') + '</ul>' : '';
        try { await einlesen(); } catch (e) { /* egal */ } $('bVorschau').hidden = true; $('bFertig').hidden = false;
    });

    // ---------- Weg 2: Skript ----------
    if (!d.system) d.system = /Mac/i.test(navigator.platform || navigator.userAgent) ? 'mac' : /Linux/i.test(navigator.platform || '') && !/Android/i.test(navigator.userAgent) ? 'linux' : 'win';
    $('sSystem').value = d.system;
    $('sOrdner').value = d.sOrdner || 'downloads';
    $('sPfad').value = d.sPfad || '';
    function skriptOptionen() {
        return { lang: en() ? 'en' : 'de', system: d.system, ordner: d.sOrdner || 'downloads', pfad: d.sPfad || '', regeln: regeln(), sonstiges: sonstigesName(), doppelt: d.doppelt || 'ueberspringen' };
    }
    const dateiName = () => d.system === 'win' ? 'sd-ordner-aufraeumen.ps1' : 'sd-ordner-aufraeumen.sh';
    function zeichneSkript() {
        const o = skriptOptionen();
        $('sPfadFeld').hidden = o.ordner !== 'eigen';
        $('sPfad').placeholder = d.system === 'win' ? 'C:\\Users\\Name\\Bilder' : '/Users/name/Pictures';
        const win = d.system === 'win';
        const datei = dateiName();
        const schritte = win ? [t('s_win1', { datei }), t('s_win2'), t('s_win3')] : [t('s_mac1', { datei }), t('s_mac2'), t('s_mac3')];
        $('sSchritte').innerHTML = schritte.map(s => '<li>' + esc(s) + '</li>').join('');
        $('sBefehl').textContent = win
            ? 'powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\' + datei + '"'
            : 'bash ~/Downloads/' + datei;
        $('sWarnung').textContent = t(win ? 's_warn_win' : 's_warn_mac');
        $('sCode').textContent = (win ? powershellSkript : bashSkript)(o);
    }
    $('sSystem').addEventListener('change', () => { d.system = $('sSystem').value; speichern(); zeichneSkript(); });
    $('sOrdner').addEventListener('change', () => { d.sOrdner = $('sOrdner').value; speichern(); zeichneSkript(); });
    $('sPfad').addEventListener('input', () => { d.sPfad = $('sPfad').value.trim(); speichern(); zeichneSkript(); });
    $('sLaden').addEventListener('click', () => {
        const o = skriptOptionen();
        if (o.ordner === 'eigen' && !o.pfad) { SD.toast(t('s_pfad_fehlt')); $('sPfad').focus(); return; }
        if (!o.regeln.length && !o.sonstiges) { SD.toast(t('s_keine_regel')); return; }
        const win = d.system === 'win';
        // PowerShell 5 liest Skripte ohne BOM nicht als UTF-8 (Umlaute)
        const inhalt = win ? '\uFEFF' + powershellSkript(o) : bashSkript(o);
        SD.herunterladen(new Blob([inhalt], { type: win ? 'text/plain;charset=utf-8' : 'text/x-shellscript;charset=utf-8' }), dateiName());
    });
    $('sKopieren').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText($('sBefehl').textContent); SD.toast(t('kopiert')); }
        catch (e) { const r = document.createRange(); r.selectNodeContents($('sBefehl')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    });

    // ---------- Start ----------
    function allesNeu() { zeichneKategorien(); if (b.dateien) { $('bOrdnerName').textContent = t('b_ordner', { name: b.dir.name, n: b.dateien.length }); zeichnePlan(); } zeichneSkript(); }
    document.addEventListener('sd-lang-changed', allesNeu);
    zeichneKategorien();
    zeichneSkript();
    zeigeTab(d.tab || (kannOrdner ? 'browser' : 'skript'));
})();
