'use strict';
/* KI-Werkstatt: „Als neues, leeres Projekt übernehmen“ darf KEINEN alten Code mitnehmen. */
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
    }).listen(8766,'127.0.0.1');
  `], { stdio:'ignore' });
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    const page = await browser.newPage({viewport:{width:1300,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8766/studio/index.html', {waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#app').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>typeof S!=='undefined'&&S.gestartet&&S.p,{timeout:15000});
    await page.waitForTimeout(800);
    // Altes Projekt mit Code, der im neuen Projekt NICHT auftauchen darf
    await page.evaluate(async()=>{
      await projSchreiben({name:'altes-projekt',dateien:{'index.html':'<h1>ALTER CODE</h1>','alt.js':'console.log("alt")','style.css':'body{color:red}'},haupt:'index.html',versionen:[],erstellt:Date.now()});
      await projektOeffnen('altes-projekt','index.html');
    });
    assert.equal(await page.evaluate(()=>S.p.name),'altes-projekt');

    // Änderungsmodus: kein „neues, leeres Projekt“ anbieten
    await page.locator('#kiChangeBtn').click();
    assert.equal(await page.locator('#kiNeu').isVisible(),false,'Im Änderungsmodus kein leeres Projekt');
    await page.keyboard.press('Escape');
    await page.evaluate(()=>{const o=document.getElementById('kiOverlay');if(o&&!o.hidden){const z=document.getElementById('kiClose');if(z)z.click();else o.hidden=true}});

    // Neues Programm: KI-Antwort mit zwei Dateien
    await page.locator('#kiCodeBtn').click();
    assert.equal(await page.locator('#kiNeu').isVisible(),true);
    await page.locator('#kiGoal').fill('Mein neues Spiel');
    const t='```';
    await page.locator('#kiResult').fill(['Hier ist dein Projekt.','### Datei: index.html',t+'html',
      '<!doctype html><html lang="de"><head><title>Neu</title><link rel="stylesheet" href="spiel.css"></head><body><h1>NEUES SPIEL</h1></body></html>',t,
      '### Datei: spiel.css',t+'css','h1 { color: green; }',t].join('\n'));
    await page.locator('#kiAnalyse').click();
    await page.waitForFunction(()=>!document.getElementById('kiNeu').disabled,{timeout:8000});
    let promptText='';
    page.once('dialog',d=>{promptText=d.message();d.accept('Mein neues Spiel')});
    await page.locator('#kiNeu').click();
    await page.waitForFunction(()=>S.p&&S.p.name!=='altes-projekt',{timeout:12000});
    const neu=await page.evaluate(async()=>({name:S.p.name,dateien:Object.keys(S.p.dateien).sort(),html:S.p.dateien['index.html'],alt:(await projLesen('altes-projekt')).dateien}));
    assert.match(promptText,/NEUE Projekt/);
    assert.deepEqual(neu.dateien,['index.html','spiel.css'],'Nur die KI-Dateien, keine alten Dateien: '+neu.dateien.join(','));
    assert.match(neu.html,/NEUES SPIEL/);
    assert.doesNotMatch(neu.html,/ALTER CODE/);
    assert.equal(neu.alt['alt.js'],'console.log("alt")','Altes Projekt bleibt unverändert');
    assert.equal(neu.alt['index.html'],'<h1>ALTER CODE</h1>');
    assert.equal(await page.locator('#kiOverlay').isVisible(),false);
    assert.equal(await page.locator('#vorschau').isVisible(),false,'KI-Code darf nicht automatisch starten');
    assert.deepEqual(errors,[]);
    console.log('PASS KI-Werkstatt: neues, leeres Projekt ohne alten Code ('+neu.name+')');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch(e => { console.error(e); process.exit(1); });
