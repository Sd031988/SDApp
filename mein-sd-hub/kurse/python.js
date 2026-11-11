/* SD Akademie – Python Grundlagen: acht eigenständig ausgearbeitete Praxislektionen. */
(function(root){"use strict";root.SDAkademieKurse=root.SDAkademieKurse||Object.create(null);root.SDAkademieKurse.python=[
  {
    "id": "py-1",
    "sprache": "python",
    "title": "Python starten: Text und Namen",
    "minutes": 30,
    "explanation": "Mina möchte eine persönliche Begrüßung für ihren Sprachkurs ausgeben. Du schreibst dafür dein erstes kleines Python-Programm.",
    "ziel": "Du speicherst einen Namen und gibst eine passende Begrüßung im Ausgabefeld aus.",
    "schritte": [
      {
        "titel": "Eine Anweisung ausführen",
        "text": "Python liest dein Programm von oben nach unten. Mit `print` schreibst du etwas in die Ausgabe. Die runden Klammern gehören zum Aufruf. Im Studio startet der Knopf deinen Code im Browser. Du brauchst für diese Übung kein Konto bei einem fremden Ausführungsdienst.",
        "code": "print(\"Hallo!\")",
        "erklaerung": "Dieser Aufruf schreibt Hallo mit einem Ausrufezeichen. Die Anführungszeichen selbst erscheinen nicht in der Ausgabe."
      },
      {
        "titel": "Text sicher begrenzen",
        "text": "Eine Zeichenkette ist ein Textwert. Schreibe den Text zwischen zwei passende Anführungszeichen. Du darfst einfache oder doppelte Zeichen verwenden. Mische sie beim Öffnen und Schließen nicht. Auch ein Leerzeichen zwischen zwei Wörtern ist Teil des gespeicherten Textes.",
        "code": "print(\"Guten Morgen\")",
        "erklaerung": "Beide Wörter stehen innerhalb derselben Zeichenkette. Ohne das Leerzeichen würden sie direkt zusammenstehen."
      },
      {
        "titel": "Einen Wert benennen",
        "text": "Eine Variable gibt einem Wert einen Namen. Mit einem Gleichheitszeichen ordnest du ihr den Wert rechts davon zu. Danach kannst du den Namen ohne Anführungszeichen benutzen. Ändert sich die Person, ersetzt du nur den gespeicherten Namen. Die Begrüßung bleibt wiederverwendbar.",
        "code": "name = \"Mina\"\nprint(name)",
        "erklaerung": "Die erste Zeile speichert Mina. Die zweite liest den Wert der Variablen, statt das Wort name auszugeben."
      },
      {
        "titel": "Eine Begrüßung zusammensetzen",
        "text": "Ein f-String setzt Werte in einen Text ein. Schreibe ein f direkt vor das öffnende Anführungszeichen. In geschweiften Klammern steht der Name der Variablen. Prüfe die Ausgabe einmal mit Mina und danach mit Sami. So bemerkst du, ob der Name wirklich eingesetzt wird.",
        "code": "name = \"Mina\"\nprint(f\"Hallo, {name}!\")",
        "erklaerung": "Das Komma und das Ausrufezeichen bleiben fester Text. Nur der Inhalt zwischen den geschweiften Klammern wird ausgewertet."
      }
    ],
    "beispiel": {
      "python": "name = \"Mina\"\n# Gib die persönliche Begrüßung aus.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Gib Hallo, gefolgt von einem Leerzeichen, dem Wert von name und einem Ausrufezeichen aus. Der Name darf nicht fest im Ausgabetext stehen.",
      "tipp": "Setze name in die geschweiften Klammern deines f-Strings und achte auf das Komma nach Hallo.",
      "loesung": {
        "python": "name = \"Mina\"\nprint(f\"Hallo, {name}!\")"
      },
      "faelle": [
        {
          "werte": {
            "name": "Mina"
          },
          "ausgabe": "Hallo, Mina!"
        },
        {
          "werte": {
            "name": "Sami"
          },
          "ausgabe": "Hallo, Sami!"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Variablenname als Text",
        "text": "Falsch: `print(\"name\")` zeigt nur das Wort name. Die gespeicherte Person wird dadurch nicht gelesen. Richtig: `print(name)` liest den Wert. Für die ganze Begrüßung verwendest du `print(f\"Hallo, {name}!\")`."
      },
      {
        "titel": "Das f vergessen",
        "text": "Falsch: `print(\"Hallo, {name}!\")` lässt die geschweiften Klammern sichtbar stehen. Es handelt sich um gewöhnlichen Text. Richtig: `print(f\"Hallo, {name}!\")` wertet den Ausdruck in den Klammern aus."
      }
    ],
    "quiz": [
      {
        "frage": "Was erscheint nach name = \"Mina\" und print(name)?",
        "antworten": [
          "Das Wort name",
          "Der Text Mina",
          "Die Anführungszeichen"
        ],
        "richtig": 1,
        "erklaerung": "print liest bei einem Namen ohne Anführungszeichen den gespeicherten Wert aus.",
        "begruendungen": [
          "name wäre nur innerhalb von Anführungszeichen ein fester Text.",
          "Mina ist der Wert, den name hier bezeichnet.",
          "Anführungszeichen begrenzen den Quelltext und werden nicht mitgedruckt."
        ]
      },
      {
        "frage": "Warum braucht die persönliche Begrüßung ein f vor dem Text?",
        "antworten": [
          "Damit Python {name} ersetzt",
          "Damit print eine Datei erstellt",
          "Damit der Name großgeschrieben wird"
        ],
        "richtig": 0,
        "erklaerung": "Das f kennzeichnet einen formatierten String mit auswertbaren Ausdrücken.",
        "begruendungen": [
          "Die geschweiften Klammern enthalten hier die eingesetzte Variable.",
          "Eine Datei entsteht nicht durch einen f-String.",
          "Großschreibung verlangt eine eigene Textoperation."
        ]
      },
      {
        "frage": "Welche Änderung begrüßt eine andere Person, ohne die Ausgabezeile umzubauen?",
        "antworten": [
          "print in input umbenennen",
          "Die Klammern entfernen",
          "Den Wert von name ändern"
        ],
        "richtig": 2,
        "erklaerung": "Ein neuer Variablenwert wird beim nächsten Aufruf in denselben Begrüßungstext eingesetzt.",
        "begruendungen": [
          "input liest Eingaben, statt diese Begrüßung auszugeben.",
          "Die runden Klammern bleiben für den Funktionsaufruf notwendig.",
          "Der feste Satz nutzt weiterhin die Variable mit ihrem neuen Inhalt."
        ]
      }
    ],
    "merke": [
      "Textwerte brauchen passende Anführungszeichen.",
      "Ein f-String kann feste Satzzeichen und veränderliche Werte verbinden."
    ]
  },
  {
    "id": "py-2",
    "sprache": "python",
    "title": "Mit Zahlen rechnen",
    "minutes": 30,
    "explanation": "Für ein Kurstreffen werden drei Hefte gekauft. Du berechnest den Gesamtpreis und unterscheidest dabei Zahlen von geschriebenen Ziffern.",
    "ziel": "Du berechnest einen Preis aus zwei Variablen und kontrollierst das Ergebnis mit anderen Werten.",
    "schritte": [
      {
        "titel": "Zahlen statt Ziffern speichern",
        "text": "Eine ganze Zahl heißt in Python int. Du schreibst sie ohne Anführungszeichen. Nur dann kann Python direkt damit rechnen. Der Preis eines Hefts und die Anzahl der Hefte sind hier getrennte Werte. Für die Übung rechnen wir in ganzen Euro, damit kein Runden nötig ist.",
        "code": "preis = 4\nanzahl = 3",
        "erklaerung": "preis enthält vier und anzahl enthält drei. Beide Werte sind Zahlen und keine Zeichenketten."
      },
      {
        "titel": "Den Gesamtpreis berechnen",
        "text": "Der Stern steht für die Multiplikation. Damit multiplizierst du den Einzelpreis mit der Anzahl. Speichere das Ergebnis in einer weiteren Variablen. So ist die Rechnung auch später noch verfügbar. Schreibe nicht einfach die Zahl zwölf hin, denn ein anderer Preis soll ebenfalls funktionieren.",
        "code": "gesamt = preis * anzahl",
        "erklaerung": "Die rechte Seite wird zuerst berechnet. Erst danach wird das Ergebnis unter gesamt abgelegt."
      },
      {
        "titel": "Reihenfolgen beachten",
        "text": "Python rechnet eine Multiplikation vor einer Addition. Klammern können die Reihenfolge ausdrücklich ändern. Bei einem gemeinsamen Zuschlag addierst du ihn nach der Multiplikation. Ein Zuschlag pro Heft müsste dagegen zum Einzelpreis gehören. Entscheide anhand der Bedeutung, welche Rechnung du brauchst.",
        "code": "mit_versand = preis * anzahl + 2",
        "erklaerung": "Hier fallen zwei Euro Versand insgesamt an. Die zwei Euro werden nicht für jedes einzelne Heft berechnet."
      },
      {
        "titel": "Ergebnisse vergleichen",
        "text": "Lass dir zunächst nur die berechnete Summe ausgeben. Ändere anschließend eine der Ausgangszahlen und führe den Code erneut aus. Eine richtige Rechnung reagiert auf beide Werte. Vergleiche das Ergebnis mit einer kurzen Kopfrechnung. Damit prüfst du mehr als eine zufällig passende Beispielzahl.",
        "code": "print(gesamt)",
        "erklaerung": "print zeigt den aktuellen Gesamtpreis. Für fünf Hefte zu vier Euro muss sich die Ausgabe auf zwanzig ändern."
      }
    ],
    "beispiel": {
      "python": "preis = 4\nanzahl = 3\n# Berechne und drucke gesamt.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Berechne preis mal anzahl und gib nur die berechnete ganze Zahl aus. Die Prüfung ändert beide Ausgangswerte.",
      "tipp": "Nutze den Stern zwischen preis und anzahl. Die Ausgabe soll keine zusätzliche Beschriftung enthalten.",
      "loesung": {
        "python": "preis = 4\nanzahl = 3\ngesamt = preis * anzahl\nprint(gesamt)"
      },
      "faelle": [
        {
          "werte": {
            "preis": 4,
            "anzahl": 3
          },
          "ausgabe": "12"
        },
        {
          "werte": {
            "preis": 7,
            "anzahl": 2
          },
          "ausgabe": "14"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Zahlen in Anführungszeichen",
        "text": "Falsch: `preis = \"4\"` speichert eine Zeichenkette. `preis * 3` wiederholt dann den Text und liefert 444. Richtig: `preis = 4` speichert die Zahl, mit der `preis * 3` den Betrag zwölf berechnet."
      },
      {
        "titel": "Ein Ergebnis fest eintragen",
        "text": "Falsch: `print(12)` passt nur zu den ersten Beispielwerten. Ein geänderter Preis bleibt unberücksichtigt. Richtig: `print(preis * anzahl)` führt die Rechnung bei jedem Start mit den aktuellen Werten aus."
      }
    ],
    "quiz": [
      {
        "frage": "Was ergibt \"4\" * 3 in Python?",
        "antworten": [
          "Die Zahl 12",
          "Einen Syntaxfehler",
          "Den Text 444"
        ],
        "richtig": 2,
        "erklaerung": "Eine Zeichenkette wird durch Multiplikation mit einer ganzen Zahl wiederholt.",
        "begruendungen": [
          "Diese Rechnung wäre mit der Zahl 4 ohne Anführungszeichen richtig.",
          "Die Wiederholung von Text ist in Python erlaubt.",
          "Der gespeicherte Text besteht aus einer Ziffer und wird dreimal angehängt."
        ]
      },
      {
        "frage": "Welche Rechnung addiert zwei Euro Versand genau einmal?",
        "antworten": [
          "preis * anzahl + 2",
          "preis * (anzahl + 2)",
          "(preis + 2) * anzahl"
        ],
        "richtig": 0,
        "erklaerung": "Die Addition nach dem Produkt ergänzt einen einzigen Zuschlag zur gesamten Bestellung.",
        "begruendungen": [
          "Die zwei Euro kommen zur fertigen Summe hinzu.",
          "Das würde zwei zusätzliche Hefte berechnen.",
          "Damit fällt der Zuschlag für jedes Heft einzeln an."
        ]
      },
      {
        "frage": "Wie prüfst du, ob die Rechnung veränderliche Preise berücksichtigt?",
        "antworten": [
          "Nur die Schriftfarbe ändern",
          "Preis ändern und erneut ausführen",
          "Eine feste Zwölf ausgeben"
        ],
        "richtig": 1,
        "erklaerung": "Ein weiterer Eingabewert zeigt, ob das Programm wirklich mit den Variablen rechnet.",
        "begruendungen": [
          "Die Darstellung verändert den berechneten Wert nicht.",
          "Ein anderer Preis muss zu einer entsprechend anderen Summe führen.",
          "Eine feste Zahl kann zufällig passen und trotzdem die Aufgabe verfehlen."
        ]
      }
    ],
    "merke": [
      "Ohne Anführungszeichen kann eine Ziffernfolge eine Zahl sein.",
      "Klammern machen eine beabsichtigte Rechenreihenfolge sichtbar."
    ]
  },
  {
    "id": "py-3",
    "sprache": "python",
    "title": "Eingaben lesen und Fehler abfangen",
    "minutes": 30,
    "explanation": "Sami möchte zwei Fahrkarten kaufen. Das Programm liest seine Anzahl als Text und soll auch bei einer ungültigen Eingabe verständlich reagieren.",
    "ziel": "Du wandelst eine Eingabe in eine ganze Zahl um und behandelst einen ValueError gezielt.",
    "schritte": [
      {
        "titel": "Eine Zeile einlesen",
        "text": "Mit input liest Python eine Zeile der Eingabe. Das Ergebnis ist zunächst immer Text. In diesem Browser-Editor trägst du die Zeilen vor dem Start ein. Jede Zeile wird nacheinander verbraucht. Ein leeres Eingabefeld ist deshalb nicht automatisch die Zahl null.",
        "code": "roh = input()",
        "erklaerung": "roh enthält die gelesenen Zeichen. Eine eingegebene Drei ist zu diesem Zeitpunkt noch eine Zeichenkette."
      },
      {
        "titel": "Text in eine Zahl umwandeln",
        "text": "Die Funktion int versucht, aus dem Text eine ganze Zahl zu machen. Ein Text wie 3 ist dafür geeignet. Ein Wort wie drei lässt sich nicht so umwandeln. Auch 2,5 ist keine ganze Zahl in dieser Schreibweise. Erst nach der Umwandlung multiplizierst du mit dem Fahrpreis.",
        "code": "anzahl = int(roh)",
        "erklaerung": "int liefert hier den passenden numerischen Wert. Bei ungeeignetem Text löst die Funktion einen ValueError aus."
      },
      {
        "titel": "Einen erwarteten Fehler behandeln",
        "text": "Ein try-Block enthält den Teil, der scheitern kann. Der passende except-Block legt fest, was bei einem bestimmten Fehler passiert. Fange hier ValueError ab, statt jeden möglichen Fehler zu verstecken. Dann bleibt ein anderer Programmfehler weiterhin erkennbar. Einrückung ordnet die Zeilen ihrem Block zu.",
        "code": "try:\n    anzahl = int(input())\nexcept ValueError:\n    print(\"Bitte ganze Zahl eingeben\")",
        "erklaerung": "Die Fehlermeldung ist eine bewusst gewählte Ausgabe für die lernende Person. Sie ersetzt keinen Erfolg bei einer falschen Eingabe."
      },
      {
        "titel": "Beide Wege ausprobieren",
        "text": "Teste zuerst eine gültige Anzahl und dann einen Buchstaben. Für eine Fahrkarte zu drei Euro ergibt die Anzahl zwei den Betrag sechs. Bei einem Wort soll stattdessen die verständliche Bitte erscheinen. Verwende im Testfeld jeweils eine einzelne Zeile. So prüfst du den Erfolgsweg und den Fehlerweg getrennt.",
        "code": "try:\n    print(int(input()) * 3)\nexcept ValueError:\n    print(\"Bitte ganze Zahl eingeben\")",
        "erklaerung": "Die Multiplikation wird nur nach erfolgreicher Umwandlung erreicht. Der Fehlerweg gibt keinen erfundenen Fahrpreis aus."
      }
    ],
    "beispiel": {
      "python": "# Lies eine Anzahl. Eine Fahrkarte kostet 3 Euro.\n",
      "eingabe": "2\n"
    },
    "aufgabe": {
      "text": "Lies eine Zeile. Gib bei einer ganzen Zahl das Dreifache aus. Bei einem anderen Text schreibe genau: Bitte ganze Zahl eingeben.",
      "tipp": "Lege int(input()) in den try-Block. Der except-Block muss ValueError ausdrücklich nennen.",
      "loesung": {
        "python": "try:\n    anzahl = int(input())\n    print(anzahl * 3)\nexcept ValueError:\n    print(\"Bitte ganze Zahl eingeben\")"
      },
      "faelle": [
        {
          "eingabe": "2\n",
          "ausgabe": "6"
        },
        {
          "eingabe": "5\n",
          "ausgabe": "15"
        },
        {
          "eingabe": "drei\n",
          "ausgabe": "Bitte ganze Zahl eingeben"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Die Eingabe direkt multiplizieren",
        "text": "Falsch: `print(input() * 3)` wiederholt bei der Eingabe 2 den Text zu 222. Der Fahrpreis wird nicht berechnet. Richtig: `print(int(input()) * 3)` wandelt die Zeichen vor der Rechnung in eine Zahl um."
      },
      {
        "titel": "Jeden Fehler unsichtbar machen",
        "text": "Falsch: `except: pass` verschluckt auch unerwartete Probleme und zeigt der Person gar nichts. Richtig: `except ValueError: print(\"Bitte ganze Zahl eingeben\")` behandelt nur die erwartete falsche Zahlenform."
      }
    ],
    "quiz": [
      {
        "frage": "Welchen Typ liefert input zunächst zurück?",
        "antworten": [
          "Eine Zeichenkette",
          "Immer eine ganze Zahl",
          "Einen Wahrheitswert"
        ],
        "richtig": 0,
        "erklaerung": "input liefert Text unabhängig davon, ob die Person Ziffern oder Buchstaben eingegeben hat.",
        "begruendungen": [
          "Für Zahlen musst du den gelesenen Text anschließend umwandeln.",
          "Die Eingabe 2 wird ohne int nicht automatisch zur Zahl.",
          "Ein Wahrheitswert entsteht hier nicht durch das Einlesen."
        ]
      },
      {
        "frage": "Was geschieht bei int(\"drei\")?",
        "antworten": [
          "Python liefert 3",
          "Python liefert 0",
          "Ein ValueError entsteht"
        ],
        "richtig": 2,
        "erklaerung": "int erwartet eine geeignete numerische Schreibweise und übersetzt keine ausgeschriebenen Zahlwörter.",
        "begruendungen": [
          "Ausgeschriebene deutsche Wörter werden nicht als Zahlen erkannt.",
          "Python ersetzt eine ungeeignete Eingabe nicht still durch null.",
          "Der gezielte Fehler kann in einem except-Block behandelt werden."
        ]
      },
      {
        "frage": "Wozu dient der ValueError-Block in dieser Aufgabe?",
        "antworten": [
          "Er startet das Programm neu",
          "Er erklärt eine ungeeignete Zahleneingabe",
          "Er fügt eine weitere Fahrkarte hinzu"
        ],
        "richtig": 1,
        "erklaerung": "Der Fehlerzweig gibt der Person eine konkrete Rückmeldung zur fehlgeschlagenen Umwandlung.",
        "begruendungen": [
          "Ein Neustart müsste ausdrücklich programmiert werden.",
          "Die gewählte Meldung hilft beim nächsten Eingabeversuch.",
          "Die Behandlung ändert die Anzahl der Fahrkarten nicht."
        ]
      }
    ],
    "merke": [
      "input liefert eine Textzeile und int übernimmt die Umwandlung.",
      "Fange erwartete Fehler gezielt ab und gib eine hilfreiche Meldung aus."
    ]
  },
  {
    "id": "py-4",
    "sprache": "python",
    "title": "Entscheidungen mit if treffen",
    "minutes": 30,
    "explanation": "Mina prüft, ob ihr Guthaben für einen Einkauf reicht. Du vergleichst zwei Beträge und behandelst auch den Fall, dass sie genau gleich sind.",
    "ziel": "Du wählst mit einer Bedingung zwischen zwei sinnvollen Ausgaben.",
    "schritte": [
      {
        "titel": "Eine Bedingung formulieren",
        "text": "Ein Vergleich liefert wahr oder falsch. Das Zeichen größer-gleich prüft, ob ein Betrag mindestens so groß wie ein anderer ist. Bei gleichem Guthaben und Preis reicht das Geld genau. Überlege diese Grenze vor dem Schreiben. Sonst wirkt das Beispiel richtig, obwohl es an der Grenze scheitert.",
        "code": "reicht = guthaben >= preis",
        "erklaerung": "reicht ist ein Wahrheitswert. Der Vergleich verändert weder das Guthaben noch den Preis."
      },
      {
        "titel": "Den passenden Block auswählen",
        "text": "Nach if steht die Bedingung, danach folgt ein Doppelpunkt. Die eingerückten Zeilen gehören zum Erfolgszweig. Üblich sind vier Leerzeichen. Diese Anweisungen laufen nur, wenn die Bedingung wahr ist. Ein weiterer Vergleich braucht nicht als Text in Anführungszeichen geschrieben zu werden.",
        "code": "if guthaben >= preis:\n    print(\"Reicht\")",
        "erklaerung": "Der Vergleich bleibt ausführbarer Python-Code. Die eingerückte Ausgabe gehört ausschließlich zum wahren Fall."
      },
      {
        "titel": "Den anderen Fall ergänzen",
        "text": "Mit else beschreibst du, was andernfalls geschehen soll. Auch diese Zeile endet mit einem Doppelpunkt. Der else-Zweig gehört auf dieselbe Einrückung wie sein if. Bei dieser Entscheidung wird genau einer der beiden Zweige ausgeführt. Eine Person bekommt dadurch keine widersprüchlichen Antworten.",
        "code": "if guthaben >= preis:\n    print(\"Reicht\")\nelse:\n    print(\"Fehlt\")",
        "erklaerung": "Guthaben unterhalb des Preises führt zum zweiten Block. Beide Ausgaben können bei diesem Aufbau nicht gleichzeitig entstehen."
      },
      {
        "titel": "Die Grenze bewusst testen",
        "text": "Nutze drei Vergleichsfälle: weniger Geld, genau passend und mehr Geld. Der mittlere Fall unterscheidet größer von größer-gleich. Trage die beiden Beträge als Zahlen ein. Halte die Ausgabetexte kurz und eindeutig. Eine geänderte Bedingung soll nicht heimlich einen Betrag neu zuweisen.",
        "code": "guthaben = 8\npreis = 8\nprint(guthaben >= preis)",
        "erklaerung": "Das Ergebnis dieses Vergleichs ist True. Eine strenge Größer-Prüfung würde bei denselben Werten False liefern."
      }
    ],
    "beispiel": {
      "python": "guthaben = 10\npreis = 8\n# Entscheide, ob das Geld reicht.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Gib Reicht aus, wenn guthaben mindestens preis beträgt. Andernfalls gib Fehlt aus. Gleichheit muss als ausreichend gelten.",
      "tipp": "Vergleiche mit >= und teste zusätzlich den Fall, dass beide Beträge denselben Wert haben.",
      "loesung": {
        "python": "guthaben = 10\npreis = 8\nif guthaben >= preis:\n    print(\"Reicht\")\nelse:\n    print(\"Fehlt\")"
      },
      "faelle": [
        {
          "werte": {
            "guthaben": 10,
            "preis": 8
          },
          "ausgabe": "Reicht"
        },
        {
          "werte": {
            "guthaben": 8,
            "preis": 8
          },
          "ausgabe": "Reicht"
        },
        {
          "werte": {
            "guthaben": 5,
            "preis": 8
          },
          "ausgabe": "Fehlt"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Gleichheit ausschließen",
        "text": "Falsch: `if guthaben > preis:` weist ein genau passendes Guthaben dem falschen Zweig zu. Acht Euro reichen für einen Preis von acht Euro. Richtig: `if guthaben >= preis:` berücksichtigt diesen Grenzfall."
      },
      {
        "titel": "Die Einrückung verlieren",
        "text": "Falsch: Eine Ausgabe direkt unter if ohne Einrückung führt zu einem IndentationError. Python erkennt dann keinen zugehörigen Block. Richtig: Rücke `print(\"Reicht\")` unter der Bedingung mit vier Leerzeichen ein."
      }
    ],
    "quiz": [
      {
        "frage": "Reicht ein Guthaben von acht Euro für einen Preis von acht Euro?",
        "antworten": [
          "Nein, es muss mehr sein",
          "Nur bei einer zweiten Bedingung",
          "Ja, beide Werte dürfen gleich sein"
        ],
        "richtig": 2,
        "erklaerung": "Die fachliche Grenze lautet mindestens so viel wie der Preis und schließt Gleichheit ein.",
        "begruendungen": [
          "Ein zusätzlicher Euro ist für diesen Einkauf nicht nötig.",
          "Ein einziger größer-gleich-Vergleich bildet die Regel vollständig ab.",
          "Der Betrag deckt den Preis genau ab."
        ]
      },
      {
        "frage": "Was kennzeichnet den Block hinter einem if?",
        "antworten": [
          "Anführungszeichen um alle Zeilen",
          "Eine gemeinsame Einrückung",
          "Eine schließende geschweifte Klammer"
        ],
        "richtig": 1,
        "erklaerung": "Python benutzt Einrückung, um die zusammengehörigen Anweisungen eines Blocks zu erkennen.",
        "begruendungen": [
          "Anführungszeichen würden aus den Anweisungen einen Text machen.",
          "Eingerückte Anweisungen gehören hier zum bedingten Zweig.",
          "Geschweifte Klammern begrenzen in Python keine if-Blöcke."
        ]
      },
      {
        "frage": "Wie oft wird bei if mit einem else eine Ausgabe aus genau einem dieser Blöcke gewählt?",
        "antworten": [
          "Genau ein Zweig wird gewählt",
          "Beide Zweige laufen immer",
          "Es wird zufällig gewählt"
        ],
        "richtig": 0,
        "erklaerung": "Ein if-else-Aufbau trennt den wahren vom falschen Fall derselben Bedingung.",
        "begruendungen": [
          "Die Bedingung entscheidet eindeutig zwischen den beiden Möglichkeiten.",
          "Der zweite Block ist ausdrücklich der alternative Fall.",
          "Das Ergebnis folgt dem Vergleich und keinem Zufall."
        ]
      }
    ],
    "merke": [
      ">= umfasst auch zwei gleich große Werte.",
      "Die Einrückung gehört zur Bedeutung des Python-Programms."
    ]
  },
  {
    "id": "py-5",
    "sprache": "python",
    "title": "Listen mit einer Schleife auswerten",
    "minutes": 30,
    "explanation": "Eine Lerngruppe sammelt die Preise für ihren Einkauf. Du gehst die Liste durch und berechnest eine Summe, auch wenn die Liste leer ist.",
    "ziel": "Du verarbeitest alle Werte einer Liste mit einer for-Schleife und einem Sammelwert.",
    "schritte": [
      {
        "titel": "Mehrere Werte zusammenhalten",
        "text": "Eine Liste speichert mehrere Werte in einer festen Reihenfolge. Eckige Klammern begrenzen die Liste, Kommas trennen ihre Einträge. Hier sind die Einträge ganze Preise. Eine leere Liste besitzt keine Einträge. Sie ist trotzdem ein gültiger Wert und darf das Programm nicht zum Absturz bringen.",
        "code": "preise = [4, 2, 3]",
        "erklaerung": "Die Liste enthält drei einzelne Zahlen. Sie ist weder eine einzige Zeichenkette noch schon die berechnete Summe."
      },
      {
        "titel": "Alle Einträge besuchen",
        "text": "Eine for-Schleife holt nacheinander jeden Eintrag aus der Liste. Der Name hinter for bezeichnet jeweils den aktuellen Wert. Nach in steht die Liste. Die eingerückte Anweisung wird für jeden Preis ausgeführt. Bei einer leeren Liste wird der Schleifenblock kein einziges Mal betreten.",
        "code": "for preis in preise:\n    print(preis)",
        "erklaerung": "preis ist hier vorübergehend vier, danach zwei und danach drei. Die Schleife verarbeitet die vorhandenen Werte in ihrer Reihenfolge."
      },
      {
        "titel": "Einen Sammelwert aufbauen",
        "text": "Lege vor der Schleife eine Summe mit dem Wert null an. Addiere im Block den aktuellen Preis zur bisherigen Summe. Die Kurzform += bedeutet hier addieren und wieder zuweisen. Setzt du die Summe im Block zurück, verlierst du die früheren Preise. Der Startwert gehört deshalb vor die Schleife.",
        "code": "gesamt = 0\nfor preis in preise:\n    gesamt += preis",
        "erklaerung": "Die Summe wächst nach jedem Durchlauf. Nach den drei Beispielpreisen steht in gesamt die Zahl neun."
      },
      {
        "titel": "Erst am Ende ausgeben",
        "text": "Die fertige Summe gibst du hinter der Schleife aus. Diese Zeile steht wieder ohne die Einrückung des Blocks. Eine Ausgabe im Block würde mehrere Zwischensummen zeigen. Teste zusätzlich eine Liste mit nur einem Preis. Prüfe auch die leere Liste, deren Summe beim Startwert null bleibt.",
        "code": "print(gesamt)",
        "erklaerung": "Außerhalb der Schleife erscheint genau eine Gesamtsumme. Das funktioniert auch dann, wenn kein Durchlauf stattgefunden hat."
      }
    ],
    "beispiel": {
      "python": "preise = [4, 2, 3]\n# Sammle alle Preise in gesamt.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Gib die Summe aller Werte von preise genau einmal aus. Eine leere Liste soll die Ausgabe 0 ergeben.",
      "tipp": "Beginne vor for mit gesamt = 0. Die abschließende print-Zeile gehört hinter den eingerückten Block.",
      "loesung": {
        "python": "preise = [4, 2, 3]\ngesamt = 0\nfor preis in preise:\n    gesamt += preis\nprint(gesamt)"
      },
      "faelle": [
        {
          "werte": {
            "preise": [
              4,
              2,
              3
            ]
          },
          "ausgabe": "9"
        },
        {
          "werte": {
            "preise": [
              8,
              1
            ]
          },
          "ausgabe": "9"
        },
        {
          "werte": {
            "preise": []
          },
          "ausgabe": "0"
        },
        {
          "werte": {
            "preise": [
              7
            ]
          },
          "ausgabe": "7"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Die Summe im Block zurücksetzen",
        "text": "Falsch: `gesamt = 0` am Anfang jedes Schleifendurchlaufs verwirft die vorherige Summe. Am Ende bleibt nur der letzte Preis übrig. Richtig: Initialisiere gesamt einmal vor for und addiere dann mit `gesamt += preis`."
      },
      {
        "titel": "Jeden Zwischenstand ausgeben",
        "text": "Falsch: `print(gesamt)` innerhalb des Blocks zeigt bei drei Preisen drei Zwischensummen. Gesucht ist aber nur das fertige Ergebnis. Richtig: Schreibe die Ausgabe ohne Blockeinrückung hinter die vollständige Schleife."
      }
    ],
    "quiz": [
      {
        "frage": "Wie viele Schleifendurchläufe gibt es bei einer leeren Liste?",
        "antworten": [
          "Einen mit null",
          "Keinen Durchlauf",
          "Unendlich viele"
        ],
        "richtig": 1,
        "erklaerung": "for verarbeitet nur vorhandene Listenelemente und hat bei einer leeren Liste nichts zu besuchen.",
        "begruendungen": [
          "Die Zahl null wird nicht automatisch als Listeneintrag eingefügt.",
          "Ohne Elemente wird der eingerückte Block vollständig übersprungen.",
          "Eine for-Schleife erfindet keine weiteren Einträge."
        ]
      },
      {
        "frage": "Wo muss gesamt = 0 für diese Summenbildung stehen?",
        "antworten": [
          "Vor der for-Schleife",
          "Nach jeder Addition im Block",
          "Erst nach print"
        ],
        "richtig": 0,
        "erklaerung": "Der einmalige Startwert wird vor den Durchläufen gesetzt, damit frühere Summen erhalten bleiben.",
        "begruendungen": [
          "So beginnt die Sammlung einmal bei null.",
          "Das würde die gerade berechnete Summe wieder löschen.",
          "Die Ausgabe braucht den Wert bereits vorher."
        ]
      },
      {
        "frage": "Was zeigt print innerhalb der Summenschleife typischerweise?",
        "antworten": [
          "Nur die Anzahl der Preise",
          "Automatisch nur die fertige Summe",
          "Mehrere Zwischenstände"
        ],
        "richtig": 2,
        "erklaerung": "Jeder Durchlauf erreicht die eingerückte Ausgabe erneut und zeigt den bis dahin gesammelten Wert.",
        "begruendungen": [
          "Für eine Anzahl wäre len der Liste zuständig.",
          "Die Schleife wartet nicht von selbst auf ihren letzten Durchlauf.",
          "Mehrere Preise erzeugen entsprechend mehrere Ausgaben."
        ]
      }
    ],
    "merke": [
      "Eine leere Liste lässt eine for-Schleife aus.",
      "Ein Sammelwert wird vor der Schleife angelegt und im Block verändert."
    ]
  },
  {
    "id": "py-6",
    "sprache": "python",
    "title": "Wörterbücher: Werte über Namen finden",
    "minutes": 30,
    "explanation": "Mina sammelt Kursinformationen in einem Wörterbuch. Du liest einen vorhandenen Eintrag und behandelst einen noch unbekannten Schlüssel ohne Absturz.",
    "ziel": "Du liest ein Dictionary mit get und legst einen sinnvollen Ersatzwert fest.",
    "schritte": [
      {
        "titel": "Schlüssel und Werte zuordnen",
        "text": "Ein Dictionary ordnet Schlüsseln passende Werte zu. Die geschweiften Klammern enthalten Paare aus Schlüssel und Wert. Ein Doppelpunkt verbindet die beiden Teile. Hier wird ein Kursname seinem Raum zugeordnet. Anders als bei einer Liste suchst du nicht über die Position, sondern über einen benannten Schlüssel.",
        "code": "raeume = {\"Python\": \"Raum 2\", \"Deutsch\": \"Raum 4\"}",
        "erklaerung": "Python und Deutsch sind die Schlüssel. Raum 2 und Raum 4 sind die jeweils zugeordneten Textwerte."
      },
      {
        "titel": "Einen bekannten Schlüssel lesen",
        "text": "Mit eckigen Klammern kannst du einen vorhandenen Eintrag abrufen. Der Schlüssel muss genauso geschrieben sein wie im Dictionary. Python unterscheidet dabei große und kleine Buchstaben. Ein solcher Zugriff passt, wenn der Eintrag sicher existiert. Bei unbekannten Schlüsseln entsteht sonst ein KeyError.",
        "code": "print(raeume[\"Python\"])",
        "erklaerung": "Die Ausgabe lautet Raum 2. Der Text Python ist die Adresse des Eintrags und nicht dessen Ergebnis."
      },
      {
        "titel": "Fehlende Einträge berücksichtigen",
        "text": "Mit get liest du einen Schlüssel, ohne für einen fehlenden Eintrag einen KeyError auszulösen. Als zweiten Wert kannst du einen Ersatztext festlegen. Das ist für eine offene Suchanfrage hilfreich. Noch nicht bekannte Kurse zeigen dann eine verständliche Antwort. Ein fehlender Raum wird nicht als vorhandene Information ausgegeben.",
        "code": "print(raeume.get(suche, \"Noch offen\"))",
        "erklaerung": "suche enthält den gesuchten Kursnamen. Nur wenn dieser Schlüssel fehlt, wird Noch offen statt eines Raums ausgegeben."
      },
      {
        "titel": "Den Suchwert verändern",
        "text": "Speichere die Suchanfrage getrennt vom Wörterbuch. Probiere einen vorhandenen und einen unbekannten Kurs aus. Lasse die Anfrage als Variable im get-Aufruf stehen. Ein fest eingetragener Kurs würde alle anderen Suchwerte ignorieren. Die ursprüngliche Zuordnung bleibt beim Lesen unverändert und kann weiterverwendet werden.",
        "code": "suche = \"Mathe\"\nraum = raeume.get(suche, \"Noch offen\")\nprint(raum)",
        "erklaerung": "Weil Mathe hier nicht eingetragen ist, erscheint der Ersatztext. Es wird dadurch kein neuer Schlüssel im Dictionary angelegt."
      }
    ],
    "beispiel": {
      "python": "raeume = {\"Python\": \"Raum 2\", \"Deutsch\": \"Raum 4\"}\nsuche = \"Python\"\n# Suche den Raum oder gib Noch offen aus.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Gib den Raum für den Schlüssel in suche aus. Fehlt dieser Kurs, soll genau Noch offen erscheinen. Verändere das Dictionary dabei nicht.",
      "tipp": "Verwende raeume.get mit suche als erstem und dem Ersatztext als zweitem Argument.",
      "loesung": {
        "python": "raeume = {\"Python\": \"Raum 2\", \"Deutsch\": \"Raum 4\"}\nsuche = \"Python\"\nprint(raeume.get(suche, \"Noch offen\"))"
      },
      "faelle": [
        {
          "werte": {
            "suche": "Python"
          },
          "ausgabe": "Raum 2"
        },
        {
          "werte": {
            "suche": "Deutsch"
          },
          "ausgabe": "Raum 4"
        },
        {
          "werte": {
            "suche": "Mathe"
          },
          "ausgabe": "Noch offen"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Unbekannte Schlüssel direkt lesen",
        "text": "Falsch: `raeume[\"Mathe\"]` löst bei einem fehlenden Eintrag einen KeyError aus. Die Suche endet dann ohne verständlichen Hinweis. Richtig: `raeume.get(\"Mathe\", \"Noch offen\")` liefert den vereinbarten Ersatztext."
      },
      {
        "titel": "Die Suchvariable zitieren",
        "text": "Falsch: `raeume.get(\"suche\", \"Noch offen\")` sucht nach dem festen Schlüssel suche. Der gespeicherte Kursname bleibt ungenutzt. Richtig: `raeume.get(suche, \"Noch offen\")` liest den Wert der Suchvariablen."
      }
    ],
    "quiz": [
      {
        "frage": "Was bezeichnet Python im Dictionary {\"Python\": \"Raum 2\"}?",
        "antworten": [
          "Die erste Listenposition",
          "Den Ersatzwert",
          "Den Schlüssel des Eintrags"
        ],
        "richtig": 2,
        "erklaerung": "Ein Dictionary verwendet den Schlüssel, um den zugeordneten Wert gezielt zu finden.",
        "begruendungen": [
          "Dieses Objekt wird nicht über einen Listenindex angesprochen.",
          "Raum 2 ist ein vorhandener Wert und kein Ersatz für einen fehlenden Schlüssel.",
          "Über diesen Namen wird hier der Raum abgerufen."
        ]
      },
      {
        "frage": "Welcher Aufruf liefert bei einem fehlenden Kurs den Text Noch offen?",
        "antworten": [
          "raeume.get(suche, \"Noch offen\")",
          "raeume[suche]",
          "raeume.get(\"Noch offen\", suche)"
        ],
        "richtig": 0,
        "erklaerung": "Beim get-Aufruf steht zuerst der gesuchte Schlüssel und danach der gewünschte Standardwert.",
        "begruendungen": [
          "Die Argumente stehen in der passenden Reihenfolge.",
          "Der direkte Zugriff kann bei einem unbekannten Kurs einen KeyError auslösen.",
          "Das vertauscht Suchschlüssel und Ersatzwert."
        ]
      },
      {
        "frage": "Was passiert beim Lesen mit get mit dem ursprünglichen Wörterbuch?",
        "antworten": [
          "Der gesuchte Eintrag wird gelöscht",
          "Die Zuordnung bleibt erhalten",
          "Der Ersatzwert wird immer eingetragen"
        ],
        "richtig": 1,
        "erklaerung": "get liest einen Wert oder liefert den Standardwert, ohne selbst einen neuen Eintrag zu speichern.",
        "begruendungen": [
          "Lesen entfernt den Eintrag nicht aus dem Objekt.",
          "Die bestehenden Schlüssel-Wert-Paare werden durch diesen Abruf nicht verändert.",
          "Für das Speichern wäre eine eigene Zuweisung notwendig."
        ]
      }
    ],
    "merke": [
      "Dictionary-Schlüssel und Listenpositionen sind unterschiedliche Zugriffswege.",
      "get kann fehlende Einträge durch einen ausdrücklich gewählten Standardwert ersetzen."
    ]
  },
  {
    "id": "py-7",
    "sprache": "python",
    "title": "Eigene Funktionen schreiben",
    "minutes": 30,
    "explanation": "Sami braucht dieselbe Berechnung für mehrere Kursgruppen. Du fasst eine Rechnung in einer Funktion zusammen und unterscheidest Rückgabe und Bildschirmausgabe.",
    "ziel": "Du definierst eine Funktion mit Parametern und verwendest ihren Rückgabewert weiter.",
    "schritte": [
      {
        "titel": "Eine wiederkehrende Aufgabe benennen",
        "text": "Mit def definierst du eine Funktion. Hinter dem Namen stehen runde Klammern und danach ein Doppelpunkt. Im eingerückten Block beschreibst du die Aufgabe. Der Name soll den Zweck erklären. Eine Definition allein berechnet noch keinen Preis für einen konkreten Einkauf. Dafür braucht es einen späteren Aufruf.",
        "code": "def kosten(preis, anzahl):\n    return preis * anzahl",
        "erklaerung": "kosten ist der Funktionsname. preis und anzahl sind die beiden Parameter, die innerhalb dieser Funktion benutzt werden."
      },
      {
        "titel": "Passende Werte übergeben",
        "text": "Beim Aufruf übergibst du konkrete Argumente. Sie werden den Parametern in ihrer Reihenfolge zugeordnet. Der erste Wert steht hier für den Einzelpreis, der zweite für die Anzahl. Du kannst denselben Funktionskörper mit anderen Werten erneut verwenden. Die Rechnung muss dafür nicht kopiert werden.",
        "code": "ergebnis = kosten(4, 3)",
        "erklaerung": "Der Aufruf bindet vier an preis und drei an anzahl. Das zurückgegebene Produkt wird unter ergebnis gespeichert."
      },
      {
        "titel": "Ein Ergebnis zurückgeben",
        "text": "return beendet die Funktion und gibt einen Wert an den Aufrufer zurück. print schreibt dagegen nur etwas in die Ausgabe. Das sind verschiedene Aufgaben. Eine reine Ausgabe ersetzt die benötigte Rückgabe nicht. Ohne ausdrückliches return liefert eine normale Python-Funktion am Ende den Wert None zurück.",
        "code": "def kosten(preis, anzahl):\n    return preis * anzahl\nprint(kosten(2, 5))",
        "erklaerung": "Die Funktion liefert zehn. Erst der äußere print-Aufruf entscheidet, diesen Wert auch sichtbar auszugeben."
      },
      {
        "titel": "Die Rechnung weiterverwenden",
        "text": "Weil ein Wert zurückgegeben wird, kannst du damit weiterrechnen. Addiere zum Beispiel einen gemeinsamen Versandbetrag nach dem Funktionsaufruf. Halte diesen Zuschlag außerhalb der Funktion, wenn die Funktion nur Warenkosten berechnen soll. Teste außerdem eine Anzahl von null. Ein allgemeiner Rechenweg muss auch diese Grenze abdecken.",
        "code": "gesamt = kosten(4, 3) + 2",
        "erklaerung": "Hier entsteht zuerst ein Warenwert von zwölf. Anschließend wird der gemeinsame Versandbetrag von zwei Euro addiert."
      }
    ],
    "beispiel": {
      "python": "preis = 4\nanzahl = 3\n# Definiere kosten(p, n) und gib kosten(preis, anzahl) aus.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Schreibe die Funktion kosten mit zwei Parametern. Sie soll das Produkt zurückgeben. Gib den Rückgabewert für preis und anzahl genau einmal aus.",
      "tipp": "Der Funktionsblock braucht return p * n. print gehört bei dieser Aufgabe zum Aufruf außerhalb der Funktion.",
      "loesung": {
        "python": "preis = 4\nanzahl = 3\ndef kosten(p, n):\n    return p * n\nprint(kosten(preis, anzahl))"
      },
      "faelle": [
        {
          "werte": {
            "preis": 4,
            "anzahl": 3
          },
          "ausgabe": "12",
          "nachweis": "callable(kosten) and kosten(3, 7) == 21 and kosten(0, 2) == 0"
        },
        {
          "werte": {
            "preis": 6,
            "anzahl": 2
          },
          "ausgabe": "12",
          "nachweis": "callable(kosten) and kosten(3, 7) == 21 and kosten(0, 2) == 0"
        },
        {
          "werte": {
            "preis": 5,
            "anzahl": 0
          },
          "ausgabe": "0",
          "nachweis": "callable(kosten) and kosten(3, 7) == 21 and kosten(0, 2) == 0"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Nur innerhalb der Funktion drucken",
        "text": "Falsch: Eine Funktion mit `print(p * n)` und ohne return gibt None zurück. Ein äußerer print zeigt dann zusätzlich None. Richtig: Benutze im Körper `return p * n` und gib erst den Rückgabewert außerhalb aus."
      },
      {
        "titel": "Die Funktion nur nennen",
        "text": "Falsch: `print(kosten)` zeigt das Funktionsobjekt statt eines berechneten Preises. Es wurde noch kein Aufruf mit Zahlen gemacht. Richtig: `print(kosten(preis, anzahl))` übergibt die beiden Werte und zeigt das Ergebnis."
      }
    ],
    "quiz": [
      {
        "frage": "Was bewirkt return im Körper dieser Rechenfunktion?",
        "antworten": [
          "Es gibt einen Wert an den Aufrufer zurück",
          "Es druckt immer eine Textzeile",
          "Es wiederholt die ganze Funktion"
        ],
        "richtig": 0,
        "erklaerung": "return beendet diesen Aufruf mit einem Ergebnis, das anschließend weiterbenutzt werden kann.",
        "begruendungen": [
          "Der Aufrufer kann das Produkt speichern oder ausgeben.",
          "Eine sichtbare Ausgabe verlangt weiterhin print.",
          "Eine Wiederholung wird dadurch nicht eingerichtet."
        ]
      },
      {
        "frage": "Was liefert eine normale Funktion ohne ausdrückliches return am Ende?",
        "antworten": [
          "Die letzte gedruckte Zahl",
          "Den Namen der Funktion",
          "Den Wert None"
        ],
        "richtig": 2,
        "erklaerung": "Eine sichtbare Ausgabe wird nicht automatisch zum Rückgabewert einer Funktion.",
        "begruendungen": [
          "print zeigt einen Wert, überträgt ihn aber nicht als Rückgabe der äußeren Funktion.",
          "Der Funktionsname wird nicht als Ergebnis eingesetzt.",
          "None kennzeichnet hier das fehlende ausdrückliche Ergebnis."
        ]
      },
      {
        "frage": "Wie rufst du kosten mit zwei Werten auf?",
        "antworten": [
          "kosten[4, 3]",
          "kosten(4, 3)",
          "def kosten = 4, 3"
        ],
        "richtig": 1,
        "erklaerung": "Runde Klammern führen den Funktionsaufruf aus und enthalten die übergebenen Argumente.",
        "begruendungen": [
          "Eckige Klammern sind hier kein Aufruf einer Funktion.",
          "Vier und drei werden in dieser Reihenfolge an die Parameter übergeben.",
          "def verwendet eine andere Schreibweise und definiert statt aufzurufen."
        ]
      }
    ],
    "merke": [
      "Parameter stehen in der Definition, Argumente werden beim Aufruf übergeben.",
      "Eine Rückgabe erlaubt weitere Rechnungen, während print nur die Ausgabe bedient."
    ]
  },
  {
    "id": "py-8",
    "sprache": "python",
    "title": "Projekt: einen Ausgabenplan speichern",
    "minutes": 30,
    "explanation": "Die Lerngruppe plant ihren nächsten gemeinsamen Einkauf. Du kombinierst eine Liste, eine Summe und eine lokale JSON-Datei zu einem kleinen Ausgabenplan.",
    "ziel": "Du speicherst geplante Ausgaben als JSON und berechnest das verbleibende Budget aus den gelesenen Daten.",
    "schritte": [
      {
        "titel": "Ein kleines Datenmodell wählen",
        "text": "Speichere das Budget und die einzelnen Ausgaben in getrennten Variablen. Die Liste enthält hier ganze Eurobeträge. Notiere vor dem Programmieren, welche Zahl die Ausgabe zeigen soll. Der Rest ergibt sich aus Budget minus Summe der Ausgaben. Ein negativer Rest zeigt eine Überschreitung, nicht einen Programmfehler.",
        "code": "budget = 20\nausgaben = [4, 3, 6]",
        "erklaerung": "Das Budget ist der verfügbare Gesamtbetrag. Die Liste beschreibt einzelne geplante Zahlungen und darf auch leer sein."
      },
      {
        "titel": "Eine JSON-Datei schreiben",
        "text": "JSON ist ein Textformat für strukturierte Daten. Importiere dafür das Modul json. Mit with öffnest du eine Datei für einen begrenzten Abschnitt. Der Modus w schreibt neuen Inhalt und kann vorhandenen Inhalt ersetzen. In diesem Kurs liegt die Datei im virtuellen Dateisystem des Workers, nicht automatisch auf deinem PC.",
        "code": "import json\nwith open(\"plan.json\", \"w\", encoding=\"utf-8\") as datei:\n    json.dump(ausgaben, datei)",
        "erklaerung": "dump schreibt die Liste als JSON in das geöffnete Dateiobjekt. with schließt die Datei anschließend zuverlässig."
      },
      {
        "titel": "Die gespeicherten Daten lesen",
        "text": "Öffne die Datei zum Lesen mit dem Modus r. json.load stellt aus ihrem Inhalt wieder Python-Daten her. Bei diesem Beispiel entsteht erneut eine Liste. Verwechsle das geöffnete Dateiobjekt nicht mit dem Pfad als Text. Berechne die Summe aus den gelesenen Daten, damit dein Programm den Speicherweg tatsächlich benutzt.",
        "code": "with open(\"plan.json\", \"r\", encoding=\"utf-8\") as datei:\n    gelesen = json.load(datei)",
        "erklaerung": "load liest hier aus dem Dateiobjekt. Ein fehlerhafter JSON-Inhalt würde eine Ausnahme auslösen und müsste in einer größeren Anwendung behandelt werden."
      },
      {
        "titel": "Den Restbetrag verständlich ausgeben",
        "text": "Die eingebaute Funktion sum addiert numerische Einträge einer Liste. Ziehe diese Summe vom Budget ab und gib den Rest mit einer kurzen Beschriftung aus. Teste einen positiven Rest, ein leeres Vorhaben und eine Überschreitung. Beende oder stoppe den Worker erst nach der Ausgabe. Seine virtuellen Dateien bleiben nicht über neue Läufe erhalten.",
        "code": "rest = budget - sum(gelesen)\nprint(f\"Rest: {rest}\")",
        "erklaerung": "Für die Beispieldaten bleiben sieben Euro. Dauerhaftes Herunterladen einer Datei wäre eine zusätzliche Funktion und wird hier nicht behauptet."
      }
    ],
    "beispiel": {
      "python": "budget = 20\nausgaben = [4, 3, 6]\n# Speichere die Liste in plan.json, lies sie und berechne den Rest.\n",
      "eingabe": ""
    },
    "aufgabe": {
      "text": "Schreibe ausgaben in plan.json und lies die Liste wieder ein. Gib danach Rest: und den verbleibenden Betrag aus. Zwischen Beschriftung und Zahl steht ein Leerzeichen.",
      "tipp": "Verwende json.dump beim Schreiben und json.load beim Lesen. Subtrahiere sum(gelesen) vom Budget.",
      "loesung": {
        "python": "budget = 20\nausgaben = [4, 3, 6]\nimport json\nwith open(\"plan.json\", \"w\", encoding=\"utf-8\") as datei:\n    json.dump(ausgaben, datei)\nwith open(\"plan.json\", \"r\", encoding=\"utf-8\") as datei:\n    gelesen = json.load(datei)\nrest = budget - sum(gelesen)\nprint(f\"Rest: {rest}\")"
      },
      "faelle": [
        {
          "werte": {
            "budget": 20,
            "ausgaben": [
              4,
              3,
              6
            ]
          },
          "ausgabe": "Rest: 7",
          "nachweis": "gelesen == ausgaben and json.load(open(\"plan.json\", encoding=\"utf-8\")) == ausgaben"
        },
        {
          "werte": {
            "budget": 10,
            "ausgaben": []
          },
          "ausgabe": "Rest: 10",
          "nachweis": "gelesen == ausgaben and json.load(open(\"plan.json\", encoding=\"utf-8\")) == ausgaben"
        },
        {
          "werte": {
            "budget": 5,
            "ausgaben": [
              4,
              3
            ]
          },
          "ausgabe": "Rest: -2",
          "nachweis": "gelesen == ausgaben and json.load(open(\"plan.json\", encoding=\"utf-8\")) == ausgaben"
        }
      ]
    },
    "fehler": [
      {
        "titel": "Den Pfad statt der Datei übergeben",
        "text": "Falsch: `json.load(\"plan.json\")` übergibt einen Text statt eines geöffneten Dateiobjekts. So kann load die Daten nicht lesen. Richtig: Öffne den Pfad mit with und übergib das erhaltene Objekt datei an `json.load(datei)`."
      },
      {
        "titel": "Virtuelle Dateien für dauerhaft halten",
        "text": "Falsch: Die Behauptung „plan.json bleibt nach jedem Neustart auf deinem PC“ verwechselt Workerspeicher mit einem Download. Richtig: Die Datei lebt nur im aktuellen Python-Lauf. Für dauerhafte Arbeit überträgst du deinen Quelltext ins Studio."
      }
    ],
    "quiz": [
      {
        "frage": "Welches Argument erwartet json.load in diesem Beispiel?",
        "antworten": [
          "Das geöffnete Dateiobjekt",
          "Den gedruckten Restbetrag",
          "Nur den Dateinamen als Text"
        ],
        "richtig": 0,
        "erklaerung": "json.load liest den JSON-Inhalt aus einer geöffneten Datei und stellt die enthaltenen Daten her.",
        "begruendungen": [
          "Das von open erhaltene Objekt bietet den benötigten Lesezugriff.",
          "Ein berechneter Betrag ist keine lesbare Datei.",
          "Ein Dateiname allein wird von load nicht automatisch geöffnet."
        ]
      },
      {
        "frage": "Was bedeutet ein Restbetrag von minus zwei Euro?",
        "antworten": [
          "Die Ausgaben liegen zwei Euro über dem Budget",
          "Python hat die Datei verloren",
          "Eine leere Liste wurde gelesen"
        ],
        "richtig": 0,
        "erklaerung": "Budget minus Ausgaben darf negativ werden und beschreibt dann die Höhe der Überschreitung.",
        "begruendungen": [
          "Die Rechnung meldet hier eine fachlich sinnvolle Budgetgrenze.",
          "Das Vorzeichen sagt nichts über einen Dateiverlust aus.",
          "Bei einer leeren Ausgabenliste bliebe das gesamte Budget übrig."
        ]
      },
      {
        "frage": "Was gilt für plan.json nach dem Ende dieses Workers?",
        "antworten": [
          "Die Datei ist automatisch öffentlich",
          "Sie wird automatisch auf den PC geladen",
          "Für einen neuen Lauf wird sie neu erstellt"
        ],
        "richtig": 2,
        "erklaerung": "Der Worker benutzt ein flüchtiges virtuelles Dateisystem; ein neuer Lauf erhält einen frischen Zustand.",
        "begruendungen": [
          "Lokale Dateierstellung veröffentlicht den Inhalt nicht.",
          "Ein Download müsste gesondert angefordert und umgesetzt werden.",
          "Der Beispielcode schreibt seine Eingabedaten deshalb bei jedem Lauf erneut."
        ]
      }
    ],
    "merke": [
      "with begrenzt den Zugriff auf eine geöffnete Datei und schließt sie anschließend.",
      "Virtuelles Dateisystem und dauerhafter Datei-Download sind verschiedene Dinge."
    ]
  }
];if(typeof module!=="undefined"&&module.exports)module.exports=root.SDAkademieKurse.python;})(typeof window!=="undefined"?window:globalThis);
