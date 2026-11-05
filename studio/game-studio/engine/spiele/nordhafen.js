// ════════════════════════════════════════════════════════════════════════════
// NORDHAFEN – Schattenoperation | SD Game-Studio
// Originales 3D-Taktikspiel mit der bestehenden SD Engine. Babylon + Havok.
// Kein PUBG-Inhalt, keine Marken-Assets. Alles darf im Skript verändert werden.
// Hochwertige GLB-Modelle lassen sich in der Werkstatt als "Meine Modelle" laden.
// ════════════════════════════════════════════════════════════════════════════
const SEED = 86;
const r = sd.zufall(SEED);
const BAB = sd.BABYLON;
const scene = sd.szene;
const mobil = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const sparsam = mobil || sd.engine.getRenderWidth() < 800;
const P = (x, z, dy = 0) => [x, sd.hoehe(x, z) + dy, z];
const HAFEN = [-83, 48], DORF = [124, -72], RADAR = [74, 167];
const flach = [
  [-98, 30, 115, 3.2],
  [124, -73, 92, 4.0],
  [74, 164, 74, 10.5],
  [-145, -151, 56, 4.0],
  [-184, 198, 45, 6.0]
];

sd.himmel({ zeit: 'abend', nebel: 0.0017 });
sd.gelaende({ groesse: 820, aufloesung: sparsam ? 135 : 205, hoehe: 18, wasser: -5, seed: SEED, flach });
sd.tageszeit({ stunde: 17, minutenProTag: 30 });
sd.wetter({ wind: 0.30 });
sd.wasserWellen();
if (!sparsam) sd.gras();
sd.musik('auto');

// PBR-Oberflächen. Echte, optional geladene Texturen: Poly Haven (CC0).
// Fällt ein Bilddownload aus, bleibt die Szene mit farbigen PBR-Materialien spielbar.
function pbr(name, color, roughness = .83, metallic = 0) {
  const mat = new BAB.PBRMaterial('nord_' + name, scene);
  mat.albedoColor = BAB.Color3.FromHexString(color);
  mat.roughness = roughness;
  mat.metallic = metallic;
  return mat;
}
const materials = {
  asphalt: pbr('asphalt', '#aba8a1', .98),
  concrete: pbr('concrete', '#a2a29d', .94),
  steel: pbr('steel', '#666e71', .52, .73),
  rust: pbr('rust', '#785f4b', .93, .45),
  dark: pbr('dark', '#272e2e', .8, .4),
  olive: pbr('olive', '#60664d', .85, .19),
  signal: pbr('signal', '#ffd7a6', .28, .1)
};
materials.signal.emissiveColor = BAB.Color3.FromHexString('#ffc278');
materials.signal.emissiveIntensity = 1.4;

function textur(mat, basis, u = 1, v = 1) {
  if (sparsam) return;
  const quelle = 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/' + basis + '/' + basis;
  try {
    mat.albedoTexture = new BAB.Texture(quelle + '_diff_1k.jpg', scene, false, false,
      BAB.Texture.TRILINEAR_SAMPLINGMODE,
      () => {},
      () => { if (mat.albedoTexture) { mat.albedoTexture.dispose(); mat.albedoTexture = null; } });
    mat.albedoTexture.uScale = u; mat.albedoTexture.vScale = v;
    mat.bumpTexture = new BAB.Texture(quelle + '_nor_gl_1k.jpg', scene, false, false,
      BAB.Texture.TRILINEAR_SAMPLINGMODE,
      () => {},
      () => { if (mat.bumpTexture) { mat.bumpTexture.dispose(); mat.bumpTexture = null; } });
    mat.bumpTexture.uScale = u; mat.bumpTexture.vScale = v;
    mat.bumpTexture.level = .65;
  } catch (e) {
    mat.albedoTexture = null; mat.bumpTexture = null;
  }
}
textur(materials.asphalt, 'asphalt_03', 9, 9);
textur(materials.concrete, 'concrete_floor', 7, 7);

// Aufgeschüttete, befahrbare Areale liegen auf den flachen Teilen des Geländes.
function bodenplatte(name, x, z, breite, tiefe, material) {
  const m = BAB.MeshBuilder.CreateGround('nord_' + name, { width: breite, height: tiefe, subdivisions: 2 }, scene);
  m.position.set(x, sd.hoehe(x, z) + .035, z);
  m.material = material;
  m.isPickable = false;
  m.receiveShadows = true;
  return m;
}
bodenplatte('containerplatz', -99, 38, 118, 102, materials.concrete);
bodenplatte('strassenplatz', 124, -72, 128, 62, materials.asphalt);
bodenplatte('radarplatte', 74, 162, 94, 78, materials.concrete);

