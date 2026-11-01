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
    const zipResult = await page.evaluate(async () => {
      const original = {
        'index.html':'<!doctype html><html><body>Hallo</body></html>',
        'css/style.css':'body { color: blue; }',
        'js/app.js':'console.log("ok")',
        'bilder/logo.svg':'<svg xmlns="http://www.w3.org/2000/svg"></svg>'
      };
      const blob = zipBauen(original);
      const destination = {};
      const file = { arrayBuffer: () => blob.arrayBuffer() };
      const count = await zipEinlesen(file, destination);
      return {count, files:destination};
    });
    assert.equal(zipResult.count,4,'ZIP-Dateizahl');
    assert.deepEqual(zipResult.files,{
      'index.html':'<!doctype html><html><body>Hallo</body></html>',
      'css/style.css':'body { color: blue; }',
      'js/app.js':'console.log("ok")',
      'bilder/logo.svg':'<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    },'ZIP-Roundtrip mit Ordnern und Dateiinhalten');
    const analysis = await page.evaluate(() => zipProjektAnalyse({
      'index.html':'<link href="css/style.css" rel="stylesheet">',
      'css/style.css':'body{}',
      'package.json':JSON.stringify({dependencies:{react:'19.0.0'},scripts:{build:'vite build'}})
    }));
    assert.equal(analysis.framework.name,'React');
    assert.equal(analysis.start,'index.html');
    assert.equal(analysis.sprache,'HTML');
    assert(analysis.ordner.includes('css'));
    const builder = await page.evaluate(() => ({
      web: appBuilderPlan({'index.html':'<h1>Hallo</h1>'}).optionen.map(x=>x.id),
      react: appBuilderPlan({'package.json':JSON.stringify({dependencies:{react:'19'},scripts:{build:'vite build'}})}).optionen.map(x=>x.id),
      empty: appBuilderPlan({}).optionen.length
    }));
    assert.deepEqual(builder.web,['web','desktop']);
    assert.deepEqual(builder.react,['framework']);
    assert.equal(builder.empty,0);
    const design = await page.evaluate(() => {
      const original = '<!doctype html><html><head><title>Alt</title></head><body><main><h1>Vorher</h1><p>Original</p></main></body></html>';
      const changed = websiteDesignVorschlag(original,{titel:'Neu',ueberschrift:'Nachher',beschreibung:'Bearbeitet',farbe:'#336699'});
      return {original,changed};
    });
    assert(design.changed.includes('<title>Neu</title>'));
    assert(design.changed.includes('Nachher'));
    assert(design.changed.includes('Bearbeitet'));
    assert(design.changed.includes('#336699'));
    assert(design.original.includes('Vorher'));
    const diagnostics = await page.evaluate(() => ({
      broken: fehlerFinden({'index.html':'<link href="css/missing.css" rel="stylesheet"><script src="js/missing.js"></script>','package.json':'{broken'}),
      valid: fehlerFinden({'index.html':'<link href="style.css" rel="stylesheet">','style.css':'body{}'})
    }));
    assert(diagnostics.broken.some(x=>x.typ==='json'));
    assert(diagnostics.broken.some(x=>x.typ==='referenz'&&x.reparatur.ziel==='css/missing.css'));
    assert(diagnostics.broken.some(x=>x.typ==='referenz'&&x.reparatur.ziel==='js/missing.js'));
    assert.equal(diagnostics.valid.length,0);
    const github = await page.evaluate(() => ({
      valid:githubAdressePruefen('https://github.com/example/my-app'),
      short:githubAdressePruefen('example/my-app'),
      invalid:githubAdressePruefen('https://evil.example/example/my-app'),
      safe:githubPfadSicher('src/index.js'),
      traversal:githubPfadSicher('../private.txt'),
      dependencies:githubPfadSicher('node_modules/test.js')
    }));
    assert.equal(github.valid.owner,'example');
    assert.equal(github.valid.repo,'my-app');
    assert.equal(github.short.repo,'my-app');
    assert.equal(github.invalid,null);
    assert.equal(github.safe,true);
    assert.equal(github.traversal,false);
    assert.equal(github.dependencies,false);
    const lessons = await page.evaluate(() => ({
      count:LERN_LEKTIONEN.length,
      htmlOk:lernAufgabePruefen('html','<h1>Hallo</h1><p>Welt</p>'),
      htmlBad:lernAufgabePruefen('html','<h1>Hallo</h1>'),
      cssOk:lernAufgabePruefen('css','body { background-color: red; } h1 { color: blue; }'),
      jsOk:lernAufgabePruefen('javascript',"const begruessung = 'Hallo'; console.log(begruessung);"),
      pythonOk:lernAufgabePruefen('python',"name = 'Ada'\nprint(name)"),
      unknown:lernAufgabePruefen('unknown','anything')
    }));
    assert.equal(lessons.count,11);
    assert.equal(lessons.htmlOk,true);
    assert.equal(lessons.htmlBad,false);
    assert.equal(lessons.cssOk,true);
    assert.equal(lessons.jsOk,true);
    assert.equal(lessons.pythonOk,true);
    assert.equal(lessons.unknown,false);
    const advanced = await page.evaluate(() => ({
      layout:lernAufgabePruefen('css-layout','.container { display: flex; gap: 12px; }'),
      functions:lernAufgabePruefen('javascript-functions','function addieren(a,b) { return a + b; }'),
      loops:lernAufgabePruefen('python-loops','for i in range(5):\n    print(i)'),
      project:lernAufgabePruefen('web-project','<h1>Titel</h1><nav></nav><main><section></section><section></section></main>'),
      incomplete:lernKursStatus({}).fertig,
      complete:lernKursStatus(Object.fromEntries(LERN_LEKTIONEN.map(l=>[l.id,'abgeschlossen']))).fertig
    }));
    assert.equal(advanced.layout,true);
    assert.equal(advanced.functions,true);
    assert.equal(advanced.loops,true);
    assert.equal(advanced.project,true);
    assert.equal(advanced.incomplete,false);
    assert.equal(advanced.complete,true);
    const course = await page.evaluate(() => ({
      quizCorrect:lernQuizPruefen('html',0),
      quizWrong:lernQuizPruefen('html',1),
      quizUnknown:lernQuizPruefen('missing',0),
      next:lernNaechsteLektion({html:'abgeschlossen'}).id,
      first:lernNaechsteLektion({}).id,
      project:lernLektionAusProjekt({name:'lernen-css-layout-2',dateien:{'LEKTION.md':'Übung'}})?.id,
      unrelated:lernLektionAusProjekt({name:'website',dateien:{'LEKTION.md':'Übung'}})
    }));
    assert.equal(course.quizCorrect,true);
    assert.equal(course.quizWrong,false);
    assert.equal(course.quizUnknown,false);
    assert.equal(course.first,'html');
    assert.equal(course.next,'css');
    assert.equal(course.project,'css-layout');
    assert.equal(course.unrelated,null);
    const executable = await page.evaluate(async () => ({
      pass:await lernCodeTesten('javascript-functions','function addieren(a,b){return a+b;}'),
      fail:await lernCodeTesten('javascript-functions','function addieren(a,b){return a-b;}'),
      condition:await lernCodeTesten('js-conditions','function istVolljaehrig(alter){return alter>=18;}'),
      array:await lernCodeTesten('js-arrays','function summe(zahlen){return zahlen.reduce((a,b)=>a+b,0);}')
    }));
    assert.equal(executable.pass.bestanden,true,'Ausführbarer Additions-Test');
    assert.equal(executable.fail.bestanden,false,'Fehlerhafter Code muss durchfallen');
    assert.equal(executable.condition.bestanden,true,'Bedingungstest');
    assert.equal(executable.array.bestanden,true,'Arraytest');
    const endToEnd = await page.evaluate(async () => {
      const before = {name:'bestehendes-projekt',dateien:{'index.html':'ORIGINAL'}};
      const unchanged = JSON.stringify(before);
      const lesson = LERN_LEKTIONEN.find(l=>l.id==='js-conditions');
      const valid = lernQuizPruefen(lesson.id,1);
      const next = lernNaechsteLektion({'html':'abgeschlossen'}).id;
      return {valid,next,unchanged:JSON.stringify(before)===unchanged,lesson:lesson.id};
    });
    assert.equal(endToEnd.valid,true);
    assert.equal(endToEnd.next,'css');
    assert.equal(endToEnd.unchanged,true);
    assert.equal(endToEnd.lesson,'js-conditions');
    const jsonDiagnostics = await page.evaluate(() => ({
      valid:editorJsonDiagnose('{"ok":true}','settings.json'),
      invalid:editorJsonDiagnose('{"ok": }','settings.json'),
      other:editorJsonDiagnose('broken','notes.txt'),
      multi:editorJsonDiagnose('{\n"ok": true,\n"bad": }','settings.json')
    }));
    assert.equal(jsonDiagnostics.valid,null);
    assert.equal(jsonDiagnostics.other,null);
    assert(jsonDiagnostics.invalid && jsonDiagnostics.invalid.message);
    assert(jsonDiagnostics.multi && jsonDiagnostics.multi.line>=1);
    const pasteUpload = await page.evaluate(() => {
      einfuegenDialog('');
      return {
        zip:!!document.querySelector('#efZipDatei[type=file]'),
        folder:document.querySelector('#efOrdnerDatei')?.hasAttribute('webkitdirectory'),
        files:document.querySelector('#efMehrDateien')?.multiple,
        handler:typeof einfuegenDateienImportieren,
        oldProject:S.p?.name||null
      };
    });
    assert.equal(pasteUpload.zip,true,'ZIP-Schaltfläche im Einfügen-Dialog');
    assert.equal(pasteUpload.folder,true,'Ordnerauswahl');
    assert.equal(pasteUpload.files,true,'Mehrfach-Dateiauswahl');
    assert.equal(pasteUpload.handler,'function');
    // KI Coding: real browser flow, review, copy creation, then existing ▶ execute.
    await page.locator('#efZu').click(); // Close earlier Import dialog before starting AI workflow.
    assert.equal(await page.locator('#kiCodeBtn').count(),1,'KI Coding button visible');
    await page.locator('#kiCodeBtn').click();
    assert.equal(await page.locator('#kiOverlay').isVisible(),true);
    await page.locator('#kiGoal').fill('Erstelle eine kleine Webseite mit Überschrift.');
    const aiBefore=await page.evaluate(()=>({name:S.p.name,files:JSON.stringify(S.p.dateien)}));
    const ticks=String.fromCharCode(96).repeat(3);
    const aiAnswer=[
      'Hier sind alle Dateien für dein Projekt.',
      '### Datei: index.html',ticks+'html',
      '<!doctype html><html lang="de"><head><title>KI Test</title><link href="css/style.css" rel="stylesheet"></head><body><h1 id="kiTest">Funktioniert</h1><script src="js/app.js"></script></body></html>',ticks,
      'Die Erklärung für CSS wird nicht übernommen.',
      '### Datei: css/style.css',ticks+'css','body { color: #222; }',ticks,
      '### Datei: js/app.js',ticks+'javascript','console.log("JS-Code erkannt")',ticks,
      'Jetzt kommt ein Python-Programm.',ticks+'python','print("Python erkannt")',ticks,
      'Jetzt kommt ein Java-Programm.',ticks+'java','public class Main { public static void main(String[] args) {} }',ticks,
      'Dies ist nur eine abschließende Erklärung.'
    ].join('\n');
    await page.locator('#kiResult').fill(aiAnswer);
    await page.locator('#kiResult').dispatchEvent('paste');
    await page.waitForFunction(()=>document.querySelectorAll('#kiFiles .kiFile').length===5,{timeout:5000});
    assert.equal(await page.locator('#kiFiles .kiFile').count(),5,'HTML CSS JavaScript Python and Java routed');
    for(const file of ['index.html','css/style.css','js/app.js','main.py','Main.java'])
      assert((await page.locator('#kiFiles').innerText()).includes(file),'missing mapped file '+file);
    assert.equal(await page.locator('#kiApply').isEnabled(),true);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#kiApply').click();
    await page.waitForFunction(old=>S.p&&S.p.name!==old,aiBefore.name,{timeout:12000});
    const aiAfter=await page.evaluate(async oldName=>{
      const old=await projLesen(oldName),current=S.p;
      return {newName:current.name,originalName:old.name,hasOriginal:old.dateien['index.html']!==undefined,
        originalUnchanged:JSON.stringify(old.dateien),html:current.dateien['index.html'],css:current.dateien['css/style.css'],
        javascript:current.dateien['js/app.js'],python:current.dateien['main.py'],java:current.dateien['Main.java']};
    },aiBefore.name);
    assert.notEqual(aiAfter.newName,aiAfter.originalName);
    assert.match(aiAfter.html,/id="kiTest"/);
    assert.equal(aiAfter.css,'body { color: #222; }\n');
    assert.match(aiAfter.javascript,/JS-Code erkannt/);
    assert.match(aiAfter.python,/Python erkannt/);
    assert.match(aiAfter.java,/public class Main/);
    assert(!aiAfter.javascript.includes('Die Erklärung'),'Erklärungstext darf nicht als Code gespeichert werden');
    // Saving an independent copy must leave all prior files intact.
    assert.equal(aiAfter.originalUnchanged,aiBefore.files,'Originalprojekt darf nicht verändert werden');
    assert.equal(await page.locator('#kiOverlay').isVisible(),false);
    assert.equal(await page.locator('#vorschau').isVisible(),false,'KI-Code darf nicht automatisch starten');
    page.once('dialog',dialog=>dialog.accept()); // Explicit consent to execute untrusted AI code.
    await page.locator('#starten').click();
    assert.equal(await page.locator('#starten').count(),1);
    await page.locator('#vorschau').waitFor({state:'visible',timeout:12000}); // Preview saves before opening.
    assert.equal(await page.locator('#vorschau').isVisible(),true,'Ausführen öffnet die Vorschau');
    assert.equal((await page.locator('#frame').getAttribute('sandbox')).includes('allow-same-origin'),false,'KI-Vorschau isoliert');

    assert.equal(errors.length,0,'Browser-JavaScript-Fehler: '+errors.join(' | '));
    console.log('Chromium: Studio geladen, Projekterkennung und Dateiprüfung funktionieren.');
  } finally {
    if(browser) await browser.close();
    server.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
