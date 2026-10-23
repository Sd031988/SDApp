# Kursbuch A2 – neue Einheiten (eigene Inhalte), Themen wie in Integrationskurs-Büchern A2:
# Sport und Gesundheit, Kommunikation, Bank, Lebensstationen. Werden HINTEN an A2 angehängt.
UNITS = [
    {
        "t": "Sport und Fitness",
        "goals": "Sportarten, im Verein anmelden, sich fit halten; reflexive Verben (sich bewegen, sich anmelden, sich freuen)",
        "w": [
            "sich bewegen||to move, to exercise|حرکت کردن، تحرک داشتن",
            "sich anmelden||to register|ثبت نام کردن",
            "sich freuen (auf/über)||to look forward to / to be happy about|خوشحال شدن (برای/از)",
            "sich ausruhen||to rest|استراحت کردن",
            "fit||fit|سرحال، آماده",
            "gesund||healthy|صحتمند، سالم",
            "der Verein|die Vereine|club, association|باشگاه، انجمن",
            "das Training|die Trainings|training|تمرین",
            "der Trainer|die Trainer|coach|مربی",
            "das Fitnessstudio|die Fitnessstudios|gym|باشگاه ورزشی",
            "der Mitgliedsbeitrag|die Mitgliedsbeiträge|membership fee|حق عضویت",
            "die Halle|die Hallen|hall, gym hall|سالن",
            "laufen||to run|دویدن",
            "trainieren||to train|تمرین کردن",
            "regelmäßig||regularly|به طور منظم",
        ],
        "p": ["Ich möchte mich für den Kurs anmelden.", "Wie oft ist das Training?", "Ich bewege mich zu wenig.",
              "Ich freue mich auf das Spiel.", "Was kostet die Mitgliedschaft im Monat?", "Nach dem Training ruhe ich mich aus."],
        "g": {
            "title": "Reflexive Verben",
            "head": ["", "sich bewegen", "sich anmelden"],
            "rows": [["ich", "bewege mich", "melde mich an"], ["du", "bewegst dich", "meldest dich an"], ["er / sie", "bewegt sich", "meldet sich an"],
                     ["wir", "bewegen uns", "melden uns an"], ["ihr", "bewegt euch", "meldet euch an"], ["sie / Sie", "bewegen sich", "melden sich an"]],
            "de": "Reflexive Verben haben ein Reflexivpronomen: mich, dich, sich, uns, euch, sich. Es zeigt auf die Person selbst.",
            "en": "Reflexive verbs come with a reflexive pronoun that points back to the subject: ich – mich, du – dich, er/sie/es – sich, wir – uns, ihr – euch, sie/Sie – sich. Learn them as one unit: sich bewegen, sich anmelden, sich freuen.",
            "fa": "فعل‌های انعکاسی یک ضمیر انعکاسی دارند که به خود فاعل برمی‌گردد: ich – mich، du – dich، er/sie/es – sich، wir – uns، ihr – euch، sie/Sie – sich. آن‌ها را با هم یاد بگیرید: sich bewegen، sich anmelden، sich freuen.",
        },
        "r": {"title": "Sport im Verein",
              "text": "Der Sportverein Blau-Weiß hat viele Angebote. Es gibt Fußball für Kinder und Erwachsene, Schwimmen, Volleyball und einen Lauftreff. "
                      "Das Training für Frauen ist jeden Mittwoch um 18 Uhr in der Sporthalle. Neue Mitglieder sind immer willkommen. "
                      "Ein Probetraining ist kostenlos. Der Mitgliedsbeitrag kostet für Erwachsene 12 Euro im Monat, für Kinder 6 Euro. "
                      "Wer wenig Geld hat, kann sich beim Verein über Hilfe informieren.",
              "q": [["Wann ist das Training für Frauen?", ["mittwochs um 18 Uhr", "jeden Tag um 18 Uhr", "samstags am Vormittag"], 0],
                    ["Was kostet ein Probetraining?", ["nichts", "6 Euro", "12 Euro"], 0],
                    ["Wie viel bezahlen Kinder im Monat?", ["6 Euro", "12 Euro", "18 Euro"], 0]]},
        "d": {"title": "Im Fitnessstudio", "lines": [
            ["Herr Noori", "Guten Tag, ich möchte mich anmelden. Ich bewege mich zu wenig."],
            ["Mitarbeiterin", "Gern. Wir haben einen Vertrag für ein Jahr, das kostet 25 Euro im Monat."],
            ["Herr Noori", "Gibt es auch einen Vertrag für drei Monate?"],
            ["Mitarbeiterin", "Ja, der kostet 35 Euro im Monat. Möchten Sie zuerst ein Probetraining machen?"],
            ["Herr Noori", "Ja, gern. Am Samstag habe ich Zeit."], ["Mitarbeiterin", "Super, dann sehen wir uns am Samstag um zehn Uhr."]],
            "q": [["Warum will sich Herr Noori anmelden?", ["Er bewegt sich zu wenig.", "Er ist Trainer.", "Er hat Rückenschmerzen."], 0],
                  ["Was macht Herr Noori zuerst?", ["ein Probetraining am Samstag", "einen Vertrag für ein Jahr", "einen Kurs am Montag"], 0]]},
        "s": {"task": "Schreib eine E-Mail an einen Sportverein: Du möchtest dich anmelden. Frag nach Zeiten, Preis und Probetraining. (5–6 Sätze)",
              "model": "Sehr geehrte Damen und Herren, ich interessiere mich für Ihren Schwimmkurs. Ich möchte mich gern anmelden. Wann ist das Training? Was kostet der Kurs im Monat? Kann ich zuerst ein Probetraining machen? Ich freue mich auf Ihre Antwort. Mit freundlichen Grüßen, Zahra Ahmadi"},
        "words": """
# Sportarten
der Volleyball||volleyball|والیبال
der Basketball||basketball|بسکتبال
das Boxen||boxing|بوکس
das Radfahren||cycling|بایسکل‌سواری
das Yoga||yoga|یوگا
das Wandern||hiking|کوه‌پیمایی، پیاده‌روی
das Krafttraining||strength training|تمرین قدرتی
# Im Verein
das Mitglied|die Mitglieder|member|عضو
die Mitgliedschaft|die Mitgliedschaften|membership|عضویت
das Probetraining|die Probetrainings|trial session|تمرین آزمایشی
der Vertrag|die Verträge|contract|قرارداد
kündigen||to cancel (a contract)|فسخ کردن (قرارداد)
das Angebot|die Angebote|offer|پیشنهاد
kostenlos||free of charge|رایگان
willkommen||welcome|خوش آمدید
# Körper und Gesundheit
der Muskel|die Muskeln|muscle|عضله
der Rücken|die Rücken|back|کمر، پشت
das Gewicht||weight|وزن
sich verletzen||to get hurt|زخمی شدن
die Pause|die Pausen|break|وقفه، استراحت
müde||tired|خسته
""",
    },
    {
        "t": "Kommunikation: Handy und Internet",
        "goals": "Handyvertrag, Internet, Nachrichten schreiben, Probleme melden; indirekte Fragen mit ob und W-Wort",
        "w": [
            "der Handyvertrag|die Handyverträge|mobile phone contract|قرارداد موبایل",
            "die Prepaidkarte|die Prepaidkarten|prepaid SIM card|سیم‌کارت اعتباری",
            "das Guthaben|die Guthaben|credit (balance)|اعتبار، شارژ",
            "aufladen||to top up, to charge|شارژ کردن",
            "das Internet||internet|انترنت",
            "das WLAN||Wi-Fi|وای‌فای",
            "das Passwort|die Passwörter|password|رمز عبور",
            "die App|die Apps|app|اپلیکیشن",
            "herunterladen||to download|دانلود کردن",
            "schicken||to send|فرستادن",
            "die Sprachnachricht|die Sprachnachrichten|voice message|پیام صوتی",
            "der Akku|die Akkus|battery|باتری",
            "erreichen||to reach|تماس گرفتن با، دست یافتن",
            "wissen||to know|دانستن",
        ],
        "p": ["Können Sie mir sagen, wie viel der Vertrag kostet?", "Ich weiß nicht, ob das WLAN funktioniert.", "Mein Akku ist leer.",
              "Ich habe kein Guthaben mehr.", "Wissen Sie, wo ich eine Prepaidkarte kaufen kann?", "Ich schicke dir eine Sprachnachricht."],
        "g": {
            "title": "Indirekte Fragen: ob und W-Wort",
            "head": ["direkte Frage", "indirekte Frage"],
            "rows": [["Wie viel kostet der Vertrag?", "Können Sie mir sagen, wie viel der Vertrag kostet?"],
                     ["Wo ist der Laden?", "Wissen Sie, wo der Laden ist?"],
                     ["Funktioniert das WLAN?", "Ich weiß nicht, ob das WLAN funktioniert."],
                     ["Hast du Zeit?", "Ich möchte wissen, ob du Zeit hast."]],
            "de": "In der indirekten Frage steht das Verb am Ende. Bei Ja/Nein-Fragen benutzt man „ob“.",
            "en": "Indirect questions are more polite. They start with a phrase like 'Können Sie mir sagen, …' or 'Wissen Sie, …' and the verb moves to the END. W-questions keep their W-word (wie, wo, wann); yes/no questions use 'ob' (whether).",
            "fa": "سؤال‌های غیرمستقیم مؤدبانه‌ترند. با جمله‌ای مثل «Können Sie mir sagen, …» یا «Wissen Sie, …» شروع می‌شوند و فعل به آخر جمله می‌رود. سؤال‌های W کلمهٔ پرسشی خود (wie، wo، wann) را نگه می‌دارند؛ سؤال‌های بلی/نخیر با «ob» (آیا) می‌آیند.",
        },
        "r": {"title": "Ein Angebot für einen Handyvertrag",
              "text": "Unser Angebot im Oktober: Telefonieren und SMS ohne Limit, dazu 20 Gigabyte Internet für nur 14,99 Euro im Monat. "
                      "Der Vertrag läuft 24 Monate. Sie bekommen eine neue SIM-Karte. Ihre alte Telefonnummer können Sie mitnehmen. "
                      "Für den Vertrag brauchen Sie einen Ausweis und ein Bankkonto. Lieber ohne Vertrag? Dann nehmen Sie eine Prepaidkarte und laden Sie das Guthaben selbst auf.",
              "q": [["Wie lange läuft der Vertrag?", ["24 Monate", "12 Monate", "einen Monat"], 0],
                    ["Was braucht man für den Vertrag?", ["einen Ausweis und ein Bankkonto", "nur eine E-Mail-Adresse", "eine Prepaidkarte"], 0],
                    ["Was ist eine Prepaidkarte?", ["Man lädt das Guthaben selbst auf.", "Man bezahlt nie etwas.", "Man hat einen Vertrag für zwei Jahre."], 0]]},
        "d": {"title": "Im Handyladen", "lines": [
            ["Kundin", "Guten Tag. Können Sie mir sagen, ob ich mit dieser Karte auch ins Ausland telefonieren kann?"],
            ["Verkäufer", "Ja, aber das kostet extra. Wohin möchten Sie denn telefonieren?"],
            ["Kundin", "Nach Afghanistan, zu meiner Familie."],
            ["Verkäufer", "Dann empfehle ich Ihnen eine App. Mit WLAN telefonieren Sie dort kostenlos."],
            ["Kundin", "Wissen Sie, wie die App heißt?"], ["Verkäufer", "Viele Leute benutzen WhatsApp oder Signal. Ich zeige es Ihnen."]],
            "q": [["Was möchte die Kundin wissen?", ["ob sie ins Ausland telefonieren kann", "wo der Laden ist", "wie viel ein Handy kostet"], 0],
                  ["Was empfiehlt der Verkäufer?", ["eine App mit WLAN", "einen neuen Vertrag", "eine Prepaidkarte für 20 Euro"], 0]]},
        "s": {"task": "Dein Internet zu Hause funktioniert seit drei Tagen nicht. Schreib eine E-Mail an deinen Anbieter. Frag höflich mit indirekten Fragen. (5–6 Sätze)",
              "model": "Sehr geehrte Damen und Herren, seit drei Tagen funktioniert mein Internet nicht. Mein Router ist an, aber das WLAN geht nicht. Können Sie mir sagen, wann ein Techniker kommen kann? Ich möchte auch wissen, ob ich für diese Tage weniger bezahlen muss. Vielen Dank. Mit freundlichen Grüßen, Farid Sultani"},
        "words": """
# Handy
das Smartphone|die Smartphones|smartphone|گوشی هوشمند
das Ladekabel|die Ladekabel|charging cable|کیبل شارژ
die SIM-Karte|die SIM-Karten|SIM card|سیم‌کارت
die SMS||text message|پیامک
der Anbieter|die Anbieter|provider|شرکت ارائه‌دهنده
die Flatrate|die Flatrates|flat rate|بستهٔ نامحدود
ins Ausland telefonieren||to call abroad|به خارج زنگ زدن
# Internet
der Router|die Router|router|روتر
die Verbindung|die Verbindungen|connection|اتصال
online||online|آنلاین
das Konto|die Konten|account|حساب
sich einloggen||to log in|وارد حساب شدن
speichern||to save|ذخیره کردن
löschen||to delete|پاک کردن
# Nachrichten
die Antwort|die Antworten|answer, reply|جواب
antworten||to answer|جواب دادن
der Empfänger|die Empfänger|recipient|گیرنده
der Absender|die Absender|sender|فرستنده
die Gruppe|die Gruppen|group|گروه
""",
    },
    {
        "t": "Bank und Geld",
        "goals": "Konto eröffnen, Überweisung, Geldautomat, Karte verloren; Infinitiv mit zu (Es ist wichtig, … zu …)",
        "w": [
            "die Bank|die Banken|bank|بانک",
            "das Girokonto|die Girokonten|current account|حساب جاری",
            "ein Konto eröffnen||to open an account|حساب باز کردن",
            "die Überweisung|die Überweisungen|bank transfer|انتقال پول",
            "überweisen||to transfer (money)|پول انتقال دادن",
            "der Geldautomat|die Geldautomaten|cash machine, ATM|ماشین پول",
            "abheben||to withdraw (money)|برداشتن (پول)",
            "die Bankkarte|die Bankkarten|bank card|کارت بانکی",
            "die PIN||PIN|رمز کارت",
            "sperren||to block|مسدود کردن",
            "der Kontoauszug|die Kontoauszüge|bank statement|صورت‌حساب بانکی",
            "die Gebühr|die Gebühren|fee|فیس، هزینه",
            "sparen||to save (money)|پس‌انداز کردن",
            "das Bargeld||cash|پول نقد",
            "verlieren||to lose|گم کردن",
        ],
        "p": ["Ich möchte ein Konto eröffnen.", "Was kostet das Konto im Monat?", "Ich habe meine Karte verloren.",
              "Bitte sperren Sie meine Karte.", "Vergessen Sie nicht, die PIN geheim zu halten.", "Ich möchte 50 Euro abheben."],
        "g": {
            "title": "Infinitiv mit zu",
            "head": ["Ausdruck", "Infinitiv mit zu"],
            "rows": [["Es ist wichtig,", "die PIN geheim zu halten."], ["Vergessen Sie nicht,", "die Miete zu überweisen."],
                     ["Ich habe keine Zeit,", "zur Bank zu gehen."], ["Es ist einfach,", "Geld abzuheben."]],
            "de": "Nach manchen Ausdrücken kommt „zu“ + Infinitiv am Satzende. Bei trennbaren Verben steht „zu“ in der Mitte: abzuheben.",
            "en": "After phrases like 'Es ist wichtig', 'Vergessen Sie nicht', 'Ich habe keine Zeit' you use zu + infinitive at the end of the sentence. With separable verbs 'zu' goes in the middle: abheben → abzuheben, anrufen → anzurufen.",
            "fa": "بعد از عبارت‌هایی مثل «Es ist wichtig»، «Vergessen Sie nicht» و «Ich habe keine Zeit» از zu + مصدر در آخر جمله استفاده می‌شود. در فعل‌های جداشدنی «zu» در وسط می‌آید: abheben ← abzuheben، anrufen ← anzurufen.",
        },
        "r": {"title": "Karte weg – was tun?",
              "text": "Sie haben Ihre Bankkarte verloren? Dann ist es wichtig, die Karte sofort sperren zu lassen. Rufen Sie den Sperr-Notruf 116 116 an. "
                      "Der Anruf ist kostenlos und Sie können jeden Tag und auch in der Nacht anrufen. Halten Sie Ihre Kontonummer (IBAN) bereit. "
                      "Danach informieren Sie Ihre Bank. Sie bekommen eine neue Karte mit der Post. Die neue PIN kommt in einem anderen Brief.",
              "q": [["Was soll man zuerst machen?", ["die Karte sperren lassen", "eine neue Karte kaufen", "zur Polizei gehen"], 0],
                    ["Wann kann man die Nummer 116 116 anrufen?", ["immer, auch in der Nacht", "nur am Vormittag", "nur von Montag bis Freitag"], 0],
                    ["Wie kommt die neue PIN?", ["in einem anderen Brief", "zusammen mit der Karte", "per SMS"], 0]]},
        "d": {"title": "Ein Konto eröffnen", "lines": [
            ["Herr Azizi", "Guten Tag, ich möchte ein Girokonto eröffnen."],
            ["Bankberaterin", "Gern. Haben Sie Ihren Ausweis und Ihre Meldebescheinigung dabei?"],
            ["Herr Azizi", "Ja, hier bitte. Was kostet das Konto?"],
            ["Bankberaterin", "Das Konto kostet 4 Euro im Monat. Online-Überweisungen sind kostenlos."],
            ["Herr Azizi", "Und wann bekomme ich die Bankkarte?"], ["Bankberaterin", "In ungefähr einer Woche. Die PIN kommt mit der Post."]],
            "q": [["Was braucht Herr Azizi?", ["Ausweis und Meldebescheinigung", "nur ein Foto", "einen Arbeitsvertrag und 100 Euro"], 0],
                  ["Was kostet das Konto im Monat?", ["4 Euro", "nichts", "14 Euro"], 0]]},
        "s": {"task": "Du hast deine Bankkarte verloren. Schreib eine kurze E-Mail an deine Bank: Was ist passiert? Was hast du schon gemacht? Was brauchst du? (5 Sätze)",
              "model": "Sehr geehrte Damen und Herren, ich habe gestern meine Bankkarte verloren. Ich habe die Karte sofort über die Nummer 116 116 sperren lassen. Ich brauche bitte eine neue Karte. Können Sie mir sagen, wie lange das dauert? Mit freundlichen Grüßen, Mina Rezai"},
        "words": """
# Auf der Bank
das Bankkonto|die Bankkonten|bank account|حساب بانکی
die Kontonummer|die Kontonummern|account number|شمارهٔ حساب
die IBAN||IBAN|شمارهٔ بین‌المللی حساب
der Bankberater|die Bankberater|bank adviser|مشاور بانک
der Schalter|die Schalter|counter|باجه
die Filiale|die Filialen|branch|شعبه
das Online-Banking||online banking|بانکداری آنلاین
einzahlen||to pay in|واریز کردن
der Dauerauftrag|die Daueraufträge|standing order|دستور پرداخت دائمی
# Geld im Alltag
die Münze|die Münzen|coin|سکه
der Schein|die Scheine|banknote|نوت (پول کاغذی)
der Betrag|die Beträge|amount|مبلغ
die Miete|die Mieten|rent|کرایه (خانه)
die Schulden||debts|قرض‌ها
leihen||to lend, to borrow|قرض دادن / قرض گرفتن
teuer||expensive|گران، قیمت
billig||cheap|ارزان
geheim||secret|مخفی
""",
    },
    {
        "t": "Lebensstationen",
        "goals": "über das eigene Leben erzählen: Kindheit, Schule, Arbeit, Familie, Umzug; Präteritum (war, hatte, konnte, musste) und als",
        "w": [
            "die Kindheit||childhood|کودکی",
            "geboren||born|متولد",
            "aufwachsen||to grow up|بزرگ شدن",
            "die Jugend||youth|جوانی",
            "heiraten||to marry|عروسی کردن، ازدواج کردن",
            "die Hochzeit|die Hochzeiten|wedding|عروسی",
            "umziehen||to move (house)|کوچ کردن، جابجا شدن",
            "die Heimat||home country|وطن",
            "der Lebenslauf|die Lebensläufe|CV, life story|زندگی‌نامه (سی‌وی)",
            "die Erinnerung|die Erinnerungen|memory|خاطره",
            "damals||back then|در آن زمان",
            "früher||in the past|قبلاً",
            "später||later|بعداً",
            "als||when (in the past)|وقتی که (در گذشته)",
        ],
        "p": ["Ich bin 1990 in Kabul geboren.", "Als Kind war ich oft bei meinen Großeltern.", "Damals hatte ich nicht viel Zeit.",
              "Ich musste früh arbeiten.", "Als ich 25 war, habe ich geheiratet.", "2016 bin ich nach Deutschland gekommen."],
        "g": {
            "title": "Präteritum: war, hatte, konnte, musste – und als",
            "head": ["", "sein", "haben", "können", "müssen"],
            "rows": [["ich", "war", "hatte", "konnte", "musste"], ["du", "warst", "hattest", "konntest", "musstest"],
                     ["er / sie", "war", "hatte", "konnte", "musste"], ["wir", "waren", "hatten", "konnten", "mussten"],
                     ["ihr", "wart", "hattet", "konntet", "musstet"], ["sie / Sie", "waren", "hatten", "konnten", "mussten"]],
            "de": "sein, haben und die Modalverben benutzt man in der Vergangenheit meist im Präteritum. „als“ für eine Zeit in der Vergangenheit: Als ich Kind war, … (Verb am Ende).",
            "en": "In the past, sein, haben and the modal verbs are mostly used in the Präteritum (war, hatte, konnte, musste), other verbs in the Perfekt. Use 'als' for a single time or period in the past: 'Als ich ein Kind war, …' – the verb goes to the end of the als-clause.",
            "fa": "در زمان گذشته sein، haben و فعل‌های وجهی بیشتر به شکل Präteritum می‌آیند (war، hatte، konnte، musste)؛ فعل‌های دیگر به شکل Perfekt. برای یک زمان یا دوره در گذشته از «als» استفاده کنید: «Als ich ein Kind war, …» – فعل در آخر جملهٔ als می‌آید.",
        },
        "r": {"title": "Die Geschichte von Frau Habibi",
              "text": "Shirin Habibi ist 1985 in Mazar-e Sharif geboren. Als Kind wohnte sie mit ihren Eltern und vier Geschwistern in einem kleinen Haus. "
                      "Sie konnte nur sechs Jahre zur Schule gehen, dann musste sie zu Hause helfen. Mit 20 Jahren heiratete sie. "
                      "Später bekam sie zwei Kinder. 2015 zog die Familie nach Deutschland. Am Anfang war alles schwer, denn sie konnte kein Deutsch. "
                      "Heute arbeitet sie in einer Kita und ist sehr stolz auf ihre Kinder.",
              "q": [["Wie lange ging Shirin zur Schule?", ["sechs Jahre", "zehn Jahre", "gar nicht"], 0],
                    ["Wann kam die Familie nach Deutschland?", ["2015", "1985", "2005"], 0],
                    ["Was macht Shirin heute?", ["Sie arbeitet in einer Kita.", "Sie geht wieder zur Schule.", "Sie wohnt in Mazar-e Sharif."], 0]]},
        "d": {"title": "Fotos von früher", "lines": [
            ["Anna", "Wer ist das auf dem Foto?"], ["Reza", "Das bin ich! Da war ich acht Jahre alt."],
            ["Anna", "Wo war das?"], ["Reza", "In Herat, bei meinen Großeltern. Als ich klein war, war ich jeden Sommer dort."],
            ["Anna", "Und was hast du da gemacht?"], ["Reza", "Ich musste meinem Opa im Garten helfen. Aber ich hatte auch viel Zeit zum Spielen."]],
            "q": [["Wie alt war Reza auf dem Foto?", ["acht Jahre", "achtzehn Jahre", "drei Jahre"], 0],
                  ["Was musste Reza bei den Großeltern machen?", ["im Garten helfen", "kochen", "zur Schule gehen"], 0]]},
        "s": {"task": "Erzähl von deinem Leben: Wo bist du geboren? Wie war deine Kindheit? Was hast du später gemacht? (6–8 Sätze, benutze: war, hatte, konnte, musste, als)",
              "model": "Ich bin 1992 in Kandahar geboren. Als ich ein Kind war, wohnten wir in einem großen Haus. Ich hatte drei Brüder. Ich konnte zwölf Jahre zur Schule gehen. Danach musste ich arbeiten, weil mein Vater krank war. Als ich 24 war, bin ich nach Deutschland gekommen. Heute lerne ich Deutsch und möchte Krankenpfleger werden."},
        "words": """
# Lebensabschnitte
das Baby|die Babys|baby|نوزاد
das Kind|die Kinder|child|طفل، کودک
der Jugendliche|die Jugendlichen|young person|نوجوان
der Erwachsene|die Erwachsenen|adult|بزرگسال
das Alter||old age; age|پیری؛ سن
die Rente|die Renten|pension, retirement|تقاعد
sterben||to die|مردن، فوت کردن
# Wichtige Ereignisse
die Geburt|die Geburten|birth|تولد
die Ausbildung|die Ausbildungen|vocational training|آموزش حرفه‌ای
das Studium|die Studien|university studies|تحصیلات دانشگاهی
der Abschluss|die Abschlüsse|degree, qualification|مدرک تحصیلی
die Trennung|die Trennungen|separation|جدایی
die Flucht||escape, flight|فرار، مهاجرت اجباری
ankommen||to arrive|رسیدن
# Erzählen
zuerst||first|اول
danach||after that|بعد از آن
schließlich||finally|در آخر
am Anfang||at the beginning|در آغاز
stolz||proud|مفتخر
schwer||difficult; heavy|سخت؛ سنگین
""",
    },
]

