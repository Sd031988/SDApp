// Run from repository root: node kids/pibo-smoke-test.mjs
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {runPiboSmoke} from './pibo-smoke.js';
const dir=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(dir,'index.html'),'utf8');
const care=readFileSync(join(dir,'pibo-care.js'),'utf8');
const rewards=readFileSync(join(dir,'pibo-rewards.mjs'),'utf8');
const face=readFileSync(join(dir,'pibo-face.mjs'),'utf8');
const motion=readFileSync(join(dir,'pibo-motion.mjs'),'utf8');
const result=runPiboSmoke(html,care,rewards,face,motion);
console.log(JSON.stringify(result,null,2));
if(result.status!=='PASS')process.exitCode=1;
