import {miniIds} from './catalog.mjs';
export const STORAGE_KEY='sd-kids-games-v1', MAX_STARS=100000;
export const PETS=['🐶','🐱','🐰','🦊'];
export const COLOR_KEYS=['rosa','blau','grün','gelb','lila'];
export const CITY_JOBS={
 fire:{emoji:'🚒',name:'Feuerwehr',tasks:['🚨 Alarm annehmen','🧯 Ausrüstung prüfen','🚒 Zum Einsatz fahren','💧 Feuer sicher löschen']},
 health:{emoji:'🏥',name:'Krankenhaus',tasks:['🩺 Patient begrüßen','🌡️ Temperatur messen','🩹 Verband anlegen','💚 Gesundheit prüfen']},
 mail:{emoji:'📬',name:'Lieferdienst',tasks:['📦 Paket sortieren','🗺️ Route prüfen','🚲 Paket zustellen','✅ Empfang bestätigen']},
 school:{emoji:'🎓',name:'Schule',tasks:['📚 Bücher holen','🔡 Wörter erklären','➕ Mathe üben','🏅 Team loben']}
};
export const QUESTIONS=[
 {q:'Was ist das Gegenteil von „groß“?',answers:['klein','schnell','blau'],correct:0,category:'Deutsch'},
 {q:'Wie viel ist 7 + 5?',answers:['11','12','13'],correct:1,category:'Mathe'},
 {q:'Welcher Artikel passt zu „Haus“?',answers:['der','die','das'],correct:2,category:'Deutsch'},
 {q:'Welche Zahl kommt nach 19?',answers:['21','20','18'],correct:1,category:'Mathe'},
 {q:'Was wächst im Garten?',answers:['Blume','Lampe','Schuh'],correct:0,category:'Wissen'},
 {q:'Wie viele Ecken hat ein Dreieck?',answers:['4','3','5'],correct:1,category:'Logik'},
 {q:'Welche Jahreszeit folgt auf Frühling?',answers:['Sommer','Winter','Herbst'],correct:0,category:'Wissen'},
 {q:'Wie schreibt man den Plural von „Kind“?',answers:['Kinde','Kinds','Kinder'],correct:2,category:'Deutsch'},
 {q:'Wie viel ist 6 mal 3?',answers:['16','18','21'],correct:1,category:'Mathe'},
 {q:'Welches Wort ist ein Verb?',answers:['laufen','grün','Tisch'],correct:0,category:'Deutsch'},
 {q:'Was ist die Hälfte von 14?',answers:['6','7','8'],correct:1,category:'Mathe'},
 {q:'Welches Tier kann fliegen?',answers:['Vogel','Katze','Kuh'],correct:0,category:'Wissen'},
 {q:'Welcher Buchstabe kommt nach D?',answers:['C','E','F'],correct:1,category:'Deutsch'},
 {q:'Wie viel ist 20 minus 8?',answers:['14','10','12'],correct:2,category:'Mathe'},
 {q:'Welche Form ist rund?',answers:['Dreieck','Kreis','Quadrat'],correct:1,category:'Logik'},
 {q:'Welcher Satz ist richtig?',answers:['Ich gehe Schule','Ich gehe zur Schule','Ich Schule gehen'],correct:1,category:'Deutsch'}
];
export const TREASURE_ITEMS=[[2,2],[5,1],[8,6]],TREASURE_KEYS=[[1,5],[6,3]],TREASURE_EXIT=[9,0];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number.isFinite(v)?v:min));
export function initialState(){
 return {
  stars:0,visited:[],games:{
   obby:{level:0,checkpoint:0,completed:0},
   pet:{selected:0,food:65,joy:65,energy:65,actions:0,awarded:0},
   garden:{plots:Array(9).fill(0),harvest:0},
   city:{job:'fire',step:0,done:[]},
   kart:{laps:0,gate:0,awarded:0},
   treasure:{x:0,y:7,found:[],keys:[],finished:false},
   fashion:{shirt:0,hat:0,shoes:0,shown:[]},
   learn:{index:0,solved:[],correct:0}
  }
 };
}
export function sanitize(raw){
 const out=initialState();let data=raw;
 try{if(typeof data==='string')data=JSON.parse(data)}catch{return out}
 if(!data||typeof data!=='object'||!data.games||typeof data.games!=='object')return out;
 out.stars=clamp(Math.floor(Number(data.stars)),0,MAX_STARS);
 out.visited=Array.isArray(data.visited)?[...new Set(data.visited.filter(id=>miniIds.includes(id)))]:[];
 const source=data.games;
 for(const id of miniIds){
  const part=source[id];if(!part||typeof part!=='object')continue;
  const g=out.games[id];
  if(id==='obby'){g.level=clamp(Math.floor(Number(part.level)),0,2);g.checkpoint=clamp(Math.floor(Number(part.checkpoint)),0,2);g.completed=clamp(Math.floor(Number(part.completed)),0,3)}
  if(id==='pet'){for(const k of ['selected','food','joy','energy','actions','awarded'])g[k]=clamp(Math.floor(Number(part[k])),0,k==='selected'?3:k==='awarded'?20:k==='actions'?10000:100)}
  if(id==='garden'){g.plots=Array.isArray(part.plots)?Array.from({length:9},(_,i)=>clamp(Math.floor(Number(part.plots[i])),0,2)):Array(9).fill(0);g.harvest=clamp(Math.floor(Number(part.harvest)),0,10000)}
  if(id==='city'){g.job=Object.hasOwn(CITY_JOBS,part.job)?part.job:'fire';g.step=clamp(Math.floor(Number(part.step)),0,3);g.done=Array.isArray(part.done)?[...new Set(part.done.filter(k=>Object.hasOwn(CITY_JOBS,k)))]:[]}
  if(id==='kart'){g.laps=clamp(Math.floor(Number(part.laps)),0,999);g.gate=clamp(Math.floor(Number(part.gate)),0,3);g.awarded=clamp(Math.floor(Number(part.awarded)),0,3)}
  if(id==='treasure'){g.x=clamp(Math.floor(Number(part.x)),0,9);g.y=clamp(Math.floor(Number(part.y)),0,7);g.found=validIndices(part.found,3);g.keys=validIndices(part.keys,2);g.finished=part.finished===true}
  if(id==='fashion'){for(const k of ['shirt','hat','shoes'])g[k]=clamp(Math.floor(Number(part[k])),0,COLOR_KEYS.length-1);g.shown=Array.isArray(part.shown)?[...new Set(part.shown.filter(x=>typeof x==='string'&&/^\d:\d:\d$/.test(x)))].slice(0,25):[]}
  if(id==='learn'){g.index=clamp(Math.floor(Number(part.index)),0,QUESTIONS.length);g.solved=validIndices(part.solved,QUESTIONS.length);g.correct=clamp(Math.floor(Number(part.correct)),0,QUESTIONS.length)}
 }
 return out;
}
function validIndices(values,length){return Array.isArray(values)?[...new Set(values.filter(v=>Number.isInteger(v)&&v>=0&&v<length))]:[]}
export function earn(s,n){const before=s.stars;s.stars=clamp(s.stars+Math.max(0,Math.floor(n)),0,MAX_STARS);return s.stars-before}
export function visit(s,id){if(!miniIds.includes(id))return false;if(!s.visited.includes(id))s.visited.push(id);return true}
export function action(save,id,kind,payload={}){
 if(!miniIds.includes(id))return {ok:false,message:'Spiel unbekannt'};
 const g=save.games[id];let message='',reward=0,ok=true;
 const index=Number(payload.index);
 switch(id){
 case 'obby':
  if(kind==='checkpoint'&&Number.isInteger(index)&&index===g.checkpoint+1&&index<=2){g.checkpoint=index;message='🚩 Checkpoint erreicht!'}
  else if(kind==='finish'&&g.checkpoint>=2){if(g.completed<=g.level)reward=20;g.completed=Math.max(g.completed,g.level+1);g.level=(g.level+1)%3;g.checkpoint=0;message='🏁 Level geschafft!'}
  else if(kind==='reset'){g.checkpoint=0;message='Neuer Versuch!'}
  else ok=false;
  break;
 case 'pet':
  if(kind==='choose'&&Number.isInteger(index)&&index>=0&&index<PETS.length){g.selected=index;message='Neues Haustier!'}
  else if(['feed','pet','rest'].includes(kind)){
   if(kind==='feed'){g.food=clamp(g.food+24,0,100);g.joy=clamp(g.joy+5,0,100);message='🍎 Lecker!'}
   if(kind==='pet'){g.joy=clamp(g.joy+25,0,100);g.energy=clamp(g.energy-5,0,100);message='💗 Wie schön!'}
   if(kind==='rest'){g.energy=clamp(g.energy+30,0,100);message='💤 Gut geschlafen!'}
   g.actions++;const milestone=Math.min(20,Math.floor(g.actions/5));if(milestone>g.awarded){reward=(milestone-g.awarded)*5;g.awarded=milestone}
  }else ok=false;
  break;
 case 'garden':
  if(!Number.isInteger(index)||index<0||index>8){ok=false;break}
  if(kind==='plant'&&g.plots[index]===0){g.plots[index]=1;message='🌱 Samen gepflanzt!'}
  else if(kind==='water'&&g.plots[index]===1){g.plots[index]=2;message='💧 Die Pflanze ist gewachsen!'}
  else if(kind==='harvest'&&g.plots[index]===2){g.plots[index]=0;g.harvest++;reward=5;message='🌻 Geerntet!'}
  else ok=false;
  break;
 case 'city':
  if(kind==='choose'&&Object.hasOwn(CITY_JOBS,payload.job)){g.job=payload.job;g.step=0;message='Beruf ausgewählt!'}
  else if(kind==='task'){
   const job=g.job;g.step++;message='✅ Aufgabe erledigt!';
   if(g.step===4){g.step=0;if(!g.done.includes(job)){g.done.push(job);reward=15}message='🏅 Mission abgeschlossen!'}
  }else ok=false;
  break;
 case 'kart':
  if(kind==='gate'&&Number.isInteger(index)&&index===g.gate){
   g.gate=(g.gate+1)%4;message='🏎️ Checkpoint!';
   if(g.gate===0){g.laps++;if(g.awarded<3){reward=15;g.awarded++}message='🏆 Eine Runde geschafft!'}
  }else ok=false;
  break;
 case 'treasure':
  if(kind==='move'&&Number.isInteger(payload.dx)&&Number.isInteger(payload.dy)&&Math.abs(payload.dx)+Math.abs(payload.dy)===1){
   g.x=clamp(g.x+payload.dx,0,9);g.y=clamp(g.y+payload.dy,0,7);
   TREASURE_KEYS.forEach(([x,y],i)=>{if(g.x===x&&g.y===y&&!g.keys.includes(i)){g.keys.push(i);message='🗝️ Schlüssel gefunden!'}});
   TREASURE_ITEMS.forEach(([x,y],i)=>{if(g.x===x&&g.y===y&&!g.found.includes(i)){g.found.push(i);reward+=5;message='💎 Schatz entdeckt!'}});
   if(g.x===TREASURE_EXIT[0]&&g.y===TREASURE_EXIT[1]&&g.keys.length===2&&g.found.length===3&&!g.finished){g.finished=true;reward+=25;message='🏆 Schatzinsel geschafft!'}
   if(!message)message='Insel erkundet.';
  }else ok=false;
  break;
 case 'fashion':
  if(kind==='color'&&['shirt','hat','shoes'].includes(payload.part)&&Number.isInteger(index)&&index>=0&&index<COLOR_KEYS.length){g[payload.part]=index;message='🎨 Outfit verändert!'}
  else if(kind==='show'){const signature=`${g.shirt}:${g.hat}:${g.shoes}`;if(!g.shown.includes(signature)&&g.shown.length<25){g.shown.push(signature);reward=8;message='✨ Neue Kombination auf dem Laufsteg!'}else message='🎀 Outfit schon gezeigt!'}
  else ok=false;
  break;
 case 'learn':
  if(kind==='answer'&&g.index<QUESTIONS.length&&Number.isInteger(index)&&index>=0&&index<3){
   const cur=g.index;g.index++;const correct=index===QUESTIONS[cur].correct;
   if(correct&&!g.solved.includes(cur)){g.solved.push(cur);g.correct++;reward=4}
   message=correct?'✅ Richtig!':'💡 Noch einmal üben. Richtig ist: '+QUESTIONS[cur].answers[QUESTIONS[cur].correct];
  }else if(kind==='again'&&g.index>=QUESTIONS.length){g.index=0;message='Neue Lernrunde!'}
  else ok=false;
  break;
 }
 if(!ok)return {ok:false,message:'Diese Aktion ist gerade nicht möglich.'};
 if(reward)earn(save,reward);
 return {ok:true,message,reward};
}
