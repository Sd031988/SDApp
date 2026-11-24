/* Zusätzliche Wiederholungsfragen je Lektion (eigene Formulierungen, passend zu den Lektionsinhalten).
   Sie erscheinen nur in „Heute wiederholen“, damit die Wiederholung abwechslungsreicher wird.
   Format: W(lektion, [frage, [antworten], richtig, erklärung], …) */
(function (root) {
"use strict";
const D = root.SDAkWiederholung = root.SDAkWiederholung || Object.create(null);
const W = (id, ...fragen) => { D[id] = fragen.map(([frage, antworten, richtig, erklaerung]) => ({frage, antworten, richtig, erklaerung})); };

/* ---------- Programmieren anfangen (HTML, CSS, JS) ---------- */
W("p-1",
 ["Welche Sprache legt das Aussehen einer Webseite fest, zum Beispiel Farben?", ["HTML", "CSS", "JavaScript"], 1, "CSS gestaltet die Darstellung; HTML liefert den Inhalt."],
 ["Was öffnet eine Webseite auf deinem Gerät?", ["Der Browser", "Die Tastatur", "Der Drucker"], 0, "Der Browser liest HTML, CSS und JavaScript und zeigt das Ergebnis an."]);
W("p-2",
 ["Wo stehen Informationen wie der Seitentitel, die nicht im Fenster erscheinen?", ["Im body", "Im head", "Im footer"], 1, "Der head enthält Informationen über die Seite, der body den sichtbaren Inhalt."],
 ["Welche Dateiendung hat eine HTML-Datei üblicherweise?", ["`.txt`", "`.html`", "`.exe`"], 1, "Browser erkennen Webseiten an der Endung `.html`."]);
W("p-3",
 ["Wie viele h1-Überschriften hat eine übersichtliche Seite meistens?", ["Eine", "Zehn", "Keine"], 0, "Die h1 ist die Hauptüberschrift; Unterteilungen bekommen h2, h3 usw."],
 ["Was passiert mit mehreren Leerzeichen hintereinander in einem p-Absatz?", ["Sie werden alle angezeigt", "Der Browser zeigt sie wie ein einziges Leerzeichen", "Die Seite stürzt ab"], 1, "HTML fasst Leerraum zusammen; Abstände gestaltest du mit CSS."]);
W("p-4",
 ["Welches Element erzeugt eine nummerierte Liste?", ["`<ul>`", "`<ol>`", "`<li>`"], 1, "ol steht für geordnete Liste; die Einträge werden nummeriert."],
 ["Was darf direkt in einem ul stehen?", ["Nur li-Elemente", "Nur Bilder", "Nur Überschriften"], 0, "Jeder Listenpunkt ist ein eigenes li-Element."]);
W("p-5",
 ["Welches Attribut öffnet einen Link in einem neuen Tab?", ["`href=\"_blank\"`", "`target=\"_blank\"`", "`new=\"tab\"`"], 1, "target=\"_blank\" öffnet das Ziel in einem neuen Tab; dazu gehört rel=\"noopener\"."],
 ["Was ist ein relativer Link?", ["Ein Link mit https am Anfang", "Ein Pfad ausgehend von der aktuellen Datei, z. B. `kontakt.html`", "Ein Link ohne Text"], 1, "Relative Pfade zeigen auf Dateien im eigenen Projekt."]);
W("p-6",
 ["Welches Element zeigt ein Bild an?", ["`<pic>`", "`<img>`", "`<image>`"], 1, "img ist das HTML-Element für Bilder."],
 ["Welcher Alternativtext ist am hilfreichsten?", ["`alt=\"Bild\"`", "`alt=\"Rote Katze schläft auf einem Sofa\"`", "`alt=\"IMG_2034\"`"], 1, "Ein guter Alternativtext beschreibt, was auf dem Bild wichtig ist."]);
W("p-7",
 ["Welche Eigenschaft ändert die Schriftgröße?", ["`font-size`", "`text-big`", "`size-font`"], 0, "font-size legt die Größe der Schrift fest."],
 ["Was bedeutet der Farbwert `#ffffff`?", ["Schwarz", "Weiß", "Rot"], 1, "ffffff ist die höchste Stufe aller drei Grundfarben und ergibt Weiß."]);
W("p-8",
 ["Welche Regel erzeugt einen dünnen grauen Rahmen?", ["`border: 1px solid gray;`", "`margin: gray;`", "`padding: 1px line;`"], 0, "border legt Breite, Linienart und Farbe des Rahmens fest."],
 ["Du willst mehr Abstand zwischen zwei Kästen. Was passt?", ["`padding`", "`margin`", "`color`"], 1, "margin ist der Außenabstand zu anderen Elementen."]);
W("p-9",
 ["Wann wird die Funktion in `addEventListener('click', zeige)` ausgeführt?", ["Sofort beim Laden", "Erst beim Klick", "Nie"], 1, "Die Funktion wird übergeben und erst beim Ereignis aufgerufen."],
 ["Was liefert `document.querySelector('#nichtda')`, wenn es kein solches Element gibt?", ["`null`", "`0`", "Einen leeren Knopf"], 0, "Ohne Treffer liefert querySelector null; prüfe das vor der Nutzung."]);
W("p-10",
 ["Welche Variable kann später einen neuen Wert bekommen?", ["`const x = 1;`", "`let x = 1;`", "Beide nicht"], 1, "let erlaubt eine neue Zuweisung, const nicht."],
 ["Was ergibt `10 - 4 * 2`?", ["12", "2", "8"], 1, "Punkt vor Strich: 4 * 2 = 8, dann 10 - 8 = 2."]);
W("p-11",
 ["Welcher Vergleich prüft, ob alter größer oder gleich 18 ist?", ["`alter => 18`", "`alter >= 18`", "`alter = 18`"], 1, ">= bedeutet größer oder gleich."],
 ["Was macht `if (name) { … }` bei einem leeren Text?", ["Der Block läuft", "Der Block läuft nicht", "Es gibt immer einen Fehler"], 1, "Ein leerer Text gilt als falsch, deshalb wird der Block übersprungen."]);
W("p-12",
 ["Was solltest du vor dem Veröffentlichen der Visitenkarte prüfen?", ["Nur die Farbe", "Ansicht am Handy, Links und Rechtschreibung", "Nichts, es reicht der Entwurf"], 1, "Eine fertige Seite wird auf kleinen Bildschirmen und mit echten Klicks getestet."],
 ["Welche Datei ist für Farben und Abstände der Karte zuständig?", ["Die CSS-Regeln", "Die Bilddatei", "Der Dateiname"], 0, "CSS gestaltet; HTML liefert den Inhalt, JavaScript das Verhalten."]);

/* ---------- Webseiten gestalten ---------- */
W("p2-1",
 ["Wie oft sollte eine id auf einer Seite vorkommen?", ["Genau einmal", "Beliebig oft", "Mindestens zweimal"], 0, "Eine id ist eindeutig; für mehrere Elemente nimmt man eine Klasse."],
 ["Welcher Selektor wählt alle Absätze?", ["`.p`", "`#p`", "`p`"], 2, "Ein Elementname ohne Punkt oder Raute wählt alle Elemente dieses Typs."]);
W("p2-2",
 ["Ein Kasten ist `width: 200px` mit 20px padding ohne border-box. Wie breit ist er sichtbar (ohne Rahmen)?", ["200px", "240px", "220px"], 1, "Ohne border-box kommt das padding auf beiden Seiten dazu: 200 + 20 + 20."],
 ["Welcher Teil des Box-Modells liegt ganz innen?", ["margin", "Der Inhalt", "border"], 1, "Von innen nach außen: Inhalt, padding, border, margin."]);
W("p2-3",
 ["Welche Eigenschaft verteilt Flex-Kinder auf der Hauptachse, z. B. mit Abstand dazwischen?", ["`justify-content`", "`align-text`", "`flex-color`"], 0, "justify-content: space-between verteilt Elemente auf der Hauptachse."],
 ["Was macht `flex-direction: column`?", ["Die Kinder stehen untereinander", "Die Kinder verschwinden", "Die Schrift wird fett"], 0, "Die Hauptachse läuft dann von oben nach unten."]);
W("p2-4",
 ["Was erzeugt `grid-template-columns: repeat(3, 1fr)`?", ["Drei gleich breite Spalten", "Drei Zeilen", "Eine Spalte mit 3 Pixeln"], 0, "repeat(3, 1fr) wiederholt drei gleich große Anteile."],
 ["Welche Eigenschaft setzt Abstände zwischen Grid-Zellen?", ["`gap`", "`space`", "`border-gap`"], 0, "gap legt die Abstände zwischen Spalten und Zeilen fest."]);
W("p2-5",
 ["Welche Meta-Angabe braucht eine responsive Seite im head?", ["`<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`", "`<meta name=\"handy\">`", "Keine"], 0, "Ohne viewport-Angabe verkleinern Handys die Seite wie eine Desktopseite."],
 ["`@media (min-width: 800px)` gilt …", ["nur unter 800px", "ab 800px Breite", "nur beim Drucken"], 1, "min-width aktiviert die Regeln ab der genannten Breite."]);
W("p2-6",
 ["Welcher Eingabetyp zeigt am Handy eine Zahlentastatur für Telefonnummern?", ["`type=\"tel\"`", "`type=\"text\"`", "`type=\"phone\"`"], 0, "type=\"tel\" ist für Telefonnummern gedacht."],
 ["Warum ersetzt `required` keine Prüfung auf dem Server?", ["Weil Browserprüfungen umgangen werden können", "Weil required nicht existiert", "Weil Server keine Daten bekommen"], 0, "Alles, was im Browser läuft, kann verändert werden."]);
W("p2-7",
 ["Warum reicht Farbe allein nicht, um einen Fehler zu zeigen?", ["Manche Menschen unterscheiden Farben schlecht", "Farben sind verboten", "Farben laden langsam"], 0, "Ergänze Text oder ein Symbol, damit alle die Meldung erkennen."],
 ["Womit sollte eine Seite vollständig bedienbar sein?", ["Nur mit der Maus", "Auch mit der Tastatur", "Nur per Sprache"], 1, "Tastaturbedienung ist eine Grundlage der Barrierefreiheit."]);
W("p2-8",
 ["Was gehört in den footer einer Vereinsseite?", ["Impressum und Kontaktwege", "Die Hauptüberschrift", "Ein Video im Autoplay"], 0, "Rechtliche Angaben und Kontakt stehen üblicherweise unten."],
 ["Wie prüfst du schnell die Handyansicht am PC?", ["Mit der Geräteansicht der Entwicklerwerkzeuge", "Durch Drucken", "Gar nicht"], 0, "Die Entwicklerwerkzeuge des Browsers simulieren kleine Bildschirme."]);

/* ---------- JavaScript Grundlagen ---------- */
W("p3-1",
 ["Was ist `typeof true`?", ["`'string'`", "`'boolean'`", "`'number'`"], 1, "true und false sind Wahrheitswerte vom Typ boolean."],
 ["Was ergibt `Number('7') + 1`?", ["`8`", "`'71'`", "`NaN`"], 0, "Number wandelt den Text in die Zahl 7 um."]);
W("p3-2",
 ["Was liefert `['a','b','c'][2]`?", ["`'b'`", "`'c'`", "`undefined`"], 1, "Die Zählung beginnt bei 0, Index 2 ist der dritte Eintrag."],
 ["Was macht `pop()` bei einem Array?", ["Entfernt den letzten Eintrag", "Fügt vorne etwas ein", "Sortiert das Array"], 0, "pop nimmt das letzte Element heraus und gibt es zurück."]);
W("p3-3",
 ["Wie oft läuft `for (let i = 1; i <= 3; i++)`?", ["2-mal", "3-mal", "4-mal"], 1, "i nimmt die Werte 1, 2 und 3 an."],
 ["Was beendet eine Schleife sofort?", ["`break`", "`stop`", "`end`"], 0, "break verlässt die Schleife."]);
W("p3-4",
 ["Was liefert eine Funktion ohne `return`?", ["`0`", "`undefined`", "Einen Fehler"], 1, "Ohne return ist das Ergebnis undefined."],
 ["Wie schreibt man eine Pfeilfunktion, die eine Zahl verdoppelt?", ["`const d = x => x * 2;`", "`const d = x -> x * 2;`", "`function => x * 2`"], 0, "Die Pfeilfunktion nutzt =>."]);
W("p3-5",
 ["Wie fügst du einem Objekt `person` die Eigenschaft alter hinzu?", ["`person.alter = 30;`", "`person(alter) = 30;`", "`add person alter`"], 0, "Mit Punkt-Schreibweise kannst du Eigenschaften setzen."],
 ["Wie liest man eine Eigenschaft, deren Name in einer Variablen steht?", ["`obj[name]`", "`obj.name()`", "`obj->name`"], 0, "Eckige Klammern werten den Variableninhalt als Eigenschaftsnamen."]);
W("p3-6",
 ["Welche Methode findet alle Elemente mit der Klasse karte?", ["`querySelectorAll('.karte')`", "`querySelector('karte')`", "`getAll('.karte')`"], 0, "querySelectorAll liefert alle Treffer als Liste."],
 ["Warum ist `innerHTML` mit fremden Texten riskant?", ["Weil HTML darin ausgeführt werden kann", "Weil es langsamer zählt", "Weil es keine Texte kann"], 0, "Fremde Inhalte gehören mit textContent in die Seite."]);
W("p3-7",
 ["Welches Ereignis passt, wenn jemand in ein Textfeld tippt?", ["`input`", "`load`", "`scroll`"], 0, "input wird bei jeder Änderung des Feldes ausgelöst."],
 ["Wozu dient `event.preventDefault()` bei einem Formular?", ["Es verhindert das Neuladen der Seite beim Absenden", "Es löscht das Formular", "Es macht das Formular rot"], 0, "So kann JavaScript die Daten selbst verarbeiten."]);
W("p3-8",
 ["Wo siehst du `console.log`-Ausgaben?", ["In der Konsole der Entwicklerwerkzeuge", "Auf dem Drucker", "Im Seitentitel"], 0, "Die Konsole öffnest du meist mit F12."],
 ["Was bedeutet `ReferenceError: x is not defined`?", ["Die Variable x gibt es an dieser Stelle nicht", "x ist zu groß", "x ist eine Zahl"], 0, "Prüfe Schreibweise und ob x vorher deklariert wurde."]);
W("p3-9",
 ["Warum leerst du das Eingabefeld nach dem Hinzufügen?", ["Damit die nächste Aufgabe direkt eingegeben werden kann", "Weil sonst die Liste gelöscht wird", "Das ist verboten"], 0, "Das ist bequemer und verhindert doppelte Einträge."],
 ["Welche Methode hängt ein neues li an die Liste an?", ["`liste.appendChild(li)`", "`liste.push(li)`", "`li.add(liste)`"], 0, "appendChild fügt ein Element als letztes Kind ein."]);

/* ---------- JavaScript Aufbau ---------- */
W("p4-1",
 ["Was ergibt `[1, 2, 3].map(x => x * 10)`?", ["`[10, 20, 30]`", "`60`", "`[1, 2, 3]`"], 0, "map wendet die Funktion auf jeden Eintrag an."],
 ["Wie viele Einträge hat das Ergebnis von map im Vergleich zum Original?", ["Genauso viele", "Immer weniger", "Immer einen mehr"], 0, "map formt jeden Eintrag um, entfernt aber keinen."]);
W("p4-2",
 ["Was ergibt `[3, 8, 1].filter(x => x > 2)`?", ["`[3, 8]`", "`[8]`", "`true`"], 0, "filter behält alle Einträge, für die die Bedingung wahr ist."],
 ["Was liefert filter, wenn kein Eintrag passt?", ["Ein leeres Array", "`null`", "Einen Fehler"], 0, "Das Ergebnis ist dann `[]`."]);
W("p4-3",
 ["Was ergibt `[2, 3, 4].reduce((s, x) => s + x, 0)`?", ["`9`", "`24`", "`234`"], 0, "Die Summe ist 0 + 2 + 3 + 4 = 9."],
 ["Was passiert bei reduce auf einer leeren Liste ohne Startwert?", ["Es gibt einen Fehler", "Es ergibt 0", "Es ergibt undefined ohne Fehler"], 0, "Ohne Startwert wirft reduce bei leeren Arrays einen TypeError."]);
W("p4-4",
 ["Welcher Text ist gültiges JSON?", ["`{name: 'Ali'}`", "`{\"name\": \"Ali\"}`", "`{'name': \"Ali\"}`"], 1, "JSON verlangt doppelte Anführungszeichen um Namen und Texte."],
 ["Was passiert bei `JSON.parse('kein json')`?", ["Es wird ein Fehler geworfen", "Es ergibt einen leeren Text", "Es ergibt null"], 0, "Ungültiger Text löst einen SyntaxError aus; fange ihn mit try/catch ab."]);
W("p4-5",
 ["Welchen Typ speichert localStorage?", ["Nur Text", "Beliebige Objekte direkt", "Nur Zahlen"], 0, "Objekte wandelst du vorher mit JSON.stringify in Text um."],
 ["Was macht `localStorage.setItem('thema', 'dunkel')`?", ["Speichert den Wert unter dem Schlüssel thema", "Löscht thema", "Liest thema"], 0, "setItem legt einen Wert unter einem Schlüssel ab."]);
W("p4-6",
 ["Wie importierst du `addiere` aus `./mathe.mjs`?", ["`import { addiere } from './mathe.mjs';`", "`require addiere`", "`include './mathe.mjs'`"], 0, "Benannte Exporte importiert man mit geschweiften Klammern."],
 ["Was ist ein Vorteil von Modulen?", ["Code ist nach Aufgaben getrennt und wiederverwendbar", "Die Seite braucht kein HTML mehr", "Fehler verschwinden automatisch"], 0, "Jedes Modul hat seinen eigenen Bereich und klare Exporte."]);
W("p4-7",
 ["Wie liest man den JSON-Inhalt einer fetch-Antwort?", ["`await antwort.json()`", "`antwort.text`", "`JSON(antwort)`"], 0, "json() liest den Inhalt und wandelt ihn um; es liefert ein Promise."],
 ["Was bedeutet Statuscode 404?", ["Die Datei wurde nicht gefunden", "Alles in Ordnung", "Der Server ist überlastet"], 0, "404 heißt: Die angefragte Ressource existiert nicht."]);
W("p4-8",
 ["Wann läuft der finally-Block?", ["Immer, mit oder ohne Fehler", "Nur bei Fehlern", "Nie"], 0, "finally eignet sich zum Aufräumen, z. B. einen Ladehinweis entfernen."],
 ["Was sollte eine Quiz-App nach einer falschen Antwort tun?", ["Eine verständliche Rückmeldung zeigen", "Die Seite schließen", "Alle Punkte löschen"], 0, "Klare Rückmeldungen helfen beim Lernen."]);

/* ---------- Saubere Web-Apps ---------- */
W("p5-1",
 ["Was macht eine reine Funktion aus?", ["Gleiche Eingabe ergibt gleiches Ergebnis, ohne Nebenwirkungen", "Sie ändert immer das DOM", "Sie hat keinen Namen"], 0, "Reine Funktionen sind vorhersehbar und leicht zu testen."],
 ["Warum trennt man Daten-Logik und Anzeige?", ["Man kann beides unabhängig ändern und testen", "Damit die Seite größer wird", "Weil Browser es verlangen"], 0, "Klare Aufgaben pro Datei machen Projekte wartbar."]);
W("p5-2",
 ["Ein Nutzer gibt `<b>Hi</b>` ein. Wie zeigt textContent das an?", ["Als normalen Text mit spitzen Klammern", "Fett gedruckt", "Gar nicht"], 0, "textContent interpretiert kein HTML."],
 ["Was ist eine sinnvolle Plausibilitätsprüfung für ein Alter?", ["Ganze Zahl zwischen 0 und 130", "Beliebiger Text", "Nur negative Zahlen"], 0, "Plausible Grenzen fangen Tippfehler früh ab."]);
W("p5-3",
 ["Warum misst man vor einer Optimierung?", ["Um zu wissen, ob es überhaupt ein Problem gibt und ob es besser wird", "Weil Messen die Seite schneller macht", "Das ist unnötig"], 0, "Ohne Messung weiß man nicht, ob eine Änderung hilft."],
 ["Was ist meist schneller: 100 Elemente einzeln einfügen oder gesammelt in einem Schritt?", ["Gesammelt in einem Schritt", "Einzeln", "Beides gleich, immer"], 0, "Weniger DOM-Änderungen bedeuten weniger Arbeit für den Browser."]);
W("p5-4",
 ["Was prüft ein guter Test zusätzlich zum Normalfall?", ["Randfälle wie leere Eingaben", "Nur die Farbe", "Nichts weiter"], 0, "Fehler verstecken sich oft in Sonderfällen."],
 ["Was bedeutet ein grüner Testlauf?", ["Alle geprüften Erwartungen sind erfüllt", "Der Code ist fehlerfrei in jeder Hinsicht", "Tests wurden übersprungen"], 0, "Tests prüfen nur, was sie abdecken."]);
W("p5-5",
 ["Was macht `git commit`?", ["Speichert die gestagten Änderungen als neuen Stand", "Lädt auf GitHub hoch", "Löscht Dateien"], 0, "Erst git push überträgt Commits zu GitHub."],
 ["Was zeigt `git diff`?", ["Die Unterschiede zwischen Dateien und dem letzten Stand", "Die Liste aller Branches", "Den Benutzernamen"], 0, "So prüfst du Änderungen vor dem Commit."]);
W("p5-6",
 ["Warum arbeitet man nicht direkt im main-Branch?", ["Damit Änderungen erst geprüft werden können", "Weil main schreibgeschützt ist", "Weil Branches schneller laden"], 0, "Ein Feature-Branch trennt unfertige Arbeit vom stabilen Stand."],
 ["Was passiert beim Merge eines Pull Requests?", ["Die Änderungen werden in den Zielbranch übernommen", "Der Branch wird auf GitHub verborgen", "Alle Tests werden gelöscht"], 0, "Nach dem Merge ist die Arbeit Teil des Zielbranches."]);
W("p5-7",
 ["Wie findest du fehlende Dateien nach dem Veröffentlichen?", ["In der Netzwerk-Ansicht der Entwicklerwerkzeuge", "Am Monitor-Rand", "Gar nicht"], 0, "Dort sieht man Anfragen mit Status 404."],
 ["Warum ist HTTPS wichtig?", ["Es verschlüsselt die Verbindung zwischen Browser und Server", "Es macht Bilder schärfer", "Es ersetzt Tests"], 0, "HTTPS schützt Daten auf dem Übertragungsweg."]);
W("p5-8",
 ["Was hilft Vorleseprogrammen bei einem Eingabefeld?", ["Ein verbundenes label", "Eine graue Farbe", "Ein Bild ohne Text"], 0, "Das label nennt den Zweck des Feldes."],
 ["Was gehört zu einem barrierearmen Abschluss-Test?", ["Bedienung nur mit der Tastatur ausprobieren", "Nur die Optik am PC prüfen", "Nichts"], 0, "Tastaturtests decken viele Bedienprobleme auf."]);

/* ---------- Python für Einsteiger ---------- */
W("ps-1",
 ["Was gibt `print(2 + 3)` aus?", ["`5`", "`2 + 3`", "`23`"], 0, "Ohne Anführungszeichen rechnet Python den Ausdruck aus."],
 ["Was gibt `print(\"2 + 3\")` aus?", ["`5`", "`2 + 3`", "Einen Fehler"], 1, "In Anführungszeichen ist es Text und wird genau so ausgegeben."]);
W("ps-2",
 ["Was ergibt `7 // 2` in Python?", ["`3`", "`3.5`", "`4`"], 0, "// teilt ganzzahlig und schneidet den Rest ab."],
 ["Was ergibt `7 % 2`?", ["`1`", "`3`", "`0`"], 0, "% liefert den Rest der Division."]);
W("ps-3",
 ["Was passiert bei `int(\"12\") + 1`?", ["Ergibt 13", "Ergibt \"121\"", "Fehler"], 0, "int wandelt den Text in eine Zahl um."],
 ["Was passiert bei `\"12\" + 1`?", ["Ergibt 13", "TypeError, weil Text und Zahl gemischt werden", "Ergibt \"121\""], 1, "Python verbindet Text und Zahl nicht automatisch."]);
W("ps-4",
 ["Wofür steht `elif`?", ["sonst wenn", "Ende", "Schleife"], 0, "elif prüft eine weitere Bedingung, wenn die vorherige falsch war."],
 ["Was gibt `print(5 > 3 and 2 > 4)` aus?", ["`True`", "`False`", "`5`"], 1, "and ist nur wahr, wenn beide Seiten wahr sind."]);
W("ps-5",
 ["Wie oft läuft `for i in range(1, 4):`?", ["3-mal", "4-mal", "1-mal"], 0, "i ist 1, 2 und 3; das Ende 4 ist nicht dabei."],
 ["Was passiert, wenn die Bedingung einer while-Schleife nie falsch wird?", ["Eine Endlosschleife", "Sie läuft genau einmal", "Python überspringt sie"], 0, "Die Bedingung muss sich irgendwann ändern."]);
W("ps-6",
 ["Was liefert `[3, 5, 7][-1]`?", ["`7`", "`3`", "Fehler"], 0, "Index -1 ist der letzte Eintrag."],
 ["Was ergibt `sum([2, 4, 6])`?", ["`12`", "`246`", "`3`"], 0, "sum addiert alle Zahlen einer Liste."]);
W("ps-7",
 ["Was gibt diese Funktion zurück: `def f(x): return x * 3` bei `f(2)`?", ["`6`", "`5`", "`23`"], 0, "2 * 3 = 6."],
 ["Was ist der Unterschied zwischen print und return in einer Funktion?", ["print zeigt an, return gibt einen Wert an den Aufrufer zurück", "Kein Unterschied", "return zeigt Text farbig an"], 0, "Mit dem zurückgegebenen Wert kann man weiterrechnen."]);
W("ps-8",
 ["Welche Funktion liefert eine Zufallszahl von 1 bis 10?", ["`random.randint(1, 10)`", "`random(10)`", "`rand(1-10)`"], 0, "randint schließt beide Grenzen ein; vorher `import random`."],
 ["Warum testet man das Spiel auch mit falschen Tipps?", ["Damit Hinweise wie „zu groß“ und „zu klein“ geprüft werden", "Weil richtige Tipps verboten sind", "Das ist unnötig"], 0, "Gute Tests prüfen alle Wege durch das Programm."]);

/* ---------- Python Aufbau ---------- */
W("pa-1",
 ["Wie fügst du einem Dictionary `d` den Schlüssel \"ort\" mit \"Bonn\" hinzu?", ["`d[\"ort\"] = \"Bonn\"`", "`d.add(\"ort\")`", "`d + \"Bonn\"`"], 0, "Eine Zuweisung mit eckigen Klammern legt den Eintrag an."],
 ["Was liefert `len({\"a\": 1, \"b\": 2})`?", ["`2`", "`4`", "`1`"], 0, "len zählt die Schlüssel."]);
W("pa-2",
 ["Was ergibt `\"hallo\".upper()`?", ["`\"HALLO\"`", "`\"Hallo\"`", "`\"hallo\"`"], 0, "upper liefert einen neuen Text in Großbuchstaben."],
 ["Was ergibt `\"-\".join([\"a\", \"b\"])`?", ["`\"a-b\"`", "`[\"a-b\"]`", "`\"ab-\"`"], 0, "join verbindet Listenelemente mit dem Trennzeichen."]);
W("pa-3",
 ["Welcher Fehler entsteht bei `10 / 0`?", ["`ZeroDivisionError`", "`ValueError`", "Kein Fehler"], 0, "Durch null zu teilen ist nicht erlaubt."],
 ["Was gehört in einen except-Block für Benutzereingaben?", ["Eine verständliche Meldung, was einzugeben ist", "Nichts, einfach weiter", "Das Programm löschen"], 0, "Der Nutzer soll wissen, wie er es richtig macht."]);
W("pa-4",
 ["Was macht der Modus \"w\" beim Öffnen einer vorhandenen Datei?", ["Er überschreibt den Inhalt", "Er hängt an", "Er liest nur"], 0, "w beginnt mit einer leeren Datei."],
 ["Wie liest man eine Datei Zeile für Zeile?", ["`for zeile in f:`", "`f.zeilen()`", "`while f:`"], 0, "Eine geöffnete Datei kann man direkt in einer for-Schleife durchlaufen."]);
W("pa-5",
 ["Was macht `from math import pi`?", ["Holt nur pi aus dem Modul math", "Löscht pi", "Installiert math neu"], 0, "Danach kann man pi ohne `math.` verwenden."],
 ["Welches Modul hilft beim Arbeiten mit Datum und Uhrzeit?", ["`datetime`", "`timeclock`", "`calendarx`"], 0, "datetime gehört zur Standardbibliothek."]);
W("pa-6",
 ["Wie erzeugt man ein Objekt der Klasse Hund?", ["`h = Hund()`", "`h = new Hund`", "`h = class Hund`"], 0, "Python braucht kein new."],
 ["Was ist eine Methode?", ["Eine Funktion, die zu einer Klasse gehört", "Eine Variable ohne Wert", "Ein Dateiname"], 0, "Methoden beschreiben das Verhalten von Objekten."]);
W("pa-7",
 ["Was ergibt `[x for x in range(5) if x % 2 == 0]`?", ["`[0, 2, 4]`", "`[1, 3]`", "`[0, 1, 2, 3, 4]`"], 0, "Nur gerade Zahlen erfüllen die Bedingung."],
 ["Wie sortierst du absteigend?", ["`sorted(liste, reverse=True)`", "`sorted(liste, down=True)`", "`liste.reverse_sort()`"], 0, "reverse=True dreht die Reihenfolge um."]);
W("pa-8",
 ["Was macht `json.dump(daten, f)`?", ["Schreibt die Daten als JSON in die Datei f", "Liest JSON aus f", "Löscht f"], 0, "dump schreibt in eine Datei, dumps erzeugt Text."],
 ["Was solltest du tun, wenn die JSON-Datei beim ersten Start fehlt?", ["Mit einer leeren Liste beginnen", "Das Programm abbrechen", "Zufällige Daten erfinden"], 0, "Ein sinnvoller Startwert macht das Programm robust."]);

/* ---------- KI mit Python ---------- */
W("ki-1",
 ["Was braucht maschinelles Lernen vor allem?", ["Beispieldaten", "Einen großen Bildschirm", "Eine Internetseite"], 0, "Ein Modell lernt Muster aus Beispielen."],
 ["Wer trägt die Verantwortung für Entscheidungen mit KI?", ["Die Menschen, die sie einsetzen", "Die KI selbst", "Niemand"], 0, "KI ist ein Werkzeug; Menschen setzen Ziele und prüfen Ergebnisse."]);
W("ki-2",
 ["Was ist der Median von 1, 3, 100?", ["`3`", "`34,67`", "`100`"], 0, "Der Median ist der mittlere Wert der sortierten Liste."],
 ["Warum ist der Median bei Ausreißern oft aussagekräftiger als der Mittelwert?", ["Ein einzelner extremer Wert verschiebt ihn kaum", "Er ist immer größer", "Er nutzt keine Daten"], 0, "Ausreißer ziehen den Mittelwert stark, den Median kaum."]);
W("ki-3",
 ["Wofür steht b in `a * x + b`?", ["Den Wert bei x = 0 (Achsenabschnitt)", "Die Steigung", "Die Anzahl der Daten"], 0, "b verschiebt die Gerade nach oben oder unten."],
 ["Mehr Eis wird verkauft, wenn es mehr Sonnenbrände gibt. Was folgt daraus?", ["Ein Zusammenhang, aber keine Ursache – beides hängt am Wetter", "Eis verursacht Sonnenbrand", "Sonnenbrand verursacht Eiskauf"], 0, "Korrelation ist nicht Kausalität."]);
W("ki-4",
 ["Warum teilt man Daten in Training und Test?", ["Um zu prüfen, wie gut das Modell bei neuen Daten ist", "Damit es schneller rechnet", "Weil zu viele Daten verboten sind"], 0, "Testdaten zeigen, ob das Modell verallgemeinert."],
 ["Was bedeutet Überanpassung (Overfitting)?", ["Das Modell lernt die Trainingsdaten auswendig und versagt bei neuen", "Das Modell ist zu einfach", "Die Daten sind zu sauber"], 0, "Dann sind Trainingsfehler klein, Testfehler aber groß."]);
W("ki-5",
 ["Was passiert bei k-nächste Nachbarn mit k = 1?", ["Der einzige nächste Nachbar entscheidet", "Alle Punkte entscheiden", "Es wird zufällig entschieden"], 0, "Mit k = 1 zählt nur der allernächste Punkt."],
 ["Warum skaliert man Merkmale wie Größe in cm und Gewicht in kg?", ["Damit kein Merkmal den Abstand nur wegen seiner Einheit dominiert", "Damit die Zahlen schöner aussehen", "Das ist nie nötig"], 0, "Abstände sind nur fair, wenn die Größenordnungen vergleichbar sind."]);
W("ki-6",
 ["Was ist ein Gewicht in einem künstlichen Neuron?", ["Eine Zahl, die angibt, wie stark eine Eingabe zählt", "Die Masse des Computers", "Ein Dateiname"], 0, "Lernen bedeutet, diese Zahlen anzupassen."],
 ["Was passiert mit den Gewichten bei einer falschen Antwort?", ["Sie werden in Richtung der richtigen Antwort angepasst", "Sie werden gelöscht", "Nichts"], 0, "So wird der Fehler beim nächsten Mal kleiner."]);
W("ki-7",
 ["Was ergibt `np.array([1, 2, 3]) * 2`?", ["`[2, 4, 6]`", "`[1, 2, 3, 1, 2, 3]`", "Fehler"], 0, "NumPy rechnet elementweise."],
 ["Was ergibt `np.dot([1, 2], [3, 4])`?", ["`11`", "`[3, 8]`", "`10`"], 0, "1·3 + 2·4 = 11."]);
W("ki-8",
 ["Was ist ein Token in einem Sprachmodell?", ["Ein Wort oder Wortteil, mit dem das Modell rechnet", "Ein Passwort", "Eine Grafikkarte"], 0, "Texte werden in Tokens zerlegt und vorhergesagt."],
 ["Wie gehst du mit einer überzeugend klingenden KI-Antwort um?", ["Wichtige Angaben mit verlässlichen Quellen prüfen", "Immer glauben", "Nie lesen"], 0, "Sprachmodelle können Falsches flüssig formulieren."]);

/* ---------- C++ für Einsteiger ---------- */
W("cs-1",
 ["Welche Datei bindet `std::cout` ein?", ["`#include <iostream>`", "`#include <math>`", "`import cout`"], 0, "iostream stellt Ein- und Ausgabe bereit."],
 ["Was liefert `return 0;` am Ende von main?", ["Das Programm endete ohne Fehler", "Es gibt 0 auf dem Bildschirm aus", "Es startet neu"], 0, "0 meldet dem Betriebssystem einen erfolgreichen Ablauf."]);
W("cs-2",
 ["Welcher Typ speichert ein einzelnes Zeichen?", ["`char`", "`int`", "`bool`"], 0, "char speichert ein Zeichen wie 'A'."],
 ["Was ergibt `9.0 / 2` in C++?", ["`4.5`", "`4`", "`5`"], 0, "Ist eine Zahl eine Kommazahl, wird mit Komma gerechnet."]);
W("cs-3",
 ["Was gibt `std::cout << \"A\" << 1;` aus?", ["`A1`", "`A 1`", "Fehler"], 0, "Die Teile werden direkt hintereinander ausgegeben."],
 ["Was passiert, wenn bei `int x; std::cin >> x;` Buchstaben eingegeben werden?", ["Das Einlesen schlägt fehl", "x wird automatisch zu Text", "Das Programm rechnet weiter wie gewohnt"], 0, "Prüfe Eingaben, z. B. mit `if (!(std::cin >> x))`."]);
W("cs-4",
 ["Was bedeutet `||`?", ["oder", "und", "nicht"], 0, "|| ist wahr, wenn mindestens eine Seite wahr ist."],
 ["Was bedeutet `!fertig`?", ["nicht fertig", "fertig", "sehr fertig"], 0, "! kehrt einen Wahrheitswert um."]);
W("cs-5",
 ["Wie oft läuft `for (int i = 0; i < 5; ++i)`?", ["5-mal", "4-mal", "6-mal"], 0, "i nimmt die Werte 0 bis 4 an."],
 ["Was macht `continue` in einer Schleife?", ["Springt zum nächsten Durchlauf", "Beendet das Programm", "Wiederholt den Durchlauf"], 0, "Der Rest des aktuellen Durchlaufs wird übersprungen."]);
W("cs-6",
 ["Wie sieht der Kopf einer Funktion aus, die zwei int addiert?", ["`int summe(int a, int b)`", "`summe(a, b)`", "`function summe(a, b)`"], 0, "In C++ haben Rückgabe und Parameter feste Typen."],
 ["Was passiert mit einem int-Parameter, den die Funktion ändert?", ["Nur die Kopie in der Funktion ändert sich", "Das Original ändert sich", "Es gibt immer einen Fehler"], 0, "Ohne & wird der Wert kopiert."]);
W("cs-7",
 ["Wie liest man den ersten Eintrag eines vectors v?", ["`v[0]`", "`v[1]`", "`v.first`"], 0, "Die Zählung beginnt bei 0."],
 ["Wie durchläuft man alle Einträge bequem?", ["`for (int x : v)`", "`for x in v`", "`foreach v`"], 0, "Die bereichsbasierte for-Schleife geht jeden Eintrag durch."]);
W("cs-8",
 ["Wie berechnet man den Durchschnitt aus Summe und Anzahl?", ["Summe geteilt durch Anzahl", "Anzahl geteilt durch Summe", "Summe mal Anzahl"], 0, "Achte auf Kommazahlen, z. B. mit double."],
 ["Was sollte bei Anzahl 0 passieren?", ["Eine Meldung statt Division durch null", "Weiterrechnen", "Zufällige Note ausgeben"], 0, "Sonderfälle müssen abgefangen werden."]);

/* ---------- C++ für Spiele ---------- */
W("cg-1",
 ["Wie legt man einen Spieler mit struct an?", ["`Spieler s{\"Ana\", 100};`", "`Spieler = new struct`", "`struct s = Spieler`"], 0, "Mit geschweiften Klammern werden die Felder der Reihe nach gefüllt."],
 ["Was ist ein Vorteil von struct gegenüber vielen Einzelvariablen?", ["Zusammengehörige Werte bleiben zusammen", "Das Programm braucht kein main", "Es ist immer schneller"], 0, "Ein struct beschreibt ein Ganzes, z. B. eine Spielfigur."]);
W("cg-2",
 ["Was ist eine Klasse?", ["Ein Bauplan für Objekte mit Daten und Methoden", "Eine Datei", "Eine Schleife"], 0, "Objekte werden nach diesem Bauplan erzeugt."],
 ["Warum macht man Lebenspunkte private?", ["Damit sie nur über Regeln (Methoden) geändert werden", "Damit sie schneller sind", "Weil public verboten ist"], 0, "So kann niemand versehentlich ungültige Werte setzen."]);
W("cg-3",
 ["Was passiert im Schritt „Aktualisieren“ der Spielschleife?", ["Der Spielzustand wird nach den Regeln verändert", "Das Bild wird gezeichnet", "Die Tastatur wird abgeschaltet"], 0, "Zuerst Eingabe lesen, dann aktualisieren, dann darstellen."],
 ["Warum misst man die Zeit zwischen zwei Bildern?", ["Damit Bewegung auf schnellen und langsamen Geräten gleich schnell wirkt", "Für die Uhrzeitanzeige", "Das ist unnötig"], 0, "Bewegung = Geschwindigkeit mal vergangene Zeit."]);
W("cg-4",
 ["Welche Verteilung liefert faire Würfelwerte von 1 bis 6?", ["`std::uniform_int_distribution<int>(1, 6)`", "`rand() % 7`", "`std::random(6)`"], 0, "Eine gleichverteilte Ganzzahl-Verteilung ist fair."],
 ["Warum sollte man den Zufallsgenerator nicht in jeder Runde neu erzeugen?", ["Die Werte können sich wiederholen und es kostet Zeit", "Weil es verboten ist", "Weil er dann rot wird"], 0, "Einmal erzeugen und weiterverwenden."]);
W("cg-5",
 ["Zwei Rechtecke berühren sich auf der x-Achse, aber nicht auf der y-Achse. Kollidieren sie?", ["Nein", "Ja", "Nur manchmal"], 0, "Für AABB muss es auf beiden Achsen eine Überschneidung geben."],
 ["Warum nutzen Spiele oft einfache Hitboxen?", ["Sie sind schnell zu prüfen", "Sie sehen schöner aus", "Sie sind pixelgenau"], 0, "Pixelgenaue Prüfungen sind viel aufwendiger."]);
W("cg-6",
 ["Was bedeutet `nullptr`?", ["Der Zeiger zeigt auf nichts", "Die Zahl 0 als Text", "Ein gelöschtes Programm"], 0, "Vor der Nutzung eines Zeigers prüft man, ob er nullptr ist."],
 ["Wann ist eine Referenz `const&` sinnvoll?", ["Für große Werte, die nur gelesen werden", "Wenn der Wert geändert werden soll", "Nie"], 0, "So wird nichts kopiert und nichts verändert."]);

/* ---------- Rust für Einsteiger ---------- */
W("rs-1",
 ["Mit welchem Befehl startet man ein neues Rust-Projekt?", ["`cargo new projekt`", "`rust start projekt`", "`npm init`"], 0, "Cargo ist das Bau- und Paketwerkzeug von Rust."],
 ["Wie führt man ein Projekt mit Cargo aus?", ["`cargo run`", "`cargo play`", "`run rust`"], 0, "cargo run übersetzt und startet das Programm."]);
W("rs-2",
 ["Was passiert bei `let x = 5; x = 6;`?", ["Ein Kompilierfehler, weil x nicht mut ist", "x wird 6", "x wird 11"], 0, "Variablen sind in Rust standardmäßig unveränderlich."],
 ["Welcher Typ ist ein Wahrheitswert?", ["`bool`", "`i32`", "`str`"], 0, "bool kennt true und false."]);
W("rs-3",
 ["Was enthält `0..3`?", ["0, 1, 2", "0, 1, 2, 3", "1, 2, 3"], 0, "Bei .. ist das Ende ausgeschlossen."],
 ["Was liefert `let x = if a > b { a } else { b };`?", ["Den größeren Wert", "Immer a", "Einen Fehler"], 0, "if ist in Rust ein Ausdruck mit Wert."]);
W("rs-4",
 ["Wie lautet der Kopf einer Funktion, die zwei i32 addiert?", ["`fn add(a: i32, b: i32) -> i32`", "`function add(a, b)`", "`fn add(a, b): i32`"], 0, "Parameter und Rückgabe haben Typen; -> nennt den Rückgabetyp."],
 ["Was passiert, wenn man `a + b;` mit Semikolon als letzte Zeile schreibt?", ["Es wird nichts zurückgegeben (Typfehler bei -> i32)", "Es wird a + b zurückgegeben", "Das Programm wird schneller"], 0, "Mit Semikolon wird der Ausdruck zur Anweisung ohne Wert."]);
W("rs-5",
 ["Was passiert bei `let a = String::from(\"hi\"); let b = a;` mit a?", ["a ist danach nicht mehr nutzbar (verschoben)", "a und b sind beide gültig", "a wird gelöscht und b auch"], 0, "Der Besitz wandert zu b."],
 ["Wie viele veränderbare Ausleihen (&mut) darf es gleichzeitig geben?", ["Eine", "Beliebig viele", "Zwei"], 0, "Das verhindert gleichzeitige widersprüchliche Änderungen."]);
W("rs-6",
 ["Wo schreibt man Methoden für ein struct?", ["In einem `impl`-Block", "Im struct selbst", "In main"], 0, "impl verbindet Verhalten mit dem struct."],
 ["Wie greift man in einer Methode auf das Feld name zu?", ["`self.name`", "`this.name`", "`name()`"], 0, "self ist das Objekt selbst."]);
W("rs-7",
 ["Welche zwei Varianten hat `Option`?", ["`Some` und `None`", "`Ok` und `Err`", "`Yes` und `No`"], 0, "Option zeigt, ob ein Wert vorhanden ist."],
 ["Was macht `_` in einem match?", ["Fängt alle übrigen Fälle ab", "Beendet das Programm", "Ist ein Fehler"], 0, "Der Unterstrich passt auf alles, was nicht vorher genannt wurde."]);
W("rs-8",
 ["Was enthält `Err` in einem Result?", ["Die Fehlerbeschreibung", "Das Ergebnis bei Erfolg", "Immer eine Zahl"], 0, "Ok trägt den Erfolgswert, Err den Fehler."],
 ["Wie wandelt man einen Text in eine Zahl mit Fehlerbehandlung um?", ["`text.trim().parse::<i32>()`", "`int(text)`", "`text as number`"], 0, "parse liefert ein Result, das man mit match oder ? behandelt."]);

/* ---------- Computer & Internet ---------- */
W("d-1",
 ["Was ist ein Passwort-Manager?", ["Ein Programm, das viele sichere Passwörter geschützt speichert", "Ein Notizzettel am Bildschirm", "Ein Virus"], 0, "Du musst dir dann nur noch ein starkes Hauptpasswort merken."],
 ["Welches Passwort ist am stärksten?", ["`Hund2024`", "Eine lange Folge aus mehreren zufälligen Wörtern", "`123456`"], 1, "Länge und Zufall machen Passwörter schwer zu erraten."]);
W("d-2",
 ["Was solltest du mit einem verdächtigen Link tun?", ["Nicht anklicken und die Seite selbst über eine bekannte Adresse öffnen", "Sofort anklicken", "An alle weiterleiten"], 0, "So landest du sicher auf der echten Seite."],
 ["Was verlangen echte Banken niemals per E-Mail?", ["Dein Passwort oder deine TAN", "Deinen Namen in der Anrede", "Nichts davon"], 0, "Geheime Zugangsdaten fragt keine seriöse Bank so ab."]);
W("d-3",
 ["Was passiert beim Verschieben einer Datei in einen anderen Ordner?", ["Sie ist danach nur noch am neuen Ort", "Es entsteht eine Kopie", "Sie wird gelöscht"], 0, "Beim Kopieren bleibt das Original, beim Verschieben nicht."],
 ["Warum hilft eine feste Ordnerstruktur?", ["Dateien sind schneller wiederzufinden", "Der Computer wird größer", "Sie ersetzt ein Backup"], 0, "Ordnung spart Suchzeit, ersetzt aber keine Sicherung."]);
W("d-4",
 ["Warum installiert man Sicherheitsupdates zeitnah?", ["Sie schließen bekannte Lücken", "Sie machen den Bildschirm heller", "Sie löschen alte Fotos"], 0, "Angreifer nutzen bekannte, ungepatchte Lücken."],
 ["Ein Pop-up auf einer Webseite fordert ein „dringendes Update“. Was tun?", ["Nicht klicken und Updates nur über die Systemeinstellungen holen", "Sofort installieren", "Den Computer verkaufen"], 0, "Gefälschte Update-Hinweise verbreiten oft Schadsoftware."]);
W("d-5",
 ["Was macht ein Doppelklick auf ein Symbol meistens?", ["Öffnet die Datei oder das Programm", "Löscht es", "Druckt es"], 0, "Ein Klick markiert, ein Doppelklick öffnet."],
 ["Wozu dient der Monitor?", ["Er zeigt das Bild an", "Er speichert Dateien", "Er druckt"], 0, "Der Monitor ist ein Ausgabegerät."]);
W("d-6",
 ["Welche Tastenkombination kopiert markierten Text unter Windows?", ["Strg+C", "Strg+V", "Strg+P"], 0, "Strg+C kopiert, Strg+V fügt ein."],
 ["Wie schreibt man das @-Zeichen auf einer deutschen Windows-Tastatur?", ["AltGr+Q", "Shift+2", "Strg+A"], 0, "Auf deutschen Tastaturen liegt @ auf AltGr+Q."]);
W("d-7",
 ["Was ist der Name eines WLANs?", ["Die SSID", "Die IP-Adresse", "Das Passwort"], 0, "Die SSID ist der angezeigte Netzwerkname."],
 ["Was hilft oft, wenn das WLAN zu Hause nicht geht?", ["Router kurz neu starten", "Den Monitor wechseln", "Die Tastatur reinigen"], 0, "Ein Neustart behebt viele vorübergehende Störungen."]);
W("d-8",
 ["Welche Dateiendung ist bei unerwarteten Downloads besonders riskant?", ["`.exe`", "`.txt`", "`.jpg`"], 0, ".exe-Dateien sind Programme und können Schaden anrichten."],
 ["Wie findest du einen Download schnell wieder?", ["Über die Download-Liste des Browsers", "Durch Neustart", "Gar nicht"], 0, "Der Browser zeigt alle Downloads mit Speicherort."]);

/* ---------- Internet & E-Mail ---------- */
W("c2-1",
 ["Wo gibt man eine Webadresse ein?", ["In die Adressleiste", "In das Suchfeld einer fremden Seite", "In die Taskleiste"], 0, "Die Adressleiste oben im Browser führt direkt zur Seite."],
 ["Was macht der Zurück-Pfeil im Browser?", ["Öffnet die vorher besuchte Seite", "Schließt den Browser", "Löscht den Verlauf"], 0, "Er geht im Verlauf einen Schritt zurück."]);
W("c2-2",
 ["Was bewirken Anführungszeichen in einer Suche?", ["Es wird nach genau diesem Ausdruck gesucht", "Die Suche wird gelöscht", "Es kommen nur Bilder"], 0, "So findest du feste Begriffe wie „Bürgeramt Heidelberg“ gezielter."],
 ["Woran erkennst du eine offizielle Stadtseite oft?", ["An der echten Domain der Stadt", "An bunten Bildern", "An vielen Werbebannern"], 0, "Prüfe die Adresse, nicht nur das Aussehen."]);
W("c2-3",
 ["Was ist bei `ali@beispiel.de` der lokale Teil?", ["`ali`", "`beispiel.de`", "`@`"], 0, "Vor dem @ steht der Name des Postfachs."],
 ["Was ist der Spam-Ordner?", ["Ein Ordner für vermutlich unerwünschte Nachrichten", "Ein Ordner für gesendete Mails", "Der Papierkorb"], 0, "Schau dort gelegentlich nach, ob echte Mails falsch einsortiert wurden."]);
W("c2-4",
 ["Welche Anrede passt in eine E-Mail an ein Amt?", ["Sehr geehrte Damen und Herren,", "Hi Leute!", "Yo"], 0, "Formelle Schreiben beginnen höflich."],
 ["Was macht „Weiterleiten“?", ["Schickt die E-Mail an eine weitere Person", "Antwortet nur dem Absender", "Löscht die Mail"], 0, "Prüfe vorher, ob der Inhalt weitergegeben werden darf."]);
W("c2-5",
 ["Was tun, wenn eine Datei zu groß für den E-Mail-Anhang ist?", ["Verkleinern oder über einen sicheren Freigabelink senden", "In viele Mails zerschneiden und hoffen", "Gar nicht senden und nichts sagen"], 0, "Viele Dienste begrenzen die Anhanggröße."],
 ["Warum schickt man Bewerbungen meist als PDF?", ["Das Layout bleibt auf allen Geräten gleich", "PDFs sind immer kleiner als alles andere", "Weil Word verboten ist"], 0, "PDF sieht beim Empfänger so aus wie bei dir."]);
W("c2-6",
 ["Du schreibst an viele Eltern, die sich nicht kennen. Welches Feld schützt ihre Adressen?", ["BCC", "CC", "An"], 0, "BCC-Adressen sehen die anderen Empfänger nicht."],
 ["Was bedeutet CC?", ["Kopie an weitere Empfänger, sichtbar für alle", "Geheime Kopie", "Entwurf"], 0, "CC steht für Kopie."]);
W("c2-7",
 ["Was zeigt häufig ein Sternchen * an einem Formularfeld?", ["Ein Pflichtfeld", "Ein verbotenes Feld", "Einen Fehler"], 0, "Pflichtfelder müssen ausgefüllt werden."],
 ["Wann ist ein Online-Termin wirklich gebucht?", ["Wenn eine Bestätigung angezeigt oder per Mail geschickt wird", "Sobald du das Formular öffnest", "Wenn du die Seite schließt"], 0, "Ohne Bestätigung ist die Buchung unsicher."]);
W("c2-8",
 ["Was sollte eine Terminanfrage per E-Mail enthalten?", ["Anliegen, mögliche Zeiten und Kontaktdaten", "Nur „Hallo“", "Einen langen Lebenslauf"], 0, "Kurz und vollständig wird schneller beantwortet."],
 ["Was tust du, wenn nach einer Woche keine Antwort kommt?", ["Freundlich nachfragen oder anrufen", "Zehn weitere Mails schicken", "Aufgeben"], 0, "Eine höfliche Erinnerung ist üblich."]);

/* ---------- Sicher im Netz ---------- */
W("c3-1",
 ["Wie prüfst du, wohin ein Link wirklich führt?", ["Mit der Maus darüberfahren und die Adresse lesen, ohne zu klicken", "Einfach klicken", "Am Logo"], 0, "Die echte Zieladresse verrät viele Fälschungen."],
 ["Eine Mail droht mit Kontosperrung in 24 Stunden. Was ist typisch?", ["Zeitdruck ist ein häufiges Phishing-Merkmal", "Das ist immer echt", "Banken drohen täglich"], 0, "Betrüger erzeugen Druck, damit man nicht nachdenkt."]);
W("c3-2",
 ["Was ist ein Vorteil von Passkeys?", ["Es gibt kein Passwort, das gestohlen oder abgefischt werden kann", "Man braucht kein Gerät mehr", "Sie funktionieren ohne jede Prüfung"], 0, "Passkeys melden sich mit einem Schlüssel auf deinem Gerät an."],
 ["Warum ist dasselbe Passwort für viele Dienste gefährlich?", ["Wird es einmal geleakt, sind alle Konten offen", "Es wird zu lang", "Es ist verboten"], 0, "Angreifer probieren geleakte Passwörter bei vielen Diensten aus."]);
W("c3-3",
 ["Jemand ruft an und will deinen SMS-Code „zur Prüfung“. Was tun?", ["Auflegen und den Code niemals nennen", "Den Code vorlesen", "Ihn per Mail schicken"], 0, "Einmalcodes sind nur für dich bestimmt."],
 ["Was ist der zweite Faktor bei der Zwei-Faktor-Anmeldung zum Beispiel?", ["Ein Code aus einer App auf deinem Handy", "Dein Benutzername", "Deine Lieblingsfarbe"], 0, "Etwas, das du besitzt, ergänzt dein Passwort."]);
W("c3-4",
 ["Welche Zahlungsart ist bei unbekannten Shops riskant?", ["Vorkasse per Überweisung", "Kauf auf Rechnung", "Zahlung mit Käuferschutz"], 0, "Bei Vorkasse ist das Geld weg, wenn keine Ware kommt."],
 ["Was gehört in ein seriöses Shop-Impressum?", ["Name und Anschrift des Anbieters", "Nur eine Handynummer", "Gar nichts"], 0, "Fehlende Anbieterangaben sind ein Warnsignal."]);
W("c3-5",
 ["Was verrät ein Foto oft unbemerkt?", ["Ort und Zeit in den Bilddaten", "Nichts", "Dein Passwort"], 0, "Viele Fotos enthalten Standortdaten (Metadaten)."],
 ["Wo prüfst du die Berechtigungen einer App?", ["In den Einstellungen des Handys", "Im App-Logo", "Gar nicht möglich"], 0, "Dort kannst du unnötige Zugriffe entziehen."]);
W("c3-6",
 ["Woran erkennst du eine offizielle App?", ["Am offiziellen Store und dem echten Anbieter", "An vielen Sternen allein", "Am Namen allein"], 0, "Prüfe Entwicklername und Store, nicht nur Bewertungen."],
 ["Warum kein Programm von einer unbekannten Download-Seite?", ["Es kann Schadsoftware enthalten", "Es ist immer teurer", "Es läuft nur nachts"], 0, "Lade Software vom Hersteller oder aus offiziellen Stores."]);
W("c3-7",
 ["Was solltest du im öffentlichen WLAN eher vermeiden?", ["Online-Banking ohne zusätzlichen Schutz", "Nachrichten lesen", "Wetter abrufen"], 0, "Bei sensiblen Dingen ist mobiles Netz oft sicherer."],
 ["Was macht die automatische WLAN-Verbindung riskant?", ["Das Gerät verbindet sich evtl. mit gefälschten Netzen gleichen Namens", "Sie verbraucht kein Datenvolumen", "Nichts"], 0, "Schalte automatisches Verbinden für öffentliche Netze ab."]);
W("c3-8",
 ["Dein E-Mail-Konto wurde übernommen. Was zuerst?", ["Passwort über die echte Seite ändern und abmelden lassen", "Abwarten", "Allen Kontakten das Passwort schicken"], 0, "Den Zugang zurückholen hat Vorrang."],
 ["Warum ist eine kurze Notiz zum Vorfall hilfreich?", ["Für Bank, Polizei oder Anbieter lassen sich Zeiten und Schritte belegen", "Sie ersetzt das neue Passwort", "Das ist unnötig"], 0, "Datum, Uhrzeit und Schritte helfen bei der Klärung."]);

/* ---------- Büro-Programme ---------- */
W("c4-1",
 ["Welches Datumsformat im Dateinamen sortiert sich richtig?", ["`2026-03-15`", "`15.3.26`", "`März15`"], 0, "Jahr-Monat-Tag sortiert sich in der richtigen Reihenfolge."],
 ["Was solltest du in Dateinamen vermeiden?", ["Sonderzeichen wie / oder ?", "Bindestriche", "Zahlen"], 0, "Manche Zeichen sind in Dateinamen nicht erlaubt."]);
W("c4-2",
 ["Wofür nutzt man Formatvorlagen wie „Überschrift 1“?", ["Einheitliches Aussehen und automatisches Inhaltsverzeichnis", "Damit der Text bunter wird", "Zum Löschen"], 0, "Vorlagen machen Dokumente einheitlich und gut gliederbar."],
 ["Wie erzeugst du sauber eine neue Seite?", ["Mit einem Seitenumbruch", "Mit vielen Leerzeilen", "Mit Leerzeichen"], 0, "Leerzeilen verrutschen, ein Seitenumbruch nicht."]);
W("c4-3",
 ["Wo steht die Anschrift des Empfängers im Geschäftsbrief?", ["Im Anschriftfeld links oben, passend für Fensterumschläge", "Ganz unten", "In der Betreffzeile"], 0, "Das Anschriftfeld ist so platziert, dass es im Fenster sichtbar ist."],
 ["Wie beginnt die Betreffzeile nach DIN 5008?", ["Ohne das Wort „Betreff“, direkt mit dem Thema", "Mit „Betr.:“", "Mit „Hallo“"], 0, "Die Betreffzeile nennt nur das Thema."]);
W("c4-4",
 ["Was berechnet `=SUMME(B2:B5)`?", ["Die Summe der Zellen B2 bis B5", "Den Durchschnitt", "Die Anzahl der Zellen"], 0, "Der Doppelpunkt beschreibt einen Bereich."],
 ["Was bedeutet das Dollarzeichen in `$B$1`?", ["Der Bezug bleibt beim Kopieren fest", "Es ist ein Geldbetrag", "Die Zelle wird gelöscht"], 0, "Ein absoluter Bezug ändert sich beim Kopieren nicht."]);
W("c4-5",
 ["Welches Diagramm passt für Anteile an einem Ganzen?", ["Kreisdiagramm (bei wenigen Anteilen)", "Liniendiagramm", "Gar keins"], 0, "Für wenige Anteile ist ein Kreisdiagramm verständlich."],
 ["Was passiert, wenn man nur eine Spalte sortiert?", ["Die Zeilen passen nicht mehr zusammen", "Alles bleibt richtig", "Die Tabelle wird gelöscht"], 0, "Immer den ganzen Datenbereich sortieren."]);
W("c4-6",
 ["Warum reicht ein schwarzer Kasten über Text im PDF nicht immer aus?", ["Der Text kann darunter noch kopierbar sein", "Schwarz ist verboten", "PDFs haben keine Farben"], 0, "Echtes Schwärzen entfernt den Inhalt."],
 ["Wie erstellst du ein PDF aus einem Textdokument?", ["Über „Exportieren“ oder „Speichern unter → PDF“", "Durch Umbenennen in .pdf", "Durch Drucken auf Papier"], 0, "Nur Umbenennen ändert das Format nicht."]);
W("c4-7",
 ["Was gilt für Text auf Folien?", ["Wenige Stichpunkte, große Schrift", "Ganze Absätze", "Möglichst kleine Schrift"], 0, "Das Publikum soll zuhören, nicht lesen."],
 ["Warum wenige Animationen?", ["Sie lenken vom Inhalt ab", "Sie sind verboten", "Sie machen die Datei kleiner"], 0, "Lesbarkeit ist wichtiger als Effekte."]);
W("c4-8",
 ["Was muss im Begleitbrief zum Angebot stimmen?", ["Die Summe muss mit der Tabelle übereinstimmen", "Nur die Schriftart", "Nichts"], 0, "Widersprüche zwischen Brief und Tabelle wirken unprofessionell."],
 ["In welchem Format gibt man ein fertiges Angebot meist weiter?", ["PDF", "Als Screenshot", "Als unfertige Tabelle"], 0, "PDF ist für fertige Dokumente gedacht."]);

/* ---------- Digitale Profi-Werkzeuge ---------- */
W("c5-1",
 ["Was bedeutet die 2 in der 3-2-1-Regel?", ["Zwei verschiedene Speicherarten", "Zwei Passwörter", "Zwei Computer"], 0, "Zum Beispiel interne Festplatte und externe Festplatte."],
 ["Warum ist eine Synchronisation in die Cloud allein kein Backup?", ["Gelöschte oder verschlüsselte Dateien werden mit synchronisiert", "Die Cloud ist immer leer", "Sie kostet nichts"], 0, "Ein Backup braucht unabhängige Kopien."]);
W("c5-2",
 ["Was bedeutet „Nur Lesen“ bei einer Freigabe?", ["Andere können ansehen, aber nicht ändern", "Andere können alles löschen", "Niemand kann es sehen"], 0, "Gib nur so viel Recht wie nötig."],
 ["Woran erkennt man oft eine Konfliktkopie?", ["Am Zusatz im Dateinamen, z. B. „Konflikt“", "An der Farbe", "Gar nicht"], 0, "Vergleiche beide Fassungen und führe sie zusammen."]);
W("c5-3",
 ["Was sollte man mit einer von KI genannten Quelle tun?", ["Prüfen, ob es sie wirklich gibt", "Ungeprüft zitieren", "Löschen"], 0, "KI kann Quellen erfinden."],
 ["Welche Aufgabe eignet sich gut für KI-Unterstützung?", ["Einen eigenen Entwurf sprachlich verbessern lassen und dann prüfen", "Vertrauliche Kundendaten hochladen", "Ungeprüft Verträge unterschreiben lassen"], 0, "Die Verantwortung für das Ergebnis bleibt bei dir."]);
W("c5-4",
 ["Wofür steht Strg+S häufig?", ["Speichern", "Suchen", "Schließen"], 0, "Regelmäßig speichern schützt vor Datenverlust."],
 ["Welches Kürzel wechselt unter Windows zwischen offenen Fenstern?", ["Alt+Tab", "Strg+Q", "Shift+Z"], 0, "Alt+Tab zeigt die offenen Fenster."]);
W("c5-5",
 ["Welche Aufgabe ist konkret formuliert?", ["„Angebot von Firma A bis Freitag per Mail anfragen“", "„Irgendwas mit Angeboten“", "„Mehr arbeiten“"], 0, "Eine konkrete Aufgabe nennt Handlung und Termin."],
 ["Was hilft beim Priorisieren?", ["Wichtigkeit und Dringlichkeit unterscheiden", "Alles gleichzeitig machen", "Nur das Einfachste tun"], 0, "Nicht alles Dringende ist wichtig."]);
W("c5-6",
 ["Was bewahrst du nach dem Absenden eines Online-Formulars auf?", ["Die Eingangsbestätigung oder Kopie", "Nichts", "Nur den Browserverlauf"], 0, "So kannst du später nachweisen, was du eingereicht hast."],
 ["Ist ein eingefügtes Bild deiner Unterschrift immer rechtlich gleichwertig zur handschriftlichen?", ["Nein, das hängt von der geforderten Form ab", "Ja, immer", "Es ist immer verboten"], 0, "Manche Vorgänge verlangen eine qualifizierte elektronische Signatur oder Papier."]);
W("c5-7",
 ["Warum sind echte Überschriften-Formate wichtig?", ["Vorleseprogramme und Inhaltsverzeichnisse erkennen die Struktur", "Sie sehen nur größer aus", "Sie sparen Papier"], 0, "Nur fett gedruckter Text ist keine echte Überschrift."],
 ["Was macht Texte leichter verständlich?", ["Kurze Sätze und bekannte Wörter", "Viele Fachwörter", "Sehr lange Schachtelsätze"], 0, "Einfache Sprache hilft allen Lesenden."]);
W("c5-8",
 ["Was gehört zu einer guten Übergabe im Projekt?", ["Wer was bis wann macht und wo die Dateien liegen", "Nur ein „passt schon“", "Nichts Schriftliches"], 0, "Überprüfbare Absprachen vermeiden Missverständnisse."],
 ["Warum testet man die Wiederherstellung einer Sicherung?", ["Nur so weiß man, dass sie im Ernstfall funktioniert", "Weil es Spaß macht", "Das ist unnötig"], 0, "Eine ungetestete Sicherung kann unbrauchbar sein."]);

/* ---------- Cybersecurity: Linux für Cybersicherheit ---------- */
W("sec1-1",
 ["Was ist ein Snapshot einer virtuellen Maschine?", ["Ein gespeicherter Zustand, zu dem man zurückkehren kann", "Ein Foto vom Bildschirm", "Ein Virenscanner"], 0, "Nach einem Fehler stellst du den Snapshot wieder her."],
 ["Was bedeutet die Tilde `~` im Prompt?", ["Dein Home-Verzeichnis", "Die Wurzel des Systems", "Einen Fehler"], 0, "~ steht für /home/BENUTZER."]);
W("sec1-2",
 ["Wohin führt `cd ..`?", ["In den übergeordneten Ordner", "In das Home-Verzeichnis", "Zur Wurzel /"], 0, "Zwei Punkte stehen für den Ordner darüber."],
 ["Wo stehen unter Linux die meisten Einstellungen von Diensten?", ["In /etc", "In /tmp", "In /home/bilder"], 0, "/etc enthält die Konfigurationsdateien."]);
W("sec1-3",
 ["Wie hängst du eine Zeile an eine Datei an, ohne den Inhalt zu löschen?", ["`echo \"Text\" >> datei.txt`", "`echo \"Text\" > datei.txt`", "`rm datei.txt`"], 0, ">> hängt an, > überschreibt."],
 ["Was macht `cp a.txt b.txt`?", ["Kopiert a.txt nach b.txt, a.txt bleibt erhalten", "Benennt a.txt um", "Löscht a.txt"], 0, "Beim Kopieren bleibt das Original unverändert."]);
W("sec1-4",
 ["Was zeigt `grep -v CRON syslog`?", ["Alle Zeilen ohne CRON", "Nur Zeilen mit CRON", "Die Anzahl der CRON-Zeilen"], 0, "-v kehrt die Auswahl um."],
 ["Was ergibt `grep Failed auth.log | wc -l`?", ["Die Anzahl der Zeilen mit Failed", "Alle Wörter der Datei", "Die Dateigröße"], 0, "grep filtert, wc -l zählt die gefilterten Zeilen."]);
W("sec1-5",
 ["Was findet `find /tmp -type f -name \"*.sh\"`?", ["Alle Dateien in /tmp, die auf .sh enden", "Alle Ordner namens sh", "Gelöschte Skripte"], 0, "-type f beschränkt auf Dateien, -name auf das Muster."],
 ["Warum gibt man bei find einen Startordner an?", ["Damit die Suche schneller und übersichtlicher ist", "Weil find sonst nichts findet", "Weil es Pflicht für root ist"], 0, "Die Suche über das ganze System ab / dauert lange."]);
W("sec1-6",
 ["Welche Rechte hat eine Datei mit 640?", ["Besitzer lesen/schreiben, Gruppe lesen, andere nichts", "Alle dürfen alles", "Nur andere dürfen lesen"], 0, "6 = rw, 4 = r, 0 = keine Rechte."],
 ["Was bedeutet `x` bei einem Ordner?", ["Man darf den Ordner betreten", "Man darf ihn löschen", "Er ist versteckt"], 0, "Ohne x kann man nicht in den Ordner wechseln."]);
W("sec1-7",
 ["Welche Benutzernummer hat root?", ["0", "1000", "1"], 0, "root hat die UID 0."],
 ["Was zeigt `id`?", ["Benutzer, Gruppe und Gruppenmitgliedschaften", "Die IP-Adresse", "Das Passwort"], 0, "Die Gruppe sudo zeigt Administratorrechte an."]);
W("sec1-8",
 ["Warum sortiert man vor `uniq -c`?", ["Damit gleiche Zeilen nebeneinander stehen und richtig gezählt werden", "Damit die Datei kleiner wird", "Weil uniq sonst nichts ausgibt"], 0, "uniq fasst nur aufeinanderfolgende gleiche Zeilen zusammen."],
 ["Viele Fehlversuche in wenigen Sekunden von einer Adresse deuten am ehesten auf …", ["ein automatisiertes Werkzeug", "einen Stromausfall", "ein Druckerproblem"], 0, "Menschen tippen nicht so schnell; trotzdem gilt: erst belegen, dann bewerten."]);
})(typeof window !== "undefined" ? window : globalThis);
