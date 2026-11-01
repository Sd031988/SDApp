// Run on every Pibo commit to prevent aspirational features from being
// incorrectly reported as finished. This test verifies the scorecard's
// integrity, not visual or auditory equality with another copyrighted game.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve,relative,sep} from 'node:path';
const folder=dirname(fileURLToPath(import.meta.url));
const matrix=JSON.parse(readFileSync(resolve(folder,'pibo-benchmark.json'),'utf8'));
const allowed=new Set(['basis','teilweise','fehlt']);
assert.equal(matrix.schema_version,1);
assert(matrix.criteria.length>=20,'Benchmark must compare every key interaction category');
for(const key of ['official','google_play','bathroom_2026','backyard_2026','adventure_2026']){
 assert(matrix.sources[key]?.startsWith('https://'),'Use independent and public reference sources');
}
const ids=new Set(),groups=new Set();
for(const check of matrix.criteria){
 assert.match(check.id,/^[a-z_]+$/);
 assert(!ids.has(check.id),'Duplicate comparison item: '+check.id);ids.add(check.id);
 assert(allowed.has(check.status),'Unverified quality must never be marked finished: '+check.id);
 assert(check.area&&check.reference?.length>15&&check.acceptance?.length>20,'Missing reference or acceptance criteria');
 groups.add(check.area);
 assert(Array.isArray(check.evidence));
 if(check.status==='fehlt')assert.equal(check.evidence.length,0,'Unimplemented feature must not claim source proof');
 else assert(check.evidence.length>0,'Existing feature must have evidence');
 for(const file of check.evidence){
  const target=resolve(folder,'..',file);
  const rel=relative(resolve(folder,'..'),target);
  assert(rel&&rel!=='..'&&!rel.startsWith('..'+sep),'Unsafe evidence path: '+file);
  assert(existsSync(target),'Evidence file missing: '+file);
 }
}
assert(groups.size>=7,'Benchmark must include graphics, gameplay, audio, testing, privacy and more');
const missing=matrix.criteria.filter(x=>x.status==='fehlt').length;
const partial=matrix.criteria.filter(x=>x.status==='teilweise').length;
assert(missing>=1||partial>=1,'Do not declare total perfection without independent QA');
console.log('Pibo premium gap report: '+matrix.criteria.length+' areas; '+partial+' partial; '+missing+' missing. No quality parity claimed.');
