/* Tiny zero-dependency ZIP encoder for the three public Chrome-extension files.
   No uploads: ZIP is assembled entirely within the user's browser. */
(function(root){
'use strict';
function crc32(data){
 let crc=0xffffffff;
 for(const byte of data){
  crc^=byte;
  for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function concat(chunks){
 const length=chunks.reduce((sum,item)=>sum+item.length,0);
 const all=new Uint8Array(length);let p=0;
 for(const item of chunks){all.set(item,p);p+=item.length}
 return all;
}
function archive(entries){
 if(!Array.isArray(entries)||!entries.length||entries.length>20)throw Error('Erweiterungsdateien fehlen.');
 const encoder=new TextEncoder(),local=[],central=[];
 let offset=0;
 for(const entry of entries){
  const name=entry?.name;
  if(typeof name!=='string'||!name||name.includes('/')||name.includes('\\')||name==='.'||name==='..')
   throw Error('Ungültiger Dateiname für ZIP.');
  const n=encoder.encode(name),data=encoder.encode(String(entry.text||'')),crc=crc32(data);
  if(data.length>1024*1024||n.length>100)throw Error('Datei zu groß.');
  const h=new Uint8Array(30+n.length),v=new DataView(h.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);
  v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);
  v.setUint16(26,n.length,true);h.set(n,30);
  local.push(h,data);
  const c=new Uint8Array(46+n.length),w=new DataView(c.buffer);
  w.setUint32(0,0x02014b50,true);w.setUint16(4,20,true);w.setUint16(6,20,true);
  w.setUint16(8,0x0800,true);w.setUint32(16,crc,true);
  w.setUint32(20,data.length,true);w.setUint32(24,data.length,true);
  w.setUint16(28,n.length,true);w.setUint32(42,offset,true);c.set(n,46);
  central.push(c);
  offset+=h.length+data.length;
 }
 const body=concat(local),directory=concat(central),tail=new Uint8Array(22),d=new DataView(tail.buffer);
 d.setUint32(0,0x06054b50,true);d.setUint16(8,entries.length,true);
 d.setUint16(10,entries.length,true);d.setUint32(12,directory.length,true);
 d.setUint32(16,body.length,true);
 return concat([body,directory,tail]);
}
const api={archive,crc32};root.SDChatBridgeZip=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
