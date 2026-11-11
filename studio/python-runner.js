/* Lazy, self-hosted Python. A fresh worker isolates each run's Python state.
   This is not a security sandbox: execute only trusted code. */
(function(root){
'use strict';
const workerURL=new URL('./python-worker.mjs',document.currentScript.src);
function create(){
 let active=null;
 function stop(){if(active){active.worker.terminate();active.reject(new Error('Python-Ausführung abgebrochen.'));active=null;}}
 async function run(project,handlers={}){
  if(active)throw new Error('Python läuft bereits.');
  const started=performance.now();
  return new Promise((resolve,reject)=>{
   const worker=new Worker(workerURL,{type:'module'});
   let timer;const finish=(error,data)=>{clearTimeout(timer);worker.terminate();active=null;error?reject(error):resolve({...data,totalMs:performance.now()-started});};
   active={worker,reject:error=>finish(error)};
   timer=setTimeout(()=>finish(new Error('Zeitlimit erreicht. Python wurde gestoppt.')),project.timeoutMs||60000);
   worker.onmessage=event=>{const data=event.data;
    if(data.type==='progress')handlers.onProgress?.(data);
    else if(data.type==='output')handlers.onOutput?.(data);
    else if(data.type==='done')finish(null,data);
    else if(data.type==='error')finish(new Error(data.message));
   };
   worker.onerror=event=>{event.preventDefault();finish(new Error(event.message||'Python konnte nicht gestartet werden.'));};
   worker.postMessage({files:project.files,main:project.main,stdin:project.stdin||'',checks:project.checks});
  });
 }
 return {run,stop};
}
root.SDPythonRunner={create};
})(window);
