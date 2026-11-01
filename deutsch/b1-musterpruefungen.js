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
const matchingOffers=[
 ['A','Sprachcafé am Mittwoch','Kostenlos Deutsch sprechen, ohne Anmeldung. In der Stadtbibliothek ab 17 Uhr.'],
 ['B','Fahrradwerkstatt','Reparatur und Beratung für Fahrräder. Dienstags nachmittags, Ersatzteile kosten extra.'],
 ['C','Kinderbetreuung am Abend','Zuverlässige Betreuung für Kinder ab drei Jahren, auch freitags bis 22 Uhr.'],
 ['D','Wohnung nahe Bahnhof','Zwei Zimmer, zehn Minuten zu Fuß vom Bahnhof, ab sofort frei.'],
 ['E','Computerhilfe für Senioren','Geduldige Einführung in Smartphone und E-Mail, jeden Samstag kostenlos.'],
 ['F','Schwimmkurs für Anfänger','Abendkurs für Erwachsene, donnerstags um 18 Uhr im Hallenbad.'],
 ['G','Musikunterricht','Gitarrenunterricht für Erwachsene, montags nach der Arbeit.'],
 ['H','Gemeinschaftsgarten','Gemeinsam Gemüse anbauen, Treffen samstags um 10 Uhr.'],
 ['I','Beruflicher Buchhaltungskurs','Kurs am Abend, zweimal pro Woche, mit Teilnahmebescheinigung.'],
 ['J','Wandergruppe','Sonntags gemeinsam wandern, Treffpunkt am Hauptbahnhof.']
];
const matchingNeeds=[
 ['Du möchtest ohne Anmeldung Deutsch mit anderen Menschen üben.','A'],
 ['Dein Fahrrad ist kaputt. Du hast am Dienstag Zeit.','B'],
 ['Du brauchst am Freitagabend jemanden, der auf dein vierjähriges Kind aufpasst.','C'],
 ['Du suchst eine kleine Wohnung, von der aus du zu Fuß zum Bahnhof gehen kannst.','D'],
 ['Deine Großmutter möchte lernen, wie man E-Mails verschickt.','E'],
 ['Du kannst noch nicht schwimmen und hast donnerstags abends Zeit.','F'],
 ['Du arbeitest tagsüber und möchtest Gitarre lernen.','G'],
 ['Du möchtest am Samstag gemeinsam mit anderen Gemüse anbauen.','H'],
 ['Du willst nach der Arbeit Buchhaltung lernen.','I'],
 ['Du möchtest am Sonntag mit einer Gruppe draußen unterwegs sein.','J']
];
const readingClaims=[
 ['Lara möchte prüfen, wie sie abends von der Wohnung nach Hause kommt.','Lara hat die Wohnung bereits gemietet.'],
 ['Für die Smartphone-Beratung muss man sich spätestens am Donnerstag anmelden.','Alle Teilnehmenden müssen ein eigenes Smartphone mitbringen.'],
 ['Der Betriebsausflug findet als Wanderung statt.','Die Firma hat sich für eine Radtour entschieden.'],
 ['Im Sprachcafé dürfen die Teilnehmenden selbst Gesprächsthemen vorschlagen.','Im Sprachcafé bekommen alle Teilnehmenden Noten.'],
 ['Morgens dürfen private Autos nicht mehr bis zum Schuleingang fahren.','Die Schule empfiehlt allen Eltern, ihre Kinder direkt mit dem Auto zum Eingang zu bringen.'],
 ['Im Reparaturcafé müssen Besucher eventuell Ersatzteile bezahlen.','Das Reparaturcafé garantiert, dass jedes Gerät repariert wird.'],
 ['Während der Bauarbeiten bleibt der Weg zum See offen.','Während der Bauarbeiten ist auch das Café geschlossen.'],
 ['Miriam lernt inzwischen nach einem festen Zeitplan.','Miriam besucht den Buchhaltungskurs am Morgen.'],
 ['Bei starkem Wind findet der Regionalmarkt in einer Halle statt.','Bei starkem Wind fällt der Regionalmarkt vollständig aus.'],
 ['Für die Buchausleihe benötigt man einen Bibliotheksausweis.','In den ruhigen Lernräumen darf man telefonieren.'],
 ['Für die Workshops am Gesundheitstag muss man sich anmelden.','Für die Vorträge ist eine Anmeldung erforderlich.'],
 ['An der Paketstation kann man Sendungen auch außerhalb der Öffnungszeiten abholen.','Große Pakete passen in die neue Paketstation.'],
 ['Bei schlechtem Wetter findet das Nachbarschaftsfest im Gemeindehaus statt.','Alle Gäste müssen ihre Getränke selbst mitbringen.'],
 ['Während der Bauphase gibt es eine ausgeschilderte Umleitung für Radfahrer.','Der neue Radweg ist ausschließlich für Touristen gedacht.'],
 ['Die Musikschule bietet seit September auch Kurse für Erwachsene an.','Man kann die Instrumente ein ganzes Jahr kostenlos ausleihen.']
];
const readingTexts=[
 ['Wohnungssuche','Seit drei Monaten sucht Lara eine größere Wohnung. Sie arbeitet im Krankenhaus und möchte deshalb nicht weit von der Arbeit entfernt wohnen. Gestern hat sie eine Wohnung besichtigt, die hell und ruhig ist. Die Miete passt zu ihrem Budget, aber die Bushaltestelle liegt zwanzig Minuten zu Fuß entfernt. Lara möchte deshalb vor ihrer Entscheidung noch prüfen, wie sie abends nach Hause kommt.','Was möchte Lara vor ihrer Entscheidung prüfen?','Die Verbindung am Abend','Die Öffnungszeiten des Krankenhauses','Die Farbe der Wände'],
 ['Freiwilligenarbeit','Im Nachbarschaftszentrum helfen jeden Samstag Freiwillige älteren Menschen beim Umgang mit Smartphones. Wer teilnehmen möchte, muss kein eigenes Gerät besitzen, denn das Zentrum stellt einige Geräte bereit. Die Beratung ist kostenlos. Weil die Plätze begrenzt sind, ist eine Anmeldung bis Donnerstag erforderlich.','Was müssen Interessierte tun?','Sich bis Donnerstag anmelden','Ein neues Smartphone kaufen','Am Freitag bezahlen'],
 ['Betriebsausflug','Die Firma Sommer plant einen Ausflug für ihre Mitarbeiter. Ursprünglich war eine Radtour vorgesehen. Da einige Kollegen nicht Fahrrad fahren können, hat sich das Team für eine Wanderung entschieden. Am Ziel gibt es ein gemeinsames Mittagessen. Wer besondere Ernährungswünsche hat, soll diese bis Montag der Personalabteilung mitteilen.','Warum wurde der Plan geändert?','Nicht alle können Fahrrad fahren','Das Restaurant ist geschlossen','Die Fahrräder sind zu teuer'],
 ['Sprachcafé','Das Sprachcafé in der Stadtbibliothek findet jeden zweiten Mittwoch statt. Menschen mit verschiedenen Muttersprachen treffen sich dort, um gemeinsam Deutsch zu sprechen. Es gibt keine Lehrkraft und keine Noten. Die Teilnehmenden schlagen selbst Themen vor. Wer zum ersten Mal kommt, kann ohne Anmeldung teilnehmen.','Was ist das Besondere am Sprachcafé?','Die Teilnehmenden wählen Gesprächsthemen','Alle müssen eine Prüfung schreiben','Nur Lehrkräfte dürfen sprechen'],
 ['Schulweg','An der Grundschule in der Gartenstraße wurde die Verkehrssituation lange kritisiert. Viele Eltern brachten ihre Kinder mit dem Auto direkt bis zum Eingang. Nun ist die Straße morgens für private Autos gesperrt. Die Schule empfiehlt, die Kinder zu Fuß zu begleiten oder die neue Haltestelle zwei Straßen weiter zu nutzen.','Was ist morgens nicht mehr erlaubt?','Mit dem Privatauto bis zum Schuleingang fahren','Die Kinder zu Fuß begleiten','An der neuen Haltestelle aussteigen'],
 ['Reparaturcafé','Einmal im Monat organisiert der Verein Zukunft ein Reparaturcafé. Ehrenamtliche prüfen kaputte Lampen, kleine Haushaltsgeräte und Fahrräder. Die Hilfe kostet nichts; notwendige Ersatzteile müssen Besucher selbst bezahlen. Das Team verspricht nicht, dass jedes Gerät repariert werden kann. Mit dem Angebot möchte der Verein Abfall vermeiden.','Was bezahlen Besucher möglicherweise?','Ersatzteile','Die Beratung','Den Eintritt'],
 ['Stadtpark','Der Stadtpark bekommt einen neuen Spielbereich. Während der Bauarbeiten bleiben die Wege zum See geöffnet, doch die große Wiese kann vorübergehend nicht benutzt werden. Die Stadt rechnet damit, dass die Arbeiten Ende August abgeschlossen sind. Ein kleines Café am Eingang bleibt während der gesamten Zeit geöffnet.','Was ist während der Bauarbeiten gesperrt?','Die große Wiese','Die Wege zum See','Das Café am Eingang'],
 ['Berufliche Weiterbildung','Miriam arbeitet seit fünf Jahren im Einzelhandel. Sie möchte sich beruflich weiterentwickeln und besucht deshalb abends einen Kurs in Buchhaltung. Anfangs fiel es ihr schwer, nach der Arbeit noch zu lernen. Inzwischen hat sie feste Lernzeiten eingerichtet und tauscht sich regelmäßig mit anderen Kursteilnehmern aus.','Was hilft Miriam beim Lernen?','Feste Lernzeiten und Austausch','Weniger Kontakt zu anderen','Ein neuer Arbeitsplatz am Morgen'],
 ['Regionalmarkt','Auf dem Regionalmarkt bieten Bauern aus der Umgebung Gemüse, Obst und Käse an. Seit diesem Frühjahr können Kunden eigene Behälter für einige Produkte mitbringen. Der Markt findet auch bei Regen statt, allerdings ziehen die Stände bei starkem Wind in die benachbarte Halle um. Die Öffnungszeiten bleiben dabei gleich.','Was passiert bei starkem Wind?','Die Stände ziehen in eine Halle','Der Markt fällt aus','Der Markt beginnt später'],
 ['Öffentliche Bibliothek','Die Stadtbibliothek hat ihren Lernbereich modernisiert. Besucher können dort kostenlos Arbeitsplätze reservieren und das WLAN nutzen. Für die Ausleihe von Büchern ist weiterhin ein Bibliotheksausweis nötig. Besonders beliebt sind die neuen ruhigen Räume, in denen telefonieren ausdrücklich nicht erlaubt ist.','Wofür braucht man einen Bibliotheksausweis?','Um Bücher auszuleihen','Um das WLAN zu nutzen','Um einen Arbeitsplatz zu reservieren'],
 ['Gesundheitstag','Am Samstag organisiert das Bürgerhaus einen Gesundheitstag. Es gibt kurze Vorträge über Ernährung, Bewegung und Schlaf. Die Teilnahme ist kostenlos. Für die Workshops ist eine Anmeldung notwendig, weil nur wenige Plätze verfügbar sind. Die Vorträge können dagegen ohne Anmeldung besucht werden.','Für welches Angebot ist eine Anmeldung nötig?','Für die Workshops','Für alle Vorträge','Für den Eintritt ins Bürgerhaus'],
 ['Paketstation','Die Post hat am Bahnhof eine neue Paketstation eingerichtet. Kunden können dort Sendungen auch außerhalb der Öffnungszeiten abholen. Dafür benötigen sie einen Abholcode auf ihrem Handy. Große Pakete müssen weiterhin in der Filiale abgeholt werden, weil die Fächer der Station dafür nicht ausreichen.','Welche Pakete müssen in der Filiale abgeholt werden?','Große Pakete','Alle kleinen Pakete','Alle Pakete am Wochenende'],
 ['Nachbarschaftsfest','Beim Nachbarschaftsfest sollen sich Menschen aus verschiedenen Straßen kennenlernen. Die Organisatoren bitten alle Gäste, nach Möglichkeit etwas für das gemeinsame Buffet mitzubringen. Getränke stellt der Verein bereit. Bei schlechtem Wetter findet das Fest im Gemeindehaus statt, sonst auf dem Platz vor der Kirche.','Wer stellt die Getränke bereit?','Der Verein','Die einzelnen Gäste','Die Stadtbibliothek'],
 ['Radweg','Die Stadt baut einen neuen Radweg zwischen dem Bahnhof und dem Industriegebiet. Er soll vor allem Menschen helfen, die mit dem Fahrrad zur Arbeit fahren. Während der Bauphase müssen Radfahrer eine ausgeschilderte Umleitung nutzen. Die Stadt veröffentlicht aktuelle Informationen auf ihrer Internetseite.','Wer soll besonders vom neuen Radweg profitieren?','Menschen auf dem Arbeitsweg','Nur Touristen','Ausschließlich Kinder'],
 ['Musikunterricht','Seit September bietet die Musikschule auch Unterricht für Erwachsene an. Die Kurse finden abends statt, damit Berufstätige teilnehmen können. Instrumente können für die ersten vier Wochen ausgeliehen werden. Danach müssen die Teilnehmenden ein eigenes Instrument mitbringen oder eines dauerhaft mieten.','Wie lange kann man anfangs ein Instrument ausleihen?','Vier Wochen','Vier Monate','Ein ganzes Jahr']
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
const oralCards=[
 {topic:'Ein gemeinsamer Ausflug',goal:'Ihr organisiert einen Ausflug für eine Gruppe von acht Personen.',points:['Wohin und warum?','Wann und wie lange?','Anreise und Treffpunkt?','Kosten und Verpflegung?'],partner:'Ich würde lieber mit dem Zug fahren. Was meinst du?'},
 {topic:'Eine Geburtstagsfeier',goal:'Ihr plant eine kleine Überraschungsfeier für eine Freundin.',points:['Ort und Termin?','Gäste einladen?','Essen und Getränke?','Geschenk und Aufgabenverteilung?'],partner:'Wir könnten zu Hause feiern. Hast du eine andere Idee?'},
 {topic:'Ein Besuch bei Freunden',goal:'Ihr möchtet gemeinsam Freunde in einer anderen Stadt besuchen.',points:['Termin vereinbaren?','Fahrt organisieren?','Mitbringsel?','Programm vor Ort?'],partner:'Ich habe nur am Samstag Zeit. Passt dir das?'},
 {topic:'Ein Lerntreffen',goal:'Ihr plant ein regelmäßiges Lerntreffen für eine Deutschprüfung.',points:['Ort und Uhrzeit?','Welche Themen üben?','Materialien mitbringen?','Wie oft treffen?'],partner:'Ich möchte besonders das Sprechen üben. Und du?'},
 {topic:'Ein Sportnachmittag',goal:'Ihr organisiert einen Sportnachmittag für euren Verein.',points:['Welche Sportarten?','Ort und Wetteralternative?','Teilnehmer informieren?','Getränke und Material?'],partner:'Vielleicht brauchen wir auch einen Raum bei Regen. Was schlägst du vor?'}
];
const presentationCards=[
 {topic:'Öffentliche Verkehrsmittel oder Auto?',experience:'Wie bist du früher zur Schule oder Arbeit gefahren?',compare:'Vergleiche Kosten, Umwelt und Bequemlichkeit.'},
 {topic:'Online einkaufen oder im Geschäft?',experience:'Erzähle von einem Einkauf, den du gut oder schlecht fandest.',compare:'Vergleiche Auswahl, Beratung und Rückgabe.'},
 {topic:'Gesund leben im Alltag',experience:'Welche Gewohnheit hilft dir persönlich?',compare:'Sprich über Bewegung, Ernährung und Zeit.'},
 {topic:'Deutsch lernen mit anderen',experience:'Wie lernst du am liebsten?',compare:'Vergleiche Lernen allein, im Kurs und mit Freunden.'},
 {topic:'Wohnen in der Stadt oder auf dem Land?',experience:'Wo hast du schon gewohnt?',compare:'Vergleiche Verkehr, Ruhe und Freizeitangebote.'}
];
const listeningScenes=[
 ['Bahnhof','Guten Tag, hier ist die Reiseauskunft. Der Regionalzug nach Mannheim fährt heute ausnahmsweise von Gleis sieben statt Gleis vier. Wegen Bauarbeiten kann sich die Ankunft um ungefähr zehn Minuten verspäten. Bitte achten Sie auf die Anzeigen am Bahnsteig.'],
 ['Kursanmeldung','Guten Morgen, Frau Kaya. Sie hatten nach dem Abendkurs gefragt. Der Kurs beginnt am 14. April, jeweils montags und mittwochs um 18 Uhr. Bitte bringen Sie zum ersten Termin Ihren Ausweis und einen Stift mit. Die Kursgebühr können Sie auch in zwei Raten bezahlen.'],
 ['Arbeit','Hallo Samir, ich bin es, Jana. Unser Treffen mit dem Kunden findet nicht um neun, sondern um halb elf statt. Wir sehen uns direkt im Besprechungsraum im zweiten Stock. Bitte bring die aktuellen Unterlagen mit. Ruf mich an, falls du später kommst.'],
 ['Stadtfest','Liebe Besucherinnen und Besucher, das Stadtfest beginnt am Samstag um elf Uhr auf dem Marktplatz. Das Kinderprogramm findet im Park statt. Wegen der Wettervorhersage wird das Konzert am Abend in die Stadthalle verlegt. Der Eintritt ist überall frei.'],
 ['Arzttermin','Guten Tag, hier spricht die Praxis Berger. Wir müssen Ihren Termin am Donnerstag leider verschieben. Wir können Ihnen stattdessen Freitag um 10:15 Uhr anbieten. Bitte bestätigen Sie den neuen Termin telefonisch bis morgen Mittag. Vielen Dank.'],
 ['Wohnung','Guten Abend, Frau Weber. Die Besichtigung in der Lindenstraße findet morgen um 17 Uhr statt. Der Vermieter erwartet Sie am Hauseingang. Die Wohnung liegt im dritten Stock. Bitte bringen Sie keine Unterlagen mit; wir besprechen alles zunächst vor Ort.'],
 ['Schule','Liebe Eltern, am kommenden Dienstag findet unser Informationsabend statt. Wir beginnen um 19 Uhr in der Aula. Es geht um die Klassenfahrt im Juni und die Kosten. Eine Anmeldung ist nicht nötig, aber wir freuen uns über eine kurze Nachricht, wenn Sie nicht kommen können.'],
 ['Einkauf','Guten Tag und willkommen in unserem Kaufhaus. Heute erhalten Sie auf alle Winterjacken zwanzig Prozent Rabatt. Die Aktion gilt nur bis 18 Uhr. Bitte beachten Sie, dass reduzierte Waren ausschließlich an der Kasse im Erdgeschoss bezahlt werden können.'],
 ['Freizeit','Hallo Lea, möchtest du am Sonntag mit uns wandern gehen? Wir treffen uns um neun Uhr am Bahnhof und fahren gemeinsam mit dem Bus. Nimm bitte etwas zu trinken und eine Regenjacke mit. Wenn es stark regnet, gehen wir stattdessen ins Museum.'],
 ['Verein','Liebe Mitglieder, die Mitgliederversammlung wird auf den nächsten Freitag verschoben. Beginn ist um 18:30 Uhr im Gemeinschaftshaus. Wir sprechen über neue Projekte und wählen einen Vorstand. Wer nicht kommen kann, darf Vorschläge per E-Mail schicken.']
];
const extraListening=[
 {title:'Bibliotheksführung',dialogue:[['Mitarbeiterin','Willkommen in unserer Stadtbibliothek. Sie können im Erdgeschoss Bücher ausleihen und im ersten Stock in Ruhe lernen.'],['Besucher','Brauche ich für die Lernplätze einen Bibliotheksausweis?'],['Mitarbeiterin','Nein, die Lernplätze sind kostenlos. Für das Ausleihen von Büchern brauchen Sie allerdings einen Ausweis.'],['Besucher','Und wie lange darf ich die Bücher behalten?'],['Mitarbeiterin','Normalerweise vier Wochen. Sie können die Frist einmal online verlängern, wenn niemand das Buch reserviert hat.'],['Besucher','Kann ich hier auch drucken?'],['Mitarbeiterin','Ja, im Erdgeschoss. Das Drucken kostet zehn Cent pro Seite.']],questions:[['Wo befinden sich die ruhigen Lernplätze?','Im ersten Stock','Im Erdgeschoss','Im Keller'],['Wofür benötigt man einen Bibliotheksausweis?','Für die Buchausleihe','Für die Lernplätze','Für den Eingang'],['Wie lange darf man Bücher normalerweise ausleihen?','Vier Wochen','Eine Woche','Zwei Monate']]},
 {title:'Bewerbungsgespräch',dialogue:[['Personalleiter','Guten Morgen, Frau Neumann. Sie haben sich für die Stelle im Kundenservice beworben. Haben Sie schon Erfahrung?'],['Bewerberin','Ja, ich habe zwei Jahre in einem Geschäft gearbeitet und dort täglich Kunden beraten.'],['Personalleiter','Unsere Arbeitszeit beginnt meistens um acht Uhr. Einmal pro Woche gibt es eine Spätschicht bis 19 Uhr. Wäre das möglich?'],['Bewerberin','Ja, das kann ich einrichten. Gibt es eine Einarbeitung?'],['Personalleiter','Natürlich. Die ersten zwei Wochen arbeiten Sie mit einer erfahrenen Kollegin zusammen.'],['Bewerberin','Wann könnte ich anfangen?'],['Personalleiter','Frühestens am ersten September. Wir melden uns bis nächsten Mittwoch bei Ihnen.']],questions:[['Wo hat die Bewerberin früher gearbeitet?','In einem Geschäft','In einer Schule','In einer Arztpraxis'],['Wie lange dauert die Einarbeitung?','Zwei Wochen','Zwei Tage','Zwei Monate'],['Bis wann erhält die Bewerberin eine Rückmeldung?','Bis nächsten Mittwoch','Bis morgen','Bis nächsten Freitag']]},
 {title:'Elternabend zur Klassenfahrt',dialogue:[['Lehrerin','Vielen Dank, dass Sie heute gekommen sind. Die Klassenfahrt nach Freiburg findet vom 12. bis 15. Juni statt.'],['Vater','Wie fahren die Kinder dorthin?'],['Lehrerin','Wir fahren gemeinsam mit dem Zug. Treffpunkt ist um 7:30 Uhr am Haupteingang des Bahnhofs.'],['Mutter','Wie viel kostet die Fahrt insgesamt?'],['Lehrerin','Mit Unterkunft und Verpflegung sind es 180 Euro pro Kind. Bitte überweisen Sie das Geld bis zum 20. Mai.'],['Vater','Müssen die Kinder Bettwäsche mitnehmen?'],['Lehrerin','Nein, die Jugendherberge stellt Bettwäsche bereit. Wichtig sind feste Schuhe und eine Regenjacke.']],questions:[['Wie reisen die Kinder nach Freiburg?','Mit dem Zug','Mit dem Bus','Mit dem Flugzeug'],['Wie viel kostet die Klassenfahrt pro Kind?','180 Euro','80 Euro','280 Euro'],['Was sollen die Kinder mitnehmen?','Feste Schuhe und Regenjacke','Eigene Bettwäsche','Einen Schlafsack']]},
 {title:'Gespräch im Bürgerbüro',dialogue:[['Mitarbeiter','Guten Tag, was kann ich für Sie tun?'],['Besucherin','Ich bin vor zwei Wochen umgezogen und möchte meine neue Adresse anmelden.'],['Mitarbeiter','Haben Sie einen Termin vereinbart?'],['Besucherin','Ja, für heute um 11 Uhr. Welche Unterlagen brauchen Sie?'],['Mitarbeiter','Ihren Personalausweis und die Wohnungsgeberbestätigung. Das Formular können Sie hier ausfüllen.'],['Besucherin','Kostet die Anmeldung etwas?'],['Mitarbeiter','Nein, die Anmeldung ist kostenlos. Wenn alle Unterlagen vollständig sind, dauert es ungefähr zehn Minuten.'],['Besucherin','Vielen Dank, dann fülle ich das Formular gleich aus.']],questions:[['Warum kommt die Besucherin ins Bürgerbüro?','Um ihre neue Adresse anzumelden','Um einen Führerschein zu beantragen','Um ein Paket abzuholen'],['Welches Dokument wird benötigt?','Die Wohnungsgeberbestätigung','Ein Schulzeugnis','Eine Fahrkarte'],['Was kostet die Anmeldung?','Nichts','Zehn Euro','Zwanzig Euro']]}
];
const listeningDialogues=[
 ['Kursberatung',[
 ['Beraterin','Guten Morgen. Sie interessieren sich für unseren Abendkurs?'],
 ['Teilnehmer','Ja. Ich arbeite tagsüber. Wann beginnt der Kurs?'],
 ['Beraterin','Am 14. April. Wir treffen uns montags und mittwochs um 18 Uhr.'],
 ['Teilnehmer','Muss ich einen Laptop mitbringen?'],
 ['Beraterin','Nein, aber bitte Ihren Ausweis und einen Stift.']
 ],['Wann beginnt der Kurs?','An welchen Tagen findet der Kurs statt?','Was soll man mitbringen?']],
 ['Arbeitstreffen',[
 ['Kollegin','Hallo Samir, unser Treffen mit dem Kunden wurde verschoben.'],
 ['Kollege','Findet es immer noch um neun Uhr statt?'],
 ['Kollegin','Nein, erst um halb elf, im Besprechungsraum im zweiten Stock.'],
 ['Kollege','Soll ich etwas vorbereiten?'],
 ['Kollegin','Bitte bring die aktuellen Unterlagen mit.']
 ],['Wann findet das Treffen statt?','Wo trifft sich das Team?','Was soll Samir mitbringen?']],
 ['Wohnungsbesichtigung',[
 ['Vermieter','Guten Abend, Frau Weber. Können Sie morgen um 17 Uhr kommen?'],
 ['Interessentin','Ja. Wo treffen wir uns?'],
 ['Vermieter','Direkt am Hauseingang in der Lindenstraße.'],
 ['Interessentin','Soll ich schon meine Unterlagen mitbringen?'],
 ['Vermieter','Nein, wir besprechen zunächst alles vor Ort.']
 ],['Wann ist die Besichtigung?','Wo wartet der Vermieter?','Muss man Unterlagen mitbringen?']],
 ['Sonntagsausflug',[
 ['Freundin','Hallo Lea, kommst du am Sonntag mit uns wandern?'],
 ['Freund','Gerne. Wo treffen wir uns?'],
 ['Freundin','Um neun Uhr am Bahnhof. Wir fahren von dort mit dem Bus.'],
 ['Freund','Was soll ich mitnehmen?'],
 ['Freundin','Etwas zu trinken und eine Regenjacke. Bei starkem Regen gehen wir ins Museum.']
 ],['Wo ist der Treffpunkt?','Was sollen die Teilnehmer mitnehmen?','Was passiert bei starkem Regen?']]
];
const dialogueSceneIndices=[1,2,5,8];
const listeningPrompts=[
 ['Wovon handelt die Durchsage?','Was ändert sich?','Was sollen die Fahrgäste beachten?'],
 ['Wann beginnt der Kurs?','An welchen Tagen findet der Kurs statt?','Was soll man mitbringen?'],
 ['Wann findet das Treffen statt?','Wo trifft sich das Team?','Was soll Samir mitbringen?'],
 ['Wo findet das Abendkonzert statt?','Wann beginnt das Fest?','Was kostet der Eintritt?'],
 ['Welcher neue Termin wird angeboten?','Was sollen die Patienten tun?','Wer ruft an?'],
 ['Wann ist die Besichtigung?','Wo wartet der Vermieter?','Was muss man mitbringen?'],
 ['Wann beginnt der Elternabend?','Wo findet er statt?','Worum geht es?'],
 ['Welche Waren sind reduziert?','Wie hoch ist der Rabatt?','Wo bezahlt man?'],
 ['Wo ist der Treffpunkt?','Was sollen die Teilnehmer mitnehmen?','Was passiert bei starkem Regen?'],
 ['Wann ist die Versammlung?','Wo findet sie statt?','Was können Abwesende tun?']
];
const listeningAnswers=[
 [['Eine Zugänderung','Ein neues Restaurant','Eine Schulprüfung'],['Das Gleis','Der Ticketpreis','Der Bahnhof'],['Die Anzeigen am Bahnsteig','Die Speisekarte','Den Wetterbericht']],
 [['Am 14. April','Am 14. Mai','Am 4. April'],['Montags und mittwochs','Dienstags und donnerstags','Nur samstags'],['Ausweis und Stift','Laptop und Kopfhörer','Sportkleidung']],
 [['Um halb elf','Um neun','Um zwölf'],['Im zweiten Stock','Im Erdgeschoss','Am Bahnhof'],['Aktuelle Unterlagen','Einen Kuchen','Seinen Reisepass']],
 [['In der Stadthalle','Im Park','Auf dem Marktplatz'],['Um elf Uhr','Um acht Uhr','Um 19 Uhr'],['Nichts','Fünf Euro','Zehn Euro']],
 [['Freitag um 10:15 Uhr','Donnerstag um 10:15 Uhr','Freitag um 15 Uhr'],['Telefonisch bestätigen','Persönlich vorbeikommen','Eine Rechnung bezahlen'],['Eine Arztpraxis','Eine Schule','Ein Geschäft']],
 [['Morgen um 17 Uhr','Heute um 17 Uhr','Morgen um 19 Uhr'],['Am Hauseingang','In der Küche','An der Bushaltestelle'],['Nein, noch nicht','Ja, eine Gehaltsabrechnung','Ja, ein Passfoto']],
 [['Um 19 Uhr','Um 17 Uhr','Um 20 Uhr'],['In der Aula','Im Park','In der Mensa'],['Um eine Klassenfahrt','Um einen Umzug','Um ein Sportfest']],
 [['Winterjacken','Schuhe','Schulbücher'],['Zwanzig Prozent','Zehn Prozent','Dreißig Prozent'],['Im Erdgeschoss','Im ersten Stock','Online']],
 [['Am Bahnhof','Am Rathaus','Im Museum'],['Getränk und Regenjacke','Fahrrad und Helm','Laptop und Heft'],['Sie gehen ins Museum','Sie bleiben im Bahnhof','Sie fahren ans Meer']],
 [['Am Freitag','Am Montag','Am Mittwoch'],['Im Gemeinschaftshaus','Im Rathaus','In der Schule'],['Vorschläge per E-Mail schicken','Nur telefonisch abstimmen','Nichts mitteilen']]
];
const grammarLetters=[
 ['E-Mail an einen Sprachkurs','Guten Tag,\\n\\nich interessiere mich sehr [1] Ihren Deutschkurs. Ich habe Ihre Anzeige gestern [2] Internet gelesen. Da ich tagsüber arbeite, suche ich einen Kurs, [3] am Abend stattfindet. Können Sie mir bitte sagen, [4] der nächste Kurs beginnt? Außerdem möchte ich wissen, [5] die Anmeldung online möglich ist. Ich lerne seit [6] Jahr Deutsch und möchte meine Kenntnisse verbessern. Besonders wichtig ist mir, [7] ich mehr sprechen kann. Falls noch Plätze frei [8], würde ich mich gern anmelden. Bitte schicken Sie mir die Informationen [9] E-Mail. Vielen Dank [10] Ihre Hilfe.\\n\\nMit freundlichen Grüßen\\nSamira Kaya',[
 ['für','an','über'],['im','am','zum'],['der','den','dem'],['wann','weil','dass'],['ob','als','denn'],['einem','einen','ein'],['dass','weil','obwohl'],['sind','ist','sein'],['per','mit','aus'],['für','an','über']]],
 ['Nachricht über einen Umzug','Liebe Mia,\\n\\nendlich habe ich eine neue Wohnung [1]. Sie liegt nicht weit [2] meiner Arbeitsstelle. Ich bin froh, [3] ich jetzt nicht mehr so lange fahren muss. Am Samstag möchte ich [4] meine Möbel transportieren. Könntest du mir vielleicht [5]? Wir treffen uns um neun Uhr [6] dem alten Haus. Wenn wir früh anfangen, [7] wir am Nachmittag fertig. Ich habe auch meinen Bruder gefragt, [8] er Zeit hat. Nach dem Umzug lade ich alle [9] ein gemeinsames Essen ein. Bitte gib mir bis Donnerstag [10].\\n\\nViele Grüße\\nLena',[
 ['gefunden','finden','findet'],['von','mit','bei'],['dass','ob','denn'],['alle','alles','aller'],['helfen','hilfst','geholfen'],['vor','auf','in'],['sind','haben','werden'],['ob','weil','dass'],['zu','für','bei'],['Bescheid','Antworten','Nachrichtens']]],
 ['Bitte um einen neuen Termin','Sehr geehrte Frau Berger,\\n\\nleider kann ich meinen Termin am Dienstag nicht [1], weil ich an diesem Tag arbeiten [2]. Ich möchte mich dafür [3]. Wäre es möglich, [4] Termin zu vereinbaren? Am Donnerstag hätte ich [5] Nachmittag Zeit. Falls das nicht möglich ist, [6] ich auch am Freitag kommen. Bitte teilen Sie mir mit, [7] Termine noch frei sind. Ich freue mich [8] Ihre Antwort und bedanke mich [9] Voraus für Ihre Mühe.\\n\\nMit freundlichen [10]\\nAli Demir',[
 ['wahrnehmen','wahrgenommen','nimmt'],['muss','müssen','musste'],['entschuldigen','entschuldigt','Entschuldigung'],['einen neuen','einem neuen','ein neuer'],['am','im','um'],['könnte','kannst','können'],['welche','welcher','welches'],['auf','für','an'],['im','am','zum'],['Grüßen','Gruß','Grüße']]],
 ['Informationen zum Vereinsfest','Liebe Mitglieder,\\n\\nunser Vereinsfest findet [1] Samstag statt. Wir beginnen um 14 Uhr, [2] alle Familien teilnehmen können. Wer einen Kuchen [3] möchte, meldet sich bitte bis Mittwoch. Wir brauchen außerdem Personen, [4] beim Aufbau helfen. Die Tische werden schon am Freitag [5]. Bitte bringt auch Teller und Besteck [6]. Sollte es stark regnen, feiern wir [7] Vereinsraum. Wir freuen uns sehr, [8] viele Gäste kommen. Für Fragen könnt ihr euch jederzeit [9] uns wenden. Vielen Dank [10] eure Unterstützung!\\n\\nEuer Organisationsteam',[
 ['am','im','um'],['damit','weil','trotzdem'],['mitbringen','mitgebracht','mitbringt'],['die','der','den'],['aufgestellt','aufstellen','stellt'],['mit','nach','bei'],['im','am','zum'],['dass','ob','denn'],['an','auf','für'],['für','mit','von']]],
 ['Bewerbung für ein Praktikum','Sehr geehrte Damen und Herren,\\n\\nich habe Ihre Anzeige für ein Praktikum [1] Ihrer Webseite gelesen. Zurzeit besuche ich einen Deutschkurs und möchte [2] Berufserfahrung sammeln. Besonders interessiere ich mich [3] die Arbeit in Ihrem Unternehmen. Ich habe bereits sechs Monate [4] einem Geschäft gearbeitet. Dort war ich [5] die Kundenberatung verantwortlich. Über die Möglichkeit eines Gesprächs würde ich mich sehr [6]. Könnten Sie mir bitte mitteilen, [7] Unterlagen Sie benötigen? Meinen Lebenslauf kann ich Ihnen sofort [8]. Ich bin ab Mai verfügbar und freue mich [9] Ihre Rückmeldung.\\n\\nMit freundlichen [10]\\nNora Özdemir',[
 ['auf','bei','zu'],['mehr','viele','mehrere'],['für','mit','an'],['in','auf','zu'],['für','auf','an'],['freuen','freut','gefreut'],['welche','welcher','welches'],['schicken','geschickt','schickt'],['auf','an','über'],['Grüßen','Gruß','Grüße']]]
];
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
let exam='dtz',set=1,part=0,idx=0,answers=[],began=0,tick=null,root=null,host=null,results={},running=false,deadline=0,plays=0,telcSharedDeadline=0,pendingChoice=null;
const k=(n,s)=>themes[(n+s*7)%themes.length];
function items(section){
 const [id,,minutes,groups,kinds]=section;const result=[];
 groups.forEach((count,g)=>{for(let j=0;j<count;j++){
   const n=result.length,base=k(n+g*3,set-1),shift=(n+set)%3;
   if(id==='lesen'||id==='hoeren'||id==='sprach'){
     if(id==='sprach'){
       const letter=grammarLetters[(set-1+g)%grammarLetters.length];
       const correctOptions=letter[2][j],options=correctOptions.slice(),correct=options[0],pos=(n+set)%3;
       options[0]=options[pos];options[pos]=correct;
       result.push({g,j,q:'Welche Ergänzung passt in Lücke '+(j+1)+'?',options,answer:pos,passage:letter[0]+'\\n\\n'+letter[1],kind:kinds[g]+' · zusammenhängender Text'});
       continue;
     }
     if(id==='hoeren'){
       // Gesprächsgruppen unterscheiden sich je nach Prüfungsanbieter.
       // Die übrigen Gruppen trainieren Durchsagen und kurze Mitteilungen.
       const dialogueGroups={goethe:[1,3],telc:[1],dtz:[1,3]};
       const useExtendedDialogue=dialogueGroups[exam].includes(g);
       const extraIndex=(g+Math.floor(j/3)+set-1)%extraListening.length;
       if(useExtendedDialogue){
         const ex=extraListening[extraIndex],qIndex=j%3,question=ex.questions[qIndex];
         const options=question.slice(1),correct=options[0],pos=(n+set)%3;
         options[0]=options[pos];options[pos]=correct;
         const audio=ex.dialogue.map(turn=>turn[0]+': '+turn[1]).join(' ');
         result.push({g,j,q:question[0],options,answer:pos,passage:audio,audio,dialogue:ex.dialogue,kind:kinds[g]+' · Gespräch'});
         continue;
       }
       const sceneIndex=(g*3+Math.floor(j/3)+(set-1)*2)%listeningScenes.length;
       const scene=listeningScenes[sceneIndex],qIndex=j%3,options=listeningAnswers[sceneIndex][qIndex].slice();
       const correct=options[0],pos=(n+set)%3;options[0]=options[pos];options[pos]=correct;
       // Bei Mitteilungen wird exakt der Text abgespielt, zu dem die Fragen erstellt wurden.
       // Dialoge werden separat über extraListening ausgewählt.
       result.push({g,j,q:listeningPrompts[sceneIndex][qIndex],options,answer:pos,passage:scene[1],audio:scene[1],dialogue:null,kind:kinds[g]+' · Mitteilung'});
       continue;
     }
     if(id==='lesen'&&((exam==='goethe'&&g===2)||(exam==='telc'&&g===0)||(exam==='dtz'&&g===2))){
       const countInGroup=groups[g],startNeed=(set*3+g)%matchingNeeds.length;
       const needIndex=(startNeed+j)%matchingNeeds.length,need=matchingNeeds[needIndex];
       const activeIds=Array.from({length:countInGroup},(_,i)=>matchingNeeds[(startNeed+i)%matchingNeeds.length][1]);
       const distractorIds=matchingOffers.filter(o=>!activeIds.includes(o[0])).slice(0,Math.min(3,matchingOffers.length-activeIds.length)).map(o=>o[0]);
       const poolIds=[...new Set([...activeIds,...distractorIds])];
       const pool=matchingOffers.filter(o=>poolIds.includes(o[0])).sort((a,b)=>a[0].localeCompare(b[0]));
       const options=pool.map(o=>o[0]+' · '+o[1]),answer=pool.findIndex(o=>o[0]===need[1]);
       const passage='Lies die folgenden Anzeigen. '+(distractorIds.length?'Einige Anzeigen passen zu keiner Situation. ':'')+'\\n\\n'+pool.map(o=>o[0]+' — '+o[1]+'\\n'+o[2]).join('\\n\\n');
       result.push({g,j,q:'Situation '+(j+1)+': '+need[0],options,answer,passage,kind:'Anzeigen zuordnen · gemeinsamer Anzeigenpool'});
       continue;
     }
     if(id==='lesen'&&exam==='goethe'&&(g===0||g===3)){
       const textIndex=(n+(set-1)*7+g*3)%readingTexts.length;
       const rd=readingTexts[textIndex],truth=(j+set)%2===0;
       const statement=readingClaims[textIndex][truth?0:1];
       result.push({g,j,q:'Aussage: '+statement,options:g===0?['Richtig','Falsch']:['Ja','Nein'],answer:truth?0:1,passage:rd[0]+'\\n\\n'+rd[1],kind:'Leseverstehen · '+kinds[g]});
       continue;
     }
     if(id==='lesen'){
       const textIndex=(n+(set-1)*7+g*3)%readingTexts.length;
       const rd=readingTexts[textIndex],options=rd.slice(3,6),correct=options[0],pos=(n+set+g)%3;
       options[0]=options[pos];options[pos]=correct;
       result.push({g,j,q:rd[2],options,answer:pos,passage:rd[0]+'\\n\\n'+rd[1],kind:'Leseverstehen · '+kinds[g]});
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
     const card=oralCards[(set-1)%oralCards.length],presentation=presentationCards[(set-1)%presentationCards.length];
     const plan=card.goal+'\\n\\nBesprecht gemeinsam:\\n• '+card.points.join('\\n• ')+'\\n\\nDein Gesprächspartner sagt: „'+card.partner+'“';
     const talkCard='Thema: '+presentation.topic+'\\n\\nEigene Erfahrung: '+presentation.experience+'\\nVergleich: '+presentation.compare+'\\n\\nBegründe deine Meinung und reagiere auf Rückfragen.';
     const scenario=exam==='goethe'?(g===0?plan:g===1?talkCard:'Dein Partner fragt: „Welcher Punkt war für dich am wichtigsten und warum?“ Antworte und stelle anschließend eine eigene Frage.'):(exam==='telc'?(g===0?'Partnerfrage: „Wie lange lernst du schon Deutsch und was machst du gern in deiner Freizeit?“ Stelle auch zwei eigene Fragen.':g===1?talkCard:plan):(g===0?'Prüferfrage: „Warum lernst du Deutsch und wie sieht dein Alltag aus?“ Erzähle mit Beispielen.':g===1?talkCard:plan));
     result.push({g,j,q,hint:'Rollenkarten-Übung: Sprich möglichst frei. '+scenario+'\\n\\nDie automatische Bewertung ersetzt keine menschliche Prüfung.',kind:kinds[g]});
   }
 }});
 return result;
}
function clear(){if(tick)clearInterval(tick);tick=null;if('speechSynthesis'in window)speechSynthesis.cancel();}
function close(){clear();if(root)root.remove();root=null;if(host)host.style.display='';const fixed=el('sdB1FixedEntry');if(fixed)fixed.style.display='';host=null;}
function view(html){
 if(!root)return;
 root.innerHTML='<div class="b1x-wrap"><div class="b1x-nav"><button id="b1x-back">‹ Zurück</button><strong>🎓 B1-Prüfungstraining</strong><button id="b1x-close">✕</button></div>'+html+'</div>';
 el('b1x-close').onclick=close;el('b1x-back').onclick=home;
}
function open(){
 if(root)return;host=el('lBody');if(!host)return;host.style.display='none';const fixed=el('sdB1FixedEntry');if(fixed)fixed.style.display='none';root=document.createElement('div');root.id='b1x';host.parentNode.insertBefore(root,host.nextSibling);home();
}
const checkpointKey='sdB1ExamCheckpointV1';
function getCheckpoint(){
 try{const x=JSON.parse(localStorage.getItem(checkpointKey)||'null');return x&&E[x.exam]&&Number.isInteger(x.set)&&x.set>=1&&x.set<=5&&Number.isInteger(x.part)&&x.part>=0&&x.part<E[x.exam].parts.length&&Number.isInteger(x.idx)&&Array.isArray(x.answers)&&Number.isFinite(x.deadline)&&Number.isFinite(x.began)&&typeof x.running==='boolean'?x:null;}catch(_){return null;}
}
function saveCheckpoint(){
 try{localStorage.setItem(checkpointKey,JSON.stringify({exam,set,part,idx,answers:answers.slice(),began,deadline,plays,running,results,telcSharedDeadline,pendingChoice,updated:Date.now()}));}catch(_){}
}
function clearCheckpoint(){try{localStorage.removeItem(checkpointKey);}catch(_){}}
function resumeCheckpoint(){
 const x=getCheckpoint();if(!x)return;
 exam=x.exam;set=x.set;part=x.part;idx=x.idx;answers=x.answers;began=x.began;deadline=x.deadline;plays=x.plays||0;running=x.running;results=x.results||{};telcSharedDeadline=x.telcSharedDeadline||0;pendingChoice=Number.isInteger(x.pendingChoice)?x.pendingChoice:null;
 const tasks=items(E[exam].parts[part]);if(idx<0||idx>tasks.length||answers.length!==idx){clearCheckpoint();home();return;}
 if(idx===tasks.length){finish();return;}
 question();
}
function home(){
 clear();running=false;
 view('<h2>Prüfung auswählen</h2><p class="b1x-note">Unabhängiges Übungsmaterial. Keine offizielle Prüfung, kein offizielles Zertifikat. Die Aufgaben sind eigens erstellt und orientieren sich an der Anzahl der Prüfungsteile. Es handelt sich um Übungsentwürfe, nicht um originalgetreue Prüfungssimulationen.</p>'+
 '<div class="b1x-grid">'+Object.entries(E).map(([id,e])=>'<button data-exam="'+id+'" class="b1x-card '+(exam===id?'active':'')+'"><b>'+esc(e.name)+'</b></button>').join('')+'</div>'+
 '<h3>Mustersatz auswählen</h3><div class="b1x-grid">'+[1,2,3,4,5].map(n=>'<button data-set="'+n+'" class="b1x-card '+(set===n?'active':'')+'">Muster '+n+'</button>').join('')+'</div>'+
 '<h3>Alle Prüfungsteile</h3><div class="b1x-stack">'+E[exam].parts.map((p,i)=>'<button data-part="'+i+'" class="b1x-card"><b>'+esc(p[1])+'</b><small>'+p[2]+' Minuten · '+p[3].reduce((a,b)=>a+b,0)+' Aufgaben · '+p[3].length+' Teile</small></button>').join('')+'</div>'+
 (getCheckpoint()?'<button id="b1x-resume" class="b1x-primary">↩ Unterbrochene Prüfung fortsetzen</button>':'')+
 '<button id="b1x-start" class="b1x-primary">▶ Mustersatz '+set+' vollständig starten</button><button id="b1x-history" class="b1x-card" type="button">📊 Bisherige Ergebnisse ansehen</button>'+
 '<p class="b1x-note">Die Antworten werden nur lokal im Browser gespeichert. Die Hörtexte werden mit der Sprachausgabe des Geräts vorgelesen; je nach Betriebssystem kann diese einen Online-Sprachdienst nutzen. Keine offizielle Bewertung. Zuordnungsaufgaben und Prüfungsgespräche sind vereinfacht. Bei telc teilen sich Lesen und Sprachbausteine im vollständigen Mustersatz eine gemeinsame 90-Minuten-Frist (60 Minuten Lesen, anschließend die verbleibende Zeit für Sprachbausteine). Dies ist eine vereinfachte Trainingsaufteilung; bei Einzelübungen gelten getrennte Zeiten.</p><button id="b1x-delete" class="b1x-card" type="button">🗑 B1-Ergebnisse und Schreibentwürfe löschen</button>');
 root.querySelectorAll('[data-exam]').forEach(b=>b.onclick=()=>{exam=b.dataset.exam;set=1;home();});
 root.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{set=Number(b.dataset.set);home();});
 root.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{if(getCheckpoint()&&!confirm('Gespeicherte Prüfung durch eine neue Einzelübung ersetzen?'))return;clearCheckpoint();running=false;start(Number(b.dataset.part));});
 if(el('b1x-resume'))el('b1x-resume').onclick=resumeCheckpoint;
 el('b1x-start').onclick=()=>{if(getCheckpoint()&&!confirm('Eine unterbrochene Prüfung ist gespeichert. Neue Prüfung starten und bisherigen Fortschritt ersetzen?'))return;clearCheckpoint();running=true;results={};telcSharedDeadline=0;start(0);};
 if(el('b1x-history'))el('b1x-history').onclick=history;
 if(el('b1x-delete'))el('b1x-delete').onclick=()=>{if(confirm('Alle auf diesem Gerät gespeicherten B1-Ergebnisse und Schreibentwürfe löschen?')){try{for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key&&key.startsWith('sdB1Draft:'))localStorage.removeItem(key);}localStorage.removeItem('sdB1FullResults');localStorage.removeItem('sdB1Pruefungen');clearCheckpoint();alert('B1-Ergebnisse und Schreibentwürfe wurden auf diesem Gerät gelöscht.');}catch(_){alert('Die Daten konnten nicht vollständig gelöscht werden. Bitte prüfe die Browser-Einstellungen.');}}};
}
function start(i){clear();part=i;idx=0;answers=[];plays=0;pendingChoice=null;began=Date.now();const p=E[exam].parts[i];const sharedTelc=exam==='telc'&&running&&(p[0]==='lesen'||p[0]==='sprach');if(sharedTelc&&p[0]==='lesen')telcSharedDeadline=began+90*60000;deadline=sharedTelc?(p[0]==='lesen'?Math.min(telcSharedDeadline,began+60*60000):telcSharedDeadline):began+(p[2]||30)*60000;saveCheckpoint();question();}
function speak(t,dialogue){
 if(!('speechSynthesis'in window)){alert('Dein Browser unterstützt diese Sprachausgabe nicht.');return;}
 const synth=window.speechSynthesis;synth.cancel();
 const voices=synth.getVoices().filter(v=>v.lang&&v.lang.toLowerCase().startsWith('de'));
 if(!dialogue){const u=new SpeechSynthesisUtterance(t);u.lang='de-DE';u.rate=.87;synth.speak(u);return;}
 const roles=[...new Set(dialogue.map(turn=>turn[0]))];
 dialogue.forEach(turn=>{
  const u=new SpeechSynthesisUtterance(turn[1]);u.lang='de-DE';u.rate=.89;
  const roleIndex=roles.indexOf(turn[0]);
  if(voices.length>1)u.voice=voices[roleIndex%voices.length];
  u.pitch=roleIndex%2===0?1.07:.9;
  synth.speak(u);
 });
}
function gapPassage(t){
 const safe=esc(t.passage),current=t.j+1;
 return safe.replace(/\[(\d+)\]/g,(_,number)=>Number(number)===current?'<mark class="b1x-current-gap" aria-label="Aktuelle Lücke '+number+'">['+number+']</mark>':'<span class="b1x-other-gap">['+number+']</span>');
}
function timerText(seconds){
 const left=Math.max(0,Math.ceil(seconds));
 return '⏱ '+String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
}
function draftKey(){return 'sdB1Draft:'+exam+':'+set+':'+part+':'+idx;}
function saveDraft(value){try{localStorage.setItem(draftKey(),value);}catch(_){}}
function readDraft(){try{return localStorage.getItem(draftKey());}catch(_){return null;}}
function removeDraft(){try{localStorage.removeItem(draftKey());}catch(_){}}
function captureCurrentAnswer(){
 const p=E[exam].parts[part];
 if(answers.length>idx)return;
 if(['lesen','hoeren','sprach'].includes(p[0])){
  const chosen=root&&root.querySelector('input[name="b1x-answer"]:checked');
  answers.push(chosen?Number(chosen.value):pendingChoice);
 }else{
  const field=el('b1x-text');
  answers.push(field?field.value.trim():null);
 }
}
function question(){
 clear();const p=E[exam].parts[part],list=items(p),t=list[idx];if(!t){finish();return;}
 if(Date.now()>=deadline){captureCurrentAnswer();while(answers.length<list.length)answers.push(null);finish();return;}
 const count=p[3].slice(0,t.g).reduce((a,b)=>a+b,0)+1;
 const body=(p[0]==='lesen'||p[0]==='hoeren'||p[0]==='sprach')?
 (p[0]==='hoeren'?'<button id="b1x-audio" class="b1x-audio">🔊 Hörtext abspielen</button>':'<div class="b1x-passage">'+(p[0]==='sprach'?gapPassage(t):esc(t.passage))+'</div>')+
 '<h3>'+esc(t.q)+'</h3><div class="b1x-stack" role="radiogroup" aria-label="Antwort auswählen">'+t.options.map((o,i)=>'<label class="b1x-card"><input type="radio" name="b1x-answer" value="'+i+'"> '+esc(o)+'</label>').join('')+'</div>':
 '<h3>'+esc(t.q)+'</h3><p class="b1x-note">'+esc(t.hint)+'</p><textarea id="b1x-text" rows="9" lang="de" spellcheck="false" autocorrect="off" autocapitalize="off" autocomplete="off" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" placeholder="'+(p[0]==='sprechen'?'Notizen zur mündlichen Antwort …':'Deine Antwort …')+'"></textarea><div id="b1x-count" class="b1x-note">0 Wörter</div>';
 view('<p class="b1x-note">'+esc(E[exam].name)+' · Muster '+set+' · '+esc(p[1])+'</p>'+
 '<div class="b1x-meta"><span>Teil '+(t.g+1)+'/'+p[3].length+' · '+esc(t.kind)+'</span><span>Aufgabe '+(idx+1)+'/'+list.length+'</span></div>'+
 '<div class="b1x-meta"><span id="b1x-clock" role="timer" aria-live="off">'+timerText((deadline-Date.now())/1000)+'</span><span>'+Math.round(idx/list.length*100)+' %</span></div><div class="b1x-progress" role="progressbar" aria-label="Aufgabenfortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(idx/list.length*100)+'"><div style="width:'+Math.round(idx/list.length*100)+'%"></div></div>'+
 body+'<button id="b1x-next" class="b1x-primary">'+(idx===list.length-1?'Teil abschließen':'Weiter')+'</button>');
 el('b1x-back').onclick=()=>{if(confirm('Diesen Prüfungsteil verlassen? Deine ungespeicherten Antworten gehen verloren.'))home();};
 if(['lesen','hoeren','sprach'].includes(p[0])){const radios=root.querySelectorAll('input[name="b1x-answer"]');radios.forEach(r=>{if(Number(r.value)===pendingChoice)r.checked=true;r.addEventListener('change',()=>{pendingChoice=Number(r.value);saveCheckpoint();});});}
 if(el('b1x-audio')){const max=exam==='goethe'&&p[0]==='hoeren'&&(t.g===0||t.g===3)?2:1;el('b1x-audio').textContent='🔊 Hörtext abspielen (max. '+max+' × pro Aufgabe)';el('b1x-audio').onclick=()=>{if(plays>=max){alert('Der Hörtext wurde bereits '+max+' Mal abgespielt.');return;}plays++;saveCheckpoint();speak(t.audio,t.dialogue);};}
 if(el('b1x-text')){const saved=readDraft();if(saved!==null)el('b1x-text').value=saved;const update=()=>{const a=el('b1x-text').value.trim();el('b1x-count').textContent=(a?a.split(/\s+/).length:0)+' Wörter';saveDraft(el('b1x-text').value);};el('b1x-text').oninput=update;el('b1x-count').textContent=(el('b1x-text').value.trim()?el('b1x-text').value.trim().split(/\s+/).length:0)+' Wörter';}
 el('b1x-next').onclick=()=>{
  if(Date.now()>=deadline){captureCurrentAnswer();while(answers.length<list.length)answers.push(null);finish();return;}
  let val;
  if(p[0]==='lesen'||p[0]==='hoeren'||p[0]==='sprach'){
   const c=root.querySelector('input[name="b1x-answer"]:checked');
   if(!c){if(!confirm('Ohne Antwort zur nächsten Aufgabe?'))return;val=null;}else val=Number(c.value);
  }else val=el('b1x-text').value.trim();
  answers.push(val);if(['schreiben','sprechen'].includes(p[0]))removeDraft();idx++;plays=0;pendingChoice=null;saveCheckpoint();question();
 };
 tick=setInterval(()=>{const left=Math.max(0,Math.ceil((deadline-Date.now())/1000));if(el('b1x-clock'))el('b1x-clock').textContent=timerText(left);if(left===0){const pNow=E[exam].parts[part];captureCurrentAnswer();while(answers.length<items(pNow).length)answers.push(null);clear();finish();}},1000);
}
function selfCheckMarkup(section,entries){
 const isWrite=section==='schreiben';
 const criteria=isWrite?[
  ['inhalt','Alle geforderten Inhaltspunkte angesprochen'],
  ['aufbau','Passende Anrede, Einleitung, Schluss und Gruß'],
  ['verstaendlichkeit','Aussagen sind verständlich und logisch verbunden'],
  ['wortschatz','Passende Wörter und höfliche Formulierungen'],
  ['sprache','Grammatik, Rechtschreibung und Satzbau kontrolliert']
 ]:[
  ['aufgabe','Auf alle Gesprächsaufgaben eingegangen'],
  ['struktur','Gedanken verständlich und geordnet ausgedrückt'],
  ['austausch','Fragen gestellt und auf den Partner reagiert'],
  ['wortschatz','Passenden Wortschatz verwendet'],
  ['sprache','Verständliche Aussprache und angemessene Grammatik']
 ];
 return '<details class="b1x-passage"><summary>Selbstkontrolle: '+(isWrite?'Schreiben':'Sprechen')+'</summary>'+
 '<p class="b1x-note">Diese Checkliste ist eine Lernhilfe, kein offizielles Bewertungsraster. Setze ein Häkchen nur, wenn du den Punkt tatsächlich erfüllt hast.</p>'+
 criteria.map(c=>'<label class="b1x-check"><input type="checkbox"> '+esc(c[1])+'</label>').join('')+
 (isWrite?'<p class="b1x-note">Prüfe außerdem die Aufgabenstellung: Wurden alle verlangten Informationen genannt? Ist die Sprache zur Situation passend?</p>':
 '<p class="b1x-note">Für eine verlässliche Einschätzung der Aussprache und Interaktion ist Rückmeldung von einer Lehrkraft oder einem Gesprächspartner hilfreich.</p>')+
 '</details>';
}
function reviewTask(t,answer,i,withTranscript){
 const selected=answer===null||answer===undefined?'–':t.options[answer]||'–';
 const correct=answer===t.answer;
 const status=answer===null||answer===undefined?'Nicht beantwortet':correct?'Richtig beantwortet':'Noch einmal üben';
 const evidence=withTranscript?'Höre die Aufnahme erneut oder lies den Hörtext. Suche die Stelle, die die richtige Antwort belegt.':t.kind&&t.kind.includes('Anzeigen zuordnen')?'Vergleiche die Angaben der Situation mit der passenden Anzeige. Achte auf die konkreten Bedingungen.':t.kind&&t.kind.includes('Lückentext')||t.kind&&t.kind.includes('Wortwahl')?'Setze die richtige Lösung in die Lücke ein und prüfe Grammatik und Satzbedeutung.':'Suche im Lesetext die Information, die diese Lösung bestätigt oder die falsche Aussage widerlegt.';
 const base='<p><b>'+(i+1)+'.</b> '+esc(t.q)+'<br><small>'+esc(status)+' · Deine Antwort: '+esc(selected)+' · Lösung: '+esc(t.options[t.answer])+'</small></p>';
 const guidance='<details class="b1x-transcript"><summary>So überprüfst du die Lösung</summary><p>'+esc(evidence)+'</p>'+(withTranscript?'':'<p>'+esc(t.passage||'')+'</p>')+'</details>';
 return base+guidance+(withTranscript&&t.audio?'<details class="b1x-transcript"><summary>Hörtext zu Aufgabe '+(i+1)+' nachlesen</summary><p>'+esc(t.dialogue?t.dialogue.map(turn=>turn[0]+': '+turn[1]).join('\\n'):t.audio)+'</p></details>':'');
}
function finish(){
 clear();const p=E[exam].parts[part],list=items(p),auto=['lesen','hoeren','sprach'].includes(p[0]);const correct=auto?list.reduce((sum,t,i)=>sum+(answers[i]===t.answer?1:0),0):null;
 const record={exam,set,part:p[0],date:new Date().toISOString(),correct,total:list.length,answered:answers.filter(a=>a!==null&&a!==undefined&&a!=='').length,answers:answers.slice(),elapsed:Math.round((Date.now()-began)/1000),deadline};
 results[p[0]]=record;pendingChoice=null;clearCheckpoint();if(['schreiben','sprechen'].includes(p[0]))removeDraft();
 try{const old=getSaved();old.push(record);localStorage.setItem('sdB1FullResults',JSON.stringify(old.slice(-60)));}catch(_){}
 const next=running&&part+1<E[exam].parts.length;
 const completed=running&&!next;
 const text=running&&next?
  '<h2>Prüfungsteil abgeschlossen</h2><p>Deine Antworten wurden gespeichert. Im Prüfungsmodus zeigen wir Lösungen und Punkte erst nach dem letzten Prüfungsteil.</p>':
  auto?'<h2>'+correct+' / '+list.length+' richtig</h2><p>Nur diese Übungsfragen wurden automatisch ausgewertet. Das Ergebnis ist keine offizielle Prüfungsnote.</p>':
  '<h2>Prüfungsteil beendet</h2><p>Für '+esc(p[1])+' ist eine Bewertung durch eine qualifizierte Person erforderlich. Es wurde keine automatische B1-Einstufung vorgenommen.</p>';
 const summary=completed?'<h3>Gesamtübersicht – Muster '+set+'</h3><div class="b1x-passage">'+E[exam].parts.map(x=>{const z=results[x[0]];return '<p><b>'+esc(x[1])+':</b> '+(z?(z.correct===null?'Bearbeitet, manuelle Bewertung erforderlich':z.correct+' / '+z.total+' richtige Antworten'):'Nicht bearbeitet')+'</p>';}).join('')+'</div><p class="b1x-note">Keine offizielle Gesamtpunktzahl oder Bestehensentscheidung. Schreiben und Sprechen müssen fachlich beurteilt werden.</p>':'';
 const review=running&&next?'':completed?
  E[exam].parts.map(x=>{const z=results[x[0]];if(!z)return '';const tasks=items(x);return '<details class="b1x-passage"><summary>Lösungen und Antworten: '+esc(x[1])+'</summary>'+(['lesen','hoeren','sprach'].includes(x[0])?tasks.map((t,i)=>reviewTask(t,z.answers[i],i,x[0]==='hoeren')).join(''):z.answers.map((a,i)=>'<p><b>Aufgabe '+(i+1)+':</b> '+esc(a||'Keine Antwort')+'</p>').join(''))+'</details>'+(['schreiben','sprechen'].includes(x[0])?selfCheckMarkup(x[0],z.answers):'');}).join(''):
  '<div class="b1x-passage">'+(auto?list.map((t,i)=>reviewTask(t,answers[i],i,p[0]==='hoeren')).join(''):answers.map((a,i)=>'<p><b>Aufgabe '+(i+1)+':</b> '+esc(a||'Keine Antwort')+'</p>').join(''))+'</div>'+(auto?'':selfCheckMarkup(p[0],answers));
 view('<p class="b1x-note">'+esc(E[exam].name)+' · Muster '+set+'</p>'+text+summary+review+
 '<button id="b1x-continue" class="b1x-primary">'+(next?'Weiter: '+esc(E[exam].parts[part+1][1]):'Zur Übersicht')+'</button>');
 el('b1x-continue').onclick=()=>next?start(part+1):home();
}
function getSaved(){
 try{return JSON.parse(localStorage.getItem('sdB1FullResults')||'[]').filter(x=>x&&typeof x==='object');}catch(_){return [];}
}
function history(){
 const saved=getSaved().slice().reverse();
 view('<h2>Deine bisherigen Übungsergebnisse</h2><p class="b1x-note">Nur auf diesem Gerät gespeichert. Nicht mit offiziellen Prüfungsergebnissen vergleichbar.</p>'+
 (saved.length?saved.slice(0,30).map(x=>'<div class="b1x-passage"><b>'+esc(E[x.exam]?.name||x.exam)+' · Muster '+esc(x.set)+'</b><p>'+esc(x.part)+' · '+esc(new Date(x.date).toLocaleDateString('de-DE'))+'</p><small>'+(x.correct===null?'Manuelle Bewertung erforderlich':esc(x.correct)+' / '+esc(x.total)+' richtig')+'</small></div>').join(''):'<p>Noch keine Ergebnisse gespeichert.</p>')+
 '<button id="b1x-home" class="b1x-primary">Zurück zur Auswahl</button>');
 el('b1x-home').onclick=home;
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
.b1x-card input{margin-right:8px}.b1x-check{display:flex;gap:10px;align-items:flex-start;margin:12px 0;cursor:pointer}.b1x-check input{width:18px;height:18px;flex:none;accent-color:#fb923c}
.b1x-current-gap{background:#fbbf24;color:#111827;padding:3px 6px;border-radius:5px;font-weight:800}.b1x-other-gap{color:#fda96b;font-weight:600}.b1x-transcript{margin:8px 0 18px;padding:10px 12px;border:1px solid #4b5563;border-radius:8px}.b1x-transcript summary{cursor:pointer;font-weight:600}.b1x-transcript p{white-space:pre-wrap;line-height:1.65}.b1x-passage{background:#1b1e2b;border:1px solid #3e4257;padding:16px;border-radius:12px;line-height:1.8;white-space:pre-wrap;margin:14px 0}
.b1x-progress{height:7px;background:#35394c;border-radius:20px;overflow:hidden;margin:8px 0 18px}.b1x-progress>div{height:100%;background:#fb923c;transition:width .2s}.b1x-primary:focus-visible,.b1x-card:focus-within,.b1x-audio:focus-visible{outline:3px solid #fdba74;outline-offset:3px}@media(max-width:520px){.b1x-wrap{padding:10px 12px 64px}.b1x-grid{grid-template-columns:1fr}.b1x-meta{flex-wrap:wrap;font-size:13px}.b1x-nav{gap:5px}.b1x-nav button{padding:8px}}.b1x-primary,.b1x-audio{width:100%;background:#c2410c;border:0;color:#fff;padding:15px;border-radius:12px;font:inherit;font-weight:700;margin:14px 0;cursor:pointer}
.b1x-audio{background:#334155}
#b1x-text{width:100%;box-sizing:border-box;min-height:190px;background:#191c29;border:1px solid #565b70;color:white;padding:14px;border-radius:12px;font:inherit}
`;document.head.appendChild(css);
function attach(){
 if(root)return;const h=el('lBody');if(!h||h.querySelector('#sdB1FullEntry')||!h.querySelector('.l-wrap')||h.querySelector('.l-loading'))return;
 const b=document.createElement('button');b.id='sdB1FullEntry';b.type='button';b.className='b1-entry';b.innerHTML='<b>🎓 B1-Musterprüfungen</b><small>Goethe · telc · DTZ – je 5 Mustersätze</small>';b.onclick=open;
 const old=h.querySelector('#sdB1Entry');if(old)old.remove();
 const tiles=h.querySelector('.l-kacheln');if(tiles)tiles.insertAdjacentElement('afterend',b);else h.querySelector('.l-wrap').insertAdjacentElement('afterbegin',b);
}
// Keep a permanent entry outside the learning content, which is frequently rerendered.
function attachFixedEntry(){
 if(document.getElementById('sdB1FixedEntry'))return;
 const target=el('lBody');if(!target||!target.parentNode)return;
 const b=document.createElement('button');b.id='sdB1FixedEntry';b.type='button';b.className='b1-entry';
 b.innerHTML='<b>🎓 B1-Musterprüfungen öffnen</b><small>Goethe · telc · DTZ – 15 Übungssätze</small>';
 b.onclick=open;target.parentNode.insertBefore(b,target);b.style.display='block';
}
function refreshEntry(){attach();attachFixedEntry();}
new MutationObserver(refreshEntry).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshEntry);else refreshEntry();
})();
