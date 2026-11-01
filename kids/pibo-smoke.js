// Headless smoke test for Pibo's browser script. Run via node kids/pibo-smoke-test.mjs.
// Mocks WebGL, so this verifies event wiring and scene logic, NOT actual rendering or audio quality.
export function runPiboSmoke(html,careSource){
 const vec=(x=0,y=0,z=0)=>({x,y,z,set(a=0,b=0,c=0){this.x=a;this.y=b;this.z=c;return this},setScalar(a){this.x=a;this.y=a;this.z=a;return this}});
 let wardrobeButtons=[];
 function element(id){return {id,style:{},dataset:{},hidden:false,attrs:{},children:[],clientWidth:800,clientHeight:440,textContent:'',handlers:{},
   addEventListener(n,f){this.handlers[n]=f},setAttribute(n,v){this.attrs[n]=v},appendChild(c){this.children.push(c)},remove(){},click(){this.handlers.click?.({})},
   getBoundingClientRect(){return {left:0,top:0,width:800,height:440}},querySelectorAll(q){return q==='[data-outfit]'?wardrobeButtons:[]},
   set innerHTML(s){if(id==='wardrobe')wardrobeButtons=[...s.matchAll(/data-outfit="(\d+)"/g)].map(m=>{const b=element('outfit'+m[1]);b.dataset.outfit=m[1];return b})},get innerHTML(){return ''}}}
 class Obj{
   constructor(...args){this.children=[];this.position=vec();this.rotation=vec();this.scale=vec(1,1,1);this.color={setHex(){}};this.shadow={mapSize:{set(){}},camera:{}};this.shadowMap={};this.userData={};this.geometry={dispose(){}};this.material={color:{setHex(){}},dispose(){}};this.style={};this.visible=true;this.domElement=element('canvas');this.domElement.toDataURL=()=>'data:image/png;base64,abc';this.clock=0}
   add(o){this.children.push(o)}remove(o){this.children=this.children.filter(x=>x!==o)}
   traverse(f){f(this);for(const c of this.children)c.traverse(f)}
   setHex(){}lookAt(){}updateProjectionMatrix(){}setPixelRatio(){}setSize(){}render(){}setFromCamera(){}intersectObjects(){return []}getElapsedTime(){return this.clock+=.2}dispose(){}
 }
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,element(id));return elements.get(id)};
 const tags=[...html.matchAll(/<button\b([^>]*)>/g)].map(x=>x[1]),groups={act:[],room:[],food:[]};
 for(const tag of tags)for(const k of Object.keys(groups)){const m=tag.match(new RegExp('data-'+k+'="([^"]+)"'));if(m){const b=element(k+m[1]);b.dataset[k]=m[1];groups[k].push(b)}}
 const document={getElementById:get,createElement:element,querySelectorAll(sel){if(sel==='[data-act]')return groups.act;if(sel==='[data-room]')return groups.room;if(sel==='[data-food]')return groups.food;if(sel==='[data-outfit]')return wardrobeButtons;return []}};
 const THREE=new Proxy({PCFSoftShadowMap:1,SRGBColorSpace:2},{get(t,p){if(p in t)return t[p];return class extends Obj{constructor(...args){super(...args);if(p==='Mesh'){this.geometry=args[0];this.material=args[1]}}}}});
 const PiboCare=new Function(careSource.replace('export class PiboCare','class PiboCare')+';return PiboCare')();
 const sounds=[];class PiboAudio{play(s){sounds.push(s)}}
 const storage=new Map(),localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 let now=0;const performance={now:()=>now},frames=[];
 const requestAnimationFrame=f=>frames.push(f),setTimeout=()=>1,clearTimeout=()=>{};
 const win={addEventListener(){},MediaRecorder:null},navigator={};const ResizeObserver=class{observe(){}};
 const js=html.split('<script type="module">')[1].split('</script>')[0].replace(/^\s*import[^\n]*\n/gm,'');
 if(!js)throw Error('No game script found');
 const launch=new Function('THREE','PiboAudio','PiboCare','window','document','localStorage','performance','navigator','requestAnimationFrame','ResizeObserver','devicePixelRatio','setTimeout','clearTimeout',js);
 launch(THREE,PiboAudio,PiboCare,win,document,localStorage,performance,navigator,requestAnimationFrame,ResizeObserver,1,setTimeout,clearTimeout);
 const click=(key,val)=>{const b=groups[key]?.find(x=>x.dataset[key]===val)||get(val===undefined?key:val);if(!b?.handlers?.click)throw Error('Missing click '+key+':'+val);b.click()};
 const frame=(n=1)=>{for(let i=0;i<n;i++){now+=150;const cb=frames.shift();if(!cb)throw Error('No animation frame');cb()}};
 for(const room of ['living','kitchen','bedroom','bathroom','toilet']){click('room',room);frame()}
 click('food','3');click('act','feed');frame(50);
 click('act','wash');frame(50);
 click('act','sleep');frame(65);
 click('potty');frame(55);
 click('outfit');if(wardrobeButtons.length!==12)throw Error('Wardrobe has '+wardrobeButtons.length+' outfits, expected 12');
 wardrobeButtons[11].click();click('surprise');click('minigame');click('mousegame');click('photo');frame();
 if(!storage.has('sd-kids-pibo-v1'))throw Error('Game progress not persisted');
 if(!sounds.includes('chew')||!sounds.includes('flush')||!sounds.includes('splash'))throw Error('Missing care sound triggers: '+sounds.join(','));
 return {status:'PASS',checks:['startup','5 room navigation','food choice','feeding','bathing','sleeping','toilet and flush','12 outfits','daily gift','two minigame toggles','photo','local save'],sounds:[...new Set(sounds)],frames:226}
}
