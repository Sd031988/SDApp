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
 assert.equal(guideFor(residence).title,'Lernstrategie zur Aufgabe');
 assert.equal(guideFor(time).title,'Lernstrategie zur Aufgabe');
 assert.equal(guideFor({lv:'a2',q:'Welcher Kasus antwortet auf wem?',note:'Dativ',opts:['Dativ'],correct:0}).title,'Dativ');
 assert.equal(guideFor({lv:'b1',q:'Welcher Nebensatz beginnt mit dass?',note:'Nebensatz',opts:['dass'],correct:0}).title,'Nebensätze');
 for(const item of lessons){
  const guide=guideFor(item);
  assert.ok(guide.title&&guide.rule&&guide.example,key(item));
  assert.equal(typeof guide.example,'string',key(item));
  if(guide.title==='Lernstrategie zur Aufgabe'){
   assert.ok(!guide.rule.includes(item.note),key(item)+': note must not leak before answering');
   assert.ok(!guide.example.includes(item.opts[item.correct]),key(item)+': solution must not leak before answering');
  }
 }
});

test('resuming a lesson uses stable task IDs and migrates legacy indices after thematic sorting',()=>{
 const section=source.slice(source.indexOf('const topicRules='),source.indexOf('function persistCursor(){'));
 const create=new Function('lessons','level','cursor','order',`let index=0;const progress={};const save=()=>{};const cursorKey='test';${section};return {current,restoreCursorPosition,id}`);
 const order=['alpha','a1','a2','b1','praxis'];
 for(const level of order){
  const app=create(lessons,level,{},order);
  const sorted=app.current();
  const original=lessons.filter(item=>item.lv===level);
  assert.equal(sorted.length,original.length,level);
  for(let i=0;i<sorted.length;i++){
   assert.equal(app.restoreCursorPosition({version:2,taskId:app.id(sorted[i])}),i,level+': stable '+i);
  }
  for(let i=0;i<original.length;i++){
   const restored=app.restoreCursorPosition({index:i});
   assert.equal(app.id(sorted[restored]),app.id(original[i]),level+': legacy '+i);
  }
 }
});

test('writing drafts autosave before lesson navigation and retain explicit save',()=>{
 assert.match(source,/draft\.addEventListener\('input',\(\)=>\{updateCount\(\);const next=storage\(writingKey\);next\[level\]=draft\.value;save\(writingKey,next\)/);
 assert.match(source,/draft\.value=typeof drafts\[level\]==='string'\?drafts\[level\]:''/);
 assert.match(source,/panel\.querySelector\('#sdun-writing-save'\)\.onclick=/);
 assert.match(source,/autocapitalize="off"/);
});

test('draft persistence reports failures and verifies browser storage',()=>{
 const fn=source.match(/function save\(k,v\)\{.*?\}\}/)?.[0];
 assert.ok(fn,'save helper exists');
 const success=new Function('localStorage',fn+'return save')({data:{},setItem(k,v){this.data[k]=v},getItem(k){return this.data[k]}});
 assert.equal(success('draft',{a1:'Hallo'}),true);
 const denied=new Function('localStorage',fn+'return save')({setItem(){throw Error('quota')},getItem(){return null}});
 assert.equal(denied('draft',{a1:'Hallo'}),false);
 const silent=new Function('localStorage',fn+'return save')({setItem(){},getItem(){return null}});
 assert.equal(silent('draft',{a1:'Hallo'}),false);
 assert.match(source,/status\.textContent=save\(writingKey,next\)\?/);
 assert.equal((source.match(/status\.textContent=save\(writingKey,next\)\?/g)||[]).length,2);
 assert.match(source,/Speichern fehlgeschlagen!/);
});

test('writing self-checklists cover every level without automatic grading',()=>{
 const start=source.indexOf('const writingChecks=');
 const end=source.indexOf(';const writingKey=',start);
 assert.ok(start>=0&&end>start,'Writing checklists are defined');
 const checks=new Function(source.slice(start,end+1)+'return writingChecks')();
 for(const lv of ['alpha','a1','a2','b1','praxis']){
  assert.ok(Array.isArray(checks[lv])&&checks[lv].length>=3,lv);
  assert.equal(new Set(checks[lv]).size,checks[lv].length,lv);
  assert.ok(checks[lv].every(v=>typeof v==='string'&&v.length>12),lv);
 }
 assert.match(source,/data-writing-check/);
 assert.match(source,/keine automatische Bewertung/i);
 assert.match(source,/addEventListener\('change',updateChecks\)/);
});
