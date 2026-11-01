// Parameterized procedural facial poses, deterministic and testable without WebGL.
export const smoothstep = value => {
  const x=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
  return x*x*(3-2*x);
};
export function facePose(seconds, mode='idle', careType=null, carePhase=-1, reducedMotion=false) {
  const t=Number.isFinite(seconds)?Math.max(0,seconds):0;
  const sleepy=mode==='sleep'||careType==='sleep';
  const blinkPhase=t%5.3, blink=sleepy?1:(blinkPhase<.18?Math.sin(Math.PI*blinkPhase/.18)**2:0);
  const chewing=careType==='feed'?(carePhase===2||carePhase===-1):(!careType&&mode==='feed');
  const pulse=Math.abs(Math.sin(t*17));
  const effort=reducedMotion?.4:1;
  const smile=(mode==='pet'||mode==='play'||mode==='belly')&&!careType?1:0;
  return {
    eyeClose:blink,
    mouthOpen:chewing?.04+.17*pulse:.04+(smile?.012:0),
    headBob:chewing?effort*.055*Math.sin(t*17):effort*.02*Math.sin(t*1.7),
    smile,
    browTilt:smile?-.055:.015*Math.sin(t*.9),
    lookX:effort*.032*Math.sin(t*.7)
  };
}
