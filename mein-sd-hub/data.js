/* SD Hub personal area – local-only curated content and pure helpers. */
(function(root){
"use strict";
const items=[
{id:"deutsch",title:"Deutsch lernen",icon:"📚",category:"Lernen",href:"/deutsch/",keywords:"deutsch a1 a2 b1 alphabet lesen hören schreiben sprechen sprache vokabeln wortschatz grammatik prüfung kurs lernen",description:"Vom Alphabet bis B1 lernen.",color:"#4cc79e"},
{id:"b1",title:"B1-Prüfungstraining",icon:"🎓",category:"Lernen",href:"/deutsch/b1-pruefung.html",keywords:"test musterprüfung zertifikat prüfung b1 lesen hören sprechen schreiben telc goethe üben training",description:"Lesen, Hören, Schreiben und Sprechen üben.",color:"#4cc79e"},
{id:"jobs",title:"Lebenslauf & Bewerbung",icon:"💼",category:"Arbeit",href:"/Lebenslauf_app.html",keywords:"arbeit bewerbung lebenslauf cv anschreiben job beruf jobs stelle finden",description:"Eine Bewerbung vorbereiten.",color:"#75aff3"},
{id:"bewerbungen",title:"Bewerbungs-Tracker",icon:"📋",category:"Arbeit",href:"/bewerbungen/",keywords:"arbeit jobs bewerbungen nachverfolgen planen interview",description:"Bewerbungen im Blick behalten.",color:"#75aff3"},
{id:"anerkennung",title:"Abschlüsse anerkennen",icon:"🏅",category:"Arbeit",href:"/anerkennung/",keywords:"beruf abschluss anerkennung ausland deutschland diplom",description:"Orientierung zur Berufsanerkennung.",color:"#75aff3"},
{id:"post",title:"Briefe verstehen",icon:"📬",category:"Alltag",href:"/post/",keywords:"brief behörde amt post schreiben verstehen dokument übersetzen",description:"Post und Schreiben besser verstehen.",color:"#f7b36f"},
{id:"scanner",title:"Dokumente scannen",icon:"📷",category:"Alltag",href:"/scanner/",keywords:"papier foto scanner dokument pdf scannen unterlagen",description:"Dokumente digitalisieren.",color:"#f7b36f"},
{id:"pdf",title:"PDF-Studio",icon:"📄",category:"Alltag",href:"/pdf-studio/",keywords:"pdf bearbeiten unterschreiben signieren dokument text datei",description:"PDF-Dateien bearbeiten.",color:"#f7b36f"},
{id:"fristen",title:"Fristen planen",icon:"📅",category:"Alltag",href:"/fristen/",keywords:"termin frist datum deadline erinnerung kalender",description:"Wichtige Termine organisieren.",color:"#f7b36f"},
{id:"wohnung",title:"Wohnungsbewerbung",icon:"🏡",category:"Alltag",href:"/wohnung/",keywords:"wohnung miete haus umzug vermieter wohnen",description:"Unterlagen für die Wohnungssuche.",color:"#a6d67a"},
{id:"haushalt",title:"Haushaltsbuch",icon:"💶",category:"Alltag",href:"/haushalt/",keywords:"geld finanzen haushalt ausgaben sparen budget",description:"Einnahmen und Ausgaben überblicken.",color:"#a6d67a"},
{id:"vertrag",title:"Verträge & Kündigung",icon:"📑",category:"Alltag",href:"/vertraege/",keywords:"vertrag kündigung handy miete abo frist",description:"Verträge verwalten.",color:"#a6d67a"},
{id:"studio",title:"SD Code-Studio",icon:"💻",category:"Kreativ",href:"/studio/",keywords:"code programmieren website html css javascript entwickeln app zip projekt studio",description:"Webseiten und Programme entwickeln.",color:"#c3a5fb"},
{id:"design",title:"SD Design-Studio",icon:"🎨",category:"Kreativ",href:"/design/",keywords:"design kreativ flyer poster einladung visitenkarte grafik zeichnen",description:"Ideen visuell gestalten.",color:"#c3a5fb"},
{id:"ki",title:"KI-Assistent",icon:"✨",category:"KI",href:"/assistent/",keywords:"ki künstliche intelligenz ai assistent fragen text schreiben chat hilfe",description:"Fragen stellen und Texte verbessern.",color:"#87cfeb"},
{id:"pibo",title:"Pibo 3D",icon:"🐱",category:"Kids",href:"/kids/",keywords:"katze pibo tiere kinder spielen kids 3d",description:"Mit Pibo spielen.",color:"#ff9cc5"},
{id:"spiele",title:"SD Kids Spiele",icon:"🎮",category:"Kids",href:"/kids/games/",keywords:"kinder spiele games spielen lernen blockworld familie",description:"Spiele und Abenteuer entdecken.",color:"#ff9cc5"}
];
const goals=[
{id:"lernen",emoji:"📚",title:"Etwas lernen",subtitle:"Deutsch, Computer und neue Fähigkeiten",query:"deutsch lernen prüfung computer",itemIds:["deutsch","b1","studio"]},
{id:"arbeit",emoji:"💼",title:"Arbeit finden",subtitle:"Lebenslauf, Bewerbung und Beruf",query:"arbeit bewerbung job lebenslauf",itemIds:["jobs","bewerbungen","anerkennung"]},
{id:"alltag",emoji:"📄",title:"Alltag erledigen",subtitle:"Briefe, PDFs und Fristen",query:"brief scanner pdf behörde",itemIds:["post","pdf","fristen"]},
{id:"kreativ",emoji:"💻",title:"Etwas entwickeln",subtitle:"Webseiten, Apps und Designs",query:"code webseite design programmieren",itemIds:["studio","design"]},
{id:"ki",emoji:"✨",title:"KI ausprobieren",subtitle:"Fragen, Ideen und Texte",query:"ki assistent chat",itemIds:["ki","studio"]},
{id:"spielen",emoji:"🐱",title:"Spielen",subtitle:"Pibo und Kinderspiele",query:"pibo spiele kinder",itemIds:["pibo","spiele"]}
];
const academy=[
{id:"german",name:"Deutsch im Alltag",icon:"🗣️",summary:"Praktische Sätze für tägliche Situationen.",lessons:[
{id:"g-1",title:"Sich vorstellen",minutes:5,explanation:"Stelle dich kurz und freundlich vor. Übe den Satz: „Ich heiße …“",question:"Welcher Satz ist eine Vorstellung?",choices:["Ich heiße Sara.","Das Wetter ist schön.","Es kostet zehn Euro."],answer:0,tip:"Mit „Ich heiße …“ sagst du deinen Namen."},
{id:"g-2",title:"Im Geschäft fragen",minutes:6,explanation:"Verwende „Entschuldigung“ und „Wie viel kostet …?“, wenn du eine Frage hast.",question:"Wie fragst du höflich nach dem Preis?",choices:["Gib das!","Wie viel kostet das bitte?","Es ist kalt."],answer:1,tip:"„Bitte“ und eine vollständige Frage sind höflich."},
{id:"g-3",title:"Einen Termin vereinbaren",minutes:6,explanation:"„Ich möchte einen Termin vereinbaren“ ist eine nützliche Formulierung.",question:"Was sagst du, wenn du einen Termin benötigst?",choices:["Ich habe Hunger.","Ich möchte einen Termin vereinbaren.","Ich gehe spazieren."],answer:1,tip:"Bei einem Termin kannst du nach Tag und Uhrzeit fragen."},
{id:"g-4",title:"Einen Brief verstehen",minutes:7,explanation:"Lies zuerst Absender, Datum, Betreff und mögliche Fristen. Bei wichtigen Schreiben hole fachliche Hilfe.",question:"Welchen Hinweis prüfst du besonders sorgfältig?",choices:["Die Farbe des Umschlags","Die Schriftart","Eine angegebene Frist"],answer:2,tip:"Eine Frist kann wichtig sein. Notiere sie sofort."}
]},
{id:"digital",name:"Computer & Internet",icon:"🖥️",summary:"Digitale Grundlagen sicher anwenden.",lessons:[
{id:"d-1",title:"Starke Passwörter",minutes:6,explanation:"Benutze für jeden Dienst ein einzigartiges langes Passwort und möglichst eine Passwortverwaltung.",question:"Was ist die sicherste Wahl?",choices:["Ein Passwort überall","Ein langes einzigartiges Passwort","Dein Geburtstag"],answer:1,tip:"Mehrere Dienste sollten nicht dasselbe Passwort nutzen."},
{id:"d-2",title:"Phishing erkennen",minutes:7,explanation:"Sei skeptisch bei Nachrichten mit Druck, unerwarteten Anhängen oder fragwürdigen Links.",question:"Was machst du bei einer verdächtigen Nachricht?",choices:["Den Link sofort öffnen","Dein Passwort mitteilen","Die Absenderadresse und Seite unabhängig prüfen"],answer:2,tip:"Öffne die Webseite selbst statt auf den Nachrichtenlink zu klicken."},
{id:"d-3",title:"Dateien organisieren",minutes:5,explanation:"Nutze passende Dateinamen und übersichtliche Ordner. Sichere wichtige Dateien regelmäßig.",question:"Welche Datei ist leichter wiederzufinden?",choices:["Dokument1.pdf","Bewerbung_2026_Lebenslauf.pdf","neu-neu2.pdf"],answer:1,tip:"Ein Name mit Inhalt und Datum hilft bei der Suche."},
{id:"d-4",title:"Sichere Updates",minutes:5,explanation:"Halte Browser und Betriebssystem aktuell. Installiere Apps nur aus vertrauenswürdigen Quellen.",question:"Warum sind Sicherheitsupdates sinnvoll?",choices:["Sie schließen bekannte Schwachstellen","Sie löschen immer alle Dateien","Sie ersetzen Backups"],answer:0,tip:"Updates sind wichtig, aber kein Ersatz für ein Backup."}
]},
{id:"career",name:"Bewerbung & Beruf",icon:"💼",summary:"Schrittweise auf Bewerbungen vorbereiten.",lessons:[
{id:"c-1",title:"Stellenanzeige lesen",minutes:6,explanation:"Achte auf Aufgaben, Anforderungen, Ort und Bewerbungsfrist.",question:"Was solltest du zuerst herausfinden?",choices:["Welche Qualifikationen gefordert sind","Welche Farbe das Logo hat","Wie lang der Firmenname ist"],answer:0,tip:"Die Anforderungen helfen dir bei einer passenden Bewerbung."},
{id:"c-2",title:"Lebenslauf strukturieren",minutes:7,explanation:"Zeige relevante Erfahrungen, Ausbildung und Kenntnisse klar und wahrheitsgemäß.",question:"Was gehört in einen Lebenslauf?",choices:["Erfundene Abschlüsse","Relevante Berufserfahrung","Private Passwörter"],answer:1,tip:"Alle Angaben müssen zutreffen."},
{id:"c-3",title:"Anschreiben formulieren",minutes:7,explanation:"Beschreibe, warum dich die Stelle interessiert und welche Erfahrung du mitbringst.",question:"Welcher Satz ist passender?",choices:["Ich kann alles ohne Erfahrung.","Meine Erfahrung im Kundenservice passt zu Ihren Aufgaben.","Ich möchte keine Angaben machen."],answer:1,tip:"Ein konkreter Bezug zur Stelle wirkt überzeugender."},
{id:"c-4",title:"Gespräch vorbereiten",minutes:6,explanation:"Informiere dich über den Arbeitgeber und übe kurze Beispiele aus deinem Berufsalltag.",question:"Was hilft vor dem Gespräch?",choices:["Keine Fragen stellen dürfen","Erfolge und Beispiele vorbereiten","Nur auswendig gelernte Sätze benutzen"],answer:1,tip:"Eigene konkrete Beispiele machen Antworten greifbar."}
]},
{id:"code",name:"Programmieren anfangen",icon:"💻",summary:"Erste Schritte mit HTML, CSS und JavaScript.",lessons:[
{id:"p-1",title:"HTML verstehen",minutes:6,explanation:"HTML beschreibt den Inhalt einer Webseite: Überschriften, Texte, Listen und Links.",question:"Wozu dient <h1> in HTML?",choices:["Für eine Überschrift","Für eine Datenbank","Für ein Passwort"],answer:0,tip:"Das h steht für Heading: Überschrift."},
{id:"p-2",title:"CSS entdecken",minutes:6,explanation:"CSS steuert Darstellung und Layout: Farben, Abstände, Größen und Schrift.",question:"Wofür verwendet man CSS?",choices:["Um Post zu versenden","Für Farben und Layout","Zum Einschalten des Computers"],answer:1,tip:"CSS ist für das Aussehen deiner Webseite zuständig."},
{id:"p-3",title:"JavaScript nutzen",minutes:7,explanation:"JavaScript lässt Webseiten auf Ereignisse reagieren, etwa einen Klick auf einen Knopf.",question:"Was kann JavaScript auf einer Webseite tun?",choices:["Nur Bilder malen","Auf einen Klick reagieren","Den Bildschirm physisch reparieren"],answer:1,tip:"Mit JavaScript werden Webseiten interaktiv."},
{id:"p-4",title:"Ein Projekt testen",minutes:7,explanation:"Prüfe deine Webseite am Computer und am Handy. Teste auch Tastatur und Fehlermeldungen.",question:"Welcher Test ist sinnvoll?",choices:["Nur das eigene Gerät testen","Die Seite nie öffnen","Auf mehreren Bildschirmgrößen und mit Tastatur prüfen"],answer:2,tip:"Verschiedene Geräte und Eingaben decken Fehler auf."}
]}
];
const paths=[
{id:"start",icon:"🧭",title:"Neu in Deutschland",description:"Eine allgemeine Orientierung für die ersten Schritte.",steps:[
["Sprache lernen","Beginne mit einem passenden Kurs und übe regelmäßig.","/deutsch/"],
["Unterlagen ordnen","Lege wichtige Dokumente sicher und nachvollziehbar ab.","/mappe/"],
["Amtliche Schreiben prüfen","Lies Betreff und Fristen sorgfältig.","/post/"],
["Termine organisieren","Notiere Fristen und wichtige Termine.","/fristen/"],
["Arbeit und Bildung erkunden","Informiere dich über passende nächste Schritte.","/arbeiten/"]
]},
{id:"job",icon:"💼",title:"Mein Weg zur Arbeit",description:"Von den ersten Informationen bis zum Bewerbungsgespräch.",steps:[
["Berufliche Möglichkeiten ansehen","Prüfe Informationen zu Beruf und Arbeit.","/arbeiten/"],
["Abschluss und Qualifikation prüfen","Kläre, ob eine Anerkennung relevant sein könnte.","/anerkennung/"],
["Lebenslauf erstellen","Fasse Erfahrungen und Kenntnisse wahrheitsgemäß zusammen.","/Lebenslauf_app.html"],
["Bewerbungen organisieren","Halte Bewerbungen und Antworten fest.","/bewerbungen/"],
["Vorstellungsgespräch üben","Bereite Beispiele und Fragen vor.","/training/"]
]},
{id:"wohnung",icon:"🏠",title:"Mein Weg zur Wohnung",description:"Eine geordnete Vorbereitung auf die Wohnungssuche.",steps:[
["Budget prüfen","Überlege, wie viel Miete du dir leisten kannst.","/haushalt/"],
["Unterlagen zusammenstellen","Sammle nur die jeweils benötigten Dokumente.","/mappe/"],
["Wohnungsbewerbung vorbereiten","Erstelle eine übersichtliche Bewerbung.","/wohnung/"],
["Vertrag sorgfältig lesen","Achte auf wichtige Bedingungen und Fristen.","/vertraege/"],
["Wichtige Termine notieren","Behalte Fristen und Termine im Blick.","/fristen/"]
]},
{id:"family",icon:"👨‍👩‍👧",title:"Familie & Alltag",description:"Ein einfacher Plan für Lernen, Dokumente und gemeinsame Zeit.",steps:[
["Deutsch gemeinsam üben","Kurze regelmäßige Lerneinheiten helfen beim Einstieg.","/deutsch/"],
["Briefe verständlich machen","Prüfe den Inhalt und mögliche Termine.","/post/"],
["Wichtige Unterlagen digitalisieren","Scanne nur notwendige Dokumente.","/scanner/"],
["Aufgaben und Ausgaben organisieren","Nutze die praktischen Alltagshelfer.","/haushalt/"],
["Zeit zum Spielen einplanen","Entdecke gemeinsam die SD Kids-Spiele.","/kids/games/"]
]}
];
const phrases=[
{id:"hello",de:"Guten Tag!",en:"Good day!",fa:"روز بخیر!",ur:"دن بخیر!",ti:"ሰናይ መዓልቲ!",hint:"Eine freundliche Begrüßung."},
{id:"name",de:"Ich heiße Sara.",en:"My name is Sara.",fa:"اسم من سارا است.",ur:"میرا نام سارہ ہے۔",ti:"ስመይ ሳራ እዩ።",hint:"Du kannst Sara durch deinen eigenen Namen ersetzen."},
{id:"help",de:"Können Sie mir bitte helfen?",en:"Could you please help me?",fa:"می‌توانید لطفاً به من کمک کنید؟",ur:"کیا آپ براہ کرم میری مدد کر سکتے ہیں؟",ti:"በጃኹም ክትሕግዙኒ ትኽእሉዶ?",hint:"Sie ist die höfliche Anrede."},
{id:"understand",de:"Ich verstehe das nicht.",en:"I don't understand that.",fa:"من این را نمی‌فهمم.",ur:"مجھے یہ سمجھ نہیں آیا۔",ti:"ነዚ ኣይተረዳእኩዎን።",hint:"Du kannst danach um eine Erklärung bitten."},
{id:"repeat",de:"Können Sie das bitte wiederholen?",en:"Could you please repeat that?",fa:"می‌توانید لطفاً آن را تکرار کنید؟",ur:"کیا آپ یہ دوبارہ کہہ سکتے ہیں؟",ti:"በጃኹም ነዚ ክትደግሙለይ ትኽእሉዶ?",hint:"Sprich langsam und deutlich."},
{id:"appointment",de:"Ich möchte einen Termin vereinbaren.",en:"I would like to make an appointment.",fa:"می‌خواهم یک وقت ملاقات بگیرم.",ur:"میں ملاقات کا وقت لینا چاہتا/چاہتی ہوں۔",ti:"ቆጸራ ክሕዝ እደሊ ኣለኹ።",hint:"Zum Beispiel bei einer Behörde oder einer Praxis."},
{id:"where",de:"Wo finde ich das?",en:"Where can I find that?",fa:"کجا می‌توانم آن را پیدا کنم؟",ur:"میں یہ کہاں تلاش کر سکتا/سکتی ہوں؟",ti:"ኣበይ ክረኽቦ ይኽእል?",hint:"Eine praktische Frage nach einem Ort."},
{id:"cost",de:"Wie viel kostet das?",en:"How much does that cost?",fa:"قیمت آن چقدر است؟",ur:"اس کی قیمت کتنی ہے؟",ti:"እዚ ክንደይ ይኸውን?",hint:"Beim Einkaufen hilft dir dieser Satz."},
{id:"thanks",de:"Vielen Dank für Ihre Hilfe.",en:"Thank you very much for your help.",fa:"از کمک شما بسیار سپاسگزارم.",ur:"آپ کی مدد کا بہت شکریہ۔",ti:"ንሓገዝኩም ብዙሕ የቐንየለይ።",hint:"Eine höfliche Art, Danke zu sagen."},
{id:"slow",de:"Bitte sprechen Sie langsam.",en:"Please speak slowly.",fa:"لطفاً آهسته صحبت کنید.",ur:"براہ کرم آہستہ بولیں۔",ti:"በጃኹም ቀስ ኢልኩም ተዛረቡ።",hint:"Du darfst jederzeit um langsameres Sprechen bitten."}
];
const projects=[
{id:"profile",icon:"👤",title:"Meine persönliche Seite",type:"Webseite",subtitle:"Eine einfache Profilseite mit Kontaktbereich.",colors:["#16635a","#e5f8ef"],file:"mein-profil.html"},
{id:"invite",icon:"💌",title:"Einladung gestalten",type:"Design",subtitle:"Eine stilvolle Einladung mit Datum und Ort.",colors:["#7451a8","#f3e9ff"],file:"einladung.html"},
{id:"portfolio",icon:"🎨",title:"Kreatives Portfolio",type:"Webseite",subtitle:"Projektkacheln für eigene Arbeiten.",colors:["#315e88","#eaf4ff"],file:"portfolio.html"},
{id:"task",icon:"✅",title:"Mini-Aufgabenliste",type:"Mini-App",subtitle:"Eine kleine Aufgabenliste mit lokalen Daten.",colors:["#aa623c","#fff1e0"],file:"aufgabenliste.html"}
];
function normalize(t){return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("de").trim().replace(/\s+/g," ")}
function recommend(input,limit){const q=normalize(input);if(!q)return [];const words=q.split(/[^a-z0-9äöüß]+/).filter(w=>w.length>2||(/[0-9]/.test(w)&&w.length>=2));const ranked=items.map(item=>{let score=0;const title=normalize(item.title),hay=normalize(item.title+" "+item.keywords+" "+item.description);if(title.includes(q))score+=8;if(hay.includes(q))score+=6;for(const w of words){if(title.includes(w))score+=4;else if(hay.includes(w))score+=2;}return{...item,score}}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,"de"));return ranked.slice(0,Math.min(Math.max(Number(limit)||4,1),8))}
const storageKey="sdhub.personal.v1";
const initial=()=>({version:1,completedLessons:[],completedSteps:[],favorites:[],recent:[],nickname:"",updatedAt:""});
function cleanString(v,n){return typeof v==="string"?v.slice(0,n):""}
function uniqueAllowed(v,valid,max){return Array.isArray(v)?Array.from(new Set(v.filter(x=>typeof x==="string"&&valid.includes(x)))).slice(0,max):[]}
function sanitizeState(input){const s=initial();if(!input||typeof input!=="object"||Array.isArray(input))return s;
 const ids=items.map(x=>x.id),lessons=academy.flatMap(c=>c.lessons.map(l=>l.id)),steps=paths.flatMap(p=>p.steps.map((_,i)=>p.id+":"+i));
 s.completedLessons=uniqueAllowed(input.completedLessons,lessons,lessons.length);
 s.completedSteps=uniqueAllowed(input.completedSteps,steps,steps.length);
 s.favorites=uniqueAllowed(input.favorites,ids,ids.length);
 s.recent=uniqueAllowed(input.recent,ids,8);
 s.nickname=cleanString(input.nickname,40).replace(/[<>]/g,"");
 s.updatedAt=cleanString(input.updatedAt,32);
 return s}
const api={items,goals,academy,paths,phrases,projects,normalize,recommend,storageKey,initial,sanitizeState};
root.SDPersonalData=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);