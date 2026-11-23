const test=require("node:test"),assert=require("node:assert"),fs=require("fs"),path=require("path");
global.window=globalThis;const hub=path.join(__dirname,"..","mein-sd-hub");
for(const f of fs.readdirSync(path.join(hub,"kurse")))require(path.join(hub,"kurse",f));
require(path.join(hub,"kurs-videos.js"));
test("Videos gehören zu echten Kursen und Lektionen",()=>{
 for(const [k,m] of Object.entries(window.SDKursVideos.daten)){
  assert.ok(window.SDAkademieKurse[k],"Kurs fehlt: "+k);const ids=window.SDAkademieKurse[k].map(l=>l.id);
  for(const [lid,vs] of Object.entries(m)){if(lid!=="_kurs")assert.ok(ids.includes(lid),k+": Lektion fehlt "+lid);
   assert.ok(vs.length>0);for(const v of vs){assert.match(v.id,/^[A-Za-z0-9_-]{11}$/,"ungültige Video-ID "+v.id);assert.ok(v.t&&v.t.length>5)}}}
});
test("jeder Kurs hat mindestens ein Video",()=>{for(const k of Object.keys(window.SDAkademieKurse))if(!/^(cpp-spiele)$/.test(k))assert.ok(window.SDKursVideos.daten[k],"keine Videos: "+k)});