// Dichte, aber gezielt freie Bereiche, damit Fahrzeuge und Gegner Platz haben.
sd.baeume({ anzahl: sparsam ? 145 : 320, bereich: 370, seed: SEED + 1,
  art: 'gemischt', minHoehe: 0.5, frei: [[-98, 30, 130], [124, -73, 112],
    [74, 164, 94], [-145, -151, 65], [-184, 198, 50]] });
if (!sparsam) sd.baeume({ anzahl: 55, bereich: 370, seed: SEED + 2,
  art: 'nadel', minHoehe: 0.5, frei: [[-98, 30, 125], [124, -73, 108], [74, 164, 90]] });

// Begehbare Häuser und Industriegebäude aus der bestehenden Engine.
const hausFelder = [
  [-132,-43,11,9,2,'putz','#a2a5a1',0], [-80,-47,14,10,2,'ziegel','#aaa097',90],
  [-40,-42,12,9,1,'beton','#858b8c',20], [-135,89,13,10,2,'beton','#a1a49f',0],
  [-87,99,16,12,2,'metall','#8f9898',90], [-39,105,11,9,2,'putz','#b1aca1',0],
  [88,-91,10,9,2,'putz','#b7b7a9',32], [126,-40,14,10,2,'ziegel','#ae9e8c',30],
  [168,-85,11,9,1,'holz','#918472',22], [132,-121,12,10,2,'putz','#b7ae9f',8],
  [50,146,14,12,2,'beton','#9a9b9a',0], [100,177,12,10,2,'metall','#788488',35]
];
for (const [x,z,b,t,st,mat,col,rot] of hausFelder) sd.haus({
  pos:[x,null,z], breite:b, tiefe:t, stockwerke:st,
  material:mat, farbe:col, dach:'flach', drehung:rot,
  dachTreppe:st > 1, balkone:false
});

// Requisiten mit echter Kollision: Containertürme, Sperren und Paletten.
function container(x,z,rot,color,lage=0) {
  const laenge=12.1, breite=2.45, h=2.58, y=sd.hoehe(x,z)+h/2+lage*h;
  const m=sd.box({ pos:[x,y,z], groesse:[breite,h,laenge],
    textur:'metall', farbe:color, rauheit:.83, metall:.35, drehung:[0,rot,0] });
  // Rippen in die wirkliche, mitdrehende Containergeometrie einbauen.
  const rip= BAB.MeshBuilder.CreateBox('nord_container_rippe', {width:.07,height:2.3,depth:.11},scene);
  rip.parent=m; rip.position.set(breite/2+.033,0,-laenge/2+.48);
  rip.material=materials.steel; rip.isPickable=false;
  for(let i=1;i<13;i++){const a=rip.createInstance('nord_rippe_'+i);a.parent=m;a.position.set(breite/2+.033,0,-laenge/2+.48+i*.85);a.isPickable=false;}
  if(lage===0){ // Warnstreifen an der Stirnseite
    const stripe=BAB.MeshBuilder.CreateBox('nord_container_markierung',{width:1.45,height:.08,depth:.035},scene);
    stripe.parent=m;stripe.position.set(0,.72,laenge/2+.015);
    stripe.material=materials.olive;stripe.isPickable=false;
  }
  return m;
}
for (const c of [
  [-117,29,90,'#6c8179',0],[-123,45,90,'#777d7b',0],[-109,61,0,'#78705f',0],
  [-76,18,0,'#737e72',0],[-59,39,90,'#818387',0],[-59,52,90,'#646d65',0],
  [-117,29,90,'#a08a6f',1],[-109,61,0,'#5e707b',1]
]) container(...c);

function sperre(x,z,rot=0) {
  const y=sd.hoehe(x,z)+.66;
  sd.box({pos:[x,y,z],groesse:[4.6,1.32,.75],textur:'beton',
    farbe:'#b1ada2',drehung:[0,rot,0]});
}
for(const a of [[-152,-15,0],[-152,1,0],[-20,20,90],[-20,35,90],
 [72,-119,15],[181,-65,-20],[38,115,90],[119,137,0]])sperre(...a);

