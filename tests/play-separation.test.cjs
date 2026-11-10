"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const home=read("index.html");
const dashboard=read("mein-sd-hub/index.html");
const app=read("mein-sd-hub/app.js");
const data=require("../mein-sd-hub/data.js");
const play=read("play/index.html");
test("Professional landing page contains no games in visible sections or menus",()=>{
 const visible=home.slice(home.indexOf("<body>"),home.indexOf('window.SD_I18N ='));
 assert.ok(!visible.includes('href="kids/'),'Games should not be linked from the professional homepage');
 assert.ok(!visible.includes('data-thema="kids"'));
 assert.ok(!visible.includes('id="thema-kids"'));
 assert.equal((visible.match(/<a class="bk[ "]/g)||[]).length,7);
 assert.equal((visible.match(/class="thema"/g)||[]).length,7);
});
test("Work dashboard excludes game links, goal and featured tile",()=>{
 assert.ok(!dashboard.includes('href="/kids/'));
 assert.ok(!dashboard.includes('featured-games'));
 assert.match(dashboard,/href="\/pdf-studio\/"/);
 assert.ok(!data.goals.some(g=>g.id==="spielen"));
 assert.ok(!data.paths.flatMap(p=>p.steps).some(step=>step[2].startsWith("/kids/")));
 assert.match(app,/workspaceItems=D.items.filter/);
 assert.match(app,/filter\(inWorkspace\)/);
});
test("Previously saved game IDs remain readable so data is not lost",()=>{
 assert.ok(data.items.some(x=>x.id==="pibo"));
 assert.ok(data.items.some(x=>x.id==="spiele"));
 const state=data.sanitizeState({favorites:["pibo","studio"],recent:["spiele"]});
 assert.deepEqual(state.favorites,["pibo","studio"]);
 assert.deepEqual(state.recent,["spiele"]);
});
test("SD Play routes point to preserved game files",()=>{
 assert.match(play,/<title>SD Play/);
 assert.match(play,/href="\.\/styles.css/);
 for(const route of ["/kids/","/kids/blockworld/","/kids/games/","/kids/games/play.html?game=obby","/kids/games/play.html?game=pet","/kids/games/play.html?game=learn"]){
  assert.ok(play.includes('href="'+route+'"'),"Missing SD Play destination "+route);
  const pathname=route.split("?")[0],target=path.join(root,pathname.slice(1),pathname.endsWith("/")?"index.html":"");
  assert.ok(fs.existsSync(target),"Broken game link "+route);
 }
 for(const file of ["kids/index.html","kids/games/index.html","kids/blockworld/index.html"])assert.match(read(file),/href="\.\.\/(?:\.\.\/)?play\/"/);
});
test("SD Play uses independent visual identity without external artwork",()=>{
 const css=read("play/styles.css");
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.ok(!css.includes("https://"));
 assert.match(play,/name="robots" content="noindex,follow"/);
});
