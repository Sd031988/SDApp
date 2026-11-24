'use strict';
// Feedback-Vorschau und Verwaltung im Browser: PC und iPhone. Kein echter Server, keine echten Daten.
const assert = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const {chromium, devices} = require('playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const p = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404).end(); return; } res.setHeader('Content-Type', ({'.html': 'text/html', '.js': 'application/javascript', '.svg': 'image/svg+xml'})[path.extname(p)] || 'application/octet-stream'); res.end(d); });
});
const API = 'https://api.feedback.test';
const FAKE_AUTH = `(() => { let cb = []; const user = {getIdToken: async () => 'TOKEN-ADMIN'};
  window.__auth = {user: null, onChange(f) { cb.push(f); f(this.user); }, async signIn(e, p) { if (p !== 'richtig') throw new Error('x'); this.user = user; cb.forEach(f => f(user)); },
    async signOutNow() { this.user = null; cb.forEach(f => f(null)); }, friendlyError: () => 'E-Mail-Adresse oder Passwort ist falsch.'};
  window.SD_AUTH = window.__auth; })();`;

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  try {
    for (const [name, opts] of [['PC', {viewport: {width: 1280, height: 900}}], ['iPhone', devices['iPhone 13']]]) {
      const ctx = await browser.newContext(Object.assign({locale: 'de-DE'}, opts));
      const page = await ctx.newPage(), fehler = [];
      page.on('pageerror', e => fehler.push(e.message));
      // 1) Vorschau: nichts kann gesendet werden, Dari und Arabisch von rechts nach links
      await page.goto(base + '/docs/feedback-preview.html');
      assert.equal(await page.locator('button:not([disabled])').count(), 0, name + ': kein aktiver Absende-Knopf');
      assert.equal(await page.locator('form[action]').count(), 0);
      assert.equal(await page.locator('#fa').getAttribute('dir'), 'rtl'); assert.equal(await page.locator('#ar').getAttribute('dir'), 'rtl');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ': Vorschau ohne seitliches Scrollen');

      // 2) Verwaltung ohne Server: nur Hinweis, kein Login
      await page.goto(base + '/docs/feedback-admin.html');
      assert.equal(await page.locator('#faNichtVerbunden').isVisible(), true, name + ': Hinweis „nicht verbunden“');
      assert.equal(await page.locator('#faLogin').isVisible(), false);

      // 3) Verwaltung mit (nachgebautem) Server
      const anfragen = [];
      let items = [
        {id: 'a'.repeat(32), language: 'fa', permission: 'anonymous', quote: 'Sehr hilfreich', answers: ['Deutsch', 'Sehr hilfreich', '', '', ''], createdAt: '2026-11-24T10:00:00Z'},
        {id: 'b'.repeat(32), language: 'de', permission: 'none', quote: '', answers: ['<img src=x onerror=alert(1)>', '', '', '', ''], createdAt: '2026-11-24T11:00:00Z'}];
      await page.route(base + '/sd-auth.js', r => r.fulfill({contentType: 'application/javascript', body: ''}));
      await page.route(base + '/docs/feedback-admin.html', async r => {
        const html = fs.readFileSync(path.join(root, 'docs/feedback-admin.html'), 'utf8').replace('data-api=""', 'data-api="' + API + '"');
        r.fulfill({contentType: 'text/html', body: html});
      });
      await page.route(API + '/**', async r => {
        const req = r.request(), p = new URL(req.url()).pathname;
        anfragen.push([req.method(), p, req.headers().authorization || '']);
        if (req.headers().authorization !== 'Bearer TOKEN-ADMIN') return r.fulfill({status: 403, contentType: 'application/json', body: '{"error":"forbidden"}'});
        if (p === '/admin/pending') return r.fulfill({contentType: 'application/json', body: JSON.stringify({items})});
        const id = JSON.parse(req.postData() || '{}').id; items = items.filter(x => x.id !== id);
        return r.fulfill({contentType: 'application/json', body: '{"ok":true}'});
      });
      await page.addInitScript(FAKE_AUTH);
      await page.goto(base + '/docs/feedback-admin.html');
      await page.locator('#faLogin').waitFor();
      await page.fill('#faEmail', 'admin@example.org'); await page.fill('#faPasswort', 'falsch'); await page.click('#faLoginForm button');
      assert.match(await page.locator('#faLoginFehler').innerText(), /falsch/);
      await page.fill('#faPasswort', 'richtig'); await page.click('#faLoginForm button');
      await page.locator('#faListe article').nth(1).waitFor();
      assert.match(await page.locator('#faStatus').innerText(), /2 Rückmeldung/);
      // Inhalte nur als Text (kein eingeschleustes HTML)
      assert.equal(await page.locator('#faListe img').count(), 0, name + ': HTML aus Rückmeldungen wird nicht ausgeführt');
      assert.match(await page.locator('#faListe article').nth(1).innerText(), /<img src=x/);
      // „Nur intern“ hat keinen Veröffentlichen-Knopf
      assert.equal(await page.locator('#faListe article').nth(1).getByRole('button', {name: 'Veröffentlichen'}).count(), 0);
      await page.locator('#faListe article').nth(0).getByRole('button', {name: 'Veröffentlichen'}).click();
      await page.waitForFunction(() => document.querySelectorAll('#faListe article').length === 1);
      // Löschen braucht einen zweiten Klick
      const del = page.locator('#faListe article').first().getByRole('button', {name: 'Löschen'});
      await del.click(); assert.equal(anfragen.filter(a => a[1] === '/admin/remove').length, 0, 'erster Klick löscht noch nicht');
      await page.locator('#faListe article').first().getByRole('button', {name: /Wirklich/}).click();
      await page.waitForFunction(() => /Keine wartenden/.test(document.getElementById('faStatus').textContent));
      assert.ok(anfragen.every(a => a[2] === 'Bearer TOKEN-ADMIN'), 'jede Anfrage mit Token');
      assert.deepEqual(anfragen.filter(a => a[0] === 'POST').map(a => a[1]), ['/admin/approve', '/admin/remove']);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ': Verwaltung ohne seitliches Scrollen');
      await page.screenshot({path: path.join(require('os').tmpdir(), 'feedback-admin-' + name + '.png'), fullPage: true});
      assert.deepEqual(fehler, [], name + ': keine Skriptfehler');
      await ctx.close();
    }
    console.log('Feedback-Seiten (PC + iPhone): OK');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
