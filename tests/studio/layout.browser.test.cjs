'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const baseline=require('./commands-baseline.json'); // All 51 commands in main e60be4a; no synthetic entries.
const projectGroups={
 'Projekt':['Neues Projekt','Projekt wechseln','Umbenennen','Duplizieren'],
 'Hinein & heraus':['Dateien hochladen','Ordner hochladen','ZIP hochladen','Anleitung oder Code','GitHub importieren','Als ZIP','Als eine HTML-Datei','Cloud-Backup'],
 'Teilen':['Online stellen','Meine Seiten online','Offline nehmen','Auf meinem PC ausführen'],
 'Sicherheit':['Versionen','Projekt löschen']
};
const moreGroups={
 'Bauen & veröffentlichen':['App-Builder','Desktop-App','Framework-Projekt','Export-Assistent'],
 'Gestalten':['Visueller Designer','Design','JPEG-XL-Assets'],
 'Lernen':['Lernmodus','Lernaufgabe prüfen','Lernfortschritt','Teilnahmezertifikat'],
 'Ansicht':['Farbthema','Schrift größer','Schrift kleiner','Zeilenumbruch','Fokus-Modus','Tastenkürzel','Befehle']
};
(async()=>{
 const root=process.cwd();
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  });
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/studio/index.html';
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  for(const width of [1300,390]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{if(!localStorage.getItem('sdStudioEinst'))localStorage.setItem('sdStudioEinst',JSON.stringify({konfetti:false}))});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.locator('#studioStart').waitFor({state:'visible'});
   fs.mkdirSync('studio-layout-artifacts',{recursive:true});
   await page.screenshot({path:'studio-layout-artifacts/start-'+width+'.png'});
   assert.equal(await page.locator('.startKarten>*').count(),5);
   assert(await page.locator('#letzteProjekte button').count()<=5);
   await page.getByRole('button',{name:'Zum geöffneten Projekt',exact:true}).click();
   await page.screenshot({path:'studio-layout-artifacts/editor-'+width+'.png'});
   // Five desktop actions; the explicitly requested compact mobile layout has three.
   assert.equal(await page.locator('#kopf button:visible').count(),width<820?3:5);
   for(const [trigger,menu,groups] of [['projektMenuBtn','projektMenu',projectGroups],['kopfMehr','mehrMenu',moreGroups]]){
    if(width<820&&trigger==='kopfMehr'){
     await page.locator('#handyNav [data-a="werkzeuge"]').click();
     await page.locator('[data-feld="werkzeuge"] [data-studio-action="mehr"]').click();
    }else await page.locator('#'+trigger).click();
    assert.equal(await page.locator('#'+trigger).getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#'+trigger).getAttribute('aria-haspopup'),'menu');
    for(const [label,items] of Object.entries(groups)){
     const text=await page.locator('#'+menu+' [role="group"][aria-label="'+label+'"]').innerText();
     for(const item of items)assert(text.includes(item),label+' missing '+item);
    }
    const first=await page.evaluate(()=>document.activeElement.id||document.activeElement.textContent);
    await page.keyboard.press('ArrowDown');
    assert.notEqual(await page.evaluate(()=>document.activeElement.id||document.activeElement.textContent),first);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#'+menu).isVisible(),false);
   }
   await page.locator('#projektMenuBtn').click();await page.locator('#kopf').click({position:{x:2,y:2}});assert.equal(await page.locator('#projektMenu').isVisible(),false);
   await page.locator('#kiBtn').click();
   await page.screenshot({path:'studio-layout-artifacts/ki-'+width+'.png'});
   assert.equal(await page.locator('#kiTabs [role="tab"]').count(),3);
   assert.equal(await page.locator('#kiOverlay [role="dialog"]').count(),1,'One AI window; services and review are inline regions');
   for(const [id,label] of [['kiCodeBtn','Neues Programm'],['kiChangeBtn','Projekt ändern'],['kiCheckTab','Prüfen & reparieren']]){
    await page.locator('#'+id).click();assert.equal(await page.locator('#'+id).getAttribute('aria-selected'),'true');assert.equal(await page.locator('#'+id).innerText(),label);
   }
   assert.equal(await page.locator('#kiNeu').isVisible(),false,'Repair tab cannot create a new empty project');
   await page.locator('#kiPruefen [data-studio-action="fehlerfinder"]').click();
   await page.locator('#kiDiagnoseSlot [data-feld="probleme"]').waitFor({state:'visible'});
   assert.match(await page.locator('#diagnoseStand').innerText(),/Fehlerfinder:/);
   await page.locator('#kiCheckTab').focus();
   await page.keyboard.press('Home');assert.equal(await page.locator('#kiCodeBtn').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#kiServicesBtn').isVisible(),true);
   assert.equal(await page.locator('#kiNeu').isVisible(),true);
   await page.locator('#kiClose').click();
   if(width<820)await page.locator('#handyNav [data-a="werkzeuge"]').click();
   else await page.locator('[data-u="werkzeuge"]').click();
   for(const text of ['Fehlerfinder','Projekt-Review','In allen Dateien suchen','Code formatieren','JSON prüfen','Vorschau PC','Vorschau Handy','Entwickler-Tools'])assert((await page.locator('[data-feld="werkzeuge"]').innerText()).includes(text));
   assert.equal(await page.locator('#seite a[href*="devtools"],#seite a[href*="game-studio"],#seite #katalog').count(),0);
   if(width<820)await page.locator('#handyNav [data-a="dateien"]').click();
   await page.locator('#baumNeu').click();assert.equal(await page.locator('#dateiDialog #katalog').isVisible(),true);await page.keyboard.press('Escape');
   await page.keyboard.press('Control+Shift+P');
   const commands=await page.evaluate(()=>PAL.alle.map(x=>x.label));
   assert.deepEqual(commands,baseline,'Every original palette command must be preserved');
   assert.equal(await page.locator('#palListe>div').count(),baseline.length);await page.keyboard.press('Escape');
   await page.locator('#startDirekt').evaluate(e=>{e.checked=true;e.dispatchEvent(new Event('change'))});
   await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>typeof S!=='undefined'&&S.layoutBereit);
   assert.equal(await page.locator('#studioStart').isVisible(),false);
   await page.evaluate(()=>store.set('sdStudioDirekt',false));
   const name=await page.evaluate(()=>S.p.name);
   await page.goto(url+'?projekt='+encodeURIComponent(name),{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>typeof S!=='undefined'&&S.layoutBereit);
   assert.equal(await page.locator('#studioStart').isVisible(),false);
   await page.setViewportSize({width:320,height:800});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true);
   for(const id of ['projektMenuBtn','kiBtn','starten']){const r=await page.locator('#'+id).boundingBox();assert(r&&r.x>=0&&r.x+r.width<=321,id+' fits at 320px')}
   assert.deepEqual(errors,[]);
   await context.close();
  }
  console.log('PASS Studio layout: desktop, mobile, menus, tabs, start screen, all '+baseline.length+' original commands');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
