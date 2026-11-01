// SD BlockWorld companion: voluntary, anonymous, temporary shared-room service.
// The German-learning API is reused, but this game never accesses /hub/ki or any private agent route.
export const SERVER_URL='https://sd-maschinen-kenner.onrender.com';
export const ROOM_IDS=['dorf','kreativ','parkour'];

export class BlockWorldOnline {
  constructor({onState=()=>{},onStatus=()=>{}}={}){
    this.onState=onState;
    this.onStatus=onStatus;
    this.token=null;
    this.room=null;
    this.timer=null;
    this.busy=false;
    this.failures=0;
    this.generation=0;
  }
  get connected(){return Boolean(this.token)}
  async request(path,body={},timeout=15000){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{
      const response=await fetch(SERVER_URL+'/hub/blockworld/'+path,{
        method:'POST',mode:'cors',cache:'no-store',signal:controller.signal,
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      });
      const data=await response.json();
      if(!response.ok||!data.ok)throw Error(data.error||'Serverantwort: '+response.status);
      return data;
    }finally{clearTimeout(timer)}
  }
  async join(room){
    if(!ROOM_IDS.includes(room))throw Error('Unbekannter Spielraum');
    this.disconnect();
    const generation=this.generation;
    this.onStatus('Der Render-Server wird verbunden …');
    try{
      // A Render Free instance may need to wake up after inactivity.
      const result=await this.request('join',{room},75000);
      if(generation!==this.generation)return false;
      this.token=result.token;this.room=room;this.failures=0;
      this.onState(result);
      this.onStatus('Verbunden mit '+({dorf:'Dorf',kreativ:'Kreativwelt',parkour:'Parcours'}[room])+' · Gemeinsame Welt ist nur vorübergehend.');
      this.timer=setInterval(()=>this.poll(),1650);
      return true;
    }catch(error){
      if(generation===this.generation)this.onStatus('Offline-Modus: '+error.message);
      return false;
    }
  }
  async poll(position){
    if(!this.token||this.busy)return;
    this.busy=true;
    const generation=this.generation,token=this.token;
    try{
      const result=await this.request('sync',{token,position:position||this.position?.()||{x:0,z:5,y:0,color:'blue'}});
      if(generation!==this.generation)return;
      this.failures=0;this.onState(result);
    }catch(error){
      if(generation!==this.generation)return;
      if(++this.failures>=3){
        this.disconnect();
        this.onStatus('Serververbindung unterbrochen. Du kannst offline weiterspielen.');
      }
    }finally{this.busy=false}
  }
  async build(operation,block){
    if(!this.token)return false;
    try{
      await this.request('build',{token:this.token,operation,block});
      // Sync promptly after successful building; ordinary polling handles other players.
      return true;
    }catch(error){
      this.onStatus('Online-Bauen: '+error.message);
      return false;
    }
  }
  disconnect(){
    const token=this.token;
    this.generation++;
    this.token=null;this.room=null;
    if(this.timer)clearInterval(this.timer);
    this.timer=null;this.busy=false;this.failures=0;
    if(token)this.request('leave',{token},4500).catch(()=>{});
    this.onState({players:[],blocks:[]});
  }
}
