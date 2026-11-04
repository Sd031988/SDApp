/** Opt-in local texture signature preflight. Not a decoder or security sandbox. */
const formats = Object.freeze({'image/png':'png','image/jpeg':'jpeg','image/webp':'webp','image/avif':'avif','image/jxl':'jxl'});
const eq=(b,o,a)=>a.every((x,i)=>b[o+i]===x);
const str=s=>Array.from(s,c=>c.charCodeAt(0));
export function inspectLocalTextureSignature(bytes,mimeType){
 if(!Object.hasOwn(formats,mimeType)) throw new TypeError('Unsupported MIME type');
 if(!(bytes instanceof ArrayBuffer)&&!ArrayBuffer.isView(bytes)) throw new TypeError('Expected binary bytes');
 const b=bytes instanceof ArrayBuffer?new Uint8Array(bytes):new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(b.length<4||b.length>64*1024*1024) throw new RangeError('Invalid texture byte length');
 let match=false;
 switch(mimeType){
 case 'image/png': match=b.length>=24&&eq(b,0,[137,80,78,71,13,10,26,10])&&eq(b,12,str('IHDR'));break;
 case 'image/jpeg': match=b.length>=4&&eq(b,0,[255,216,255])&&b[3]!==0;break;
 case 'image/webp':match=b.length>=16&&eq(b,0,str('RIFF'))&&eq(b,8,str('WEBP'))&&['VP8 ','VP8L','VP8X'].some(s=>eq(b,12,str(s)))&&((b[4]+b[5]*256+b[6]*65536+b[7]*16777216)+8===b.length);break;
 case 'image/avif':{
  if(b.length<16||!eq(b,4,str('ftyp')))break;
  const size=(b[0]*16777216+b[1]*65536+b[2]*256+b[3])>>>0;
  if(size<16||size>b.length||size>4096||size%4)break;
  for(let p=8;p+4<=size;p+=4){if(p===12)continue;if(eq(b,p,str('avif'))||eq(b,p,str('avis'))){match=true;break;}}
  break;
 }
 case 'image/jxl':match=eq(b,0,[255,10])||(b.length>=12&&eq(b,0,[0,0,0,12,74,88,76,32,13,10,135,10]));break;
 }
 if(!match)throw new Error('Texture signature does not match declared MIME type');
 return Object.freeze({format:formats[mimeType],mimeType,byteLength:b.length,signatureMatched:true});
}
