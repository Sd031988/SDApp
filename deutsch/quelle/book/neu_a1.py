# Kursbuch A1 – neue Einheiten (eigene Inhalte), Themen wie in Integrationskurs-Büchern A1:
# Freizeit, Kleidung, Kundenservice. Werden HINTEN an A1 angehängt (bestehender Lernstand bleibt gültig).
UNITS = [
    {
        "t": "Freizeit und Hobbys",
        "goals": "Hobbys, Wochenende, sich verabreden; gern / nicht gern; Verben mit Vokalwechsel (lesen – liest, fahren – fährt)",
        "w": [
            "die Freizeit||free time|وقت آزاد",
            "das Hobby|die Hobbys|hobby|سرگرمی",
            "das Wochenende|die Wochenenden|weekend|آخر هفته",
            "gern||gladly, like to|با علاقه، خوش داشتن",
            "lesen||to read|خواندن",
            "schwimmen||to swim|آب‌بازی کردن، شنا کردن",
            "tanzen||to dance|رقصیدن",
            "singen||to sing|آواز خواندن",
            "spielen||to play|بازی کردن",
            "treffen||to meet|ملاقات کردن، دیدن",
            "fahren||to drive, to ride, to go|رفتن (با وسیله)، راندن",
            "spazieren gehen||to go for a walk|قدم زدن",
            "der Fußball||football, soccer|فوتبال",
            "das Fahrrad|die Fahrräder|bicycle|بایسکل",
            "die Musik||music|موسیقی",
            "der Park|die Parks|park|پارک",
        ],
        "p": ["Was machst du gern?", "Ich spiele gern Fußball.", "Ich lese nicht gern.", "Hast du am Samstag Zeit?",
              "Wollen wir zusammen schwimmen gehen?", "Gute Idee! / Tut mir leid, ich habe keine Zeit."],
        "g": {
            "title": "Verben mit Vokalwechsel",
            "head": ["", "lesen", "fahren", "treffen", "sehen"],
            "rows": [["ich", "lese", "fahre", "treffe", "sehe"], ["du", "liest", "fährst", "triffst", "siehst"],
                     ["er / sie", "liest", "fährt", "trifft", "sieht"], ["wir", "lesen", "fahren", "treffen", "sehen"],
                     ["ihr", "lest", "fahrt", "trefft", "seht"], ["sie / Sie", "lesen", "fahren", "treffen", "sehen"]],
            "de": "Bei manchen Verben ändert sich der Vokal – aber nur bei du und er/sie: e → i/ie, a → ä.",
            "en": "Some verbs change their vowel, but only with du and er/sie/es: e becomes i or ie (lesen – du liest, treffen – du triffst), a becomes ä (fahren – du fährst). All other forms stay regular.",
            "fa": "در بعضی فعل‌ها حرف صدادار تغییر می‌کند، اما فقط با du و er/sie/es: ‏e به i یا ie تبدیل می‌شود (lesen – du liest، treffen – du triffst) و a به ä (fahren – du fährst). بقیهٔ شکل‌ها عادی می‌مانند.",
        },
        "r": {"title": "Das Wochenende von Familie Rahimi",
              "text": "Am Wochenende hat Familie Rahimi Zeit. Am Samstag fährt Herr Rahimi mit dem Fahrrad in den Park. "
                      "Dort spielt er mit seinem Sohn Fußball. Frau Rahimi liest gern. Sie geht am Samstag in die Bibliothek. "
                      "Am Sonntag trifft die Familie Freunde. Sie kochen zusammen und hören Musik. Die Tochter tanzt sehr gern.",
              "q": [["Wohin fährt Herr Rahimi am Samstag?", ["in den Park", "in die Bibliothek", "zur Arbeit"], 0],
                    ["Was macht Frau Rahimi gern?", ["Sie liest gern.", "Sie spielt gern Fußball.", "Sie fährt gern Fahrrad."], 0],
                    ["Was macht die Familie am Sonntag?", ["Sie trifft Freunde.", "Sie arbeitet.", "Sie fährt in die Stadt."], 0]]},
        "d": {"title": "Eine Verabredung", "lines": [
            ["Leila", "Hallo Omid! Hast du am Samstag Zeit?"], ["Omid", "Am Vormittag nicht, da arbeite ich. Am Nachmittag habe ich Zeit."],
            ["Leila", "Wollen wir schwimmen gehen?"], ["Omid", "Ich schwimme nicht so gern. Gehen wir lieber spazieren?"],
            ["Leila", "Gut, dann gehen wir in den Park. Um drei Uhr?"], ["Omid", "Ja, gern. Bis Samstag!"]],
            "q": [["Wann hat Omid am Samstag Zeit?", ["am Nachmittag", "am Vormittag", "am Abend"], 0],
                  ["Was machen Leila und Omid?", ["Sie gehen im Park spazieren.", "Sie gehen schwimmen.", "Sie spielen Fußball."], 0]]},
        "s": {"task": "Schreib über deine Freizeit: Was machst du gern? Was machst du nicht gern? Was machst du am Wochenende? (4–5 Sätze)",
              "model": "In meiner Freizeit lese ich gern. Ich spiele auch gern Fußball mit meinen Freunden. Ich tanze nicht gern. Am Samstag fahre ich mit dem Fahrrad in den Park. Am Sonntag besuche ich meine Familie."},
        "words": """
# Sport und Spiel
der Sport||sport|ورزش
joggen||to jog|دویدن (ورزشی)
Rad fahren||to cycle|بایسکل‌سواری کردن
das Spiel|die Spiele|game, match|بازی
die Mannschaft|die Mannschaften|team|تیم
das Schwimmbad|die Schwimmbäder|swimming pool|حوض آب‌بازی
# Kultur und Medien
das Buch|die Bücher|book|کتاب
der Film|die Filme|film, movie|فیلم
das Kino|die Kinos|cinema|سینما
die Bibliothek|die Bibliotheken|library|کتابخانه
das Konzert|die Konzerte|concert|کنسرت
fotografieren||to take photos|عکس گرفتن
malen||to paint|نقاشی کردن
hören||to hear, to listen|شنیدن، گوش دادن
# Verabredung
die Zeit||time|وقت
die Idee|die Ideen|idea|نظر، فکر
zusammen||together|با هم
der Vormittag|die Vormittage|morning (before noon)|قبل از ظهر
der Nachmittag|die Nachmittage|afternoon|بعد از ظهر
lieber||rather, preferably|بهتر، ترجیحاً
leider||unfortunately|متأسفانه
""",
    },
    {
        "t": "Kleidung und Wetter",
        "goals": "Kleidung kaufen, Farben, Größe, Wetter; Welcher? Welche? Welches? – dieser, diese, dieses",
        "w": [
            "die Kleidung||clothes|لباس",
            "die Hose|die Hosen|trousers|پتلون",
            "das Hemd|die Hemden|shirt|پیراهن",
            "die Jacke|die Jacken|jacket|جاکت",
            "der Pullover|die Pullover|jumper, sweater|بافتنی، پلوور",
            "der Rock|die Röcke|skirt|دامن",
            "das Kleid|die Kleider|dress|لباس زنانه",
            "der Schuh|die Schuhe|shoe|بوت، کفش",
            "die Größe|die Größen|size|سایز، اندازه",
            "die Farbe|die Farben|colour|رنگ",
            "anprobieren||to try on|امتحان کردن (لباس)",
            "passen||to fit|اندازه بودن",
            "das Wetter||weather|هوا",
            "die Sonne||sun|آفتاب",
            "der Regen||rain|باران",
            "kalt||cold|سرد",
            "warm||warm|گرم",
        ],
        "p": ["Ich suche eine Jacke.", "Welche Größe haben Sie?", "Kann ich die Hose anprobieren?", "Die Schuhe passen nicht, sie sind zu klein.",
              "Wie ist das Wetter heute?", "Es regnet. / Die Sonne scheint. / Es ist kalt."],
        "g": {
            "title": "Welcher? Welche? Welches? – dieser, diese, dieses",
            "head": ["", "der (m)", "das (n)", "die (f)", "die (Plural)"],
            "rows": [["Frage", "Welcher Rock?", "Welches Hemd?", "Welche Hose?", "Welche Schuhe?"],
                     ["Antwort", "dieser Rock", "dieses Hemd", "diese Hose", "diese Schuhe"],
                     ["Akkusativ", "diesen Rock", "dieses Hemd", "diese Hose", "diese Schuhe"]],
            "de": "welch- und dies- haben die Endungen wie der Artikel: der → dieser, das → dieses, die → diese. Im Akkusativ: der → diesen.",
            "en": "welch- (which) and dies- (this) take the same endings as the article: der → welcher/dieser, das → welches/dieses, die → welche/diese. In the accusative only the masculine changes: diesen Rock.",
            "fa": "welch- (کدام) و dies- (این) همان پسوندهای حرف تعریف را می‌گیرند: der ← welcher/dieser، das ← welches/dieses، die ← welche/diese. در حالت مفعولی (Akkusativ) فقط مذکر تغییر می‌کند: diesen Rock.",
        },
        "r": {"title": "Im Kaufhaus",
              "text": "Es ist November und es ist kalt. Maryam braucht eine warme Jacke. Sie geht mit ihrer Schwester ins Kaufhaus. "
                      "Die Jacken sind im ersten Stock. Maryam probiert eine blaue Jacke in Größe 38 an. Sie ist zu klein. "
                      "Die Jacke in Größe 40 passt gut. Sie kostet 59 Euro. Maryam kauft auch noch einen grauen Pullover.",
              "q": [["Warum braucht Maryam eine Jacke?", ["Es ist kalt.", "Ihre Jacke ist zu groß.", "Sie hat Geburtstag."], 0],
                    ["Welche Größe passt?", ["Größe 40", "Größe 38", "Größe 42"], 0],
                    ["Was kauft Maryam noch?", ["einen Pullover", "einen Rock", "Schuhe"], 0]]},
        "d": {"title": "Im Schuhgeschäft", "lines": [
            ["Verkäuferin", "Guten Tag! Kann ich Ihnen helfen?"], ["Kunde", "Ja, ich suche Schuhe für den Winter."],
            ["Verkäuferin", "Welche Größe haben Sie?"], ["Kunde", "Größe 43. Kann ich diese Schuhe hier anprobieren?"],
            ["Verkäuferin", "Natürlich. Passen sie?"], ["Kunde", "Ja, sie passen gut. Was kosten sie?"], ["Verkäuferin", "Sie kosten 79 Euro."]],
            "q": [["Was sucht der Kunde?", ["Winterschuhe", "eine Jacke", "eine Hose"], 0],
                  ["Wie viel kosten die Schuhe?", ["79 Euro", "43 Euro", "97 Euro"], 0]]},
        "s": {"task": "Was ziehst du heute an? Wie ist das Wetter? Schreib 4–5 Sätze.",
              "model": "Heute ist es kalt und es regnet. Ich ziehe eine warme Hose und einen Pullover an. Ich nehme auch meine Jacke. Meine Schuhe sind schwarz. Morgen scheint die Sonne, dann ziehe ich ein Hemd an."},
        "words": """
# Mehr Kleidung
das T-Shirt|die T-Shirts|T-shirt|تی‌شرت
der Mantel|die Mäntel|coat|بالاپوش
die Mütze|die Mützen|woolly hat|کلاه پشمی
der Schal|die Schals|scarf|شال گردن
die Socke|die Socken|sock|جوراب
der Stiefel|die Stiefel|boot|موزه، بوت ساق‌دار
anziehen||to put on (clothes)|پوشیدن
ausziehen||to take off (clothes)|کشیدن (لباس)
die Umkleidekabine|die Umkleidekabinen|changing room|اتاق تبدیل لباس
das Kaufhaus|die Kaufhäuser|department store|فروشگاه بزرگ
# Farben
rot||red|سرخ
blau||blue|آبی
grün||green|سبز
gelb||yellow|زرد
schwarz||black|سیاه
weiß||white|سفید
grau||grey|خاکستری
braun||brown|قهوه‌ای
# Wetter
der Schnee||snow|برف
der Wind|die Winde|wind|باد
die Wolke|die Wolken|cloud|ابر
regnen||to rain|باریدن (باران)
scheinen||to shine|تابیدن
heiß||hot|داغ، خیلی گرم
der Grad|die Grad|degree|درجه
""",
    },
    {
        "t": "Kundenservice und Reparaturen",
        "goals": "etwas ist kaputt, Reparatur, Termin am Telefon, höflich bitten; Könnten Sie …? Würden Sie …?",
        "w": [
            "kaputt||broken|خراب",
            "funktionieren||to work, to function|کار کردن (دستگاه)",
            "reparieren||to repair|ترمیم کردن، جور کردن",
            "die Reparatur|die Reparaturen|repair|ترمیم",
            "der Hausmeister|die Hausmeister|caretaker|سرایدار",
            "der Kundenservice||customer service|خدمات مشتریان",
            "die Heizung|die Heizungen|heating|بخاری مرکزی",
            "die Waschmaschine|die Waschmaschinen|washing machine|ماشین لباس‌شویی",
            "der Kühlschrank|die Kühlschränke|fridge|یخچال",
            "das Licht|die Lichter|light|چراغ، روشنی",
            "anrufen||to call (phone)|زنگ زدن",
            "zurückrufen||to call back|دوباره زنگ زدن",
            "die Nachricht|die Nachrichten|message|پیام",
            "dringend||urgent|فوری",
            "helfen||to help|کمک کردن",
        ],
        "p": ["Meine Heizung ist kaputt.", "Die Waschmaschine funktioniert nicht.", "Könnten Sie bitte morgen kommen?",
              "Würden Sie mich bitte zurückrufen?", "Wann haben Sie Zeit?", "Es ist dringend."],
        "g": {
            "title": "Höfliche Bitten: könnten und würden",
            "head": ["", "können → könnten", "werden → würden"],
            "rows": [["ich", "könnte", "würde"], ["du", "könntest", "würdest"], ["er / sie", "könnte", "würde"],
                     ["wir", "könnten", "würden"], ["ihr", "könntet", "würdet"], ["sie / Sie", "könnten", "würden"]],
            "de": "Höflich bitten: Könnten Sie bitte …? Würden Sie bitte …? Das zweite Verb steht am Ende: Könnten Sie mir helfen?",
            "en": "For polite requests use könnten or würden + bitte: 'Könnten Sie mir bitte helfen?' – 'Würden Sie mich bitte zurückrufen?' The main verb goes to the end in the infinitive. This is much more polite than 'Helfen Sie mir!'",
            "fa": "برای درخواست مؤدبانه از könnten یا würden همراه با bitte استفاده کنید: «Könnten Sie mir bitte helfen?» – «Würden Sie mich bitte zurückrufen?». فعل اصلی به شکل مصدر در آخر جمله می‌آید. این خیلی مؤدبانه‌تر از «Helfen Sie mir!» است.",
        },
        "r": {"title": "Eine Nachricht an den Hausmeister",
              "text": "Sehr geehrter Herr Wagner, in meiner Wohnung im zweiten Stock funktioniert die Heizung nicht. "
                      "Es ist sehr kalt und meine Kinder sind klein. Könnten Sie bitte schnell kommen? "
                      "Ich bin jeden Tag ab 14 Uhr zu Hause. Am Vormittag bin ich im Deutschkurs. "
                      "Würden Sie mich bitte vorher anrufen? Meine Nummer ist 0176 23 45 67. Vielen Dank! Freundliche Grüße, Nasrin Karimi",
              "q": [["Was ist kaputt?", ["die Heizung", "die Waschmaschine", "das Licht"], 0],
                    ["Wann ist Frau Karimi zu Hause?", ["ab 14 Uhr", "am Vormittag", "nur am Wochenende"], 0],
                    ["Was soll Herr Wagner vorher machen?", ["Er soll anrufen.", "Er soll eine E-Mail schreiben.", "Er soll den Schlüssel holen."], 0]]},
        "d": {"title": "Anruf beim Kundenservice", "lines": [
            ["Kundenservice", "Kundenservice, Sie sprechen mit Frau Lang. Was kann ich für Sie tun?"],
            ["Herr Haidari", "Guten Tag, mein Name ist Haidari. Meine Waschmaschine ist neu, aber sie funktioniert nicht."],
            ["Kundenservice", "Das tut mir leid. Wir schicken einen Techniker. Passt es Ihnen am Donnerstag?"],
            ["Herr Haidari", "Am Donnerstag arbeite ich. Könnte der Techniker am Freitag kommen?"],
            ["Kundenservice", "Ja, am Freitag zwischen 8 und 12 Uhr."], ["Herr Haidari", "Sehr gut, vielen Dank!"]],
            "q": [["Was ist das Problem?", ["Die neue Waschmaschine funktioniert nicht.", "Der Kühlschrank ist kaputt.", "Die Heizung ist kalt."], 0],
                  ["Wann kommt der Techniker?", ["am Freitag zwischen 8 und 12 Uhr", "am Donnerstag", "am Montag um 12 Uhr"], 0]]},
        "s": {"task": "Dein Kühlschrank ist kaputt. Schreib eine kurze Nachricht an deinen Vermieter: Was ist kaputt? Bitte höflich um einen Termin. (4–5 Sätze)",
              "model": "Sehr geehrte Frau Becker, mein Kühlschrank ist seit gestern kaputt. Er ist nicht mehr kalt. Könnten Sie bitte einen Techniker schicken? Ich bin am Nachmittag zu Hause. Vielen Dank und freundliche Grüße, Ali Hosseini"},
        "words": """
# In der Wohnung
die Lampe|die Lampen|lamp|چراغ
die Steckdose|die Steckdosen|socket|ساکت برق
der Wasserhahn|die Wasserhähne|tap|نل آب
die Toilette|die Toiletten|toilet|تشناب
das Fenster|die Fenster|window|کلکین
die Tür|die Türen|door|دروازه
der Schlüssel|die Schlüssel|key|کلید
# Service
der Techniker|die Techniker|technician|تکنیسن
die Garantie|die Garantien|guarantee, warranty|ضمانت
die Rechnung|die Rechnungen|bill, invoice|بل، صورت‌حساب
schicken||to send|فرستادن
dauern||to take (time), to last|طول کشیدن
das Problem|die Probleme|problem|مشکل
# Telefonieren
die Telefonnummer|die Telefonnummern|phone number|شمارهٔ تلفن
besetzt||engaged, busy (phone)|مشغول
der Anrufbeantworter|die Anrufbeantworter|answering machine|پیام‌گیر تلفن
sprechen mit||to speak to|صحبت کردن با
Was kann ich für Sie tun?||What can I do for you?|چه کمکی از دستم می‌آید؟
""",
    },
]