// Metallzaun mit instanzierten Pfosten. Dekorationen sind nicht schussblockend;
// Kollisionsbarrieren stehen separat daneben, damit die Steuerung stabil bleibt.
function zaun(ax,az,bx,bz,abstand=3.5){
  const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/abstand));
  const x0=ax,z0=az,dx=(bx-ax)/n,dz=(bz-az)/n;
  const st=BAB.MeshBuilder.CreateCylinder('nord_zaunpfosten',{diameter:.075,height:2.3,tessellation:8},scene);
  st.material=materials.steel;st.isPickable=false;
  for(let i=0;i<=n;i++){
    const x=x0+i*dx,z=z0+i*dz;
    const e=i===0?st:st.createInstance('nord_pfosten_'+i);
    e.position.set(x,sd.hoehe(x,z)+1.15,z);e.isPickable=false;
  }
  for(const yOff of [.55,1.85]){
    const midX=(ax+bx)/2,midZ=(az+bz)/2;
    const l=Math.hypot(bx-ax,bz-az);
    const bar=BAB.MeshBuilder.CreateBox('nord_zaunstrebe',{width:.045,height:.055,depth:l},scene);
    bar.position.set(midX,sd.hoehe(midX,midZ)+yOff,midZ);
    bar.rotation.y=Math.atan2(bx-ax,bz-az);bar.material=materials.steel;bar.isPickable=false;
  }
}
zaun(-167,-3,-164,113);zaun(-164,113,-13,113);zaun(-13,113,-13,75);
zaun(19,111,20,207);zaun(20,207,129,207);zaun(129,207,132,126);

// Sichtbare Beleuchtung mit PBR-Materialien und budgetierten Lichtquellen.
const leuchten=[];
function mast(x,z,lichtAn=true){
  const y=sd.hoehe(x,z);
  sd.zylinder({pos:[x,y+3.5,z],hoehe:7,radius:.09,farbe:'#656b6b',textur:'metall'});
  const arm=BAB.MeshBuilder.CreateBox('nord_mastarm',{width:1.3,height:.10,depth:.14},scene);
  arm.position.set(x+.55,y+6.85,z);arm.material=materials.steel;
  const lampe=BAB.MeshBuilder.CreateBox('nord_lampe',{width:.65,height:.12,depth:.42},scene);
  lampe.position.set(x+1.07,y+6.72,z);lampe.material=materials.signal;
  lampe.isPickable=false;
  if(lichtAn && !sparsam) {
    const light=new BAB.PointLight('nord_platzlicht',new BAB.Vector3(x+1,y+6.4,z),scene);
    light.diffuse=BAB.Color3.FromHexString('#ffe6ba');light.intensity=.8;
    light.range=19;leuchten.push(light);
  }
}
for(const a of [[-152,7],[-35,10],[-150,109],[-24,103],[38,123],[112,212]])
mast(...a);

// Militärischer Radaraufbau und Leuchtfeuer, als eigenständige PBR-Objekte.
const radarPivot=new BAB.TransformNode('nord_radar_drehpunkt',scene);
radarPivot.position.set(72,sd.hoehe(72,172)+13.2,172);
sd.zylinder({pos:[72,sd.hoehe(72,172)+6.6,172],hoehe:13.2,radius:1.05,
 textur:'metall',farbe:'#777e82'});
const teller=BAB.MeshBuilder.CreateSphere('nord_radarschale',{diameter:6,segments:sparsam?12:28,slice:.23},scene);
teller.parent=radarPivot;teller.rotation.x=.35;teller.material=materials.steel;
teller.isPickable=false;
const antenne=BAB.MeshBuilder.CreateCylinder('nord_radar_nabe',{diameter:.18,height:4,tessellation:12},scene);
antenne.parent=radarPivot;antenne.rotation.x=Math.PI/2;antenne.material=materials.dark;
antenne.position.set(0,.4,1.25);antenne.isPickable=false;
const signal=BAB.MeshBuilder.CreateSphere('nord_signal',{diameter:.35,segments:12},scene);
signal.position.set(72,sd.hoehe(72,172)+15.4,172);
signal.material=materials.signal;signal.isPickable=false;

