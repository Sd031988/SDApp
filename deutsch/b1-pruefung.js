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
  // Erweiterte, eigens verfasste Alltagssituationen für größere Übungsblöcke.
  TASKS.lesen.push(...[{"text":"Die Stadtbibliothek bietet ab Januar längere Öffnungszeiten an. Montags bleibt sie weiterhin geschlossen.","q":"Wann ist die Bibliothek geschlossen?","options":["Jeden Montag","Jeden Freitag","Den ganzen Januar"],"answer":0},{"text":"Im Supermarkt gibt es am Samstag frisches Obst zum halben Preis. Das Angebot gilt nur bis 12 Uhr.","q":"Bis wann gilt das Angebot?","options":["Bis 18 Uhr","Bis 12 Uhr","Bis Sonntag"],"answer":1},{"text":"Der Hausmeister informiert: Am Dienstag wird zwischen 8 und 13 Uhr das Wasser abgestellt. Bitte bereiten Sie sich darauf vor.","q":"Was ist am Dienstag nicht verfügbar?","options":["Der Strom","Das Internet","Das Wasser"],"answer":2},{"text":"Die Volkshochschule bietet einen kostenlosen Informationsabend zum Thema Ausbildung an. Eine Anmeldung ist erforderlich.","q":"Was muss man vor dem Besuch tun?","options":["Sich anmelden","Ein Buch kaufen","Eine Prüfung ablegen"],"answer":0},{"text":"Frau Klein schreibt: Die Besprechung beginnt heute erst um 15 Uhr. Bitte bringen Sie Ihre Unterlagen mit.","q":"Was sollen die Teilnehmer mitbringen?","options":["Getränke","Unterlagen","Sportkleidung"],"answer":1},{"text":"Im Schwimmbad findet am Sonntag ein Wettbewerb statt. Deshalb ist das normale Schwimmen erst ab 16 Uhr möglich.","q":"Wann können Besucher normal schwimmen?","options":["Ab 8 Uhr","Ab 12 Uhr","Ab 16 Uhr"],"answer":2},{"text":"Die Apotheke am Markt hat heute Notdienst. Sie ist auch nach 20 Uhr geöffnet.","q":"Welche Aussage stimmt?","options":["Die Apotheke hat länger geöffnet.","Die Apotheke ist geschlossen.","Es gibt keine Medikamente."],"answer":0},{"text":"Im Stadtpark dürfen Hunde nur an der Leine laufen. Auf der Hundewiese dürfen sie frei spielen.","q":"Wo dürfen Hunde ohne Leine laufen?","options":["Auf allen Wegen","Auf der Hundewiese","Auf dem Spielplatz"],"answer":1},{"text":"Das Bürgeramt bittet darum, Anträge möglichst online einzureichen. Persönliche Termine sind weiterhin möglich.","q":"Wie kann man Anträge einreichen?","options":["Nur telefonisch","Nur persönlich","Auch online"],"answer":2},{"text":"Die Musikschule veranstaltet am Freitag ein Konzert. Der Eintritt ist kostenlos, aber die Plätze sind begrenzt.","q":"Wie viel kostet der Eintritt?","options":["Nichts","Fünf Euro","Zehn Euro"],"answer":0},{"text":"Die Firma bietet ihren Beschäftigten ab Mai ein Jobticket an. Interessierte müssen das Formular bis Ende April abgeben.","q":"Bis wann muss das Formular abgegeben werden?","options":["Bis Ende Mai","Bis Ende April","Bis Anfang Juni"],"answer":1},{"text":"Im Restaurant werden heute wegen einer technischen Störung nur kalte Speisen angeboten.","q":"Was können Gäste heute bestellen?","options":["Nur Getränke","Warme Hauptgerichte","Kalte Speisen"],"answer":2},{"text":"Die Elternversammlung der Klasse 6b findet am Donnerstag um 18:30 Uhr in Raum 204 statt.","q":"Wo findet die Versammlung statt?","options":["In Raum 204","In der Turnhalle","In Raum 104"],"answer":0},{"text":"Ein Fahrradgeschäft bietet kostenlose Reparaturberatung an. Ersatzteile müssen Kunden jedoch selbst bezahlen.","q":"Was ist kostenlos?","options":["Alle Ersatzteile","Die Beratung","Jede Reparatur"],"answer":1},{"text":"Die Stadt informiert: Die Brücke über den Fluss bleibt wegen Bauarbeiten bis zum 15. Juni gesperrt.","q":"Warum ist die Brücke gesperrt?","options":["Wegen eines Festes","Wegen Hochwassers","Wegen Bauarbeiten"],"answer":2},{"text":"Die Kita bittet alle Eltern, ihre Kinder spätestens bis 8:45 Uhr zu bringen, damit das gemeinsame Frühstück pünktlich beginnen kann.","q":"Wann sollen die Kinder spätestens da sein?","options":["Um 8:45 Uhr","Um 9:30 Uhr","Um 10 Uhr"],"answer":0},{"text":"Ab nächster Woche gibt es im Fitnessstudio einen Yogakurs am Mittwochabend. Mitglieder zahlen dafür keinen Aufpreis.","q":"Wer muss keinen Aufpreis bezahlen?","options":["Alle Besucher","Mitglieder","Nur Kinder"],"answer":1},{"text":"Die Bankfiliale zieht zum Monatsende in die Bahnhofstraße um. Die Telefonnummer bleibt gleich.","q":"Was ändert sich?","options":["Die Telefonnummer","Die Öffnungszeiten","Die Adresse"],"answer":2},{"text":"Für die Teilnahme am Computerkurs sind Grundkenntnisse erforderlich. Eigene Laptops können mitgebracht werden.","q":"Was wird vorausgesetzt?","options":["Grundkenntnisse","Ein eigener Laptop","Ein Hochschulabschluss"],"answer":0},{"text":"Der Wochenmarkt findet wegen des Feiertags ausnahmsweise am Donnerstag statt.","q":"Wann findet der Markt statt?","options":["Am Mittwoch","Am Donnerstag","Am Samstag"],"answer":1},{"text":"Die Schule informiert: Wegen der Hitze endet der Unterricht morgen bereits um 12 Uhr.","q":"Wann endet der Unterricht?","options":["Um 10 Uhr","Um 14 Uhr","Um 12 Uhr"],"answer":2},{"text":"Die Praxis nimmt neue Patienten nur nach telefonischer Vereinbarung an.","q":"Was ist nötig?","options":["Ein Anruf vor dem Besuch","Eine E-Mail an die Stadt","Ein Besuch ohne Termin"],"answer":0}]);
  TASKS.hoeren.push(...[{"text":"Hier spricht die Werkstatt. Ihr Fahrrad ist fertig. Sie können es morgen ab neun Uhr abholen.","q":"Wann kann man das Fahrrad abholen?","options":["Heute Abend","Morgen ab neun","Erst nächste Woche"],"answer":1},{"text":"Liebe Fahrgäste, der Bus Richtung Innenstadt hält heute nicht am Rathaus. Nutzen Sie bitte die Haltestelle Theater.","q":"Wo soll man einsteigen?","options":["Am Rathaus","Am Bahnhof","Am Theater"],"answer":2},{"text":"Hallo Lea, unser Treffen am Samstag findet nicht im Café statt. Wir treffen uns im Park am Brunnen.","q":"Wo ist das Treffen?","options":["Im Park","Im Café","Im Kino"],"answer":0},{"text":"Die Wettervorhersage: Am Vormittag bleibt es trocken, ab dem Nachmittag ist mit Regen zu rechnen.","q":"Wann soll es regnen?","options":["In der Nacht","Am Nachmittag","Am Vormittag"],"answer":1},{"text":"Guten Morgen. Der Elternabend beginnt heute um halb sieben und nicht wie angekündigt um sechs.","q":"Wann beginnt der Elternabend?","options":["Um sechs","Um sieben","Um halb sieben"],"answer":2},{"text":"Hallo, hier ist die Bibliothek. Das bestellte Buch ist angekommen. Bitte holen Sie es innerhalb einer Woche ab.","q":"Wie lange kann man das Buch abholen?","options":["Eine Woche","Einen Monat","Nur heute"],"answer":0},{"text":"Achtung, die Rolltreppe zum Gleis ist defekt. Bitte benutzen Sie den Aufzug neben dem Eingang.","q":"Was sollen Fahrgäste benutzen?","options":["Die Rolltreppe","Den Aufzug","Die Treppe am Ausgang"],"answer":1},{"text":"Guten Tag, Ihr Paket liegt in der Postfiliale. Bringen Sie zur Abholung bitte Ihren Ausweis mit.","q":"Was muss man mitbringen?","options":["Eine Rechnung","Ein Foto","Den Ausweis"],"answer":2},{"text":"Liebe Kursteilnehmer, morgen findet der Unterricht online statt. Sie bekommen den Link heute per E-Mail.","q":"Wo findet der Unterricht statt?","options":["Im Internet","Im Klassenzimmer","In der Bibliothek"],"answer":0},{"text":"Hier ist das Restaurant Sonnengarten. Ihre Reservierung für vier Personen am Freitag um 19 Uhr ist bestätigt.","q":"Für wie viele Personen ist reserviert?","options":["Zwei","Vier","Sechs"],"answer":1},{"text":"Die Ausstellung ist am Sonntag nur bis 15 Uhr geöffnet. An anderen Tagen schließen wir um 18 Uhr.","q":"Wann schließt die Ausstellung am Sonntag?","options":["Um 12 Uhr","Um 18 Uhr","Um 15 Uhr"],"answer":2},{"text":"Hallo, ich bin's. Ich komme etwa zwanzig Minuten später, weil mein Zug Verspätung hat.","q":"Warum kommt die Person später?","options":["Wegen des Zuges","Wegen der Arbeit","Wegen des Wetters"],"answer":0},{"text":"Der Sportkurs fällt heute wegen Krankheit der Trainerin aus. Nächste Woche findet er wieder statt.","q":"Warum fällt der Kurs aus?","options":["Wegen Ferien","Wegen Krankheit","Wegen Renovierung"],"answer":1},{"text":"Die Stadtverwaltung informiert: Neue Parkausweise können ab Montag im Internet beantragt werden.","q":"Ab wann kann man den Antrag stellen?","options":["Ab Freitag","Ab Sonntag","Ab Montag"],"answer":2},{"text":"Hallo Sara, ich habe die Kinokarten gekauft. Der Film beginnt um 20 Uhr, aber wir sollten schon um 19:30 Uhr da sein.","q":"Wann sollen die Freunde da sein?","options":["Um 19:30 Uhr","Um 20:30 Uhr","Um 21 Uhr"],"answer":0},{"text":"Liebe Kunden, die Reparatur Ihres Computers dauert zwei Tage länger als geplant. Wir bitten um Verständnis.","q":"Was ist das Problem?","options":["Der Computer ist verloren.","Die Reparatur dauert länger.","Die Reparatur ist teurer."],"answer":1},{"text":"Im Radio hören Sie: Auf der Autobahn gibt es nach einem Unfall zehn Kilometer Stau. Fahren Sie bitte über die Landstraße.","q":"Was wird empfohlen?","options":["Schneller fahren","Auf der Autobahn bleiben","Die Landstraße nehmen"],"answer":2}]);
  TASKS.schreiben.push(
    {q:'Schreibe eine E-Mail an deinen Vermieter. Die Heizung funktioniert nicht. Beschreibe das Problem, erkläre die Folgen und bitte um einen Reparaturtermin.',hint:'Achte auf eine höfliche Anrede und alle drei Inhaltspunkte.'},
    {q:'Du hast einen neuen Arbeitsplatz gefunden. Schreibe einem Freund, was du dort machst, wie die Kollegen sind und wann ihr euch wiedersehen könnt.',hint:'Schreibe einen zusammenhängenden persönlichen Text.'},
    {q:'Schreibe einen Forumsbeitrag: Sollten Kinder schon in der Grundschule ein eigenes Smartphone haben? Begründe deine Meinung mit Beispielen.',hint:'Einleitung, eigene Meinung, Gründe, Schluss.'},
    {q:'Du hast eine Rechnung erhalten, obwohl du bereits bezahlt hast. Schreibe eine formelle Nachricht und bitte um Klärung.',hint:'Beschreibe die Situation sachlich und höflich.'}
  );
  TASKS.sprechen.push(
    {q:'Plane mit einer anderen Person eine Geburtstagsfeier: Ort, Essen, Gäste und Aufgabenverteilung.',hint:'Mache Vorschläge, stimme zu oder widersprich höflich.'},
    {q:'Präsentiere das Thema „Lernen mit dem Internet“. Berichte von eigenen Erfahrungen, nenne Vorteile und Nachteile und äußere deine Meinung.',hint:'Sprich frei und strukturiert.'},
    {q:'Berichte über eine wichtige Erfahrung beim Deutschlernen und beantworte mögliche Nachfragen.',hint:'Verwende Beispiele und vollständige Sätze.'},
    {q:'Plant gemeinsam einen Besuch bei einem kranken Freund. Sprecht über Termin, Anfahrt, Geschenk und Dauer.',hint:'Stellt Fragen und findet eine gemeinsame Lösung.'}
  );
  const labels = {lesen:'📖 Lesen',hoeren:'🎧 Hören',schreiben:'✍️ Schreiben',sprechen:'🎤 Sprechen'};
  const duration = {goethe:{lesen:65,hoeren:40,schreiben:60,sprechen:15},telc:{lesen:90,hoeren:30,schreiben:30,sprechen:15},dtz:{lesen:45,hoeren:25,schreiben:30,sprechen:16}};
  let exam = 'goethe', part = null, index = 0, answers = [], started = 0, timer = null, root = null, previous = null, mode = 'practice', setNumber = 1, setResults = {}, fullRun = false;
  const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = id => document.getElementById(id);
  function clearTimer(){ if(timer){clearInterval(timer);timer=null;} }
  function close(){
    fullRun=false;clearTimer();
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
    part=null; fullRun=false; clearTimer();
    layout('<h2>Prüfung auswählen</h2><p class="b1-muted">Eigene Übungsaufgaben zur Vorbereitung, keine offiziellen Prüfungsfragen.</p>'+
      '<div class="b1-options">'+Object.entries(EXAMS).map(([id,e])=>'<button class="b1-choice '+(exam===id?'selected':'')+'" data-exam="'+id+'"><b>'+esc(e.name)+'</b><small>'+esc(e.desc)+'</small></button>').join('')+'</div>'+
      '<h3>Fünf Mustersätze</h3><div class="b1-grid">'+[1,2,3,4,5].map(n=>'<button class="b1-choice '+(setNumber===n?'selected':'')+'" data-set="'+n+'"><b>📋 Muster '+n+'</b><small>'+(n===1&&exam==='dtz'?'DTZ: vollständige Anzahl an Lese- und Höraufgaben':'Aufgabenaufbau in Arbeit')+'</small></button>').join('')+'</div>'+ 
      (exam==='dtz'&&setNumber===1?'<button class="b1-next" id="b1-full">▶ DTZ-Muster 1 durchgehend üben (Beta)</button>':'')+
      '<h3>Prüfungsteil üben</h3><div class="b1-grid">'+Object.entries(labels).map(([id,label])=>'<button class="b1-choice" data-part="'+id+'"><b>'+label+'</b><small>'+TASKS[id].length+' eigene Aufgaben · '+duration[exam][id]+' Min. Prüfungszeit (Orientierung)</small></button>').join('')+'</div>'+
      '<p class="b1-muted">Unabhängiges Training mit selbst erstellten Aufgaben. Keine offizielle Prüfung, kein Zertifikat. Nur DTZ Muster 1 hat bereits 25 Lese- und 20 Hörfragen; andere Muster und authentische Aufgabentypen sind noch in Arbeit. Antworten werden lokal gespeichert. Bei Hörtexten wird der Text an den eingestellten Sprachserver übertragen.</p>');
    if($('b1-full')) $('b1-full').onclick=()=>{fullRun=true;setResults={};part='hoeren';index=0;answers=[];started=Date.now();question();};
    root.querySelectorAll('[data-exam]').forEach(b=>b.onclick=()=>{exam=b.dataset.exam;setNumber=1;overview();});
    root.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{setNumber=Number(b.dataset.set);overview();});
    root.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{if(setNumber!==1 || exam!=='dtz'){alert('Dieser Mustersatz wird noch erstellt. Der erste DTZ-Satz ist bereits als Übung verfügbar.');return;}fullRun=false;part=b.dataset.part;index=0;answers=[];started=Date.now();question();});
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
  function activeTasks(){return TASKS[part].slice(0,part==='lesen'?25:part==='hoeren'?20:part==='schreiben'?1:3);}
  function question(){
    clearTimer();
    const tasks=activeTasks(), t=tasks[index];
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
      const left=Math.max(0,duration[exam][part]*60-sec);
      if($('b1-clock')) $('b1-clock').textContent='⏱ '+String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0')+' verbleibend';
    },1000);
  }
  function finish(){
    clearTimer();
    const tasks=activeTasks(), automatic=part==='lesen'||part==='hoeren';
    const correct=automatic?answers.filter((a,i)=>a===tasks[i].answer).length:null;
    const result={exam,setNumber,part,date:new Date().toISOString(),correct,total:tasks.length,answers,seconds:Math.round((Date.now()-started)/1000)};
    try{const old=JSON.parse(localStorage.getItem('sdB1Pruefungen')||'[]');old.push(result);localStorage.setItem('sdB1Pruefungen',JSON.stringify(old.slice(-30)));}catch(_){}
    const detail=automatic?'<h2>'+correct+' von '+tasks.length+' richtig</h2><p>'+Math.round(correct/tasks.length*100)+' % in diesem Übungsblock</p>'+
      tasks.map((t,i)=>'<div class="b1-passage"><b>Aufgabe '+(i+1)+'</b><p>'+esc(t.q)+'</p><small>Deine Antwort: '+esc(t.options[answers[i]])+'<br>Richtig: '+esc(t.options[t.answer])+'</small></div>').join(''):
      '<h2>Übungsblock abgeschlossen</h2><p>Deine Antwort wurde auf diesem Gerät gespeichert. Für Schreiben und Sprechen gibt es hier noch keine automatische Sprach- oder Textbewertung.</p>'+
      answers.map((a,i)=>'<div class="b1-passage"><b>Aufgabe '+(i+1)+'</b><p>'+esc(a||'(Keine Antwort)')+'</p></div>').join('');
    setResults[part]={correct,total:tasks.length,seconds:result.seconds};
    const order=['hoeren','lesen','schreiben','sprechen'];
    const next=fullRun?order[order.indexOf(part)+1]:null;
    const progress=fullRun?'<p class="b1-muted">Durchgehender Übungslauf: '+order.map(k=>(setResults[k]?'✓ ':'○ ')+labels[k]).join(' · ')+'</p>':'';
    layout('<p class="b1-muted">'+esc(EXAMS[exam].name)+' · '+labels[part]+'</p>'+progress+detail+
      '<button class="b1-next" id="b1-again">'+(next?'Weiter zu '+labels[next]:'Zur Prüfungsübersicht')+'</button>');
    $('b1-again').onclick=()=>{if(next){part=next;index=0;answers=[];started=Date.now();question();}else overview();};
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
