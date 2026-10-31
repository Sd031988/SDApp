/* SD Hub – unabhängiges B1 Prüfungstraining.
 * Original erstellte Übungsaufgaben, keine amtlichen Prüfungsunterlagen.
 * Keine Cloud-Speicherung der Antworten. Browser-Sprachausgabe standardmäßig.
 */
(()=>{'use strict';
const E={
 goethe:{name:'Goethe-Zertifikat B1 – Übung',parts:[['lesen','Lesen',65,[6,6,7,7,4],['Richtig/Falsch','Mehrfachauswahl','Zuordnung','Ja/Nein','Mehrfachauswahl']],['hoeren','Hören',40,[10,5,7,8],['Richtig/Falsch und Auswahl','Mehrfachauswahl','Richtig/Falsch','Sprecher zuordnen']],['schreiben','Schreiben',60,[1,1,1],['Private E-Mail','Diskussionsbeitrag','Formelle E-Mail']],['sprechen','Sprechen',15,[1,1,1],['Gemeinsam planen','Ein Thema präsentieren','Auf Fragen reagieren']]]},
 telc:{name:'telc Deutsch B1 – Übung',parts:[['lesen','Lesen',90,[5,5,10],['Zuordnung','Detailverstehen','Selektives Lesen']],['sprach','Sprachbausteine',30,[10,10],['Lückentext','Wortwahl']],['hoeren','Hören',30,[5,10,5],['Globalverstehen','Detailverstehen','Selektives Verstehen']],['schreiben','Schreiben',30,[1],['E-Mail']],['sprechen','Sprechen',15,[1,1,1],['Kennenlernen','Über ein Thema sprechen','Gemeinsam planen']]]},
 dtz:{name:'Deutsch-Test für Zuwanderer (DTZ) – Übung',parts:[['hoeren','Hören',25,[4,5,6,5],['Ansagen','Kurze Gespräche','Informationen','Meinungen']],['lesen','Lesen',45,[5,5,5,5,5],['Anzeigen','Informationen','Zuordnung','Mitteilungen','Anweisungen']],['schreiben','Schreiben',30,[1],['Brief / E-Mail']],['sprechen','Sprechen',16,[1,1,1],['Sich vorstellen','Über Erfahrungen sprechen','Gemeinsam etwas planen']]]}
};
const themes=[
 ['Bibliothek','Die Stadtbibliothek öffnet ab Montag um neun Uhr. Am Mittwoch ist sie wegen einer Schulung geschlossen. Bücher können online verlängert werden.','Wann bleibt die Bibliothek geschlossen?','Am Mittwoch','Am Montag','Am Freitag'],
 ['Bus','Die Buslinie 12 fährt ab morgen über den Bahnhof. Die Haltestelle Rathaus entfällt. Fahrgäste können am Theater umsteigen.','Welche Haltestelle entfällt?','Rathaus','Bahnhof','Theater'],
 ['Arztpraxis','Die Praxis öffnet am Freitag erst um elf Uhr. Patienten mit Termin werden telefonisch informiert. Medikamente können wie gewohnt bestellt werden.','Wann öffnet die Praxis am Freitag?','Um elf Uhr','Um acht Uhr','Um neun Uhr'],
 ['Kurs','Der Computerkurs beginnt nächsten Dienstag. Die erste Stunde findet in Raum 204 statt. Bitte bringen Sie ein eigenes Heft mit.','Was sollen die Teilnehmer mitbringen?','Ein Heft','Einen Drucker','Ein Fahrrad'],
 ['Wohnung','Am Samstag wird im Wohnhaus die Heizung überprüft. Zwischen acht und zwölf Uhr kann es zu Unterbrechungen kommen. Bitte halten Sie die Heizkörper frei.','Was wird überprüft?','Die Heizung','Das Dach','Der Aufzug'],
 ['Sport','Der Schwimmkurs beginnt nächste Woche eine halbe Stunde später. Die Teilnehmer treffen sich um 17 Uhr vor dem Haupteingang.','Wann treffen sich die Teilnehmer?','Um 17 Uhr','Um 16 Uhr','Um 18 Uhr'],
 ['Schule','Der Elternabend findet am Donnerstag in der Aula statt. Beginn ist 18:30 Uhr. Eine Kinderbetreuung wird angeboten.','Wo findet der Elternabend statt?','In der Aula','In der Mensa','Im Hof'],
 ['Arbeit','Das Teamtreffen wurde auf Montag verschoben. Es beginnt um zehn Uhr im Besprechungsraum. Alle sollen ihre Projektunterlagen mitbringen.','Wann beginnt das Treffen?','Um zehn Uhr','Um elf Uhr','Um neun Uhr'],
 ['Museum','Das Museum bietet am Sonntag kostenlose Führungen an. Die erste Führung beginnt um 13 Uhr. Eine Anmeldung ist nicht erforderlich.','Was ist kostenlos?','Die Führung','Das Mittagessen','Die Anfahrt'],
 ['Paket','Ihr Paket liegt ab heute in der Postfiliale. Bitte bringen Sie Ihren Ausweis mit. Die Abholung ist bis Freitag möglich.','Was braucht man zur Abholung?','Einen Ausweis','Ein Foto','Einen Schlüssel'],
 ['Markt','Der Wochenmarkt findet wegen des Feiertags ausnahmsweise am Donnerstag statt. Er beginnt um sieben Uhr und endet um 13 Uhr.','Wann findet der Markt statt?','Am Donnerstag','Am Samstag','Am Sonntag'],
 ['Restaurant','Das Restaurant bietet mittags ein vegetarisches Menü an. Die Küche schließt um 14 Uhr. Tischreservierungen sind telefonisch möglich.','Wann schließt die Küche?','Um 14 Uhr','Um 12 Uhr','Um 16 Uhr'],
 ['Verein','Der Nachbarschaftsverein organisiert am Wochenende eine Müllsammelaktion. Treffpunkt ist der Stadtpark. Handschuhe werden gestellt.','Wo treffen sich die Helfer?','Im Stadtpark','Am Bahnhof','Im Rathaus'],
 ['Bank','Die Bankfiliale zieht im nächsten Monat in die Gartenstraße. Die Kontonummern bleiben gleich. Der Geldautomat am alten Standort wird abgebaut.','Was bleibt gleich?','Die Kontonummern','Die Adresse','Der Geldautomat'],
 ['Kino','Der Film am Samstag beginnt erst um 20:30 Uhr. Bereits gekaufte Karten bleiben gültig. Das Kino öffnet um 19 Uhr.','Was bleibt gültig?','Die Karten','Die Gutscheine fürs Essen','Die Parkscheine'],
 ['Kindergarten','Die Kita bittet darum, Kinder spätestens um 8:45 Uhr zu bringen. Danach beginnt das gemeinsame Frühstück.','Bis wann sollen die Kinder kommen?','Bis 8:45 Uhr','Bis 10 Uhr','Bis 9:30 Uhr'],
 ['Fahrrad','Die Fahrradwerkstatt bietet dienstags kostenlose Beratung an. Für Ersatzteile müssen Kunden selbst bezahlen.','Was ist kostenlos?','Die Beratung','Alle Ersatzteile','Jede Reparatur'],
 ['Reise','Der Reiseveranstalter empfiehlt, zwei Stunden vor Abflug am Flughafen zu sein. Der Check-in erfolgt in Halle B.','Wo ist der Check-in?','In Halle B','In Halle A','Am Bahnhof'],
 ['Apotheke','Die Apotheke am Markt übernimmt heute den Notdienst. Sie ist deshalb auch nach 20 Uhr geöffnet.','Warum ist die Apotheke länger geöffnet?','Wegen des Notdienstes','Wegen eines Festes','Wegen einer Schulung'],
 ['Park','Hunde dürfen auf der Hundewiese frei laufen. Auf den übrigen Wegen müssen sie angeleint bleiben.','Wo dürfen Hunde ohne Leine laufen?','Auf der Hundewiese','Auf allen Wegen','Auf dem Spielplatz'],
 ['Musikschule','Das Konzert der Musikschule beginnt am Freitag um 19 Uhr. Der Eintritt ist frei, die Plätze sind begrenzt.','Was kostet der Eintritt?','Nichts','Fünf Euro','Zehn Euro'],
 ['Onlinekurs','Die Sprachschule bietet ab April einen Onlinekurs an. Unterricht ist dienstags und donnerstags am Abend.','An welchen Tagen findet der Unterricht statt?','Dienstag und Donnerstag','Montag und Mittwoch','Samstag und Sonntag'],
 ['Strom','Wegen Wartungsarbeiten wird am Mittwoch zwischen neun und elf Uhr der Strom unterbrochen.','Warum gibt es keinen Strom?','Wegen Wartungsarbeiten','Wegen eines Unwetters','Wegen eines Umzugs'],
 ['Garten','Der Gemeinschaftsgarten sucht freiwillige Helfer. Die Gruppe trifft sich jeden Samstagvormittag am Eingang.','Wann trifft sich die Gruppe?','Samstagvormittag','Montagabend','Freitagnacht'],
 ['Ausbildung','Der Informationsabend zur Berufsausbildung ist kostenlos. Interessierte müssen sich bis zum 12. Mai anmelden.','Was ist notwendig?','Eine Anmeldung','Ein Abschlusszeugnis','Ein eigenes Fahrrad'],
 ['Schwimmbad','Wegen eines Wettbewerbs öffnet das Schwimmbad am Sonntag erst um 16 Uhr für normale Besucher.','Ab wann können Besucher schwimmen?','Ab 16 Uhr','Ab 10 Uhr','Ab 12 Uhr'],
 ['Handy','Der Mobilfunkanbieter informiert über neue Öffnungszeiten im Kundencenter. Samstags bleibt das Geschäft jetzt geschlossen.','Wann ist das Geschäft geschlossen?','Am Samstag','Am Dienstag','Am Donnerstag'],
 ['Bäckerei','Die Bäckerei verkauft ab 17 Uhr Brot vom Vortag günstiger. Frische Kuchen gibt es weiterhin zum normalen Preis.','Was wird günstiger verkauft?','Brot vom Vortag','Frischer Kuchen','Kaffee'],
 ['Termin','Die Beratungsstelle bittet Besucher, Termine vorab online zu buchen. Ohne Termin ist nur eine kurze Auskunft möglich.','Was wird empfohlen?','Online einen Termin buchen','Einfach vorbeikommen','Nur Briefe schreiben'],
 ['Ausflug','Die Wandergruppe fährt am Sonntag mit dem Zug in die Berge. Treffpunkt ist um 7:30 Uhr am Bahnhof.','Wie reist die Gruppe?','Mit dem Zug','Mit dem Flugzeug','Mit dem Schiff']
];
const contexts=['Im Stadtteil Nord','In der kommenden Woche','Für alle Interessierten','Nach einer kurzen Änderung','Wegen der aktuellen Planung'];
const letters=[
 ['Du möchtest einen Deutschkurs besuchen, aber der angebotene Termin passt nicht. Schreibe an die Schule und frage nach einer Alternative.','Schreibe den Grund, deinen Terminwunsch und eine konkrete Frage.'],
 ['Du hast ein Fahrrad gekauft, aber das Licht funktioniert nicht. Schreibe an das Geschäft.','Beschreibe das Problem, nenne das Kaufdatum und bitte um eine Lösung.'],
 ['Dein Nachbar lädt dich zu einem Fest ein. Du kannst nicht kommen.','Bedanke dich, entschuldige dich und schlage ein anderes Treffen vor.'],
 ['Dein Kind ist krank und kann morgen nicht zur Schule gehen. Schreibe an die Lehrerin.','Erkläre die Situation, nenne die voraussichtliche Dauer und frage nach den Hausaufgaben.'],
 ['Du suchst eine Wohnung und möchtest einen Besichtigungstermin vereinbaren.','Stelle dich kurz vor, frage nach dem Termin und nach den Nebenkosten.']
];
const talk=['Ein gemeinsamer Ausflug','Eine Geburtstagsfeier','Ein Besuch bei Freunden','Ein Lerntreffen','Ein Sportnachmittag'];
const opinions=['Sollten Jugendliche täglich Sport treiben?','Sind öffentliche Verkehrsmittel besser als das Auto?','Sollte man lieber online oder im Geschäft einkaufen?','Sind gemeinsame Mahlzeiten in Familien wichtig?','Sollten Schulen mehr digitale Medien nutzen?'];
const formalSituations=['Du kannst einen Termin bei einer Beratungsstelle nicht wahrnehmen.','Du hast einen Kurs gebucht, musst aber kurzfristig absagen.','Du hast eine Einladung zu einem Vorstellungsgespräch erhalten, bist aber verhindert.','Du hast einen Besichtigungstermin für eine Wohnung verpasst.','Du kannst an einem Elternabend nicht teilnehmen.'];
const grammar=[
 ['Ich freue mich ___ deine Nachricht.',['auf','an','mit'],0],
 ['Wir treffen uns ___ Samstag.',['am','im','um'],0],
 ['Sie hat gestern lange ___.',['gearbeitet','arbeiten','arbeitet'],0],
 ['Könnten Sie mir bitte ___?',['helfen','hilft','geholfen'],0],
 ['Er bleibt zu Hause, ___ er krank ist.',['weil','trotzdem','deshalb'],0],
 ['Ich interessiere mich ___ diesen Kurs.',['für','von','nach'],0],
 ['Wenn ich Zeit habe, ___ ich dich an.',['rufe','rufen','ruft'],0],
 ['Wir haben ___ neuen Nachbarn kennengelernt.',['einen','ein','einem'],0],
 ['Ich warte schon seit einer Stunde ___ den Bus.',['auf','mit','bei'],0],
 ['Sie möchte wissen, ___ der Kurs beginnt.',['wann','denn','dass'],0],
 ['Der Brief wurde gestern ___.',['geschickt','schicken','schickt'],0],
 ['Obwohl es regnet, ___ wir spazieren.',['gehen','gingen','geht'],0],
 ['Er hat vergessen, die Tür ___.',['abzuschließen','abschließen','abschließt'],0],
 ['Ich würde gern einen Termin ___.',['vereinbaren','vereinbart','vereinbarte'],0],
 ['Die Frau, ___ dort steht, ist meine Lehrerin.',['die','der','das'],0],
 ['Seit ___ Jahr lerne ich Deutsch.',['einem','ein','einen'],0],
 ['Bitte melden Sie sich ___ Freitag an.',['bis','nachdem','während'],0],
 ['Sie ist müde, ___ sie hat gut gearbeitet.',['aber','weil','dass'],0],
 ['Ich habe mich ___ den Fehler entschuldigt.',['für','über','zu'],0],
 ['Er fragte, ___ ich morgen kommen kann.',['ob','weil','denn'],0]
];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById(id);
let exam='dtz',set=1,part=0,idx=0,answers=[],began=0,tick=null,root=null,host=null,results={},running=false,deadline=0,plays=0;
const k=(n,s)=>themes[(n+s*7)%themes.length];
function items(section){
 const [id,,minutes,groups,kinds]=section;const result=[];
 groups.forEach((count,g)=>{for(let j=0;j<count;j++){
   const n=result.length,base=k(n+g*3,set-1),shift=(n+set)%3;
   if(id==='lesen'||id==='hoeren'||id==='sprach'){
     if(id==='sprach'){
       const gr=grammar[(n+(set-1)*4)%grammar.length],correct=gr[1][0],options=gr[1].slice(),pos=(n+set)%3;
       options[0]=options[pos];options[pos]=correct;
       result.push({g,j,q:gr[0],options,answer:pos,passage:'Ergänzen Sie die Lücke im Satz.',kind:kinds[g]});
       continue;
     }
     const isBinary=(exam==='goethe'&&((id==='lesen'&&(g===0||g===3))||(id==='hoeren'&&(g===0&&j%2===0||g===2))))||(exam==='telc'&&id==='hoeren');
     const options=isBinary?['Richtig','Falsch']:[base[3],base[4],base[5]];
     const truth=(n+set)%2===0;
     const answer=isBinary?(truth?0:1):shift;
     if(!isBinary) {const correct=options[0];options[0]=options[shift];options[shift]=correct;}
     const q=isBinary?'Aussage: '+(truth?base[3]:base[4])+'.':base[2];
     const passage=(contexts[(n+set)%contexts.length]+': '+base[1]);
     result.push({g,j,q,options,answer,passage,audio:passage,kind:kinds[g],binary:isBinary});
   } else if(id==='schreiben'){
     const prompt=letters[(set+g-1)%letters.length];
     const isGoethe=exam==='goethe';
     const q=isGoethe&&g===1?'Schreibe einen Diskussionsbeitrag zum Thema „'+opinions[set-1]+'“. Nenne Gründe und Beispiele.':isGoethe&&g===2?formalSituations[set-1]+' Schreibe eine kurze höfliche Entschuldigung und bitte um einen Ersatztermin.':prompt[0];
     result.push({g,j,q,hint:isGoethe&&g===1?'Etwa 80 Wörter, eigene Meinung und Beispiele.':isGoethe&&g===2?'Etwa 40 Wörter, mit Anrede und Gruß.':prompt[1],kind:kinds[g]});
   } else {
     const q=exam==='goethe'?(g===0?'Plane gemeinsam mit einem Partner: '+talk[(set+1)%talk.length]+'. Sprecht über Termin, Ort, Aufgaben, Vorschläge und eine gemeinsame Entscheidung.':g===1?'Präsentiere das Thema „'+talk[(set-1)%talk.length]+'“: Einleitung, eigene Erfahrungen, Situation in deinem Herkunftsland, Vor- und Nachteile, eigene Meinung und Schluss.':'Reagiere auf Fragen und Rückmeldungen zur Präsentation. Stelle auch deinem Partner eine passende Frage.'):(exam==='telc'?(g===0?'Lerne deinen Gesprächspartner kennen: Name, Wohnort, Beruf, Familie, Freizeit und Sprachlernen. Stelle Rückfragen.':g===1?'Sprecht über eure Erfahrungen und Meinungen zum Thema „'+talk[(set-1)%talk.length]+'“. Reagiere auf die Aussagen deines Partners.':'Plane gemeinsam mit deinem Partner: '+talk[(set+1)%talk.length]+'. Findet eine gemeinsame Lösung.'):(g===0?'Stelle dich vor: Name, Herkunft, Wohnort, Familie, Beruf, Sprachen und Freizeit. Beantworte Nachfragen.':g===1?'Beschreibe eigene Erfahrungen und deine Meinung zum Thema „'+talk[(set-1)%talk.length]+'“. Gehe auf Rückfragen ein.':'Plane mit einem Gesprächspartner: '+talk[(set+1)%talk.length]+'. Sprecht über Termin, Ort, Aufgaben und Kosten.'));
     result.push({g,j,q,hint:'Sprich frei. Die automatische Bewertung ersetzt keine menschliche Prüfung.',kind:kinds[g]});
   }
 }});
 return result;
}
function clear(){if(tick)clearInterval(tick);tick=null;if('speechSynthesis'in window)speechSynthesis.cancel();}
function close(){clear();if(root)root.remove();root=null;if(host)host.style.display='';host=null;}
function view(html){
 if(!root)return;
 root.innerHTML='<div class="b1x-wrap"><div class="b1x-nav"><button id="b1x-back">‹ Zurück</button><strong>🎓 B1-Prüfungstraining</strong><button id="b1x-close">✕</button></div>'+html+'</div>';
 el('b1x-close').onclick=close;el('b1x-back').onclick=home;
}
function open(){
 if(root)return;host=el('lBody');if(!host)return;host.style.display='none';root=document.createElement('div');root.id='b1x';host.parentNode.insertBefore(root,host.nextSibling);home();
}
function home(){
 clear();running=false;
 view('<h2>Prüfung auswählen</h2><p class="b1x-note">Unabhängiges Übungsmaterial. Keine offizielle Prüfung, kein offizielles Zertifikat. Die Aufgaben sind eigens erstellt und orientieren sich an der Anzahl der Prüfungsteile. Es handelt sich um Übungsentwürfe, nicht um originalgetreue Prüfungssimulationen.</p>'+
 '<div class="b1x-grid">'+Object.entries(E).map(([id,e])=>'<button data-exam="'+id+'" class="b1x-card '+(exam===id?'active':'')+'"><b>'+esc(e.name)+'</b></button>').join('')+'</div>'+
 '<h3>Mustersatz auswählen</h3><div class="b1x-grid">'+[1,2,3,4,5].map(n=>'<button data-set="'+n+'" class="b1x-card '+(set===n?'active':'')+'">Muster '+n+'</button>').join('')+'</div>'+
 '<h3>Alle Prüfungsteile</h3><div class="b1x-stack">'+E[exam].parts.map((p,i)=>'<button data-part="'+i+'" class="b1x-card"><b>'+esc(p[1])+'</b><small>'+p[2]+' Minuten · '+p[3].reduce((a,b)=>a+b,0)+' Aufgaben · '+p[3].length+' Teile</small></button>').join('')+'</div>'+
 '<button id="b1x-start" class="b1x-primary">▶ Mustersatz '+set+' vollständig starten</button>'+
 '<p class="b1x-note">Die Antworten werden nur lokal im Browser gespeichert. Die Hörtexte werden mit der Sprachausgabe des Geräts vorgelesen; je nach Betriebssystem kann diese einen Online-Sprachdienst nutzen. Keine offizielle Bewertung. Zuordnungsaufgaben und Prüfungsgespräche sind vereinfacht. Bei telc werden Lesen und Sprachbausteine hier mit getrennten Übungszeiten statt einer gemeinsamen Prüfungszeit angezeigt.</p><button id="b1x-delete" class="b1x-card" type="button">🗑 Gespeicherte B1-Antworten löschen</button>');
 root.querySelectorAll('[data-exam]').forEach(b=>b.onclick=()=>{exam=b.dataset.exam;set=1;home();});
 root.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{set=Number(b.dataset.set);home();});
 root.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{running=false;start(Number(b.dataset.part));});
 el('b1x-start').onclick=()=>{running=true;results={};start(0);};
 if(el('b1x-delete'))el('b1x-delete').onclick=()=>{if(confirm('Alle auf diesem Gerät gespeicherten B1-Übungsergebnisse löschen?')){localStorage.removeItem('sdB1FullResults');localStorage.removeItem('sdB1Pruefungen');alert('Die lokal gespeicherten B1-Ergebnisse wurden gelöscht.');}};
}
function start(i){clear();part=i;idx=0;answers=[];plays=0;began=Date.now();const p=E[exam].parts[i];deadline=began+(p[2]||30)*60000;question();}
function speak(t){
 if(!('speechSynthesis'in window)){alert('Dein Browser unterstützt diese Sprachausgabe nicht.');return;}
 speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='de-DE';u.rate=.87;speechSynthesis.speak(u);
}
function question(){
 clear();const p=E[exam].parts[part],list=items(p),t=list[idx];if(!t){finish();return;}
 const count=p[3].slice(0,t.g).reduce((a,b)=>a+b,0)+1;
 const body=(p[0]==='lesen'||p[0]==='hoeren'||p[0]==='sprach')?
 (p[0]==='hoeren'?'<button id="b1x-audio" class="b1x-audio">🔊 Hörtext abspielen</button>':'<div class="b1x-passage">'+esc(t.passage)+'</div>')+
 '<h3>'+esc(t.q)+'</h3><div class="b1x-stack">'+t.options.map((o,i)=>'<label class="b1x-card"><input type="radio" name="b1x-answer" value="'+i+'"> '+esc(o)+'</label>').join('')+'</div>':
 '<h3>'+esc(t.q)+'</h3><p class="b1x-note">'+esc(t.hint)+'</p><textarea id="b1x-text" rows="9" placeholder="'+(p[0]==='sprechen'?'Notizen zur mündlichen Antwort …':'Deine Antwort …')+'"></textarea><div id="b1x-count" class="b1x-note">0 Wörter</div>';
 view('<p class="b1x-note">'+esc(E[exam].name)+' · Muster '+set+' · '+esc(p[1])+'</p>'+
 '<div class="b1x-meta"><span>Teil '+(t.g+1)+'/'+p[3].length+' · '+esc(t.kind)+'</span><span>Aufgabe '+(idx+1)+'/'+list.length+'</span></div>'+
 '<div class="b1x-meta"><span id="b1x-clock">⏱ '+p[2]+':00</span><span>'+Math.round(idx/list.length*100)+' %</span></div>'+
 body+'<button id="b1x-next" class="b1x-primary">'+(idx===list.length-1?'Teil abschließen':'Weiter')+'</button>');
 el('b1x-back').onclick=()=>{if(confirm('Diesen Prüfungsteil verlassen? Deine ungespeicherten Antworten gehen verloren.'))home();};
 if(el('b1x-audio')){const max=exam==='goethe'&&p[0]==='hoeren'&&(t.g===0||t.g===3)?2:1;el('b1x-audio').textContent='🔊 Hörtext abspielen (max. '+max+' × pro Aufgabe)';el('b1x-audio').onclick=()=>{if(plays>=max){alert('Der Hörtext wurde bereits '+max+' Mal abgespielt.');return;}plays++;speak(t.audio);};}
 if(el('b1x-text'))el('b1x-text').oninput=()=>{const a=el('b1x-text').value.trim();el('b1x-count').textContent=(a?a.split(/\s+/).length:0)+' Wörter';};
 el('b1x-next').onclick=()=>{
  let val;
  if(p[0]==='lesen'||p[0]==='hoeren'||p[0]==='sprach'){
   const c=root.querySelector('input[name="b1x-answer"]:checked');
   if(!c){if(!confirm('Ohne Antwort zur nächsten Aufgabe?'))return;val=null;}else val=Number(c.value);
  }else val=el('b1x-text').value.trim();
  answers.push(val);idx++;plays=0;question();
 };
 tick=setInterval(()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(el('b1x-clock'))el('b1x-clock').textContent='⏱ '+String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');if(left===0){const pNow=E[exam].parts[part];if(['schreiben','sprechen'].includes(pNow[0])&&el('b1x-text'))answers.push(el('b1x-text').value.trim());clear();finish();}},1000);
}
function finish(){
 clear();const p=E[exam].parts[part],list=items(p),auto=['lesen','hoeren','sprach'].includes(p[0]);const correct=auto?answers.filter((a,i)=>a===list[i].answer).length:null;
 const record={exam,set,part:p[0],date:new Date().toISOString(),correct,total:list.length,answered:answers.length,answers:answers.slice(),elapsed:Math.round((Date.now()-began)/1000)};
 results[p[0]]=record;
 try{const old=JSON.parse(localStorage.getItem('sdB1FullResults')||'[]');old.push(record);localStorage.setItem('sdB1FullResults',JSON.stringify(old.slice(-60)));}catch(_){}
 const text=auto?'<h2>'+correct+' / '+list.length+' richtig</h2><p>Nur diese Übungsfragen wurden automatisch ausgewertet. Das Ergebnis ist keine offizielle Prüfungsnote.</p>':
 '<h2>Prüfungsteil beendet</h2><p>Für '+esc(p[1])+' ist eine Bewertung durch eine qualifizierte Person erforderlich. Es wurde keine automatische B1-Einstufung vorgenommen.</p>';
 const next=running&&part+1<E[exam].parts.length;
 const completed=running&&!next;
 const summary=completed?'<h3>Gesamtübersicht – Muster '+set+'</h3><div class="b1x-passage">'+E[exam].parts.map(x=>{const z=results[x[0]];return '<p><b>'+esc(x[1])+':</b> '+(z?(z.correct===null?'Bearbeitet, manuelle Bewertung erforderlich':z.correct+' / '+z.total+' richtige Antworten'):'Nicht bearbeitet')+'</p>';}).join('')+'</div><p class="b1x-note">Keine offizielle Gesamtpunktzahl oder Bestehensentscheidung. Schreiben und Sprechen müssen fachlich beurteilt werden.</p>':'';
 view('<p class="b1x-note">'+esc(E[exam].name)+' · Muster '+set+'</p>'+text+summary+
 '<div class="b1x-passage">'+(auto?list.map((t,i)=>'<p><b>'+(i+1)+'.</b> '+esc(t.q)+'<br><small>Deine Antwort: '+esc(t.options[answers[i]]||'–')+' · Lösung: '+esc(t.options[t.answer])+'</small></p>').join(''):answers.map((a,i)=>'<p><b>Aufgabe '+(i+1)+':</b> '+esc(a||'Keine Antwort')+'</p>').join(''))+'</div>'+
 '<button id="b1x-continue" class="b1x-primary">'+(next?'Weiter: '+esc(E[exam].parts[part+1][1]):'Zur Übersicht')+'</button>');
 el('b1x-continue').onclick=()=>next?start(part+1):home();
}
const css=document.createElement('style');css.textContent=`
#b1x{height:100%;min-height:0;overflow-y:auto;background:#0b0c13;color:#f9fafb;flex:1}
.b1x-wrap{max-width:780px;margin:auto;padding:12px 18px 80px;font-family:inherit}
.b1x-nav,.b1x-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:12px 0}
.b1x-nav button{background:#242638;color:white;border:1px solid #45465a;border-radius:10px;padding:10px;cursor:pointer}
.b1x-note{color:#aeb3c2;font-size:13px;line-height:1.6}
.b1x-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:12px 0}
.b1x-stack{display:grid;gap:10px;margin:12px 0}
.b1x-card{display:block;text-align:left;background:#191c29;border:1px solid #3e4257;border-radius:12px;color:#fff;padding:15px;font:inherit;cursor:pointer}
.b1x-card.active{border-color:#fb923c;background:#3a241d}.b1x-card small{display:block;color:#b5bacb;margin-top:5px}
.b1x-card input{margin-right:8px}
.b1x-passage{background:#1b1e2b;border:1px solid #3e4257;padding:16px;border-radius:12px;line-height:1.8;white-space:pre-wrap;margin:14px 0}
.b1x-primary,.b1x-audio{width:100%;background:#c2410c;border:0;color:#fff;padding:15px;border-radius:12px;font:inherit;font-weight:700;margin:14px 0;cursor:pointer}
.b1x-audio{background:#334155}
#b1x-text{width:100%;box-sizing:border-box;min-height:190px;background:#191c29;border:1px solid #565b70;color:white;padding:14px;border-radius:12px;font:inherit}
`;document.head.appendChild(css);
function attach(){
 if(root)return;const h=el('lBody');if(!h||!h.querySelector('#lTrainBtn')||h.querySelector('#sdB1FullEntry'))return;
 const b=document.createElement('button');b.id='sdB1FullEntry';b.type='button';b.className='b1-entry';b.innerHTML='<b>🎓 B1-Musterprüfungen</b><small>Goethe · telc · DTZ – je 5 Mustersätze</small>';b.onclick=open;
 const old=h.querySelector('#sdB1Entry');if(old)old.remove();
 const tiles=h.querySelector('.l-kacheln');if(tiles)tiles.insertAdjacentElement('afterend',b);
}
new MutationObserver(attach).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();
