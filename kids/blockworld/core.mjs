// SD BlockWorld: original, offline-only sandbox rules. No Roblox assets or services.
export const SAVE_KEY='sd-kids-blockworld-v1';
export const MAX_BLOCKS=350, MAX_TOKENS=100000;
export const BLOCK_COLORS=['mint','blue','pink','yellow','purple','orange'];
export const CRYSTALS=[
  [-8,-8],[5,-13],[14,-5],[-15,3],[8,11],[-4,14],
  [17,14],[-17,-15],[2,6],[-10,12],[13,-17],[0,-19]
].map(([x,z],id)=>({id,x,z}));
export const PARKOUR=[
  {x:-12,z:1,top:.65,w:3.5,d:3.5},
  {x:-12,z:-2.4,top:1.2,w:2.7,d:2.7},
  {x:-10,z:-5.5,top:1.8,w:2.7,d:2.7},
  {x:-7,z:-8,top:2.35,w:2.6,d:2.6},
  {x:-4,z:-9.2,top:2.9,w:2.7,d:2.7},
  {x:-1,z:-10.8,top:3.4,w:3,d:3}
];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=n=>Number.isFinite(Number(n))?Number(n):0;
export function localDay(date=new Date()){
 return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
}
export function newSave(day=localDay()){
 return {version:1,day,tokens:0,crystals:[],blocks:[],buildCount:0,buildRewards:0,
         parkourProgress:0,parkourWins:0,avatarColor:'blue',nickname:'Explorer',x:0,z:5};
}
export function cleanName(input){
 return String(input??'').replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,18)||'Explorer';
}
export function cleanBlock(b){
 if(!b||typeof b!=='object')return null;
 const x=finite(b.x),z=finite(b.z),level=finite(b.level);
 if(!Number.isInteger(x)||!Number.isInteger(z)||x%2!==0||z%2!==0||Math.abs(x)>20||Math.abs(z)>20)return null;
 if(!Number.isInteger(level)||level<0||level>3||!BLOCK_COLORS.includes(b.color))return null;
 return {x,z,level,color:b.color};
}
export function cellKey(b){return b.x+':'+b.z+':'+b.level}
export function restoreSave(raw,day=localDay()){
 let source;
 try{source=typeof raw==='string'?JSON.parse(raw):raw}catch{return newSave(day)}
 if(!source||typeof source!=='object')return newSave(day);
 const s=newSave(day), blockKeys=new Set();
 if(Array.isArray(source.blocks))for(const sourceBlock of source.blocks.slice(0,MAX_BLOCKS*2)){
   const b=cleanBlock(sourceBlock);
   if(b&&!blockKeys.has(cellKey(b))&&s.blocks.length<MAX_BLOCKS){blockKeys.add(cellKey(b));s.blocks.push(b)}
 }
 s.tokens=clamp(Math.trunc(finite(source.tokens)),0,MAX_TOKENS);
 s.day=typeof source.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(source.day)?source.day:day;
 s.crystals=Array.isArray(source.crystals)?[...new Set(source.crystals.filter(id=>Number.isInteger(id)&&id>=0&&id<CRYSTALS.length))]:[];
 s.buildCount=clamp(Math.floor(finite(source.buildCount)),0,99999);
 s.buildRewards=clamp(Math.floor(finite(source.buildRewards)),0,4);
 s.parkourProgress=clamp(Math.floor(finite(source.parkourProgress)),0,PARKOUR.length);
 s.parkourWins=clamp(Math.floor(finite(source.parkourWins)),0,999);
 s.avatarColor=BLOCK_COLORS.includes(source.avatarColor)?source.avatarColor:'blue';
 s.nickname=cleanName(source.nickname);
 s.x=clamp(finite(source.x),-22,22);s.z=clamp(finite(source.z),-22,22);
 // A new calendar day refreshes the collectible hunt, but never withdraws stars.
 if(day>s.day){s.day=day;s.crystals=[];s.parkourProgress=0}
 return s;
}
export function addTokens(s,amount){
 const before=s.tokens;
 s.tokens=clamp(s.tokens+Math.max(0,Math.floor(finite(amount))),0,MAX_TOKENS);
 return s.tokens-before;
}
export function claimCrystal(s,id){
 if(!Number.isInteger(id)||id<0||id>=CRYSTALS.length||s.crystals.includes(id))return false;
 s.crystals.push(id);addTokens(s,5);return true;
}
export function placeBlock(s,data){
 const b=cleanBlock(data);
 if(!b||s.blocks.length>=MAX_BLOCKS||s.blocks.some(other=>cellKey(other)===cellKey(b)))return false;
 // Preserve clear space around the initial spawn.
 if(b.level===0&&Math.abs(b.x)<=2&&Math.abs(b.z-6)<=2)return false;
 s.blocks.push(b);s.buildCount=clamp(s.buildCount+1,0,99999);
 const tier=Math.min(4,Math.floor(s.buildCount/5));
 if(tier>s.buildRewards){addTokens(s,(tier-s.buildRewards)*15);s.buildRewards=tier}
 return true;
}
export function removeBlock(s,data){
 const b=cleanBlock(data);if(!b)return false;
 const index=s.blocks.findIndex(other=>cellKey(other)===cellKey(b));
 if(index<0)return false;s.blocks.splice(index,1);return true;
}
export function reachParkour(s,index){
 if(!Number.isInteger(index)||index<0||index>=PARKOUR.length)return false;
 if(index!==s.parkourProgress)return false;
 s.parkourProgress++;
 if(s.parkourProgress===PARKOUR.length){
   s.parkourWins=Math.min(999,s.parkourWins+1);
   addTokens(s,30);s.parkourProgress=0;
 }
 return true;
}
export function landingY(prevFeet,nextFeet,x,z,s){
 let landing=nextFeet<=0&&prevFeet>=0?0:null;
 const candidates=[
   ...PARKOUR.map(p=>({x:p.x,z:p.z,w:p.w,d:p.d,top:p.top})),
   ...s.blocks.map(b=>({x:b.x,z:b.z,w:1.8,d:1.8,top:(b.level+1)*1.6}))
 ];
 for(const c of candidates){
   if(Math.abs(x-c.x)<c.w/2+.24&&Math.abs(z-c.z)<c.d/2+.24&&prevFeet>=c.top-.035&&nextFeet<=c.top&&
      (landing===null||c.top>landing))landing=c.top;
 }
 return landing;
}
export function isSafeSpot(x,z){return Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<25&&Math.abs(z)<25}
