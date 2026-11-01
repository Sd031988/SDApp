import assert from 'node:assert/strict';
import {facePose,smoothstep} from './pibo-face.mjs';
assert.equal(smoothstep(-2),0);
assert.equal(smoothstep(2),1);
assert.equal(smoothstep(.5),.5);
for(let i=0;i<200;i++){
 const pose=facePose(i/27,'idle');
 assert.ok(pose.eyeClose>=0 && pose.eyeClose<=1);
 assert.ok(pose.mouthOpen>=0);
}
assert.equal(facePose(1,'sleep').eyeClose,1);
assert.equal(facePose(1,'idle','sleep').eyeClose,1);
assert.ok(facePose(.1,'pet').smile===1);
assert.ok(facePose(.1,'idle','feed').mouthOpen>.04);
console.log('PASS: facial poses and chewing envelope');
