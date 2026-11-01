// Pibo sound engine: original synthesized effects + optional real CC0/public-domain cat recordings.
// Real audio loads from Wikimedia Commons only after a user's sound-triggering interaction;
// if unavailable it gracefully falls back to the procedural sound engine.
export class PiboAudio {
  constructor(){
    this.ctx=null;this.master=null;this.noiseBuffer=null;this.volume=.65;
    this.realCatClips={
      meow:['https://commons.wikimedia.org/wiki/Special:Redirect/file/Maullido_de_gata_hembra_joven.ogg',
        'https://commons.wikimedia.org/wiki/Special:Redirect/file/Maullido_de_gata_hembra.ogg'],
      purr:'https://commons.wikimedia.org/wiki/Special:Redirect/file/Whiskers%27_purr.ogg'
    };
    this.realVoice=null;this.meowTurn=0;
  }
  playRecording(type){
    if(!this.realCatClips[type]||typeof window==='undefined'||typeof window.Audio!=='function')return false;
    try{
      if(this.realVoice){this.realVoice.pause();this.realVoice=null}
      const candidates=this.realCatClips[type];
      const url=Array.isArray(candidates)?candidates[this.meowTurn++%candidates.length]:candidates;
      const voice=new window.Audio(url);
      voice.preload='none';
      voice.volume=Math.min(1,Math.max(0,this.volume*.9));
      this.realVoice=voice;
      let finished=false;
      const fallback=()=>{
        if(finished)return;finished=true;
        if(this.realVoice===voice)this.realVoice=null;
        this.playSynth(type);
      };
      voice.addEventListener?.('error',fallback,{once:true});
      voice.addEventListener?.('ended',()=>{if(this.realVoice===voice)this.realVoice=null},{once:true});
      const result=voice.play();
      if(result?.catch)result.catch(fallback);
      return true;
    }catch(e){return false}
  }
  setVolume(value){
    this.volume=Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):.65));
    if(this.master)this.master.gain.value=this.volume;
    if(this.realVoice)this.realVoice.volume=Math.min(1,this.volume*.9);
  }
  ensure(){
    if(this.ctx)return this.ctx;
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
    const c=this.ctx=new C(),compress=c.createDynamicsCompressor(),master=this.master=c.createGain();
    master.gain.value=this.volume;master.connect(compress);compress.connect(c.destination);
    const n=Math.floor(c.sampleRate*3),buffer=c.createBuffer(1,n,c.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<n;i++)data[i]=Math.random()*2-1;
    this.noiseBuffer=buffer;return c
  }
  gain(at,duration,volume=.18){
    const c=this.ctx,g=c.createGain();g.gain.setValueAtTime(.0001,at);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),at+.025);
    g.gain.exponentialRampToValueAtTime(.0001,at+duration);
    g.connect(this.master);return g
  }
  tone(freq,at,duration,volume=.1,type='sine',endFreq=freq){
    const c=this.ctx,o=c.createOscillator();o.type=type;
    o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),at+duration);
    o.connect(this.gain(at,duration,volume));o.start(at);o.stop(at+duration+.02);return o
  }
  noise(at,duration,volume=.15,filterType='bandpass',frequency=700,endFrequency=frequency){
    const c=this.ctx,src=c.createBufferSource(),f=c.createBiquadFilter();src.buffer=this.noiseBuffer;f.type=filterType;
    f.frequency.setValueAtTime(frequency,at);f.frequency.exponentialRampToValueAtTime(Math.max(30,endFrequency),at+duration);
    f.Q.value=.7;src.connect(f);f.connect(this.gain(at,duration,volume));src.start(at);src.stop(at+duration+.02)
  }
  play(type='meow'){
    if((type==='meow'||type==='purr')&&this.playRecording(type))return;
    this.playSynth(type);
  }
  playSynth(type='meow'){
    try{
      const c=this.ensure();if(!c)return;c.resume().catch(()=>{});const t=c.currentTime+.005;
      if(type==='meow'){
        const main=this.tone(390,t,.72,.12,'triangle',270);
        main.frequency.setValueAtTime(390,t);main.frequency.exponentialRampToValueAtTime(590,t+.18);
        main.frequency.exponentialRampToValueAtTime(270,t+.72);
        const overtone=this.tone(780,t+.015,.55,.026,'sine',540);
        overtone.frequency.exponentialRampToValueAtTime(1080,t+.2);
        overtone.frequency.exponentialRampToValueAtTime(540,t+.565);
        this.noise(t+.04,.42,.014,'bandpass',1150,480);
      } else if(type==='purr'){
        const voice=c.createOscillator(),vibrato=c.createOscillator(),depth=c.createGain(),envelope=this.gain(t,.85,.065);
        voice.type='sawtooth';voice.frequency.setValueAtTime(66,t);voice.frequency.exponentialRampToValueAtTime(58,t+.85);
        vibrato.frequency.value=24;depth.gain.value=.025;vibrato.connect(depth);depth.connect(envelope.gain);
        voice.connect(envelope);voice.start(t);voice.stop(t+.87);vibrato.start(t);vibrato.stop(t+.85);
        this.noise(t,.8,.028,'lowpass',260,210);
      } else if(type==='chew'){
        for(let i=0;i<3;i++){this.noise(t+i*.21,.1,.07,'lowpass',650,260);this.tone(170,t+i*.21,.075,.03,'sine',95)}
      } else if(type==='step'){
        for(let i=0;i<4;i++)this.noise(t+i*.13,.075,.045,'lowpass',270,90);
      } else if(type==='water'||type==='splash'){
        this.noise(t,type==='water'?1.3:.65,.12,'bandpass',850,1700);
        for(let i=0;i<5;i++)this.tone(360+i*30,t+i*.16,.09,.023,'sine',130+i*10);
      } else if(type==='flush'){
        this.noise(t,2.2,.22,'bandpass',350,1800);
        this.noise(t+.4,1.5,.11,'lowpass',520,140);
        this.tone(95,t,1.5,.04,'sine',60);
      } else if(type==='fart'){
        this.tone(125,t,.57,.14,'sawtooth',48);this.noise(t,.5,.045,'lowpass',170,65);
      } else if(type==='snore'){
        for(let i=0;i<2;i++){this.noise(t+i*.85,.65,.055,'lowpass',340,120);this.tone(85,t+i*.85,.55,.035,'sine',60)}
      } else if(type==='gift'){
        [523,659,784,1047].forEach((f,i)=>this.tone(f,t+i*.14,.46,.07,'sine',f*1.015));
      } else if(type==='photo'){
        this.noise(t,.08,.065,'highpass',1500,600);this.tone(600,t+.045,.09,.05,'triangle',310);
      } else if(type==='select'){
        this.tone(780,t,.12,.045,'sine',1000);
      } else {
        this.tone(420,t,.3,.05,'triangle',350)
      }
    }catch(e){console.warn('Pibo audio unavailable',e)}
  }
}
