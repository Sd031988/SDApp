import assert from 'node:assert/strict';
import {mouthTarget,mouthDrop,withinStage,foodReaction,pawReaction} from './pibo-interactions.mjs';
for(const [w,h] of [[320,240],[390,330],[920,620]]){
 const r={left:25,top:64,width:w,height:h,right:25+w,bottom:64+h};
 const t=mouthTarget(r);
 assert(mouthDrop(t.x,t.y,r),'Center of cat mouth must accept food');
 assert(!mouthDrop(26,65,r),'Far corner must reject food');
 assert(!mouthDrop(t.x+3*t.radiusX,t.y,r),'Drop outside mouth must not feed');
 assert(withinStage(t.x,t.y,r));
 assert(!withinStage(-5,-5,r));
}
assert.equal(mouthTarget({width:0,height:0}),null);
assert(foodReaction(0).food>0);
assert.notEqual(foodReaction(0).say,foodReaction(3).say);
assert.match(pawReaction(0),/Nö, nö, nö/);
assert.notEqual(pawReaction(1),pawReaction(0));
console.log('PASS: drag-to-mouth hit testing 320-920px, distinct foods and gentle paw reactions');
