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

# Zweite Runde: restliche Themen aus A1-Kursbüchern (Kinder und Schule, Ämter, Feste)
UNITS += [
    {
        "t": "Kinder und Schule",
        "goals": "Schule und Kita, Schulsachen, Elternabend, Kind krankmelden; Modalverben müssen und dürfen",
        "w": [
            "die Schule|die Schulen|school|مکتب",
            "die Kita|die Kitas|day nursery|کودکستان",
            "der Lehrer|die Lehrer|teacher (male)|معلم",
            "die Lehrerin|die Lehrerinnen|teacher (female)|معلم (زن)",
            "der Schüler|die Schüler|pupil (male)|شاگرد",
            "die Schülerin|die Schülerinnen|pupil (female)|شاگرد (دختر)",
            "die Klasse|die Klassen|class|صنف",
            "die Hausaufgabe|die Hausaufgaben|homework|کارخانگی",
            "das Heft|die Hefte|exercise book|کتابچه",
            "der Stift|die Stifte|pen, pencil|قلم",
            "die Pause|die Pausen|break|تفریح (در مکتب)",
            "der Elternabend|die Elternabende|parents' evening|جلسهٔ والدین",
            "müssen||must, to have to|باید",
            "dürfen||may, to be allowed to|اجازه داشتن",
            "lernen||to learn|یاد گرفتن، درس خواندن",
        ],
        "p": ["Mein Sohn geht in die zweite Klasse.", "Meine Tochter ist krank. Sie kann heute nicht kommen.", "Muss mein Kind ein Heft mitbringen?",
              "Darf mein Kind heute früher gehen?", "Wann ist der Elternabend?", "Die Kinder müssen um acht Uhr in der Schule sein."],
        "g": {
            "title": "Modalverben: müssen und dürfen",
            "head": ["", "müssen", "dürfen"],
            "rows": [["ich", "muss", "darf"], ["du", "musst", "darfst"], ["er / sie", "muss", "darf"],
                     ["wir", "müssen", "dürfen"], ["ihr", "müsst", "dürft"], ["sie / Sie", "müssen", "dürfen"]],
            "de": "Das Modalverb steht auf Position 2, das zweite Verb am Ende: Du musst Hausaufgaben machen. Ich und er/sie haben keine Endung: ich muss, er darf.",
            "en": "The modal verb is in position 2, the main verb goes to the end in the infinitive: 'Du musst Hausaufgaben machen.' ich and er/sie have no ending: ich muss, er darf. müssen = it is necessary; dürfen = it is allowed. 'nicht dürfen' means it is forbidden.",
            "fa": "فعل وجهی در جای دوم و فعل اصلی به شکل مصدر در آخر جمله می‌آید: «Du musst Hausaufgaben machen.» ‏ich و er/sie پسوند ندارند: ich muss، er darf. ‏müssen یعنی لازم است؛ dürfen یعنی اجازه است. «nicht dürfen» یعنی ممنوع است.",
        },
        "r": {"title": "Ein Brief von der Schule",
              "text": "Liebe Eltern, am Freitag machen wir mit der Klasse 2b einen Ausflug in den Zoo. Wir fahren um 8:15 Uhr mit dem Bus ab. "
                      "Die Kinder müssen um acht Uhr an der Schule sein. Sie brauchen ein Frühstück, etwas zu trinken und eine Jacke. "
                      "Handys dürfen die Kinder nicht mitnehmen. Der Ausflug kostet 5 Euro. Wir sind um 13 Uhr wieder an der Schule. Viele Grüße, Frau Klein",
              "q": [["Wohin geht die Klasse am Freitag?", ["in den Zoo", "ins Kino", "in den Park"], 0],
                    ["Wann müssen die Kinder an der Schule sein?", ["um acht Uhr", "um 8:15 Uhr", "um 13 Uhr"], 0],
                    ["Was dürfen die Kinder nicht mitnehmen?", ["ein Handy", "eine Jacke", "ein Frühstück"], 0]]},
        "d": {"title": "Anruf in der Schule", "lines": [
            ["Sekretärin", "Grundschule am Park, Sekretariat, guten Morgen."],
            ["Frau Amiri", "Guten Morgen, hier ist Amiri. Mein Sohn Arman ist krank. Er hat Fieber."],
            ["Sekretärin", "Oh, gute Besserung! In welche Klasse geht Arman?"], ["Frau Amiri", "In die Klasse 3a."],
            ["Sekretärin", "Danke, ich sage es der Lehrerin. Muss er morgen auch zu Hause bleiben?"],
            ["Frau Amiri", "Ich weiß es noch nicht. Ich rufe morgen wieder an."]],
            "q": [["Warum ruft Frau Amiri an?", ["Ihr Sohn ist krank.", "Sie möchte einen Termin.", "Ihr Sohn hat Geburtstag."], 0],
                  ["In welche Klasse geht Arman?", ["3a", "2b", "1c"], 0]]},
        "s": {"task": "Dein Kind ist krank. Schreib eine kurze Entschuldigung an die Lehrerin: Name, Klasse, wie lange, warum. (4 Sätze)",
              "model": "Liebe Frau Klein, meine Tochter Sara aus der Klasse 2b ist krank. Sie hat Fieber und muss zu Hause bleiben. Sie kann heute und morgen nicht in die Schule kommen. Viele Grüße, Fatima Nazari"},
        "words": """
# In der Schule
der Unterricht||lessons, teaching|درس، تدریس
das Fach|die Fächer|school subject|مضمون
die Mathematik||maths|ریاضی
das Zeugnis|die Zeugnisse|school report|اطلاعیه، کارنامه
die Note|die Noten|mark, grade|نمره
die Ferien||school holidays|رخصتی‌ها
der Ausflug|die Ausflüge|trip, outing|گردش، سفر کوتاه
die Grundschule|die Grundschulen|primary school|مکتب ابتدائیه
# Schulsachen
der Rucksack|die Rucksäcke|backpack|بکس پشتی
das Buch|die Bücher|book|کتاب
der Radiergummi|die Radiergummis|eraser|پاک‌کن
das Lineal|die Lineale|ruler|خط‌کش
die Schere|die Scheren|scissors|قیچی
# Eltern
die Eltern||parents|والدین
krankmelden||to call in sick|غیرحاضری به خاطر مریضی خبر دادن
die Entschuldigung|die Entschuldigungen|excuse note; apology|عذرنامه؛ معذرت
abholen||to pick up|آوردن، گرفتن (کسی را)
bringen||to bring, to take|بردن، آوردن
""",
    },
    {
        "t": "Ämter und Behörden",
        "goals": "auf dem Amt: Anmeldung, Termin, Wartenummer, Formular ausfüllen; Imperativ mit Sie (Füllen Sie bitte … aus!)",
        "w": [
            "das Amt|die Ämter|office, authority|اداره",
            "die Behörde|die Behörden|authority|اداره (دولتی)",
            "das Bürgeramt|die Bürgerämter|citizens' office|ادارهٔ امور شهروندان",
            "das Formular|die Formulare|form|فورم",
            "ausfüllen||to fill in|خانه‌پری کردن",
            "unterschreiben||to sign|امضا کردن",
            "die Unterschrift|die Unterschriften|signature|امضا",
            "der Ausweis|die Ausweise|ID card|تذکره، کارت هویت",
            "der Pass|die Pässe|passport|پاسپورت",
            "die Wartenummer|die Wartenummern|waiting number|نمبر نوبت",
            "warten||to wait|منتظر ماندن",
            "der Termin|die Termine|appointment|وقت ملاقات، نوبت",
            "die Kopie|die Kopien|copy|کاپی",
            "mitbringen||to bring along|با خود آوردن",
        ],
        "p": ["Ich habe einen Termin um zehn Uhr.", "Wo bekomme ich eine Wartenummer?", "Füllen Sie bitte das Formular aus.",
              "Unterschreiben Sie bitte hier.", "Bringen Sie bitte Ihren Pass mit.", "Können Sie das bitte noch einmal langsam sagen?"],
        "g": {
            "title": "Imperativ mit Sie",
            "head": ["Verb", "Imperativ (Sie)"],
            "rows": [["warten", "Warten Sie bitte hier."], ["ausfüllen", "Füllen Sie bitte das Formular aus."],
                     ["unterschreiben", "Unterschreiben Sie bitte hier."], ["mitbringen", "Bringen Sie bitte eine Kopie mit."], ["sein", "Seien Sie bitte pünktlich."]],
            "de": "Imperativ mit Sie: Das Verb steht am Anfang, dann kommt „Sie“. Mit „bitte“ ist es höflich. Trennbare Verben: der Teil (aus, mit) kommt ans Ende.",
            "en": "Polite imperative: the verb comes first, then 'Sie': 'Warten Sie bitte!' Add 'bitte' to sound polite. With separable verbs the prefix goes to the end: 'Füllen Sie bitte das Formular aus.' Offices use this form a lot.",
            "fa": "امر مؤدبانه: فعل اول و بعد «Sie» می‌آید: «Warten Sie bitte!» با «bitte» مؤدبانه می‌شود. در فعل‌های جداشدنی پیشوند به آخر جمله می‌رود: «Füllen Sie bitte das Formular aus.» در ادارات این شکل زیاد استفاده می‌شود.",
        },
        "r": {"title": "Im Bürgeramt",
              "text": "Herr Mohammadi hat eine neue Wohnung. Er muss sich im Bürgeramt anmelden. Er hat online einen Termin gemacht: Dienstag, 9:30 Uhr. "
                      "Im Bürgeramt zieht er eine Wartenummer. Er wartet zehn Minuten. Dann ist er dran. Die Mitarbeiterin sagt: „Geben Sie mir bitte Ihren Pass und die Wohnungsgeberbestätigung.“ "
                      "Herr Mohammadi füllt das Formular aus und unterschreibt. Nach 15 Minuten bekommt er die Meldebescheinigung.",
              "q": [["Warum geht Herr Mohammadi ins Bürgeramt?", ["Er muss sich anmelden.", "Er braucht einen neuen Pass.", "Er sucht eine Wohnung."], 0],
                    ["Wie lange wartet er?", ["zehn Minuten", "eine Stunde", "15 Minuten"], 0],
                    ["Was bekommt er am Ende?", ["die Meldebescheinigung", "eine Wartenummer", "eine neue Wohnung"], 0]]},
        "d": {"title": "Am Schalter", "lines": [
            ["Mitarbeiter", "Guten Tag. Ihre Wartenummer, bitte."], ["Frau Karimi", "Hier, die Nummer 47."],
            ["Mitarbeiter", "Was kann ich für Sie tun?"], ["Frau Karimi", "Ich brauche eine Kopie von meiner Meldebescheinigung."],
            ["Mitarbeiter", "Füllen Sie bitte dieses Formular aus und warten Sie dort. Das kostet fünf Euro."],
            ["Frau Karimi", "Kann ich mit Karte bezahlen?"], ["Mitarbeiter", "Ja, natürlich."]],
            "q": [["Was braucht Frau Karimi?", ["eine Kopie der Meldebescheinigung", "einen neuen Ausweis", "einen Termin"], 0],
                  ["Wie viel kostet das?", ["fünf Euro", "47 Euro", "nichts"], 0]]},
        "s": {"task": "Schreib eine kurze E-Mail an das Bürgeramt: Du brauchst einen Termin für die Anmeldung. Wann hast du Zeit? (4–5 Sätze)",
              "model": "Sehr geehrte Damen und Herren, ich wohne seit einer Woche in Freiburg. Ich möchte mich anmelden und brauche einen Termin. Ich habe am Montag und am Mittwoch Zeit. Vielen Dank. Mit freundlichen Grüßen, Hassan Mohammadi"},
        "words": """
# Dokumente
die Meldebescheinigung|die Meldebescheinigungen|registration certificate|تصدیق ثبت آدرس
die Wohnungsgeberbestätigung|die Wohnungsgeberbestätigungen|landlord's confirmation|تأییدیهٔ صاحب‌خانه
die Geburtsurkunde|die Geburtsurkunden|birth certificate|تصدیق تولد
das Passfoto|die Passfotos|passport photo|عکس پاسپورتی
der Aufenthaltstitel|die Aufenthaltstitel|residence permit|اجازهٔ اقامت
das Dokument|die Dokumente|document|سند
# Angaben
der Vorname|die Vornamen|first name|نام
der Familienname|die Familiennamen|surname|تخلص
das Geburtsdatum|die Geburtsdaten|date of birth|تاریخ تولد
der Geburtsort|die Geburtsorte|place of birth|محل تولد
der Familienstand||marital status|وضعیت تأهل
die Staatsangehörigkeit|die Staatsangehörigkeiten|nationality|تابعیت
# Auf dem Amt
der Schalter|die Schalter|counter|باجه
der Wartebereich|die Wartebereiche|waiting area|محل انتظار
dran sein||to be next|نوبت کسی بودن
die Gebühr|die Gebühren|fee|فیس
pünktlich||on time|سر وقت
""",
    },
    {
        "t": "Feste und Feiertage",
        "goals": "Feste im Jahr, Einladung, gratulieren, Datum sagen; Ordinalzahlen (am ersten Mai, am dritten Oktober)",
        "w": [
            "das Fest|die Feste|festival, party|جشن",
            "der Feiertag|die Feiertage|public holiday|روز رخصتی رسمی",
            "feiern||to celebrate|جشن گرفتن",
            "der Geburtstag|die Geburtstage|birthday|سالگره",
            "die Party|die Partys|party|مهمانی",
            "die Einladung|die Einladungen|invitation|دعوت‌نامه",
            "einladen||to invite|دعوت کردن",
            "das Geschenk|die Geschenke|present|تحفه",
            "schenken||to give (as a present)|تحفه دادن",
            "gratulieren||to congratulate|تبریک گفتن",
            "das Datum|die Daten|date|تاریخ",
            "der Kuchen|die Kuchen|cake|کیک",
            "Herzlichen Glückwunsch!||Congratulations!|تبریک صمیمانه!",
            "das neue Jahr||the new year|سال نو",
        ],
        "p": ["Herzlichen Glückwunsch zum Geburtstag!", "Wann hast du Geburtstag? – Am zwölften März.", "Ich lade dich zu meiner Party ein.",
              "Vielen Dank für die Einladung!", "Frohes neues Jahr! / Eid mubarak!", "Am dritten Oktober ist ein Feiertag."],
        "g": {
            "title": "Datum: Ordinalzahlen",
            "head": ["Zahl", "Der Wievielte ist heute?", "Wann? (am …)"],
            "rows": [["1.", "der erste", "am ersten"], ["2.", "der zweite", "am zweiten"], ["3.", "der dritte", "am dritten"],
                     ["7.", "der siebte", "am siebten"], ["4.–19.", "der vierte … neunzehnte", "am vierten … neunzehnten"], ["ab 20.", "der zwanzigste", "am zwanzigsten"]],
            "de": "Datum: bis 19 + -te, ab 20 + -ste. Achtung: erste, dritte, siebte. Mit „am“: am ersten Mai (Endung -en).",
            "en": "Dates use ordinal numbers: up to 19 add -te (der vierte), from 20 add -ste (der zwanzigste). Irregular: erste, dritte, siebte. For 'on …' use 'am' + ending -en: 'am ersten Mai', 'am dritten Oktober'. Written: am 1. Mai.",
            "fa": "برای تاریخ از عددهای ترتیبی استفاده می‌شود: تا ۱۹ ‏‎-te اضافه می‌شود (der vierte) و از ۲۰ به بالا ‎-ste (der zwanzigste). بی‌قاعده: erste، dritte، siebte. برای «در تاریخ …» از «am» با پسوند ‎-en استفاده کنید: «am ersten Mai»، «am dritten Oktober». نوشتاری: am 1. Mai.",
        },
        "r": {"title": "Feiertage in Deutschland",
              "text": "In Deutschland gibt es viele Feiertage. Am ersten Januar ist Neujahr. Am ersten Mai ist der Tag der Arbeit. "
                      "Am dritten Oktober feiert man den Tag der Deutschen Einheit. Im Dezember ist Weihnachten, das wichtigste Fest für viele Familien. "
                      "An Feiertagen sind die meisten Geschäfte geschlossen. Viele Menschen feiern auch andere Feste, zum Beispiel Nouruz, das persische Neujahr am 20. oder 21. März, oder das Zuckerfest am Ende vom Ramadan.",
              "q": [["Wann ist der Tag der Deutschen Einheit?", ["am dritten Oktober", "am ersten Mai", "am ersten Januar"], 0],
                    ["Was ist an Feiertagen meistens geschlossen?", ["die Geschäfte", "die Krankenhäuser", "die Parks"], 0],
                    ["Was ist Nouruz?", ["das persische Neujahr", "der Tag der Arbeit", "ein Fest im Dezember"], 0]]},
        "d": {"title": "Eine Einladung", "lines": [
            ["Hamid", "Hallo Jana! Am Samstag habe ich Geburtstag. Ich lade dich zu meiner Party ein."],
            ["Jana", "Oh, danke! Wann ist die Party?"], ["Hamid", "Am Samstag, am vierzehnten Juni, um sieben Uhr."],
            ["Jana", "Super, ich komme gern! Soll ich etwas mitbringen?"], ["Hamid", "Vielleicht einen Salat?"],
            ["Jana", "Gern. Bis Samstag!"]],
            "q": [["Wann ist die Party?", ["am vierzehnten Juni um sieben Uhr", "am vierten Juni um elf Uhr", "am Sonntag um sieben Uhr"], 0],
                  ["Was bringt Jana mit?", ["einen Salat", "einen Kuchen", "ein Buch"], 0]]},
        "s": {"task": "Schreib eine Einladung zu deinem Geburtstag: Wann? Wo? Um wie viel Uhr? Was sollen die Gäste mitbringen? (4–5 Sätze)",
              "model": "Liebe Freunde, am fünfzehnten August habe ich Geburtstag. Ich lade euch zu meiner Party ein. Wir feiern am Samstag um 18 Uhr bei mir zu Hause. Bringt bitte gute Laune mit! Viele Grüße, Mahsa"},
        "words": """
# Feste im Jahr
das Neujahr||New Year's Day|روز سال نو
Silvester||New Year's Eve|شب سال نو میلادی
Weihnachten||Christmas|کرسمس
Ostern||Easter|عید پاک
der Ramadan||Ramadan|رمضان
das Zuckerfest||Eid al-Fitr|عید رمضان (عید فطر)
das Opferfest||Eid al-Adha|عید قربان
Nouruz||Nowruz (Persian New Year)|نوروز
die Hochzeit|die Hochzeiten|wedding|عروسی
# Feiern
der Gast|die Gäste|guest|مهمان
die Kerze|die Kerzen|candle|شمع
die Blume|die Blumen|flower|گل
die Karte|die Karten|card|کارت
tanzen||to dance|رقصیدن
Alles Gute!||All the best!|بهترین آرزوها!
Frohe Feiertage!||Happy holidays!|رخصتی‌های خوش!
# Monate
der Januar||January|جنوری
der März||March|مارچ
der Mai||May|می
der Juni||June|جون
der August||August|آگست
der Oktober||October|اکتوبر
der Dezember||December|دسمبر
""",
    },
]
