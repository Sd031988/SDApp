// Time-based facial motion. Pure math allows browser-independent tests.
export const smoothstep = value => {
  const x=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
  return x*x*(3-2*x);
};
export function facePose(seconds, mode='idle', careType=null) {
  const t=Number.isFinite(seconds)?Math.max(0,seconds):0;
  const sleepy=mode==='sleep'||careType==='sleep';
  const blinkPhase=t%5.3;
  const blink=sleepy?1:(blinkPhase<.18?Math.sin(Math.PI*blinkPhase/.18)**2:0);
  const chewing=careType==='feed'||(mode==='feed'&&!careType);
  const bite=chewing?Math.abs(Math.sin(t*17)):0;
  const smile=mode==='pet'||mode==='play'?1:0;
  return {eyeClose:blink, mouthOpen:chewing?.04+.17*bite:.04,
    headBob:chewing?.055*Math.sin(t*17):.02*Math.sin(t*1.7),
    smile};
}
