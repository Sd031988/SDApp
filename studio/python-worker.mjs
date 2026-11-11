// Vendored Pyodide 314.0.7; no CDN and no automatic package downloads.
const base=new URL('./vendor/pyodide/314.0.7/',import.meta.url);
const started=performance.now();
const send=data=>postMessage(data);
self.onmessage=async({data})=>{
 let cache;const urls=[];let outputSize=0;
 try{
  const {files,main,stdin}=data;
  if(!files||typeof files[main]!=='string'||Object.keys(files).length>200)throw Error('Ungültiges Python-Projekt.');
  let size=0;
  for(const [path,text] of Object.entries(files)){
   if(!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>!p||p==='.'||p==='..')||typeof text!=='string')throw Error('Ungültiger Projektpfad.');
   size+=new TextEncoder().encode(text).length;
  }
  if(size>5*1024*1024)throw Error('Python-Projekt ist größer als 5 MB.');
  try{cache=await caches.open('sd-python-314.0.7');}catch{}
  const manifestURL=new URL('manifest.json',base).href;
  const manifest=await (await cache?.match(manifestURL)||await fetch(manifestURL)).json();
  const total=Object.values(manifest.files).reduce((n,f)=>n+f.bytes,0);
  const buffers=new Map();let loaded=0;
  send({type:'progress',percent:0,phase:'Python-Dateien laden'});
  for(const [name,entry] of Object.entries(manifest.files)){
   const url=new URL(name,base).href;
   let response=await cache?.match(url);
   if(!response)response=await fetch(url);
   if(!response.ok)throw Error('Python-Datei konnte nicht geladen werden: '+name);
   const reader=response.body.getReader(),chunks=[];let count=0;
   while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);count+=value.length;
    send({type:'progress',percent:Math.min(94,Math.floor((loaded+Math.min(count,entry.bytes))/total*95)),phase:'Python-Dateien laden'});
   }
   const bytes=new Uint8Array(count);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
   if(count!==entry.bytes||digest!==entry.sha256){await cache?.delete(url);throw Error('Python-Datei ist beschädigt: '+name);}
   const headers={'Content-Type':name.endsWith('.wasm')?'application/wasm':name.endsWith('.mjs')?'text/javascript':name.endsWith('.json')?'application/json':'application/zip'};
   buffers.set(url,new Response(bytes,{headers}));loaded+=entry.bytes;
   try{await cache?.put(url,buffers.get(url).clone());}catch{}
  }
  // Cache the tiny manifest too, so a subsequent start works offline.
  try{await cache?.put(new URL('manifest.json',base).href,new Response(JSON.stringify(manifest)));}catch{}
  // Blob accepts bytes, not a ReadableStream.
  async function importCached(name){const url=URL.createObjectURL(new Blob([await buffers.get(new URL(name,base).href).clone().arrayBuffer()],{type:'text/javascript'}));urls.push(url);return import(url);}
  const nativeFetch=self.fetch.bind(self);
  self.fetch=(url,options)=>{const key=new URL(typeof url==='string'?url:url.url||String(url),base).href;return buffers.has(key)?Promise.resolve(buffers.get(key).clone()):nativeFetch(url,options);};
  const [{loadPyodide},{default:createPyodideModule}]=await Promise.all([importCached('pyodide.mjs'),importCached('pyodide.asm.mjs')]);
  send({type:'progress',percent:95,phase:'Python initialisieren'});
  const output=(stream,text)=>{outputSize+=text.length;if(outputSize>200000)throw Error('Zu viel Ausgabe. Python wurde gestoppt.');send({type:'output',stream,text});};
  const py=await loadPyodide({indexURL:base.href,createPyodideModule,lockFileContents:await buffers.get(new URL('pyodide-lock.json',base).href).clone().json(),stdout:text=>output('stdout',text),stderr:text=>output('stderr',text)});
  self.fetch=nativeFetch;
  const readyMs=performance.now()-started;
  send({type:'progress',percent:100,phase:'Python bereit',readyMs});
  py.FS.mkdirTree('/projekt');
  for(const [path,text] of Object.entries(files)){const full='/projekt/'+path;py.FS.mkdirTree(full.slice(0,full.lastIndexOf('/')));py.FS.writeFile(full,text);}
  const mainDir=main.includes('/')?main.slice(0,main.lastIndexOf('/')):'';
  await py.runPythonAsync(`import os, sys, io, runpy\nos.chdir('/projekt')\nsys.path.insert(0, '/projekt')\nsys.path.insert(0, ${JSON.stringify('/projekt/'+mainDir)})\nsys.stdin = io.StringIO(${JSON.stringify(stdin)})\ntry:\n    runpy.run_path(${JSON.stringify(main)}, run_name='__main__')\nexcept SystemExit as exit:\n    if exit.code not in (None, 0):\n        raise\n`);
  let checks=[];
  if(Array.isArray(data.checks)){
   py.globals.set('_sd_cases_json',JSON.stringify(data.checks));
   const checked=await py.runPythonAsync(`
import ast, contextlib, json
_sd_source = open(${JSON.stringify('/projekt/'+main)}, encoding='utf-8').read()
_sd_results = []
for _sd_case in json.loads(_sd_cases_json):
    _sd_tree = ast.parse(_sd_source)
    _sd_inputs = _sd_case.get('werte', {})
    for _sd_node in _sd_tree.body:
        if isinstance(_sd_node, ast.Assign) and len(_sd_node.targets) == 1 and isinstance(_sd_node.targets[0], ast.Name):
            _sd_name = _sd_node.targets[0].id
            if _sd_name in _sd_inputs:
                _sd_node.value = ast.parse(repr(_sd_inputs[_sd_name]), mode='eval').body
    ast.fix_missing_locations(_sd_tree)
    _sd_stdout = io.StringIO()
    sys.stdin = io.StringIO(_sd_case.get('eingabe', ''))
    try:
        with contextlib.redirect_stdout(_sd_stdout):
            _sd_globals = {'__name__': '__main__', **_sd_inputs}
            exec(compile(_sd_tree, ${JSON.stringify(main)}, 'exec'), _sd_globals)
        _sd_actual = _sd_stdout.getvalue().strip()
        _sd_results.append({'ok': _sd_actual == _sd_case['ausgabe'].strip() and bool(eval(_sd_case.get('nachweis', 'True'), _sd_globals)), 'actual': _sd_actual})
    except Exception as _sd_error:
        _sd_results.append({'ok': False, 'actual': str(_sd_error)})
json.dumps(_sd_results)
`);
   checks=JSON.parse(checked);
  }
  send({type:'done',readyMs,checks});
 }catch(error){send({type:'error',message:String(error.message||error)});}
 finally{for(const url of urls)URL.revokeObjectURL(url);}
};
