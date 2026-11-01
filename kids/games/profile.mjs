// Shared, privacy-friendly preferences for SD Kids. Device-local; no login, telemetry, cookies or network.
import {catalog,miniIds} from './catalog.mjs';
import {initialState,sanitize,STORAGE_KEY} from './rules.mjs';

export const SETTINGS_KEY='sd-kids-ui-v1', SAVE_FORMAT='sd-kids-games-backup', BACKUP_VERSION=1;
const validIds=new Set(catalog.map(game=>game.id));
export function defaultSettings(){
 return {favorites:[],lastPlayed:null,sound:false,reducedMotion:false};
}
export function safeSettings(raw){
 let data=raw;
 try{if(typeof data==='string')data=JSON.parse(data)}catch{return defaultSettings()}
 if(!data||typeof data!=='object')return defaultSettings();
 const s=defaultSettings();
 s.favorites=Array.isArray(data.favorites)?[...new Set(data.favorites.filter(v=>validIds.has(v)))].slice(0,10):[];
 s.lastPlayed=validIds.has(data.lastPlayed)?data.lastPlayed:null;
 s.sound=data.sound===true;
 s.reducedMotion=data.reducedMotion===true;
 return s;
}
export function toggleFavorite(settings,id){
 if(!validIds.has(id))return false;
 settings.favorites=settings.favorites.includes(id)
  ?settings.favorites.filter(x=>x!==id)
  :[...settings.favorites,id];
 return settings.favorites.includes(id);
}
export function achievements(profile){
 const g=sanitize(profile).games;
 return [
  {id:'first-steps',emoji:'🌈',name:'Erster Parcours',unlocked:g.obby.completed>=1},
  {id:'pet-care',emoji:'💗',name:'Tierfreund',unlocked:g.pet.actions>=5},
  {id:'green-thumb',emoji:'🌻',name:'Grüner Daumen',unlocked:g.garden.harvest>=1},
  {id:'city-hero',emoji:'🏙️',name:'Stadtheld',unlocked:g.city.done.length>=1},
  {id:'kart-racer',emoji:'🏎️',name:'Rennfahrer',unlocked:g.kart.laps>=1},
  {id:'treasure-hunter',emoji:'🏝️',name:'Schatzfinder',unlocked:g.treasure.finished},
  {id:'style-star',emoji:'👗',name:'Stilikone',unlocked:g.fashion.shown.length>=1},
  {id:'learning-star',emoji:'📚',name:'Schlaumeier',unlocked:g.learn.solved.length>=1}
 ];
}
export function backupData(profile,settings){
 return {format:SAVE_FORMAT,version:BACKUP_VERSION,createdAt:new Date().toISOString(),
  // Backups intentionally contain only mini-game progress and local preferences.
  games:sanitize(profile),settings:safeSettings(settings)};
}
export function restoreBackup(raw){
 if(typeof raw!=='string'||raw.length>150000)throw Error('Datei zu groß oder ungültig');
 let obj;
 try{obj=JSON.parse(raw)}catch{throw Error('Keine gültige JSON-Datei')}
 if(!obj||obj.format!==SAVE_FORMAT||obj.version!==BACKUP_VERSION||!obj.games||!obj.settings){
  throw Error('Keine gültige SD Kids Sicherung');
 }
 return {profile:sanitize(obj.games),settings:safeSettings(obj.settings)};
}
export function readProfile(storage=localStorage){
 try{return sanitize(storage.getItem(STORAGE_KEY))}catch{return initialState()}
}
export function readSettings(storage=localStorage){
 try{return safeSettings(storage.getItem(SETTINGS_KEY))}catch{return defaultSettings()}
}
export function saveSettings(settings,storage=localStorage){
 try{storage.setItem(SETTINGS_KEY,JSON.stringify(safeSettings(settings)));return true}catch{return false}
}
export function countPlayed(profile){
 const p=sanitize(profile);
 return p.visited.filter(id=>miniIds.includes(id)).length;
}
