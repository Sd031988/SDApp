'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const repo=path.resolve(__dirname,'../..');
const standard=['anerkennung','arbeiten','bewerbungen','fristen','haushalt','mappe',
 'messen','ordnen','post','pdf-studio','rechnungen','scanner','schreibstudio',
 'steuer','stunden','training','vertraege','wohnung','online-upload','kids/games'];
const compact=['studio','design','deutsch','assistent','kids','kids/blockworld'];
const extra=['deutsch/b1-pruefung.html','online-upload/pdf-studio'];
test('each user-facing app retains its content and includes the correct responsive shell',()=>{
 for(const [mode,list] of [['standard',standard],['compact',compact]]){
  for(const folder of list){
   const file=path.join(repo,folder,'index.html');
   const content=fs.readFileSync(file,'utf8');
   assert(content.includes('sd-workspace.css'),folder+': missing shared stylesheet');
   assert(content.includes('sd-workspace.js'),folder+': missing workspace script');
   assert(content.includes('data-sd-mode="'+mode+'"'),folder+': wrong shell mode');
   assert.match(content,/<\/body>/i,folder+': HTML body truncated');
  }
 }
 for(const relative of extra){
  const file=path.join(repo,relative.endsWith('.html')?relative:relative+'/index.html');
  const html=fs.readFileSync(file,'utf8');
  assert(html.includes('sd-workspace.js'),relative);
  assert(html.includes('data-sd-mode="compact"'),relative);
 }
});
test('shared menu remains self-contained and uses only official SD Hub routes',()=>{
 const source=fs.readFileSync(path.join(repo,'sd-workspace.js'),'utf8');
 assert.doesNotThrow(()=>new vm.Script(source));
 const css=fs.readFileSync(path.join(repo,'sd-workspace.css'),'utf8');
 assert(css.includes('body[data-sd-ws-mode=compact]'));
 assert(css.includes('.sd-ws-dock'));
 assert(css.includes('env(safe-area-inset-bottom'));
 assert(!/localStorage|fetch\(|XMLHttpRequest|navigator\.credentials|document\.cookie/.test(source));
 assert(!/https?:\/\/[^'\"]+/.test(source),'Menu should only link to internal SD Hub pages');
});
test('existing main dashboard and original PC agent assets remain untouched',()=>{
 const dashboard=fs.readFileSync(path.join(repo,'mein-sd-hub/index.html'),'utf8');
 assert(dashboard.includes('dashboard-ui.css'));
 const studio=fs.readFileSync(path.join(repo,'studio/index.html'),'utf8');
 assert(studio.includes('id="starten"'));
 const agent=JSON.parse(fs.readFileSync(path.join(repo,'agent/zugang.json'),'utf8'));
 assert.match(agent.ver,/^\d{14}$/);
});
