import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PiboAudio} from './pibo-audio.js';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('./pibo-premium.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('./pibo-premium.js',import.meta.url),'utf8');
assert(html.includes('class="pibo-play-view"'),'Cat-first stage wrapper is missing');
assert(html.includes('class="pibo-controls"'),'Independent control region missing');
assert(html.includes('id="piboActionTabs"'),'Action filters are missing');
assert(html.includes('pibo-premium.css')&&html.includes('pibo-premium.js'));
assert(css.includes('position:sticky'),'Cat must stay in view on mobile');
assert(css.includes('grid-template-columns:minmax(0,1fr) minmax(310px,390px)'),'Cat/control split missing on desktop');
assert(css.includes('.actions button[hidden]'),'Inactive action groups should not take screen space');
assert(css.includes('height:clamp(240px,43dvh,410px)'),'Mobile stage must have a bounded height');
const actions=[...html.matchAll(/<button\b([^>]*)>/g)]
 .map(m=>({act:m[1].match(/\bdata-act="([^"]+)"/)?.[1],id:m[1].match(/\bid="([^"]+)"/)?.[1]}))
 .filter(b=>b.act||['scrub','rinse','dry','lamp','foodchoice','potty','flush','sound','catVoice','talk','surprise','minigame','mousegame','decorate','outfit','photo'].includes(b.id));
const grouped={
 care:['pet','feed','sleep','wash','scrub','rinse','dry','lamp','foodchoice','potty','flush'],
 games:['play','minigame','mousegame'],
 style:['outfit','decorate','photo'],
 extras:['sound','catVoice','talk','surprise']
};
const seen=[...Object.values(grouped).flat()];
for(const b of actions){const name=b.act||b.id;assert(seen.includes(name),'Pibo action unassigned to category: '+name)}
const urls=[];
const oldWindow=globalThis.window;
class RecordedAudio{
 constructor(url){urls.push(url);this.url=url;this.volume=1;this.handlers={}}
 addEventListener(name,fn){this.handlers[name]=fn}
 play(){return Promise.resolve()}
 pause(){}
}
try{
 globalThis.window={Audio:RecordedAudio};
 const audio=new PiboAudio();
 audio.setVolume(.35);audio.play('meow');audio.play('purr');
 assert.equal(urls.length,2);
 assert(urls[0].includes('Maullido_de_gata_hembra_joven.ogg'));
 assert(urls[1].includes('Whiskers%27_purr.ogg'));
 assert(Math.abs(audio.realVoice.volume-.315)<.0001);
 audio.setVolume(0);assert.equal(audio.realVoice.volume,0);
 audio.play('meow');
 assert(urls[2].includes('Maullido_de_gata_hembra.ogg'),'Second meow must sound different');
 audio.stop();
 assert.equal(audio.realVoice,null,'Mute stops active real cat audio immediately');
}finally{globalThis.window=oldWindow}
console.log('PASS: Modern cat-first 3D layout, category assignments, real cat sound sources, volume and mute');
