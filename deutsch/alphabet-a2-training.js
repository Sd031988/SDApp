/* SD Hub: Zusatztraining Alphabetisierung–A2, unabhängig von amtlichen Prüfungen. */
(()=>{'use strict';
const levels={
 alpha:{title:'Alphabetisierung',units:[
 ['Buchstaben A–M','A','A wie Apfel','M','M wie Maus'],['Buchstaben N–Z','N','N wie Nase','Z','Z wie Zug'],['Laute erkennen','sch','Schule','ch','Buch'],['Silben lesen','Ma','Mama','Pa','Papa']]},
 a1:{title:'A1 – Grundlagen',units:[
 ['Begrüßung','Guten Morgen','Guten Morgen!','Auf Wiedersehen','Auf Wiedersehen!'],['Sich vorstellen','Ich heiße Sara.','Wie heißt du?','Ich wohne in Berlin.','Wo wohnst du?'],['Zahlen und Uhrzeit','acht','8','halb neun','8:30'],['Familie','die Mutter','meine Mutter','der Bruder','mein Bruder'],['Einkaufen','Wie viel kostet das?','Preis erfragen','Ich hätte gern Brot.','Einkaufswunsch'],['Alltag','Ich stehe um sieben Uhr auf.','aufstehen','Ich fahre mit dem Bus.','fahren']]},
 a2:{title:'A2 – Aufbau',units:[
 ['Vergangenheit','Ich habe gestern gelernt.','Perfekt mit haben','Ich bin nach Hause gegangen.','Perfekt mit sein'],['Termine','Können wir den Termin verschieben?','höflich um Verschiebung bitten','Leider habe ich keine Zeit.','Absage begründen'],['Gesundheit','Ich habe seit zwei Tagen Husten.','Beschwerden beschreiben','Ich brauche einen Termin.','Arztpraxis anrufen'],['Wohnen','Die Heizung funktioniert nicht.','Problem melden','Könnten Sie das reparieren?','höfliche Bitte'],['Arbeit','Ich bewerbe mich um die Stelle.','Bewerbung','Ich habe Erfahrung im Verkauf.','Berufserfahrung'],['Meinung','Ich finde das praktisch, weil es Zeit spart.','Begründung mit weil','Obwohl es regnet, gehe ich spazieren.','Gegensatz mit obwohl']]}
};
const extraUnits={
 alpha:[
 ['Umlaute','Ä','Ä wie Äpfel','Ö','Ö wie Öl'],['Weitere Umlaute','Ü','Ü wie Übung','ß','Straße'],['Doppellaute','ei','Eis','au','Auto'],['Wörter verbinden','Ich','Ich lese.','Du','Du liest.'],['Kurze Sätze','Das ist ein Haus.','Satz lesen','Ich bin hier.','Satz lesen']],
 a1:[
 ['Artikel','der Tisch','maskulin','die Lampe','feminin'],['Mehrzahl','das Buch – die Bücher','Plural','das Kind – die Kinder','Plural'],['Präsens','ich lerne','lernen','du lernst','lernen'],['Fragen stellen','Wo wohnst du?','W-Frage','Kommst du morgen?','Ja-Nein-Frage'],['Verneinung','Ich habe kein Auto.','kein + Nomen','Ich komme nicht.','nicht + Verb'],['Akkusativ','Ich kaufe einen Apfel.','einen','Ich lese das Buch.','das'],['Modalverben','Ich kann schwimmen.','können','Ich muss arbeiten.','müssen'],['Trennbare Verben','Ich stehe früh auf.','aufstehen','Ich rufe dich an.','anrufen'],['Wegbeschreibung','Gehen Sie geradeaus.','geradeaus','Biegen Sie links ab.','links abbiegen'],['Im Restaurant','Ich möchte bestellen.','bestellen','Die Rechnung, bitte.','bezahlen']],
 a2:[
 ['Dativ','Ich helfe meiner Mutter.','helfen + Dativ','Ich fahre mit dem Bus.','mit + Dativ'],['Nebensätze','Ich bleibe zu Hause, weil ich krank bin.','weil + Verb am Ende','Ich weiß, dass du kommst.','dass + Verb am Ende'],['Vergleiche','Der Zug ist schneller als der Bus.','Komparativ','Das ist am besten.','Superlativ'],['Reflexive Verben','Ich interessiere mich für Musik.','sich interessieren','Ich freue mich auf den Urlaub.','sich freuen'],['Konjunktiv II','Ich würde gern einen Termin vereinbaren.','höflicher Wunsch','Könnten Sie mir helfen?','höfliche Bitte'],['Wechselpräpositionen','Das Buch liegt auf dem Tisch.','Wo? Dativ','Ich lege das Buch auf den Tisch.','Wohin? Akkusativ'],['Zukunft','Morgen werde ich lernen.','werden + Infinitiv','Nächste Woche besuche ich meine Familie.','Präsens mit Zeitangabe'],['Briefe schreiben','Sehr geehrte Damen und Herren,','formelle Anrede','Mit freundlichen Grüßen','formeller Schluss'],['Telefonieren','Könnte ich bitte mit Frau Meier sprechen?','Gespräch beginnen','Ich rufe später noch einmal an.','Rückruf'],['Unterwegs','Der Zug hat Verspätung.','Verspätung melden','Wo muss ich umsteigen?','Verbindung erfragen']]
};
Object.keys(extraUnits).forEach(id=>levels[id].units.push(...extraUnits[id]));
const vocabulary={
 alpha:[['Apfel','apple'],['Ball','ball'],['Computer','computer'],['Dose','can'],['Esel','donkey'],['Fisch','fish'],['Garten','garden'],['Haus','house'],['Insel','island'],['Jacke','jacket'],['Katze','cat'],['Lampe','lamp'],['Maus','mouse'],['Nase','nose'],['Orange','orange'],['Papier','paper'],['Quelle','spring'],['Radio','radio'],['Sonne','sun'],['Tisch','table'],['Uhr','clock'],['Vogel','bird'],['Wasser','water'],['Xylophon','xylophone'],['Yoga','yoga'],['Zug','train']],
 a1:[['der Name','name'],['die Adresse','address'],['die Straße','street'],['das Haus','house'],['der Beruf','profession'],['die Familie','family'],['die Schule','school'],['das Kind','child'],['der Morgen','morning'],['der Abend','evening'],['das Brot','bread'],['das Wasser','water'],['die Milch','milk'],['der Apfel','apple'],['die Banane','banana'],['der Bahnhof','station'],['der Bus','bus'],['der Zug','train'],['das Fahrrad','bicycle'],['die Wohnung','apartment'],['das Zimmer','room'],['der Tisch','table'],['der Stuhl','chair'],['das Buch','book'],['die Frage','question'],['die Antwort','answer'],['der Tag','day'],['die Woche','week'],['der Monat','month'],['das Jahr','year']],
 a2:[['die Bewerbung','application'],['die Erfahrung','experience'],['der Vertrag','contract'],['die Rechnung','invoice'],['die Versicherung','insurance'],['die Gesundheit','health'],['der Termin','appointment'],['die Untersuchung','examination'],['das Rezept','prescription'],['die Apotheke','pharmacy'],['die Heizung','heating'],['die Reparatur','repair'],['die Nachbarschaft','neighborhood'],['die Verspätung','delay'],['die Verbindung','connection'],['die Entscheidung','decision'],['die Meinung','opinion'],['der Vorteil','advantage'],['der Nachteil','disadvantage'],['die Möglichkeit','possibility'],['die Einladung','invitation'],['die Veranstaltung','event'],['die Nachricht','message'],['die Beschreibung','description'],['die Erklärung','explanation'],['die Ausbildung','training'],['die Prüfung','exam'],['die Verbesserung','improvement'],['die Gewohnheit','habit'],['die Zukunft','future']]
};
const moreWords={
 alpha:[['Bett','bed'],['Biene','bee'],['Blume','flower'],['Brot','bread'],['Dach','roof'],['Ei','egg'],['Ente','duck'],['Fenster','window'],['Feuer','fire'],['Gabel','fork'],['Hand','hand'],['Hund','dog'],['Kaffee','coffee'],['Kuchen','cake'],['Milch','milk'],['Mond','moon'],['Oma','grandmother'],['Opa','grandfather'],['Regen','rain'],['Rose','rose'],['Schuh','shoe'],['Tür','door'],['Vater','father'],['Wolke','cloud']],
 a1:[['der Arzt','doctor'],['die Ärztin','female doctor'],['das Krankenhaus','hospital'],['die Arbeit','work'],['die Pause','break'],['das Geld','money'],['die Bank','bank'],['das Geschäft','shop'],['der Markt','market'],['das Obst','fruit'],['das Gemüse','vegetables'],['der Reis','rice'],['das Fleisch','meat'],['der Fisch','fish'],['das Ei','egg'],['die Kartoffel','potato'],['die Tomate','tomato'],['die Zwiebel','onion'],['der Kaffee','coffee'],['der Tee','tea'],['der Saft','juice'],['die Kleidung','clothing'],['die Hose','trousers'],['das Hemd','shirt'],['die Jacke','jacket'],['die Schuhe','shoes'],['der Schlüssel','key'],['die Tür','door'],['das Fenster','window'],['die Küche','kitchen'],['das Bad','bathroom'],['das Bett','bed'],['der Schrank','wardrobe'],['der Garten','garden'],['das Wetter','weather'],['der Regen','rain'],['die Sonne','sun'],['der Schnee','snow'],['der Urlaub','holiday'],['die Reise','journey']],
 a2:[['die Behörde','authority'],['der Antrag','application form'],['die Unterlagen','documents'],['die Bescheinigung','certificate'],['die Aufenthaltserlaubnis','residence permit'],['die Anmeldung','registration'],['die Frist','deadline'],['die Gebühr','fee'],['die Beratung','consultation'],['die Unterstützung','support'],['die Verantwortung','responsibility'],['die Voraussetzung','requirement'],['die Fähigkeit','ability'],['die Kenntnis','knowledge'],['die Weiterbildung','further training'],['die Schicht','work shift'],['die Arbeitszeit','working hours'],['das Gehalt','salary'],['die Kündigung','termination'],['die Lieferung','delivery'],['die Bestellung','order'],['die Rückgabe','return'],['die Erstattung','refund'],['die Beschwerde','complaint'],['die Störung','fault'],['der Schaden','damage'],['die Miete','rent'],['die Nebenkosten','additional housing costs'],['die Haltestelle','stop'],['die Fahrkarte','ticket'],['der Fahrplan','timetable'],['die Abfahrt','departure'],['die Ankunft','arrival'],['die Unterkunft','accommodation'],['die Umgebung','surroundings'],['die Ernährung','nutrition'],['die Bewegung','exercise'],['die Behandlung','treatment'],['die Beschwerden','symptoms'],['die Genesung','recovery']]
};
Object.keys(moreWords).forEach(id=>vocabulary[id].push(...moreWords[id]));
let panel=null,level='alpha',unit=0;
const key='sdPreB1ProgressV1';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const progress=()=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch(_){return {}}};
const speak=t=>{if(!('speechSynthesis' in window))return alert('Sprachausgabe nicht verfügbar.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='de-DE';u.rate=.85;speechSynthesis.speak(u);};
const grammarNotes={
 alpha:['Lies die Zeichen langsam. Sprich jeden Laut deutlich nach.','Verbinde zuerst zwei Buchstaben, dann lies das ganze Wort.'],
 a1:['Ein deutscher Hauptsatz hat das konjugierte Verb normalerweise an zweiter Position: Ich lerne heute Deutsch.','Bei Ja-Nein-Fragen steht das Verb meist zuerst: Lernst du Deutsch?','Nomen beginnen im Deutschen mit einem Großbuchstaben. Lerne Artikel und Nomen zusammen.'],
 a2:['In Nebensätzen mit weil und dass steht das konjugierte Verb am Ende.','Nach mit steht der Dativ: mit dem Bus.','Bei höflichen Bitten hilft Konjunktiv II: Könnten Sie mir bitte helfen?']
};
function grammarMarkup(){
 return '<section class="pre-card"><h3>Grammatik und Lerntipps</h3><ul>'+grammarNotes[level].map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p>Lies die Beispiele laut und bilde eigene Sätze. Diese Hinweise ersetzen kein vollständiges Grammatikbuch.</p></section>';
}
const readingTexts={
 alpha:[
 ['Im Haus','Das ist Mia. Mia ist im Haus. Mia liest.','Wer ist im Haus?',['Mia','Ben','Sara'],0],
 ['Am See','Ali ist am See. Ali sieht einen Fisch.','Was sieht Ali?',['einen Zug','einen Fisch','ein Auto'],1],
 ['Der Ball','Tom hat einen Ball. Der Ball ist rot.','Welche Farbe hat der Ball?',['rot','blau','grün'],0]
 ],
 a1:[
 ['Mein Tag','Ich heiße Samira und wohne in Bonn. Jeden Morgen fahre ich mit dem Bus zur Arbeit. Am Abend koche ich und lese ein Buch.','Wie fährt Samira zur Arbeit?',['mit dem Auto','mit dem Bus','mit dem Fahrrad'],1],
 ['Im Supermarkt','Heute kauft Paul Brot, Milch und Äpfel. Er bezahlt zwölf Euro und geht danach nach Hause.','Was kauft Paul?',['Brot, Milch und Äpfel','Reis und Tee','Schuhe'],0],
 ['Eine Einladung','Hallo Eva, ich feiere am Samstag um 16 Uhr Geburtstag. Kannst du kommen? Liebe Grüße, Lina.','Wann ist die Feier?',['am Freitag','am Sonntag','am Samstag'],2]
 ],
 a2:[
 ['Termin beim Arzt','Frau Kaya hat am Dienstag um 10 Uhr einen Termin beim Arzt. Weil sie arbeiten muss, ruft sie in der Praxis an. Sie bekommt einen neuen Termin am Donnerstag um 11 Uhr.','Wann ist der neue Termin?',['Donnerstag um 11 Uhr','Dienstag um 10 Uhr','Mittwoch um 9 Uhr'],0],
 ['Die Wohnung','Seit gestern funktioniert die Heizung in Herrn Müllers Wohnung nicht. Er schreibt der Hausverwaltung eine E-Mail und bittet um eine schnelle Reparatur.','Warum schreibt Herr Müller?',['Er möchte umziehen.','Die Heizung ist kaputt.','Er sucht Arbeit.'],1],
 ['Ein Ausflug','Obwohl das Wetter am Morgen schlecht war, fuhr die Familie mit dem Zug nach Heidelberg. Am Nachmittag schien die Sonne, und alle machten einen Spaziergang am Fluss.','Wie ist die Familie gefahren?',['mit dem Bus','mit dem Auto','mit dem Zug'],2]
 ]
};
function flashcardMarkup(){
 const words=vocabulary[level],i=(unit*7)%words.length,w=words[i];
 return '<section class="pre-card"><h3>🗂️ Lernkarte: Erst erinnern, dann aufdecken</h3><p>Versuche zuerst, die Bedeutung selbst zu sagen.</p><div class="pre-flashcard"><strong>'+esc(w[0])+'</strong><button id="pre-flash-speak" aria-label="Deutsches Wort anhören">🔊</button></div><button id="pre-flash-reveal" aria-expanded="false">Bedeutung aufdecken</button><p id="pre-flash-answer" role="status" hidden><b>'+esc(w[1])+'</b></p><p class="pre-note">Lautes Erinnern hilft beim Üben. Danach kannst du die Bedeutung vergleichen.</p></section>';
}
function dashboardMarkup(){
 const p=progress(),review=reviewData(),total=Object.values(levels).reduce((sum,x)=>sum+x.units.length,0);
 const completed=Object.entries(levels).reduce((sum,[id,x])=>sum+x.units.filter((_,i)=>p[id+':'+i]).length,0);
 const due=Object.entries(vocabulary).reduce((sum,[id,words])=>sum+words.filter((_,i)=>review[id+':'+i]&&review[id+':'+i].next<=Date.now()).length,0);
 return '<section class="pre-card"><h3>📊 Mein Lernstand</h3><p><b>'+completed+' von '+total+' Lektionen abgeschlossen</b> · '+due+' Wörter zur Wiederholung fällig</p>'+
 Object.entries(levels).map(([id,x])=>{const done=x.units.filter((_,i)=>p[id+':'+i]).length;return '<div class="pre-progress"><span>'+esc(x.title)+': '+done+'/'+x.units.length+'</span><progress max="'+x.units.length+'" value="'+done+'"></progress></div>';}).join('')+'</section>';
}
function readingMarkup(){
 const [title,story,question,options]=readingTexts[level][unit%3];
 return '<section class="pre-card"><h3>Lesen und Verstehen · '+esc(title)+'</h3><p>'+esc(story)+'</p><button id="pre-read-play">🔊 Text anhören</button><fieldset class="pre-question"><legend>'+esc(question)+'</legend>'+options.map((x,i)=>'<label><input type="radio" name="pre-read-answer" value="'+i+'"> '+esc(x)+'</label>').join('')+'</fieldset><button id="pre-read-check">Leseverständnis prüfen</button><p id="pre-read-feedback" role="status"></p></section>';
}
const speakingPrompts={
 alpha:['Sprich deinen Namen deutlich aus.','Lies die zwei Beispiele der Lektion langsam vor.','Sage drei Wörter, die du schon kennst.'],
 a1:['Stell dich vor: Wie heißt du, wo wohnst du und was machst du gern?','Beschreibe deinen Tagesablauf in vier kurzen Sätzen.','Erzähle, was du im Supermarkt kaufen möchtest.'],
 a2:['Beschreibe ein Problem in deiner Wohnung und bitte höflich um Hilfe.','Erzähle von einem Erlebnis am Wochenende. Verwende die Vergangenheit.','Erkläre deine Meinung zum Lernen mit dem Smartphone und begründe sie.']
};
function speakingMarkup(){
 return '<section class="pre-card"><h3>Sprechen üben</h3><p>'+esc(speakingPrompts[level][unit%3])+'</p><p>Sprich laut. Du kannst deine Stimme freiwillig aufnehmen und sofort anhören. Keine automatische Bewertung.</p><button id="pre-record">● Aufnahme starten</button> <button id="pre-stop" disabled>■ Beenden</button><p id="pre-record-status" role="status">Noch keine Aufnahme.</p><div id="pre-record-playback"></div></section>';
}
const writingPrompts={
 alpha:['Schreibe deinen Vornamen.','Schreibe drei Wörter aus der Lektion.','Schreibe einen kurzen Satz: Ich lerne Deutsch.'],
 a1:['Stell dich in vier Sätzen vor: Name, Wohnort, Beruf und Hobby.','Schreibe eine kurze Nachricht: Du kommst heute zehn Minuten später.','Schreibe eine Einkaufsliste mit fünf Lebensmitteln.'],
 a2:['Schreibe eine höfliche E-Mail: Du möchtest einen Termin verschieben. Nenne den Grund und bitte um einen neuen Termin.','Beschreibe in fünf Sätzen einen Vorteil und einen Nachteil des Online-Lernens.','Schreibe eine Nachricht an den Vermieter: Die Heizung funktioniert nicht. Bitte um Hilfe.']
};
function listeningMarkup(){
 const lesson=levels[level].units[unit],sentence=lesson[unit%2?3:1];
 return '<section class="pre-card"><h3>Hören und Nachsprechen</h3><p>Höre zuerst zu. Schreibe anschließend das gehörte Wort oder den Satz auf.</p><button id="pre-dictation-play">🔊 Diktat anhören</button><label for="pre-dictation-answer">Was hast du gehört?</label><input id="pre-dictation-answer" type="text" autocomplete="off" placeholder="Gehörtes eingeben"><button id="pre-dictation-check">Antwort vergleichen</button><p id="pre-dictation-feedback" role="status"></p><p class="pre-note">Groß- und Kleinschreibung wird beim Vergleich nicht bewertet. Satzzeichen werden vereinfacht behandelt.</p></section>';
}
function writingMarkup(){
 const prompt=writingPrompts[level][unit%3],draftKey='sdPreB1Draft:'+level+':'+unit;
 let draft='';try{draft=localStorage.getItem(draftKey)||''}catch(_){}
 return '<section class="pre-card"><h3>Schreiben üben</h3><p>'+esc(prompt)+'</p><label for="pre-draft">Dein Text</label><textarea id="pre-draft" rows="6" placeholder="Hier schreiben …">'+esc(draft)+'</textarea><p id="pre-draft-count" role="status" class="pre-note"></p><p>Dein Entwurf wird nur auf diesem Gerät gespeichert. Es gibt keine automatische Grammatiknote.</p><button id="pre-draft-clear">Entwurf löschen</button></section>';
}
const vocabReviewKey='sdPreB1VocabularyReviewV1';
function reviewData(){try{const x=JSON.parse(localStorage.getItem(vocabReviewKey)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(_){return {}}}
function saveReview(x){try{localStorage.setItem(vocabReviewKey,JSON.stringify(x))}catch(_){}}
function reviewMarkup(){
 const data=reviewData(),due=vocabulary[level].map((w,i)=>({w,i,entry:data[level+':'+i]})).filter(x=>x.entry&&x.entry.next<=Date.now());
 const next=due.slice(0,8);
 return '<section class="pre-card"><h3>🔁 Meine Wiederholungen</h3><p>'+due.length+' Wörter sind zur Wiederholung fällig. Falsche Antworten im Wortschatztest werden hier gesammelt. Richtig beantwortete Wörter erscheinen später erneut.</p>'+
 (next.length?next.map(({w,i})=>'<div class="pre-line"><span><b>'+esc(w[0])+'</b><small>'+esc(w[1])+'</small></span><button data-review="'+i+'">✓ Gelernt</button></div>').join(''):'<p>Aktuell keine Wörter fällig. Bearbeite den Wortschatztest.</p>')+'</section>';
}
function quizMarkup(){
 const words=vocabulary[level],start=(unit*3)%words.length;
 const chosen=Array.from({length:5},(_,i)=>(start+i)%words.length);
 return '<section class="pre-card"><h3>Wortschatz-Selbsttest</h3><p>Wähle die passende englische Bedeutung. Die Auswertung ist nur eine Übung, keine Prüfungsnote.</p>'+
 chosen.map((ix,n)=>{
  const options=[ix,(ix+7)%words.length,(ix+13)%words.length].sort((a,b)=>((a*7+n)%17)-((b*7+n)%17));
  return '<fieldset class="pre-question" data-quiz="'+n+'" data-answer="'+ix+'"><legend>'+(n+1)+'. '+esc(words[ix][0])+'</legend>'+
  options.map(j=>'<label><input type="radio" name="pre-q'+n+'" value="'+j+'"> '+esc(words[j][1])+'</label>').join('')+'</fieldset>';
 }).join('')+'<button id="pre-check">Antworten prüfen</button><p id="pre-feedback" role="status" aria-live="polite"></p></section>';
}
let stopRecording=()=>{};
function show(){
 stopRecording();
 const data=levels[level],p=progress(),done=data.units.filter((_,i)=>p[level+':'+i]).length;
 panel.innerHTML='<div class="pre-wrap"><div class="pre-nav"><strong>📚 Alphabetisierung bis A2</strong><button id="pre-close">✕ Schließen</button></div><p>Eigenständige Übungen, keine offizielle Prüfung. Lernstand nur in diesem Browser.</p><div class="pre-tabs">'+Object.entries(levels).map(([id,x])=>'<button data-level="'+id+'" '+(id===level?'aria-current="true"':'')+'>'+esc(x.title)+'</button>').join('')+'</div>'+dashboardMarkup()+'<p><b>'+done+' von '+data.units.length+' Lektionen abgeschlossen</b></p><div class="pre-tabs">'+data.units.map((x,i)=>'<button data-unit="'+i+'" '+(i===unit?'aria-current="true"':'')+'>'+(p[level+':'+i]?'✓ ':'')+esc(x[0])+'</button>').join('')+'</div><section class="pre-card"><h3>'+esc(data.units[unit][0])+'</h3><p>Höre zu, sprich nach und wiederhole die Wörter.</p>'+[1,3].map(i=>'<div class="pre-line"><span><b>'+esc(data.units[unit][i])+'</b><small>'+esc(data.units[unit][i+1])+'</small></span><button data-say="'+i+'" aria-label="Beispiel vorlesen">🔊 Vorlesen</button></div>').join('')+'<button id="pre-done">✓ Lektion als gelernt markieren</button></section><section class="pre-card"><h3>Wortschatz · '+vocabulary[level].length+' Wörter</h3><p>Tippe auf 🔊, um ein Wort zu hören.</p><label for="pre-vocab-search">Wörter suchen</label><input id="pre-vocab-search" type="search" placeholder="Deutsch oder Englisch …"><p id="pre-vocab-found" role="status"></p><div class="pre-words">'+vocabulary[level].map((w,i)=>'<div class="pre-word" data-vocab-row="'+i+'"><span><b>'+esc(w[0])+'</b><small>'+esc(w[1])+'</small></span><button data-word="'+i+'" aria-label="'+esc(w[0])+' vorlesen">🔊</button></div>').join('')+'</div></section>'+grammarMarkup()+flashcardMarkup()+readingMarkup()+listeningMarkup()+speakingMarkup()+writingMarkup()+quizMarkup()+reviewMarkup()+'<button id="pre-next">Nächste Lektion →</button></div>';
 const search=panel.querySelector('#pre-vocab-search'),found=panel.querySelector('#pre-vocab-found');
 search.oninput=()=>{const q=search.value.trim().toLocaleLowerCase('de-DE');let visible=0;panel.querySelectorAll('[data-vocab-row]').forEach(row=>{const w=vocabulary[level][Number(row.dataset.vocabRow)];const matches=!q||w.some(v=>v.toLocaleLowerCase('de-DE').includes(q));row.hidden=!matches;if(matches)visible++;});found.textContent=visible+' Wörter gefunden';};search.oninput();
 const flashIndex=(unit*7)%vocabulary[level].length;
 panel.querySelector('#pre-flash-speak').onclick=()=>speak(vocabulary[level][flashIndex][0]);
 panel.querySelector('#pre-flash-reveal').onclick=()=>{const answer=panel.querySelector('#pre-flash-answer'),button=panel.querySelector('#pre-flash-reveal');answer.hidden=!answer.hidden;button.setAttribute('aria-expanded',String(!answer.hidden));button.textContent=answer.hidden?'Bedeutung aufdecken':'Bedeutung verbergen';};
 const startButton=panel.querySelector('#pre-record'),stopButton=panel.querySelector('#pre-stop'),status=panel.querySelector('#pre-record-status'),playback=panel.querySelector('#pre-record-playback');
 let recorder=null,stream=null,chunks=[],url=null,closed=false;
 stopRecording=()=>{closed=true;if(recorder&&recorder.state==='recording')recorder.stop();if(stream)stream.getTracks().forEach(t=>t.stop());if(url)URL.revokeObjectURL(url);url=null;};
 startButton.onclick=async()=>{if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){status.textContent='Mikrofon hier nicht verfügbar.';return;}startButton.disabled=true;try{const media=await navigator.mediaDevices.getUserMedia({audio:true});if(closed){media.getTracks().forEach(t=>t.stop());return;}stream=media;chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{stream?.getTracks().forEach(t=>t.stop());if(closed||!chunks.length)return;if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType||'audio/webm'}));const audio=document.createElement('audio');audio.controls=true;audio.src=url;playback.replaceChildren(audio);startButton.disabled=false;stopButton.disabled=true;status.textContent='Aufnahme bereit zum Anhören.';};recorder.start();stopButton.disabled=false;status.textContent='Aufnahme läuft …';}catch(_){if(!closed){status.textContent='Mikrofonzugriff nicht möglich.';startButton.disabled=false;}}};
 stopButton.onclick=()=>{if(recorder&&recorder.state==='recording')recorder.stop()};
 const reading=readingTexts[level][unit%3];
 panel.querySelector('#pre-read-play').onclick=()=>speak(reading[1]);
 panel.querySelector('#pre-read-check').onclick=()=>{const selected=panel.querySelector('input[name="pre-read-answer"]:checked');panel.querySelector('#pre-read-feedback').textContent=!selected?'Bitte wähle zuerst eine Antwort.':Number(selected.value)===reading[4]?'✓ Richtig!':'Noch nicht richtig. Richtige Antwort: '+reading[3][reading[4]];};
 const dictationText=data.units[unit][unit%2?3:1];
 panel.querySelector('#pre-dictation-play').onclick=()=>speak(dictationText);
 panel.querySelector('#pre-dictation-check').onclick=()=>{const normalize=t=>t.toLocaleLowerCase('de-DE').replace(/[^a-zäöüß0-9 ]/gi,'').replace(/\s+/g,' ').trim();const entered=panel.querySelector('#pre-dictation-answer').value;panel.querySelector('#pre-dictation-feedback').textContent=normalize(entered)===normalize(dictationText)?'✓ Richtig gehört!':'Noch nicht ganz. Lösung: '+dictationText;};
 const draft=panel.querySelector('#pre-draft'),count=panel.querySelector('#pre-draft-count'),draftKey='sdPreB1Draft:'+level+':'+unit;
 const updateCount=()=>{const value=draft.value.trim();count.textContent=(value?value.split(/\s+/).length:0)+' Wörter';};updateCount();
 draft.oninput=()=>{updateCount();try{localStorage.setItem(draftKey,draft.value)}catch(_){}};
 panel.querySelector('#pre-draft-clear').onclick=()=>{draft.value='';try{localStorage.removeItem(draftKey)}catch(_){}updateCount();};
 panel.querySelector('#pre-check').onclick=()=>{let correct=0,answered=0;const review=reviewData();panel.querySelectorAll('[data-quiz]').forEach(f=>{const checked=f.querySelector('input:checked'),answer=Number(f.dataset.answer),id=level+':'+answer;if(checked){answered++;if(Number(checked.value)===answer){correct++;if(review[id]){review[id].stage=Math.min(4,(review[id].stage||0)+1);review[id].next=Date.now()+[0,86400000,259200000,604800000,1209600000][review[id].stage];}}else{review[id]={stage:0,next:Date.now()};}}f.style.borderColor=checked&&Number(checked.value)===answer?'#4ade80':'#fb923c';});saveReview(review);panel.querySelector('#pre-feedback').textContent=correct+' von 5 richtig · '+answered+' beantwortet. Falsche Wörter kommen in die Wiederholung.';};
 panel.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>{const review=reviewData(),id=level+':'+b.dataset.review;if(review[id]){review[id].stage=Math.min(4,(review[id].stage||0)+1);review[id].next=Date.now()+[0,86400000,259200000,604800000,1209600000][review[id].stage];saveReview(review);show();}});
 panel.querySelector('#pre-close').onclick=close;
 panel.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;unit=0;show()});
 panel.querySelectorAll('[data-unit]').forEach(b=>b.onclick=()=>{unit=Number(b.dataset.unit);show()});
 panel.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(data.units[unit][Number(b.dataset.say)]));
 panel.querySelectorAll('[data-word]').forEach(b=>b.onclick=()=>speak(vocabulary[level][Number(b.dataset.word)][0]));
 panel.querySelector('#pre-done').onclick=()=>{const p=progress();p[level+':'+unit]=true;try{localStorage.setItem(key,JSON.stringify(p))}catch(_){}show()};
 panel.querySelector('#pre-next').onclick=()=>{unit=(unit+1)%data.units.length;show()};
}
function close(){stopRecording();if('speechSynthesis' in window)speechSynthesis.cancel();panel?.remove();panel=null;document.getElementById('lBody')?.style.removeProperty('display');}
function open(){if(panel)return;const host=document.getElementById('lBody');if(!host)return;host.style.display='none';panel=document.createElement('div');panel.id='preB1';host.parentNode.insertBefore(panel,host.nextSibling);show();}
const style=document.createElement('style');style.textContent='#preB1{background:#0a0a0f;color:#f4f4f5;min-height:85vh;padding:20px;font:inherit}#preB1 .pre-wrap{max-width:950px;margin:auto}#preB1 .pre-nav,#preB1 .pre-line,#preB1 .pre-word{display:flex;justify-content:space-between;align-items:center;gap:12px}#preB1 .pre-tabs,#preB1 .pre-words{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;margin:15px 0}#preB1 .pre-card{border:1px solid #4b5563;border-radius:14px;padding:18px;margin:18px 0}#preB1 button{background:#292039;color:#fff;border:1px solid #a78bfa;border-radius:9px;padding:12px;min-height:44px;cursor:pointer;font:inherit}#preB1 button[aria-current=true],#preB1 #pre-done{background:#6d28d9}#preB1 small{display:block;color:#c4b5fd;margin-top:5px}#preB1 .pre-line,#preB1 .pre-word{border-bottom:1px solid #374151;padding:9px 0}#preB1 button:focus-visible{outline:3px solid orange}#preB1 .pre-word{min-width:0}#preB1 .pre-word span{overflow-wrap:anywhere}#preB1 #pre-vocab-search{width:100%;box-sizing:border-box;min-height:44px;background:#171725;color:white;border:1px solid #a78bfa;border-radius:10px;padding:12px;font:inherit;font-size:16px}#preB1 [hidden]{display:none!important}#preB1 #pre-dictation-answer{width:100%;box-sizing:border-box;min-height:44px;background:#171725;color:white;border:1px solid #a78bfa;border-radius:10px;padding:12px;font:inherit;font-size:16px;display:block;margin:10px 0}#preB1 #pre-draft{width:100%;box-sizing:border-box;background:#171725;color:white;border:1px solid #a78bfa;border-radius:10px;padding:12px;font:inherit;font-size:16px;resize:vertical}#preB1 .pre-flashcard{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px;background:#1d1830;border-radius:12px;font-size:1.4rem;margin:14px 0}#preB1 .pre-progress{margin:12px 0}#preB1 .pre-progress progress{display:block;width:100%;height:14px;margin-top:6px;accent-color:#a78bfa}#preB1 .pre-question{border:1px solid #55546a;border-radius:10px;margin:12px 0;padding:12px}#preB1 .pre-question label{display:block;padding:9px 0;min-height:40px}#preB1 .pre-question input{width:20px;height:20px;vertical-align:middle}@media(max-width:420px){#preB1{padding:12px}#preB1 .pre-tabs,#preB1 .pre-words{grid-template-columns:1fr 1fr}#preB1 .pre-nav{flex-wrap:wrap}}';
document.head.appendChild(style);
const entry=document.createElement('button');entry.id='sdPreB1Entry';entry.textContent='📚 Alphabetisierung – A2 üben';entry.style.cssText='position:fixed;bottom:86px;right:16px;z-index:1100;padding:12px 16px;background:#6d28d9;color:white;border:2px solid #c4b5fd;border-radius:40px;font:600 14px system-ui;box-shadow:0 3px 18px #0008;cursor:pointer';entry.onclick=open;
function mount(){if(!document.getElementById('sdPreB1Entry'))document.body.appendChild(entry)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
