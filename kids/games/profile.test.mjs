import assert from 'node:assert/strict';
import {initialState,action,restartGame} from './rules.mjs';
import {catalog,miniIds} from './catalog.mjs';
import {defaultSettings,safeSettings,toggleFavorite,achievements,backupData,restoreBackup,readSettings,saveSettings} from './profile.mjs';

assert.equal(catalog.length,10);
const s=defaultSettings();
assert.equal(toggleFavorite(s,'obby'),true);
assert.equal(toggleFavorite(s,'obby'),false);
assert.equal(toggleFavorite(s,'not-valid'),false);
assert.deepEqual(safeSettings({favorites:['pibo','pibo','intruder','garden'],sound:1,reducedMotion:true,lastPlayed:'garden'}),{
 favorites:['pibo','garden'],sound:false,reducedMotion:true,lastPlayed:'garden'
});
assert.deepEqual(safeSettings('<bad>'),defaultSettings());
let fake=new Map();let storage={getItem:key=>fake.get(key)||null,setItem:(key,value)=>fake.set(key,value)};
s.sound=true;s.reducedMotion=true;s.lastPlayed='obby';
assert.equal(saveSettings(s,storage),true);
assert.equal(readSettings(storage).lastPlayed,'obby');
assert.equal(readSettings(storage).sound,true);

const p=initialState();
assert.equal(achievements(p).length,8);
action(p,'fashion','show');
assert.equal(achievements(p).filter(x=>x.unlocked).length,1);
let stars=p.stars;
assert.equal(restartGame(p,'fashion'),true);
assert.equal(action(p,'fashion','show').reward,0);
assert.equal(p.stars,stars);
assert.equal(restartGame(p,'non-game'),false);
for(const id of miniIds)assert.equal(restartGame(p,id),true);

const restore=restoreBackup(JSON.stringify(backupData(p,s)));
assert.deepEqual(restore.profile,p);
assert.deepEqual(restore.settings,s);
assert.throws(()=>restoreBackup('malformed'),/JSON/);
assert.throws(()=>restoreBackup(JSON.stringify({format:'unknown',version:1})),/Sicherung/);
assert.throws(()=>restoreBackup('x'.repeat(150001)),/groß/);
assert.equal(restoreBackup(JSON.stringify({format:'sd-kids-games-backup',version:1,settings:{favorites:['javascript:alert(1)']},games:{games:{}}})).settings.favorites.length,0);

// Counter-tests: previously earned tiers remain earned after a replay.
const obby=initialState();
action(obby,'obby','checkpoint',{index:1});action(obby,'obby','checkpoint',{index:2});
assert.equal(action(obby,'obby','finish').reward,20);
assert.equal(restartGame(obby,'obby'),true);
assert.equal(obby.games.obby.completed,1);
assert.equal(obby.games.obby.level,1);
const pet=initialState();
for(let i=0;i<5;i++)action(pet,'pet','feed');
assert.equal(pet.games.pet.awarded,1);
restartGame(pet,'pet');
for(let i=0;i<4;i++)action(pet,'pet','feed');
assert.equal(pet.stars,5);
const city=initialState();
for(let i=0;i<4;i++)action(city,'city','task');
restartGame(city,'city');
for(let i=0;i<4;i++)action(city,'city','task');
assert.equal(city.stars,15);
const garden=initialState();
action(garden,'garden','plant',{index:0});
action(garden,'garden','water',{index:0});
action(garden,'garden','harvest',{index:0});
restartGame(garden,'garden');
assert.equal(garden.games.garden.harvest,1);
console.log('PASS: preferences, backup validation, achievements, anti-reward-reset safeguards');
