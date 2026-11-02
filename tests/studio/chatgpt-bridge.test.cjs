'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const zip=require('../../studio/chatgpt-transfer-zip.js');
const extension=path.resolve(__dirname,'../../studio/chatgpt-transfer-extension');

test('download ZIP contains all extension files with correct CRC',()=>{
 const files=['manifest.json','background.js','studio-bridge.js'].map(name=>
  ({name,text:fs.readFileSync(path.join(extension,name),'utf8')}));
 const bytes=zip.archive(files),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert.equal(zip.crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 let at=0;
 for(const file of files){
  assert.equal(view.getUint32(at,true),0x04034b50);
  const crc=view.getUint32(at+14,true),size=view.getUint32(at+18,true),nameLength=view.getUint16(at+26,true);
  const name=new TextDecoder().decode(bytes.subarray(at+30,at+30+nameLength));
  const body=bytes.subarray(at+30+nameLength,at+30+nameLength+size);
  assert.equal(name,file.name);
  assert.equal(new TextDecoder().decode(body),file.text);
  assert.equal(zip.crc32(body),crc);
  at+=30+nameLength+size;
 }
 const end=bytes.length-22;
 assert.equal(view.getUint32(end,true),0x06054b50);
 assert.equal(view.getUint16(end+10,true),3);
 assert.equal(view.getUint32(end+16,true),at);
 assert.throws(()=>zip.archive([{name:'../secret',text:'bad'}]),/Dateiname/);
});
function startMock(){
 const listeners={};let pending=null;let opened=null;let focused=null;
 const chrome={
  runtime:{onInstalled:{addListener:fn=>listeners.installed=fn},
    onMessage:{addListener:fn=>listeners.message=fn}},
  contextMenus:{create:obj=>listeners.menuDetails=obj,
    onClicked:{addListener:fn=>listeners.clicked=fn}},
  storage:{session:{
    set:async o=>{pending=o.sdPending},
    get:async()=>({sdPending:pending}),
    remove:async()=>{pending=null}
  }},
  action:{setBadgeText:async()=>{}},
  tabs:{
   query:async()=>[],
   create:async o=>{opened=o},
   update:async(_,o)=>{focused=o},
   sendMessage:async()=>{}
  },
  windows:{update:async()=>{}}
 };
 const source=fs.readFileSync(path.join(extension,'background.js'),'utf8');
 vm.runInNewContext(source,{chrome,URL,crypto:{randomUUID:()=> 'd4f6c1ae-69da-43ee-9123-09951d20f655'},Date});
 listeners.installed();
 return {listeners,chrome,get pending(){return pending},get opened(){return opened},get focused(){return focused}};
}
test('only the explicitly selected ChatGPT text is transferred',async()=>{
 const m=startMock();
 assert.deepEqual(Array.from(m.listeners.menuDetails.contexts),['selection']);
 assert.equal(m.listeners.menuDetails.documentUrlPatterns.includes('https://chatgpt.com/*'),true);
 await m.listeners.clicked({menuItemId:'sd-send-selection',pageUrl:'https://chatgpt.com/c/abc',
  selectionText:'### Datei: index.html\n<h1>Hallo</h1>'},{url:'https://chatgpt.com/c/abc'});
 assert.equal(m.pending.provider,'chatgpt');
 assert.match(m.pending.text,/<h1>Hallo/);
 assert.equal(m.opened.url,'https://www.thesdhub.com/studio/');
 await m.listeners.clicked({menuItemId:'sd-send-selection',pageUrl:'https://malicious.invalid/',
  selectionText:'private file'},{url:'https://malicious.invalid/'});
 assert.notEqual(m.pending.text,'private file','Unknown pages must not overwrite selection');
});
test('pending selection is only available from official Studio, deleted after ACK',async()=>{
 const m=startMock();
 await m.listeners.clicked({menuItemId:'sd-send-selection',pageUrl:'https://gemini.google.com/app/',
  selectionText:'approved text'},{url:'https://gemini.google.com/app/'});
 const unauthorised=m.listeners.message({type:'SD_BRIDGE_GET'},{url:'https://malicious.invalid/'},()=>{});
 assert.equal(unauthorised,undefined);
 const ask=payload=>new Promise(resolve=>{assert.equal(m.listeners.message(payload,
  {url:'https://www.thesdhub.com/studio/'},resolve),true)});
 const incoming=await ask({type:'SD_BRIDGE_GET'});
 assert.equal(incoming.pending.provider,'gemini');
 assert.equal(incoming.pending.text,'approved text');
 const badAck=await ask({type:'SD_BRIDGE_ACK',nonce:'not-the-real-nonce'});
 assert.equal(badAck.ok,false);
 assert(m.pending);
 const goodAck=await ask({type:'SD_BRIDGE_ACK',nonce:m.pending.nonce});
 assert.equal(goodAck.ok,true);
 assert.equal(m.pending,null);
 const after=await ask({type:'SD_BRIDGE_GET'});
 assert.equal(after.pending,null);
});
test('extension has no ChatGPT session/cookie or private message access',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json'),'utf8'));
 assert.equal(manifest.manifest_version,3);
 assert.deepEqual(manifest.permissions,['contextMenus','storage']);
 assert.deepEqual(manifest.host_permissions,['https://www.thesdhub.com/studio/*','https://thesdhub.com/studio/*']);
 assert(manifest.content_scripts.every(s=>s.matches.every(m=>/thesdhub\.com\/studio/.test(m))));
 assert(!manifest.content_scripts.some(s=>s.matches.some(m=>/chatgpt|google/.test(m))));
});

test('Windows package sources are present for the browser-side ZIP download',()=>{
 const root=path.resolve(__dirname,'../../studio');
 const items=[
  ['manifest.json','chatgpt-transfer-extension/manifest.json'],
  ['background.js','chatgpt-transfer-extension/background.js'],
  ['studio-bridge.js','chatgpt-transfer-extension/studio-bridge.js'],
  ['sd_bridge_windows.py','chatgpt-windows/sd_bridge_windows.py'],
  ['START-WINDOWS.cmd','chatgpt-windows/START-WINDOWS.cmd'],
  ['README-WINDOWS.txt','chatgpt-windows/README-WINDOWS.txt']
 ];
 const zipped=zip.archive(items.map(([name,source])=>({name,text:fs.readFileSync(path.join(root,source),'utf8')})));
 assert(zipped.length>1000);
 const html=fs.readFileSync(path.join(root,'chatgpt-bruecke.html'),'utf8');
 assert.match(html,/id="downloadWindows"/);
 for(const [name,source] of items){
  assert(html.includes(source.split('/').pop()));
 }
});
