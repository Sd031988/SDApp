/** Opt-in CPU frame-time sampler. No GPU timing or hardware performance claims. */
export function createFrameSampler({capacity=2048, now=()=>performance.now()}={}) {
  if(!Number.isSafeInteger(capacity)||capacity<2||capacity>100000) throw new RangeError('capacity');
  if(typeof now!=='function') throw new TypeError('clock');
  const samples=new Float64Array(capacity);
  let count=0, next=0, active=null;
  function record(milliseconds) {
    if(!Number.isFinite(milliseconds)||milliseconds<0||milliseconds>60000) throw new RangeError('duration');
    samples[next]=milliseconds; next=(next+1)%capacity; count=Math.min(count+1,capacity);
    return milliseconds;
  }
  function begin() {
    if(active!==null) throw new Error('frame already active');
    const t=now(); if(!Number.isFinite(t)) throw new RangeError('clock');
    active=t;
  }
  function end() {
    if(active===null) throw new Error('frame not active');
    const start=active;active=null;
    return record(now()-start);
  }
  function snapshot() {
    const ordered=Array.from(samples.slice(0,count)).sort((a,b)=>a-b);
    const percentile=p=>ordered.length?ordered[Math.ceil(p*ordered.length)-1]:null;
    const total=ordered.reduce((a,b)=>a+b,0);
    return Object.freeze({count,capacity,p50:percentile(.5),p95:percentile(.95),
      min:ordered.length?ordered[0]:null,max:ordered.length?ordered.at(-1):null,
      mean:ordered.length?total/ordered.length:null,
      over16ms:ordered.filter(x=>x>16.667).length});
  }
  return Object.freeze({record,begin,end,snapshot,reset(){count=0;next=0;active=null;}});
}
