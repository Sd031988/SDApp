// Pibo's original care animation director. All geometry is generated locally.
export class PiboCare {
  constructor({THREE,scene,cat,head,mouth,paws,camera,sound,onStatus}){
    Object.assign(this,{THREE,scene,cat,head,mouth,paws,camera,sound,onStatus});
    this.props=new THREE.Group();scene.add(this.props);this.active=null
  }
  material(color,roughness=.75){return new this.THREE.MeshStandardMaterial({color,roughness})}
  mesh(geometry,color,x,y,z,parent=this.props){
    const m=new this.THREE.Mesh(geometry,this.material(color));m.position.set(x,y,z);
    m.castShadow=true;m.receiveShadow=true;parent.add(m);return m
  }
  orb(color,x,y,z,sx,sy,sz,parent=this.props){
    const m=this.mesh(new this.THREE.SphereGeometry(1,20,14),color,x,y,z,parent);
    m.scale.set(sx,sy,sz);return m
  }
  box(color,x,y,z,w,h,d){
    return this.mesh(new this.THREE.BoxGeometry(w,h,d),color,x,y,z)
  }
  food(index){
    const T=this.THREE,g=new T.Group();this.props.add(g);
    const orb=(c,x,y,z,sx,sy,sz)=>this.orb(c,x,y,z,sx,sy,sz,g);
    if(index===0){orb(0x86b4bf,0,0,0,.31,.16,.13);const fin=this.mesh(new T.ConeGeometry(.17,.28,3),0x75a0ad,-.32,0,0,g);fin.rotation.z=Math.PI/2;orb(0x263a4c,.19,.04,.13,.028,.028,.02)}
    if(index===1){orb(0xb97643,0,0,0,.26,.18,.16);orb(0xf8ead5,.26,-.03,0,.17,.055,.06);orb(0xffffff,.4,-.03,0,.075,.085,.075)}
    if(index===2){const carrot=this.mesh(new T.ConeGeometry(.18,.52,16),0xf38b32,0,0,0,g);carrot.rotation.z=Math.PI/2;orb(0x6eb55c,-.29,0,0,.13,.08,.07)}
    if(index===3){orb(0xe95b51,0,0,0,.22,.21,.2);orb(0x6cac52,.06,.23,0,.12,.04,.07)}
    if(index===4){this.mesh(new T.CylinderGeometry(.31,.22,.13,24),0x7899d9,0,-.1,0,g);for(let i=0;i<6;i++)orb(0xb28a57,(i%3-1)*.12,.01,Math.floor(i/3)*.14-.07,.075,.055,.065)}
    g.position.set(1.45,.62,1.25);return g
  }
  stop(){
    while(this.props.children.length){
      const o=this.props.children[0];this.props.remove(o);
      o.traverse(n=>{n.geometry?.dispose();if(Array.isArray(n.material))n.material.forEach(m=>m.dispose());else n.material?.dispose()})
    }
    this.active=null;this.cat.position.set(0,0,0);this.cat.rotation.set(0,0,0);
    this.cat.scale.set(1,1,1);this.camera.position.x=0;this.camera.lookAt(0,1.35,0);
    this.onStatus(false,'',0)
  }
  start(type,index=0,now=performance.now()){
    this.stop();const duration=type==='sleep'?9000:type==='toilet'?7500:7000;
    const i=this.active={type,start:now,duration,phase:-1,lastSound:now,food:null,blanket:null,water:null};
    if(type==='feed')i.food=this.food(index);
    if(type==='wash'){
      for(let n=0;n<20;n++){const b=this.orb(0xe2faff,-3.2+(n%5)*.33,.95+Math.floor(n/5)*.18,-1.3,.075+(n%3)*.025,.075+(n%3)*.025,.075+(n%3)*.025);b.userData.bubble=n}
      const sponge=this.box(0xf8d16b,-1.8,1.35,-1.1,.3,.16,.25);sponge.userData.sponge=true
    }
    if(type==='sleep'){i.blanket=this.box(0x91a8ed,-2.45,.9,-1.25,1.65,.12,1.15);i.blanket.visible=false}
    if(type==='toilet'){
      i.water=this.mesh(new this.THREE.TorusGeometry(.24,.04,10,32),0x70c5e5,-2.35,.88,-1.1);
      i.water.rotation.x=Math.PI/2;i.water.visible=false
    }
    this.sound('step');this.onStatus(true,'Pibo macht sich bereit',0)
  }
  update(t,now=performance.now()){
    const i=this.active;if(!i)return;
    const p=Math.min(1,(now-i.start)/i.duration);
    if(p>=1){this.stop();return}
    const phase=Math.min(3,Math.floor(p*4));
    const labels={feed:['Zum Futter gehen','Essen ansehen','Lecker kauen','Fertig!'],wash:['In die Wanne steigen','Einseifen','Abspülen','Abtrocknen'],sleep:['Zum Bett gehen','Hinlegen','Schlafen','Aufwachen'],toilet:['Zur Toilette gehen','Hinsetzen','Toilette benutzen','Spülen']};
    if(phase!==i.phase){
      i.phase=phase;
      if(i.type==='wash'&&phase===2)this.sound('splash');
      if(i.type==='sleep'&&phase===2)this.sound('snore');
      if(i.type==='toilet'&&phase===2)this.sound('fart');
      if(i.type==='toilet'&&phase===3){i.water.visible=true;this.sound('flush')}
    }
    this.onStatus(true,labels[i.type][phase],p);
    const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
    const near=smooth(p/.22)*(1-smooth((p-.84)/.16));
    const target=i.type==='feed'?0:i.type==='wash'?-2.55:i.type==='sleep'?-3.1:-2.35;
    this.cat.position.set(target*near,Math.sin(t*18)*.03*near,(i.type==='feed'?0:-1.12)*near);
    this.cat.rotation.set(0,0,0);this.cat.scale.set(1,1,1);
    this.mouth.scale.y=.04;
    this.head.rotation.x=.035*Math.sin(t*1.1);
    this.head.rotation.z=.035*Math.sin(t*1.5);
    for(let j=0;j<this.paws.length;j++){
      const stride=phase===0?.16*Math.max(0,Math.sin(t*14+j*Math.PI)):0;
      const eating=i.type==='feed'&&phase===2?.10*Math.abs(Math.sin(t*10+j*Math.PI)):0;
      const scrubbing=i.type==='wash'&&phase===1?.14*Math.abs(Math.sin(t*8+j*Math.PI)):0;
      this.paws[j].position.y=.21+stride+eating+scrubbing;
    }
    if(i.type==='feed'){
      const q=smooth((p-.22)/.37),f=i.food;
      f.position.set(1.45*(1-q),.62+1.07*q,1.25-.2*q);
      f.scale.setScalar(Math.max(.001,1-smooth((p-.57)/.17)));
      if(p>.42&&p<.78){
        this.head.rotation.x=.12+.09*Math.sin(t*21);this.mouth.scale.y=.04+.13*Math.abs(Math.sin(t*21));
        if(now-i.lastSound>480){this.sound('chew');i.lastSound=now}
      }
    }
    if(i.type==='wash'){
      const inside=smooth((p-.22)/.16)*(1-smooth((p-.79)/.12));
      this.cat.position.y=.15*inside;this.cat.scale.setScalar(1-.26*inside);
      for(const b of this.props.children){
        if(b.userData.bubble!==undefined){const n=b.userData.bubble;b.position.y=.9+((t*.32+n*.17)%1.2);b.position.x=-3.2+(n%5)*.33+.08*Math.sin(t*2+n)}
        if(b.userData.sponge)b.position.y=1.25+.15*Math.sin(t*5)
      }
      if(p>.4&&p<.8)this.head.rotation.z=.13*Math.sin(t*6)
    }
    if(i.type==='sleep'){
      const lying=smooth((p-.24)/.18)*(1-smooth((p-.8)/.13));
      this.cat.scale.setScalar(1-.32*lying);this.cat.rotation.z=-1.32*lying;
      this.cat.position.y=.65*lying;
      i.blanket.visible=lying>.8;i.blanket.position.y=.9+.05*Math.sin(t*2);
    }
    if(i.type==='toilet'){
      const sitting=smooth((p-.23)/.15)*(1-smooth((p-.82)/.14));
      this.cat.position.y=-.28*sitting;this.cat.scale.y=1-.2*sitting;this.cat.rotation.y=.35*sitting;
      if(i.water.visible)i.water.rotation.z+=.17
    }
    this.camera.position.x+=(target*.32*near-this.camera.position.x)*.055;
    this.camera.lookAt(this.camera.position.x*.35,1.35,0)
  }
}
