'use strict';
async function openKI(page,tab){
 if(!await page.locator('#kiOverlay').isVisible())await page.locator('#kiBtn').click();
 await page.locator('#'+tab).click();
}

/* Importierte Projekte (ZIP, GitHub, Ordner, eingefügt) laufen in einer isolierten Vorschau ohne Zugriff auf thesdhub.com. */
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
    }).listen(8767,'127.0.0.1');
  `], { stdio:'ignore' });
  let browser;
  try {
    browser = await chromium.launch({headless:true});
    const page = await browser.newPage({viewport:{width:1300,height:900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8767/studio/index.html?projekt=meine-webseite', {waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#app').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>typeof S!=='undefined'&&S.gestartet&&S.p,{timeout:15000});
    await page.waitForTimeout(800);
    // Eigenes Projekt: normale Vorschau (wie bisher)
    await page.evaluate(async()=>{
      await projSchreiben({name:'eigen',dateien:{'index.html':'<h1>Eigen</h1>'},haupt:'index.html',versionen:[],erstellt:Date.now()});
      await projektOeffnen('eigen','index.html'); await vorschau(true);
    });
    const eigen = await page.locator('#frame').getAttribute('sandbox');
    // Importiertes Projekt: Skript versucht, Daten von thesdhub.com zu lesen
    await page.evaluate(async()=>{
      localStorage.setItem('sdGeheimTest','GEHEIM');
      await projSchreiben({name:'importiert',dateien:{'index.html':'<h1 id=t>x</h1><script>let w;try{w=localStorage.getItem("sdGeheimTest")}catch(e){w="blockiert"}document.getElementById("t").textContent=String(w);<\/script>'},haupt:'index.html',versionen:[],erstellt:Date.now(),fremdQuelle:'zip'});
      await projektOeffnen('importiert','index.html'); await vorschau(true);
    });
    await page.waitForTimeout(800);
    const imp = await page.locator('#frame').getAttribute('sandbox');
    assert(!imp.includes('allow-same-origin'), 'Importiertes Projekt muss isoliert laufen: ' + imp);
    const gelesen = await page.frameLocator('#frame').locator('#t').textContent();
    assert.notEqual(gelesen, 'GEHEIM', 'Importierter Code darf Studio-Daten nicht lesen');
    // Kopien behalten die Markierung
    await page.evaluate(async()=>{ window.prompt=()=> 'importiert-kopie'; await projektDuplizieren(); });
    assert.equal(await page.evaluate(()=>S.p.fremdQuelle), 'zip', 'Kopie bleibt als importiert markiert');
    // Bewusst vertrauen: danach wie eigener Code
    await page.evaluate(async()=>{ window.confirm=()=>true; await projektVertrauen(); await vorschau(true); });
    const danach = await page.locator('#frame').getAttribute('sandbox');
    assert.equal(await page.evaluate(()=>S.p.fremdQuelle), undefined);
    assert.equal(danach, eigen, 'Nach „vertrauen“ gleiche Vorschau wie eigenes Projekt');
    assert.deepEqual(errors, []);
    console.log('fremd-vorschau: ok (eigen=' + eigen + ' | importiert=' + imp + ')');
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
