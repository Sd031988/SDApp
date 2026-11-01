import {findGame,miniIds} from './catalog.mjs';
import {STORAGE_KEY,PETS,COLOR_KEYS,CITY_JOBS,QUESTIONS,TREASURE_ITEMS,TREASURE_KEYS,TREASURE_EXIT,
 initialState,sanitize,visit,action,restartGame} from './rules.mjs';
import {readSettings,saveSettings} from './profile.mjs';
import {SDGameSound,cueForMini,loadSoundSettings,saveSoundSettings} from '../sd-sound.mjs';
const $=id=>document.getElementById(id);
const id=new URLSearchParams(location.search).get('game');
if(!miniIds.includes(id)){
 $('title').textContent='Spiel nicht gefunden';
 $('description').textContent='Dieses Spiel ist nicht verfügbar. Bitte öffne die Spielezentrale.';
 $('message').textContent='Zurück zur Spielezentrale';
 throw Error('Unknown mini game '+id);
}
const info=findGame(id);
$('title').textContent=info.emoji+' '+info.name;document.title=info.name+' | SD Kids';
$('description').textContent=info.description;
const canvas=$('stage'),ctx=canvas.getContext('2d');
if(!ctx)throw Error('Canvas 2D unavailable');
let save;
try{save=sanitize(localStorage.getItem(STORAGE_KEY))}catch{save=initialState()}
visit(save,id);
const g=save.games[id], keys={left:false,right:false,up:false,down:false};
const prefs=readSettings();prefs.lastPlayed=id;saveSettings(prefs);
const savedAudio=loadSoundSettings();
let sharedAudioConfigured=false;
try{sharedAudioConfigured=localStorage.getItem('sd-kids-audio-v1')!==null}catch{}
let tool='plant',paused=false,soundOn=sharedAudioConfigured?savedAudio.enabled:prefs.sound,reducedMotion=prefs.reducedMotion,last=0,elapsed=0;
const sounds=new SDGameSound({enabled:soundOn,volume:savedAudio.volume});
const volumeInput=$('volume'),volumeValue=$('volumeValue');
volumeInput.value=String(Math.round(sounds.volume*100));
volumeValue.textContent=volumeInput.value+' %';
volumeInput.addEventListener('input',()=>{
 sounds.setVolume(Number(volumeInput.value)/100);
 volumeValue.textContent=Math.round(sounds.volume*100)+' %';
 saveSoundSettings({enabled:soundOn,volume:sounds.volume});
 if(soundOn)sounds.pulse('select',250);
});

const releaseKeys=()=>Object.keys(keys).forEach(k=>keys[k]=false);
function togglePause(force){
 paused=typeof force==='boolean'?force:!paused;
 releaseKeys();
 $('pauseShade').hidden=!paused;
 $('pause').setAttribute('aria-pressed',String(paused));
 $('pause').textContent=paused?'▶ Weiter':'⏸️ Pause';
 if(!paused&&sounds.enabled)sounds.play('select');
 if(!paused)last=0;
}
$('pause').addEventListener('click',()=>togglePause());
$('resume').addEventListener('click',()=>togglePause(false));
$('fullscreen').addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else if($('canvasBox').requestFullscreen)await $('canvasBox').requestFullscreen();
  else message('Vollbild wird auf diesem Gerät nicht unterstützt.');
 }catch{message('Vollbild konnte nicht aktiviert werden.')}
});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'⛶ Vollbild beenden':'⛶ Vollbild'});
$('motion').addEventListener('click',()=>{
 reducedMotion=!reducedMotion;prefs.reducedMotion=reducedMotion;saveSettings(prefs);
 $('motion').setAttribute('aria-pressed',String(reducedMotion));
 $('motion').textContent=reducedMotion?'🌿 Wenig Bewegung an':'🌿 Bewegung reduzieren';
});
$('motion').setAttribute('aria-pressed',String(reducedMotion));
if(reducedMotion)$('motion').textContent='🌿 Wenig Bewegung an';
$('sound').setAttribute('aria-pressed',String(soundOn));
$('sound').textContent=soundOn?'🔊 Ton an':'🔇 Ton aus';
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)togglePause(true)});

