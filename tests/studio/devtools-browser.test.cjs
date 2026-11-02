'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

(async () => {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!['/studio/devtools.html', '/studio/devtools.js', '/icon.svg'].includes(pathname)) {
      res.writeHead(404).end(); return;
    }
    res.setHeader('Content-Type', pathname.endsWith('.js') ? 'application/javascript' :
      pathname.endsWith('.svg') ? 'image/svg+xml' : 'text/html; charset=utf-8');
    fs.createReadStream(path.join(root, pathname)).on('error', () => res.writeHead(404).end()).pipe(res);
  });
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/studio/devtools.html');
    await page.locator('#source').fill('{"name":"Test","list":[1,2]}');
    await page.locator('#execute').click();
    assert.equal(JSON.parse(await page.locator('#output').inputValue()).name, 'Test');

    await page.locator('[data-tool="base64-encode"]').click();
    await page.locator('#source').fill('Äpfel 🍎');
    await page.locator('#execute').click();
    const encoded = await page.locator('#output').inputValue();
    await page.locator('[data-tool="base64-decode"]').click();
    await page.locator('#source').fill(encoded);
    await page.locator('#execute').click();
    assert.equal(await page.locator('#output').inputValue(), 'Äpfel 🍎');

    await page.locator('[data-tool="text-diff"]').click();
    assert.equal(await page.locator('#compareArea').isVisible(), true);
    await page.locator('#source').fill('alt');
    await page.locator('#second').fill('neu');
    await page.locator('#execute').click();
    const diff = await page.locator('#output').inputValue();
    assert.match(diff, /- alt/);
    assert.match(diff, /\+ neu/);

    await page.locator('[data-tool="json-pretty"]').click();
    await page.locator('#source').fill('<img src=x onerror=alert(1)>');
    await page.locator('#execute').click();
    assert.match(await page.locator('#status').innerText(), /Fehler/);
    assert.equal(await page.locator('#output').inputValue(), '');
    assert.deepEqual(errors, []);

    await page.setViewportSize({ width: 375, height: 812 });
    assert.equal(await page.locator('#execute').isVisible(), true);
    assert.equal(await page.locator('#source').isVisible(), true);
    console.log('SD Entwickler-Tools: Browser-Smoke erfolgreich.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
