'use strict';
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const serverCode="const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{try{let u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let f=path.resolve(process.cwd(),'.'+u);if(!f.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return}if(u.endsWith('/'))f=path.join(f,'index.html');fs.stat(f,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end();return}const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[ext]||'text/plain');fs.createReadStream(f).pipe(res)})}catch(e){res.writeHead(400).end()}}).listen(8769,'127.0.0.1')";
 const server=spawn(process.execPath,['-e',serverCode],{stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const base='http://127.0.0.1:8769';
  await page.goto(base+'/fristen/',{waitUntil:'domcontentloaded',timeout:30000});
  // Seiten mit eigener Kopfzeile bekommen keine zweite Leiste, sondern einen Bereiche-Knopf darin.
  await page.locator('header.topbar .sd-ws-kopf-knopf').waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('.sd-ws-bar').count(),0,'Keine zweite Kopfzeile');
  assert.equal(await page.locator('.sd-ws-dock').isVisible(),false);
  assert.equal(await page.locator('header.topbar').count(),1,'Original Fristen header remains');
  assert.equal(await page.locator('main .karte').count()>0,true,'Existing utility cards preserved');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.sdStil),'hub','Gemeinsamer Stil aktiv');
  await page.locator('header.topbar .sd-ws-kopf-knopf').click();
  assert.equal(await page.locator('#sdWorkspacePanel').isVisible(),true);
  assert.equal(await page.locator('#sdWorkspacePanel .sd-ws-app').count(),16);
  assert.equal(await page.locator('#sdWorkspacePanel .sd-ws-app[href^="/kids/"]').count(),0,'Game links must be absent from work launcher');
  assert.equal(await page.locator('#sdWorkspacePanel .sd-ws-app[href="/studio/"]').count(),1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#sdWorkspacePanel').isVisible(),false);

  for(const width of [760,390,320]){
   await page.setViewportSize({width,height:844});
   const m=await page.evaluate(()=>{
    const d=document.querySelector('.sd-ws-dock').getBoundingClientRect();
    return {width:innerWidth,scroll:document.documentElement.scrollWidth,
      bottom:d.bottom,top:d.top,visible:getComputedStyle(document.querySelector('.sd-ws-dock')).display}
   });
   assert.equal(m.visible,'flex','Mobile dock visible at '+width);
   assert(m.bottom<=844+1&&m.top>700,'Mobile dock attached to bottom at '+width);
   assert(m.scroll<=width+3,'No horizontal scroll at '+width+': '+JSON.stringify(m));
  }
  await page.locator('.sd-ws-dock button').click();
  assert.equal(await page.locator('#sdWorkspacePanel').isVisible(),true);
  const mobileMenu=await page.locator('#sdWorkspacePanel').boundingBox();
  assert(mobileMenu.y>=0&&mobileMenu.x>=0,'Menu fits mobile screen');
  await page.locator('.sd-ws-close').click();
  assert.equal(await page.locator('#sdWorkspacePanel').isVisible(),false);

  // Different app families keep their own original content.
  await page.setViewportSize({width:390,height:844});
  for(const p of ['/post/','/bewerbungen/']){
   await page.goto(base+p,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('.sd-ws-dock').waitFor({state:'visible',timeout:12000});
   assert.equal(await page.locator('#sdWorkspacePanel').count(),1,p+': menu');
  }
  // SD Play has its own navigation, no injected professional workspace dock.
  await page.goto(base+'/kids/games/',{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(await page.locator('.sd-ws-dock').count(),0);
  assert.equal(await page.locator('#sdWorkspacePanel').count(),0);
  assert.equal(await page.locator('a[href="../../play/"]').count(),1);
  // Dense applications must not gain a second toolbar covering the editor or chat.
  for(const p of ['/studio/','/deutsch/','/assistent/']){
   await page.goto(base+p,{waitUntil:'domcontentloaded',timeout:30000});
   if(p==='/studio/'){
    await page.waitForFunction(()=>typeof S!=='undefined'&&S.layoutBereit);
    if(await page.locator('#studioStart').isVisible())await page.getByRole('button',{name:'Zum geöffneten Projekt',exact:true}).click();
    await page.locator('#handyNav [data-a="werkzeuge"]').click();
    await page.locator('[data-feld="werkzeuge"] [data-studio-action="mehr"]').click();
   }
   await page.locator('.sd-ws-launch').waitFor({state:'visible',timeout:12000});
   assert.equal(await page.locator('.sd-ws-bar').count(),0,p+': no injected top toolbar');
   assert.equal(await page.locator('.sd-ws-dock').count(),0,p+': no bottom toolbar over native controls');
   await page.locator('.sd-ws-launch').click();
   assert.equal(await page.locator('#sdWorkspacePanel').isVisible(),true,p+': drawer opens');
   await page.locator('.sd-ws-close').click();
  }
  assert(await page.locator('body[data-sd-ws-mode="compact"]').count()===1);
  console.log('SD Hub cross-app navigation: Desktop + phone, menu, touch size and dense-workspace modes PASS');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
