/* SD Game-Studio Academy capstones: local planning and self-assessment only. */
(() => {
'use strict';
const projects=[
{
 id:'forest',code:'PROJECT / 01',title:'Der spielbare Wald-Parcours',subtitle:'Level-Design · Spielfigur · Spieltest',time:'60–90 Minuten',type:'Level-Editor',href:'../index.html',cta:'Level-Editor öffnen',
 intro:'Baue aus einem leeren Gelände eine verständliche, begehbare 3D-Szene mit sichtbarem Start, einem Weg aus Hindernissen und einem klaren Ziel. Du prüfst die Szene selbst aus Spielersicht.',
 deliverables:[
 'Eine exportierte, erneut importierbare JSON-Szene.',
 'Ein Wald-Parcours mit mindestens acht bewusst platzierten Objekten und einer erkennbaren Wegführung.',
 'Eine nachvollziehbare Kurznotiz mit drei Testbeobachtungen und einer vorgenommenen Verbesserung.'
 ],
 milestones:[
 ['Grundszene angelegt','Öffne den Level-Editor und entscheide dich für einen klar erkennbaren Startpunkt und eine Zielzone.'],
 ['Gelände gestaltet','Hebe einen Teil des Bodens an, glätte einen Übergang und wähle ein passendes Bodenmaterial.'],
 ['Wald gestaltet','Füge mindestens ein Waldstück hinzu und verteile mehrere weitere Natur-Objekte. Achte auf freie Wege.'],
 ['Hindernisse platziert','Ergänze Formen und passe X-/Z-Position sowie Größe im Inspector an. Halte unter 70 Objekten.'],
 ['Aus Spielersicht getestet','Nutze Spielen, Bewegung und Sprung. Bessere mindestens eine schwer erkennbare Stelle nach.'],
 ['Sicherung kontrolliert','Exportiere als JSON, importiere erneut und überprüfe zwei Objekte und die Lichtstimmung.']
 ],
 criteria:[
 ['Funktion','Die Szene lässt sich im aktuellen Level-Editor öffnen und im Spielmodus erkunden.'],
 ['Gestaltung','Start, Weg und Ziel sind räumlich erkennbar; Hindernisse erscheinen absichtlich platziert.'],
 ['Qualität','Mindestens eine dokumentierte Testkorrektur und erfolgreicher JSON-Reimport.']
 ]
},
{
 id:'outpost',code:'PROJECT / 02',title:'Der Wüsten-Außenposten',subtitle:'Atmosphäre · Räumlichkeit · Beleuchtung',time:'60–90 Minuten',type:'Level-Editor',href:'../index.html',cta:'Level-Editor öffnen',
 intro:'Entwirf ein kleines Action- oder Adventure-Level als Außenposten. Nutze Beleuchtung, Boden und modulare Objekte, um Orientierung zu schaffen. Es ist ein Level-Design-Prototyp, kein vollständiges Kampfsystem.',
 deliverables:[
 'Eine exportierte JSON-Szene mit einer Wüstenumgebung.',
 'Ein sichtbar gegliederter Außenposten mit Eingang, zentraler Zone und einem erhöhten Orientierungspunkt.',
 'Eine kurze Designentscheidung zur Lichtstimmung und zur Begehbarkeit.'
 ],
 milestones:[
 ['Welt vorbereitet','Stelle den Boden auf Wüste und überlege dir eine Ansicht, von der aus du die gesamte Basis erkennst.'],
 ['Drei Zonen geplant','Lege Eingang, Zentrum und Aussichtspunkt fest. Nutze Würfel und Säulen als platzhalterartige Architektur.'],
 ['Gelände als Struktur verwendet','Forme einen sanften Hügel oder eine erhöhte Fläche und glätte den Übergang.'],
 ['Sichtführung verbessert','Verteile Felsen und andere vorhandene Bausteine so, dass die wichtigen Wege lesbar bleiben.'],
 ['Atmosphäre verglichen','Teste Morgen, Tag, Abend und Nacht und wähle eine Lichtstimmung mit gut sichtbaren Wegen.'],
 ['Spieltest und Export erledigt','Spiele die Szene, behebe ein konkretes Problem und sichere den Außenposten als JSON-Datei.']
 ],
 criteria:[
 ['Struktur','Die drei Bereiche haben erkennbare Funktionen und eine nachvollziehbare räumliche Anordnung.'],
 ['Atmosphäre','Boden und Tageszeit unterstützen die gewünschte Stimmung, ohne die Orientierung zu verhindern.'],
 ['Technik','Ein lokaler Spieltest und eine exportierte, gültige JSON-Projektdatei liegen vor.']
 ]
},
{
 id:'showroom',code:'PROJECT / 03',title:'Der 3D-Asset-Showroom',subtitle:'GLB-Import · Modellorientierung · Projektqualität',time:'75–120 Minuten',type:'Level-Editor',href:'../index.html',cta:'Level-Editor öffnen',
 intro:'Gestalte eine kleine Präsentationsfläche für eigene oder rechtmäßig genutzte GLB-Modelle. Das Projekt trainiert technische Asset-Prüfung, Platzierung, Größenvergleich und die Grenzen des aktuellen Formats.',
 deliverables:[
 'Eine JSON-v2-Projektdatei mit mindestens einem platzierten GLB-Asset.',
 'Eine bewusste Anordnung von Modellinstanzen und ergänzenden Szenenobjekten.',
 'Eine dokumentierte Einschränkung der aktuellen GLB-Vorschau.'
 ],
 milestones:[
 ['GLB-Datei vorbereitet','Wähle ein eigenes oder rechtmäßig verwendbares GLB-Modell mit maximal 8 MiB.'],
 ['Modell erfolgreich geprüft','Öffne die GLB-Vorschau und kontrolliere Geometrie und Basisfarben. Texturen, Skinning und Animationen sind noch nicht unterstützt.'],
 ['Modell in Szene platziert','Nutze „In Welt platzieren“ und kontrolliere den neuen Eintrag im Scene Outliner.'],
 ['Showroom gestaltet','Baue eine kleine Plattform oder einen Präsentationsbereich mit einfachen vorhandenen Formen.'],
 ['Instanz bearbeitet','Passe X/Z-Position, Größe und Y-Drehung eines Modells im Inspector an.'],
 ['v2-Datei erfolgreich geprüft','Speichere das Projekt, importiere es erneut und überprüfe Modell und Ausrichtung.']
 ],
 criteria:[
 ['Asset-Budget','Maximal vier unterschiedliche GLB-Dateien, zusammen höchstens 8 MiB, und höchstens 70 Szenenobjekte.'],
 ['Präsentation','Modellinstanzen sind gut sichtbar, nicht unabsichtlich überlagert und klar angeordnet.'],
 ['Nachweis','Export und Reimport gelingen; die Grenzen der GLB-Vorschau sind dokumentiert.']
 ]
},
{
 id:'world',code:'PROJECT / 04',title:'Das Open-World-Techniklabor',subtitle:'Große Welt · Zellen · Performance-Analyse',time:'90–120 Minuten',type:'Großwelt-Engine',href:'../large-world.html',cta:'Großwelt-Engine öffnen',
 intro:'Untersuche die experimentelle Großwelt als Basis für zukünftige Action-, Racing- oder Open-World-Projekte. Du lernst, Datenbudgets und aktive Szenenzellen zu messen, statt fertiges Streaming oder Multiplayer vorauszusetzen.',
 deliverables:[
 'Eine gespeicherte und wieder geöffnete Version-3-JSON-Großwelt.',
 'Eine kurze Messnotiz mit aktiven Zellen, aktiven Objekten und Draw Calls an zwei Kamerapositionen.',
 'Eine Architekturidee für ein späteres großes Spiel inklusive zwei derzeit fehlender Engine-Funktionen.'
 ],
 milestones:[
 ['Großwelt analysiert','Öffne die Großwelt-Engine und finde die 640 × 640 Einheiten, 256 Zellen und 2.048 Ausgangsobjekte der Beispielwelt.'],
 ['Erste Messung notiert','Halte die Werte für aktive Zellen, aktive Objekte und Draw Calls an einer Startposition fest.'],
 ['Neue Region geprüft','Bewege dich mit WASD zu einer entfernten Position und notiere dort dieselben drei Messwerte.'],
 ['Zellenbasierte Bearbeitung ausgeführt','Füge einen Baum und einen Felsen an der Kameraposition hinzu und beobachte die Gesamtobjektzahl.'],
 ['Großwelt gesichert','Exportiere ein v3-JSON, importiere es erneut und kontrolliere die hinzugefügten Objekte.'],
 ['Technikplanung erstellt','Skizziere dein nächstes größeres Spiel und benenne zwei fehlende Funktionen (z. B. Disk-Streaming, Fahrzeugphysik oder Netzwerk-Synchronisierung).']
 ],
 criteria:[
 ['Messung','Werte beider Positionen sind dokumentiert; du unterscheidest Gesamtdaten und aktiven Sichtbereich.'],
 ['Daten','Die bearbeitete Großwelt wird als v3-JSON wiederhergestellt.'],
 ['Realismus','Du verwechselst In-Memory-Cell-Culling nicht mit vollständigem Streaming von Festplatte.']
 ]
}
];
const storageKey='sd-game-academy-capstones-v1';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;':'&quot;',"'":'&#39;'}[c]));
function load(){try{const v=JSON.parse(localStorage.getItem(storageKey)||'{}');return v&&typeof v==='object'&&v.projects&&typeof v.projects==='object'?v:{projects:{}};}catch(_){return{projects:{}};}}
let state=load(),active=projects.find(x=>x.id===decodeURIComponent(location.hash.slice(1)))?.id||projects[0].id;
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(_){/* Private mode: page remains usable */}}
function record(id){const p=state.projects[id];return p&&typeof p==='object'?p:{checks:[],notes:''};}
function checks(p){const value=record(p.id).checks;return Array.isArray(value)?p.milestones.map((_,i)=>value[i]===true):p.milestones.map(()=>false);}
function done(p){return checks(p).every(Boolean);}
function selected(){return projects.find(x=>x.id===active)||projects[0];}
function select(id,scroll=false){
 if(!projects.some(p=>p.id===id))return;
 active=id;try{history.replaceState(null,'','#'+encodeURIComponent(id));}catch(_){}
 render();
 if(scroll){$('projectContent').focus({preventScroll:true});$('projectContent').scrollIntoView({block:'start',behavior:'smooth'});}
}
function cards(){
 $('projectCards').innerHTML=projects.map((p,i)=>{
 const c=checks(p).filter(Boolean).length;
 return '<button class="project-card '+(p.id===active?'active':'')+'" type="button" data-project="'+esc(p.id)+'" aria-pressed="'+(p.id===active)+'"><span class="project-tag">'+esc(p.code)+'</span><strong>'+esc(p.title)+'</strong><small>'+esc(p.subtitle)+'</small><span class="project-foot"><span>'+c+' / '+p.milestones.length+' Meilensteine</span><span class="'+(done(p)?'completed':'')+'">'+(done(p)?'✓ Erledigt':String(i+1).padStart(2,'0')+' ↗')+'</span></span></button>';
 }).join('');
 $('overallProgress').textContent=projects.filter(done).length+' / '+projects.length+' abgeschlossen';
}
function body(){
 const p=selected(),notes=String(record(p.id).notes||'').slice(0,8000),cs=checks(p);
 $('projectContent').innerHTML=
 '<span class="project-label">'+esc(p.code)+' · '+esc(p.type)+'</span>'+
 '<h2>'+esc(p.title)+'</h2>'+
 '<p class="project-intro">'+esc(p.intro)+'</p>'+
 '<div class="project-pills"><span>⏱ '+esc(p.time)+'</span><span>6 Meilensteine</span><span>Projektprüfung durch dich</span></div>'+
 '<div class="section-block"><h3>Dein Projektauftrag</h3><p>Arbeite schrittweise in der aktuellen Engine. Die Aufgaben sind so formuliert, dass sie mit den vorhandenen Werkzeugen umsetzbar sind.</p><a class="project-link" href="'+esc(p.href)+'" target="_blank" rel="noopener">'+esc(p.cta)+' ↗</a></div>'+
 '<div class="section-block"><h3>Diese Ergebnisse sollst du abgeben</h3><ol class="output-list">'+p.deliverables.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol></div>'+
 '<div class="section-block"><h3>Deine sechs Meilensteine</h3><p>Hake die Aufgabe erst ab, wenn du sie selbst praktisch ausgeführt hast.</p><div class="milestones">'+p.milestones.map(([title,detail],i)=>'<label class="milestone"><input type="checkbox" data-milestone="'+i+'" '+(cs[i]?'checked':'')+'><span><strong>'+esc(title)+'</strong><small>'+esc(detail)+'</small></span></label>').join('')+'</div></div>'+
 '<div class="section-block"><h3>Bewertungsraster</h3><p>Prüfe vor deinem Abschluss jeden Punkt. Dies ist eine Selbstkontrolle, keine automatische Bewertung.</p><table class="rubric"><thead><tr><th>Bereich</th><th>Woran du Qualität erkennst</th></tr></thead><tbody>'+p.criteria.map(([label,detail])=>'<tr><td>'+esc(label)+'</td><td>'+esc(detail)+'</td></tr>').join('')+'</tbody></table></div>'+
 '<div class="section-block"><h3>Deine Projektnotizen</h3><p>Halte Testwerte, Verbesserungen und offene Fragen fest. Dieser Text wird nur lokal im Browser gespeichert.</p><textarea id="projectNotes" class="project-notes" maxlength="8000" aria-label="Projektnotizen" placeholder="Zum Beispiel: Was funktioniert? Was hast du verbessert? Was fehlt noch?"></textarea><span class="note-status" id="noteStatus" role="status">Nur auf deinem Gerät gespeichert</span></div>';
 $('projectNotes').value=notes;
}
function sidebar(){
 const p=selected(),n=checks(p).filter(Boolean).length,pct=Math.round(100*n/p.milestones.length);
 $('projectPercent').textContent=pct+' %';
 $('projectProgress').setAttribute('aria-valuenow',String(pct));
 $('projectProgressFill').style.width=pct+'%';
 $('projectMilestoneCount').textContent=n+' / '+p.milestones.length+' Meilensteine'+(done(p)?' · Selbstprüfung abgeschlossen':'');
}
function render(){cards();body();sidebar();}
$('projectCards').addEventListener('click',e=>{const b=e.target.closest('[data-project]');if(b)select(b.dataset.project,true);});
$('projectContent').addEventListener('change',e=>{
 if(!e.target.matches('[data-milestone]'))return;
 const p=selected(),i=Number(e.target.dataset.milestone);
 if(!Number.isInteger(i)||i<0||i>=p.milestones.length)return;
 const r=record(p.id),value=checks(p);value[i]=e.target.checked;
 state.projects[p.id]={...r,checks:value};save();cards();sidebar();
});
$('projectContent').addEventListener('input',e=>{
 if(e.target.id!=='projectNotes')return;
 const p=selected();state.projects[p.id]={...record(p.id),notes:e.target.value.slice(0,8000)};
 save();$('noteStatus').textContent='Notizen lokal aktualisiert';
});
$('printBrief').addEventListener('click',()=>window.print());
$('resetProject').addEventListener('click',()=>{
 const p=selected();
 if(!window.confirm('Nur die lokalen Meilensteine und Notizen für „'+p.title+'“ zurücksetzen? Deine 3D-Dateien bleiben unverändert.'))return;
 delete state.projects[p.id];save();render();
});
window.addEventListener('hashchange',()=>{const id=decodeURIComponent(location.hash.slice(1));if(projects.some(p=>p.id===id)&&id!==active)select(id);});
render();
})();
