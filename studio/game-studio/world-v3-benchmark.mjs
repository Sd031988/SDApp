/** Deterministic CPU-only benchmark harness. No GPU/FPS performance claims. */
export function makeWorldFixture({seed=1,cells=16,objectsPerCell=32}={}) {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff) throw new RangeError('seed');
 if(!Number.isSafeInteger(cells)||cells<1||cells>256) throw new RangeError('cells');
 if(!Number.isSafeInteger(objectsPerCell)||objectsPerCell<0||objectsPerCell>8192||cells*objectsPerCell>8192) throw new RangeError('objectsPerCell');
 let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const result=[];for(let c=0;c<cells;c++){const objects=[];for(let i=0;i<objectsPerCell;i++)objects.push(Object.freeze({id:`c${c}-o${i}`,x:rand()*640,z:rand()*640,radius:0.5+rand()*3}));result.push(Object.freeze({id:`cell-${c}`,objects:Object.freeze(objects)}));}return Object.freeze(result);
}
export function summarizeDurations(values) {
 if(!Array.isArray(values)||values.length===0||values.length>100000)throw new RangeError('samples');
 if(values.some(v=>!Number.isFinite(v)||v<0||v>60000))throw new RangeError('duration');
 const ordered=[...values].sort((a,b)=>a-b);const sum=ordered.reduce((a,b)=>a+b,0);
 return Object.freeze({count:ordered.length,p50:ordered[Math.ceil(ordered.length*.5)-1],p95:ordered[Math.ceil(ordered.length*.95)-1],mean:sum/ordered.length,min:ordered[0],max:ordered.at(-1)});
}
export async function benchmark({run,warmup=10,iterations=100,clock=()=>performance.now()}={}) {
 if(typeof run!=='function'||typeof clock!=='function')throw new TypeError('callback');
 if(!Number.isSafeInteger(warmup)||warmup<0||warmup>10000)throw new RangeError('warmup');
 if(!Number.isSafeInteger(iterations)||iterations<2||iterations>100000)throw new RangeError('iterations');
 const measure=async()=>{const start=clock();if(!Number.isFinite(start))throw new RangeError('clock');await run();const end=clock();if(!Number.isFinite(end)||end<start)throw new RangeError('clock');return end-start;};
 for(let i=0;i<warmup;i++)await measure();const samples=[];for(let i=0;i<iterations;i++)samples.push(await measure());return Object.freeze({warmup,iterations,...summarizeDurations(samples)});
}
