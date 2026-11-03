'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const supported=new Map([
['/studio/game-studio/academy/projects.html','text/html'],
['/studio/game-studio/academy/projects.js','application/javascript'],
['/studio/game-studio/academy/projects.css','text/css'],
['/studio/game-studio/academy/academy.css','text/css'],
['/icon.svg','image/svg+xml']
]);
(async()=>{
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,type=supported.get(pathname);
 if(!type){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',type);
 fs.createReadStream(path.join(root,pathname)).on('error',()=>{if(!res.headersSent)res.writeHead(404).end();}).pipe(res);
});
let browser;
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1250,height:800}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/studio/game-studio/academy/projects.html');
 await page.waitForSelector('[data-project]');
 assert.equal(await page.locator('[data-project]').count(),4);
 assert.equal(await page.locator('[data-milestone]').count(),6);
 assert.equal(await page.locator('#projectMilestoneCount').innerText(),'0 / 6 Meilensteine');
 await page.locator('[data-milestone="0"]').check();
 assert.equal(await page.locator('#projectMilestoneCount').innerText(),'1 / 6 Meilensteine');
 await page.locator('#projectNotes').fill('Testnotizen zur spielbaren Szene');
 await page.reload();
 await page.waitForSelector('[data-milestone]');
 assert.equal(await page.locator('[data-milestone="0"]').isChecked(),true);
 assert.equal(await page.locator('#projectNotes').inputValue(),'Testnotizen zur spielbaren Szene');
 await page.locator('[data-project="world"]').click();
 assert.match(await page.locator('.project-content h2').innerText(),/Open-World-Techniklabor/);
 assert.equal(await page.locator('.project-link').getAttribute('href'),'../large-world.html');
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await page.waitForSelector('[data-project]');
 assert.equal(await page.locator('[data-project]').count(),4);
 assert.deepEqual(errors,[],'No JS page errors in the desktop or mobile smoke');
 console.log('Academy capstone browser smoke passed');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
})().catch(e=>{console.error(e);process.exitCode=1;});
