/* Pibo Garden: original procedurally built nature zone, without outside assets.
   Animated butterflies and small interactions are GPU-light (no texture imports).
   Any meshes owned by roomProps are disposed by the existing room teardown. */
export function gardenMotion(seconds,reduced=false){
 const t=Number.isFinite(seconds)?seconds:0;
 return {
  flutter:reduced?.22:.35+.55*Math.abs(Math.sin(t*16)),
  bob:reduced?0:.09*Math.sin(t*2.7),
  sway:reduced?0:.10*Math.sin(t*1.4)
 };
}
export function buildPiboGarden({THREE,roomProps,ell,cube,mat}){
 const greens=[0x4aa47e,0x69b790,0x77c69b];
 const butterflies=[];
 const flutterMeshes=[];
 const bloomPositions=[[-3.7,-.3],[-3.4,.3],[-2.8,.4],[2.8,.3],[3.4,-.45],[3.5,.65]];
 // Warm rounded meadow, stylized mint/peach Pibo world rather than a copied game.
 cube(roomProps,0xa4d8b2,0,.04,-2.8,9,.08,4);
 cube(roomProps,0xc0e1be,0,.10,-3.7,9,.07,.5);
 // Rounded fruit tree: trunk with branching canopy and tiny orange fruit.
 cube(roomProps,0x9c7453,-3.3,1.12,-2.7,.30,2.15,.3);
 for(const [x,y,z,sz] of [[-3.3,2.4,-2.7,.73],[-2.86,2.25,-2.66,.51],[-3.67,2.17,-2.67,.55]]){
  ell(roomProps,mat(greens[Math.abs(Math.round(x*10))%greens.length]),x,y,z,sz,sz*.75,sz*.72);
 }
 for(const [x,y,z] of [[-3.2,2.65,-2.03],[-2.85,2.33,-2.14],[-3.6,2.3,-2.05]]){
  ell(roomProps,mat(0xffb35f),x,y,z,.10,.11,.10);
 }
 // Tiny pond with teal water and stepping stones.
 ell(roomProps,mat(0x5fc8c0,.32),2.7,.08,-2.3,.95,.06,.70);
 ell(roomProps,mat(0x98e1da,.27),2.74,.15,-2.20,.70,.025,.48);
 for(const [x,z] of [[2.18,-1.88],[3.18,-1.75],[2.78,-1.62]]){
  ell(roomProps,mat(0xe7e1c2),x,.11,z,.24,.07,.16);
 }
 // Rounded garden bench and a freestanding toy windmill.
 cube(roomProps,0xe4a9aa,1.65,.58,-3.2,1.15,.18,.42);
 cube(roomProps,0xb47c69,1.65,.30,-3.2,.10,.45,.12);
 cube(roomProps,0xb47c69,1.15,.35,-3.2,.10,.45,.12);
 cube(roomProps,0xb47c69,2.15,.35,-3.2,.10,.45,.12);
 cube(roomProps,0xcce9d2,-1.15,1.16,-3.5,.12,2.2,.14);
 const windmill=new THREE.Group();windmill.position.set(-1.15,2.25,-3.36);roomProps.add(windmill);
 for(let k=0;k<4;k++){
  const blade=cube(windmill,k%2?0xffc978:0xf7a0b6,0,.45,0,.16,.82,.055);
  blade.rotation.z=Math.PI*k/2;
  blade.position.set(.45*Math.sin(Math.PI*k/2),.45*Math.cos(Math.PI*k/2),0);
 }
 ell(windmill,mat(0xffffff),0,0,.07,.16,.16,.10);
 for(const [i,[x,z]] of bloomPositions.entries()){
  cube(roomProps,0x47976d,x,.34,z,.055,.49,.055);
  ell(roomProps,mat(0xffe0b0),x,.63,z,.09,.10,.08);
  const petals=[0,Math.PI/2,Math.PI,Math.PI*1.5];
  for(const a of petals){
   ell(roomProps,mat(i%2?0xffc1ce:0xd6a7ff),x+.12*Math.cos(a),.63+.11*Math.sin(a),z+.02,.105,.105,.06);
  }
  ell(roomProps,mat(0x6fc895),x+.10,.37,z,.13,.055,.065);
 }
 for(let i=0;i<3;i++){
  const butterfly=new THREE.Group();
  butterfly.position.set(-.5+i*.75,1.65+(i%2)*.33,-.85);
  const wings=[];
  const colors=[0xffb2cd,0x85dce2,0xffe098];
  for(const sign of [-1,1]){
   const wing=ell(butterfly,mat(colors[i],.42),sign*.21,.03,0,.24,.30,.055);
   wing.rotation.y=sign*.26;
   wings.push({wing,sign});
  }
  ell(butterfly,mat(0x5a6b7a),0,-.02,.04,.07,.28,.07);
  ell(butterfly,mat(0xffffff),-.04,.15,.115,.023,.028,.01);
  ell(butterfly,mat(0xffffff), .04,.15,.115,.023,.028,.01);
  roomProps.add(butterfly);
  butterflies.push(butterfly);flutterMeshes.push(wings);
 }
 function animate(seconds,reduced=false){
  const m=gardenMotion(seconds,reduced);
  windmill.rotation.z=reduced?0:seconds*.32;
  butterflies.forEach((b,i)=>{
   b.position.y=1.72+i*.22+m.bob*Math.sin(seconds*1.5+i);
   b.position.x=-.55+i*.73+(reduced?0:.22*Math.sin(seconds*.7+i));
   b.rotation.z=.08*Math.sin(seconds+i);
   for(const {wing,sign} of flutterMeshes[i])wing.rotation.y=sign*(.25+m.flutter);
  });
 }
 function tryCatch(raycaster){
  for(const b of butterflies){
   if(raycaster.intersectObjects(b.children,true).length){
    // Scare-away / butterfly chase movement, without removing the animal.
    const shift=(Math.random()-.5)*.5;
    b.position.x=Math.max(-2,Math.min(2,b.position.x+shift));
    return true;
   }
  }
  return false;
 }
 return {butterflies,animate,tryCatch,meshCount:roomProps.children.length};
}
