const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('deutsch/lernwerk-vereinheitlicht.js','utf8');
const start=source.indexOf('const lessons=')+'const lessons='.length;
const end=source.indexOf(';',start);
assert.ok(start>12&&end>start,'Exercise catalog must be present');
const lessons=JSON.parse(source.slice(start,end));
const offsets={'30':{alpha:0,a1:10,a2:20},'50':{alpha:0,a1:10,a2:20,b1:30},'100':{alpha:0,a1:20,a2:40,b1:60,praxis:80}};
const key=t=>t.source+':'+t.lv+':'+t.oldIndex;
test('176 unique exercises across all five levels',()=>{
 assert.equal(lessons.length,176);
 const counts=Object.fromEntries(['alpha','a1','a2','b1','praxis'].map(lv=>[lv,lessons.filter(t=>t.lv===lv).length]));
 assert.deepEqual(counts,{alpha:36,a1:40,a2:40,b1:40,praxis:20});
 assert.equal(new Set(lessons.map(t=>t.lv+'|'+t.q)).size,176);
 assert.equal(new Set(lessons.map(key)).size,176);
});
test('all exercises have valid options and correct answer index',()=>{
 for(const t of lessons){assert.ok(Array.isArray(t.opts)&&t.opts.length>=2,key(t));assert.ok(Number.isInteger(t.correct)&&t.correct>=0&&t.correct<t.opts.length,key(t));assert.ok(typeof t.q==='string'&&t.q.trim(),key(t))}
});
test('old progress keys resolve to stable unified IDs',()=>{
 for(const t of lessons){const offset=offsets[t.source]?.[t.lv];assert.ok(Number.isInteger(offset),key(t));const local=t.oldIndex-offset;assert.ok(Number.isInteger(local)&&local>=0,key(t));assert.equal(key(t),t.source+':'+t.lv+':'+(local+offset))}
});
test('migration uses canonical ID and is versioned',()=>{
 assert.match(source,/p\[item\.source\+':'\+item\.lv\+':'\+item\.oldIndex\]=true/);
 assert.match(source,/p\.migrationVersion===2/);
 assert.match(source,/p\.migrationVersion=2/);
});
test('dashboard closes exam, workshop and course overlays',()=>{
 const dashboard=fs.readFileSync('deutsch/lernweg-dashboard.js','utf8');
 for(const selector of ["$('b1x')","$('preB1')","$('sdHubUnifiedLessons')"])assert.ok(dashboard.includes(selector),selector);
});

test('grammar help matches the topic without treating every article as a grammar question',()=>{
 const section=source.slice(source.indexOf('const topicGuides='),source.indexOf('function render()'));
 assert.ok(section.startsWith('const topicGuides='),'Topic guide catalog is available');
 const guideFor=new Function('item',section+'return guideFor(item)');
 const article=lessons.find(t=>t.lv==='a1'&&t.q==='Welcher Artikel passt zu Mutter?');
 const residence=lessons.find(t=>t.lv==='a1'&&t.q==='Welche Antwort passt zu Wo wohnst du?');
 const time=lessons.find(t=>t.lv==='a1'&&t.q==='Was bedeutet halb neun?');
 assert.ok(article&&residence&&time,'Representative A1 questions are available');
 assert.equal(guideFor(article).title,'Artikel und Nomen');
 assert.equal(guideFor(residence).title,'Hinweis zu dieser Aufgabe');
 assert.equal(guideFor(time).title,'Hinweis zu dieser Aufgabe');
 for(const item of lessons){
  const guide=guideFor(item);
  assert.ok(guide.title&&guide.rule&&guide.example,key(item));
  assert.equal(typeof guide.example,'string',key(item));
 }
});
