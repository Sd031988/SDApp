'use strict';
async function openKI(page,tab){
 if(!await page.locator('#kiOverlay').isVisible())await page.locator('#kiBtn').click();
 await page.locator('#'+tab).click();
}

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
    await page.goto('http://127.0.0.1:8765/studio/index.html?projekt=meine-webseite', {waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForTimeout(1200);
    assert.match(await page.title(), /Code-Studio/);
    // Regression: new AI buttons must never push ▶ Ausführen outside of the screen.
    await page.locator('#app').waitFor({state:'visible',timeout:15000});
    // Code review: no source is sent; a critical secret blocks BOTH import buttons.
    const codeReviewChecks = await page.evaluate(()=>{
      const engine=window.SDKICodeReview;
      const one=engine.review([{path:'app.js',content:'eval(userInput);'}],{});
      const blocked=engine.review([{path:'app.js',content:'const token="ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ12345";'}],{});
      return {found:one.findings.some(f=>f.rule==='dynamic-code'),
        blocked:blocked.blocked,exposed:JSON.stringify(blocked.findings).includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ12345')};
    });
    assert.equal(codeReviewChecks.found,true);
    assert.equal(codeReviewChecks.blocked,true);
    assert.equal(codeReviewChecks.exposed,false);
    await openKI(page,'kiCodeBtn');
    await page.locator('#kiResult').fill(['### Datei: app.js','~~~javascript',
      'const token="ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ12345";','~~~'].join('\n'));
    await page.locator('#kiAnalyse').click();
    assert.equal(await page.locator('#kiReview').isVisible(),true);
    assert.match(await page.locator('#kiReviewSummary').innerText(),/gesperrt/);
    assert.equal(await page.locator('#kiDirect').isEnabled(),false);
    assert.equal(await page.locator('#kiApply').isEnabled(),false);
    await page.locator('#kiClose').click();

    // Repair suggestions are stage-only: old/new code compared, no implicit project writes.
    await openKI(page,'kiCodeBtn');
    await page.locator('#kiResult').fill([
      '### Datei: index.html','~~~html',
      '<a href="/help" target="_blank">Hilfe</a>','~~~'
    ].join('\n'));
    await page.locator('#kiAnalyse').click();
    assert.equal(await page.locator('#kiRepairPrepare').isEnabled(),true);
    await page.locator('#kiRepairPrepare').click();
    assert.match(await page.locator('#kiRepairStatus').innerText(),/1 sichere/);
    assert.equal(await page.locator('#kiRepairStage').isEnabled(),true);
    assert.match(await page.locator('.kiRepairAfter').innerText(),/noopener noreferrer/);
    await page.locator('#kiRepairStage').click();
    assert.match(await page.locator('#kiDiffNew').innerText(),/noopener noreferrer/);
    assert.equal(await page.locator('#kiDiff').isVisible(),true);
    // The import remains a separate, explicitly confirmed action.
    await page.locator('#kiDiffClose').click();
    await page.locator('#kiClose').click();
    await openKI(page,'kiCodeBtn');
    await page.locator('#kiResult').fill([
      '### Datei: app.js','~~~javascript','eval(userCode);','~~~'
    ].join('\n'));
    await page.locator('#kiAnalyse').click();
    await page.locator('#kiRepairPrepare').click();
    assert.equal(await page.locator('#kiRepairStage').isEnabled(),false);
    assert.equal(await page.locator('#kiRepairCopy').isEnabled(),true);
    assert.match(await page.locator('#kiRepairProposals').innerText(),/manuell prüfen/);
    await page.locator('#kiClose').click();

    // ECC-inspired review stays read-only and is accessible as a real dialog.
    await openKI(page,'kiCheckTab');
    await page.locator('#agentReviewBtn').click();
    assert.equal(await page.locator('#agentReviewOverlay').isVisible(),true);
    assert.match(await page.locator('#agentReviewSummary').innerText(),/Dateien/);
    assert.match(await page.locator('#agentReviewNote').innerText(),/keine Tests gestartet/);
    await page.locator('#agentReviewGoal').fill('Repariere Login und Layout');
    await page.locator('#agentReviewPlan').click();
    assert.match(await page.locator('#agentReviewTaskStatus').innerText(),/erkannte Dateiverknüpfungen/);
    assert(await page.locator('#agentReviewTargets li').count()>0);
    assert(await page.locator('#agentReviewCapabilities li').count()>=5);
    assert.match(await page.locator('#agentReviewImpactNote').innerText(),/statische Abschätzung/);
    assert.equal(await page.locator('#agentReviewHandoff').isEnabled(),true);
    await page.locator('#agentReviewHandoff').click();
    assert.equal(await page.locator('#kiOverlay').isVisible(),true);
    assert.equal(await page.locator('#kiGoal').inputValue(),'Repariere Login und Layout');
    assert.equal(await page.locator('#kiChangeConsent').isChecked(),false);
    await page.locator('#kiClose').click();
    await openKI(page,'kiCheckTab');
    await page.locator('#agentReviewBtn').click();
    await page.locator('#agentReviewAgain').click();
    assert.equal(await page.locator('#agentReviewCopy').isEnabled(),true);
    await page.locator('#agentReviewClose').click();
    assert.equal(await page.locator('#agentReviewOverlay').isVisible(),false);
    await page.locator('#kiClose').click();

    for (const width of [1600,1280,1080,1024,900,801,800,600,390,320]) {
      await page.setViewportSize({width,height:800});
      const metrics=await page.evaluate(()=>{
        const run=document.querySelector('#starten'),more=document.querySelector('#kopfMehr');
        const toolbar=document.querySelector('#kopfWerkzeuge');
        const r=run.getBoundingClientRect(),m=more.getBoundingClientRect();
        const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return {run:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},
          more:{left:m.left,right:m.right,width:m.width},
          hit:hit?.closest('#starten')===run,
          display:getComputedStyle(run).display,screen:document.documentElement.clientWidth,
          toolsWidth:toolbar.clientWidth,toolsScrollWidth:toolbar.scrollWidth};
      });
      assert(metrics.run.width>=(width<820?50:70)&&metrics.run.height>=30,'Run button is not properly sized at '+width);
      assert(metrics.run.left>=-1&&metrics.run.right<=metrics.screen+1,
        'Run button outside screen at '+width+': '+JSON.stringify(metrics));
      if(width>=820) assert(metrics.more.left>=-1&&metrics.more.right<=metrics.screen+1,'More menu outside screen at '+width);
      assert.equal(metrics.hit,true,'Run button must remain clickable at '+width);
      assert.notEqual(metrics.display,'none','Run button hidden at '+width);
      assert(metrics.toolsScrollWidth<=metrics.toolsWidth+1,'Compact toolbar fits at '+width);
    }
    await page.setViewportSize({width:1080,height:800});
    await page.locator('#kopfMehr').click();
    assert.match(await page.locator('#mehrMenu').innerText(),/App-Builder/,'More menu contains building tools');
    await page.keyboard.press('Escape');
    await page.setViewportSize({width:1280,height:900});

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
    // One fenced block pasted into the editor must open the code-only importer.
    const intercepted=await page.evaluate(()=>{
      const tick=String.fromCharCode(96).repeat(3);
      const before=S.aktiv;
      const single=abIstAnleitung(tick+'python\nprint(1)\n'+tick);
      const mixed=abIstAnleitung('Hier ist die Lösung:\n'+tick+'html\n<h1>Hallo</h1>\n'+tick+'\n'+tick+'js\nconsole.log(1)\n'+tick);
      S.aktiv='README.md';
      const markdown=abIstAnleitung(tick+'python\nprint(1)\n'+tick);
      S.aktiv=before;
      return {single,mixed,markdown};
    });
    assert.deepEqual(intercepted,{single:true,mixed:true,markdown:false});
    // KI Coding: real browser flow, review, copy creation, then existing ▶ execute.
    await page.locator('#efZu').click(); // Close earlier Import dialog.
    assert.equal(await page.locator('#kiCodeBtn').count(),1,'KI Coding button visible');
    await openKI(page,'kiCodeBtn');
    assert.equal(await page.locator('#kiOverlay').isVisible(),true);
    await page.locator('#kiGoal').fill('Erstelle eine kleine Webseite mit Überschrift.');
    await page.locator('#kiClose').click();
    await page.locator('#projektMenuBtn').click();
    await page.locator('#einfuegenBtn').click();
    assert.equal(await page.locator('#einfuegen').isVisible(),true,'Standard import dialog opens');
    const aiBefore=await page.evaluate(()=>({name:S.p.name,files:JSON.stringify(S.p.dateien)}));
    const ticks=String.fromCharCode(96).repeat(3);
    const aiAnswer=[
      'Hier sind alle Dateien für dein Projekt.',
      '### Datei: index.html',ticks+'html',
      '<!doctype html><html lang="de"><head><title>KI Test</title><link href="css/style.css" rel="stylesheet"></head><body><h1 id="kiTest">Funktioniert</h1><script src="js/app.js"></script></body></html>',ticks,
      'Die Erklärung für CSS wird nicht übernommen.',
      '### Datei: css/style.css',ticks+'css','body { color: #222; }',ticks,
      '### Datei: js/app.js',ticks+'javascript','window.__kiJavaScriptLaeuft = true; console.log("JS-Code erkannt")',ticks,
      'Jetzt kommt ein Python-Programm.',ticks+'python','print("Python erkannt")',ticks,
      'Jetzt kommt ein Java-Programm.',ticks+'java','public class Main { public static void main(String[] args) {} }',ticks,
      'Dies ist nur eine abschließende Erklärung.'
    ].join('\n');
    await page.locator('#efText').fill(aiAnswer);
    assert.match(await page.locator('#efVorschau').innerText(),/5 Datei/,'Standard import must recognize all code languages');
    assert.match(await page.locator('#efLos').innerText(),/KI-Dateien prüfen/,'Standard import offers safe AI review');
    await page.locator('#efLos').click();
    assert.equal(await page.locator('#einfuegen').isVisible(),false);
    assert.equal(await page.locator('#kiOverlay').isVisible(),true,'Standard import routes to shared AI review');
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

    // Regression: even if a Service Worker is ready, the sandboxed AI iframe must
    // show the stored files, not navigate to a GitHub Pages 404 URL.
    assert.equal(await page.locator('#frame').getAttribute('src'),null,'KI-Vorschau must not navigate to a GitHub URL');
    const previewHtml=await page.locator('#frame').getAttribute('srcdoc');
    assert.match(previewHtml,/id="kiTest"/,'HTML comes from the imported project');
    assert.match(previewHtml,/body \{ color: #222; \}/,'CSS is bundled into the preview');
    assert.match(previewHtml,/__kiJavaScriptLaeuft/,'JavaScript is bundled into the preview');
    await page.frameLocator('#frame').locator('#kiTest').waitFor({state:'visible',timeout:12000});
    const rendered=await page.frameLocator('#frame').locator('body').evaluate(el=>({
      text:el.innerText, css:getComputedStyle(el).color, js:window.__kiJavaScriptLaeuft===true
    }));
    assert.match(rendered.text,/Funktioniert/,'Preview must render the actual web page rather than 404');
    assert.equal(rendered.css,'rgb(34, 34, 34)','Imported stylesheet must apply');
    assert.equal(rendered.js,true,'Imported JavaScript must execute after explicit Run');



    // Direct import: update current project, keep a version backup and open index.html in the actual editor.
    const directBefore=await page.evaluate(()=>({name:S.p.name,html:S.p.dateien['index.html'],versionCount:S.p.versionen.length}));
    const directAnswer=[
      'KI-Erklärung vor dem Code',
      '### Datei: index.html',ticks+'html','<!doctype html><html><head><link rel="stylesheet" href="css/style.css"></head><body><h1 id="direkt">Direkt im Editor</h1><script src="js/app.js"></script></body></html>',ticks,
      '### Datei: css/style.css',ticks+'css','body { color: navy; }',ticks,
      '### Datei: js/app.js',ticks+'javascript','console.log("Direktimport")',ticks,
      '### Datei: main.py',ticks+'python','print("Direct Python")',ticks,
      'Diese Erklärung darf nicht in die Dateien.'
    ].join('\n');
    await openKI(page,'kiCodeBtn');
    await page.locator('#kiResult').fill(directAnswer);
    await page.locator('#kiAnalyse').click();
    assert.equal(await page.locator('#kiDirect').isEnabled(),true,'Direkt-import button enabled for recognized code');
    assert.equal(await page.locator('#kiFiles .kiFile').count(),4,'All recognized code files listed');
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#kiDirect').click();
    await page.waitForFunction(()=>document.querySelector('#kiOverlay').hidden,{timeout:10000});
    const directAfter=await page.evaluate(async()=>({
      name:S.p.name,html:S.p.dateien['index.html'],python:S.p.dateien['main.py'],
      css:S.p.dateien['css/style.css'],js:S.p.dateien['js/app.js'],active:S.aktiv,tabs:[...S.tabs],
      backup:S.p.versionen[0]?.dateien['index.html'],versionCount:S.p.versionen.length,
      saved:(await projLesen(S.p.name)).dateien['index.html'],editor:S.cm?.getValue?.()||S.ta?.value,
      previewHidden:document.querySelector('#vorschau').hidden,sandbox:document.querySelector('#frame').getAttribute('sandbox')
    }));
    assert.equal(directAfter.name,directBefore.name,'Direct mode must not create a separate project');
    assert.match(directAfter.html,/id="direkt"/);
    assert.match(directAfter.python,/Direct Python/);
    assert.match(directAfter.css,/navy/);
    assert.match(directAfter.js,/Direktimport/);
    assert.equal(directAfter.saved,directAfter.html,'New code persists in active project');
    assert.equal(directAfter.editor,directAfter.html,'Actual CodeMirror editor shows the new HTML');
    assert.equal(directAfter.active,'index.html','Direct import must activate index.html');
    assert(directAfter.tabs.includes('main.py'),'Other languages must be available as editor tabs');
    assert.equal(directAfter.backup,directBefore.html,'Previous HTML was saved as recoverable version');
    assert.equal(directAfter.versionCount,directBefore.versionCount+1,'Exactly one backup version created');
    assert.equal(directAfter.previewHidden,true,'Direct import cannot run code on its own');
    assert.equal(directAfter.sandbox.includes('allow-same-origin'),false,'AI-imported code must remain sandboxed');

    // When all files are already present, a single button should just open the editor (also on mobile).
    await page.setViewportSize({width:390,height:844});
    // Compact mobile toolbar puts secondary AI actions in the accessible More menu.
    await page.locator('#kiBtn').click();
    await page.locator('#kiResult').fill(directAnswer);
    await page.locator('#kiAnalyse').click();
    await page.locator('#kiDirect').click(); // No overwrite dialog necessary for identical content.
    await page.waitForFunction(()=>document.querySelector('#kiOverlay').hidden,{timeout:10000});
    const mobileDirect=await page.evaluate(()=>({view:document.querySelector('#app').dataset.ansicht,active:S.aktiv,versions:S.p.versionen.length}));
    assert.equal(mobileDirect.view,'code','On mobile the code view opens after direct import');
    assert.equal(mobileDirect.active,'index.html');
    assert.equal(mobileDirect.versions,directAfter.versionCount,'Identical code must not create another backup');

    // Read-only diagnostics: detect missing files during editing and stage KI fixes.
    await page.setViewportSize({width:1280,height:900});
    await page.evaluate(() => {
      dateiOeffnen('index.html');
      const cm=S.cm;
      const end=cm.lastLine();
      cm.replaceRange('\n<script src="missing-diagnose-file.js"></script>',{line:end,ch:cm.getLine(end).length},undefined,'+input');
    });
    await page.waitForFunction(()=>S.problemeAnalyse.some(x=>/missing-diagnose-file.js/.test(x.text)),{timeout:12000});
    await page.locator('#diagnoseBtn').click();
    assert.equal(await page.locator('#unten [data-feld="probleme"]').isVisible(),true,'Diagnostics panel opens');
    const diagText=await page.locator('#problemListe').innerText();
    assert.match(diagText,/missing-diagnose-file.js/,'Newly edited broken reference is recognized');
    assert.equal(await page.locator('#diagnoseKI').isEnabled(),true);
    await page.locator('#diagnoseKI').click();
    assert.equal(await page.locator('#kiOverlay').isVisible(),true,'Repair action opens safe KI workflow');
    assert.match(await page.locator('#kiGoal').inputValue(),/missing-diagnose-file.js/);
    assert.equal(await page.locator('#kiInclude').isChecked(),false,'No source files shared by default');
    assert.equal(await page.locator('#kiResult').inputValue(),'','No automatic AI code injected');
    await page.locator('#kiClose').click();

    // Runtime diagnostics must travel from the isolated srcdoc iframe back to the Studio.
    await page.setViewportSize({width:1280,height:900});
    await page.evaluate(async () => {
      const source = 'console.log("BRIDGE_KONSOLE_OK");\nconsole.error("BRIDGE_FEHLER_KONSOLE");\nthrow new Error("KONTROLLIERTER_TESTLAUFZEITFEHLER");';
      S.p.dateien['js/app.js'] = source;
      delete S.docs['js/app.js'];
      await projSchreiben(S.p);
      dateiOeffnen('index.html');
    });
    page.once('dialog', dialog=>dialog.accept());
    await page.locator('#starten').click();
    await page.waitForFunction(() =>
      S.problemeVorschau.some(p => p.text.includes('KONTROLLIERTER_TESTLAUFZEITFEHLER')),
      {timeout:12000});
    const bridgeResult=await page.evaluate(() => ({
      sandbox:document.querySelector('#frame').getAttribute('sandbox'),
      frameSrc:document.querySelector('#frame').getAttribute('src'),
      log:S.konsole.some(m=>m.text.includes('BRIDGE_KONSOLE_OK')),
      errorLog:S.konsole.some(m=>m.text.includes('BRIDGE_FEHLER_KONSOLE')),
      runtime:S.problemeVorschau.find(p=>p.text.includes('KONTROLLIERTER_TESTLAUFZEITFEHLER')),
      diagnosticsVisible:document.querySelector('#problemListe').textContent.includes('KONTROLLIERTER_TESTLAUFZEITFEHLER')
    }));
    assert.equal(bridgeResult.frameSrc,null,'The AI preview must not navigate to GitHub Pages');
    assert(!bridgeResult.sandbox.includes('allow-same-origin'),'Sandboxed source code never receives Studio origin');
    assert.equal(bridgeResult.log,true,'Console output arrives in Studio');
    assert.equal(bridgeResult.errorLog,true,'console.error arrives in Studio');
    assert.equal(bridgeResult.diagnosticsVisible,true,'Uncaught errors are shown in the diagnosis panel');
    assert.equal(bridgeResult.runtime.datei,'js/app.js','Diagnostics should identify the imported JS file');
    assert(bridgeResult.runtime.zeile>=1,'Diagnostics should identify a line number');
    // Uncaught exception is intentionally created by this smoke test.
    const unexpectedErrors=errors.filter(e=>!e.includes('KONTROLLIERTER_TESTLAUFZEITFEHLER'));
    assert.equal(unexpectedErrors.length,0,'Unexpected browser errors: '+unexpectedErrors.join(' | '));


    // End-to-end change request: write a modification in Studio, approve only necessary
    // source files, inspect the complete AI prompt, paste one edited file and keep the others.
    const changeBefore=await page.evaluate(()=>({
      project:S.p.name,
      html:S.p.dateien["index.html"],
      js:S.p.dateien["js/app.js"],
      versions:S.p.versionen.length
    }));
    await openKI(page,'kiChangeBtn');
    assert.equal(await page.locator('#kiOverlay').isVisible(),true);
    assert.equal(await page.locator('#kiChangeBox').isVisible(),true);
    await page.locator('#kiGoal').fill('Füge einen Drucken-Knopf hinzu, alles andere behalten');
    assert.equal(await page.locator('#kiChangeConsent').isChecked(),false,'No automatic sharing of project source');
    const recommended=await page.locator('#kiSources input:checked').evaluateAll(nodes=>nodes.map(el=>el.dataset.path));
    for(const p of ['index.html','css/style.css','js/app.js'])assert(recommended.includes(p),'Missing linked file: '+p);
    assert(!recommended.includes('main.py'),'Unrelated Python source must not be shared');
    await page.locator('#kiPromptPreview').click();
    assert.match(await page.locator('#kiStatus').innerText(),/ausdrücklich|bestätigen/,'Explicit consent required for prompt content');
    await page.locator('#kiChangeConsent').check();
    await page.locator('#kiPromptPreview').click();
    const changePrompt=await page.locator('#kiClipboard').inputValue();
    assert.match(changePrompt,/Füge einen Drucken-Knopf hinzu/);
    assert(changePrompt.includes(changeBefore.html),'The complete current HTML must be included');
    assert(changePrompt.includes(changeBefore.js),'The current JS file must be included');
    assert(!changePrompt.includes('print("Direct Python")'),'Unrelated Python code must not be in prompt');
    await page.locator('#kiSources input[data-path="css/style.css"]').uncheck();
    assert.equal(await page.locator('#kiChangeConsent').isChecked(),false,'Changing file selection must reset consent');
    await page.locator('#kiChangeConsent').check();
    await page.locator('#kiPromptPreview').click();
    assert(!(await page.locator('#kiClipboard').inputValue()).includes('body { color: navy; }'),'Deselected CSS content must stay private');
    const changedHtml=changeBefore.html.replace('Direkt im Editor','Geändert vom Assistenten');
    assert.notEqual(changedHtml,changeBefore.html);
    await page.locator('#kiResult').fill('### Datei: index.html\n'+ticks+'html\n'+changedHtml+'\n'+ticks);
    await page.locator('#kiAnalyse').click();
    assert.equal(await page.locator('#kiFiles .kiFile').count(),1,'Only requested updated file is imported');
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#kiDirect').click();
    await page.waitForFunction(()=>document.querySelector('#kiOverlay').hidden,{timeout:12000});
    const changeAfter=await page.evaluate(()=>({
      project:S.p.name,html:S.p.dateien['index.html'],js:S.p.dateien['js/app.js'],
      versions:S.p.versionen.length,backup:S.p.versionen[0]?.dateien['index.html'],
      active:S.aktiv
    }));
    assert.equal(changeAfter.project,changeBefore.project,'Changes happen in the open project');
    assert.equal(changeAfter.backup,changeBefore.html,'Previous version saved before changing source');
    assert.equal(changeAfter.versions,changeBefore.versions+1);
    assert.equal(changeAfter.js,changeBefore.js,'Unchanged JS remains intact');
    assert.equal(changeAfter.active,'index.html');
    assert.match(changeAfter.html,/Geändert vom Assistenten/);

    // Google KI guest-first area: no provider credentials, direct official links,
    // and safe copy-only preparation for use without a ChatGPT/Gemini account.
    await page.setViewportSize({width:1280,height:900});
    assert.equal(await page.locator('#kiServicesBtn').count(),1,'Guest-first Google KI navigation exists');
    await openKI(page,'kiCodeBtn');
    await page.locator('#kiServicesBtn').click();
    assert.equal(await page.locator('#kiServicesOverlay').isVisible(),true);
    assert.match(await page.locator('#kiServicesOverlay').innerText(),/ohne Registrierung/);
    assert.match(await page.locator('#kiServicesOverlay').innerText(),/hängt jedoch von Land, Gerät und Funktion ab/);
    assert.equal(await page.locator('#kiServicesGoogle').getAttribute('href'),'https://www.google.com/ai');
    assert.equal(await page.locator('#kiServicesGoogle').getAttribute('target'),'_blank');
    assert.equal(await page.locator('#kiServicesGoogle').getAttribute('rel'),'noopener noreferrer');
    assert.equal(await page.locator('#kiServicesOverlay input[type="password"]').count(),0,'Studio never collects provider passwords');
    await page.evaluate(()=>{
      Object.defineProperty(navigator,'clipboard',{
        configurable:true,
        value:{writeText:async value=>{window.__googleGuestCopied=String(value)}}
      });
    });
    await page.locator('#kiServicesQuestion').fill('Ergänze einen Quittungsdruck-Knopf');
    await page.locator('#kiServicesCopy').click();
    const guestPrompt=await page.evaluate(()=>window.__googleGuestCopied);
    assert.match(guestPrompt,/Ergänze einen Quittungsdruck-Knopf/);
    assert.match(guestPrompt,/### Datei: relativer\/pfad.ext/,'Google prompt uses supported studio import format');
    assert(!guestPrompt.includes('Geändert vom Assistenten'),'Existing project source must never be shared automatically');
    assert.equal(await page.locator('#kiServicesClipboard').isVisible(),false);
    await page.locator('#kiServicesCode').click();
    assert.equal(await page.locator('#kiServicesOverlay').isVisible(),false);
    assert.equal(await page.locator('#kiOverlay').isVisible(),true,'Guest Google code can be reimported');
    await page.locator('#kiClose').click();
    await openKI(page,'kiCodeBtn');
    await page.locator('#kiServicesBtn').click();
    await page.locator('#kiServicesChange').click();
    assert.equal(await page.locator('#kiChangeBox').isVisible(),true,'Google answer can update existing project after file approval');
    assert.equal(await page.locator('#kiChangeConsent').isChecked(),false);
    await page.locator('#kiClose').click();
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>handyMehr());
    assert.match(await page.locator('#palListe').innerText(),/Google KI ohne Konto/);
    await page.keyboard.press('Escape');

    // AI comparison: side-by-side old/new code, with no writes until explicitly confirmed.
    await page.setViewportSize({width:1280,height:900});
    await openKI(page,'kiCodeBtn');
    const beforeDiff=await page.evaluate(()=>({html:S.p.dateien['index.html'],versionCount:S.p.versionen.length}));
    await page.locator('#kiResult').fill('### Datei: index.html\n'+ticks+'html\n<!doctype html><title>Vergleich</title><h1>Vorschau statt Speichern</h1>\n'+ticks);
    await page.locator('#kiAnalyse').click();
    await page.locator('#kiFiles .kiDiffShow').click();
    assert.equal(await page.locator('#kiDiff').isVisible(),true,'Code comparison dialog should open');
    assert.match(await page.locator('#kiDiffOld').innerText(),/Geändert vom Assistenten/);
    assert.match(await page.locator('#kiDiffNew').innerText(),/Vorschau statt Speichern/);
    assert.equal((await page.evaluate(()=>S.p.dateien['index.html'])),beforeDiff.html,'Comparison must never modify code');
    await page.locator('#kiDiffClose').click();
    assert.equal(await page.locator('#kiDiff').isVisible(),false);
    await page.locator('#kiClose').click();
    assert.equal((await page.evaluate(()=>S.p.versionen.length)),beforeDiff.versionCount,'Comparison must not create backups');

    // Visual text mode: double-click real rendered text and save with a version snapshot.
    await page.evaluate(async ()=>{
      S.p.dateien['js/app.js']='console.log("visual test");';
      delete S.docs['js/app.js'];
      await projSchreiben(S.p);
      dateiOeffnen('index.html');
    });
    page.once('dialog',d=>d.accept());
    await page.locator('#starten').click();
    await page.locator('#vorschau').waitFor({state:'visible',timeout:12000});
    const visualBefore=await page.evaluate(()=>({source:S.p.dateien['index.html'],versions:S.p.versionen.length}));
    await page.locator('#visTextBtn').click();
    await page.frameLocator('#frame').locator('#direkt').waitFor({state:'visible',timeout:12000});
    page.once('dialog',d=>d.accept('Visuell erfolgreich geändert'));
    await page.frameLocator('#frame').locator('#direkt').dblclick();
    await page.waitForFunction(()=>S.p.dateien['index.html'].includes('Visuell erfolgreich geändert'),{timeout:12000});
    const visualAfter=await page.evaluate(()=>({
      source:S.p.dateien['index.html'],versions:S.p.versionen.length,
      saved:S.p.versionen[0]?.dateien['index.html'],
      sandbox:document.querySelector('#frame').getAttribute('sandbox')
    }));
    assert.equal(visualAfter.saved,visualBefore.source,'Visual edits need a rollback snapshot');
    assert.equal(visualAfter.versions,visualBefore.versions+1);
    assert(!visualAfter.sandbox.includes('allow-same-origin'),'Text editor must use an isolated iframe');
    await page.locator('#visTextBtn').click();

    // Native module import preview must work for local dependencies without a bundler.
    await page.evaluate(async ()=>{
      S.p.dateien['index.html']='<!doctype html><html><body><h1 id="moduleReady">Module</h1><script type="module" src="js/module-entry.mjs"></script></body></html>';
      S.p.dateien['js/module-entry.mjs']='import {answer} from "./module-helper.mjs"; document.body.dataset.answer=answer;';
      S.p.dateien['js/module-helper.mjs']='export const answer=42;';
      delete S.docs['index.html'];
      await projSchreiben(S.p);
      dateiOeffnen('index.html');
    });
    page.once('dialog',d=>d.accept());
    await page.locator('#starten').click();
    await page.frameLocator('#frame').locator('#moduleReady').waitFor({state:'visible',timeout:12000});
    await page.waitForFunction(()=>{
      const frame=document.querySelector('#frame');
      try{return !!frame&&frame.contentDocument?.body.dataset.answer==='42'}catch(_){return false}
    },{timeout:3000}).catch(()=>{});
    // Opaque-origin sandbox cannot be inspected from the Studio parent.
    await page.frameLocator('#frame').locator('body[data-answer="42"]').waitFor({state:'visible',timeout:12000});
    assert.equal(await page.frameLocator('#frame').locator('body').getAttribute('data-answer'),'42');

    // Publication preflight must refuse broken links and private key files.
    const report=await page.evaluate(()=>qualitaetBericht({
      'index.html':'<script src="missing.js"></script>',
      '.env':'API_KEY=private',
      'secret.pem':'-----BEGIN PRIVATE KEY-----'
    }));
    assert(report.fails.some(x=>x.kind==='asset'));
    assert(report.fails.some(x=>x.kind==='secret'));

    // Browser-extension hand-off: only user-selected text is offered to the
    // existing reviewed KI import; never run, overwrite or publish automatically.
    await page.setViewportSize({width:1280,height:900});
    const bridgeBefore=await page.evaluate(()=>({
      files:JSON.stringify(S.p.dateien),versions:S.p.versionen.length,project:S.p.name
    }));
    await page.evaluate(()=>{
      const fence=String.fromCharCode(96).repeat(3);
      window.__sdBridgeAck=null;
      window.addEventListener('message',e=>{
        if(e.data?.type==='SD_STUDIO_SELECTED_CHAT_ACK')window.__sdBridgeAck=e.data.nonce;
      });
      window.postMessage({type:'SD_STUDIO_SELECTED_CHAT_TEXT',version:1,
        nonce:'d4f6c1ae-69da-43ee-9123-09951d20f655',provider:'chatgpt',
        text:'### Datei: index.html\n'+fence+'html\n<!doctype html><h1>ChatGPT-Auswahl</h1>\n'+fence
      },location.origin);
    });
    await page.waitForFunction(()=>window.__sdBridgeAck==='d4f6c1ae-69da-43ee-9123-09951d20f655',{timeout:12000});
    assert.equal(await page.locator('#kiOverlay').isVisible(),true,'ChatGPT selected answer opens code review');
    assert.match(await page.locator('#kiResult').inputValue(),/ChatGPT-Auswahl/);
    assert.equal(await page.locator('#kiFiles .kiFile').count(),1,'ChatGPT code parsed into a single file');
    assert.equal(await page.locator('#kiDirect').isEnabled(),true);
    assert.match(await page.locator('#kiStatus').innerText(),/ChatGPT-Auswahl angekommen/);
    assert.equal(await page.locator('.kiBridgeHint a').getAttribute('href'),'./chatgpt-bruecke.html');
    const bridgeAfter=await page.evaluate(()=>({
      files:JSON.stringify(S.p.dateien),versions:S.p.versionen.length,project:S.p.name
    }));
    assert.deepEqual(bridgeAfter,bridgeBefore,'Receiving ChatGPT text cannot alter projects');
    await page.locator('#kiClose').click();
    await page.evaluate(()=>window.postMessage({type:'SD_STUDIO_SELECTED_CHAT_TEXT',version:1,
      nonce:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',provider:'untrusted',
      text:'### Datei: index.html'},location.origin));
    assert.equal(await page.locator('#kiOverlay').isVisible(),false,'Unknown providers are ignored');

    // Installation page creates a real ZIP in the browser, not a server upload.
    await page.goto('http://127.0.0.1:8765/studio/chatgpt-bruecke.html',{waitUntil:'domcontentloaded'});
    assert.match(await page.title(),/ChatGPT.*SD Code-Studio/);
    const downloading=page.waitForEvent('download',{timeout:15000});
    await page.locator('#download').click();
    const downloaded=await downloading;
    assert.equal(downloaded.suggestedFilename(),'SD-Code-Studio-ChatGPT-Bruecke.zip');
    assert.match(await page.locator('#status').innerText(),/ZIP erstellt/);
    const downloadedFile=require('node:fs').readFileSync(await downloaded.path());
    assert.equal(downloadedFile.readUInt32LE(0),0x04034b50,'Downloaded extension ZIP must have a valid local file header');
    assert(downloadedFile.length>2000);

    console.log('Chromium: Studio geladen, Projekterkennung und Dateiprüfung funktionieren.');
  } finally {
    if(browser) await browser.close();
    server.kill();
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
