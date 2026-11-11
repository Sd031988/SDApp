'use strict';
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
 const serverCode="const http=require('http'),fs=require('fs'),path=require('path');http.createServer((req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let f=path.resolve(process.cwd(),'.'+pathname);if(!f.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return}if(pathname.endsWith('/'))f=path.join(f,'index.html');fs.stat(f,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end();return}const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2'})[ext]||'text/plain');fs.createReadStream(f).pipe(res)})}catch(e){res.writeHead(400).end()}}).listen(8766,'127.0.0.1')";
 const server=spawn(process.execPath,['-e',serverCode],{stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/mein-sd-hub/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.sd-app-card').first().waitFor({state:'visible',timeout:12000});
  const cardCount=await page.locator('.sd-app-card').count();
  assert(cardCount>=15,'All original SD Hub tools must appear');
  assert.equal(await page.locator('.featured').count(),4);
  for(const route of ['/deutsch/','/studio/','/agent/','/pdf-studio/'])
   assert(await page.locator('.featured[href="'+route+'"]').count()>0,'Missing link: '+route);
  const desktop=await page.evaluate(()=>{
   const nav=document.querySelector('#tabs').getBoundingClientRect();
   const main=document.querySelector('main.main').getBoundingClientRect();
   return {navRight:nav.right,mainLeft:main.left,docWidth:document.documentElement.scrollWidth,width:innerWidth}
  });
  assert(desktop.navRight<desktop.mainLeft,'Desktop uses left sidebar');
  assert(desktop.docWidth<=desktop.width+2,'No horizontal desktop overflow');
  const fav=page.locator('.sd-app-card').filter({hasText:'SD Code-Studio'}).locator('.sd-app-star');
  await fav.click();
  assert.equal(await fav.getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#favoritesList').innerText(),/Code-Studio/);
  await page.locator('#nickname').fill('Tester');
  assert.match(await page.locator('#greeting').innerText(),/Tester/);
  await page.locator('#appSearch').fill('Bewerbung');
  assert(await page.locator('.sd-app-card').count()>=2);
  assert(!(await page.locator('.sd-app-card').allTextContents()).join(' ').includes('Pibo 3D'));
  await page.locator('#appSearch').fill('unmögliche-xyz-app-123');
  assert.equal(await page.locator('#appEmpty').isVisible(),true);
  await page.locator('#appSearch').fill('');
  await page.getByRole('button',{name:'Kreativ',exact:true}).click();
  assert.equal(await page.locator('.sd-app-card').count(),2);
  await page.getByRole('button',{name:'Alle',exact:true}).click();
  assert.equal(await page.locator('.sd-app-card').count(),cardCount);
  await page.locator('#themeSwitch').selectOption('dark');
  assert.equal(await page.locator('html').getAttribute('data-sd-theme'),'dark');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.sd-app-card').first().waitFor();
  assert.equal(await page.locator('html').getAttribute('data-sd-theme'),'dark');
  assert.match(await page.locator('#greeting').innerText(),/Tester/);
  assert.equal(await page.locator('.sd-app-card').filter({hasText:'SD Code-Studio'}).locator('.sd-app-star').getAttribute('aria-pressed'),'true');
  for(const width of [920,768,430,390,360,320]){
   await page.setViewportSize({width,height:844});
   const m=await page.evaluate(()=>{
    const nav=document.querySelector('.tabs-shell').getBoundingClientRect();
    const more=document.querySelector('#mobileMore').getBoundingClientRect();
    return {navTop:nav.top,navBottom:nav.bottom,screen:innerHeight,width:innerWidth,
     docWidth:document.documentElement.scrollWidth,moreWidth:more.width,display:getComputedStyle(document.querySelector('#mobileMore')).display};
   });
   assert.equal(m.display,'grid','Mobile More visible at '+width);
   assert(m.moreWidth>=50,'Mobile More touch size at '+width);
   assert(m.navTop>600&&m.navBottom<=m.screen+2,'Bottom nav position at '+width);
   if(m.docWidth>width+2){const bad=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>({name:el.tagName,cls:String(el.className).slice(0,70),r:el.getBoundingClientRect()})).filter(x=>x.r.width&&x.r.right>innerWidth+2).sort((a,b)=>b.r.right-a.r.right).slice(0,8).map(x=>x.name+'.'+x.cls+': '+Math.round(x.r.right)));console.log('Mobile overflow candidates at '+width+': '+bad.join(' | '));}
   assert(m.docWidth<=width+2,'Mobile horizontal overflow at '+width+': '+JSON.stringify(m));
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#mobileMore').click();
  assert.equal(await page.locator('#mobileNavMenu').isVisible(),true);
  await page.locator('#mobileNavMenu [data-mobile-tab="sprache"]').click();
  assert.equal(await page.locator('#sprache').isVisible(),true);
  assert.equal(await page.locator('#mobileNavMenu').isVisible(),false);
  assert.equal(await page.locator('#mobileMore').getAttribute('aria-expanded'),'false');
  await page.locator('#tabs [data-tab="uebersicht"]').click();
  assert.equal(await page.locator('#uebersicht').isVisible(),true);
  await page.locator('#mobileMore').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#mobileNavMenu').isVisible(),false);
  assert.equal(await page.locator('#appDirectory').count(),1,'App directory remains available after navigation');
  assert.equal(errors.length,0,'Unexpected browser errors: '+errors.join(' | '));
  console.log('SD Hub dashboard: desktop/mobile navigation, filters, search, favorites, themes and links PASS');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
