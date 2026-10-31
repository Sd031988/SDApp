/* SD Hub · B1 Prüfungstraining · eigenständige Erweiterung innerhalb Deutsch lernen.
   Eigene Modellaufgaben; keine offiziellen Prüfungsunterlagen. */
(() => {
  'use strict';
  const EXAMS = {
    goethe: {name:'Goethe-Zertifikat B1', desc:'Prüfungstraining auf Niveau B1'},
    telc: {name:'telc Deutsch B1', desc:'Prüfungstraining auf Niveau B1'},
    dtz: {name:'Deutsch-Test für Zuwanderer (DTZ)', desc:'Training für A2–B1'}
  };
  const TASKS = {
    lesen: [
      {text:'Aushang im Bürgerbüro: Wegen einer Fortbildung bleibt das Büro am Mittwoch geschlossen. Bereits vereinbarte Termine werden telefonisch verschoben.',q:'Was passiert mit bereits vereinbarten Terminen?',options:['Sie fallen ohne Ersatz aus.','Das Büro vereinbart telefonisch neue Termine.','Man muss am Mittwoch persönlich erscheinen.'],answer:1},
      {text:'E-Mail: Liebe Frau Becker, der Deutschkurs beginnt nächste Woche nicht um 9 Uhr, sondern erst um 10:30 Uhr. Bitte bringen Sie das Kursbuch mit. Viele Grüße, Frau Özdemir.',q:'Was hat sich geändert?',options:['Der Kursort.','Die Lehrerin.','Die Anfangszeit.'],answer:2},
      {text:'Wohnungsanzeige: Helle Zweizimmerwohnung, 55 m², ab Dezember frei. Haustiere nach Absprache erlaubt. Besichtigung nur mit Termin.',q:'Welche Aussage stimmt?',options:['Haustiere sind grundsätzlich verboten.','Eine Besichtigung muss vereinbart werden.','Die Wohnung ist sofort frei.'],answer:1}
    ],
    hoeren: [
      {text:'Guten Tag, hier ist die Praxis Dr. Weber. Ihr Termin am Donnerstag um 14 Uhr muss leider verschoben werden. Bitte kommen Sie stattdessen am Freitag um 11 Uhr.',q:'Wann ist der neue Arzttermin?',options:['Donnerstag um 14 Uhr','Freitag um 11 Uhr','Freitag um 14 Uhr'],answer:1},
      {text:'Achtung, eine Durchsage: Der Regionalzug nach Mannheim fährt heute ausnahmsweise von Gleis vier statt von Gleis zwei.',q:'Von welchem Gleis fährt der Zug?',options:['Gleis zwei','Gleis drei','Gleis vier'],answer:2},
      {text:'Hallo Amir, ich kann heute leider nicht zum Sport kommen. Ich muss länger arbeiten. Können wir uns morgen um sechs treffen?',q:'Warum kann die Person heute nicht kommen?',options:['Sie muss arbeiten.','Sie ist krank.','Sie fährt in Urlaub.'],answer:0}
    ],
    schreiben: [
      {q:'Du hast dich für einen Deutschkurs angemeldet, kannst aber am ersten Tag nicht kommen. Schreibe eine E-Mail an die Sprachschule. Erkläre den Grund, bitte um Informationen und frage nach den Unterrichtsmaterialien.',hint:'Schreibe etwa 80–100 Wörter. Begrüßung, Grund, Bitte, Frage und Gruß nicht vergessen.'},
      {q:'Dein Nachbar hört abends sehr laut Musik. Schreibe eine höfliche Nachricht. Beschreibe das Problem, erkläre deine Situation und schlage eine Lösung vor.',hint:'Schreibe eine höfliche Nachricht mit ungefähr 80–100 Wörtern.'}
    ],
    sprechen: [
      {q:'Stelle dich vor: Name, Herkunft, Wohnort, Beruf, Sprachen und Hobbys.',hint:'Sprich ungefähr eine Minute frei.'},
      {q:'Ihr möchtet gemeinsam einen Ausflug planen. Sprich über Ziel, Termin, Verkehrsmittel und Kosten.',hint:'Formuliere Vorschläge und begründe deine Meinung.'}
    ]
  };
  const labels = {lesen:'📖 Lesen',hoeren:'🎧 Hören',schreiben:'✍️ Schreiben',sprechen:'🎤 Sprechen'};
  let exam = 'goethe', part = null, index = 0, answers = [], started = 0, timer = null, root = null, previous = null;
  const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = id => document.getElementById(id);
  function clearTimer(){ if(timer){clearInterval(timer);timer=null;} }
  function close(){
    clearTimer();
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if(root) root.remove(); root=null;
    if(previous) previous.style.display='';
    previous=null;
  }
  function layout(inner){
    if(!root) return;
    root.innerHTML='<div class="b1-shell"><header class="b1-head"><button id="b1-back" type="button" aria-label="Zur Prüfungsübersicht">‹ Zurück</button><strong>🎓 B1 Prüfungstraining</strong><button id="b1-close" type="button" aria-label="Schließen">✕</button></header><main class="b1-main">'+inner+'</main></div>';
    $('b1-close').onclick=close;
    $('b1-back').onclick=()=>{clearTimer(); if(part){part=null; overview();} else close();};
  }
  function open(){
    if(root) return;
    const host=$('lBody');
    if(!host) return;
    previous=host;
    host.style.display='none';
    root=document.createElement('section');
    root.id='sd-b1-exam';
    root.setAttribute('aria-label','B1 Prüfungstraining');
    host.parentNode.insertBefore(root,host.nextSibling);
    overview();
  }
  function overview(){
    part=null; clearTimer();
    layout('<h2>Prüfung auswählen</h2><p class="b1-muted">Eigene Übungsaufgaben zur Vorbereitung, keine offiziellen Prüfungsfragen.</p>'+
      '<div class="b1-options">'+Object.entries(EXAMS).map(([id,e])=>'<button class="b1-choice '+(exam===id?'selected':'')+'" data-exam="'+id+'"><b>'+esc(e.name)+'</b><small>'+esc(e.desc)+'</small></button>').join('')+'</div>'+
      '<h3>Prüfungsteil üben</h3><div class="b1-grid">'+Object.entries(labels).map(([id,label])=>'<button class="b1-choice" data-part="'+id+'"><b>'+label+'</b><small>'+TASKS[id].length+' Modellaufgaben</small></button>').join('')+'</div>'+
      '<p class="b1-muted">Die Aufgaben sind eine erste Trainingsversion. Prüfungsdauer und Bewertung entsprechen noch keiner vollständigen Originalprüfung.</p>');
    root.querySelectorAll('[data-exam]').forEach(b=>b.onclick=()=>{exam=b.dataset.exam;overview();});
    root.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{part=b.dataset.part;index=0;answers=[];started=Date.now();question();});
  }
  function speak(text){
    if(!text) return;
    const base=window.SDLernAPI && window.SDLernAPI.SERVER;
    if(base){
      const audio=new Audio(base+'/hub/tts?text='+encodeURIComponent(text)+'&voice=de-DE-KatjaNeural&rate=-15%');
      audio.play().catch(()=>fallback(text));
    } else fallback(text);
  }
  function fallback(text){
    if(!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);u.lang='de-DE';u.rate=.85;speechSynthesis.speak(u);
  }
  function question(){
    clearTimer();
    const tasks=TASKS[part], t=tasks[index];
    if(!t){finish();return;}
    let input='';
    if(part==='lesen'||part==='hoeren'){
      input=(part==='lesen'?'<div class="b1-passage">'+esc(t.text)+'</div>':'<button class="b1-audio" id="b1-play">🔊 Hörtext abspielen</button>')+
        '<p><b>'+esc(t.q)+'</b></p><div class="b1-options">'+t.options.map((v,i)=>'<label class="b1-answer"><input type="radio" name="b1-answer" value="'+i+'"> '+esc(v)+'</label>').join('')+'</div>';
    } else {
      input='<p class="b1-passage">'+esc(t.q)+'</p><p class="b1-muted">'+esc(t.hint)+'</p>'+
        '<textarea id="b1-response" rows="8" placeholder="'+(part==='sprechen'?'Notizen für deine mündliche Antwort …':'Schreibe hier deinen Text …')+'"></textarea>'+
        (part==='sprechen'?'<button class="b1-audio" id="b1-play">🔊 Aufgabe vorlesen</button>':'');
    }
    layout('<p class="b1-muted">'+esc(EXAMS[exam].name)+' · '+labels[part]+'</p><div class="b1-progress">Aufgabe '+(index+1)+' von '+tasks.length+' <span id="b1-clock">00:00</span></div>'+input+
      '<button class="b1-next" id="b1-next">'+(index===tasks.length-1?'Auswertung':'Nächste Aufgabe')+'</button>');
    $('b1-back').onclick=()=>{clearTimer();part=null;overview();};
    if($('b1-play')) $('b1-play').onclick=()=>speak(t.text||t.q);
    $('b1-next').onclick=()=>{
      let response;
      if(part==='lesen'||part==='hoeren'){
        const checked=root.querySelector('input[name="b1-answer"]:checked');
        if(!checked){alert('Bitte wähle eine Antwort.');return;}
        response=Number(checked.value);
      } else response=($('b1-response').value||'').trim();
      answers.push(response);index++;question();
    };
    timer=setInterval(()=>{
      const sec=Math.floor((Date.now()-started)/1000);
      if($('b1-clock')) $('b1-clock').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
    },1000);
  }
  function finish(){
    clearTimer();
    const tasks=TASKS[part], automatic=part==='lesen'||part==='hoeren';
    const correct=automatic?answers.filter((a,i)=>a===tasks[i].answer).length:null;
    const result={exam,part,date:new Date().toISOString(),correct,total:tasks.length,answers,seconds:Math.round((Date.now()-started)/1000)};
    try{const old=JSON.parse(localStorage.getItem('sdB1Pruefungen')||'[]');old.push(result);localStorage.setItem('sdB1Pruefungen',JSON.stringify(old.slice(-30)));}catch(_){}
    const detail=automatic?'<h2>'+correct+' von '+tasks.length+' richtig</h2><p>'+Math.round(correct/tasks.length*100)+' % in diesem Übungsblock</p>'+
      tasks.map((t,i)=>'<div class="b1-passage"><b>Aufgabe '+(i+1)+'</b><p>'+esc(t.q)+'</p><small>Deine Antwort: '+esc(t.options[answers[i]])+'<br>Richtig: '+esc(t.options[t.answer])+'</small></div>').join(''):
      '<h2>Übungsblock abgeschlossen</h2><p>Deine Antwort wurde auf diesem Gerät gespeichert. Für Schreiben und Sprechen gibt es hier noch keine automatische Sprach- oder Textbewertung.</p>'+
      answers.map((a,i)=>'<div class="b1-passage"><b>Aufgabe '+(i+1)+'</b><p>'+esc(a||'(Keine Antwort)')+'</p></div>').join('');
    layout('<p class="b1-muted">'+esc(EXAMS[exam].name)+' · '+labels[part]+'</p>'+detail+
      '<button class="b1-next" id="b1-again">Zur Prüfungsübersicht</button>');
    $('b1-again').onclick=overview;
  }
  function attach(){
    if(root) return;
    const host=$('lBody');
    if(!host || !$('learn') || !host.querySelector('#lTrainBtn')) return;
    if(host.querySelector('#sdB1Entry')) return;
    const button=document.createElement('button');
    button.id='sdB1Entry';button.type='button';button.className='b1-entry';
    button.innerHTML='<b>🎓 B1-Prüfung vorbereiten</b><small>Goethe B1 · telc B1 · DTZ – Lesen, Hören, Schreiben und Sprechen</small>';
    button.onclick=open;
    const tiles=host.querySelector('.l-kacheln');
    if(tiles) tiles.insertAdjacentElement('afterend',button);
  }
  const style=document.createElement('style');
  style.textContent=`
    .b1-entry{display:flex;flex-direction:column;gap:5px;width:100%;margin:12px 0;padding:16px;text-align:left;color:#fff;background:linear-gradient(110deg,#9a3412,#c2410c);border:1px solid #fdba74;border-radius:16px;font:inherit;cursor:pointer}
    .b1-entry b{font-size:17px}.b1-entry small{font-size:12px;color:#ffedd5}
    #sd-b1-exam{flex:1;min-height:0;overflow:auto;background:var(--bg,#0a0a0f);color:var(--text,#fff)}
    .b1-shell{max-width:760px;margin:auto;padding:12px 16px 50px}.b1-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 0 18px}
    .b1-head button{background:var(--bg2,#171722);border:1px solid var(--border,#444);color:inherit;border-radius:10px;padding:10px;cursor:pointer}
    .b1-main h2{font-size:23px;margin:10px 0}.b1-main h3{margin:20px 0 10px}.b1-muted{color:var(--muted,#aaa);font-size:14px;line-height:1.5;margin:10px 0}
    .b1-options{display:grid;gap:10px;margin:14px 0}.b1-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .b1-choice,.b1-answer{display:flex;flex-direction:column;gap:5px;text-align:left;border:1px solid var(--border,#444);background:var(--bg2,#171722);color:inherit;padding:15px;border-radius:14px;font:inherit;cursor:pointer}
    .b1-choice.selected{border-color:#fdba74;background:rgba(194,65,12,.17)}.b1-choice small{color:var(--muted,#aaa)}
    .b1-answer{flex-direction:row;align-items:flex-start;line-height:1.5}.b1-answer input{margin:5px 7px 0 0}
    .b1-passage{padding:16px;background:var(--bg2,#171722);border:1px solid var(--border,#444);border-radius:14px;line-height:1.7;white-space:pre-wrap;margin:14px 0}
    .b1-progress{display:flex;justify-content:space-between;margin:18px 0;color:#fdba74;font-weight:700}
    .b1-next,.b1-audio{padding:14px 18px;border:0;border-radius:12px;font:inherit;font-weight:700;cursor:pointer;margin:12px 0;background:#c2410c;color:#fff}
    .b1-next{width:100%}.b1-audio{background:#334155}
    #b1-response{width:100%;min-height:180px;padding:14px;border-radius:12px;background:var(--bg2,#171722);color:inherit;border:1px solid var(--border,#444);font:inherit}
  `;
  document.head.appendChild(style);
  new MutationObserver(attach).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',attach);else attach();
})();
