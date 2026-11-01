'use strict';
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

(async () => {
  const server = spawn(process.execPath, ['-e', `
    const http=require('http'),fs=require('fs'),path=require('path');
    http.createServer((req,res)=>{
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      const name=path.resolve(process.cwd(),'.'+pathname);
      if(!name.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return;}
      fs.stat(name,(e,st)=>{
        if(e||!st.isFile()){res.writeHead(404).end();return;}
        const ext=path.extname(name);
        res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[ext]||'application/octet-stream');
        fs.createReadStream(name).pipe(res);
      });
    }).listen(8765,'127.0.0.1');
  `], { stdio:'ignore' });
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/studio/index.html', {waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(1200);
    assert.match(await page.title(), /Code-Studio/);
    const result = await page.evaluate(() => ({
      check: typeof projektPruefen,
      framework: typeof frameworkErkennen,
      zip: typeof zipEinlesen,
      desktop: typeof desktopExport,
      assistant: typeof projektAssistent,
      react: frameworkErkennen({'package.json':JSON.stringify({dependencies:{react:'19.0.0'},scripts:{build:'vite build'}})}).name,
      missing: projektPruefen({'index.html':'<script src="missing.js"></script>'}).meldungen.some(m=>m.includes('missing.js'))
    }));
    for (const key of ['check','framework','zip','desktop','assistant']) assert.equal(result[key],'function',key);
    assert.equal(result.react,'React');
    assert.equal(result.missing,true);
    assert.equal(errors.length,0,'Browser-JavaScript-Fehler: '+errors.join(' | '));
    console.log('Chromium: Studio geladen, Projekterkennung und Dateiprüfung funktionieren.');
  } finally {
    if(browser) await browser.close();
    server.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
