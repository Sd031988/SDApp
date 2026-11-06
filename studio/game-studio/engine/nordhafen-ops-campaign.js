/* Nordhafen Ops: optional extended campaign rules; legacy tower mission untouched. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsCampaign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const HOLD=3,EXTRACT=20,DATA_RADIUS=3,EXTRACT_RADIUS=9;
function initial(){return {phase:'range',towers:[false,false,false],towerProgress:0,dataProgress:0,dataCollected:false,extractProgress:0,status:'playing',waveTriggered:false,radio:'Schießstand: trainieren oder direkt zum ersten Funkmast gehen.'};}
function objective(state){if(state.phase==='range')return 'Schießstand (optional)';if(state.phase==='towers')return 'Funkmasten '+state.towers.filter(Boolean).length+'/3';if(state.phase==='data')return 'Datenpaket aus oberster Etage holen';if(state.phase==='extract')return 'Hafen-Extraktion: 20 Sekunden überleben';return state.status==='won'?'Mission erfolgreich':'Niederlage';}
function step(state,{dt=0,skipRange=false,rangeDone=false,atTower=false,holding=false,damage=false,health=100,atData=false,onTopFloor=false,atExtraction=false}={}){
 if(state.status!=='playing')return state;
 if(health<=0)return {...state,status:'lost',phase:'ended',towerProgress:0,dataProgress:0,extractProgress:0};
 const delta=Math.min(.1,Math.max(0,dt));
 if(state.phase==='range'){if(skipRange||rangeDone)return {...state,phase:'towers',radio:'Zentrale: Drei Funkmasten aktivieren.'};return state;}
 if(state.phase==='towers'){
  const index=state.towers.indexOf(false);if(index<0)return {...state,phase:'data'};
  const progress=atTower&&holding&&!damage?state.towerProgress+delta:0;
  if(progress>=HOLD){const towers=state.towers.slice();towers[index]=true;const done=towers.every(Boolean);return {...state,towers,towerProgress:0,phase:done?'data':'towers',radio:done?'Zentrale: Datenpaket im bewachten Gebäude sichern.':'Funkmast '+(index+1)+' aktiviert: Feindalarm!'};}
  return {...state,towerProgress:progress};
 }
 if(state.phase==='data'){
  const progress=atData&&onTopFloor&&holding&&!damage?state.dataProgress+delta:0;
  if(progress>=HOLD)return {...state,dataProgress:0,dataCollected:true,phase:'extract',radio:'Daten gesichert. Zum Hafen! Extraktion 20 Sekunden halten.'};
  return {...state,dataProgress:progress};
 }
 if(state.phase==='extract'){
  const progress=atExtraction&&!damage?state.extractProgress+delta:0;
  return {...state,extractProgress:progress,waveTriggered:state.waveTriggered||atExtraction,status:progress>=EXTRACT?'won':'playing',phase:progress>=EXTRACT?'ended':'extract',radio:progress>=EXTRACT?'Extraktion erfolgreich.':state.radio};
 }
 return state;
}
function target(state,sites){const index=state.towers.indexOf(false);return state.phase==='towers'?sites.towers[index]:state.phase==='data'?sites.data:state.phase==='extract'?sites.extraction:null;}
return Object.freeze({HOLD,EXTRACT,DATA_RADIUS,EXTRACT_RADIUS,initial,objective,step,target});
});