"use strict";
const assert=require("node:assert/strict"),http=require("node:http"),fs=require("node:fs"),path=require("node:path"),{chromium}=require("playwright");
const root=path.resolve(__dirname,".."),mime={".html":"text/html;charset=utf-8",".js":"application/javascript;charset=utf-8",".css":"text/css;charset=utf-8",".svg":"image/svg+xml",".woff2":"font/woff2",".png":"image/png"};
const server=http.createServer((req,res)=>{
try{const url=new URL(req.url,"http://localhost"),clean=decodeURIComponent(url.pathname).replace(/^\/+/,"");const rel=clean.endsWith("/")?clean+"index.html":(clean||"index.html");const file=path.resolve(root,rel);
if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);return res.end("Forbidden")}
fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end("Not found")}res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"application/octet-stream"});res.end(data)})
}catch(e){res.writeHead(400);res.end("Invalid request")}}
);
(async()=>{
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
let browser;
try{
browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const base="http://127.0.0.1:"+server.address().port;
for(const viewport of [{width:1300,height:850},{width:390,height:844},{width:320,height:720}]){
const ctx=await browser.newContext({viewport,isMobile:viewport.width<=390,hasTouch:viewport.width<=390,serviceWorkers:"block"});
const page=await ctx.newPage(),errors=[];page.on("pageerror",e=>errors.push(e.message));
await page.goto(base+"/",{waitUntil:"load"});
assert.equal(await page.locator("#stapel .lage").count(),8);
assert.equal(await page.locator("#reiter a").count(),8);
assert.equal(await page.locator(".thema").count(),8);
assert.equal(await page.locator("#mein-sd-hub").count(),1);
assert.equal(await page.locator("#szene").getAttribute("aria-hidden"),null);
assert.equal(await page.locator('#thema-deutsch .kachel').count(),5);
assert.equal(await page.locator('#thema-kids .kachel').count(),6);
assert.equal(await page.locator('#thema-kids .kachel').first().locator('a').count(),0);
assert.match(await page.locator('#thema-kids .kachel').first().getAttribute('href'),/kids\/games\//);
assert.equal(await page.locator('#thema-kids a[href*="play.html?game="]').count(),3);
await page.locator("#suche").fill("B1");
assert.equal(await page.locator('#thema-deutsch').isVisible(),true);
assert.equal(await page.locator('#thema-kids').isVisible(),false);
await page.locator('#stapel .lage[data-thema="kids"]').focus();
await page.locator('#stapel .lage[data-thema="kids"]').press("Enter");
assert.equal(await page.locator("#suche").inputValue(),"");
assert.equal(await page.locator('#thema-kids').isVisible(),true);
await page.locator("#suche").fill("nonexistent-very-unlikely-search");
assert.equal(await page.locator("#nichts").isVisible(),true);
await page.locator('#reiter a[data-thema="deutsch"]').evaluate(el=>el.click());
assert.equal(await page.locator("#suche").inputValue(),"");
assert.equal(await page.locator('#thema-deutsch').isVisible(),true);
await page.evaluate(()=>sdApplyLang("en"));
assert.match(await page.locator('#thema-deutsch .reiterkopf').innerText(),/German & learning/);
assert.match(await page.locator('#thema-kids .reiterkopf').innerText(),/Kids & games/);
await page.evaluate(()=>sdApplyLang("de"));
assert.match(await page.locator('#thema-deutsch .reiterkopf').innerText(),/Deutsch & Lernen/);
const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
assert.ok(ov<=5,"Horizontal page overflow at "+viewport.width+"px: "+ov);
assert.deepEqual(errors,[],"Browser errors: "+errors.join("\n"));
await ctx.close();
}
console.log("PASS: Home desktop, 390px, 320px; eight 3D folders, keyboard, search, DE/EN, navigation, layout");
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});