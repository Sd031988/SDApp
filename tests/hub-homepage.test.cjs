"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const topics=["deutsch","arbeit","post","geld","doku","wohnen","ki","kids"];
const count=(re)=>(html.match(re)||[]).length;
test("Original 3D stack retains all eight keyboard-accessible folders",()=>{
 assert.match(html,/class="szene" id="szene"/);assert.match(html,/class="stapel" id="stapel"/);
 assert.equal(count(/class="lage" role="button" tabindex="0"/g),8);
 for(const topic of topics){assert.match(html,new RegExp('class="lage" role="button" tabindex="0" data-thema="'+topic+'"'));assert.match(html,new RegExp('id="thema-'+topic+'"'));assert.match(html,new RegExp('href="#thema-'+topic+'"'))}
 assert.match(html,/function oeffneThema\(thema\)/);assert.match(html,/e.key === 'Enter' \|\| e.key === ' '/)
});
test("All homepage topic sections contain at least one tool",()=>{
 for(const topic of topics){const start=html.indexOf('id="thema-'+topic+'"');assert.ok(start>0,topic);const end=html.indexOf("</section>",start),block=html.slice(start,end);assert.ok(block.includes('class="kachel"'),topic)}
});
test("German and English copy exist for every localized entry",()=>{
 const translations=html.match(/window\.SD_I18N\s*=\s*(\{[\s\S]*?\});/);assert.ok(translations,"No translations dictionary");
 const dict=JSON.parse(translations[1]);assert.ok(dict.de&&dict.en);
 for(const key of [...html.matchAll(/data-i18n="([^"]+)"/g)].map(x=>x[1])){
   for(const lang of ["de","en"])assert.ok(Object.hasOwn(dict[lang],key),"missing "+lang+" key "+key)}
});
test("Every homepage local link points to a real file or section",()=>{
 const links=[...html.matchAll(/href="([^"]+)"/g)].map(x=>x[1]);let n=0;
 for(const href of links){if(/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href))continue;
  const clean=href.split("?")[0].split("#")[0],fragment=href.includes("#")?decodeURIComponent(href.split("#")[1]):"";
  if(!clean){if(fragment)assert.ok(html.includes('id="'+fragment+'"'),"missing homepage anchor: "+href);continue}
  if(clean.includes(".."))throw Error("unsafe link "+href);
  const file=path.join(root,clean.endsWith("/")?clean+"index.html":clean);
  assert.ok(fs.existsSync(file),"missing local target "+href);
  n++
 }
 assert.ok(n>=40,"expected many links: "+n)
});
test("New themes are present in direct search and old overview remains",()=>{
 for(const term of ["b1","alphabetisierung","pibo","blockworld","code","pdf"])assert.ok(html.toLocaleLowerCase("de").includes(term),term);
 assert.match(html,/id="mein-sd-hub"/);
 assert.match(html,/querySelectorAll\('\.thema'\)/);
});
test("All inline JavaScript parses and 3D has reduced-motion fallback",()=>{
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new vm.Script(match[1]));
 assert.match(html,/prefers-reduced-motion: reduce/);
 assert.match(html,/\.stapel \{[^}]*transform-style: preserve-3d/);
});
