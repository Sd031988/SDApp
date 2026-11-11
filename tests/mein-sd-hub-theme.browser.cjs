"use strict";
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path"),{chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const server=http.createServer((req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);const rel=pathname.endsWith("/")?pathname+"index.html":pathname;
 const file=path.resolve(root,"."+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return}res.setHeader("Content-Type",({".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".woff2":"font/woff2"})[path.extname(file)]||"application/octet-stream");res.end(data)});
}catch{res.writeHead(400).end()}});
(async()=>{await new Promise(r=>server.listen(0,"127.0.0.1",r));let browser;
try{
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 const base="http://127.0.0.1:"+server.address().port;
 for(const route of ["/","/mein-sd-hub/#akademie"]){
  const ctx=await browser.newContext({colorScheme:"dark",locale:"de-DE",viewport:{width:320,height:820},reducedMotion:"reduce"});
  const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(base+route);
  assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"dark");
  assert.equal(await page.locator("#themeSwitch").inputValue(),"auto");
  if(route.includes("mein-sd-hub")){
   await page.locator('[data-tab="akademie"]').click();
   await page.locator(".course").filter({has:page.locator("b",{hasText:/^Deutsch im Alltag$/})}).click();
   await page.locator(".quiz").waitFor();
  }
  const sample=await page.evaluate(isHub=>{
   const canvas=document.createElement("canvas");canvas.width=canvas.height=1;const c=canvas.getContext("2d");
   const color=value=>{c.clearRect(0,0,1,1);c.fillStyle=value;c.fillRect(0,0,1,1);return Array.from(c.getImageData(0,0,1,1).data).slice(0,3)};
   const lum=rgb=>rgb.map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   const selectors=isHub?["body",".quiz",".quiz p",".course",".lesson-btn",".answers button"]:["body",".start-karte",".start-karte .unter",".bk",".bk-liste"];
   return selectors.map(selector=>{const el=document.querySelector(selector),style=getComputedStyle(el);let p=el,bg;
    while(p){bg=getComputedStyle(p).backgroundColor;if(bg!=="rgba(0, 0, 0, 0)"&&bg!=="transparent")break;p=p.parentElement}
    const back=color(bg),fore=color(style.color),a=lum(back),b=lum(fore);
    return {selector,back,fore,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   });
  },route.includes("mein-sd-hub"));
  for(const s of sample){assert.ok(s.ratio>=4.5,s.selector+" contrast "+s.ratio);if(s.selector==="body"){assert.ok(Math.max(...s.back)<70);assert.ok(Math.min(...s.fore)>180)}}
  await page.locator("#themeSwitch").selectOption("light");
  assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"light");
  await page.reload();
  assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"light","saved choice");
  await page.locator("#themeSwitch").selectOption("auto");
  assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"dark");
  await page.emulateMedia({colorScheme:"light"});
  await page.waitForFunction(()=>document.documentElement.dataset.sdTheme==="light");
  assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"light","automatic reacts to OS change");
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=3,"320px overflow");
  assert.deepEqual(errors,[]);
  await ctx.close();
 }
 // Storage errors must not prevent automatic theme detection or page startup.
 const ctx=await browser.newContext({colorScheme:"dark",locale:"de-DE"});await ctx.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error("blocked")};Storage.prototype.setItem=()=>{throw new Error("blocked")}});
 const page=await ctx.newPage();await page.goto(base+"/");assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"dark");await page.locator("#themeSwitch").selectOption("light");assert.equal(await page.locator("html").getAttribute("data-sd-theme"),"light");await ctx.close();
 console.log("PASS: shared theme, OS changes, stored override, blocked storage, contrast, 320px");
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