// Gleise und Packlager, nur als optische Verfeinerung.
function gleis(x,z,laenge=90) {
  const y=sd.hoehe(x,z)+.08;
  for(const side of [-1,1]){
    const rail=BAB.MeshBuilder.CreateBox('nord_schiene',{width:.11,height:.11,depth:laenge},scene);
    rail.position.set(x+side*.75,y+.12,z);rail.material=materials.steel;rail.isPickable=false;
  }
  const sleeper=BAB.MeshBuilder.CreateBox('nord_schwelle',{width:2.2,height:.13,depth:.23},scene);
  sleeper.position.set(x,y,z-laenge/2+.45);sleeper.material=materials.rust;sleeper.isPickable=false;
  for(let i=1;i<Math.floor(laenge/1.9);i++){
    const s=sleeper.createInstance('nord_schwelle_'+i);
    s.position.set(x,y,z-laenge/2+.45+i*1.9);s.isPickable=false;
  }
}
gleis(-14,43,89);

for(let i=0;i<(sparsam?17:36);i++){
  const x=-185+r()*350,z=-270+r()*470;
  if(Math.hypot(x+98,z-30)<123||Math.hypot(x-124,z+73)<105||Math.hypot(x-74,z-164)<92)continue;
  sd.fels({pos:[x,sd.hoehe(x,z)-.25,z],groesse:.8+r()*2.9,seed:i+8});
}

// Beute: alle Gegenstände nutzbar im vorhandenen Interaktionssystem.
const kisten=[
 [-140,-80,'waffe:gewehr'],[-99,-12,'munition'],[-57,67,'medikit'],
 [-33,109,'ruestung'],[98,-103,'munition'],[127,-26,'waffe:schrotflinte'],
 [159,-112,'medikit'],[51,123,'waffe:scharfschuetze'],
 [104,189,'ruestung'],[-151,-161,'medikit'],[-185,177,'munition']
];
for(const [x,z,inhalt] of kisten) sd.kiste({pos:[x,null,z],inhalt});

// Fahrbare Fahrzeuge werden durch Havok aus der SD Engine simuliert.
sd.auto({pos:[-128,null,-116],typ:'suv',farbe:'#536455',drehung:0});
sd.auto({pos:[113,null,-131],typ:'pickup',farbe:'#78705c',drehung:30});
sd.motorrad({pos:[178,null,-106],farbe:'#4a5760'});

// Optional: in der SD Werkstatt importierte, lizenzierte .glb-Modelle platzieren.
// Ohne Import bleibt die Szene vollständig spielbar. Fehlende Assets sind kein Fehler.
const optionaleModelle = [
 ['nordhafen-funkanlage.glb',[56,sd.hoehe(56,180),180],1],
 ['nordhafen-hafenkran.glb',[-15,sd.hoehe(-15,40),40],1]
];
const vorhanden = sd.eigeneDateien().filter(a=>a.typ==='modell').map(a=>a.name);
for(const [name,pos,skalierung] of optionaleModelle){
 if(vorhanden.includes(name)){
   try{await sd.modell(name,{pos,skalierung});}catch(e){console.warn('Optionale Datei konnte nicht geladen werden',name,e);}
 }
}
// Die neue KI-Bauplan-Vorlage ist zusätzlich verfügbar (ohne fehlendes Bildasset).
if(window.SDBauplanPakete){
 try{
  sd.teileModell(SDBauplanPakete.erzeugen('kampfroboter',{
   detail:sparsam?'sparsam':'hoch',farbe:'#727970'
  }),{pos:[-27,null,48],drehung:35,kollision:false});
 }catch(e){console.warn('Optionaler KI-Roboter übersprungen',e);}
}

// Spieler: vorhandenes animiertes SD-Mensch-Skelett, kein starres Kistenmodell.
sd.spieler({pos:[-145,null,-148],leben:135,ruestung:20,waffen:['pistole','gewehr'],
 aussehen:'mensch',mensch:{groesse:1.83,statur:1.06,oberteil:'#485347',
 hose:'#303a3a',schuhe:'#222528',weste:true,helm:true,
 westeFarbe:'#414945',frisur:'kurz',aermel:'lang'}});
sd.geben('medikit',2);
sd.geben('granate',2);

