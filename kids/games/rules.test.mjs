import assert from 'node:assert/strict';
import {catalog,miniIds,findGame} from './catalog.mjs';
import {initialState,sanitize,action,visit,QUESTIONS,TREASURE_ITEMS,TREASURE_KEYS,TREASURE_EXIT,MAX_STARS} from './rules.mjs';
assert.equal(catalog.length,10,'Two 3D games + eight mini-games');
assert.equal(miniIds.length,8);
assert.equal(new Set(catalog.map(x=>x.id)).size,10);
assert.ok(catalog.every(x=>x.ready&&x.href&&x.description));
assert.ok(catalog.some(x=>x.id==='blockworld'));
let s=initialState();
assert.equal(visit(s,'obby'),true);
assert.equal(visit(s,'not-a-game'),false);
assert.equal(visit(s,'obby'),true);
assert.equal(s.visited.length,1);

for(const id of miniIds){assert.equal(typeof s.games[id],'object');assert.equal(action(s,id,'invalid',{index:-1}).ok,false)}
assert.equal(action(s,'obby','checkpoint',{index:2}).ok,false);
assert.equal(action(s,'obby','checkpoint',{index:1}).ok,true);
assert.equal(action(s,'obby','checkpoint',{index:2}).ok,true);
assert.equal(action(s,'obby','finish').reward,20);
assert.equal(s.games.obby.level,1);
assert.equal(action(s,'obby','finish').ok,false);
for(let level=1;level<3;level++){
 action(s,'obby','checkpoint',{index:1});action(s,'obby','checkpoint',{index:2});
 assert.equal(action(s,'obby','finish').reward,20);
}
assert.equal(s.games.obby.completed,3);
action(s,'obby','checkpoint',{index:1});action(s,'obby','checkpoint',{index:2});
assert.equal(action(s,'obby','finish').reward,0,'Obby has finite progress reward');

for(let i=0;i<5;i++)assert.equal(action(s,'pet','feed').ok,true);
assert.equal(s.games.pet.awarded,1);
assert.equal(s.games.pet.food,100);
assert.equal(action(s,'pet','choose',{index:3}).ok,true);
assert.equal(s.games.pet.selected,3);
assert.equal(action(s,'pet','choose',{index:99}).ok,false);

assert.equal(action(s,'garden','harvest',{index:0}).ok,false);
assert.equal(action(s,'garden','plant',{index:0}).ok,true);
assert.equal(action(s,'garden','plant',{index:0}).ok,false);
assert.equal(action(s,'garden','water',{index:0}).ok,true);
assert.equal(action(s,'garden','harvest',{index:0}).reward,5);
assert.equal(s.games.garden.plots[0],0);

for(const job of ['fire','health','mail','school']){
 action(s,'city','choose',{job});
 for(let i=0;i<3;i++)assert.equal(action(s,'city','task').reward,0);
 assert.equal(action(s,'city','task').reward,15);
 assert.ok(s.games.city.done.includes(job));
}
for(let i=0;i<4;i++)action(s,'city','task');
assert.equal(s.games.city.done.length,4);

assert.equal(action(s,'kart','gate',{index:1}).ok,false);
for(let lap=0;lap<4;lap++){
 for(let gate=0;gate<4;gate++)assert.equal(action(s,'kart','gate',{index:gate}).ok,true);
}
assert.equal(s.games.kart.laps,4);
assert.equal(s.games.kart.awarded,3);

const tr=s.games.treasure;
for(const [i,[x,y]] of TREASURE_KEYS.entries()){
 while(tr.x<x)action(s,'treasure','move',{dx:1,dy:0});
 while(tr.x>x)action(s,'treasure','move',{dx:-1,dy:0});
 while(tr.y<y)action(s,'treasure','move',{dx:0,dy:1});
 while(tr.y>y)action(s,'treasure','move',{dx:0,dy:-1});
 assert.ok(tr.keys.includes(i));
}
for(const [i,[x,y]] of TREASURE_ITEMS.entries()){
 while(tr.x<x)action(s,'treasure','move',{dx:1,dy:0});
 while(tr.x>x)action(s,'treasure','move',{dx:-1,dy:0});
 while(tr.y<y)action(s,'treasure','move',{dx:0,dy:1});
 while(tr.y>y)action(s,'treasure','move',{dx:0,dy:-1});
 assert.ok(tr.found.includes(i));
}
while(tr.x<TREASURE_EXIT[0])action(s,'treasure','move',{dx:1,dy:0});
while(tr.y>TREASURE_EXIT[1])action(s,'treasure','move',{dx:0,dy:-1});
assert.equal(tr.finished,true);
assert.equal(action(s,'treasure','move',{dx:1,dy:1}).ok,false);

assert.equal(action(s,'fashion','show').reward,8);
assert.equal(action(s,'fashion','show').reward,0);
assert.equal(action(s,'fashion','color',{part:'shirt',index:4}).ok,true);
assert.equal(action(s,'fashion','show').reward,8);
assert.equal(action(s,'fashion','color',{part:'hat',index:100}).ok,false);

for(let i=0;i<QUESTIONS.length;i++){
 const q=QUESTIONS[i];
 const answer=action(s,'learn','answer',{index:q.correct});
 assert.equal(answer.ok,true);
 assert.equal(answer.reward,4);
}
assert.equal(s.games.learn.correct,QUESTIONS.length);
assert.equal(action(s,'learn','answer',{index:0}).ok,false);
assert.equal(action(s,'learn','again').ok,true);
assert.equal(action(s,'learn','answer',{index:QUESTIONS[0].correct}).reward,0,'Already rewarded question');

const restored=sanitize(JSON.stringify(s));
assert.deepEqual(restored,s);
const corrupt=sanitize({stars:Infinity,visited:['city','city','fake'],games:{garden:{plots:Array(100).fill(999)},learn:{index:1e9,solved:[-1,1,1,'bad']},fashion:{shown:['<script>']}}});
assert.equal(corrupt.stars,0);assert.deepEqual(corrupt.visited,['city']);
assert.equal(corrupt.games.garden.plots.length,9);
assert.equal(corrupt.games.garden.plots[0],2);
assert.equal(corrupt.games.learn.index,QUESTIONS.length);
assert.deepEqual(corrupt.games.fashion.shown,[]);
assert.equal(sanitize('not-json').stars,0);
assert.equal(sanitize(null).stars,0);
console.log('PASS: ten-game catalog, eight gameplay engines, progression, bounded rewards, saves and invalid inputs');
