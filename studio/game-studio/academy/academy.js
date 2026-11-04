/* SD Game-Studio Academy: standalone lessons. No access to scene or asset storage. */
(() => {
'use strict';
const EDITOR='../index.html',WORLD='../large-world.html',JXL='../../jpeg-xl.html';
const tracks=[
{id:'start',name:'01 · Einstieg',subtitle:'Orientieren & erste Szene',lessons:[
{id:'welcome',name:'Den Editor verstehen',minutes:8,summary:'Lerne den Aufbau von Werkzeugleiste, 3D-Ansicht und Inspector kennen.',goal:'Du findest die wichtigsten Arbeitsbereiche und weißt, wann du den Bearbeitungsmodus verwendest.',steps:[
'Öffne den Level-Editor. Links siehst du die Objektbibliothek und die Landschaftswerkzeuge.',
'In der Mitte befindet sich die 3D-Bühne mit den Modi „Bearbeiten“ und „Spielen“.',
'Rechts findest du den Inspector, die Projektverwaltung und den GLB-Modellimport.',
'Suche die Szenenhierarchie „Scene Outliner“ auf der linken Seite: Dort erscheinen die Objekte deiner Welt.'
],tasks:['Finde die Objektbibliothek auf der linken Seite.','Finde den Inspector auf der rechten Seite.','Finde den Schalter „Spielen“ oberhalb der 3D-Bühne.'],
quiz:['Wo änderst du die Position eines ausgewählten Objekts?',['Im Scene Outliner','Im Inspector','In der Projektverwaltung','Im Spielmodus'],1,'Der Inspector zeigt Position, Größe, Farbe und – bei Modellen – Drehung.']},
{id:'objects',name:'Objekte platzieren',minutes:12,summary:'Baue mit einfachen Formen und Naturbausteinen einen ersten kleinen Parcours.',goal:'Du kannst neue Objekte hinzufügen und sie in der Szenenhierarchie wiederfinden.',steps:[
'Klicke unter „Szene gestalten“ auf „Würfel“. Dadurch erscheint ein zusätzliches Objekt in deiner Welt.',
'Wiederhole den Vorgang mit „Kugel“ und „Säule“.',
'Prüfe den „Scene Outliner“: Deine neuen Objekte stehen als eigene Einträge in der Liste.',
'Wähle eines der Objekte aus. Der Inspector zeigt jetzt seine Eigenschaften.'
],tasks:['Füge mindestens einen Würfel hinzu.','Füge eine Kugel und eine Säule hinzu.','Wähle einen der neuen Einträge im Scene Outliner aus.'],quiz:['Was passiert beim Hinzufügen eines Würfels?',['Der gesamte Boden wird ersetzt','Eine zusätzliche Szeneninstanz wird angelegt','Die Szene wird sofort online veröffentlicht','Die Großwelt wird geöffnet'],1,'Ein neuer Würfel wird als eigenes Objekt der aktiven Szene hinzugefügt.']},
{id:'camera-inspector',name:'Kamera & Inspector',minutes:13,summary:'Kontrolliere die Ansicht und passe die Position, Größe und Farbe von Objekten an.',goal:'Du kannst ein Objekt gezielt im Raum positionieren und deine Änderung überprüfen.',steps:[
'Ziehe mit der Maus oder dem Finger über die 3D-Bühne, um die Kamera zu drehen. Verwende das Mausrad zum Zoomen.',
'Wähle einen Würfel aus der Szene oder dem Outliner aus.',
'Setze im Inspector „Position X“ und „Position Z“ auf unterschiedliche zulässige Werte, zum Beispiel 2 und -3.',
'Ändere die Größe und Materialfarbe. Probiere danach „Rückgängig“ und „Wiederholen“ aus.'
],tasks:['Drehe die Ansicht und setze die Kamera mit „Kamera“ zurück.','Ändere X, Z und Größe eines Objekts.','Nutze mindestens einmal „Rückgängig“.'],quiz:['Welches Wertepaar verschiebt ein Objekt auf der Bodenfläche?',['X und Z','Farbe und Outfit','Tageszeit und Pinselgröße','Projektname und Dateiendung'],0,'Der Inspector verwendet X und Z für die Position auf der Bodenfläche.']},
{id:'save',name:'Projekte sichern',minutes:11,summary:'Exportiere deine erste Welt als JSON und stelle sie anschließend wieder her.',goal:'Du kannst eine lokale Sicherung erstellen, ohne bestehende Code-Studio-Projekte zu verändern.',steps:[
'Klicke im oberen Bereich auf „Projekt speichern“. Der Browser lädt eine JSON-Projektdatei herunter.',
'Bewahre die Datei mit einem erkennbaren Namen in einem eigenen Projektordner auf.',
'Öffne unter „Szene verwalten“ den Punkt „JSON-Szene importieren“ und wähle deine Sicherung.',
'Kontrolliere, ob Objekte, Bodenmaterial und Licht wieder den gespeicherten Einstellungen entsprechen.'
],tasks:['Speichere deine Szene als JSON-Datei.','Importiere dieselbe JSON-Datei erneut.','Prüfe ein Objekt im Inspector, um das Ergebnis zu kontrollieren.'],quiz:['Welche Dateiart wird zum Exportieren der Szene verwendet?',['PNG','EXE','JSON','MP4'],2,'Der Editor exportiert eine strukturierte JSON-Szenendatei.']}
]},
{id:'design',name:'02 · Level-Design',subtitle:'Gelände, Licht & Spielfigur',lessons:[
{id:'terrain',name:'Gelände formen',minutes:15,summary:'Erstelle aus flachem Boden eine abwechslungsreiche Landschaft.',goal:'Du kannst Gelände anheben, absenken und glätten, ohne die Originalszene dauerhaft zu überschreiben.',steps:[
'Wähle links im Bereich „Gelände & Natur“ ein Bodenmaterial: Wiese, Wüste oder Schnee.',
'Aktiviere „Anheben“ und ziehe den Geländepinsel über eine freie Fläche. Erzeuge einen niedrigen Hügel.',
'Wechsle auf „Absenken“ und bearbeite eine andere Stelle. Wähle danach „Glätten“ für die Übergänge.',
'Probiere beide Pinselgrößen und verwende „Rückgängig“, wenn ein Ergebnis nicht passt.'
],tasks:['Wechsle das Bodenmaterial.','Erzeuge eine Erhöhung und eine Senke.','Glätte einen Übergang und prüfe das Resultat in der 3D-Ansicht.'],quiz:['Welche Einstellung bestimmt, wie viel Fläche ein Geländestrich beeinflusst?',['Das Outfit','Die Pinselgröße','Die Szenendatei','Der Projektname'],1,'Mit der Pinselgröße wählst du den kleineren oder größeren Geländebereich.']},
{id:'nature',name:'Natur & Objektgruppen',minutes:12,summary:'Baue einen Waldabschnitt und lerne, wie Objektbudgets dein Design beeinflussen.',goal:'Du kannst Naturbausteine gruppiert hinzufügen und erkennst die Grenzen der aktuellen Einzelszene.',steps:[
'Ergänze über die Naturbibliothek einzelne Felsen, Tannen und Sträucher.',
'Klicke auf „Waldstück anlegen“: Der Editor ergänzt eine Gruppe aus vier Natur-Objekten.',
'Füge zusätzlich eine „Blumenwiese“ hinzu. Diese Gruppe enthält fünf Objekte.',
'Beobachte die Objektanzahl im Outliner und halte die Einzelszene bewusst übersichtlich.'
],tasks:['Füge ein Waldstück hinzu.','Füge eine Blumenwiese hinzu.','Prüfe die Objektanzahl im Outliner.'],quiz:['Wie viele Objekte erlaubt der aktuelle kleine Level-Editor maximal?',['30','70','256','2.048'],1,'Die Einzelszene ist derzeit auf 70 Objekte begrenzt; die separate Großwelt ist ein anderer Modus.']},
{id:'lighting',name:'Licht & Atmosphäre',minutes:10,summary:'Vergleiche Tageszeiten und ihre Wirkung auf die Lesbarkeit eines Levels.',goal:'Du wählst eine Lichtstimmung passend zum Spiel und prüfst die Sichtbarkeit wichtiger Wege.',steps:[
'Öffne links die „Lichtstimmung“ und wähle „Morgen“. Prüfe Farben und Schattenwirkung.',
'Vergleiche die Einstellungen „Tag“, „Abend“ und „Nacht“.',
'Lege die Lichtstimmung fest, bei der Spieler die Hindernisse deines Parcours gut erkennen.',
'Speichere die Szene und prüfe nach dem erneuten Importieren die gewählte Tageszeit.'
],tasks:['Teste alle vier Tageszeiten.','Wähle eine für deinen Parcours geeignete Stimmung.','Speichere eine Szene mit der gewählten Lichtstimmung.'],quiz:['Welche Tageszeit-Einstellung bietet der Level-Editor?',['Wettersturm','Nacht','Regenphysik','Wolken-Simulation'],1,'Unter Lichtstimmung stehen Morgen, Tag, Abend und Nacht zur Verfügung.']},
{id:'play',name:'Spielfigur & Spieltest',minutes:14,summary:'Wechsle in den Spielmodus, bewege die Figur und verbessere deinen Parcours.',goal:'Du kannst ein Level aus Spielersicht testen und danach kontrolliert zurück in den Editor wechseln.',steps:[
'Wähle unter „Deine Spielfigur“ eines der Outfits Explorer, Sport oder Night.',
'Klicke über der 3D-Bühne auf „Spielen“ und bewege die Figur mit WASD oder den Pfeiltasten.',
'Nutze die Leertaste zum Springen. Auf Mobilgeräten stehen Bildschirmtasten zur Verfügung.',
'Wechsle zurück zu „Bearbeiten“. Passe problematische Hindernisse an und teste erneut.'
],tasks:['Wähle ein anderes Outfit.','Bewege deine Figur und springe mindestens einmal.','Wechsle zurück in den Bearbeitungsmodus und verbessere eine Stelle.'],quiz:['Mit welcher Taste springt die Figur am Computer?',['Tab','Escape','Leertaste','Shift + S'],2,'Die Leertaste löst im Spielmodus den Sprung aus.']}
]},
{id:'assets',name:'03 · 3D-Assets',subtitle:'Modellimport & Qualität',lessons:[
{id:'glb',name:'GLB-Dateien verstehen',minutes:13,summary:'Prüfe externe 3D-Modelle sicher in der lokalen Vorschau.',goal:'Du verstehst, welche Modelle in der Vorschau unterstützt werden und welche Grenzen wichtig sind.',steps:[
'Bereite eine eigene rechtmäßig verwendbare Datei im GLB-Format vor (binäres glTF 2.0).',
'Klicke rechts im Abschnitt „GLB-Modellimport“ auf „GLB-Datei wählen“.',
'Untersuche das Modell in der drehbaren Vorschau, ohne es sofort in die Welt einzufügen.',
'Beachte die aktuelle Grenze von 8 MiB. Die Vorschau verarbeitet Dreiecksgeometrie und Basisfarben, jedoch noch keine Texturen, Skinning oder Animationen.'
],tasks:['Öffne die GLB-Vorschau und finde die Datei-Auswahl.','Prüfe bei einer eigenen GLB-Datei die Größe vor dem Import.','Benenne eine Grenze der aktuellen GLB-Vorschau.'],quiz:['Was unterstützt die erste GLB-Vorschau derzeit ausdrücklich nicht?',['Dreiecksgeometrie','Basisfarben','Skinning und Animationen','Drehen der Vorschau'],2,'Skinning, Animationen und Texturen sind noch nicht Bestandteil der ersten Modellvorschau.']},
{id:'place-model',name:'Modelle in der Szene',minutes:14,summary:'Platziere ein geprüftes GLB-Asset und verändere seine Ausrichtung.',goal:'Du kannst ein eigenes Modell in der Level-Szene platzieren und seine Eigenschaften bearbeiten.',steps:[
'Lade eine gültige GLB-Datei in die lokale Modellvorschau.',
'Nutze nach erfolgreicher Prüfung „In Welt platzieren“, um eine Instanz in der aktiven Szene anzulegen.',
'Wähle das Modell im Outliner und passe Position und Größe im Inspector an.',
'Ändere bei einem Modell den Wert „Drehung Y (Grad)“. Prüfe das Ergebnis im 3D-Fenster.'
],tasks:['Lade ein gültiges eigenes GLB-Modell.','Platziere es in einer Szene.','Passe seine Position oder Y-Drehung an.'],quiz:['Welche zusätzliche Eigenschaft ist im Inspector für GLB-Modellinstanzen vorgesehen?',['Server-Latenz','Drehung Y','Netzwerk-Port','GPU-Treiber'],1,'Für Modellinstanzen gibt es ein Feld zur Drehung um die Y-Achse.']},
{id:'versions',name:'Projektformate & Grenzen',minutes:12,summary:'Verstehe die Unterschiede zwischen Szenenversion 1 und Projektversion 2.',goal:'Du kannst die aktuelle Asset-Struktur einschätzen und wichtige Beschränkungen beim Speichern beachten.',steps:[
'Erstelle eine einfache Szene ohne GLB-Assets und exportiere sie als JSON.',
'Füge in einer Kopie ein GLB-Modell hinzu und exportiere das Projekt erneut.',
'Die ursprünglichen Szenen unterstützen Version 1; für eingebettete GLB-Assets verwendet der Editor das validierte Projektformat Version 2.',
'Beachte die Limits: maximal vier verschiedene GLB-Assets und zusammen höchstens 8 MiB Asset-Daten.'
],tasks:['Vergleiche einen Export ohne und mit GLB-Modell.','Notiere die maximale Zahl verschiedener GLB-Assets.','Sichere eine funktionierende Datei vor weiteren Tests.'],quiz:['Wie viele verschiedene GLB-Assets sind im aktuellen v2-Projekt maximal vorgesehen?',['2','4','16','70'],1,'Die Projektverwaltung begrenzt ein v2-Projekt derzeit auf vier verschiedene GLB-Assets.']},
{id:'review',name:'Qualitätssicherung',minutes:15,summary:'Erstelle einen kurzen, wiederholbaren Testplan für deine Spielszene.',goal:'Du überprüfst Bedienung, Szenendaten und Mobilnutzung systematisch vor der Weitergabe.',steps:[
'Notiere drei Testfälle: ein Objekt auswählen und ändern, in den Spielmodus wechseln und eine Sicherung exportieren.',
'Führe die Testfälle einzeln aus. Kontrolliere nach jeder Änderung die 3D-Ansicht und Statusmeldungen.',
'Importiere die exportierte Datei wieder in den Editor und prüfe ein zuvor geändertes Objekt.',
'Teste bei Möglichkeit am Handy: Kamera drehen, Bildschirmtasten verwenden, Bedienbereiche erreichen.'
],tasks:['Führe einen Test des Inspectors durch.','Exportiere und importiere ein Projekt erfolgreich.','Dokumentiere eine Verbesserungsidee oder bestätige einen bestandenen Mobiltest.'],quiz:['Welche Prüfung ist vor dem Teilen einer Szene am aussagekräftigsten?',['Nur den Dateinamen ansehen','Export, Reimport und Spieltest durchführen','Alle Objekte löschen','Den Browserhintergrund ändern'],1,'Ein kombinierter Export-/Reimport-Test und ein echter Spieltest prüfen Daten und Bedienbarkeit.']}
]},
{id:'large',name:'04 · Große Games',subtitle:'Welten & Produktionspraxis',lessons:[
{id:'world-intro',name:'Großwelt kennenlernen',minutes:13,mode:'world',summary:'Erkunde die separate experimentelle Großwelt-Engine und ihre Szenenzellen.',goal:'Du erkennst, warum große Spiele andere Techniken als eine kleine Einzelszene brauchen.',steps:[
'Öffne die „Großwelt-Engine“ über den Link im Level-Editor oder hier in der Lektion.',
'Sieh dir die Weltstatistik an: Die Beispielwelt umfasst 640 × 640 Einheiten in insgesamt 256 Szenenzellen.',
'Die Beispielszene enthält anfänglich 2.048 Objekte; beobachte die geringere Zahl aktiver Zellen in der Nähe der Kamera.',
'Beachte: Die Großwelt hat ein separates Version-3-JSON-Format und derzeit In-Memory-Cell-Culling – kein Streaming von der Festplatte.'
],tasks:['Öffne die experimentelle Großwelt-Engine.','Finde die Angaben zu Weltgröße, Zellen und Objekten.','Unterscheide Gesamtzahl und aktuell aktive Zellen.'],quiz:['Wie viele Szenenzellen hat die aktuelle Großwelt-Beispielwelt insgesamt?',['70','128','256','2.048'],2,'Die 640 × 640 große Beispielwelt ist in 256 Szenenzellen unterteilt.']},
{id:'world-edit',name:'In großen Welten arbeiten',minutes:15,mode:'world',summary:'Navigiere über größere Distanzen und platziere neue Objekte in der passenden Zelle.',goal:'Du bewegst dich sicher durch die Großwelt und verwaltest ein eigenes v3-Projekt.',steps:[
'Bewege die Kamera in der Großwelt mit WASD beziehungsweise den Pfeiltasten.',
'Beobachte die X/Z-Koordinaten oben in der 3D-Ansicht und halte an einer freien Stelle.',
'Nutze „Baum an Kameraposition“ oder „Felsen an Kameraposition“. Die Engine ordnet den Gegenstand der entsprechenden Zelle zu.',
'Speichere deine Großwelt als v3-JSON und importiere sie mit „Gespeicherte Großwelt öffnen“ erneut.'
],tasks:['Bewege dich sichtbar zu einer neuen Kameraposition.','Füge einen Baum oder Felsen hinzu.','Speichere und öffne eine v3-Großweltdatei.'],quiz:['Wo platziert die Großwelt neue Bäume aus dem Werkzeugbereich?',['Immer bei X 0 / Z 0','An der Kameraposition','Im Inspector des kleinen Editors','In einer zufälligen Datei'],1,'Die Großwelt-Werkzeuge legen neue Objekte an der aktuellen Kameraposition ab.']},
{id:'performance',name:'Performance beobachten',minutes:16,mode:'world',summary:'Lerne die wichtigsten Laufzeitkennzahlen einer großen 3D-Szene kennen.',goal:'Du kannst aktive Zellen, aktive Objekte und Draw Calls voneinander unterscheiden.',steps:[
'Öffne die Großwelt und notiere im Werkzeugbereich „Aktive Zellen“, „Objekte im aktiven Bereich“ und „Draw Calls pro Frame“.',
'Bewege die Kamera zu einer anderen Position und vergleiche die Zahlen.',
'Erkläre den Unterschied: Eine Welt kann viele Objekte enthalten, während die Engine nur einen Teil davon für die aktuelle Ansicht berücksichtigt.',
'Lege dir eine Testliste an: stabile Bedienung, kontrollierte Objektdichte und nachvollziehbare Speicherformate.'
],tasks:['Notiere die Zahl aktiver Zellen an zwei Positionen.','Vergleiche die angezeigten Draw Calls.','Beschreibe eine Möglichkeit, eine Szene übersichtlicher zu halten.'],quiz:['Welche Anzeige beschreibt die Anzahl der Zeichenaufrufe in einem Frame?',['Projektversion','Draw Calls pro Frame','Weltname','Pinselgröße'],1,'Draw Calls zählen die Zeichenaufrufe; sie sind eine wichtige, aber nicht die einzige Performance-Kennzahl.']},
{id:'roadmap',name:'Vom Prototyp zum großen Game',minutes:20,mode:'world',summary:'Plane ein ernsthaftes Action-, Racing- oder Open-World-Spiel ohne den aktuellen Funktionsstand zu überschätzen.',goal:'Du kannst einen realistischen Produktionsplan mit Technik, Tests, Meilensteinen und Risiken erstellen.',steps:[
'Formuliere ein Kernspielprinzip: etwa Fahrzeugsteuerung, Missionen oder die Erkundung einer großen Welt.',
'Definiere ein kleines Vertical Slice: eine begrenzte Welt, ein vollständiger Spielablauf und überprüfbare Qualitätskriterien.',
'Trenne vorhandene Funktionen von zukünftiger Technik: Multiplayer-Networking, Physiksimulation, umfassendes Asset-Streaming und Produktions-Export sind noch nicht als fertige Funktionen vorhanden.',
'Plane danach die Architektur: Szenenverwaltung, Eingabe, Rendering, Persistenz, Tests, Profiling und später eventuell Server-Synchronisation.'
],tasks:['Schreibe eine Spielidee mit einem klaren Kernspielprinzip auf.','Definiere drei messbare Abnahmekriterien für einen Vertical Slice.','Markiere benötigte Funktionen, die im aktuellen SD Game-Studio noch fehlen.'],quiz:['Welche Vorgehensweise minimiert Risiken bei einem großen Spielprojekt?',['Sofort eine riesige Welt ohne Tests bauen','Erst einen spielbaren, testbaren Vertical Slice erstellen','Nicht benötigte Assets immer laden','Multiplayer als vorhanden voraussetzen'],1,'Ein klar begrenzter Vertical Slice prüft Gameplay und technische Grundlagen, bevor der Umfang wächst.']}
]},
{id:'jxl',name:'05 · JPEG XL',subtitle:'Bildqualität & Asset-Pipelines',lessons:[
{id:'jxl-basics',name:'JPEG XL verstehen',minutes:14,mode:'jxl',summary:'Lerne, wofür das Bildformat JXL geeignet ist und wie es sich von anderen Formaten unterscheidet.',goal:'Du kannst das richtige Bildformat für Spielgrafiken begründet auswählen.',steps:[
'JPEG XL (.jxl, MIME-Typ image/jxl) ist ein Bildformat mit verlustfreier und verlustbehafteter Komprimierung. Es unterstützt Transparenz, hohe Farbtiefen und HDR.',
'Vergleiche: JPEG ist weit verbreitet, kann aber keine Transparenz speichern; PNG eignet sich für verlustfreie Grafiken; WebP und AVIF sind moderne Webformate.',
'Bei JPEG-Bildern kann JPEG XL die Original-JPEG-Daten in einer speziellen verlustfreien Umwandlung erhalten. Das bedeutet nicht, dass jedes JXL-Bild automatisch verlustfrei ist.',
'Plane zwei Fassungen, wenn nötig: eine hochwertige Quelldatei für die Bearbeitung und ein passendes Auslieferungsformat für Web oder Game-Engine.'
],tasks:['Erkläre den Unterschied zwischen verlustfreier und verlustbehafteter Komprimierung.','Ordne JPEG, PNG und JXL je einen geeigneten Einsatzzweck zu.','Wähle ein eigenes Bild aus und begründe, ob JXL als Archiv- oder Quellformat sinnvoll wäre.'],quiz:['Welche Aussage über JPEG XL stimmt?',['JXL kann nur Fotos ohne Transparenz speichern','JXL unterstützt verlustfreie und verlustbehaftete Komprimierung','JXL ist ein 3D-Modellformat','JXL wird von jeder Game-GPU direkt verarbeitet'],1,'JXL ist ein flexibles Bildformat, aber keine automatisch GPU-fertige Textur.']},
{id:'jxl-convert',name:'JXL konvertieren & vergleichen',minutes:20,mode:'jxl',summary:'Erzeuge mit libjxl eigene Dateien und prüfe visuelle Qualität sowie Dateigröße.',goal:'Du kannst JXL lokal erzeugen, wieder dekodieren und die Ergebnisse kontrollieren.',steps:[
'Installiere die offiziellen libjxl-Werkzeuge cjxl und djxl für dein Betriebssystem. Lade sie nur aus vertrauenswürdigen Quellen und bewahre deine Originaldateien auf.',
'Öffne ein Terminal im Ordner einer eigenen PNG-Datei. Beispiel: cjxl input.png output.jxl. Für mathematisch verlustfreie PNG-Konvertierung: cjxl -d 0 input.png lossless.jxl.',
'Prüfe die Rückwandlung: djxl output.jxl kontrolle.png. Vergleiche Dateigröße, Bilddetails, Farbdarstellung und Transparenz; überprüfe auch einen verlustfreien Versuch.',
'Für ein bestehendes JPEG bietet cjxl input.jpg output.jxl standardmäßig eine rekonstruierbare, verlustfreie JPEG-Transkodierung. Teste die Rückgewinnung mit djxl output.jxl rekonstruiert.jpg.'
],tasks:['Führe eine JXL-Konvertierung mit einer eigenen Testgrafik durch.','Dekodiere die Datei mit djxl und prüfe ihr Aussehen.','Notiere Größen und Qualitätsunterschiede sowie die gewählten Einstellungen.'],quiz:['Welcher Befehl dekodiert eine JPEG-XL-Datei in eine PNG-Datei?',['cjxl bild.png bild.jxl','djxl bild.jxl bild.png','ktx2 bild.jxl bild.png','git clone bild.jxl'],1,'djxl ist das Decoder-Werkzeug der libjxl-Referenzimplementierung.']},
{id:'jxl-web',name:'Fallbacks im Web einsetzen',minutes:17,mode:'jxl',summary:'Binde JXL in Webgrafiken ein und halte sie auch für Browser ohne JXL-Unterstützung sichtbar.',goal:'Du verwendest JPEG XL mit einem zuverlässigen Ersatzbild und kennst die Grenzen des vorhandenen Werkzeugs.',steps:[
'Öffne das vorhandene „JPEG XL Bild-Assets“-Werkzeug im SD Code-Studio. Es erstellt HTML-Code für bereits vorhandene Dateien, konvertiert jedoch selbst keine Bilder.',
'Bereite dieselbe Grafik einmal als .jxl und einmal als .jpg oder .png vor. Optional kannst du auch .webp oder .avif hinzufügen.',
'Wähle die Dateien im Werkzeug aus und kopiere den erzeugten picture-Code. Der Browser wählt eine unterstützte Quelle; das img-Element bleibt der Fallback.',
'Teste die Vorschau in mindestens zwei Browsern beziehungsweise Browser-Versionen und kontrolliere, ob Bildabmessung und Alternativtext stimmen. Die Geräteunterstützung kann variieren.'
],tasks:['Öffne das JPEG-XL-Bildwerkzeug und finde die Dateiauswahl.','Erzeuge für ein eigenes Bild picture-HTML mit JPEG- oder PNG-Fallback.','Überprüfe, dass die Seite auch ohne native JXL-Unterstützung ein Bild anzeigen kann.'],quiz:['Wie bietest du im Web eine Ersatzgrafik an, wenn JXL nicht unterstützt wird?',['Nur eine .jxl-Datei hochladen','Ein picture-Element mit JXL-Quelle und img-Fallback nutzen','JXL als JavaScript umbenennen','Den Fallback vollständig entfernen'],1,'picture mit source type="image/jxl" und einem img-Ersatzbild ermöglicht kompatible Darstellung.']},
{id:'jxl-gpu',name:'JXL und professionelle Game-Texturen',minutes:19,mode:'jxl',summary:'Unterscheide Quellbilder, Webgrafiken und GPU-komprimierte Laufzeittexturen.',goal:'Du entwirfst eine realistische Asset-Pipeline für größere 3D-Spiele.',steps:[
'Nutze JXL bei Bedarf für Archivierung, hochwertige Quellbilder oder Webgrafiken. Das aktuelle SD Game-Studio bietet noch keinen eigenen JXL-Decoder für 3D-Materialien.',
'Für Echtzeit-3D sind GPU-Texturformate wichtig: KTX2 kann mit Basis Universal ETC1S oder UASTC ausgeliefert und passend zur Ziel-GPU transkodiert werden.',
'Skizziere die Verarbeitung: Originalgrafik → Qualitätsprüfung → JXL als optionale Archiv-/Webfassung → KTX2 oder ein anderes von der Engine unterstütztes Laufzeitformat.',
'Miss mehrere reale Testassets: Dateigröße auf Datenträger, Ladezeit, Speicherverbrauch, sichtbare Qualität und Unterstützung auf PC und Mobilgerät. Ein kleineres JXL bedeutet nicht automatisch weniger GPU-Speicher.'
],tasks:['Zeichne eine Asset-Pipeline für eine 3D-Umgebung mit PC- und Mobilziel.','Erkläre, warum JXL keine direkte Alternative zu GPU-Komprimierung ist.','Lege drei messbare Kriterien für einen fairen Formatvergleich fest.'],quiz:['Welches Format ist besonders für GPU-komprimierte 3D-Texturen vorgesehen?',['TXT','JXL als GPU-Bitstream','KTX2 mit Basis Universal','CSV'],2,'KTX2 mit Basis Universal ist ein etablierter Weg, Texturen in geeignete GPU-Formate zu transkodieren.']}
]}
];
const flat=tracks.flatMap(t=>t.lessons);
const ids=new Set(flat.map(x=>x.id));
const storageKey='sd-game-academy-progress-v1';
function load(){try{const s=JSON.parse(localStorage.getItem(storageKey)||'{}');return{done:Array.isArray(s.done)?s.done.filter(x=>ids.has(x)):[],tasks:s.tasks&&typeof s.tasks==='object'?s.tasks:{},quiz:s.quiz&&typeof s.quiz==='object'?s.quiz:{}};}catch(_){return{done:[],tasks:{},quiz:{}};}}
let state=load(),trackIndex=0,lessonIndex=0;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch(_){/* Learning still works without storage. */}}
function current(){return tracks[trackIndex].lessons[lessonIndex];}
function completed(id){return state.done.includes(id);}
function correct(l){return Number(state.quiz[l.id])===l.quiz[2]&&Object.hasOwn(state.quiz,l.id);}
function taskDone(l,i){return Boolean(state.tasks[l.id]&&state.tasks[l.id][i]);}
function allowed(l){return l.tasks.every((_,i)=>taskDone(l,i))&&correct(l);}
function renderProgress(){
 const n=state.done.filter(id=>ids.has(id)).length,p=Math.round(n/flat.length*100);
 $('progressCount').textContent=n+' von '+flat.length;
 $('progressPercent').textContent=p+' %';
 $('totalProgress').setAttribute('aria-valuenow',String(n));
 $('progressFill').style.width=p+'%';
}
function renderTracks(){
 $('trackList').innerHTML=tracks.map((t,i)=>{
 const n=t.lessons.filter(l=>completed(l.id)).length;
 return '<button class="track-button '+(i===trackIndex?'active':'')+'" type="button" data-track="'+i+'" aria-pressed="'+(i===trackIndex)+'"><span class="track-nr">'+String(i+1).padStart(2,'0')+'</span><span class="track-copy"><strong>'+esc(t.name.slice(5))+'</strong><small>'+esc(t.subtitle)+'</small></span><span class="track-count">'+n+'/'+t.lessons.length+'</span></button>';
 }).join('');
}
function renderLessons(){
 $('lessonList').innerHTML='<div class="lesson-list-title">LEKTIONEN DIESER KURSREIHE</div>'+tracks[trackIndex].lessons.map((l,i)=>{
 const done=completed(l.id);
 return '<button type="button" class="lesson-link '+(lessonIndex===i?'active':'')+'" data-lesson="'+i+'" aria-current="'+(lessonIndex===i?'step':'false')+'"><span class="bullet '+(done?'done':'')+'">'+(done?'✓':String(i+1).padStart(2,'0'))+'</span><span>'+esc(l.name)+'</span></button>';
 }).join('');
}
function renderLesson(){
 const l=current(),t=tracks[trackIndex],ans=Object.hasOwn(state.quiz,l.id)?Number(state.quiz[l.id]):-1,done=completed(l.id),mode=l.mode==='world',isJxl=l.mode==='jxl';
 $('lessonPosition').textContent='KURS '+String(trackIndex+1).padStart(2,'0')+' / LEKTION '+String(lessonIndex+1).padStart(2,'0');
 const steps=l.steps.map(s=>'<li>'+esc(s)+'</li>').join('');
 const tasks=l.tasks.map((s,i)=>'<label class="practice-check"><input type="checkbox" data-task="'+i+'" '+(taskDone(l,i)?'checked':'')+'><span>'+esc(s)+'</span></label>').join('');
 const choices=l.quiz[1].map((option,i)=>{
 let mark=ans===i?' selected':'';
 if(ans!==-1){if(i===l.quiz[2])mark+=' correct';else if(i===ans)mark+=' wrong';}
 return '<button type="button" class="answer'+mark+'" data-choice="'+i+'" aria-pressed="'+(ans===i)+'">'+String.fromCharCode(65+i)+'. '+esc(option)+'</button>';
 }).join('');
 const feedback=ans===-1?'Wähle eine Antwort, um eine Erklärung zu erhalten.':ans===l.quiz[2]?'✓ Richtig. '+l.quiz[3]:'Noch nicht richtig. Versuche es erneut und prüfe die Arbeitsschritte.';
 $('lessonBody').innerHTML='<div class="lesson-kicker">'+esc(t.name)+' · '+(mode?'GROSSWELT':isJxl?'BILD-ASSETS':'LEVEL-EDITOR')+'</div>'+
 '<h2>'+esc(l.name)+'</h2><p class="lesson-lead">'+esc(l.summary)+'</p>'+
 '<div class="lesson-info"><span>⏱ '+l.minutes+' Minuten (Richtwert)</span><span>Mit praktischer Aufgabe</span><span>Wissenscheck</span></div>'+
 '<div class="goal"><strong>DEIN LERNZIEL</strong><p>'+esc(l.goal)+'</p></div>'+
 '<h3>So gehst du vor</h3><ol class="steps">'+steps+'</ol>'+
 '<div class="action-callout"><div><strong>Direkt in der Software ausprobieren</strong><p>Die Lernseite bleibt getrennt von deinen Spielprojekten.</p></div><a href="'+(mode?WORLD:isJxl?JXL:EDITOR)+'" target="_blank" rel="noopener"> '+(mode?'Großwelt öffnen':isJxl?'JXL-Bildwerkzeug öffnen':'Level-Editor öffnen')+' ↗</a></div>'+
 '<section class="practice" aria-label="Praxisaufgaben"><h3>Deine Praxis-Checkliste</h3><p class="practice-intro">Setze jeden Punkt im Studio um und hake ihn danach selbst ab.</p><div class="practice-list">'+tasks+'</div></section>'+
 '<section class="quiz" aria-label="Wissenscheck"><span class="quiz-label">WISSENSCHECK</span><strong>'+esc(l.quiz[0])+'</strong><div class="answers">'+choices+'</div><div class="quiz-feedback '+(ans!==-1&&ans!==l.quiz[2]?'error':'')+'" role="status">'+esc(feedback)+'</div></section>'+
 '<div class="complete-wrap"><button type="button" class="complete-button" data-complete '+(!allowed(l)||done?'disabled':'')+'>'+(done?'✓ Lektion abgeschlossen':'Lektion abschließen')+'</button><span class="complete-help">'+(done?'Dein Fortschritt ist auf diesem Gerät hinterlegt.':allowed(l)?'Alle Aufgaben erledigt. Du kannst die Lektion abschließen.':'Schließe alle Praxisaufgaben und den Wissenscheck ab.')+'</span>'+(done?'<span class="complete-badge">✓ ERLEDIGT</span>':'')+'</div>';
 const index=flat.findIndex(x=>x.id===l.id);
 $('prevLesson').disabled=index===0;
 $('nextLesson').disabled=index===flat.length-1;
 $('nextLesson').textContent=index===flat.length-1?'Ende des Lernpfads':'Nächste Lektion →';
}
function render(){renderProgress();renderTracks();renderLessons();renderLesson();}
function choose(id,focus=false){
 const ti=tracks.findIndex(t=>t.lessons.some(l=>l.id===id));if(ti<0)return;
 trackIndex=ti;lessonIndex=tracks[ti].lessons.findIndex(l=>l.id===id);
 try{history.replaceState(null,'','#'+encodeURIComponent(id));}catch(_){}
 render();if(focus){$('lessonBody').focus({preventScroll:true});$('lessonBody').scrollIntoView({block:'start',behavior:'smooth'});}
}
$('trackList').addEventListener('click',e=>{
 const b=e.target.closest('[data-track]');if(!b)return;
 const t=tracks[Number(b.dataset.track)];if(t)choose(t.lessons[0].id);
});
$('lessonList').addEventListener('click',e=>{
 const b=e.target.closest('[data-lesson]');if(!b)return;
 const l=tracks[trackIndex].lessons[Number(b.dataset.lesson)];if(l)choose(l.id,true);
});
$('lessonBody').addEventListener('change',e=>{
 if(!e.target.matches('[data-task]'))return;
 const l=current(),i=Number(e.target.dataset.task);
 if(!Number.isInteger(i)||i<0||i>=l.tasks.length)return;
 if(!state.tasks[l.id]||typeof state.tasks[l.id]!=='object')state.tasks[l.id]={};
 state.tasks[l.id][i]=e.target.checked;save();renderLesson();
});
$('lessonBody').addEventListener('click',e=>{
 const answer=e.target.closest('[data-choice]');
 if(answer){
 const l=current(),i=Number(answer.dataset.choice);
 if(!Number.isInteger(i)||i<0||i>=l.quiz[1].length)return;
 state.quiz[l.id]=i;save();renderLesson();return;
 }
 const finish=e.target.closest('[data-complete]');
 if(finish){
 const l=current();if(!completed(l.id)&&allowed(l)){state.done.push(l.id);save();render();}
 }
});
function adjacent(delta){
 const pos=flat.findIndex(l=>l.id===current().id),l=flat[pos+delta];
 if(l)choose(l.id,true);
}
$('prevLesson').addEventListener('click',()=>adjacent(-1));
$('nextLesson').addEventListener('click',()=>adjacent(1));
$('resetProgress').addEventListener('click',()=>{
 if(!window.confirm('Nur deinen lokalen Academy-Lernfortschritt zurücksetzen? Gespeicherte Spielszenen bleiben unverändert.'))return;
 state={done:[],tasks:{},quiz:{}};try{localStorage.removeItem(storageKey);}catch(_){}
 choose(flat[0].id);
});
window.addEventListener('hashchange',()=>{
 const id=decodeURIComponent(location.hash.slice(1));if(ids.has(id)&&id!==current().id)choose(id);
});
const requested=decodeURIComponent(location.hash.slice(1));
choose(ids.has(requested)?requested:flat.find(l=>!completed(l.id))?.id||flat[0].id);
})();
