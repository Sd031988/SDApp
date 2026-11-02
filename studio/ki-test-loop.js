/* SD Studio – deterministic, isolated-from-project-code verification loop.
   Executes ONLY trusted static checks; NEVER executes user HTML/JS/Python.
   No network, project writes, dynamic imports, eval or user-code compilation. */
(function(root){
'use strict';
const MAX_FILES=40,MAX_ITEMS=160;
function test(id,file,label,status,rule){
 return {id:String(id).slice(0,300),file:String(file||'').slice(0,220),
  label:String(label).slice(0,220),status,rule};
}
function run(files,original,reviewFn,graphFn){
 const chosen=Array.isArray(files)?files.slice(0,MAX_FILES):[];
 const previous=original&&typeof original==='object'&&!Array.isArray(original)?original:{};
 const tests=[];
 const add=(id,file,label,status,rule)=>{
  if(tests.length<MAX_ITEMS)tests.push(test(id,file,label,status,rule));
 };
 const incomplete=!Array.isArray(files)||files.length>MAX_FILES;
 if(incomplete)add('limit','','Mehr als 40 Dateien oder ungültige Auswahl: Test unvollständig','fail','limit');
 const valid=chosen.filter(f=>f&&typeof f.path==='string'&&typeof f.content==='string'&&!f.content.startsWith('data:'));
 if(valid.length!==chosen.length)add('invalid','','Nicht lesbare Datei: Test unvollständig','fail','invalid');
 if(!valid.length)add('empty','','Keine Code-Dateien ausgewählt','fail','empty');
 const source={...previous};
 for(const f of valid)source[f.path]=f.content;
 const review=typeof reviewFn==='function'?reviewFn(valid,previous):null;
 if(!review||review.blocked||review.skipped||review.truncated){
  add('review-blocked','','Sicherheits- oder Vollständigkeitsprüfung nicht bestanden','fail','review');
 }
 for(const finding of (review&&Array.isArray(review.findings)?review.findings:[]).slice(0,75)){
  const kind=finding.severity==='critical'?'fail':
   finding.rule==='external-tab'?'fail':
   finding.severity==='warning'?'warning':'info';
  add('review:'+finding.file+':'+finding.line+':'+finding.rule,finding.file,
   finding.title||'Lokaler Prüfhinweis',kind,finding.rule);
 }
 for(const f of valid){
  if(f.content.length>180000)continue;
  if(/\.json$/i.test(f.path)){
   try{JSON.parse(f.content);add('json:'+f.path,f.path,'JSON-Syntax gültig','pass','json');}
   catch(_){add('json:'+f.path,f.path,'JSON-Datei enthält Syntaxfehler','fail','json');}
  }
 }
 if(typeof graphFn==='function'){
  try{
   const graph=graphFn(source);
   if(graph&&graph.truncated)add('graph-limit','','Dateiverknüpfungen nur teilweise geprüft','fail','limit');
   for(const edge of (graph&&Array.isArray(graph.missing)?graph.missing:[]).slice(0,80)){
    if(!valid.some(f=>f.path===edge.from))continue;
    add('asset:'+edge.from+':'+edge.to,edge.from,
      'Lokale Verknüpfung verweist auf fehlende Datei','fail','asset');
   }
  }catch(_){add('graph-error','','Dateiverknüpfungen konnten nicht geprüft werden','fail','graph');}
 }
 // Completeness of the test mechanism itself is a hard gate, not a warning.
 if(tests.length>=MAX_ITEMS)add('truncated','','Testbericht abgeschnitten','fail','limit');
 const fail=tests.filter(x=>x.status==='fail').length;
 const warnings=tests.filter(x=>x.status==='warning').length;
 return {tests,fail,warnings,passes:tests.filter(x=>x.status==='pass').length,
  infos:tests.filter(x=>x.status==='info').length,
  blocked:fail>0, staticOnly:true, codeExecuted:false, filesModified:false};
}
function compare(before,after){
 const a=before&&Array.isArray(before.tests)?before.tests:[], b=after&&Array.isArray(after.tests)?after.tests:[];
 const bad=t=>t.status==='fail'||t.status==='warning';
 const prev=new Map(a.filter(bad).map(t=>[t.id,t]));
 const next=new Map(b.filter(bad).map(t=>[t.id,t]));
 const fixed=[...prev.values()].filter(t=>!next.has(t.id));
 const introduced=[...next.values()].filter(t=>!prev.has(t.id));
 const oldCritical=before&&before.tests?.some(t=>t.rule==='review'&&t.status==='fail');
 const improved=fixed.length>0&&introduced.length===0&&!after?.blocked&&!oldCritical;
 return {before,after,fixed,introduced,improved,canStage:improved,
  status:introduced.length?'regressed':after?.blocked?'blocked':improved?'improved':'unchanged'};
}
function compareRepair(selected,original,plan,reviewFn,graphFn){
 if(!plan||plan.blocked||!Array.isArray(plan.updatedFiles)||!plan.updatedFiles.length)
  return {canStage:false,status:'no-repair',fixed:[],introduced:[]};
 const current=Array.isArray(selected)?selected:[];
 const updates=new Map(plan.updatedFiles.map(f=>[f.path,f.content]));
 if(updates.size!==plan.updatedFiles.length||plan.updatedFiles.some(f=>!current.some(c=>c.path===f.path)))
  return {canStage:false,status:'invalid',fixed:[],introduced:[]};
 const corrected=current.map(f=>updates.has(f.path)?{...f,content:updates.get(f.path)}:f);
 const before=run(current,original,reviewFn,graphFn);
 const after=run(corrected,original,reviewFn,graphFn);
 return compare(before,after);
}
const api={run,compare,compareRepair};
root.SDKITestLoop=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
