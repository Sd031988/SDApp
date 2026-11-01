import assert from 'node:assert/strict';
import {bodyPose} from './pibo-motion.mjs';
for(let t=0;t<50;t+=.37){
 for(const mode of ['idle','play','pet','paw','belly','sleep']){
   const p=bodyPose(t,mode);
   assert.equal(p.frontPaws.length,2);
   assert.equal(p.hindPaws.length,2);
   assert.equal(p.tailSegments.length,7);
   assert.ok(Object.values(p).flat().filter(v=>typeof v==='number').every(Number.isFinite));
   assert.ok(p.bodyScaleY>.6&&p.bodyScaleY<1.1);
 }
}
assert.ok(bodyPose(1,'play').vertical!==bodyPose(1,'idle').vertical);
assert.notEqual(bodyPose(.38,'tail').tailSwing,bodyPose(.38,'idle').tailSwing);
assert.notEqual(bodyPose(.38,'ear').earTwitch,bodyPose(.38,'idle').earTwitch);
assert.ok(bodyPose(.1,'paw').vertical>bodyPose(.1,'idle').vertical);
assert.ok(bodyPose(.1,'belly').vertical>bodyPose(.1,'idle').vertical);
assert.ok(bodyPose(1,'idle','feed',.1).frontPaws.some(v=>v>0)||bodyPose(.7,'idle','feed',.1).frontPaws.some(v=>v>0));
assert.ok(bodyPose(1,'play',null,0,true).vertical < bodyPose(1,'play').vertical);
assert.equal(bodyPose(NaN).tailSegments.length,7);
console.log('PASS: Pibo body/ear/tail/paw motion envelopes');
