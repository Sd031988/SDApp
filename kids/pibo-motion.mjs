// Procedural motions for Pibo's original geometric cat; no external assets.
// Deterministic and clamped so that scene animation stays stable after tab resumes.
const safeTime=t=>Number.isFinite(t)?Math.max(0,t):0;
const wave=(t,f,phase=0)=>Math.sin(t*f+phase);
export function bodyPose(time,mode='idle',careType=null,careProgress=0,reducedMotion=false){
  const t=safeTime(time),p=Math.max(0,Math.min(1,Number(careProgress)||0));
  const walking=!!careType && p<.23;
  const playing=!careType && mode==='play';
  const excited=!careType && (mode==='pet'||mode==='belly'||mode==='paw');
  const stride=walking?.16:playing?.15:0;
  const motion=reducedMotion?.3:1;
  const wiggle=wave(t,walking?13:playing?10:2.8);
  const bounce=playing?Math.abs(wave(t,9))*.24:walking?Math.abs(wiggle)*.04:0;
  const breath=careType==='sleep'? .014: .022;
  return {
    vertical:motion*(bounce+ .014*wave(t,2.3)),
    bodyScaleY: .85*(1+motion*breath*wave(t,2.4)),
    bodyRoll:motion*(playing?.07*wave(t,8):excited?.035*wave(t,4):.012*wave(t,1.4)),
    turn:motion*(playing?.14*wave(t,6):.025*wave(t,.8)),
    tailSwing:motion*(.24*wave(t,2.8)+(excited?.15*wave(t,7):0)),
    tailPitch:motion*.18*wave(t,1.6),
    tailSegments:Array.from({length:7},(_,j)=>motion*.045*wave(t,2.2-j*.18)),
    frontPaws:[0,1].map(j=>motion*stride*Math.max(0,wave(t,walking?13:10,j*Math.PI))),
    hindPaws:[0,1].map(j=>motion*stride*Math.max(0,wave(t,walking?13:10,(j+1)*Math.PI))),
    earTwitch:motion*(excited?.07*wave(t,9):.015*wave(t,2)),
    cheekSmile:excited||playing,
    gaze:motion*.035*wave(t,.8)
  };
}