const obby={x:64,y:535,vy:0,grounded:true};
const kart={x:295,y:473,angle:0,speed:0};
const levels=[
 {name:'Regenbogen-Sprung',sky:'#b1e7fb',color:'#f2b0cb',platforms:[[0,545,158],[187,458,148],[393,364,145],[613,288,162]]},
 {name:'Wolken-Turm',sky:'#a3cbfa',color:'#afaaef',platforms:[[0,545,143],[197,464,142],[384,360,150],[605,277,173]]},
 {name:'Dschungel-Sprung',sky:'#aff0d6',color:'#7fc5a6',platforms:[[0,545,163],[202,443,145],[389,344,142],[617,278,158]]}
];
const gates=[{x:500,y:470},{x:653,y:325},{x:420,y:146},{x:144,y:314}];
function persist(){
 try{
  localStorage.setItem(STORAGE_KEY,JSON.stringify(save));
  $('saveIndicator').textContent='✓ Lokal gespeichert';
 }catch{
  $('saveIndicator').textContent='⚠ Speichern nicht möglich';
  $('message').textContent='Dein Browser erlaubt das Speichern nicht.';
 }
}
let noticeTimeout=0;
function message(text){$('message').textContent=text;clearTimeout(noticeTimeout)}
function perform(kind,payload){
 if(paused)return false;
 const before={...g,keys:g.keys?.length,found:g.found?.length};
 const result=action(save,id,kind,payload||{});
 if(result.ok){
  persist();message(result.message+(result.reward?' ⭐ +'+result.reward:''));
  let cue=cueForMini(id,kind,true,result.reward);
  if(id==='treasure'){
   if(g.finished&&!before.finished)cue='finish';
   else if(g.keys.length>before.keys)cue='key';
   else if(g.found.length>before.found)cue='treasure';
  }
  if(id==='kart'&&g.laps>before.laps)cue='lap';
  if(id==='city'&&g.done.length>before.done.length)cue='finish';
  if(id==='learn'&&result.message.startsWith('💡'))cue='wrong';
  sounds.play(cue);
  if(result.reward&&cue!=='finish'&&cue!=='reward'&&cue!=='lap')sounds.play('reward');
  updateHUD();updateActions();draw();
 }else{message(result.message);sounds.pulse('error',350)}
 return result.ok;
}
function drawRound(x,y,w,h,r,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function txt(text,x,y,size=26,color='#253259',align='left',font='800'){
 ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
 ctx.font=font+' '+size+'px system-ui, Apple Color Emoji, Segoe UI Emoji';
 ctx.fillText(String(text),x,y);
}
function backdrop(top='#a8dbff',bottom='#f7e2ad'){
 const gradient=ctx.createLinearGradient(0,0,0,600);gradient.addColorStop(0,top);gradient.addColorStop(1,bottom);
 ctx.fillStyle=gradient;ctx.fillRect(0,0,800,600);
 ctx.fillStyle='#ffffff7a';
 for(const [x,y,w] of [[90,95,120],[405,73,160],[675,125,125]]){ctx.beginPath();ctx.ellipse(x,y,w/2,25,0,0,Math.PI*2);ctx.fill()}
}
function card(text,x,y,w=200,h=58,color='#fffdf2'){
 drawRound(x,y,w,h,14,color);txt(text,x+w/2,y+h/2,23,'#253359','center');
}
function progress(){switch(id){
 case 'obby':return '🌈 Level '+(g.level+1)+'/3 · Checkpoint '+g.checkpoint+'/2';
 case 'pet':return '💗 Pflegeaktionen '+g.actions;
 case 'garden':return '🌻 Ernten '+g.harvest;
 case 'city':return '🏙️ Missionen '+g.done.length+'/4';
 case 'kart':return '🏎️ Runden '+g.laps+' · Tor '+(g.gate+1)+'/4';
 case 'treasure':return '💎 '+g.found.length+'/3 · 🗝️ '+g.keys.length+'/2';
 case 'fashion':return '👗 Looks '+g.shown.length;
 case 'learn':return '📚 Aufgabe '+Math.min(QUESTIONS.length,g.index+1)+'/'+QUESTIONS.length;
}}
function updateHUD(){$('score').textContent='⭐ '+save.stars+' Spielsterne';$('progress').textContent=progress()}
function drawObby(){
 const l=levels[g.level];backdrop(l.sky,'#f9e5d5');
 txt('🏁 '+l.name,28,43,31);
 txt('Sammle beide Checkpoints und erreiche die Fahne!',28,83,18);
 for(let i=0;i<l.platforms.length;i++){
  const [x,y,w]=l.platforms[i];
  drawRound(x,y,w,24,10,i===3?'#f6cd71':l.color);
  drawRound(x,y+18,w,16,8,'#6276af');
  if(i===1||i===2)txt(i<=g.checkpoint?'✅':'🚩',x+w/2,y-27,31,'#222','center');
 }
 txt('🏁',724,l.platforms[3][1]-39,42);
 const px=obby.x,py=obby.y;
 drawRound(px-14,py-38,28,36,7,'#6256c5');ctx.fillStyle='#f7cfaa';
 ctx.beginPath();ctx.arc(px,py-47,15,0,Math.PI*2);ctx.fill();
 txt('⬆',px,py-71,15,'#514394','center');
}
function drawPet(){
 backdrop('#b2eaf1','#cdf3be');
 ctx.fillStyle='#73c881';ctx.fillRect(0,405,800,195);
 txt('🏝️ Meine Tierinsel',34,47,34);
 txt('Wähle ein Tier und gib ihm Liebe, Futter und Ruhe.',35,90,19);
 drawRound(192,175,415,258,60,'#fff8e7');
 txt(PETS[g.selected],400,296,154,'#000','center');
 for(const [label,v,y,color] of [['🍎 Satt',g.food,454,'#ffb86a'],['💗 Freude',g.joy,492,'#ee8cb7'],['⚡ Energie',g.energy,530,'#9ab7f5']]){
  txt(label,84,y,18);drawRound(246,y-11,410,20,10,'#fff9');drawRound(246,y-11,v*4.1,20,10,color);txt(v+'%',679,y,17);
 }
}
function drawGarden(){
 backdrop('#c4effa','#bfe4b0');txt('🌻 Meine Gartenwelt',26,45,34);
 txt('Wähle ein Werkzeug und tippe auf ein Beet.',26,84,20);
 for(let i=0;i<9;i++){
  const x=178+(i%3)*151,y=141+Math.floor(i/3)*139;
  drawRound(x,y,123,111,17,'#8d6049');
  drawRound(x+9,y+9,105,91,12,'#bc8760');
  txt(g.plots[i]===0?'🟫':g.plots[i]===1?'🌱':'🌻',x+61,y+55,50,'#142c3e','center');
 }
 txt('Werkzeug: '+({plant:'🌱 Pflanzen',water:'💧 Gießen',harvest:'🧺 Ernten'}[tool]||tool),400,575,22,'#274259','center');
}
function drawCity(){
 backdrop('#acd9ff','#d8e1f8');
 ctx.fillStyle='#8eb7c8';ctx.fillRect(0,395,800,205);
 drawRound(0,453,800,110,0,'#69718f');for(let x=60;x<800;x+=110)drawRound(x,501,56,7,3,'#f5e8bc');
 const buildings=[['🏫',36,'#ecb898'],['🏥',235,'#dfe8fd'],['🚒',440,'#e79388'],['📬',641,'#f4cf78']];
 for(const [emoji,x,color] of buildings){drawRound(x,182,138,207,18,color);txt(emoji,x+69,270,72,'#fff','center')}
 txt('🏙️ SD City Life',25,46,34);txt(CITY_JOBS[g.job].emoji+' '+CITY_JOBS[g.job].name,25,88,23);
 card('Aufgabe '+(g.step+1)+'/4',275,562,250,32);
 txt('🧍',320,442,55);
}
function drawKart(){
 ctx.fillStyle='#70bf86';ctx.fillRect(0,0,800,600);
 drawRound(69,75,662,480,105,'#6d7894');
 drawRound(215,203,368,234,66,'#6aba82');
 ctx.strokeStyle='#fff6d3';ctx.setLineDash([18,19]);ctx.lineWidth=5;
 ctx.strokeRect(106,111,588,410);ctx.setLineDash([]);
 txt('🏎️ Kart Rush',28,35,32,'#122d3e');
 txt('Steuere mit Pfeilen oder WASD durch die vier Tore.',28,69,18,'#1b3b49');
 gates.forEach((gate,i)=>{drawRound(gate.x-29,gate.y-29,58,58,15,i===g.gate?'#fff5ad':'#9bd7e8');txt(i+1,gate.x,gate.y,27,i===g.gate?'#34314a':'#526782','center')});
 ctx.save();ctx.translate(kart.x,kart.y);ctx.rotate(kart.angle+Math.PI/2);
 drawRound(-17,-29,34,59,9,'#f37c74');drawRound(-12,-16,24,26,8,'#c4f4ff');drawRound(-19,18,38,10,4,'#293c59');ctx.restore();
 txt('Runde '+g.laps+' · Nächstes Tor '+(g.gate+1),23,577,20,'#20364c');
}
function drawTreasure(){
 backdrop('#8bd6ee','#5caaa4');
 txt('🏝️ SD Treasure Quest',22,40,32,'#163a58');
 const size=54,ox=129,oy=105;
 for(let y=0;y<8;y++)for(let x=0;x<10;x++){
  const tile=(x+y)%4===0?'#e6d08b':'#d9c584';
  drawRound(ox+x*size,oy+y*size,size-3,size-3,7,tile);
 }
 TREASURE_ITEMS.forEach(([x,y],i)=>{if(!g.found.includes(i))txt('💎',ox+x*size+25,oy+y*size+27,32,'#000','center')});
 TREASURE_KEYS.forEach(([x,y],i)=>{if(!g.keys.includes(i))txt('🗝️',ox+x*size+25,oy+y*size+27,29,'#000','center')});
 txt(g.finished?'✅':'🏰',ox+TREASURE_EXIT[0]*size+26,oy+TREASURE_EXIT[1]*size+27,30,'#000','center');
 txt('🧑',ox+g.x*size+25,oy+g.y*size+27,36,'#000','center');
 txt(g.finished?'🏆 Insel geschafft!':'Finde 3 Schätze und 2 Schlüssel, dann gehe zur Burg.',400,575,20,'#183952','center');
}
function drawFashion(){
 backdrop('#f1d1fa','#e7b9cc');
 txt('👗 SD Fashion Studio',32,48,32);
 txt('Kombiniere Farben. Jede neue Kombination zählt!',32,89,19);
 drawRound(206,121,388,405,43,'#fff9f3');drawRound(240,460,320,22,12,'#ae92ca');
 ctx.fillStyle='#f4c6a8';ctx.beginPath();ctx.arc(400,209,47,0,Math.PI*2);ctx.fill();
 drawRound(354,260,92,133,19,['#f79cbb','#7dbcf4','#83d5ac','#f5cf82','#ad9ce9'][g.shirt]);
 drawRound(370,157,60,19,7,['#f79cbb','#7dbcf4','#83d5ac','#f5cf82','#ad9ce9'][g.hat]);
 drawRound(372,384,24,85,10,'#6e6097');drawRound(407,384,24,85,10,'#6e6097');
 drawRound(354,465,44,20,6,['#f79cbb','#7dbcf4','#83d5ac','#f5cf82','#ad9ce9'][g.shoes]);
 drawRound(407,465,44,20,6,['#f79cbb','#7dbcf4','#83d5ac','#f5cf82','#ad9ce9'][g.shoes]);
 txt('👒 '+COLOR_KEYS[g.hat]+'   👕 '+COLOR_KEYS[g.shirt]+'   👟 '+COLOR_KEYS[g.shoes],400,561,19,'#3c3767','center');
}
function drawLearn(){
 backdrop('#b8cbff','#e8d4ff');
 txt('🧩 SD Lern-Abenteuer',31,53,34);
 if(g.index>=QUESTIONS.length){card('🏆 Lernrunde geschafft!',132,205,536,112);txt('Richtige Antworten: '+g.correct,400,378,28,'#36436e','center');return}
 const q=QUESTIONS[g.index];
 card('📚 '+q.category+' · Aufgabe '+(g.index+1),184,116,432,61);
 drawRound(68,214,664,146,22,'#fffdf9');
 txt(q.q,400,285,27,'#24325e','center');
 q.answers.forEach((answer,i)=>card((i+1)+'. '+answer,94,385+i*58,612,48,i%2===0?'#e2ebff':'#f2e7ff'));
}
function drawSparkles(){
 if(reducedMotion)return;
 // Low-cost original vector particles; never cover the central game controls.
 ctx.save();
 for(let i=0;i<9;i++){
  const x=(i%2?742:39)+(i%3-1)*18;
  const y=100+i*50+Math.sin(elapsed*1.6+i)*9;
  const r=2+Math.abs(Math.sin(elapsed*1.3+i))*.85;
  ctx.fillStyle='rgba(255,255,255,.38)';
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,800,600);
 ({obby:drawObby,pet:drawPet,garden:drawGarden,city:drawCity,kart:drawKart,treasure:drawTreasure,fashion:drawFashion,learn:drawLearn})[id]();
 drawSparkles();
}
function resetObby(){
 const p=levels[g.level].platforms[g.checkpoint];
 obby.x=p[0]+Math.min(55,p[2]/2);obby.y=p[1];obby.vy=0;obby.grounded=true;
}
function updateObby(dt){
 const speed=275,dx=(Number(keys.right)-Number(keys.left))*speed*dt;
 obby.x=Math.max(14,Math.min(786,obby.x+dx));
 const before=obby.y;obby.vy+=1420*dt;obby.y+=obby.vy*dt;
 obby.grounded=false;
 for(let i=0;i<4;i++){
  const [x,y,w]=levels[g.level].platforms[i];
  if(obby.x>x+11&&obby.x<x+w-9&&obby.vy>=0&&before<=y+7&&obby.y>=y){
   if(!obby.grounded)sounds.pulse('land',130);
   obby.y=y;obby.vy=0;obby.grounded=true;
   if(i===1&&g.checkpoint<1)perform('checkpoint',{index:1});
   if(i===2&&g.checkpoint<2)perform('checkpoint',{index:2});
   if(i===3&&g.checkpoint>=2&&obby.x>x+w*.48){perform('finish');resetObby()}
  }
 }
 if(obby.y>650){sounds.play('cancel');resetObby();message('☁️ Kein Problem! Versuche es ab deinem Checkpoint erneut.')}
}
function updateKart(dt){
 const throttle=Number(keys.up)-Number(keys.down),turn=Number(keys.right)-Number(keys.left);
 kart.speed=(kart.speed+throttle*385*dt)*Math.pow(.96,dt*60);
 // Grass slows cars down; returning to the track rewards smoother driving.
 const outer=kart.x>80&&kart.x<720&&kart.y>82&&kart.y<547;
 const inner=kart.x>215&&kart.x<583&&kart.y>203&&kart.y<437;
 if(!outer||inner)kart.speed*=Math.pow(.89,dt*60);
 kart.speed=Math.max(-125,Math.min(270,kart.speed));
 if(Math.abs(kart.speed)>6)kart.angle+=turn*2.8*dt*(kart.speed>=0?1:-1);
 kart.x=Math.max(35,Math.min(765,kart.x+Math.cos(kart.angle)*kart.speed*dt));
 kart.y=Math.max(42,Math.min(565,kart.y+Math.sin(kart.angle)*kart.speed*dt));
 const gate=gates[g.gate];
 if(Math.hypot(kart.x-gate.x,kart.y-gate.y)<49)perform('gate',{index:g.gate});
}
function button(label,handler){
 const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',handler);$('actions').append(b);return b;
}
function updateActions(){
 const a=$('actions');a.replaceChildren();
 if(id==='obby'){button('🚩 Zum Checkpoint zurück',()=>{resetObby();message('Wieder am Checkpoint.')});button('🌈 Level neu starten',()=>{perform('reset');resetObby()})}
 if(id==='pet'){
  const animals=document.createElement('div');animals.className='row';a.append(animals);
  PETS.forEach((emoji,i)=>{const b=document.createElement('button');b.textContent=emoji;b.title='Tier '+(i+1);b.setAttribute('aria-pressed',String(g.selected===i));b.onclick=()=>perform('choose',{index:i});animals.append(b)});
  button('🍎 Füttern',()=>perform('feed'));button('💗 Streicheln',()=>perform('pet'));button('💤 Schlafen',()=>perform('rest'));
 }
 if(id==='garden'){
  for(const [kind,label] of [['plant','🌱 Samen pflanzen'],['water','💧 Gießen'],['harvest','🧺 Ernten']]){
   const b=button(label,()=>{tool=kind;updateActions();draw();message('Werkzeug ausgewählt: '+label)});
   b.classList.toggle('active',tool===kind);
  }
  const beds=document.createElement('div');beds.className='row';beds.setAttribute('role','group');beds.setAttribute('aria-label','Gartenbeete wählen');
  beds.style.display='grid';beds.style.gridTemplateColumns='repeat(3,1fr)';
  for(let i=0;i<9;i++){
   const b=document.createElement('button');b.textContent=(g.plots[i]===0?'🌱':g.plots[i]===1?'🌿':'🌻')+' '+(i+1);
   b.type='button';b.setAttribute('aria-label','Beet '+(i+1)+': '+(g.plots[i]===0?'leer':g.plots[i]===1?'gepflanzt':'erntereif'));
   b.style.minWidth='0';b.style.padding='8px 2px';
   b.addEventListener('click',()=>perform(tool,{index:i}));
   beds.append(b);
  }
  a.append(beds);
 }
 if(id==='city'){
  for(const [job,v] of Object.entries(CITY_JOBS)){
   const b=button(v.emoji+' '+v.name,()=>perform('choose',{job}));b.classList.toggle('active',g.job===job);
  }
  button('✅ '+CITY_JOBS[g.job].tasks[g.step],()=>perform('task'));
 }
 if(id==='kart'){button('🏎️ Kart zurück an den Start',()=>{kart.x=295;kart.y=473;kart.angle=0;kart.speed=0;sounds.play('select');message('Los geht die nächste Runde!')})}
 if(id==='treasure'){button('🗝️ '+g.keys.length+'/2 Schlüssel · 💎 '+g.found.length+'/3 Schätze',()=>message('Suche die Symbole auf der Insel!'))}
 if(id==='fashion'){
  for(const [key,label] of [['hat','👒 Hut'],['shirt','👕 Shirt'],['shoes','👟 Schuhe']]){
   button(label+': '+COLOR_KEYS[g[key]]+' →',()=>perform('color',{part:key,index:(g[key]+1)%COLOR_KEYS.length}));
  }
  button('✨ Auf den Laufsteg!',()=>perform('show'));
 }
 if(id==='learn'){
  if(g.index>=QUESTIONS.length)button('📚 Noch eine Lernrunde',()=>perform('again'));
  else QUESTIONS[g.index].answers.forEach((text,i)=>button((i+1)+'. '+text,()=>perform('answer',{index:i})));
 }
}
function onCanvasClick(e){
 if(paused)return;
 const rect=canvas.getBoundingClientRect();
 const x=(e.clientX-rect.left)*800/rect.width,y=(e.clientY-rect.top)*600/rect.height;
 if(id==='garden'){
  for(let i=0;i<9;i++){
   const px=178+(i%3)*151,py=141+Math.floor(i/3)*139;
   if(x>=px&&x<=px+123&&y>=py&&y<=py+111){perform(tool,{index:i});break}
  }
 }else if(id==='pet')perform('pet');
 else if(id==='city')perform('task');
 else if(id==='learn'&&g.index<QUESTIONS.length){
  for(let i=0;i<3;i++)if(x>=94&&x<=706&&y>=385+i*58&&y<=433+i*58){perform('answer',{index:i});break}
 }
}
function moveOnce(direction){
 if(paused||id!=='treasure')return;
 const d={left:{dx:-1,dy:0},right:{dx:1,dy:0},up:{dx:0,dy:-1},down:{dx:0,dy:1}}[direction];
 if(d)perform('move',d);
}
const KEY_MAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'};
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLButtonElement)return;
 if(e.code==='Escape'&&paused){e.preventDefault();togglePause(false);return}
 if(e.code==='KeyP'&&!e.repeat){e.preventDefault();togglePause();return}
 if(paused)return;
 const k=KEY_MAP[e.code];if(k){e.preventDefault();keys[k]=true;if(!e.repeat)moveOnce(k)}
 if(e.code==='Space'){e.preventDefault();jump()}
 if(id==='learn'&&/^Digit[123]$/.test(e.code)&&!e.repeat&&g.index<QUESTIONS.length)perform('answer',{index:Number(e.code.at(-1))-1});
});
window.addEventListener('keyup',e=>{const k=KEY_MAP[e.code];if(k)keys[k]=false});
window.addEventListener('blur',releaseKeys);
document.querySelectorAll('[data-move]').forEach(b=>{
 const k=b.dataset.move;
 b.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;keys[k]=true;moveOnce(k);try{b.setPointerCapture(e.pointerId)}catch{}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys[k]=false);
});
function jump(){
 if(paused)return;
 if(id==='obby'&&obby.grounded){obby.vy=-680;obby.grounded=false;sounds.play('jump')}
 else if(id==='treasure')moveOnce('up');
 else if(id==='pet')perform('pet');
 else if(id==='city')perform('task');
 else if(id==='fashion')perform('show');
 else if(id==='kart')kart.speed=Math.min(270,kart.speed+60);
}
$('jump').addEventListener('click',jump);
canvas.addEventListener('click',onCanvasClick);
$('sound').addEventListener('click',()=>{
 soundOn=!soundOn;prefs.sound=soundOn;saveSettings(prefs);sounds.setEnabled(soundOn);saveSoundSettings({enabled:soundOn,volume:sounds.volume});$('sound').setAttribute('aria-pressed',String(soundOn));
 $('sound').textContent=soundOn?'🔊 Ton an':'🔇 Ton aus';if(soundOn)sounds.play('select');
});
$('reset').addEventListener('click',()=>{
 if(!window.confirm('Nur dieses Minispiel zurücksetzen? Deine gesammelten Spielsterne bleiben erhalten.'))return;
 restartGame(save,id);persist();
 if(id==='obby')resetObby();
 if(id==='kart')Object.assign(kart,{x:295,y:473,angle:0,speed:0});
 sounds.play('select');message('Minispiel zurückgesetzt.');updateHUD();updateActions();draw();
});
let lastStaticDraw=0;
function frame(now){
 // Clamp time after a suspended tab, keep CPU usage low while paused or hidden.
 const dt=Math.min(.035,Math.max(0,(now-last)/1000||.016));last=now;
 if(!paused&&!document.hidden){
  elapsed+=dt;
  if(id==='kart'&&Math.abs(kart.speed)>38)sounds.pulse('kart',Math.abs(kart.speed)>170?320:550);
  if(id==='obby'&&(keys.left||keys.right)&&obby.grounded)sounds.pulse('step',280);
  if(id==='garden'||id==='pet')sounds.pulse('bird',18000);
  if(id==='obby')updateObby(dt);
  if(id==='kart')updateKart(dt);
  if(id==='obby'||id==='kart')draw();
  else if(now-lastStaticDraw>140){draw();lastStaticDraw=now}
 }
 requestAnimationFrame(frame);
}
$('hint').textContent=({obby:'WASD / Pfeile bewegen · Leertaste springen · Checkpoints berühren.',pet:'Tier auswählen, füttern, streicheln und schlafen.',garden:'Werkzeug wählen und eines der neun Beete antippen.',city:'Beruf wählen und die Aufgaben nacheinander erledigen.',kart:'WASD oder Pfeile: Gas, Bremsen und Lenken. Tore 1–4 nacheinander.',treasure:'Mit Pfeiltasten / WASD die Insel erkunden und alle Schätze finden.',fashion:'Hut, Shirt und Schuhe kombinieren – neue Looks verdienen Sterne.',learn:'Wähle eine Antwort über die Schaltflächen, per Klick oder mit 1, 2 und 3.'})[id];
if(id==='obby')resetObby();
updateHUD();updateActions();draw();persist();
requestAnimationFrame(frame);
window.__sdMiniReady={id,version:2};