# Zweite Runde: restliche Themen aus A2-Kursbüchern (Ankommen, Essen und Trinken, Am Wochenende)
UNITS += [
    {
        "t": "Ankommen und Kennenlernen",
        "goals": "über die ersten Wochen in einer neuen Stadt erzählen, Nachbarn kennenlernen, Hilfe finden; Perfekt mit trennbaren und nicht trennbaren Verben",
        "w": [
            "ankommen||to arrive|رسیدن",
            "kennenlernen||to get to know|آشنا شدن",
            "sich vorstellen||to introduce oneself|خود را معرفی کردن",
            "der Nachbar|die Nachbarn|neighbour|همسایه",
            "die Nachbarschaft|die Nachbarschaften|neighbourhood|همسایگی، محله",
            "neu||new|نو، جدید",
            "fremd||strange, unfamiliar|ناآشنا، بیگانه",
            "der Anfang|die Anfänge|beginning|آغاز",
            "verstehen||to understand|فهمیدن",
            "besuchen||to visit|دیدن کردن، به دیدن رفتن",
            "erklären||to explain|توضیح دادن",
            "die Hilfe||help|کمک",
            "die Beratungsstelle|die Beratungsstellen|advice centre|مرکز مشاوره",
            "sich zurechtfinden||to find one's way around|راه خود را پیدا کردن",
        ],
        "p": ["Ich bin vor drei Wochen hier angekommen.", "Am Anfang habe ich wenig verstanden.", "Darf ich mich vorstellen? Ich bin …",
              "Ich wohne seit Montag im dritten Stock.", "Können Sie mir erklären, wo …?", "Ich habe schon viele Leute kennengelernt."],
        "g": {
            "title": "Perfekt: trennbare und nicht trennbare Verben",
            "head": ["Verb", "Partizip II", "Satz"],
            "rows": [["ankommen", "angekommen", "Ich bin im Mai angekommen."], ["kennenlernen", "kennengelernt", "Wir haben die Nachbarn kennengelernt."],
                     ["einkaufen", "eingekauft", "Sie hat schon eingekauft."], ["besuchen", "besucht", "Er hat seine Tante besucht."],
                     ["verstehen", "verstanden", "Ich habe nicht alles verstanden."], ["erklären", "erklärt", "Sie hat mir den Weg erklärt."]],
            "de": "Trennbare Verben: -ge- steht in der Mitte (angekommen). Verben mit be-, ver-, er-, ent- und auf -ieren haben kein ge- (besucht, verstanden, telefoniert).",
            "en": "Separable verbs put -ge- between prefix and stem: ankommen → angekommen, einkaufen → eingekauft. Verbs starting with be-, ver-, er-, ent-, emp-, ge-, zer- and verbs ending in -ieren have no ge- at all: besucht, verstanden, erklärt, telefoniert.",
            "fa": "فعل‌های جداشدنی ‎-ge-‎ را بین پیشوند و ریشه می‌گیرند: ankommen ← angekommen، einkaufen ← eingekauft. فعل‌هایی که با be-، ver-، er-، ent-، emp-، ge-، zer- شروع می‌شوند و فعل‌های ‎-ieren‎ اصلاً ge- ندارند: besucht، verstanden، erklärt، telefoniert.",
        },
        "r": {"title": "Die ersten Wochen in Bremen",
              "text": "Vor zwei Monaten ist Sima mit ihrem Mann nach Bremen gezogen. Am Anfang war alles neu. Sie hat die Durchsagen in der Straßenbahn nicht verstanden und hat sich oft verlaufen. "
                      "Dann hat ihre Nachbarin, Frau Schulz, an der Tür geklingelt und sich vorgestellt. Sie hat Sima die Stadt gezeigt und ihr die Bibliothek und den Markt erklärt. "
                      "In einer Beratungsstelle hat Sima Informationen über Deutschkurse bekommen. Jetzt besucht sie jeden Tag einen Kurs und hat schon viele Leute kennengelernt.",
              "q": [["Wann ist Sima nach Bremen gezogen?", ["vor zwei Monaten", "vor zwei Jahren", "vor zwei Wochen"], 0],
                    ["Wer hat Sima die Stadt gezeigt?", ["ihre Nachbarin", "ihr Mann", "ihre Lehrerin"], 0],
                    ["Wo hat Sima Informationen über Deutschkurse bekommen?", ["in einer Beratungsstelle", "in der Bibliothek", "auf dem Markt"], 0]]},
        "d": {"title": "Im Treppenhaus", "lines": [
            ["Herr Weber", "Guten Abend! Sind Sie neu hier?"], ["Herr Sadiqi", "Ja, wir sind letzte Woche eingezogen. Mein Name ist Sadiqi."],
            ["Herr Weber", "Weber, freut mich! Ich wohne direkt unter Ihnen. Haben Sie sich schon gut eingelebt?"],
            ["Herr Sadiqi", "Langsam. Wir haben noch nicht alles ausgepackt. Wissen Sie, wann der Müll abgeholt wird?"],
            ["Herr Weber", "Der Restmüll am Dienstag, der gelbe Sack am Freitag. Wenn Sie Fragen haben, klingeln Sie einfach."],
            ["Herr Sadiqi", "Vielen Dank, das ist sehr nett!"]],
            "q": [["Wann ist Familie Sadiqi eingezogen?", ["letzte Woche", "gestern", "vor einem Jahr"], 0],
                  ["Wann wird der gelbe Sack abgeholt?", ["am Freitag", "am Dienstag", "am Montag"], 0]]},
        "s": {"task": "Schreib einer Freundin in deiner Heimat: Wie waren deine ersten Wochen in der neuen Stadt? Was hast du schon gemacht? Wen hast du kennengelernt? (6–7 Sätze, im Perfekt)",
              "model": "Liebe Nilofar, vor einem Monat bin ich in Kassel angekommen. Am Anfang habe ich nur wenig verstanden. Aber meine Nachbarn haben mir viel geholfen. Ich habe mich beim Bürgeramt angemeldet und ein Konto eröffnet. Letzte Woche habe ich eine Frau aus Syrien kennengelernt. Wir haben zusammen eingekauft und Tee getrunken. Ich vermisse dich! Liebe Grüße, Parisa"},
        "words": """
# Einziehen
einziehen||to move in|اسباب‌کشی کردن (به خانهٔ نو)
auspacken||to unpack|باز کردن (بار و بسته)
sich einleben||to settle in|عادت کردن به جای نو
das Treppenhaus|die Treppenhäuser|stairwell|راه‌پله
klingeln||to ring (the bell)|زنگ زدن (دروازه)
der Briefkasten|die Briefkästen|letterbox|صندوق پست
der Müll||rubbish|زباله، کثافات
# Orientierung
sich verlaufen||to get lost|راه را گم کردن
der Stadtplan|die Stadtpläne|city map|نقشهٔ شهر
die Durchsage|die Durchsagen|announcement|اعلان
zeigen||to show|نشان دادن
# Hilfe und Kontakte
der Kontakt|die Kontakte|contact|تماس، ارتباط
das Treffen|die Treffen|meeting|ملاقات، دیدار
der Treffpunkt|die Treffpunkte|meeting point|محل ملاقات
die Information|die Informationen|information|معلومات
der Dolmetscher|die Dolmetscher|interpreter|ترجمان
ehrenamtlich||voluntary|داوطلبانه
nett||nice, kind|مهربان
""",
    },
    {
        "t": "Essen und Trinken",
        "goals": "im Restaurant bestellen, Rezepte, Essgewohnheiten vergleichen, gesund essen; Superlativ (am liebsten, der/die/das beste)",
        "w": [
            "das Restaurant|die Restaurants|restaurant|رستورانت",
            "die Speisekarte|die Speisekarten|menu|فهرست غذا، منو",
            "bestellen||to order|سفارش دادن",
            "das Gericht|die Gerichte|dish|غذا",
            "die Vorspeise|die Vorspeisen|starter|پیش‌غذا",
            "die Hauptspeise|die Hauptspeisen|main course|غذای اصلی",
            "der Nachtisch|die Nachtische|dessert|دسر",
            "das Rezept|die Rezepte|recipe|دستور پخت",
            "die Zutat|die Zutaten|ingredient|مواد (غذا)",
            "scharf||spicy|تند",
            "lecker||tasty|مزه‌دار، خوشمزه",
            "vegetarisch||vegetarian|گیاهی",
            "die Rechnung|die Rechnungen|bill|صورت‌حساب",
            "am liebsten||most of all (like best)|از همه بیشتر",
        ],
        "p": ["Ich hätte gern die Linsensuppe.", "Ist da Schweinefleisch drin?", "Was können Sie empfehlen?",
              "Die Rechnung, bitte! / Zusammen oder getrennt?", "Am liebsten esse ich Reis mit Gemüse.", "Das ist das beste Essen in der Stadt."],
        "g": {
            "title": "Superlativ",
            "head": ["Adjektiv", "Komparativ", "Superlativ"],
            "rows": [["lecker", "leckerer", "am leckersten"], ["scharf", "schärfer", "am schärfsten"], ["gut", "besser", "am besten"],
                     ["gern", "lieber", "am liebsten"], ["viel", "mehr", "am meisten"], ["groß", "größer", "am größten"]],
            "de": "Superlativ: am + Adjektiv + -(e)sten. Vor einem Nomen: der/die/das + -ste (das beste Essen). Unregelmäßig: gut – besser – am besten, gern – lieber – am liebsten.",
            "en": "Superlative: am + adjective + -sten (am leckersten); after s, ß, t, z add -esten (am heißesten). Before a noun use der/die/das + -ste: 'das beste Restaurant'. Irregular: gut – besser – am besten, gern – lieber – am liebsten, viel – mehr – am meisten.",
            "fa": "صفت عالی: am + صفت + ‎-sten (am leckersten)؛ بعد از s، ß، t، z ‏‎-esten (am heißesten). قبل از اسم: der/die/das + ‎-ste: «das beste Restaurant». بی‌قاعده: gut – besser – am besten، gern – lieber – am liebsten، viel – mehr – am meisten.",
        },
        "r": {"title": "Was essen die Deutschen?",
              "text": "Viele Menschen in Deutschland essen gern Nudeln, Pizza und Fleisch. Aber vegetarisches Essen wird immer beliebter, besonders bei jungen Menschen. "
                      "Am Morgen essen viele Brot oder Brötchen mit Käse oder Marmelade. Das Mittagessen ist in vielen Familien die wichtigste warme Mahlzeit. "
                      "Am Abend gibt es oft nur Brot – das nennt man Abendbrot. In der Kantine und in der Schule gibt es meistens auch ein Gericht ohne Fleisch.",
              "q": [["Was isst man in Deutschland oft am Abend?", ["Brot", "Pizza", "Suppe"], 0],
                    ["Welche Mahlzeit ist in vielen Familien die wichtigste warme Mahlzeit?", ["das Mittagessen", "das Frühstück", "das Abendbrot"], 0],
                    ["Was wird immer beliebter?", ["vegetarisches Essen", "Fast Food", "Fisch"], 0]]},
        "d": {"title": "Im Restaurant", "lines": [
            ["Kellnerin", "Guten Abend! Was möchten Sie trinken?"], ["Frau Rahmani", "Ein Wasser, bitte. Und was können Sie als Hauptspeise empfehlen?"],
            ["Kellnerin", "Am beliebtesten ist heute die Gemüsepfanne mit Reis."], ["Frau Rahmani", "Ist sie scharf?"],
            ["Kellnerin", "Nur ein bisschen. Die schärfste Speise ist das Hähnchen-Curry."],
            ["Frau Rahmani", "Dann nehme ich die Gemüsepfanne. Und zum Nachtisch einen Apfelkuchen, bitte."]],
            "q": [["Was empfiehlt die Kellnerin?", ["die Gemüsepfanne mit Reis", "das Hähnchen-Curry", "einen Apfelkuchen"], 0],
                  ["Was bestellt Frau Rahmani zum Nachtisch?", ["Apfelkuchen", "Eis", "Obstsalat"], 0]]},
        "s": {"task": "Beschreib dein Lieblingsgericht: Was ist es? Welche Zutaten braucht man? Wie kocht man es? Wann isst man es? (6–8 Sätze)",
              "model": "Mein Lieblingsgericht ist Kabuli Palau. Man braucht Reis, Lammfleisch, Karotten, Rosinen und Gewürze. Zuerst kocht man das Fleisch mit Zwiebeln. Dann kocht man den Reis in der Brühe. Die Karotten und Rosinen brät man kurz in Öl. Am Ende kommt alles zusammen in den Ofen. Wir essen es am liebsten an Festtagen mit der ganzen Familie. Für mich ist es das beste Essen der Welt."},
        "words": """
# Im Restaurant
der Kellner|die Kellner|waiter|گارسون
die Kellnerin|die Kellnerinnen|waitress|گارسون (زن)
reservieren||to reserve|رزرو کردن
das Trinkgeld||tip|بخشش، انعام
getrennt||separately|جدا جدا
zusammen||together|با هم
satt||full (after eating)|سیر
# Kochen
braten||to fry|سرخ کردن
backen||to bake|پختن (در داش)
schneiden||to cut|بریدن
das Gewürz|die Gewürze|spice|ادویه
die Brühe|die Brühen|broth|شوربا، آب گوشت
der Ofen|die Öfen|oven|داش، اجاق
die Pfanne|die Pfannen|frying pan|تابه
der Topf|die Töpfe|pot|دیگ
# Ernährung
die Mahlzeit|die Mahlzeiten|meal|وعدهٔ غذایی
das Schweinefleisch||pork|گوشت خوک
das Rindfleisch||beef|گوشت گاو
halal||halal|حلال
die Allergie|die Allergien|allergy|حساسیت
beliebt||popular|محبوب
""",
    },
    {
        "t": "Am Wochenende",
        "goals": "Pläne fürs Wochenende, Ausflüge, Veranstaltungen, sich verabreden und absagen; Zeitangaben mit vor, nach, seit, ab, bis",
        "w": [
            "der Ausflug|die Ausflüge|trip, outing|گردش",
            "die Veranstaltung|die Veranstaltungen|event|برنامه، رویداد",
            "das Programm|die Programme|programme|برنامه",
            "planen||to plan|برنامه‌ریزی کردن",
            "vorhaben||to plan, to intend|قصد داشتن",
            "sich verabreden||to arrange to meet|قرار گذاشتن",
            "absagen||to cancel|لغو کردن، جواب رد دادن",
            "der Eintritt||admission (fee)|ورودیه",
            "geöffnet||open|باز",
            "geschlossen||closed|بسته",
            "das Museum|die Museen|museum|موزیم",
            "der Flohmarkt|die Flohmärkte|flea market|بازار کهنه‌فروشی",
            "das Picknick|die Picknicks|picnic|پیک‌نیک",
            "vor||before; ago|قبل از؛ پیش",
            "seit||since, for|از (زمان)",
        ],
        "p": ["Was hast du am Wochenende vor?", "Wollen wir am Sonntag einen Ausflug machen?", "Tut mir leid, ich muss leider absagen.",
              "Das Museum ist ab zehn Uhr geöffnet.", "Nach dem Frühstück fahren wir los.", "Seit drei Wochen habe ich kein freies Wochenende."],
        "g": {
            "title": "Zeitangaben: vor, nach, seit, ab, bis",
            "head": ["Präposition", "Kasus", "Beispiel"],
            "rows": [["vor", "Dativ", "vor dem Frühstück / vor einer Woche"], ["nach", "Dativ", "nach der Arbeit"],
                     ["seit", "Dativ", "seit einem Jahr (bis heute)"], ["ab", "Dativ", "ab nächster Woche / ab 10 Uhr"], ["bis", "–", "bis Sonntag / bis 18 Uhr"]],
            "de": "vor, nach, seit und ab stehen mit Dativ. „seit“ heißt: Es hat in der Vergangenheit angefangen und dauert noch. „vor“ + Zeit = in der Vergangenheit (vor zwei Tagen).",
            "en": "vor, nach, seit and ab take the dative: vor dem Essen, nach der Arbeit. 'seit' means something started in the past and is still going on (use the present tense: 'Ich wohne seit einem Jahr hier.'). 'vor' + a time span means 'ago': vor zwei Tagen.",
            "fa": "‏vor، nach، seit و ab با Dativ می‌آیند: vor dem Essen، nach der Arbeit. ‏«seit» یعنی کاری در گذشته شروع شده و هنوز ادامه دارد (با زمان حال: «Ich wohne seit einem Jahr hier.»). ‏«vor» + مدت زمان یعنی «… پیش»: vor zwei Tagen.",
        },
        "r": {"title": "Tipps fürs Wochenende",
              "text": "Samstag: Großer Flohmarkt auf dem Marktplatz, von 8 bis 14 Uhr. Hier finden Sie Kleidung, Bücher und Spielsachen zu kleinen Preisen. "
                      "Sonntag: Im Stadtmuseum ist der Eintritt am ersten Sonntag im Monat frei. Das Museum ist ab 11 Uhr geöffnet. "
                      "Für Familien: Nach der Führung gibt es um 15 Uhr ein Programm für Kinder ab sechs Jahren. "
                      "Bei schönem Wetter lädt der Stadtpark zum Picknick ein. Der Spielplatz wurde vor einem Monat neu gebaut.",
              "q": [["Wann ist der Flohmarkt?", ["am Samstag von 8 bis 14 Uhr", "am Sonntag ab 11 Uhr", "jeden Tag"], 0],
                    ["Wann ist der Eintritt im Museum frei?", ["am ersten Sonntag im Monat", "jeden Samstag", "nie"], 0],
                    ["Was ist im Stadtpark neu?", ["der Spielplatz", "ein Café", "das Museum"], 0]]},
        "d": {"title": "Eine Absage", "lines": [
            ["Karin", "Hallo Wahid! Wir fahren am Sonntag an den See. Kommst du mit?"],
            ["Wahid", "Ach, schade! Am Sonntag kann ich leider nicht. Meine Cousine kommt zu Besuch."],
            ["Karin", "Seit wann ist sie in Deutschland?"], ["Wahid", "Seit einem halben Jahr. Ich habe sie vor drei Monaten das letzte Mal gesehen."],
            ["Karin", "Dann viel Spaß! Vielleicht klappt es nächstes Wochenende?"], ["Wahid", "Ja, ab nächster Woche habe ich mehr Zeit."]],
            "q": [["Warum kann Wahid am Sonntag nicht?", ["Seine Cousine kommt zu Besuch.", "Er muss arbeiten.", "Er ist krank."], 0],
                  ["Wann hat Wahid seine Cousine das letzte Mal gesehen?", ["vor drei Monaten", "vor einem halben Jahr", "letzte Woche"], 0]]},
        "s": {"task": "Ein Freund lädt dich für Samstag ein, aber du hast keine Zeit. Schreib eine Absage: Bedanke dich, erkläre den Grund und mach einen neuen Vorschlag. (5–6 Sätze)",
              "model": "Lieber Tobias, vielen Dank für deine Einladung zum Grillen am Samstag. Leider kann ich nicht kommen. Ich arbeite am Samstag bis 18 Uhr und danach muss ich meine Mutter vom Bahnhof abholen. Hast du nächsten Sonntag Zeit? Dann können wir zusammen in den Park gehen. Viele Grüße, Jawid"},
        "words": """
# Ausflüge
der See|die Seen|lake|جهیل
der Wald|die Wälder|forest|جنگل
der Berg|die Berge|mountain|کوه
der Zoo|die Zoos|zoo|باغ وحش
der Spielplatz|die Spielplätze|playground|میدان بازی
die Führung|die Führungen|guided tour|بازدید با راهنما
grillen||to barbecue|کباب کردن
# Planen
der Vorschlag|die Vorschläge|suggestion|پیشنهاد
vorschlagen||to suggest|پیشنهاد کردن
zusagen||to accept (an invitation)|قبول کردن
klappen||to work out|درست شدن، جور آمدن
der Besuch|die Besuche|visit|دیدار، مهمانی
losfahren||to set off|حرکت کردن
# Zeit
das nächste Wochenende||next weekend|آخر هفتهٔ آینده
letzte Woche||last week|هفتهٔ گذشته
halb||half|نیم
frei||free|آزاد، مجانی
""",
    },
]
