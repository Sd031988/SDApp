"use strict";
const assert=require("node:assert/strict");
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const mime={".html":"text/html;charset=utf-8",".css":"text/css;charset=utf-8",".js":"application/javascript;charset=utf-8",".svg":"image/svg+xml"};
const server=http.createServer((req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const rel=pathname.endsWith("/")?pathname+"index.html":pathname;
  const file=path.resolve(root,"."+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  fs.readFile(file,(err,content)=>{
   if(err){res.writeHead(404).end();return}
   res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream"});res.end(content);
  });
 }catch(e){res.writeHead(400).end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const base="http://127.0.0.1:"+server.address().port;
  for(const width of [1440,920,390,320]){
   const ctx=await browser.newContext({viewport:{width,height:844},serviceWorkers:"block"});
   const page=await ctx.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));
   const response=await page.goto(base+"/play/",{waitUntil:"load"});
   assert.equal(response.status(),200,"SD Play should load");
   assert.match(await page.title(),/SD Play/);
   assert.equal(await page.locator(".feature").count(),3);
   assert.equal(await page.locator(".mini-grid>a").count(),3);
   assert.equal(await page.locator('a[href="/kids/"]').count(),1);
   assert.equal(await page.locator('a[href="/kids/blockworld/"]').count(),1);
   assert.equal(await page.locator('a[href="/kids/games/"]').count()>=2,true);
   const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert.ok(docWidth<=width+3,"SD Play horizontal overflow "+width+": "+docWidth);
   assert.deepEqual(errors,[],"SD Play JS errors");
   await ctx.close();
  }
  console.log("PASS SD Play: 1440/920/390/320px, links, cards and no overflow");
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(err=>{console.error(err);process.exitCode=1});
