/* Pibo-exclusive 3D character details. All meshes generated from original shapes.
   Do not imitate protected characters, models, art, clothing, or trademarks. */
export function decoratePibo({THREE,cat,head,ell,mat,paws=[],pupils=[]}){
 const cream=mat(0xfff1da),peach=mat(0xe49a63),rose=mat(0xed708b),mint=mat(0x50bfae,.43);
 // Layered cheek tufts give the orange Pibo a distinct friendly silhouette.
 for(const sign of [-1,1]){
  ell(head,cream,sign*.51,-.29,.53,.20,.19,.18);
  for(let i=0;i<3;i++)ell(head,peach,sign*(.40+i*.07),-.33+(i-1)*.075,.703,.015,.016,.012);
  // Soft ear-tip tufts – lighter than Pibo's main orange fur.
  const tuft=new THREE.Mesh(new THREE.ConeGeometry(.105,.24,5),cream);
  tuft.position.set(sign*.5,1.02,-.035);tuft.rotation.z=-sign*.18;head.add(tuft);
  // Fur accents on chest and along his playful front paws.
  for(let t=0;t<2;t++)ell(cat,cream,sign*(.38+t*.09),.235,.78-t*.035,.105,.075,.08);
  ell(cat,peach,sign*.52,.21,.84,.065,.036,.038);
 }
 // A little three-point forehead fringe is Pibo's own identifiable character detail.
 for(const [x,height] of [[-.15,.22],[0,.27],[.15,.20]]){
  const hair=new THREE.Mesh(new THREE.ConeGeometry(.09,height,5),peach);
  hair.position.set(x,.73+height*.3,.08);hair.rotation.z=-x;head.add(hair);
 }
 const chest=ell(cat,cream,0,1.21,.59,.27,.34,.10);
 chest.rotation.z=.04;
 // Small turquoise pet collar and golden paw charm, intentionally not a Tom accessory.
 const band=new THREE.Mesh(new THREE.TorusGeometry(.47,.05,9,32),mint);
 band.position.set(0,1.57,.12);band.rotation.x=Math.PI/2;cat.add(band);
 const pendant=ell(cat,mat(0xffd06b,.3),0,1.47,.57,.11,.12,.045);
 const pawMark=ell(cat,mint,0,1.47,.616,.058,.051,.015);
 const tongue=ell(head,rose,0,-.5,.764,.095,.047,.025);
 tongue.visible=false;
 // Separate rounded toes are parented to each moving forepaw, not the torso.
 // Their transforms therefore follow feeding, touch reactions and garden steps.
 const toeMeshes=[];
 for(const paw of paws){
  for(const dx of [-.49,0,.49]){
   toeMeshes.push(ell(paw,cream,dx,-.22,.8,.32,.34,.22));
  }
  // A small underside pad becomes visible when a paw is lifted.
  ell(paw,rose,0,-.85,.32,.42,.10,.32);
 }
 // Layered wet-looking catchlights track the *existing* animated iris gaze.
 // All geometry is original; no downloaded character textures or meshes.
 const eyeGlints=[];
 const eyeShine=mat(0xffffff,.12),smallShine=mat(0xd9fff4,.18);
 for(const eye of pupils){
  const major=ell(head,eyeShine,eye.x-.035,.185,.803,.032,.052,.012);
  const minor=ell(head,smallShine,eye.x+.046,.04,.801,.019,.025,.011);
  eyeGlints.push({eye,major,minor});
 }
 return {
  update(seconds,opening=0,reducedMotion=false){
   const talk=Math.max(0,Number(opening)||0);
   tongue.visible=talk>.15;
   tongue.position.y=-.49-Math.min(.085,talk*.13);
   for(const {eye,major,minor} of eyeGlints){
    const offset=Number.isFinite(eye.colored?.position?.x)?eye.colored.position.x-eye.x:0;
    major.position.x=eye.x-.035+offset;
    minor.position.x=eye.x+.046+offset;
   }
   if(!reducedMotion)pendant.rotation.z=.075*Math.sin(seconds*2.1);
   pawMark.rotation.z=pendant.rotation.z;
  },
  pendant,tongue,toeMeshes,eyeGlints
 };
}