// Gegner-KI einschließlich Schusswechsel, Deckungssuche und Wegfindung.
const gruppen={hafen:[],dorf:[],radar:[]};
function feind(gruppe,x,z,staerke,waffe,nummer){
 const b=sd.gegner({pos:[x,null,z],staerke,waffe,leben:100,
  aussehen:'mensch',name:'Wache '+gruppe.toUpperCase()+'-'+nummer,
  mensch:{oberteil:gruppe==='radar'?'#37484a':'#4d5141',
   hose:'#343a3a',weste:true,helm:true,westeFarbe:'#3b4242'}});
 gruppen[gruppe].push(b);return b;
}
[[-56,0,.34,'mp'],[-23,58,.42,'gewehr'],[-75,121,.38,'gewehr'],[-130,114,.40,'pistole']].
  forEach((v,i)=>feind('hafen',...v,i+1));
[[89,-112,.36,'gewehr'],[160,-51,.43,'mp'],[174,-133,.49,'gewehr']].
  forEach((v,i)=>feind('dorf',...v,i+1));
[[36,139,.50,'gewehr'],[117,164,.55,'dmr'],[81,202,.50,'gewehr']].
  forEach((v,i)=>feind('radar',...v,i+1));

// Eine zusammenhängende, tatsächlich spielbare Mission in vier Abschnitten.
sd.mission({id:'nordhafen-hafen',titel:'01 · Hafen sichern',
 text:'Erreiche die Containeranlage und übernimm den Funkcode',
 schritte:[
  {art:'gehe',pos:[-111,-15],radius:8,text:'Zum gesicherten Hafentor'},
  {art:'sammle',pos:[-48,88],radius:4,text:'Funkcode finden'},
  {art:'besiege',erzeugen:()=>gruppen.hafen,text:'Hafenwachen ausschalten'}
 ],beiErfolg:()=>sd.nachricht('Hafen gesichert. Jetzt zum Dorf fahren!',5)});
sd.mission({id:'nordhafen-dorf',titel:'02 · Konvoi abfangen',
 text:'Fahr zum Dorf und finde die Transportpapiere',
 schritte:[
  {art:'fahre',pos:[105,-115],radius:16,text:'Mit einem Fahrzeug zum Dorf'},
  {art:'sammle',pos:[146,-44],text:'Transportpapiere sichern'},
  {art:'besiege',erzeugen:()=>gruppen.dorf,text:'Dorfwachen ausschalten'}
 ],beiErfolg:()=>sd.nachricht('Transportpapiere gesichert. Radarstation folgt!',5)});
sd.mission({id:'nordhafen-radar',titel:'03 · Radarstation',
 text:'Schalte die Abwehr aus und sichere den letzten Datenträger',
 schritte:[
  {art:'gehe',pos:[42,118],radius:9,text:'Über die Zufahrt zur Radarstation'},
  {art:'besiege',erzeugen:()=>gruppen.radar,text:'Radarsicherung ausschalten'},
  {art:'sammle',pos:[76,181],text:'Radardaten bergen'}
 ],beiErfolg:()=>sd.nachricht('Radar ausgeschaltet. Erreiche den Evakuierungspunkt!',6)});
sd.mission({id:'nordhafen-evakuierung',titel:'04 · Evakuierung',
 text:'Verlasse das Operationsgebiet',
 schritte:[
  {art:'fahre',pos:[-184,198],radius:17,text:'Mit einem Fahrzeug zur Evakuierungszone'}
 ],beiErfolg:()=>sd.sieg('Schattenoperation abgeschlossen! Alle Einsatzdaten gesichert.')});

// Atmosphärische Bewegung und Wetter. Kein separater Renderloop.
let regen=false, trocken=false, letzterHinweis=0;
sd.jedenFrame((dt,zeit)=>{
 radarPivot.rotation.y+=dt*.24;
 signal.material.emissiveIntensity=1.1+.6*Math.sin(zeit*4);
 if(!regen&&zeit>145){regen=true;sd.wetter({regen:.28,wind:.5});sd.meldung('Ein Regenschauer zieht über Nordhafen');}
 if(!trocken&&zeit>250){trocken=true;sd.wetter({regen:0,wind:.25});sd.meldung('Der Himmel klart auf');}
 if(zeit>80&&zeit-letzterHinweis>110){
  letzterHinweis=zeit;sd.nachricht('J = Missionskarte · F = Einsteigen · C = Ducken · H = Medikit',4);
 }
});
sd.nachricht('NORDHAFEN: W/A/S/D bewegen · Maus zielen · F Fahrzeug · J Missionen',9);
