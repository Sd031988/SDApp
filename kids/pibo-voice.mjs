/* Pibo's original, privacy-preserving lip-sync model.
   Only analyzes the already recorded local playback signal; never stores or sends speech. */
export function voiceLoudness(analyser,bytes){
 if(!analyser||!bytes||typeof analyser.getByteTimeDomainData!=='function')return 0;
 analyser.getByteTimeDomainData(bytes);
 let squared=0;
 for(let i=0;i<bytes.length;i++){
  const value=(bytes[i]-128)/128;
  squared+=value*value;
 }
 const rms=Math.sqrt(squared/Math.max(1,bytes.length));
 return Math.max(0,Math.min(1,(rms-.012)*5.2));
}
export function mouthWhileSpeaking(seconds,level,active,reduced=false){
 if(!active)return {open:0,nod:0,lean:0};
 const amplitude=Math.max(0,Math.min(1,Number(level)||0));
 const shape=reduced?amplitude:Math.max(amplitude*.82,.12+.14*Math.abs(Math.sin(seconds*15)));
 return {
  open:Math.min(.62,.055+shape*.46),
  nod:reduced?0:.07*Math.sin(seconds*9)*(0.35+amplitude),
  lean:reduced?0:.022*Math.sin(seconds*4.2)
 };
}
