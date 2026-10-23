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

# Zweite Runde: restliche Themen aus B1-Kursbüchern
UNITS += [
    {
        "t": "Glück im Alltag",
        "goals": "über Glück, Wünsche und Träume sprechen, kleine Glücksmomente beschreiben; Konjunktiv II für Wünsche (Wenn ich … hätte/wäre, würde ich …)",
        "w": [
            "das Glück||happiness; luck|خوشبختی؛ شانس",
            "glücklich||happy|خوشبخت، خوشحال",
            "zufrieden||satisfied, content|راضی",
            "der Wunsch|die Wünsche|wish|آرزو",
            "sich wünschen||to wish for|آرزو داشتن",
            "der Traum|die Träume|dream|خواب؛ رؤیا",
            "träumen (von)||to dream (of)|خواب دیدن؛ رؤیا داشتن",
            "der Zufall|die Zufälle|coincidence|تصادف، اتفاق",
            "die Freude||joy|شادی",
            "genießen||to enjoy|لذت بردن",
            "das Pech||bad luck|بدشانسی",
            "die Gesundheit||health|صحت، سلامتی",
            "wichtig||important|مهم",
            "wenn||if|اگر",
        ],
        "p": ["Für mich ist Glück, wenn …", "Ich hätte gern mehr Zeit für meine Familie.", "Wenn ich viel Geld hätte, würde ich …",
              "Ich wünsche mir, dass …", "Da hatte ich wirklich Glück!", "Am glücklichsten bin ich, wenn …"],
        "g": {
            "title": "Konjunktiv II: Wünsche und Träume",
            "head": ["", "sein", "haben", "würde + Infinitiv"],
            "rows": [["ich", "wäre", "hätte", "würde reisen"], ["du", "wärst", "hättest", "würdest reisen"], ["er / sie", "wäre", "hätte", "würde reisen"],
                     ["wir", "wären", "hätten", "würden reisen"], ["ihr", "wärt", "hättet", "würdet reisen"], ["sie / Sie", "wären", "hätten", "würden reisen"]],
            "de": "Unwirkliche Wünsche: Wenn ich mehr Zeit hätte, würde ich reisen. Bei sein, haben und Modalverben benutzt man die eigene Form (wäre, hätte, könnte), sonst würde + Infinitiv.",
            "en": "For wishes and things that are not real, use the Konjunktiv II: 'Wenn ich mehr Zeit hätte, würde ich reisen.' sein, haben and modal verbs have their own forms (wäre, hätte, könnte, müsste); most other verbs use würde + infinitive. Wishes: 'Ich wäre gern …', 'Ich hätte gern …', 'Wenn ich doch … hätte!'",
            "fa": "برای آرزوها و چیزهای غیرواقعی از Konjunktiv II استفاده می‌شود: «Wenn ich mehr Zeit hätte, würde ich reisen.» ‏sein، haben و فعل‌های وجهی شکل خاص خود را دارند (wäre، hätte، könnte، müsste)؛ بیشتر فعل‌های دیگر با würde + مصدر می‌آیند. آرزو: «Ich wäre gern …»، «Ich hätte gern …».",
        },
        "r": {"title": "Kleine Glücksmomente",
              "text": "Was macht Menschen glücklich? Viele denken zuerst an Geld, ein großes Haus oder ein teures Auto. Doch Glücksforscher sagen, dass Beziehungen zu Familie und Freunden für die meisten Menschen wichtiger sind. "
                      "Auch kleine Momente im Alltag spielen eine große Rolle: ein Gespräch mit der Nachbarin, ein Spaziergang in der Sonne oder ein gutes Essen. "
                      "Wer dankbar ist und solche Momente bewusst genießt, ist oft zufriedener. Ein einfacher Tipp: Schreiben Sie jeden Abend drei Dinge auf, über die Sie sich heute gefreut haben.",
              "q": [["Was ist laut Glücksforschern für die meisten Menschen wichtiger als Geld?", ["Beziehungen zu Familie und Freunden", "ein großes Haus", "ein teures Auto"], 0],
                    ["Was ist ein Beispiel für einen kleinen Glücksmoment?", ["ein Spaziergang in der Sonne", "eine hohe Rechnung", "ein langer Arbeitstag"], 0],
                    ["Was ist der Tipp am Ende?", ["jeden Abend drei schöne Dinge aufschreiben", "mehr arbeiten", "weniger schlafen"], 0]]},
        "d": {"title": "Was wäre, wenn …?", "lines": [
            ["Emma", "Stell dir vor, du gewinnst im Lotto. Was würdest du machen?"],
            ["Roya", "Zuerst würde ich meine Eltern besuchen. Ich habe sie seit vier Jahren nicht gesehen."],
            ["Emma", "Und dann?"], ["Roya", "Dann würde ich eine eigene Bäckerei eröffnen. Das ist schon lange mein Traum."],
            ["Emma", "Und wärst du dann glücklicher?"], ["Roya", "Vielleicht. Aber eigentlich bin ich schon zufrieden – ich habe tolle Kinder und gute Freunde."]],
            "q": [["Was würde Roya zuerst machen?", ["ihre Eltern besuchen", "ein Auto kaufen", "eine Reise um die Welt machen"], 0],
                  ["Was ist Royas Traum?", ["eine eigene Bäckerei", "ein großes Haus", "ein neuer Beruf als Lehrerin"], 0]]},
        "s": {"task": "Was bedeutet Glück für dich? Beschreib einen glücklichen Moment und schreib, was du dir für die Zukunft wünschst. Benutze den Konjunktiv II. (8–10 Sätze)",
              "model": "Für mich ist Glück, wenn meine Familie gesund ist. Ein besonders glücklicher Moment war der Tag, an dem meine Tochter ihren Schulabschluss bekommen hat. Wir haben zusammen gekocht und gefeiert. Im Alltag freue ich mich über kleine Dinge, zum Beispiel über einen Tee mit meiner Nachbarin. Wenn ich mehr Zeit hätte, würde ich öfter in die Natur fahren. Ich wäre gern Krankenpflegerin. Deshalb lerne ich jeden Tag Deutsch. Ich wünsche mir, dass meine Kinder hier eine gute Zukunft haben."},
        "words": """
# Gefühle
die Zufriedenheit||contentment|رضایت
die Dankbarkeit||gratitude|سپاس‌گزاری
die Sorge|die Sorgen|worry|نگرانی
sich Sorgen machen||to worry|نگران بودن
entspannt||relaxed|آرام، راحت
gestresst||stressed|تحت فشار
optimistisch||optimistic|خوش‌بین
# Glück und Zufall
der Lottogewinn|die Lottogewinne|lottery win|برندهٔ لاتری
gewinnen||to win|بردن
der Glücksbringer|die Glücksbringer|lucky charm|طلسم خوش‌شانسی
die Beziehung|die Beziehungen|relationship|رابطه
der Moment|die Momente|moment|لحظه
bewusst||consciously|آگاهانه
# Ziele
das Ziel|die Ziele|goal|هدف
erreichen||to achieve, to reach|رسیدن به
die Zukunft||future|آینده
sich verwirklichen||to come true; to fulfil oneself|تحقق یافتن
""",
    },
    {
        "t": "Gesund bleiben",
        "goals": "gesund leben, Vorsorge, Stress, mit dem Arzt sprechen, Ratschläge geben; Konnektoren deshalb, trotzdem, sonst",
        "w": [
            "die Vorsorge||preventive care|پیشگیری",
            "die Vorsorgeuntersuchung|die Vorsorgeuntersuchungen|check-up|معاینهٔ پیشگیرانه",
            "die Impfung|die Impfungen|vaccination|واکسین",
            "der Stress||stress|فشار روحی، استرس",
            "die Ernährung||diet, nutrition|تغذیه",
            "ausgewogen||balanced|متعادل",
            "die Bewegung||exercise, movement|تحرک",
            "der Schlaf||sleep|خواب",
            "rauchen||to smoke|سگرت کشیدن",
            "der Rat|die Ratschläge|advice|مشوره",
            "raten||to advise|مشوره دادن",
            "vermeiden||to avoid|دوری کردن",
            "deshalb||therefore|به همین دلیل",
            "trotzdem||nevertheless|با این حال",
            "sonst||otherwise|وگرنه",
        ],
        "p": ["Ich habe viel Stress, deshalb schlafe ich schlecht.", "Ich bin müde, trotzdem gehe ich joggen.", "Du solltest mehr Wasser trinken.",
              "Geh zum Arzt, sonst wird es schlimmer.", "Wann war Ihre letzte Vorsorgeuntersuchung?", "Ich achte auf eine ausgewogene Ernährung."],
        "g": {
            "title": "deshalb, trotzdem, sonst",
            "head": ["Konnektor", "Bedeutung", "Beispiel (Verb auf Position 2)"],
            "rows": [["deshalb / darum", "Folge", "Ich habe Rückenschmerzen, deshalb mache ich Gymnastik."],
                     ["trotzdem", "Gegensatz", "Es regnet, trotzdem gehe ich spazieren."],
                     ["sonst", "wenn nicht …", "Nimm die Tabletten, sonst wirst du nicht gesund."]],
            "de": "Nach deshalb, trotzdem und sonst kommt sofort das Verb (Position 2), dann das Subjekt: …, deshalb gehe ich zum Arzt.",
            "en": "deshalb (therefore), trotzdem (nevertheless) and sonst (otherwise) take position 1 in the second sentence, so the verb follows immediately and the subject comes after it: '…, deshalb gehe ich zum Arzt.' Do not confuse with weil/obwohl, which send the verb to the end.",
            "fa": "‏deshalb (به همین دلیل)، trotzdem (با این حال) و sonst (وگرنه) در جملهٔ دوم در جای اول می‌آیند، پس فعل بلافاصله بعد از آن و فاعل بعد از فعل می‌آید: «…, deshalb gehe ich zum Arzt.» با weil/obwohl که فعل را به آخر می‌برند اشتباه نکنید.",
        },
        "r": {"title": "Vorsorge lohnt sich",
              "text": "Viele Menschen gehen erst zum Arzt, wenn sie krank sind. Dabei ist Vorsorge sehr wichtig. Die gesetzliche Krankenversicherung bezahlt viele Untersuchungen, zum Beispiel ab 35 Jahren alle drei Jahre einen Gesundheits-Check-up beim Hausarzt. "
                      "Auch für Kinder gibt es regelmäßige Untersuchungen, die U-Untersuchungen. Dazu kommen Impfungen und die Kontrolle beim Zahnarzt. "
                      "Wer Krankheiten früh erkennt, kann sie oft besser behandeln. Deshalb sollte man die Termine nicht vergessen – auch wenn man sich gesund fühlt.",
              "q": [["Wie oft bezahlt die Krankenkasse ab 35 Jahren einen Check-up?", ["alle drei Jahre", "jeden Monat", "nur einmal im Leben"], 0],
                    ["Wie heißen die Untersuchungen für Kinder?", ["U-Untersuchungen", "Check-ups", "Impfungen"], 0],
                    ["Warum ist Vorsorge wichtig?", ["Krankheiten werden früh erkannt.", "Man bekommt Geld.", "Man muss nicht arbeiten."], 0]]},
        "d": {"title": "Beim Hausarzt", "lines": [
            ["Ärztin", "Was führt Sie zu mir, Herr Wardak?"], ["Herr Wardak", "Ich bin immer müde und habe oft Kopfschmerzen. Ich arbeite im Schichtdienst."],
            ["Ärztin", "Wie viel schlafen Sie?"], ["Herr Wardak", "Fünf Stunden, manchmal weniger. Ich trinke viel Kaffee, trotzdem bin ich müde."],
            ["Ärztin", "Sie sollten mindestens sieben Stunden schlafen und weniger Kaffee trinken, sonst werden die Kopfschmerzen nicht besser. Wir machen auch ein Blutbild."],
            ["Herr Wardak", "Gut, dann versuche ich das. Vielen Dank."]],
            "q": [["Welche Beschwerden hat Herr Wardak?", ["Müdigkeit und Kopfschmerzen", "Bauchschmerzen", "Fieber und Husten"], 0],
                  ["Was rät die Ärztin?", ["mehr schlafen und weniger Kaffee trinken", "mehr Kaffee trinken", "eine Woche Urlaub machen"], 0]]},
        "s": {"task": "Ein Freund hat viel Stress und schläft schlecht. Schreib ihm eine Nachricht mit Ratschlägen. Benutze deshalb, trotzdem, sonst und „du solltest“. (7–9 Sätze)",
              "model": "Lieber Basir, du hast geschrieben, dass du viel Stress hast und schlecht schläfst. Das tut mir leid. Du solltest jeden Tag eine halbe Stunde spazieren gehen. Bewegung hilft gegen Stress, deshalb mache ich das auch. Trink am Abend keinen Kaffee mehr, sonst kannst du nicht einschlafen. Ich weiß, du hast wenig Zeit. Trotzdem solltest du dir kleine Pausen nehmen. Wenn es nicht besser wird, geh bitte zum Hausarzt. Alles Gute, dein Yusuf"},
        "words": """
# Vorsorge
die Krankenkasse|die Krankenkassen|health insurance fund|صندوق بیمهٔ صحی
die Untersuchung|die Untersuchungen|examination|معاینه
der Zahnarzt|die Zahnärzte|dentist|داکتر دندان
das Blutbild|die Blutbilder|blood count|آزمایش خون
der Blutdruck||blood pressure|فشار خون
der Impfpass|die Impfpässe|vaccination record|کارت واکسین
behandeln||to treat|تداوی کردن
erkennen||to recognise, to detect|تشخیص دادن
# Gesunder Alltag
der Schichtdienst||shift work|کار نوبتی
die Entspannung||relaxation|آرامش، استراحت
das Übergewicht||overweight|اضافه وزن
der Zucker||sugar|بوره، شکر
das Vollkornbrot|die Vollkornbrote|wholemeal bread|نان سبوس‌دار
achten auf||to pay attention to|توجه کردن به
aufhören (mit)||to stop|ترک کردن
# Beschwerden
die Beschwerden||complaints, symptoms|ناراحتی‌ها، علائم
die Müdigkeit||tiredness|خستگی
schwindelig||dizzy|سرگیچ
erschöpft||exhausted|خسته و کوفته
""",
    },
    {
        "t": "Sprachen lernen",
        "goals": "über Sprachen und Lernstrategien sprechen, Mehrsprachigkeit, Missverständnisse; Verben mit Präpositionen und da-/wo-Wörter (sich interessieren für – dafür, wofür?)",
        "w": [
            "die Sprache|die Sprachen|language|زبان",
            "die Muttersprache|die Muttersprachen|mother tongue|زبان مادری",
            "die Fremdsprache|die Fremdsprachen|foreign language|زبان خارجی",
            "mehrsprachig||multilingual|چندزبانه",
            "der Dialekt|die Dialekte|dialect|لهجه",
            "die Aussprache||pronunciation|تلفظ",
            "das Missverständnis|die Missverständnisse|misunderstanding|سوءتفاهم",
            "sich interessieren für||to be interested in|علاقه داشتن به",
            "sich erinnern an||to remember|به یاد آوردن",
            "sich kümmern um||to take care of|رسیدگی کردن به",
            "denken an||to think of|فکر کردن به",
            "üben||to practise|تمرین کردن",
            "wiederholen||to repeat|تکرار کردن",
            "die Lernstrategie|die Lernstrategien|learning strategy|روش یادگیری",
        ],
        "p": ["Wie lernst du neue Wörter?", "Ich interessiere mich sehr für Sprachen.", "Woran denkst du? – An meine erste Deutschstunde.",
              "Wofür brauchst du Englisch? – Dafür, dass ich mit Kunden sprechen kann.", "Entschuldigung, das war ein Missverständnis.", "Mit meinen Kindern spreche ich Dari."],
        "g": {
            "title": "Verben mit Präposition: da- und wo-",
            "head": ["Verb + Präposition", "Frage (Sache)", "Antwort (Sache)", "Person"],
            "rows": [["sich interessieren für", "Wofür?", "dafür", "für wen? – für ihn"], ["denken an", "Woran?", "daran", "an wen? – an sie"],
                     ["sich erinnern an", "Woran?", "daran", "an wen? – an ihn"], ["sich kümmern um", "Worum?", "darum", "um wen? – um sie"],
                     ["sprechen über", "Worüber?", "darüber", "über wen? – über ihn"]],
            "de": "Bei Sachen: wo(r)- + Präposition (Wofür? Woran?) und da(r)- + Präposition (dafür, daran). Beginnt die Präposition mit Vokal, kommt ein -r- dazu. Bei Personen: Präposition + Pronomen (an wen? an sie).",
            "en": "Many verbs come with a fixed preposition: sich interessieren für, denken an, sich kümmern um. For things you ask with wo- + preposition (Wofür? Woran?) and answer with da- + preposition (dafür, daran). If the preposition starts with a vowel, add -r-: woran, darüber. For people use preposition + pronoun: 'An wen denkst du? – An meine Mutter.'",
            "fa": "بسیاری از فعل‌ها یک حرف اضافهٔ ثابت دارند: sich interessieren für، denken an، sich kümmern um. برای چیزها با wo- + حرف اضافه می‌پرسیم (Wofür? Woran?) و با da- + حرف اضافه جواب می‌دهیم (dafür، daran). اگر حرف اضافه با حرف صدادار شروع شود ‎-r-‎ اضافه می‌شود: woran، darüber. برای اشخاص: حرف اضافه + ضمیر: «An wen denkst du? – An meine Mutter.»",
        },
        "r": {"title": "Mehrsprachig aufwachsen",
              "text": "In vielen Familien in Deutschland werden zwei oder mehr Sprachen gesprochen. Manche Eltern machen sich Sorgen darüber, dass ihre Kinder dann schlechter Deutsch lernen. "
                      "Fachleute sehen das anders: Kinder können mehrere Sprachen gut lernen. Wichtig ist, dass die Eltern in der Sprache mit ihren Kindern sprechen, die sie selbst am besten können. "
                      "Wer seine Muttersprache gut beherrscht, lernt oft auch eine zweite Sprache leichter. Viele Städte bieten außerdem Unterricht in der Herkunftssprache an. Mehrsprachigkeit ist also kein Problem, sondern eine Chance.",
              "q": [["Worüber machen sich manche Eltern Sorgen?", ["dass ihre Kinder schlechter Deutsch lernen", "dass ihre Kinder zu viel lesen", "dass die Schule zu teuer ist"], 0],
                    ["In welcher Sprache sollten Eltern mit ihren Kindern sprechen?", ["in der Sprache, die sie selbst am besten können", "nur auf Deutsch", "nur auf Englisch"], 0],
                    ["Wie sieht der Text Mehrsprachigkeit?", ["als Chance", "als großes Problem", "als unwichtig"], 0]]},
        "d": {"title": "Ein Missverständnis", "lines": [
            ["Chefin", "Herr Hakimi, können Sie die Kartons bitte nach hinten bringen?"],
            ["Herr Hakimi", "Nach hinten? Meinen Sie in den Keller?"], ["Chefin", "Nein, ins Lager hinter der Küche."],
            ["Herr Hakimi", "Ach so! Entschuldigung, ich habe „hinten“ und „unten“ verwechselt."],
            ["Chefin", "Kein Problem. Sie fragen wenigstens nach – darüber bin ich froh."],
            ["Herr Hakimi", "Ich interessiere mich sehr dafür, besser Deutsch zu sprechen. Ich übe jeden Abend."]],
            "q": [["Wohin soll Herr Hakimi die Kartons bringen?", ["ins Lager hinter der Küche", "in den Keller", "nach draußen"], 0],
                  ["Worüber ist die Chefin froh?", ["dass Herr Hakimi nachfragt", "dass die Kartons leer sind", "dass Herr Hakimi früh nach Hause geht"], 0]]},
        "s": {"task": "Wie lernst du Deutsch? Schreib einen Beitrag für ein Lernforum: Was hilft dir? Was ist schwer? Woran erinnerst du dich gern? Benutze Verben mit Präpositionen. (8–10 Sätze)",
              "model": "Ich lerne seit zwei Jahren Deutsch. Am Anfang war die Aussprache sehr schwer für mich, besonders das „ü“. Ich erinnere mich gern an meinen ersten Kurs, weil die Lehrerin sehr geduldig war. Neue Wörter schreibe ich auf Karteikarten und wiederhole sie im Bus. Außerdem schaue ich Serien mit Untertiteln. Ich interessiere mich besonders für Wörter aus meinem Beruf, denn ich möchte als Elektriker arbeiten. Mit meinen Kindern spreche ich Paschtu, darüber freuen sich auch meine Eltern. Mein Tipp: Habt keine Angst vor Fehlern!"},
        "words": """
# Sprachen
die Herkunftssprache|die Herkunftssprachen|heritage language|زبان اصلی (خانواده)
die Zweitsprache|die Zweitsprachen|second language|زبان دوم
der Akzent|die Akzente|accent|لهجه (تلفظ)
die Grammatik||grammar|دستور زبان
der Wortschatz||vocabulary|ذخیرهٔ لغات
beherrschen||to master|مسلط بودن
übersetzen||to translate|ترجمه کردن
# Lernen
die Karteikarte|die Karteikarten|flashcard|کارت یادداشت
der Fehler|die Fehler|mistake|اشتباه
korrigieren||to correct|تصحیح کردن
nachfragen||to ask (again)|دوباره پرسیدن
verwechseln||to mix up|اشتباه گرفتن
geduldig||patient|صبور
# Verben mit Präposition
sich freuen über||to be happy about|خوشحال بودن از
sich ärgern über||to be annoyed about|عصبانی شدن از
warten auf||to wait for|منتظر ... بودن
Angst haben vor||to be afraid of|ترسیدن از
teilnehmen an||to take part in|شرکت کردن در
""",
    },
    {
        "t": "Dienstleistungen",
        "goals": "Dienstleistungen beauftragen (Friseur, Werkstatt, Handwerker, Paketdienst), Preise und Termine klären, reklamieren; lassen (etwas machen lassen)",
        "w": [
            "die Dienstleistung|die Dienstleistungen|service|خدمات",
            "der Friseur|die Friseure|hairdresser|سلمانی",
            "die Werkstatt|die Werkstätten|garage, workshop|ورکشاپ، ترمیم‌گاه",
            "der Handwerker|die Handwerker|tradesman|کارگر فنی",
            "der Kostenvoranschlag|die Kostenvoranschläge|cost estimate|برآورد هزینه",
            "der Auftrag|die Aufträge|order, job|سفارش، کار",
            "beauftragen||to commission|سفارش دادن به",
            "lassen||to have (something done); to let|دادن برای انجام؛ گذاشتن",
            "abholen||to collect|گرفتن، آوردن",
            "liefern||to deliver|تحویل دادن",
            "die Lieferung|die Lieferungen|delivery|تحویل",
            "zufrieden||satisfied|راضی",
            "die Beschwerde|die Beschwerden|complaint|شکایت",
            "die Qualität||quality|کیفیت",
        ],
        "p": ["Ich möchte mir die Haare schneiden lassen.", "Ich lasse mein Auto in der Werkstatt reparieren.", "Können Sie mir einen Kostenvoranschlag machen?",
              "Wann kann ich das Fahrrad abholen?", "Mit der Arbeit bin ich leider nicht zufrieden.", "Lassen Sie mich kurz überlegen."],
        "g": {
            "title": "lassen: etwas machen lassen",
            "head": ["Satz", "Bedeutung"],
            "rows": [["Ich lasse mir die Haare schneiden.", "Der Friseur schneidet sie, nicht ich."], ["Wir lassen das Auto reparieren.", "Die Werkstatt repariert es."],
                     ["Er hat die Waschmaschine liefern lassen.", "Perfekt: hat … lassen (Infinitiv)"], ["Lass mich helfen!", "lassen = erlauben"]],
            "de": "lassen + Infinitiv am Ende: Eine andere Person macht die Arbeit. Im Perfekt steht „lassen“ im Infinitiv: Ich habe die Heizung reparieren lassen.",
            "en": "lassen + infinitive means you have someone else do something: 'Ich lasse das Auto reparieren.' (The garage repairs it.) The infinitive goes to the end. In the perfect tense 'lassen' stays in the infinitive: 'Ich habe die Heizung reparieren lassen.' lassen can also mean 'to let/allow': 'Lass mich helfen!'",
            "fa": "‏lassen + مصدر یعنی کاری را به کس دیگری می‌سپارید: «Ich lasse das Auto reparieren.» (ورکشاپ آن را ترمیم می‌کند.) مصدر در آخر جمله می‌آید. در زمان Perfekt خود lassen هم به شکل مصدر می‌ماند: «Ich habe die Heizung reparieren lassen.» ‏lassen به معنای «اجازه دادن» هم هست: «Lass mich helfen!»",
        },
        "r": {"title": "Handwerker finden – aber richtig",
              "text": "Wenn in der Wohnung etwas kaputt ist, muss man zuerst den Vermieter informieren. Er muss Schäden reparieren lassen, die nicht der Mieter verursacht hat. "
                      "Für eigene Aufträge, zum Beispiel einen Umzug oder neue Möbel, sollte man mehrere Angebote vergleichen und sich einen schriftlichen Kostenvoranschlag geben lassen. "
                      "Bezahlen Sie nicht im Voraus und lassen Sie sich immer eine Rechnung geben. Wenn die Arbeit schlecht gemacht wurde, haben Sie das Recht, eine Nachbesserung zu verlangen.",
              "q": [["Wen muss ein Mieter zuerst informieren, wenn etwas kaputt ist?", ["den Vermieter", "die Polizei", "die Nachbarn"], 0],
                    ["Was sollte man vor einem eigenen Auftrag machen?", ["mehrere Angebote vergleichen", "sofort bezahlen", "keine Rechnung verlangen"], 0],
                    ["Was kann man verlangen, wenn die Arbeit schlecht ist?", ["eine Nachbesserung", "einen neuen Vermieter", "nichts"], 0]]},
        "d": {"title": "In der Fahrradwerkstatt", "lines": [
            ["Mitarbeiter", "Was kann ich für Sie tun?"], ["Frau Popal", "Meine Bremse funktioniert nicht richtig. Ich möchte sie reparieren lassen."],
            ["Mitarbeiter", "Ich schaue mal … Die Bremsbeläge sind alt. Neue kosten mit Arbeit ungefähr 35 Euro."],
            ["Frau Popal", "Und wann ist das Fahrrad fertig?"], ["Mitarbeiter", "Morgen ab 16 Uhr können Sie es abholen."],
            ["Frau Popal", "Gut. Rufen Sie mich bitte an, wenn es teurer wird."]],
            "q": [["Was ist am Fahrrad kaputt?", ["die Bremse", "das Licht", "der Reifen"], 0],
                  ["Wann kann Frau Popal das Fahrrad abholen?", ["morgen ab 16 Uhr", "heute Abend", "in einer Woche"], 0]]},
        "s": {"task": "Du hast deine Waschmaschine reparieren lassen, aber sie ist nach zwei Tagen wieder kaputt. Schreib eine Beschwerde an die Firma: Was ist passiert? Was erwartest du? (8–10 Sätze)",
              "model": "Sehr geehrte Damen und Herren, am 4. März habe ich meine Waschmaschine von Ihrem Techniker reparieren lassen. Ich habe dafür 120 Euro bezahlt. Leider funktioniert die Maschine schon nach zwei Tagen wieder nicht. Das Wasser läuft nicht ab. Mit der Reparatur bin ich deshalb nicht zufrieden. Ich bitte Sie, die Maschine kostenlos nachzubessern. Bitte teilen Sie mir mit, wann ein Techniker kommen kann. Ich bin vormittags zu Hause. Mit freundlichen Grüßen, Laila Popal"},
        "words": """
# Dienstleister
der Schlüsseldienst|die Schlüsseldienste|locksmith service|خدمات کلیدسازی
die Reinigung|die Reinigungen|dry cleaner's|لباس‌شویی (خشک‌شویی)
der Schneider|die Schneider|tailor|خیاط
der Elektriker|die Elektriker|electrician|برقکار
der Klempner|die Klempner|plumber|نل‌دوان
der Paketdienst|die Paketdienste|parcel service|خدمات پست بسته
der Umzugsservice|die Umzugsservices|removal service|خدمات انتقال اثاثیه
# Auftrag und Preis
im Voraus||in advance|از قبل، پیش‌پرداخت
schriftlich||in writing|کتبی
die Nachbesserung|die Nachbesserungen|rectification|اصلاح دوباره
verlangen||to demand|خواستن، مطالبه کردن
der Schaden|die Schäden|damage|خسارت
verursachen||to cause|باعث شدن
# Am Fahrrad / Auto
die Bremse|die Bremsen|brake|برک
der Reifen|die Reifen|tyre|تایر
der Ölwechsel|die Ölwechsel|oil change|تبدیل روغن
""",
    },
    {
        "t": "Unter Kollegen",
        "goals": "im Team arbeiten, Konflikte am Arbeitsplatz lösen, Smalltalk, Aufgaben verteilen; zweiteilige Konnektoren (sowohl … als auch, weder … noch, entweder … oder, nicht nur … sondern auch)",
        "w": [
            "der Kollege|die Kollegen|colleague (male)|همکار",
            "die Kollegin|die Kolleginnen|colleague (female)|همکار (زن)",
            "das Team|die Teams|team|تیم",
            "die Teamarbeit||teamwork|کار گروهی",
            "der Vorgesetzte|die Vorgesetzten|superior, boss|آمر، مافوق",
            "die Besprechung|die Besprechungen|meeting|جلسه",
            "die Aufgabe|die Aufgaben|task|وظیفه",
            "verteilen||to distribute|تقسیم کردن",
            "zuständig||responsible|مسئول",
            "der Konflikt|die Konflikte|conflict|کشمکش، اختلاف",
            "die Lösung|die Lösungen|solution|راه‌حل",
            "der Kompromiss|die Kompromisse|compromise|سازش، توافق",
            "der Smalltalk||small talk|گپ کوتاه دوستانه",
            "die Kantine|die Kantinen|canteen|غذاخوری",
            "sowohl … als auch||both … and|هم … و هم",
        ],
        "p": ["Wer ist dafür zuständig?", "Können wir das in der Besprechung klären?", "Ich schlage vor, dass wir die Aufgaben teilen.",
              "Ich habe weder Zeit noch Lust auf Streit.", "Sollen wir zusammen in die Kantine gehen?", "Lass uns einen Kompromiss finden."],
        "g": {
            "title": "Zweiteilige Konnektoren",
            "head": ["Konnektor", "Bedeutung", "Beispiel"],
            "rows": [["sowohl … als auch", "beides", "Er spricht sowohl Dari als auch Deutsch."], ["nicht nur … sondern auch", "beides (betont)", "Sie ist nicht nur pünktlich, sondern auch freundlich."],
                     ["weder … noch", "keins von beiden", "Ich habe weder Zeit noch Geld."], ["entweder … oder", "eins von beiden", "Wir treffen uns entweder am Montag oder am Dienstag."]],
            "de": "Zweiteilige Konnektoren verbinden zwei Satzteile. „weder … noch“ ist schon negativ – kein extra „nicht“!",
            "en": "Two-part connectors link two words or phrases: sowohl … als auch (both … and), nicht nur … sondern auch (not only … but also), weder … noch (neither … nor), entweder … oder (either … or). 'weder … noch' is already negative – do not add 'nicht' or 'kein'.",
            "fa": "حروف ربط دوبخشی دو کلمه یا عبارت را به هم وصل می‌کنند: sowohl … als auch (هم … و هم)، nicht nur … sondern auch (نه تنها … بلکه)، weder … noch (نه … و نه)، entweder … oder (یا … یا). ‏«weder … noch» خودش منفی است – «nicht» یا «kein» اضافه نکنید.",
        },
        "r": {"title": "Ärger im Team",
              "text": "In einer Pflegestation gibt es Streit: Einige Kolleginnen arbeiten fast jedes Wochenende, andere fast nie. Die Stimmung ist schlecht. "
                      "Die Stationsleiterin lädt zu einer Besprechung ein. Jeder darf sagen, was ihn stört. Am Ende finden sie eine Lösung: Ein neuer Plan verteilt die Wochenenden gerecht. "
                      "Wer einen Dienst tauschen möchte, spricht es nicht nur mit der Kollegin ab, sondern trägt es auch in eine Liste ein. Seitdem ist die Atmosphäre wieder besser.",
              "q": [["Worüber gibt es Streit?", ["über die Verteilung der Wochenenddienste", "über das Essen in der Kantine", "über das Gehalt"], 0],
                    ["Was macht die Stationsleiterin?", ["Sie lädt zu einer Besprechung ein.", "Sie kündigt einer Kollegin.", "Sie arbeitet selbst jedes Wochenende."], 0],
                    ["Was muss man machen, wenn man einen Dienst tauschen möchte?", ["mit der Kollegin sprechen und es in eine Liste eintragen", "nichts", "den Chef anrufen"], 0]]},
        "d": {"title": "In der Pause", "lines": [
            ["Tom", "Na, Hamed, wie war dein Wochenende?"], ["Hamed", "Schön, danke! Wir waren sowohl am See als auch bei Freunden. Und deins?"],
            ["Tom", "Ruhig. Sag mal, kannst du nächste Woche die Frühschicht am Mittwoch übernehmen? Ich habe einen Arzttermin."],
            ["Hamed", "Entweder Mittwoch oder Donnerstag – beides geht nicht, ich habe am Donnerstag selbst einen Termin."],
            ["Tom", "Nur Mittwoch, das reicht. Danke dir!"], ["Hamed", "Kein Problem. Dann trag es bitte in den Plan ein."]],
            "q": [["Wo war Hamed am Wochenende?", ["am See und bei Freunden", "nur zu Hause", "bei der Arbeit"], 0],
                  ["Warum braucht Tom Hilfe?", ["Er hat am Mittwoch einen Arzttermin.", "Er hat Urlaub.", "Er ist krank."], 0]]},
        "s": {"task": "In deinem Team gibt es ein Problem (z. B. Pausen, Ordnung in der Küche, Urlaubsplanung). Schreib eine E-Mail an deine Vorgesetzte: Beschreib das Problem und mach einen Lösungsvorschlag. Benutze zweiteilige Konnektoren. (8–10 Sätze)",
              "model": "Sehr geehrte Frau Krüger, ich möchte ein Problem in unserem Team ansprechen. In der Küche ist es oft sehr unordentlich. Es wird weder das Geschirr gespült noch der Müll weggebracht. Das ärgert nicht nur mich, sondern auch viele andere Kolleginnen und Kollegen. Ich schlage vor, dass wir einen Küchenplan machen. Jede Woche sind zwei Personen zuständig. Wir könnten das entweder in der nächsten Besprechung oder per E-Mail klären. Ich freue mich auf Ihre Antwort. Mit freundlichen Grüßen, Shabnam Rasuli"},
        "words": """
# Am Arbeitsplatz
die Schicht|die Schichten|shift|نوبت کاری
der Dienstplan|die Dienstpläne|duty roster|جدول کاری
übernehmen||to take over|به عهده گرفتن
tauschen||to swap|عوض کردن
die Stimmung||mood, atmosphere|حال و هوا، روحیه
die Atmosphäre||atmosphere|فضا
der Betriebsrat|die Betriebsräte|works council|شورای کارکنان
# Kommunikation im Team
absprechen||to agree on|هماهنگ کردن
ansprechen||to address (a topic)|مطرح کردن
stören||to bother, to disturb|مزاحم شدن، ناراحت کردن
gerecht||fair|عادلانه
die Kritik||criticism|انتقاد
das Lob||praise|تعریف، تمجید
sich beschweren||to complain|شکایت کردن
# Smalltalk
Wie war dein Wochenende?||How was your weekend?|آخر هفته‌ات چطور بود؟
Mahlzeit!||Enjoy your lunch! (greeting at lunchtime)|نوش جان! (سلام وقت غذا)
der Feierabend||end of the working day|پایان کار روزانه
Schönen Feierabend!||Have a nice evening!|عصر خوش!
""",
    },
    {
        "t": "Politik und Geschichte",
        "goals": "das politische System in Deutschland, Wahlen, Grundrechte, wichtige Daten der Geschichte; Passiv im Präteritum (wurde gegründet)",
        "w": [
            "die Politik||politics|سیاست",
            "die Demokratie|die Demokratien|democracy|دموکراسی",
            "das Grundgesetz||Basic Law (German constitution)|قانون اساسی آلمان",
            "das Grundrecht|die Grundrechte|basic right|حق اساسی",
            "die Wahl|die Wahlen|election|انتخابات",
            "wählen||to vote, to choose|رأی دادن؛ انتخاب کردن",
            "die Partei|die Parteien|political party|حزب",
            "der Bundestag||Federal Parliament|پارلمان فدرال",
            "die Regierung|die Regierungen|government|حکومت",
            "das Bundesland|die Bundesländer|federal state|ایالت",
            "die Geschichte|die Geschichten|history; story|تاریخ؛ داستان",
            "die Mauer|die Mauern|wall|دیوار",
            "die Wiedervereinigung||reunification|اتحاد دوباره",
            "gründen||to found|تأسیس کردن",
        ],
        "p": ["Das Grundgesetz wurde 1949 verabschiedet.", "Alle vier Jahre wird der Bundestag gewählt.", "In Deutschland gibt es 16 Bundesländer.",
              "Die Mauer fiel am 9. November 1989.", "Die Würde des Menschen ist unantastbar.", "Ich interessiere mich für Politik, weil …"],
        "g": {
            "title": "Passiv im Präteritum",
            "head": ["Aktiv", "Passiv Präteritum (wurde + Partizip II)"],
            "rows": [["Man gründete 1949 die Bundesrepublik.", "Die Bundesrepublik wurde 1949 gegründet."], ["Man baute 1961 die Mauer.", "Die Mauer wurde 1961 gebaut."],
                     ["Man öffnete 1989 die Grenze.", "Die Grenze wurde 1989 geöffnet."], ["Man wählte die Abgeordneten.", "Die Abgeordneten wurden gewählt."]],
            "de": "Passiv Präteritum: wurde/wurden + Partizip II am Ende. Man benutzt es oft in Texten über Geschichte. Wer es gemacht hat, steht – wenn wichtig – mit „von“.",
            "en": "Past passive: wurde/wurden + past participle at the end: 'Die Mauer wurde 1961 gebaut.' It is very common in texts about history, because the event matters more than the person. If you want to say who did it, use 'von' + dative: 'Das Gesetz wurde vom Bundestag beschlossen.'",
            "fa": "مجهول گذشته: wurde/wurden + Partizip II در آخر جمله: «Die Mauer wurde 1961 gebaut.» در متن‌های تاریخی زیاد استفاده می‌شود، چون رویداد مهم‌تر از انجام‌دهنده است. اگر بخواهید انجام‌دهنده را بگویید از «von» + Dativ استفاده کنید: «Das Gesetz wurde vom Bundestag beschlossen.»",
        },
        "r": {"title": "Kurze deutsche Geschichte seit 1945",
              "text": "Nach dem Zweiten Weltkrieg wurde Deutschland 1945 in vier Besatzungszonen geteilt. 1949 wurden zwei Staaten gegründet: die Bundesrepublik Deutschland im Westen und die DDR im Osten. "
                      "Am 23. Mai 1949 wurde in der Bundesrepublik das Grundgesetz verkündet. 1961 wurde in Berlin die Mauer gebaut. Am 9. November 1989 wurde die Grenze geöffnet – die Mauer fiel. "
                      "Am 3. Oktober 1990 wurde Deutschland wiedervereinigt. Dieser Tag ist heute ein Feiertag: der Tag der Deutschen Einheit.",
              "q": [["Wann wurden die zwei deutschen Staaten gegründet?", ["1949", "1945", "1961"], 0],
                    ["Was passierte am 9. November 1989?", ["Die Grenze wurde geöffnet.", "Die Mauer wurde gebaut.", "Das Grundgesetz wurde verkündet."], 0],
                    ["Warum ist der 3. Oktober ein Feiertag?", ["Deutschland wurde 1990 wiedervereinigt.", "Das Grundgesetz wurde geschrieben.", "Der Krieg endete."], 0]]},
        "d": {"title": "Darf ich wählen?", "lines": [
            ["Nasima", "Nächsten Monat ist Bundestagswahl. Darf ich eigentlich wählen?"],
            ["Herr Becker", "Bei der Bundestagswahl dürfen nur deutsche Staatsangehörige ab 18 Jahren wählen."],
            ["Nasima", "Und bei der Kommunalwahl?"],
            ["Herr Becker", "Da dürfen auch Bürgerinnen und Bürger aus anderen EU-Ländern wählen. Aber mit afghanischem Pass leider nicht."],
            ["Nasima", "Schade. Wenn ich eingebürgert bin, möchte ich unbedingt wählen."],
            ["Herr Becker", "Sie können sich aber schon jetzt engagieren, zum Beispiel im Integrationsbeirat Ihrer Stadt."]],
            "q": [["Wer darf bei der Bundestagswahl wählen?", ["deutsche Staatsangehörige ab 18 Jahren", "alle Menschen in Deutschland", "nur EU-Bürger"], 0],
                  ["Was kann Nasima schon jetzt machen?", ["sich im Integrationsbeirat engagieren", "bei der Bundestagswahl wählen", "eine Partei gründen"], 0]]},
        "s": {"task": "Welches Grundrecht ist für dich besonders wichtig und warum? Schreib einen Text. Erkläre auch, wie es in deinem Herkunftsland war oder ist. (8–10 Sätze)",
              "model": "Für mich ist die Meinungsfreiheit besonders wichtig. Sie steht in Artikel 5 des Grundgesetzes. In Deutschland darf ich sagen, was ich denke, auch wenn ich die Regierung kritisiere. In meinem Herkunftsland war das oft gefährlich. Viele Journalisten wurden verhaftet. Deshalb weiß ich, wie wertvoll dieses Recht ist. Meinungsfreiheit bedeutet aber auch, dass ich andere Meinungen respektiere. Beleidigungen und Hetze sind nicht erlaubt. Ich finde, eine Demokratie braucht Menschen, die mitdiskutieren."},
        "words": """
# Staat und Politik
der Bundeskanzler|die Bundeskanzler|Federal Chancellor|صدراعظم فدرال
der Bundespräsident|die Bundespräsidenten|Federal President|رئیس جمهور فدرال
der Abgeordnete|die Abgeordneten|member of parliament|وکیل پارلمان
die Kommunalwahl|die Kommunalwahlen|local election|انتخابات محلی
die Bundestagswahl|die Bundestagswahlen|general election|انتخابات پارلمان فدرال
das Wahlrecht||right to vote|حق رأی
die Meinungsfreiheit||freedom of expression|آزادی بیان
die Religionsfreiheit||freedom of religion|آزادی دین
die Gleichberechtigung||equal rights|حقوق برابر
der Rechtsstaat||state under the rule of law|دولت قانون‌مدار
# Geschichte
der Weltkrieg|die Weltkriege|world war|جنگ جهانی
die DDR||GDR (East Germany)|آلمان شرقی
die Grenze|die Grenzen|border|سرحد، مرز
die Diktatur|die Diktaturen|dictatorship|دیکتاتوری
in Kraft treten||to come into force|نافذ شدن
# Mitmachen
sich engagieren||to get involved|فعالیت کردن (اجتماعی)
der Integrationsbeirat|die Integrationsbeiräte|integration advisory council|شورای مشورتی ادغام
die Demonstration|die Demonstrationen|demonstration|تظاهرات
die Einbürgerung|die Einbürgerungen|naturalisation|گرفتن تابعیت
""",
    },
]
