'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

(async () => {
  async function warten(page, fn, label) {
    let last = false;
    for (let i = 0; i < 40; i++) {
      last = await page.evaluate(fn);
      if (last) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(label + ' nicht rechtzeitig: ' + last);
  }
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' })[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + '/studio/index.html';
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    const rejections = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', msg => { if (msg.type() === 'error' && /uncaught/i.test(msg.text())) errors.push(msg.text()); });
    await page.addInitScript(() => {
      window.addEventListener('unhandledrejection', e => { window.__sdRejections = window.__sdRejections || []; window.__sdRejections.push(String(e.reason && e.reason.message || e.reason)); });
      if (window.top !== window) return;
      if (!localStorage.getItem('sdStudioEinst')) localStorage.setItem('sdStudioEinst', JSON.stringify({ konfetti: false, live: false }));
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof S !== 'undefined' && S.layoutBereit && S.p);
    const name = 'speicher-lebenszyklus';
    await page.evaluate(async name => {
      await projSchreiben({ name, dateien: { 'test.txt': 'basis' }, haupt: 'test.txt', versionen: [], erstellt: Date.now() });
      await projektOeffnen(name);
    }, name);

    // Two saves queued back to back must keep the newer text.
    const rapid = await page.evaluate(async () => {
      S.p.dateien['rapid.txt'] = 'eins';
      const first = speichernJetzt();
      S.p.dateien['rapid.txt'] = 'zwei';
      const second = speichernJetzt();
      await first;
      await second;
      return (await projLesen(S.p.name)).dateien['rapid.txt'];
    });
    assert.equal(rapid, 'zwei', 'Later save in the same tab wins');

    // A direct project write that lands before a deferred snapshot must not be overwritten.
    const kept = await page.evaluate(async () => {
      await speichernJetzt();
      delete S.p.dateien['extra.txt'];
      const stale = speichernJetzt();
      S.p.dateien['extra.txt'] = 'kept';
      await projSchreiben(S.p);
      try { await stale; } catch (e) { /* conflict is safe; losing the file is not */ }
      return (await projLesen(S.p.name)).dateien['extra.txt'];
    });
    assert.equal(kept, 'kept', 'Pending snapshot must not erase a newer direct write');

    // Autosave timer persists without an extra manual save.
    await page.evaluate(() => { S.p.dateien['auto.txt'] = 'auto-wert'; speichernBald(); });
    await warten(page, async () => (await projLesen(S.p.name)).dateien['auto.txt'] === 'auto-wert' && S.geaendert === false, 'Autosave');

    // pagehide flushes before the 450ms autosave timer.
    const hidden = await page.evaluate(async () => {
      S.p.dateien['hide.txt'] = 'alt';
      await speichernJetzt();
      S.p.dateien['hide.txt'] = 'beim-verlassen';
      speichernBald();
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
      for (let i = 0; i < 40; i++) {
        const stored = await projLesen(S.p.name);
        if (stored.dateien['hide.txt'] === 'beim-verlassen') return stored.dateien['hide.txt'];
        await new Promise(r => setTimeout(r, 25));
      }
      return (await projLesen(S.p.name)).dateien['hide.txt'];
    });
    assert.equal(hidden, 'beim-verlassen', 'pagehide stores pending edits without waiting for the timer');

    // visibilitychange to hidden does the same.
    await page.evaluate(async () => {
      S.p.dateien['visible.txt'] = 'vorher';
      await speichernJetzt();
      S.p.dateien['visible.txt'] = 'versteckt';
      speichernBald();
    });
    // Headless Chromium rejects the hidden lifecycle state. Dispatch the real
    // visibilitychange handler with the state it checks.
    await page.evaluate(() => {
      const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState') || Object.getOwnPropertyDescriptor(document, 'visibilityState');
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      if (desc) Object.defineProperty(document, 'visibilityState', desc);
      else delete document.visibilityState;
    });
    await warten(page, async () => (await projLesen(S.p.name)).dateien['visible.txt'] === 'versteckt', 'visibilitychange');

    // Closing a second tab must not drop its unsaved edit.
    const second = await context.newPage();
    const secondErrors = [];
    second.on('pageerror', e => secondErrors.push(e.message));
    await second.goto(url + '?projekt=' + encodeURIComponent(name), { waitUntil: 'domcontentloaded' });
    await second.waitForFunction(n => typeof S !== 'undefined' && S.layoutBereit && S.p && S.p.name === n, name);
    await second.evaluate(() => {
      S.p.dateien['closed.txt'] = 'from-closed-tab';
      speichernBald();
    });
    await second.close();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(n => typeof S !== 'undefined' && S.layoutBereit && S.p && S.p.name === n, name);
    assert.equal(await page.evaluate(async () => (await projLesen(S.p.name)).dateien['closed.txt']), 'from-closed-tab', 'Closed tab is restored from the exit journal');

    // Stale tab conflicts, keeps the newer project, and stores its own stand beside it.
    const third = await context.newPage();
    const thirdErrors = [];
    third.on('pageerror', e => thirdErrors.push(e.message));
    await third.goto(url + '?projekt=' + encodeURIComponent(name), { waitUntil: 'domcontentloaded' });
    await third.waitForFunction(n => typeof S !== 'undefined' && S.layoutBereit && S.p && S.p.name === n, name);
    await page.evaluate(async () => { S.p.dateien['winner.txt'] = 'newer'; await speichernJetzt(); });
    const conflict = await third.evaluate(async () => {
      window.__sdRejections = [];
      S.p.dateien['winner.txt'] = 'stale';
      S.p.dateien['only-stale.txt'] = 'behalten';
      let failed = null;
      try { await speichernJetzt(); } catch (e) { failed = { message: e.message, sicherung: e.sicherung }; }
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }));
      await new Promise(r => setTimeout(r, 50));
      const original = window.SDStartpaket && SDStartpaket.exportieren;
      let exported = null;
      if (window.SDStartpaket) SDStartpaket.exportieren = async projekt => { exported = projekt.dateien['only-stale.txt']; return true; };
      try { await zipExport(); } finally { if (original) SDStartpaket.exportieren = original; }
      return { failed, exported, status: document.getElementById('sbGesp').textContent, rejections: window.__sdRejections || [] };
    });
    assert.equal(conflict.failed && conflict.failed.message, 'SD_SAVE_CONFLICT');
    assert.equal(await page.evaluate(async () => (await projLesen(S.p.name)).dateien['winner.txt']), 'newer');
    assert.equal(await page.evaluate(async () => (await projLesen(S.p.name)).dateien['only-stale.txt']), undefined);
    const rescue = await page.evaluate(async sicherung => projLesen(sicherung), conflict.failed.sicherung);
    assert.equal(rescue.dateien['only-stale.txt'], 'behalten');
    assert.equal(rescue.dateien['winner.txt'], 'stale');
    assert.equal(conflict.exported, 'behalten', 'ZIP export keeps this tab after a conflict');
    assert.match(conflict.status, /Konflikt/);
    assert.deepEqual(conflict.rejections, []);

    // A second autosave in the stale tab must not raise another unhandled rejection or erase the rescue.
    await third.evaluate(() => { S.p.dateien['only-stale.txt'] = 'noch-da'; speichernBald(); });
    await third.waitForFunction(() => document.getElementById('sbGesp').textContent.includes('Konflikt'));
    await third.waitForTimeout(700);
    const rescueAgain = await page.evaluate(async sicherung => (await projLesen(sicherung)).dateien['only-stale.txt'], conflict.failed.sicherung);
    assert.equal(rescueAgain, 'noch-da');
    assert.equal(await page.evaluate(async () => (await projLesen(S.p.name)).dateien['winner.txt']), 'newer');

    // Switching projects must not copy the new project into the previous record.
    const switched = await page.evaluate(async () => {
      const alt = S.p.name;
      S.p.dateien['alt.txt'] = 'alt-inhalt';
      speichernBald();
      const neu = 'speicher-ziel';
      await projSchreiben({ name: neu, dateien: { 'neu.txt': 'neu-inhalt' }, haupt: 'neu.txt', versionen: [], erstellt: Date.now() });
      await projektOeffnen(neu);
      const altProjekt = await projLesen(alt);
      return { altHat: altProjekt.dateien['alt.txt'], altHatNeu: altProjekt.dateien['neu.txt'], aktuell: S.p.name };
    });
    assert.equal(switched.altHat, 'alt-inhalt');
    assert.equal(switched.altHatNeu, undefined);
    assert.equal(switched.aktuell, 'speicher-ziel');

    await third.evaluate(() => { S.geaendert = false; });
    await third.close();
    rejections.push(...await page.evaluate(() => window.__sdRejections || []));
    assert.deepEqual(errors, []);
    assert.deepEqual(secondErrors, []);
    assert.deepEqual(thirdErrors, []);
    assert.deepEqual(rejections, []);
    await context.close();
    console.log('PASS Studio save lifecycle: autosave, pagehide, multi-tab conflict, export');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
