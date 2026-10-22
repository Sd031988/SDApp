# Kursbuch B1 – neue Einheiten (eigene Inhalte), Themen wie in Integrationskurs-Büchern B1:
# Medien, digitale Welt, Werbung und Konsum, alte und neue Heimat. Werden HINTEN an B1 angehängt.
UNITS = [
    {
        "t": "Medien und Unterhaltung",
        "goals": "über Filme, Serien und Bücher sprechen, eine Geschichte nacherzählen, Empfehlungen geben; Plusquamperfekt und nachdem",
        "w": [
            "die Unterhaltung||entertainment; conversation|سرگرمی؛ گفتگو",
            "die Serie|die Serien|TV series|سریال",
            "die Sendung|die Sendungen|programme, broadcast|برنامه (تلویزیونی)",
            "der Sender|die Sender|channel, station|شبکه، فرستنده",
            "die Handlung|die Handlungen|plot|داستان (فیلم)",
            "die Hauptfigur|die Hauptfiguren|main character|شخصیت اصلی",
            "spannend||exciting|هیجان‌انگیز",
            "langweilig||boring|خسته‌کننده، بی‌مزه",
            "empfehlen||to recommend|توصیه کردن",
            "die Empfehlung|die Empfehlungen|recommendation|توصیه",
            "die Nachrichten||the news|اخبار",
            "die Zeitung|die Zeitungen|newspaper|روزنامه",
            "der Untertitel|die Untertitel|subtitle|زیرنویس",
            "nachdem||after (conjunction)|بعد از اینکه",
            "sich unterhalten||to talk, to chat|گپ زدن، صحبت کردن",
        ],
        "p": ["Den Film kann ich dir sehr empfehlen.", "Es geht um eine Frau, die …", "Am Anfang …, am Ende …",
              "Die Serie hat mir gut gefallen, weil …", "Ich schaue Filme oft mit Untertiteln.", "Nachdem ich das Buch gelesen hatte, habe ich den Film gesehen."],
        "g": {
            "title": "Plusquamperfekt und nachdem",
            "head": ["", "Plusquamperfekt", "Beispiel"],
            "rows": [["mit haben", "hatte + Partizip II", "Ich hatte das Buch gelesen."], ["mit sein", "war + Partizip II", "Sie war schon gegangen."],
                     ["nachdem", "zuerst (Plusquamperfekt)", "Nachdem der Film angefangen hatte, kam Ali."],
                     ["Hauptsatz", "danach (Präteritum/Perfekt)", "Nachdem ich gegessen hatte, sah ich fern."]],
            "de": "Das Plusquamperfekt zeigt: Das ist noch früher passiert. Mit „nachdem“ steht das frühere Ereignis im Plusquamperfekt, das Verb am Ende.",
            "en": "The Plusquamperfekt (past perfect) shows that something happened even earlier than another past event: hatte/war + past participle. In a 'nachdem' clause the earlier action is in the Plusquamperfekt and the verb goes to the end: 'Nachdem ich gegessen hatte, sah ich fern.'",
            "fa": "Plusquamperfekt (گذشتهٔ بعید) نشان می‌دهد که کاری حتی قبل از یک کار دیگر در گذشته انجام شده است: hatte/war + Partizip II. در جملهٔ «nachdem» کار قبلی به شکل Plusquamperfekt می‌آید و فعل در آخر است: «Nachdem ich gegessen hatte, sah ich fern.»",
        },
        "r": {"title": "Eine Filmempfehlung",
              "text": "Gestern habe ich im Kino den Film „Der lange Weg“ gesehen. Es geht um einen jungen Mann, der allein in eine fremde Stadt kommt. "
                      "Nachdem er seine Arbeit verloren hatte, wusste er nicht, wie es weitergehen sollte. Dann lernt er eine ältere Nachbarin kennen, die ihm hilft. "
                      "Die Handlung ist spannend und manchmal auch lustig. Die Schauspieler sind sehr gut. Nur das Ende war mir etwas zu traurig. "
                      "Trotzdem kann ich den Film allen empfehlen, die gern Geschichten über Freundschaft sehen.",
              "q": [["Worum geht es im Film?", ["um einen jungen Mann in einer fremden Stadt", "um eine Familie im Urlaub", "um ein Fußballspiel"], 0],
                    ["Was war passiert, bevor er die Nachbarin kennenlernte?", ["Er hatte seine Arbeit verloren.", "Er hatte geheiratet.", "Er hatte eine Wohnung gekauft."], 0],
                    ["Was gefällt dem Schreiber nicht so gut?", ["das traurige Ende", "die Schauspieler", "die lustigen Szenen"], 0]]},
        "d": {"title": "Was schaust du gerade?", "lines": [
            ["Mona", "Hast du schon die neue Serie über die Krankenhausärztin gesehen?"],
            ["Karim", "Ja, ich habe schon fünf Folgen gesehen. Sie ist echt spannend."],
            ["Mona", "Ich hatte die erste Folge angefangen, aber dann bin ich eingeschlafen."],
            ["Karim", "Die erste Folge ist etwas langweilig. Ab der dritten Folge wird es besser."],
            ["Mona", "Schaust du sie auf Deutsch?"], ["Karim", "Ja, mit deutschen Untertiteln. So lerne ich viele neue Wörter."]],
            "q": [["Wie viele Folgen hat Karim gesehen?", ["fünf", "eine", "drei"], 0],
                  ["Wie schaut Karim die Serie?", ["auf Deutsch mit deutschen Untertiteln", "nur auf Englisch", "ohne Ton"], 0]]},
        "s": {"task": "Empfiehl einem Freund einen Film, eine Serie oder ein Buch: Worum geht es? Was hat dir gefallen, was nicht? Warum soll er es sehen/lesen? (8–10 Sätze)",
              "model": "Lieber Jamal, ich möchte dir eine Serie empfehlen. Sie heißt „Neue Nachbarn“. Es geht um eine Familie, die in ein kleines Dorf zieht. Am Anfang sind die Nachbarn nicht freundlich. Nachdem die Tochter krank geworden war, helfen ihnen aber alle. Die Geschichte ist spannend und oft lustig. Mir haben die Schauspieler sehr gut gefallen. Nur manche Folgen sind etwas zu lang. Du kannst die Serie kostenlos in der Mediathek sehen. Viele Grüße, Samira"},
        "words": """
# Film und Fernsehen
die Folge|die Folgen|episode|قسمت
der Schauspieler|die Schauspieler|actor|بازیگر
die Schauspielerin|die Schauspielerinnen|actress|بازیگر زن
der Krimi|die Krimis|crime film/novel|فیلم جنایی
die Komödie|die Komödien|comedy|کمدی
der Dokumentarfilm|die Dokumentarfilme|documentary|فیلم مستند
die Mediathek|die Mediatheken|online media library|کتابخانهٔ رسانه‌ای آنلاین
der Rundfunkbeitrag|die Rundfunkbeiträge|broadcasting fee|حق پخش رادیو و تلویزیون
# Lesen und Hören
der Roman|die Romane|novel|رمان
der Autor|die Autoren|author|نویسنده
der Podcast|die Podcasts|podcast|پادکست
das Hörbuch|die Hörbücher|audiobook|کتاب صوتی
der Artikel|die Artikel|article|مقاله
die Zeitschrift|die Zeitschriften|magazine|مجله
# Bewerten
gefallen||to please (Es gefällt mir.)|خوش آمدن
lustig||funny|خنده‌دار
traurig||sad|غمگین
unterhaltsam||entertaining|سرگرم‌کننده
übertrieben||exaggerated|اغراق‌آمیز
es geht um||it is about|موضوع ... است
""",
    },
    {
        "t": "Digitale Welt und Datenschutz",
        "goals": "sicher im Internet: Passwörter, Betrug, Datenschutz, Online-Termine bei Ämtern; Passiv mit Modalverben (muss geändert werden)",
        "w": [
            "digital||digital|دیجیتال",
            "der Datenschutz||data protection|حفاظت از اطلاعات",
            "die Daten||data|اطلاعات، داده‌ها",
            "persönlich||personal|شخصی",
            "der Betrug||fraud|کلاهبرداری",
            "der Betrüger|die Betrüger|fraudster|کلاهبردار",
            "die Sicherheit||security, safety|امنیت",
            "sicher||safe, secure; sure|امن؛ مطمئن",
            "das Benutzerkonto|die Benutzerkonten|user account|حساب کاربری",
            "sich registrieren||to register|ثبت نام کردن",
            "ändern||to change|تغییر دادن",
            "der Link|die Links|link|لینک",
            "der Anhang|die Anhänge|attachment|ضمیمه",
            "verdächtig||suspicious|مشکوک",
            "schützen||to protect|محافظت کردن",
        ],
        "p": ["Das Passwort muss regelmäßig geändert werden.", "Klicken Sie nicht auf verdächtige Links.", "Persönliche Daten dürfen nicht weitergegeben werden.",
              "Ich glaube, das ist Betrug.", "Den Termin kann man online buchen.", "Wie kann ich mein Konto schützen?"],
        "g": {
            "title": "Passiv mit Modalverben",
            "head": ["Modalverb", "Partizip II + werden (am Ende)", "Satz"],
            "rows": [["muss", "geändert werden", "Das Passwort muss geändert werden."], ["kann", "gebucht werden", "Der Termin kann online gebucht werden."],
                     ["darf", "weitergegeben werden", "Die PIN darf nicht weitergegeben werden."], ["soll", "gelöscht werden", "Die E-Mail soll sofort gelöscht werden."]],
            "de": "Passiv mit Modalverb: Modalverb auf Position 2, am Ende Partizip II + werden. Wer es macht, ist nicht wichtig.",
            "en": "Passive with a modal verb: the modal verb is in position 2, at the end comes past participle + 'werden'. It is used when the action matters more than the person who does it – very common in rules and instructions: 'Das Formular muss unterschrieben werden.'",
            "fa": "مجهول با فعل وجهی: فعل وجهی در جای دوم و در آخر Partizip II + ‏werden می‌آید. وقتی کار مهم‌تر از انجام‌دهنده است از آن استفاده می‌شود – در قوانین و راهنماها زیاد است: «Das Formular muss unterschrieben werden.»",
        },
        "r": {"title": "Vorsicht vor falschen Nachrichten",
              "text": "Immer mehr Menschen bekommen SMS oder E-Mails, die angeblich von ihrer Bank oder einem Paketdienst kommen. "
                      "Darin steht zum Beispiel, dass das Konto gesperrt wurde oder ein Paket nicht geliefert werden konnte. Man soll auf einen Link klicken und seine Daten eingeben. "
                      "Das ist fast immer Betrug. Eine echte Bank fragt nie per E-Mail nach Ihrer PIN oder Ihrem Passwort. "
                      "Verdächtige Nachrichten sollten sofort gelöscht werden. Wenn Sie schon Daten eingegeben haben, müssen Sie Ihre Bank sofort informieren und die Passwörter ändern.",
              "q": [["Was steht oft in falschen Nachrichten?", ["dass das Konto gesperrt wurde", "dass man im Lotto gewonnen hat", "dass der Deutschkurs ausfällt"], 0],
                    ["Wonach fragt eine echte Bank nie per E-Mail?", ["nach der PIN oder dem Passwort", "nach einem Termin", "nach der neuen Adresse"], 0],
                    ["Was muss man tun, wenn man schon Daten eingegeben hat?", ["die Bank informieren und Passwörter ändern", "nichts", "den Link noch einmal öffnen"], 0]]},
        "d": {"title": "Eine seltsame SMS", "lines": [
            ["Tamana", "Schau mal, ich habe eine SMS bekommen: Mein Paket kann nicht geliefert werden. Ich soll zwei Euro bezahlen."],
            ["Daud", "Erwartest du denn ein Paket?"], ["Tamana", "Nein, eigentlich nicht."],
            ["Daud", "Dann ist das bestimmt Betrug. Klick bloß nicht auf den Link!"],
            ["Tamana", "Was soll ich jetzt machen?"], ["Daud", "Die SMS sollte gelöscht und die Nummer blockiert werden. Mehr musst du nicht tun."]],
            "q": [["Was steht in der SMS?", ["Ein Paket kann nicht geliefert werden.", "Tamana hat Geld gewonnen.", "Tamanas Konto ist leer."], 0],
                  ["Was rät Daud?", ["die SMS löschen und die Nummer blockieren", "zwei Euro bezahlen", "auf den Link klicken"], 0]]},
        "s": {"task": "Eine Freundin hat eine verdächtige E-Mail von ihrer „Bank“ bekommen. Schreib ihr eine Nachricht mit Tipps: Was soll sie machen, was nicht? Benutze das Passiv mit Modalverben. (6–8 Sätze)",
              "model": "Liebe Hila, diese E-Mail ist bestimmt nicht von deiner Bank. Eine Bank fragt nie per E-Mail nach der PIN. Du darfst auf keinen Fall auf den Link klicken. Die E-Mail sollte sofort gelöscht werden. Wenn du schon etwas eingegeben hast, muss die Bank sofort informiert werden. Außerdem muss dein Passwort geändert werden. Ruf mich an, wenn du Hilfe brauchst. Liebe Grüße, Sara"},
        "words": """
# Sicher im Netz
das Virus|die Viren|virus|ویروس
das Update|die Updates|update|به‌روزرسانی
die Zwei-Faktor-Authentifizierung||two-factor authentication|تأیید دو مرحله‌ای
blockieren||to block|مسدود کردن
melden||to report|گزارش دادن
die Werbung||advertising|تبلیغات
angeblich||supposedly|ظاهراً، به ادعای
echt||real, genuine|واقعی
falsch||false, wrong|غلط، جعلی
# Online-Dienste
der Online-Termin|die Online-Termine|online appointment|نوبت آنلاین
das Online-Formular|die Online-Formulare|online form|فورم آنلاین
hochladen||to upload|بارگذاری کردن
die Datei|die Dateien|file|فایل
der Ausdruck|die Ausdrucke|printout|چاپ‌شده
das Paket|die Pakete|parcel|بسته، پارسل
liefern||to deliver|تحویل دادن
# Privatsphäre
die Privatsphäre||privacy|حریم خصوصی
weitergeben||to pass on|به دیگری دادن
die Einwilligung|die Einwilligungen|consent|رضایت
der Missbrauch||misuse, abuse|سوءاستفاده
""",
    },
    {
        "t": "Werbung und Konsum",
        "goals": "Werbung verstehen und kritisch bewerten, Verträge und Abos, bewusst einkaufen; je … desto",
        "w": [
            "der Konsum||consumption|مصرف",
            "der Verbraucher|die Verbraucher|consumer|مصرف‌کننده",
            "das Produkt|die Produkte|product|محصول",
            "die Qualität||quality|کیفیت",
            "der Preis|die Preise|price|قیمت",
            "das Sonderangebot|die Sonderangebote|special offer|تخفیف ویژه",
            "der Rabatt|die Rabatte|discount|تخفیف",
            "das Abo|die Abos|subscription|اشتراک",
            "die Kündigungsfrist|die Kündigungsfristen|notice period|مهلت فسخ",
            "vergleichen||to compare|مقایسه کردن",
            "versprechen||to promise|وعده دادن",
            "nötig||necessary|لازم",
            "nachhaltig||sustainable|پایدار",
            "sich lohnen||to be worth it|ارزیدن",
            "je … desto||the more … the more|هر چه … ، به همان اندازه …",
        ],
        "p": ["Das Angebot klingt gut, aber …", "Ich vergleiche immer zuerst die Preise.", "Je billiger das Produkt ist, desto schlechter ist oft die Qualität.",
              "Brauche ich das wirklich?", "Wie lange ist die Kündigungsfrist?", "Das lohnt sich nicht."],
        "g": {
            "title": "je … desto",
            "head": ["je + Komparativ … (Verb am Ende)", "desto + Komparativ + Verb …"],
            "rows": [["Je länger man vergleicht,", "desto mehr Geld spart man."], ["Je mehr Werbung ich sehe,", "desto mehr möchte ich kaufen."],
                     ["Je früher du kündigst,", "desto weniger zahlst du."], ["Je teurer ein Produkt ist,", "desto besser ist es nicht immer."]],
            "de": "je + Komparativ: Das Verb steht am Ende. desto + Komparativ: Danach kommt sofort das Verb.",
            "en": "'je … desto' connects two comparatives: 'the more …, the more …'. In the je-part the verb goes to the end; the desto-part starts with desto + comparative, followed directly by the verb: 'Je mehr ich lerne, desto besser spreche ich.'",
            "fa": "«je … desto» دو صفت تفضیلی را به هم وصل می‌کند: «هر چه بیشتر …، به همان اندازه بیشتر …». در بخش je فعل در آخر می‌آید؛ بخش desto با desto + صفت تفضیلی شروع می‌شود و بلافاصله فعل می‌آید: «Je mehr ich lerne, desto besser spreche ich.»",
        },
        "r": {"title": "Die Abo-Falle",
              "text": "„Jetzt testen – der erste Monat ist gratis!“ Solche Angebote sieht man überall: für Streaming, Zeitschriften oder Fitness-Apps. "
                      "Viele Menschen melden sich an und vergessen dann, rechtzeitig zu kündigen. Danach läuft das Abo weiter und kostet jeden Monat Geld. "
                      "Verbraucherzentralen raten deshalb: Lesen Sie die Bedingungen genau und notieren Sie die Kündigungsfrist im Kalender. "
                      "Seit 2022 müssen Verträge, die online abgeschlossen wurden, auch online mit einem Kündigungsbutton gekündigt werden können.",
              "q": [["Was ist die „Abo-Falle“?", ["Man vergisst zu kündigen und zahlt weiter.", "Das Abo ist immer kostenlos.", "Man darf nie kündigen."], 0],
                    ["Was raten die Verbraucherzentralen?", ["die Kündigungsfrist im Kalender notieren", "keine Verträge lesen", "nur im Geschäft einkaufen"], 0],
                    ["Was gilt seit 2022 für Online-Verträge?", ["Man muss sie auch online kündigen können.", "Sie sind verboten.", "Sie kosten mehr."], 0]]},
        "d": {"title": "Brauchst du das wirklich?", "lines": [
            ["Nadia", "Schau mal, diese Kaffeemaschine ist heute 40 Prozent billiger!"],
            ["Sohail", "Wir haben doch schon eine Kaffeemaschine."], ["Nadia", "Ja, aber die neue kann auch Cappuccino machen."],
            ["Sohail", "Je mehr Werbung du dir anschaust, desto mehr Dinge willst du haben."],
            ["Nadia", "Vielleicht hast du recht. Ich warte eine Woche. Wenn ich sie dann noch will, kaufe ich sie."],
            ["Sohail", "Gute Idee. Und wir vergleichen vorher die Preise."]],
            "q": [["Warum will Nadia die Kaffeemaschine kaufen?", ["Sie ist heute billiger und kann Cappuccino machen.", "Die alte ist kaputt.", "Sohail wünscht sie sich."], 0],
                  ["Was entscheidet Nadia?", ["Sie wartet eine Woche.", "Sie kauft sofort zwei Maschinen.", "Sie kauft nie wieder Kaffee."], 0]]},
        "s": {"task": "Was ist deine Meinung zu Werbung? Schreib einen Forumsbeitrag: Wo siehst du Werbung? Wie beeinflusst sie dich? Gib Tipps für bewusstes Einkaufen. (8–10 Sätze)",
              "model": "Werbung sehe ich jeden Tag: im Internet, auf Plakaten und im Fernsehen. Manchmal ist sie nützlich, weil ich neue Produkte kennenlerne. Oft verspricht sie aber zu viel. Je mehr Werbung ich sehe, desto mehr Dinge möchte ich kaufen. Deshalb habe ich drei Regeln. Erstens schreibe ich vor dem Einkaufen eine Liste. Zweitens vergleiche ich die Preise im Internet. Drittens warte ich bei teuren Sachen ein paar Tage. So spare ich viel Geld und kaufe nur, was ich wirklich brauche."},
        "words": """
# Werbung
das Plakat|die Plakate|poster|پوستر
die Anzeige|die Anzeigen|advertisement|آگهی
der Kunde|die Kunden|customer|مشتری
die Zielgruppe|die Zielgruppen|target group|گروه هدف
beeinflussen||to influence|تأثیر گذاشتن
überzeugen||to convince|قانع کردن
die Marke|die Marken|brand|مارک، برند
# Einkaufen und Verträge
die Bedingung|die Bedingungen|condition|شرط
gratis||free|مجانی
die Probezeit|die Probezeiten|trial period|دورهٔ آزمایشی
die Verbraucherzentrale|die Verbraucherzentralen|consumer advice centre|مرکز حمایت از مصرف‌کننده
der Widerruf|die Widerrufe|withdrawal (of a contract)|انصراف از قرارداد
die Ratenzahlung|die Ratenzahlungen|payment by instalments|پرداخت قسطی
der Kassenbon|die Kassenbons|receipt|رسید خرید
# Bewusst leben
die Umwelt||environment|محیط زیست
gebraucht||second-hand|دست دوم
verschwenden||to waste|هدر دادن
der Flohmarkt|die Flohmärkte|flea market|بازار دست‌دوم‌فروشی
reparieren lassen||to have something repaired|دادن برای ترمیم
""",
    },
    {
        "t": "Alte und neue Heimat",
        "goals": "über Herkunft, Ankommen und Heimat sprechen, Erfahrungen vergleichen; wegen und trotz mit Genitiv",
        "w": [
            "die Herkunft||origin|اصل، تبار",
            "das Heimweh||homesickness|دلتنگی برای وطن",
            "vermissen||to miss|دلتنگ شدن",
            "die Kultur|die Kulturen|culture|فرهنگ",
            "die Tradition|die Traditionen|tradition|رسم، عنعنه",
            "fremd||foreign, strange|بیگانه، ناآشنا",
            "sich gewöhnen an||to get used to|عادت کردن به",
            "sich fühlen||to feel|احساس کردن",
            "die Erfahrung|die Erfahrungen|experience|تجربه",
            "das Vorurteil|die Vorurteile|prejudice|پیش‌داوری",
            "die Integration||integration|ادغام، همگرایی",
            "die Staatsangehörigkeit|die Staatsangehörigkeiten|citizenship|تابعیت",
            "wegen||because of|به خاطر",
            "trotz||despite|با وجود",
        ],
        "p": ["Ich vermisse meine Familie sehr.", "Am Anfang war alles fremd für mich.", "Ich habe mich an das Wetter gewöhnt.",
              "Wegen der Sprache war es am Anfang schwer.", "Trotz der Probleme fühle ich mich hier wohl.", "Heimat ist für mich dort, wo meine Familie ist."],
        "g": {
            "title": "wegen und trotz + Genitiv",
            "head": ["", "der / das", "die", "die (Plural)"],
            "rows": [["wegen", "wegen des Wetters", "wegen der Arbeit", "wegen der Kinder"],
                     ["trotz", "trotz des Regens", "trotz der Kälte", "trotz der Probleme"],
                     ["Artikel", "des / eines (+ -s/-es)", "der / einer", "der"]],
            "de": "wegen = Grund, trotz = Gegengrund. Beide stehen mit Genitiv: der → des (Nomen + -s), die → der. Im Alltag hört man auch Dativ: wegen dem Wetter.",
            "en": "'wegen' gives a reason (because of), 'trotz' a contrast (despite). Both take the genitive: der/das → des (and the noun usually gets -s/-es), die → der, plural → der. In everyday speech you also hear the dative ('wegen dem Wetter'), but in writing use the genitive.",
            "fa": "«wegen» دلیل را بیان می‌کند (به خاطر) و «trotz» تضاد را (با وجود). هر دو با حالت اضافی (Genitiv) می‌آیند: der/das ← des (و اسم معمولاً ‎-s/-es می‌گیرد)، die ← der، جمع ← der. در گفتگوی روزمره حالت Dativ هم شنیده می‌شود («wegen dem Wetter»)، اما در نوشتن از Genitiv استفاده کنید.",
        },
        "r": {"title": "Zwei Heimaten",
              "text": "Farhad Jafari kam vor acht Jahren aus Afghanistan nach Deutschland. Wegen des Krieges musste er seine Heimat verlassen. "
                      "Am Anfang fühlte er sich sehr fremd. Er vermisste das Essen, die Berge und vor allem seine Mutter. Trotz der vielen Schwierigkeiten gab er nicht auf. "
                      "Er lernte Deutsch, machte eine Ausbildung als Elektriker und spielt heute in einem Fußballverein. "
                      "„Ich habe jetzt zwei Heimaten“, sagt er. „Kabul ist meine Herkunft, aber Leipzig ist mein Zuhause. Ich muss mich nicht für eine entscheiden.“",
              "q": [["Warum kam Farhad nach Deutschland?", ["wegen des Krieges", "wegen einer Ausbildung", "wegen des Fußballs"], 0],
                    ["Was hat Farhad am Anfang vermisst?", ["das Essen, die Berge und seine Mutter", "seinen Fußballverein", "seine Arbeit als Elektriker"], 0],
                    ["Was bedeutet Heimat heute für Farhad?", ["Er hat zwei Heimaten.", "Nur Kabul ist seine Heimat.", "Er hat keine Heimat mehr."], 0]]},
        "d": {"title": "Was fehlt dir?", "lines": [
            ["Lisa", "Wie lange lebst du jetzt schon in Deutschland, Marzia?"], ["Marzia", "Seit fünf Jahren. Die Zeit vergeht so schnell!"],
            ["Lisa", "Was vermisst du am meisten?"], ["Marzia", "Meine Schwestern. Wir telefonieren fast jeden Tag, aber das ist nicht dasselbe."],
            ["Lisa", "Und was gefällt dir hier?"],
            ["Marzia", "Trotz des kalten Wetters mag ich den Winter hier. Und ich finde gut, dass meine Töchter studieren können."]],
            "q": [["Wen vermisst Marzia am meisten?", ["ihre Schwestern", "ihre Töchter", "ihre Nachbarin"], 0],
                  ["Was gefällt Marzia in Deutschland?", ["dass ihre Töchter studieren können", "das warme Wetter", "dass sie nie telefonieren muss"], 0]]},
        "s": {"task": "Was bedeutet Heimat für dich? Schreib einen Text: Was vermisst du? Woran hast du dich gewöhnt? Was gefällt dir an deinem neuen Zuhause? Benutze wegen und trotz. (8–10 Sätze)",
              "model": "Für mich ist Heimat dort, wo meine Familie ist. Ich komme aus Herat und lebe seit sechs Jahren in Hamburg. Ich vermisse das Essen meiner Mutter und die Feste mit der ganzen Familie. Wegen der Sprache war der Anfang sehr schwer. Inzwischen habe ich mich an vieles gewöhnt, zum Beispiel an das Wetter und an die Pünktlichkeit. Trotz mancher Vorurteile habe ich hier gute Freunde gefunden. Mir gefällt, dass meine Kinder hier sicher zur Schule gehen können. Heute habe ich das Gefühl, dass ich zwei Heimaten habe."},
        "words": """
# Ankommen
die Ankunft||arrival|ورود
das Zuhause||home|خانه، کاشانه
der Neuanfang|die Neuanfänge|new start|شروع دوباره
die Schwierigkeit|die Schwierigkeiten|difficulty|مشکل، دشواری
aufgeben||to give up|دست کشیدن، تسلیم شدن
verlassen||to leave|ترک کردن
die Geduld||patience|صبر، حوصله
# Gefühle
das Gefühl|die Gefühle|feeling|احساس
die Sehnsucht||longing|آرزو، اشتیاق
einsam||lonely|تنها
wohl||well, comfortable (sich wohlfühlen)|راحت، خوش
dankbar||grateful|سپاس‌گزار
die Hoffnung|die Hoffnungen|hope|امید
# Gesellschaft
die Gesellschaft|die Gesellschaften|society|جامعه
die Einbürgerung|die Einbürgerungen|naturalisation|تابعیت گرفتن
die Muttersprache|die Muttersprachen|mother tongue|زبان مادری
zweisprachig||bilingual|دوزبانه
die Gemeinschaft|die Gemeinschaften|community|جامعه، اجتماع
""",
    },
]
