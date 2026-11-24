'use strict';
// Der Service Worker darf private Feedback-Antworten nie im Browser-Cache ablegen.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
function ladeSw(antwortHeaders={}){
 const handler={},gespeichert=[];
 const self={addEventListener:(t,f)=>{handler[t]=f},skipWaiting(){},clients:{claim(){}}};
 const caches={open:async()=>({put:async req=>gespeichert.push(req.url),addAll:async()=>{}}),match:async()=>undefined,keys:async()=>[],delete:async()=>true};
 const fetch=async()=>({ok:true,headers:{get:k=>antwortHeaders[k.toLowerCase()]||null},clone(){return this}});
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),{self,caches,fetch,URL,console,Promise,setTimeout});
 return {handler,gespeichert};
}
async function abruf(sw,url,headers={}){
 let antwort=null;const req={method:'GET',url,headers:{has:k=>Object.keys(headers).some(h=>h.toLowerCase()===k.toLowerCase())}};
 sw.handler.fetch({request:req,respondWith:p=>{antwort=p}});if(antwort)await antwort;await new Promise(r=>setTimeout(r,0));return antwort!==null;
}
test('Feedback-Pfade werden gar nicht über den Service Worker geleitet',async()=>{
 const sw=ladeSw();
 for(const u of ['https://thesdhub.com/feedback/submit','https://thesdhub.com/feedback-api/voices','https://thesdhub.com/feedback-server/admin/pending'])assert.equal(await abruf(sw,u),false,u);
 assert.deepEqual(sw.gespeichert,[]);
});
test('Anfragen mit Anmeldung (Authorization) werden nie gespeichert',async()=>{
 const sw=ladeSw();assert.equal(await abruf(sw,'https://thesdhub.com/irgendwas',{Authorization:'Bearer x'}),false);assert.deepEqual(sw.gespeichert,[]);
});
test('Antworten mit no-store oder private werden nicht gespeichert, normale schon',async()=>{
 for(const cc of ['no-store','private, max-age=0']){const sw=ladeSw({'cache-control':cc});await abruf(sw,'https://thesdhub.com/a.json');assert.deepEqual(sw.gespeichert,[],cc)}
 const sw=ladeSw();await abruf(sw,'https://thesdhub.com/index.html');assert.deepEqual(sw.gespeichert,['https://thesdhub.com/index.html']);
});
test('Vorschauseite des Formulars ist kein Feedback-Pfad (darf offline verfügbar sein)',async()=>{
 const sw=ladeSw();await abruf(sw,'https://thesdhub.com/docs/feedback-preview.html');assert.deepEqual(sw.gespeichert,['https://thesdhub.com/docs/feedback-preview.html']);
});
test('Firestore-Regeln: Rückmeldungen sind für Browser komplett gesperrt',()=>{
 const r=fs.readFileSync(path.join(__dirname,'..','firebase','firestore.rules'),'utf8');
 assert.match(r,/match \/feedbackPrivate\/\{id\} \{\s*allow read, write: if false;\s*\}/);
 assert.match(r,/match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/,'Rest bleibt gesperrt');
 assert.doesNotMatch(r.replace(/\/\/.*$/gm,''),/feedback[\s\S]*allow (read|write|create|update)[^;]*if (true|request\.auth)/,'kein Browser-Zugriff auf Feedback');
});
