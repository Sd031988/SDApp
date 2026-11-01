// Original procedural audio for SD Kids. All sounds are synthesized locally; no files, tracking or network.
// The sound context is created only after a user gesture. Browsers may disallow audio until then.
export const SOUND_STORAGE_KEY='sd-kids-audio-v1';
export const SOUND_CUES=Object.freeze([
 'select','cancel','error','success','reward','jump','land','step','checkpoint','finish',
 'collect','build','remove','teleport','water','plant','harvest','feed','pet','sleep',
 'task','kart','lap','key','treasure','fashion','correct','wrong','join','leave','bird','bell','purr','meow'
]);
const cueSet=new Set(SOUND_CUES);
const clamp=(n,low,high)=>Math.min(high,Math.max(low,Number.isFinite(Number(n))?Number(n):low));
export function soundSettings(raw){
 let obj=raw;
 try{if(typeof obj==='string')obj=JSON.parse(obj)}catch{obj=null}
 if(!obj||typeof obj!=='object')obj={};
 return {enabled:obj.enabled===true,volume:clamp(obj.volume===undefined?.65:obj.volume,0,1)};
}
export function loadSoundSettings(storage=globalThis.localStorage){
 try{return soundSettings(storage?.getItem(SOUND_STORAGE_KEY))}catch{return soundSettings(null)}
}
export function saveSoundSettings(settings,storage=globalThis.localStorage){
 const clean=soundSettings(settings);
 try{storage?.setItem(SOUND_STORAGE_KEY,JSON.stringify(clean));return true}catch{return false}
}
export function cueForMini(game,kind,success=true,earned=0){
 if(!success)return 'error';
 const events={
  obby:{checkpoint:'checkpoint',finish:'finish',reset:'select'},
  pet:{choose:'select',feed:'feed',pet:'pet',rest:'sleep'},
  garden:{plant:'plant',water:'water',harvest:'harvest'},
  city:{choose:'select',task:'task'},
  kart:{gate:'checkpoint'},
  treasure:{move:'step'},
  fashion:{color:'select',show:'fashion'},
  learn:{answer:'correct',again:'select'}
 };
 return events[game]?.[kind]|| (earned?'reward':'select');
}
export class SDGameSound{
 constructor({enabled=false,volume=.65,contextFactory,clock}={}){
  this.enabled=!!enabled;this.volume=clamp(volume,0,1);
  this.contextFactory=contextFactory||(()=>{const C=globalThis.AudioContext||globalThis.webkitAudioContext;return C?new C():null});
  this.clock=clock||(()=>Date.now());this.context=null;this.master=null;this.buffer=null;this.last=new Map();
  this.supported=true;
 }
 get ready(){return !!this.context}
 ensure(){
  if(this.context)return this.context;
  if(!this.supported)return null;
  try{
   const c=this.contextFactory();if(!c){this.supported=false;return null}
   this.context=c;
   this.master=c.createGain();this.master.gain.value=this.enabled?this.volume*.28:0;
   if(typeof c.createDynamicsCompressor==='function'){
    const compressor=c.createDynamicsCompressor();this.master.connect(compressor);compressor.connect(c.destination);
   }else this.master.connect(c.destination);
   return c;
  }catch{this.supported=false;return null}
 }
 unlock(){
  if(!this.enabled)return false;
  const c=this.ensure();if(!c)return false;
  if(c.state==='suspended')c.resume().catch(()=>{});
  return true;
 }
 setEnabled(value){
  this.enabled=!!value;
  if(this.master)this.master.gain.value=this.enabled?this.volume*.28:0;
  if(this.enabled)this.unlock();
 }
 setVolume(value){
  this.volume=clamp(value,0,1);
  if(this.master)this.master.gain.value=this.enabled?this.volume*.28:0;
 }
 tone(freq,at,duration,{to=freq,type='sine',gain=.12,attack=.016}={}){
  const c=this.context;if(!c)return;
  const o=c.createOscillator(),g=c.createGain();
  o.type=type;
  o.frequency.setValueAtTime(Math.max(25,freq),at);
  if(to!==freq)o.frequency.exponentialRampToValueAtTime(Math.max(25,to),at+duration);
  g.gain.setValueAtTime(.0001,at);
  g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),at+Math.min(attack,duration*.4));
  g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  o.connect(g);g.connect(this.master);o.start(at);o.stop(at+duration+.008);
 }
 noise(at,duration,{filter='bandpass',freq=650,to=freq,gain=.09}={}){
  const c=this.context;if(!c)return;
  if(!this.buffer){
   const len=Math.floor(c.sampleRate*1.5),b=c.createBuffer(1,len,c.sampleRate),data=b.getChannelData(0);
   for(let i=0;i<len;i++)data[i]=Math.random()*2-1;
   this.buffer=b;
  }
  const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  src.buffer=this.buffer;f.type=filter;f.frequency.setValueAtTime(freq,at);
  if(to!==freq)f.frequency.exponentialRampToValueAtTime(Math.max(30,to),at+duration);
  f.Q.value=.7;g.gain.setValueAtTime(.0001,at);
  g.gain.exponentialRampToValueAtTime(gain,at+.012);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
  src.connect(f);f.connect(g);g.connect(this.master);src.start(at);src.stop(at+duration+.006);
 }
 play(cue,options={}){
  if(!this.enabled||!cueSet.has(cue))return false;
  if(!this.unlock())return false;
  try{
   const t=this.context.currentTime+.008;
   const n=(f,delay=.0,duration=.16,to=f,type='sine',gain=.13)=>this.tone(f,t+delay,duration,{to,type,gain});
   const h=(delay=.0,duration=.12,freq=700,to=freq,gain=.08,filter='bandpass')=>this.noise(t+delay,duration,{freq,to,gain,filter});
   switch(cue){
    case 'select':n(720,0,.075,890,'sine',.08);break;
    case 'cancel':n(440,0,.14,310,'triangle',.09);break;
    case 'error':case 'wrong':n(200,0,.18,175,'triangle',.12);n(155,.12,.18,110,'sine',.08);break;
    case 'correct':case 'success':n(587,0,.13,620);n(784,.105,.2,810);break;
    case 'reward':case 'finish':
     [523,659,784,1047].forEach((f,i)=>n(f,i*.115,.34,f*1.02,'sine',.10));
     break;
    case 'jump':n(220,0,.23,510,'triangle',.12);h(0,.08,450,850,.035);break;
    case 'land':h(0,.09,300,90,.085,'lowpass');n(130,0,.11,80,'sine',.08);break;
    case 'step':h(0,.07,260,110,.065,'lowpass');break;
    case 'checkpoint':n(660,0,.16,810,'sine',.11);n(990,.11,.24,1030);break;
    case 'collect':case 'treasure':n(680,0,.14,920,'sine',.12);n(1100,.11,.2,1450,'sine',.095);break;
    case 'key':n(1200,0,.08,1050,'sine',.12);n(1480,.085,.24,1780,'sine',.08);break;
    case 'build':h(0,.11,500,210,.12,'lowpass');n(190,0,.1,145,'triangle',.10);break;
    case 'remove':h(0,.2,320,810,.09);n(260,.02,.18,130,'triangle',.08);break;
    case 'teleport':[440,660,880].forEach((f,i)=>n(f,i*.085,.35,f*1.35,'sine',.08));break;
    case 'plant':h(0,.20,240,110,.095,'lowpass');n(360,.04,.2,490,'sine',.06);break;
    case 'water':h(0,.45,480,1600,.11);for(let i=0;i<4;i++)n(450+i*55,i*.085,.09,300+i*55,'sine',.044);break;
    case 'harvest':n(440,0,.12,540,'triangle',.11);n(660,.12,.23,790,'sine',.11);break;
    case 'feed':h(0,.13,700,230,.075,'lowpass');h(.16,.12,700,220,.075,'lowpass');n(180,.07,.24,125,'sine',.07);break;
    case 'pet':case 'purr':
     n(70,0,.64,56,'sawtooth',.065);h(.03,.6,250,180,.033,'lowpass');break;
    case 'meow':n(420,0,.28,650,'triangle',.13);n(650,.27,.28,300,'triangle',.11);break;
    case 'sleep':n(170,0,.46,115,'sine',.085);n(145,.53,.52,90,'sine',.055);break;
    case 'task':n(510,0,.13,640,'triangle',.10);n(700,.10,.18,840,'sine',.07);break;
    case 'kart':n(105,0,.17,260,'sawtooth',.065);h(.02,.15,180,280,.04,'lowpass');break;
    case 'lap':n(466,0,.1,560);n(698,.1,.11,830);n(932,.22,.33,1000);break;
    case 'fashion':[622,784,932].forEach((f,i)=>n(f,i*.1,.20,f*1.01,'sine',.085));break;
    case 'join':n(520,0,.15,650);n(880,.1,.27,920);break;
    case 'leave':n(600,0,.14,460);n(400,.12,.2,330);break;
    case 'bird':n(1150,0,.095,1720,'sine',.055);n(1480,.13,.12,1110,'sine',.05);break;
    case 'bell':n(880,0,.55,882,'sine',.058);n(1320,0,.42,1318,'sine',.02);break;
   }
   return true;
  }catch{return false}
 }
 // Repeated movement/ambience can never create a per-frame voice storm.
 pulse(cue,interval=250){
  if(!this.enabled)return false;
  const now=this.clock();
  if(now-(this.last.get(cue)??-Infinity)<interval)return false;
  if(!this.play(cue))return false;
  this.last.set(cue,now);return true;
 }
 async dispose(){
  this.setEnabled(false);
  const c=this.context;this.context=null;this.master=null;this.buffer=null;
  try{await c?.close?.()}catch{}
 }
}
