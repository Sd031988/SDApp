/* Steuer-Helfer: Orientierung in weiteren Sprachen (Überschriften, Knöpfe, kurze Erklärungen).
   Eingabefelder, Fachbegriffe, Zusammenfassung für ELSTER und Formulare bleiben bewusst deutsch.
   Spalten: en, fa, ar, ur, uk, ti. Noch nicht von Muttersprachlern oder Steuerfachleuten geprüft. */
(function () {
  const SPR = ['en', 'fa', 'ar', 'ur', 'uk', 'ti'];
  const NAMEN = { de: 'Deutsch', en: 'English', fa: 'دری', ar: 'العربية', ur: 'اردو', uk: 'Українська', ti: 'ትግርኛ' };
  let lang = 'de';
  try { lang = localStorage.getItem('sdSprache') || 'de'; } catch (e) { /* ohne Speicher */ }
  if (lang !== 'de' && !SPR.includes(lang)) lang = 'de';
  window.SD_LANG = lang;
  const col = SPR.indexOf(lang);
  const RTL = ['fa', 'ar', 'ur'];

  const HINWEIS = ['Headings and buttons are translated. Input fields and tax terms stay in German because that is how they appear in ELSTER and on the forms.', 'عنوان‌ها و دکمه‌ها ترجمه شده‌اند. فیلدها و اصطلاحات مالیاتی به آلمانی می‌مانند، چون در ELSTER و فرم‌ها همین‌طور نوشته شده‌اند.', 'العناوين والأزرار مترجمة. حقول الإدخال والمصطلحات الضريبية تبقى بالألمانية لأنها هكذا في ELSTER والاستمارات.', 'عنوانات اور بٹن ترجمہ شدہ ہیں۔ خانے اور ٹیکس کی اصطلاحات جرمن میں رہتی ہیں کیونکہ ELSTER اور فارموں میں یہی ہیں۔', 'Заголовки й кнопки перекладено. Поля й податкові терміни залишаються німецькою, бо так вони виглядають в ELSTER і на формулярах.', 'ኣርእስትታትን መጠወቕታትን ተተርጒሞም። ቦታታት ምእታውን ቃላት ግብርን ብጀርመን ይተርፉ፣ ምኽንያቱ ኣብ ELSTER ን ቅጥዕታትን ከምኡ ስለ ዝጽሓፉ።'];

  const W = {
    'Steuer-Helfer': ['Tax helper', 'کمک مالیاتی', 'مساعد الضرائب', 'ٹیکس معاون', 'Податковий помічник', 'ሓጋዚ ግብሪ'],
    'Hilfe zum Ausfüllen – Abgabe in Mein ELSTER': ['Help with filling in – submit in Mein ELSTER', 'کمک برای پر کردن – تحویل در Mein ELSTER', 'مساعدة في التعبئة – التقديم عبر Mein ELSTER', 'بھرنے میں مدد – جمع Mein ELSTER میں', 'Допомога із заповненням — подання в Mein ELSTER', 'ሓገዝ ንምምላእ – ምቕራብ ኣብ Mein ELSTER'],
    'Zur Übersicht': ['To the overview', 'به نمای کلی', 'إلى النظرة العامة', 'جائزے پر', 'До огляду', 'ናብ ሓፈሻዊ ትርኢት'],
    'Steuerjahr': ['Tax year', 'سال مالیاتی', 'السنة الضريبية', 'ٹیکس سال', 'Податковий рік', 'ዓመት ግብሪ'],
    'So wurde gerechnet': ['How it was calculated', 'این‌طور حساب شد', 'هكذا تم الحساب', 'ایسے حساب لگایا گیا', 'Як розраховано', 'ከምዚ ተሓሲቡ'],
    'Details': ['Details', 'جزئیات', 'التفاصيل', 'تفصیلات', 'Подробиці', 'ዝርዝር'],
    '👤 Deine Angaben': ['👤 Your details', '👤 اطلاعات تو', '👤 بياناتك', '👤 آپ کی معلومات', '👤 Ваші дані', '👤 ሓበሬታኻ'],
    'Allein oder gemeinsam, Bundesland, Kirche, Lohnersatz': ['Single or joint, federal state, church, wage replacement benefits', 'تنها یا مشترک، ایالت، کلیسا، جایگزین دستمزد', 'منفرد أو مشترك، الولاية، الكنيسة، بدائل الأجر', 'اکیلے یا مشترکہ، صوبہ، چرچ، اجرت کا متبادل', 'Окремо чи спільно, земля, церква, замінники зарплати', 'በይንኻ ወይ ብሓባር፣ ክፍለ-ሃገር፣ ቤተ-ክርስትያን፣ ተካኢ ደሞዝ'],
    '🧾 Lohnsteuerbescheinigung': ['🧾 Lohnsteuerbescheinigung (annual wage tax statement)', '🧾 Lohnsteuerbescheinigung (گواهی مالیات حقوق)', '🧾 Lohnsteuerbescheinigung (شهادة ضريبة الأجور)', '🧾 Lohnsteuerbescheinigung (تنخواہ ٹیکس سرٹیفکیٹ)', '🧾 Lohnsteuerbescheinigung (довідка про податок із зарплати)', '🧾 Lohnsteuerbescheinigung (ምስክር ወረቐት ግብሪ ደሞዝ)'],
    'Bekommst du vom Arbeitgeber – Foto/PDF genügt': ['You get it from your employer – a photo/PDF is enough', 'از کارفرما می‌گیری – عکس/PDF کافی است', 'تحصل عليها من صاحب العمل – تكفي صورة/PDF', 'آجر سے ملتا ہے – تصویر/PDF کافی ہے', 'Отримуєте від роботодавця — достатньо фото/PDF', 'ካብ ወሃቢ ስራሕ ትረኽቦ – ስእሊ/PDF ይኣክል'],
    '📷 Fotografieren / PDF wählen': ['📷 Take photo / choose PDF', '📷 عکس گرفتن / انتخاب PDF', '📷 تصوير / اختيار PDF', '📷 تصویر لیں / PDF منتخب کریں', '📷 Сфотографувати / вибрати PDF', '📷 ስእሊ ኣልዕል / PDF ምረጽ'],
    '🏛️ Pension / Versorgungsbezüge (Beamte, Werkspension)': ['🏛️ Pension / Versorgungsbezüge (civil servants, company pension)', '🏛️ Pension / Versorgungsbezüge (کارمندان دولت، بازنشستگی شرکت)', '🏛️ Pension / Versorgungsbezüge (موظفو الدولة، معاش الشركة)', '🏛️ Pension / Versorgungsbezüge (سرکاری ملازمین، کمپنی پنشن)', '🏛️ Pension / Versorgungsbezüge (держслужбовці, пенсія від підприємства)', '🏛️ Pension / Versorgungsbezüge (ሰራሕተኛታት መንግስቲ፣ ጡረታ ትካል)'],
    '👥 Lohnsteuerbescheinigung Partner/in': ['👥 Lohnsteuerbescheinigung of your partner', '👥 Lohnsteuerbescheinigung همسر', '👥 Lohnsteuerbescheinigung للشريك/الشريكة', '👥 شریکِ حیات کا Lohnsteuerbescheinigung', '👥 Lohnsteuerbescheinigung партнера/партнерки', '👥 Lohnsteuerbescheinigung ናይ በዓል/ቲ ቤት'],
    '💡 Pauschalen – Geld ohne viele Belege': ['💡 Flat rates – money without many receipts', '💡 مبالغ ثابت – پول بدون رسیدهای زیاد', '💡 مبالغ مقطوعة – مال دون إيصالات كثيرة', '💡 مقررہ رقمیں – بغیر زیادہ رسیدوں کے پیسہ', '💡 Паушальні суми — гроші без багатьох чеків', '💡 ቀወምቲ መጠናት – ብዘይ ብዙሕ ቅብሊት ገንዘብ'],
    'Feste Beträge, die das Finanzamt ansetzt – kurz erklärt': ['Fixed amounts the tax office applies – briefly explained', 'مبالغ ثابتی که اداره مالیات حساب می‌کند – کوتاه توضیح', 'مبالغ ثابتة يعتمدها مكتب الضرائب – شرح مختصر', 'مقررہ رقمیں جو ٹیکس دفتر لگاتا ہے – مختصر وضاحت', 'Фіксовані суми, які враховує податкова — коротко', 'ቤት-ጽሕፈት ግብሪ ዝሕስቦም ቀወምቲ መጠናት – ብሓጺሩ'],
    'ℹ️ Was ist das?': ['ℹ️ What is this?', 'ℹ️ این چیست؟', 'ℹ️ ما هذا؟', 'ℹ️ یہ کیا ہے؟', 'ℹ️ Що це?', 'ℹ️ እዚ እንታይ እዩ?'],
    '👴 Renten (Anlage R)': ['👴 Pensions (Anlage R)', '👴 بازنشستگی (Anlage R)', '👴 المعاشات (Anlage R)', '👴 پنشن (Anlage R)', '👴 Пенсії (Anlage R)', '👴 ጡረታ (Anlage R)'],
    'Gesetzliche Rente, Betriebsrente, Riester, private Rente': ['Statutory pension, company pension, Riester, private pension', 'بازنشستگی دولتی، بازنشستگی شرکت، Riester، بازنشستگی خصوصی', 'المعاش القانوني، معاش الشركة، Riester، المعاش الخاص', 'سرکاری پنشن، کمپنی پنشن، Riester، نجی پنشن', 'Державна, корпоративна пенсія, Riester, приватна пенсія', 'ሕጋዊ ጡረታ፣ ጡረታ ትካል፣ Riester፣ ብሕታዊ ጡረታ'],
    '＋ Rente': ['＋ Pension', '＋ بازنشستگی', '＋ معاش', '＋ پنشن', '＋ Пенсія', '＋ ጡረታ'],
    '📈 Kapitalerträge (Anlage KAP)': ['📈 Investment income (Anlage KAP)', '📈 درآمد سرمایه (Anlage KAP)', '📈 عوائد رأس المال (Anlage KAP)', '📈 سرمایہ کی آمدنی (Anlage KAP)', '📈 Доходи від капіталу (Anlage KAP)', '📈 እቶት ርእሰ-ማል (Anlage KAP)'],
    'Zinsen, Dividenden, Fonds – Jahressteuerbescheinigung der Bank': ['Interest, dividends, funds – annual tax statement from the bank', 'سود، سود سهام، صندوق‌ها – گواهی سالانه مالیات بانک', 'فوائد، أرباح، صناديق – الشهادة الضريبية السنوية من البنك', 'سود، منافع، فنڈز – بینک کا سالانہ ٹیکس سرٹیفکیٹ', 'Відсотки, дивіденди, фонди — річна податкова довідка банку', 'ወለድ፣ ኣታዊ ኣክስዮን፣ ፈንድታት – ዓመታዊ ምስክር ወረቐት ግብሪ ባንኪ'],
    '📊 Aktienverkäufe, Verluste und ausländische Quellensteuer': ['📊 Share sales, losses and foreign withholding tax', '📊 فروش سهام، زیان‌ها و مالیات خارجی', '📊 بيع الأسهم والخسائر وضريبة المنبع الأجنبية', '📊 حصص کی فروخت، نقصان اور غیر ملکی ٹیکس', '📊 Продаж акцій, збитки й іноземний податок', '📊 መሸጣ ኣክስዮን፣ ክሳራን ናይ ወጻኢ ግብርን'],
    '🏠 Vermietung (Anlage V)': ['🏠 Renting out (Anlage V)', '🏠 اجاره دادن (Anlage V)', '🏠 التأجير (Anlage V)', '🏠 کرایہ پر دینا (Anlage V)', '🏠 Здавання в оренду (Anlage V)', '🏠 ምክራይ (Anlage V)'],
    'Wohnung oder Haus vermietet – Einnahmen und Kosten': ['Flat or house rented out – income and costs', 'خانه یا آپارتمان اجاره داده شده – درآمد و هزینه', 'شقة أو منزل مؤجر – الإيرادات والتكاليف', 'فلیٹ یا گھر کرایہ پر – آمدنی اور اخراجات', 'Квартира чи будинок в оренді — доходи й витрати', 'ዝተኻረየ ገዛ – እቶትን ወጻኢን'],
    '＋ Wohnung / Haus': ['＋ Flat / house', '＋ آپارتمان / خانه', '＋ شقة / منزل', '＋ فلیٹ / گھر', '＋ Квартира / будинок', '＋ ገዛ'],
    '💼 Selbstständig & Gewerbe (Anlage S/G, EÜR)': ['💼 Self-employed & business (Anlage S/G, EÜR)', '💼 خوداشتغالی و کسب‌وکار (Anlage S/G، EÜR)', '💼 العمل الحر والتجارة (Anlage S/G، EÜR)', '💼 خود روزگار اور کاروبار (Anlage S/G، EÜR)', '💼 Самозайнятість і бізнес (Anlage S/G, EÜR)', '💼 ናይ ባዕልኻ ስራሕን ንግድን (Anlage S/G፣ EÜR)'],
    'Freiberuflich oder Gewerbe – Gewinn, Gewerbesteuer': ['Freelance or business – profit, trade tax', 'آزاد یا کسب‌وکار – سود، مالیات صنفی', 'مهنة حرة أو تجارة – الربح، ضريبة النشاط التجاري', 'آزاد پیشہ یا کاروبار – منافع، تجارتی ٹیکس', 'Вільна професія чи бізнес — прибуток, промисловий податок', 'ነጻ ሞያ ወይ ንግዲ – ረብሓ፣ ግብሪ ንግዲ'],
    '＋ Tätigkeit': ['＋ Activity', '＋ فعالیت', '＋ نشاط', '＋ سرگرمی', '＋ Діяльність', '＋ ንጥፈት'],
    '🌍 Ausland & private Verkäufe': ['🌍 Abroad & private sales', '🌍 خارج و فروش خصوصی', '🌍 الخارج والمبيعات الخاصة', '🌍 بیرون ملک اور نجی فروخت', '🌍 Закордон і приватні продажі', '🌍 ወጻኢን ብሕታዊ መሸጣን'],
    'Einkünfte aus dem Ausland, Krypto, Gold, Immobilie innerhalb der Frist': ['Foreign income, crypto, gold, property within the holding period', 'درآمد خارجی، رمزارز، طلا، ملک در مهلت', 'دخل من الخارج، عملات مشفرة، ذهب، عقار ضمن المهلة', 'غیر ملکی آمدنی، کرپٹو، سونا، مدت کے اندر جائیداد', 'Іноземні доходи, крипто, золото, нерухомість у межах строку', 'እቶት ካብ ወጻኢ፣ ክሪፕቶ፣ ወርቂ፣ ንብረት ኣብ ውሽጢ ግዜ'],
    '🌍 Einkünfte aus dem Ausland': ['🌍 Foreign income', '🌍 درآمد از خارج', '🌍 الدخل من الخارج', '🌍 بیرون ملک سے آمدنی', '🌍 Доходи з-за кордону', '🌍 እቶት ካብ ወጻኢ'],
    '🪙 Private Verkäufe (§ 23 EStG)': ['🪙 Private sales (§ 23 EStG)', '🪙 فروش خصوصی (§ 23 EStG)', '🪙 المبيعات الخاصة (§ 23 EStG)', '🪙 نجی فروخت (§ 23 EStG)', '🪙 Приватні продажі (§ 23 EStG)', '🪙 ብሕታዊ መሸጣ (§ 23 EStG)'],
    '📉 Verlustvortrag & Vorauszahlungen': ['📉 Loss carryforward & advance payments', '📉 انتقال زیان و پیش‌پرداخت', '📉 ترحيل الخسائر والدفعات المسبقة', '📉 نقصان آگے لے جانا اور پیشگی ادائیگیاں', '📉 Перенесення збитків і авансові платежі', '📉 ዝተሰጋገረ ክሳራን ቅድመ-ክፍሊትን'],
    'Verluste aus Vorjahren, schon gezahlte Einkommensteuer': ['Losses from previous years, income tax already paid', 'زیان سال‌های قبل، مالیات بر درآمد پرداخت‌شده', 'خسائر السنوات السابقة، ضريبة الدخل المدفوعة', 'پچھلے سالوں کے نقصان، ادا شدہ انکم ٹیکس', 'Збитки минулих років, уже сплачений податок', 'ክሳራ ካብ ዝሓለፉ ዓመታት፣ ዝተኸፍለ ግብሪ እቶት'],
    '💼 Anlage N – Werbungskosten': ['💼 Anlage N – work-related expenses', '💼 Anlage N – هزینه‌های شغلی', '💼 Anlage N – نفقات العمل', '💼 Anlage N – کام سے متعلق اخراجات', '💼 Anlage N — витрати, пов’язані з роботою', '💼 Anlage N – ወጻኢታት ስራሕ'],
    'Arbeitsweg, Homeoffice, Arbeitsmittel, Bewerbungen …': ['Commute, home office, work equipment, applications …', 'مسیر کار، کار در خانه، ابزار کار، درخواست کار …', 'طريق العمل، العمل من المنزل، أدوات العمل، طلبات التوظيف …', 'کام کا راستہ، گھر سے کام، کام کا سامان، درخواستیں …', 'Дорога, домашній офіс, робочі засоби, заявки …', 'መገዲ ስራሕ፣ ካብ ገዛ ምስራሕ፣ መሳርሒ ስራሕ፣ ሕቶታት ስራሕ …'],
    '🚗 Arbeitsweg (Entfernungspauschale)': ['🚗 Commute (Entfernungspauschale)', '🚗 مسیر کار (Entfernungspauschale)', '🚗 طريق العمل (Entfernungspauschale)', '🚗 کام کا راستہ (Entfernungspauschale)', '🚗 Дорога на роботу (Entfernungspauschale)', '🚗 መገዲ ስራሕ (Entfernungspauschale)'],
    '🏠 Homeoffice': ['🏠 Home office', '🏠 کار در خانه', '🏠 العمل من المنزل', '🏠 گھر سے کام', '🏠 Домашній офіс', '🏠 ካብ ገዛ ምስራሕ'],
    '🖥️ Arbeitsmittel': ['🖥️ Work equipment', '🖥️ ابزار کار', '🖥️ أدوات العمل', '🖥️ کام کا سامان', '🖥️ Робочі засоби', '🖥️ መሳርሒ ስራሕ'],
    '＋ Arbeitsmittel': ['＋ Work equipment', '＋ ابزار کار', '＋ أداة عمل', '＋ کام کا سامان', '＋ Робочий засіб', '＋ መሳርሒ ስራሕ'],
    '📨 Bewerbungskosten': ['📨 Application costs', '📨 هزینه درخواست کار', '📨 تكاليف التقديم', '📨 درخواست کے اخراجات', '📨 Витрати на заявки', '📨 ወጻኢ ሕቶ ስራሕ'],
    '＋ Bewerbungskosten': ['＋ Application costs', '＋ هزینه درخواست کار', '＋ تكاليف تقديم', '＋ درخواست کے اخراجات', '＋ Витрати на заявку', '＋ ወጻኢ ሕቶ ስራሕ'],
    '＋ Fahrt zum Vorstellungsgespräch': ['＋ Trip to a job interview', '＋ رفتن به مصاحبه کاری', '＋ رحلة إلى مقابلة عمل', '＋ انٹرویو کا سفر', '＋ Поїздка на співбесіду', '＋ ጉዕዞ ናብ ቃለ-መሕትት'],
    '🎓 Fortbildung & Sonstiges': ['🎓 Training & other', '🎓 آموزش و موارد دیگر', '🎓 التدريب وغير ذلك', '🎓 تربیت اور دیگر', '🎓 Навчання та інше', '🎓 ስልጠናን ካልእን'],
    '＋ Fortbildung': ['＋ Training', '＋ آموزش', '＋ تدريب', '＋ تربیت', '＋ Навчання', '＋ ስልጠና'],
    '＋ Sonstige Werbungskosten': ['＋ Other work-related expenses', '＋ هزینه‌های شغلی دیگر', '＋ نفقات عمل أخرى', '＋ دیگر کام کے اخراجات', '＋ Інші витрати', '＋ ካልእ ወጻኢ ስራሕ'],
    '👶 Kinder': ['👶 Children', '👶 فرزندان', '👶 الأطفال', '👶 بچے', '👶 Діти', '👶 ቆልዑ'],
    'Kindergeld oder Kinderfreibetrag, Kita, Tagesmutter, Hort': ['Child benefit or child allowance, daycare, childminder, after-school care', 'کمک‌هزینه فرزند یا معافیت فرزند، مهدکودک، پرستار، مراقبت بعد از مدرسه', 'إعانة الأطفال أو إعفاء الأطفال، الحضانة، المربية، الرعاية بعد المدرسة', 'بچوں کا الاؤنس یا چھوٹ، ڈے کیئر، نگہداشت، اسکول کے بعد کی دیکھ بھال', 'Допомога чи пільга на дітей, садок, няня, продовжена група', 'ገንዘብ ቆልዑ ወይ ናጽነት ግብሪ ቆልዑ፣ መዋእለ-ህጻናት፣ ተኣላዪት'],
    '＋ Kind': ['＋ Child', '＋ فرزند', '＋ طفل', '＋ بچہ', '＋ Дитина', '＋ ቆልዓ'],
    '🎁 Anlage Sonderausgaben – Spenden': ['🎁 Anlage Sonderausgaben – donations', '🎁 Anlage Sonderausgaben – کمک‌های خیریه', '🎁 Anlage Sonderausgaben – التبرعات', '🎁 Anlage Sonderausgaben – عطیات', '🎁 Anlage Sonderausgaben — пожертви', '🎁 Anlage Sonderausgaben – ወፈያታት'],
    'Spenden und Mitgliedsbeiträge an gemeinnützige Organisationen': ['Donations and membership fees to non-profit organizations', 'کمک و حق عضویت به سازمان‌های عام‌المنفعه', 'تبرعات ورسوم عضوية لمنظمات غير ربحية', 'غیر منافع بخش تنظیموں کو عطیات اور رکنیت فیس', 'Пожертви й членські внески неприбутковим організаціям', 'ወፈያን ክፍሊት ኣባልነትን ንዘይረብሓዊ ትካላት'],
    '＋ Spende': ['＋ Donation', '＋ کمک', '＋ تبرع', '＋ عطیہ', '＋ Пожертва', '＋ ወፈያ'],
    '🧹 Haushaltsnahe Aufwendungen': ['🧹 Household-related expenses', '🧹 هزینه‌های مربوط به خانه', '🧹 نفقات منزلية', '🧹 گھریلو اخراجات', '🧹 Побутові витрати', '🧹 ወጻኢታት ገዛ'],
    'Putzhilfe, Gärtner, Handwerker, Nebenkosten': ['Cleaner, gardener, tradespeople, service charges', 'نظافتچی، باغبان، صنعتگر، هزینه‌های جانبی', 'عامل نظافة، بستاني، حرفيون، تكاليف إضافية', 'صفائی، مالی، کاریگر، اضافی اخراجات', 'Прибирання, садівник, майстри, комунальні', 'ኣጽራዪት፣ ኣላዪ ጀርዲን፣ ሞያውያን፣ ተወሰኽቲ ወጻኢታት'],
    'Haushaltsnahe Dienstleistungen': ['Household services', 'خدمات خانگی', 'خدمات منزلية', 'گھریلو خدمات', 'Побутові послуги', 'ኣገልግሎታት ገዛ'],
    '＋ Dienstleistung': ['＋ Service', '＋ خدمت', '＋ خدمة', '＋ خدمت', '＋ Послуга', '＋ ኣገልግሎት'],
    'Handwerkerleistungen': ['Tradespeople services', 'خدمات صنعتگران', 'خدمات الحرفيين', 'کاریگروں کی خدمات', 'Послуги майстрів', 'ኣገልግሎት ሞያውያን'],
    '＋ Handwerker': ['＋ Tradesperson', '＋ صنعتگر', '＋ حرفي', '＋ کاریگر', '＋ Майстер', '＋ ሞያዊ'],
    '🩺 Außergewöhnliche Belastungen – Krankheitskosten': ['🩺 Extraordinary burdens – medical costs', '🩺 هزینه‌های فوق‌العاده – هزینه درمان', '🩺 أعباء استثنائية – تكاليف العلاج', '🩺 غیر معمولی بوجھ – علاج کے اخراجات', '🩺 Надзвичайні витрати — лікування', '🩺 ፍሉይ ጾር – ወጻኢ ሕክምና'],
    'Zuzahlungen, Brille, Zahnersatz, Medikamente mit Rezept': ['Co-payments, glasses, dentures, prescription medicines', 'سهم پرداختی، عینک، دندان مصنوعی، داروی نسخه‌ای', 'المساهمات، النظارات، الأسنان الاصطناعية، أدوية بوصفة', 'اضافی ادائیگیاں، عینک، مصنوعی دانت، نسخے والی دوائیں', 'Доплати, окуляри, зубопротезування, ліки за рецептом', 'ተወሳኺ ክፍሊት፣ መነጽር፣ ስኒ፣ ብ ረቸታ ዝውሰድ መድሃኒት'],
    '＋ Krankheitskosten': ['＋ Medical costs', '＋ هزینه درمان', '＋ تكاليف علاج', '＋ علاج کے اخراجات', '＋ Витрати на лікування', '＋ ወጻኢ ሕክምና'],
    '📷 Beleg fotografieren & einordnen': ['📷 Photograph & sort a receipt', '📷 عکس گرفتن و دسته‌بندی رسید', '📷 تصوير الإيصال وتصنيفه', '📷 رسید کی تصویر لیں اور ترتیب دیں', '📷 Сфотографувати й розподілити чек', '📷 ቅብሊት ኣልዕልን ኣሰርዕን'],
    'Quittung oder Rechnung – die KI liest Betrag, Datum und Art': ['Receipt or invoice – the AI reads amount, date and type', 'رسید یا فاکتور – هوش مصنوعی مبلغ، تاریخ و نوع را می‌خواند', 'إيصال أو فاتورة – يقرأ الذكاء الاصطناعي المبلغ والتاريخ والنوع', 'رسید یا بل – AI رقم، تاریخ اور قسم پڑھتا ہے', 'Чек чи рахунок — ШІ зчитує суму, дату й тип', 'ቅብሊት ወይ ቢል – AI መጠን፣ ዕለትን ዓይነትን የንብብ'],
    '📷 Beleg erfassen': ['📷 Capture receipt', '📷 ثبت رسید', '📷 تسجيل إيصال', '📷 رسید درج کریں', '📷 Додати чек', '📷 ቅብሊት መዝግብ'],
    '📋 Zusammenfassung für Mein ELSTER': ['📋 Summary for Mein ELSTER', '📋 خلاصه برای Mein ELSTER', '📋 ملخص لـ Mein ELSTER', '📋 Mein ELSTER کے لیے خلاصہ', '📋 Підсумок для Mein ELSTER', '📋 ጽማቕ ን Mein ELSTER'],
    'Diese Beträge überträgst du in deine Steuererklärung': ['You transfer these amounts into your tax return', 'این مبالغ را به اظهارنامه مالیاتی‌ات منتقل می‌کنی', 'تنقل هذه المبالغ إلى إقرارك الضريبي', 'یہ رقمیں آپ اپنے ٹیکس گوشوارے میں منتقل کرتے ہیں', 'Ці суми ви переносите в декларацію', 'እዞም መጠናት ናብ መግለጺ ግብርኻ ተሰጋግሮም'],
    '📄 Als PDF speichern': ['📄 Save as PDF', '📄 ذخیره به PDF', '📄 حفظ كـ PDF', '📄 PDF میں محفوظ کریں', '📄 Зберегти як PDF', '📄 ከም PDF ዓቅብ'],
    '🖨️ Auf Papier abgeben – Formulare ausfüllen': ['🖨️ Submit on paper – fill in forms', '🖨️ تحویل کاغذی – پر کردن فرم‌ها', '🖨️ التقديم ورقياً – تعبئة الاستمارات', '🖨️ کاغذ پر جمع – فارم بھریں', '🖨️ Подати на папері — заповнити формуляри', '🖨️ ብወረቐት ምቕራብ – ቅጥዕታት ምምላእ'],
    'Hauptvordruck und Anlagen automatisch ausfüllen, ausdrucken, unterschreiben': ['Fill in the main form and annexes automatically, print, sign', 'فرم اصلی و پیوست‌ها را خودکار پر کن، چاپ کن، امضا کن', 'تعبئة الاستمارة الرئيسية والملاحق تلقائياً، طباعتها، توقيعها', 'مرکزی فارم اور ضمیمے خود بھریں، پرنٹ کریں، دستخط کریں', 'Автоматично заповнити основну форму й додатки, надрукувати, підписати', 'ቀንዲ ቅጥዕን ተወሰኽቲን ባዕሉ ምላእ፣ ሕተም፣ ፈርም'],
    'Deine Angaben für das Formular': ['Your details for the form', 'اطلاعات تو برای فرم', 'بياناتك للاستمارة', 'فارم کے لیے آپ کی معلومات', 'Ваші дані для формуляра', 'ሓበሬታኻ ንቅጥዒ'],
    '👥 Partner/in': ['👥 Partner', '👥 همسر', '👥 الشريك/الشريكة', '👥 شریکِ حیات', '👥 Партнер/ка', '👥 በዓል/ቲ ቤት'],
    '💼 Für die Anlage N': ['💼 For Anlage N', '💼 برای Anlage N', '💼 لـ Anlage N', '💼 Anlage N کے لیے', '💼 Для Anlage N', '💼 ን Anlage N'],
    '📄 Formular-PDFs wählen und ausfüllen': ['📄 Choose and fill in form PDFs', '📄 انتخاب و پر کردن PDF فرم‌ها', '📄 اختيار ملفات PDF للاستمارات وتعبئتها', '📄 فارم PDF منتخب کریں اور بھریں', '📄 Вибрати й заповнити PDF-формуляри', '📄 PDF ቅጥዕታት ምረጽን ምላእን'],
    '💾 Daten sichern & löschen': ['💾 Back up & delete data', '💾 پشتیبان‌گیری و حذف داده‌ها', '💾 نسخ احتياطي وحذف البيانات', '💾 ڈیٹا کا بیک اپ اور حذف', '💾 Резервна копія й видалення', '💾 ሓበሬታ ዓቅብን ደምስስን'],
    'Alles bleibt auf diesem Gerät': ['Everything stays on this device', 'همه‌چیز روی همین دستگاه می‌ماند', 'يبقى كل شيء على هذا الجهاز', 'سب کچھ اسی آلے پر رہتا ہے', 'Усе залишається на цьому пристрої', 'ኩሉ ኣብዚ መሳርሒ ይተርፍ'],
    '⬇️ Sicherung herunterladen': ['⬇️ Download backup', '⬇️ دانلود پشتیبان', '⬇️ تنزيل النسخة الاحتياطية', '⬇️ بیک اپ ڈاؤن لوڈ کریں', '⬇️ Завантажити копію', '⬇️ ቅዳሕ ኣውርድ'],
    '⬆️ Sicherung laden': ['⬆️ Load backup', '⬆️ بارگذاری پشتیبان', '⬆️ تحميل نسخة احتياطية', '⬆️ بیک اپ لوڈ کریں', '⬆️ Відновити з копії', '⬆️ ቅዳሕ ጽዓን'],
    '🗑️ Dieses Jahr löschen': ['🗑️ Delete this year', '🗑️ حذف این سال', '🗑️ حذف هذه السنة', '🗑️ یہ سال حذف کریں', '🗑️ Видалити цей рік', '🗑️ እዚ ዓመት ደምስስ'],
    'Steuerfrei nach Doppelbesteuerungsabkommen (z. B. Lohn für Arbeit im Ausland): in Deutschland steuerfrei, erhöht aber den Steuersatz. Steuerpflichtige Auslandseinkünfte: die im Ausland gezahlte Steuer wird angerechnet.': ['Tax-free under a double taxation agreement (e.g. wages for work abroad): tax-free in Germany, but raises your tax rate. Taxable foreign income: tax paid abroad is credited.', 'معاف طبق قرارداد اجتناب از مالیات مضاعف (مثلاً حقوق کار در خارج): در آلمان معاف است اما نرخ مالیات را بالا می‌برد. درآمد خارجی مشمول مالیات: مالیات پرداخت‌شده در خارج حساب می‌شود.', 'معفى بموجب اتفاقية الازدواج الضريبي (مثلاً أجر العمل في الخارج): معفى في ألمانيا لكنه يرفع نسبة الضريبة. الدخل الأجنبي الخاضع للضريبة: تُحتسب الضريبة المدفوعة في الخارج.', 'دوہرے ٹیکس کے معاہدے کے تحت ٹیکس سے پاک (مثلاً بیرون ملک کام کی تنخواہ): جرمنی میں ٹیکس سے پاک، لیکن ٹیکس کی شرح بڑھاتی ہے۔ قابل ٹیکس غیر ملکی آمدنی: بیرون ملک ادا شدہ ٹیکس شمار ہوتا ہے۔', 'Звільнено за угодою про уникнення подвійного оподаткування (напр. зарплата за роботу за кордоном): у Німеччині не оподатковується, але підвищує ставку. Оподатковувані іноземні доходи: сплачений за кордоном податок зараховується.', 'ብስምምዕ ክልተ ግዜ ግብሪ ነጻ (ንኣብነት ደሞዝ ስራሕ ኣብ ወጻኢ): ኣብ ጀርመን ነጻ፣ ግን ደረጃ ግብሪ የልዕል። ግብሪ ዝኽፈለሉ እቶት ወጻኢ: ኣብ ወጻኢ ዝተኸፍለ ግብሪ ይሕሰብ።'],
    'Steuerpflichtig: Krypto, Gold, Wertgegenstände innerhalb von 1 Jahr nach dem Kauf verkauft; Immobilien innerhalb von 10 Jahren (nicht, wenn selbst bewohnt). Gewinne unter 1.000 € pro Person und Jahr bleiben steuerfrei (Freigrenze: ab 1.000 € ist alles steuerpflichtig). Verluste nur mit solchen Gewinnen verrechenbar.': ['Taxable: crypto, gold, valuables sold within 1 year of purchase; property within 10 years (not if you lived in it yourself). Gains under €1,000 per person per year stay tax-free (exemption limit: from €1,000 everything is taxable). Losses can only be offset against such gains.', 'مشمول مالیات: رمزارز، طلا، اشیای قیمتی که کمتر از ۱ سال بعد از خرید فروخته شوند؛ ملک کمتر از ۱۰ سال (نه اگر خودت در آن زندگی کرده‌ای). سود کمتر از ۱٬۰۰۰ یورو برای هر نفر در سال معاف است (سقف: از ۱٬۰۰۰ یورو همه‌اش مشمول است). زیان فقط با همین نوع سود جبران می‌شود.', 'خاضع للضريبة: العملات المشفرة والذهب والمقتنيات الثمينة المبيعة خلال سنة من الشراء؛ العقارات خلال 10 سنوات (إلا إذا سكنتها بنفسك). الأرباح دون 1.000 € للشخص سنوياً معفاة (الحد: من 1.000 € يخضع الكل للضريبة). الخسائر تُقاص فقط مع أرباح مماثلة.', 'قابل ٹیکس: کرپٹو، سونا، قیمتی اشیاء جو خریداری کے 1 سال کے اندر بیچی جائیں؛ جائیداد 10 سال کے اندر (اگر خود نہ رہے ہوں)۔ فی شخص سالانہ 1.000 € سے کم منافع ٹیکس سے پاک (حد: 1.000 € سے سب قابل ٹیکس)۔ نقصان صرف ایسے منافع سے پورا کیا جا سکتا ہے۔', 'Оподатковується: крипто, золото, цінності, продані протягом 1 року після купівлі; нерухомість — протягом 10 років (крім власного житла). Прибуток до 1 000 € на особу за рік не оподатковується (межа: від 1 000 € оподатковується все). Збитки зараховуються лише проти такого прибутку.', 'ግብሪ ዝኽፈሎ: ክሪፕቶ፣ ወርቂ፣ ክቡራት ነገራት ኣብ ውሽጢ 1 ዓመት ድሕሪ ዕድጊ ዝተሸጡ፤ ንብረት ኣብ ውሽጢ 10 ዓመት (ባዕልኻ እንተ ነቢርካሉ ኣይኮነን)። ረብሓ ትሕቲ 1.000 € ንሰብ ብዓመት ነጻ እዩ (ደረጃ: ካብ 1.000 € ኩሉ ግብሪ ይኽፈሎ)። ክሳራ ምስ ከምዚ ረብሓ ጥራይ ይሰራዕ።'],
    'z. B. Laptop, Software, Fachbücher, Werkzeug, Berufskleidung. Bei teilweise privater Nutzung nur den beruflichen Anteil.': ['e.g. laptop, software, specialist books, tools, work clothing. If partly used privately, only the work share.', 'مثلاً لپ‌تاپ، نرم‌افزار، کتاب تخصصی، ابزار، لباس کار. اگر بخشی خصوصی استفاده می‌شود فقط سهم کاری.', 'مثلاً حاسوب محمول، برامج، كتب متخصصة، أدوات، ملابس عمل. عند الاستخدام الخاص الجزئي فقط الحصة المهنية.', 'مثلاً لیپ ٹاپ، سافٹ ویئر، پیشہ ورانہ کتابیں، اوزار، کام کے کپڑے۔ جزوی نجی استعمال پر صرف کام کا حصہ۔', 'напр. ноутбук, програми, фахові книжки, інструменти, робочий одяг. При частковому приватному використанні — лише робоча частка.', 'ንኣብነት ላፕቶፕ፣ ሶፍትዌር፣ መጻሕፍቲ ሞያ፣ መሳርሒ፣ ክዳን ስራሕ። ብኸፊል ብሕታዊ እንተ ተጠቒምካ ናይ ስራሕ ክፋል ጥራይ።'],
    'Bewerbungsmappen, Druck, Porto, Fotos, Bewerbungs-Software – auch wenn die Bewerbung nicht geklappt hat. Belege aufheben!': ['Application folders, printing, postage, photos, application software – even if the application was unsuccessful. Keep the receipts!', 'پوشه درخواست، چاپ، پست، عکس، نرم‌افزار درخواست – حتی اگر درخواست موفق نشد. رسیدها را نگه دار!', 'ملفات التقديم، الطباعة، البريد، الصور، برامج التقديم – حتى لو لم ينجح الطلب. احتفظ بالإيصالات!', 'درخواست فولڈر، پرنٹ، ڈاک، تصاویر، درخواست سافٹ ویئر – چاہے درخواست کامیاب نہ ہوئی ہو۔ رسیدیں سنبھال کر رکھیں!', 'Папки, друк, пошта, фото, програми для заявок — навіть якщо заявка не вдалася. Зберігайте чеки!', 'ማህደር ሕቶ፣ ሕትመት፣ ፖስታ፣ ስእልታት፣ ሶፍትዌር – ሕቶ እንተ ዘይተዓወተ እውን። ቅብሊታት ዓቅብ!'],
    'z. B. Reinigung, Gartenpflege, Hausmeister, Treppenhausreinigung, Pflege- und Betreuungsleistungen.': ['e.g. cleaning, garden care, caretaker, stairwell cleaning, care and support services.', 'مثلاً نظافت، نگهداری باغ، سرایدار، نظافت راه‌پله، خدمات مراقبت.', 'مثلاً التنظيف، رعاية الحديقة، البواب، تنظيف الدرج، خدمات الرعاية.', 'مثلاً صفائی، باغ کی دیکھ بھال، نگران، سیڑھیوں کی صفائی، نگہداشت کی خدمات۔', 'напр. прибирання, догляд за садом, двірник, прибирання сходів, послуги догляду.', 'ንኣብነት ምጽራይ፣ ምእላይ ጀርዲን፣ ሓላዊ ህንጻ፣ ምጽራይ መደያይቦ፣ ኣገልግሎት ክንክን።'],
    'z. B. Reparaturen, Malerarbeiten, Wartung der Heizung, Schornsteinfeger – nur der Arbeitsanteil der Rechnung.': ['e.g. repairs, painting, heating maintenance, chimney sweep – only the labour share of the invoice.', 'مثلاً تعمیر، نقاشی، سرویس شوفاژ، دودکش‌پاک‌کن – فقط سهم دستمزد فاکتور.', 'مثلاً الإصلاحات، الدهان، صيانة التدفئة، منظف المداخن – حصة العمل فقط من الفاتورة.', 'مثلاً مرمت، رنگ و روغن، ہیٹنگ کی دیکھ بھال، چمنی صفائی – صرف بل کا مزدوری حصہ۔', 'напр. ремонт, фарбування, обслуговування опалення, сажотрус — лише вартість роботи в рахунку.', 'ንኣብነት ጽገና፣ ቀለም፣ ምእላይ መውዓዪ፣ ኣጽራዪ ትኪ – ናይ ስራሕ ክፋል ቢል ጥራይ።'],
    'Direkt von lohnsteuer-kompakt.de – genau diese Versionen erkennt der Helfer. ✓ = brauchst du nach deinen Angaben.': ['Directly from lohnsteuer-kompakt.de – the helper recognizes exactly these versions. ✓ = you need it based on your details.', 'مستقیم از lohnsteuer-kompakt.de – کمک‌کننده دقیقاً این نسخه‌ها را می‌شناسد. ✓ = طبق اطلاعاتت لازم داری.', 'مباشرة من lohnsteuer-kompakt.de – يتعرف المساعد على هذه النسخ بالضبط. ✓ = تحتاجها حسب بياناتك.', 'براہ راست lohnsteuer-kompakt.de سے – معاون بالکل یہی ورژن پہچانتا ہے۔ ✓ = آپ کی معلومات کے مطابق ضروری۔', 'Напряму з lohnsteuer-kompakt.de — помічник розпізнає саме ці версії. ✓ = потрібно за вашими даними.', 'ብቐጥታ ካብ lohnsteuer-kompakt.de – እቲ ሓጋዚ ነዘን ስሪታት ጥራይ ይፈልጠን። ✓ = ብመሰረት ሓበሬታኻ የድልየካ።'],
    '🔒 Diese Daten werden nur zum Ausfüllen genutzt und nicht gespeichert – außer du setzt unten den Haken.': ['🔒 This data is only used for filling in and is not saved – unless you tick the box below.', '🔒 این داده‌ها فقط برای پر کردن استفاده می‌شوند و ذخیره نمی‌شوند – مگر اینکه پایین تیک بزنی.', '🔒 تُستخدم هذه البيانات للتعبئة فقط ولا تُحفظ – إلا إذا وضعت العلامة أدناه.', '🔒 یہ ڈیٹا صرف بھرنے کے لیے استعمال ہوتا ہے اور محفوظ نہیں ہوتا – جب تک آپ نیچے نشان نہ لگائیں۔', '🔒 Ці дані використовуються лише для заповнення й не зберігаються — якщо не поставите галочку нижче.', '🔒 እዚ ሓበሬታ ንምምላእ ጥራይ ይጥቀመሉ፣ ኣይዕቀብን – ኣብ ታሕቲ ምልክት እንተ ዘይገበርካ።'],
    '☰ Alle Apps': ['☰ All apps', '☰ همه برنامه‌ها', '☰ كل التطبيقات', '☰ تمام ایپس', '☰ Усі застосунки', '☰ ኩሎም መተግበሪታት'],
    'Alle Apps': ['All apps', 'همه برنامه‌ها', 'كل التطبيقات', 'تمام ایپس', 'Усі застосунки', 'ኩሎም መተግበሪታት'],
    'Geschätzte Erstattung': ['Estimated refund', 'بازپرداخت تخمینی', 'الاسترداد المقدّر', 'متوقع واپسی', 'Орієнтовне повернення', 'ዝተገመተ ምምላስ'],
    'Geschätzte Nachzahlung': ['Estimated additional payment', 'پرداخت اضافی تخمینی', 'الدفعة الإضافية المقدّرة', 'متوقع اضافی ادائیگی', 'Орієнтовна доплата', 'ዝተገመተ ተወሳኺ ክፍሊት'],
    'Trage unten deine Lohnsteuerbescheinigung, Rente oder andere Einkünfte ein – dann rechnet der Helfer live mit.': ['Enter your Lohnsteuerbescheinigung, pension or other income below – the helper then calculates live.', 'Lohnsteuerbescheinigung، بازنشستگی یا درآمد دیگرت را پایین وارد کن – کمک‌کننده هم‌زمان حساب می‌کند.', 'أدخل أدناه Lohnsteuerbescheinigung أو المعاش أو دخلاً آخر – فيحسب المساعد مباشرة.', 'نیچے اپنا Lohnsteuerbescheinigung، پنشن یا دیگر آمدنی درج کریں – معاون فوراً حساب لگاتا ہے۔', 'Внесіть нижче Lohnsteuerbescheinigung, пенсію чи інші доходи — помічник рахує одразу.', 'ኣብ ታሕቲ Lohnsteuerbescheinigung፣ ጡረታ ወይ ካልእ እቶት ኣእቱ – እቲ ሓጋዚ ብቕጽበት ይሕስብ።'],
    'Trage unten deine Lohnsteuerbescheinigung ein (oder fotografiere sie) – dann rechnet der Helfer live mit.': ['Enter your Lohnsteuerbescheinigung below (or take a photo of it) – the helper then calculates live.', 'Lohnsteuerbescheinigung را پایین وارد کن (یا عکسش را بگیر) – کمک‌کننده هم‌زمان حساب می‌کند.', 'أدخل Lohnsteuerbescheinigung أدناه (أو صوّرها) – فيحسب المساعد مباشرة.', 'نیچے اپنا Lohnsteuerbescheinigung درج کریں (یا تصویر لیں) – معاون فوراً حساب لگاتا ہے۔', 'Внесіть нижче Lohnsteuerbescheinigung (або сфотографуйте) — помічник рахує одразу.', 'ኣብ ታሕቲ Lohnsteuerbescheinigung ኣእቱ (ወይ ስእሊ ኣልዕል) – እቲ ሓጋዚ ብቕጽበት ይሕስብ።'],
    'Bitte noch das Bundesland wählen (Kirchensteuer 8 % oder 9 %).': ['Please also choose the federal state (church tax 8 % or 9 %).', 'لطفاً ایالت را هم انتخاب کن (مالیات کلیسا ۸ ٪ یا ۹ ٪).', 'يرجى اختيار الولاية أيضاً (ضريبة الكنيسة 8 ٪ أو 9 ٪).', 'براہ کرم صوبہ بھی منتخب کریں (چرچ ٹیکس 8 ٪ یا 9 ٪)۔', 'Виберіть ще федеральну землю (церковний податок 8 % або 9 %).', 'በጃኻ ክፍለ-ሃገር እውን ምረጽ (ግብሪ ቤተ-ክርስትያን 8 ٪ ወይ 9 ٪)።'],
    'So viel bekommst du voraussichtlich zurück. Jede weitere Angabe unten kann den Betrag erhöhen.': ['This is roughly what you will get back. Every further entry below can increase the amount.', 'تقریباً این مقدار پس می‌گیری. هر ورودی دیگر پایین می‌تواند مبلغ را بیشتر کند.', 'هذا تقريباً ما ستسترده. كل إدخال إضافي أدناه قد يزيد المبلغ.', 'تقریباً اتنا آپ کو واپس ملے گا۔ نیچے ہر اضافی اندراج رقم بڑھا سکتا ہے۔', 'Приблизно стільки вам повернуть. Кожен наступний запис нижче може збільшити суму.', 'ብግምት እዚ ይምለሰልካ። ኣብ ታሕቲ ዝወሰኽካዮ ነፍሲ-ወከፍ ሓበሬታ ነቲ መጠን ከዕቢ ይኽእል።'],
    'Voraussichtlich musst du nachzahlen. Prüfe, ob du alle Ausgaben eingetragen hast.': ['You will probably have to pay extra. Check whether you have entered all expenses.', 'احتمالاً باید اضافه بپردازی. بررسی کن همه هزینه‌ها را وارد کرده‌ای.', 'على الأرجح ستدفع مبلغاً إضافياً. تحقق من إدخال كل النفقات.', 'غالباً آپ کو اضافی ادا کرنا ہوگا۔ جانچیں کہ تمام اخراجات درج ہیں۔', 'Імовірно, доведеться доплатити. Перевірте, чи внесли всі витрати.', 'ብግምት ተወሳኺ ክትከፍል ኣለካ። ኩሉ ወጻኢታት ከም ዘእተኻ ፈትሽ።'],
    'Sprache': ['Language', 'زبان', 'اللغة', 'زبان', 'Мова', 'ቋንቋ']
  };
  const P = [
    [/^💶 Geschätzte Erstattung (\d{4})$/, ['💶 Estimated refund $1', '💶 بازپرداخت تخمینی $1', '💶 الاسترداد المقدّر $1', '💶 متوقع واپسی $1', '💶 Орієнтовне повернення $1', '💶 ዝተገመተ ምምላስ $1']],
    [/^⚠️ Geschätzte Nachzahlung (\d{4})$/, ['⚠️ Estimated additional payment $1', '⚠️ پرداخت اضافی تخمینی $1', '⚠️ الدفعة الإضافية المقدّرة $1', '⚠️ متوقع اضافی ادائیگی $1', '⚠️ Орієнтовна доплата $1', '⚠️ ዝተገመተ ተወሳኺ ክፍሊት $1']],
    [/^💶 Geschätzte Erstattung$/, ['💶 Estimated refund', '💶 بازپرداخت تخمینی', '💶 الاسترداد المقدّر', '💶 متوقع واپسی', '💶 Орієнтовне повернення', '💶 ዝተገመተ ምምላስ']],
    [/^Jahr (\d{4})$/, ['Year $1', 'سال $1', 'سنة $1', 'سال $1', 'Рік $1', 'ዓመት $1']],
    [/^📥 Vordrucke (\d{4}) herunterladen$/, ['📥 Download $1 forms', '📥 دانلود فرم‌های $1', '📥 تنزيل استمارات $1', '📥 $1 کے فارم ڈاؤن لوڈ کریں', '📥 Завантажити формуляри $1', '📥 ቅጥዕታት $1 ኣውርድ']]
  ];

  const EMO_WEG = /^\s*(?:\p{Extended_Pictographic}|[ℹ⬇⬆▶⚙⚠✏✍✉☁✈])(?:\uFE0F|\u200D\p{Extended_Pictographic})*\s*/u;
  let W2 = null;
  function ohneEmoji(k) {
    if (!W2) { W2 = {}; Object.keys(W).forEach(x => { const y = x.replace(EMO_WEG, ''); if (y !== x && !W[y]) W2[y] = W[x]; }); }
    return W2[k.replace(EMO_WEG, '')];
  }
  function uebersetze(s) {
    if (col < 0 || !s) return null;
    const kern = s.trim().replace(/\s+/g, ' ');
    if (!kern) return null;
    const w = W[kern] || ohneEmoji(kern);
    if (w) return w[col];
    for (const [re, z] of P) { if (re.test(kern)) return kern.replace(re, z[col]); }
    return null;
  }
  // Nur Orientierung: Eingaben, Formularfelder und Ergebnislisten bleiben unangetastet
  const NICHT = 'TEXTAREA,SCRIPT,STYLE,INPUT,OPTION:not(#jahr option)';
  function knoten(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement;
      if (!p || p.closest(NICHT)) return;
      const u = uebersetze(n.nodeValue);
      if (u != null && u !== n.nodeValue.trim()) n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), u);
    } else if (n.nodeType === 1) {
      ['title', 'aria-label'].forEach(a => {
        const v = n.getAttribute && n.getAttribute(a);
        if (v) { const u = uebersetze(v); if (u != null && u !== v) n.setAttribute(a, u); }
      });
      if (n.childNodes) n.childNodes.forEach(knoten);
    }
  }

  const BOX = [
    '<strong>ℹ️ How the tax helper works</strong> Here you collect and calculate your details, sorted by the annexes of the tax return. Below you get a summary with the amounts and where they go in <b>Mein ELSTER</b>. <b>You submit it yourself</b> in Mein ELSTER (free, <a href="https://www.elster.de" target="_blank" rel="noopener">elster.de</a>).<br>🔒 Your details are stored <b>only on this device</b>.<br>⚠️ <b>Not tax advice</b> – details and calculations without guarantee. If unsure, a Lohnsteuerhilfeverein (wage tax help association) or a tax advisor can help.',
    '<strong>ℹ️ کمک مالیاتی چطور کار می‌کند</strong> اینجا اطلاعاتت را جمع و حساب می‌کنی، مرتب‌شده طبق پیوست‌های اظهارنامه. پایین خلاصه‌ای با مبالغ می‌گیری و اینکه هر کدام کجای <b>Mein ELSTER</b> می‌رود. <b>تحویل را خودت انجام می‌دهی</b> در Mein ELSTER (رایگان، <a href="https://www.elster.de" target="_blank" rel="noopener">elster.de</a>).<br>🔒 اطلاعات تو <b>فقط روی همین دستگاه</b> ذخیره می‌شود.<br>⚠️ <b>مشاوره مالیاتی نیست</b> – اطلاعات و محاسبات بدون ضمانت. در صورت شک یک Lohnsteuerhilfeverein (انجمن کمک مالیات حقوق) یا مشاور مالیاتی کمک می‌کند.',
    '<strong>ℹ️ كيف يعمل مساعد الضرائب</strong> هنا تجمع بياناتك وتحسبها مرتبة حسب ملاحق الإقرار الضريبي. في الأسفل تحصل على ملخص بالمبالغ وأين توضع في <b>Mein ELSTER</b>. <b>التقديم تقوم به بنفسك</b> في Mein ELSTER (مجاناً، <a href="https://www.elster.de" target="_blank" rel="noopener">elster.de</a>).<br>🔒 تُحفظ بياناتك <b>على هذا الجهاز فقط</b>.<br>⚠️ <b>ليست استشارة ضريبية</b> – البيانات والحسابات دون ضمان. عند الشك تساعدك جمعية Lohnsteuerhilfeverein أو مستشار ضريبي.',
    '<strong>ℹ️ ٹیکس معاون کیسے کام کرتا ہے</strong> یہاں آپ اپنی معلومات جمع اور حساب کرتے ہیں، ٹیکس گوشوارے کے ضمیموں کے مطابق ترتیب سے۔ نیچے آپ کو رقموں کا خلاصہ ملتا ہے اور یہ کہ وہ <b>Mein ELSTER</b> میں کہاں جاتی ہیں۔ <b>جمع آپ خود کرتے ہیں</b> Mein ELSTER میں (مفت، <a href="https://www.elster.de" target="_blank" rel="noopener">elster.de</a>)۔<br>🔒 آپ کی معلومات <b>صرف اسی آلے پر</b> محفوظ ہوتی ہیں۔<br>⚠️ <b>ٹیکس مشورہ نہیں</b> – معلومات اور حسابات بغیر ضمانت۔ شک ہو تو Lohnsteuerhilfeverein (تنخواہ ٹیکس امدادی انجمن) یا ٹیکس مشیر مدد کرتا ہے۔',
    '<strong>ℹ️ Як працює податковий помічник</strong> Тут ви збираєте й рахуєте свої дані за додатками до декларації. Унизу — підсумок із сумами й тим, куди вони йдуть у <b>Mein ELSTER</b>. <b>Подаєте ви самі</b> в Mein ELSTER (безкоштовно, <a href="https://www.elster.de" target="_blank" rel="noopener">elster.de</a>).<br>🔒 Ваші дані зберігаються <b>лише на цьому пристрої</b>.<br>⚠️ <b>Не податкова консультація</b> — дані й розрахунки без гарантії. Якщо сумніваєтеся, допоможе Lohnsteuerhilfeverein (спілка допомоги з податку на зарплату) або податковий консультант.',
    '<strong>ℹ️ ሓጋዚ ግብሪ ከመይ ይሰርሕ</strong> ኣብዚ ሓበሬታኻ ትእክብን ትሕስብን፣ ብመሰረት ተወሰኽቲ ቅጥዕታት መግለጺ ግብሪ ተሰሪዑ። ኣብ ታሕቲ ጽማቕ መጠናትን ኣበይ ኣብ <b>Mein ELSTER</b> ከም ዝኣትዉን ትረክብ። <b>ምቕራብ ባዕልኻ ትገብሮ</b> ኣብ Mein ELSTER (ናጻ፣ <a href="https://www.elster.de" target="_blank" rel="noopener">elster.de</a>)።<br>🔒 ሓበሬታኻ <b>ኣብዚ መሳርሒ ጥራይ</b> ይዕቀብ።<br>⚠️ <b>ምኽሪ ግብሪ ኣይኮነን</b> – ሓበሬታን ሕሳብን ብዘይ ውሕስነት። እንተ ተጠራጢርካ Lohnsteuerhilfeverein (ማሕበር ሓገዝ ግብሪ ደሞዝ) ወይ ኣማኻሪ ግብሪ ይሕግዘካ።'
  ];
  function box() {
    const b = document.querySelector('main > .hinweis');
    if (!b || b.dataset.sdUebersetzt) return;
    const frist = b.querySelector('#fristInfo');
    b.innerHTML = BOX[col];
    if (frist) b.appendChild(frist);
    b.dataset.sdUebersetzt = '1';
  }

  function sprachwahl() {
    const bar = document.querySelector('.topbar');
    if (!bar || document.getElementById('sdSprachwahl')) return;
    const sel = document.createElement('select');
    sel.id = 'sdSprachwahl';
    sel.setAttribute('aria-label', 'Sprache / Language');
    sel.style.cssText = 'font:inherit;font-size:.85rem;min-height:36px;padding:4px 8px;border-radius:999px;border:1px solid var(--line,#cfd8dc);background:var(--paper,#fff);color:inherit;max-width:130px';
    sel.innerHTML = Object.keys(NAMEN).map(l => '<option value="' + l + '">' + NAMEN[l] + '</option>').join('');
    sel.value = lang;
    sel.addEventListener('change', () => { try { localStorage.setItem('sdSprache', sel.value); } catch (e) { /* ohne Speicher */ } location.reload(); });
    const jahr = bar.querySelector('.jahr-wahl');
    bar.insertBefore(sel, jahr || null);
  }
  function hinweis() {
    if (col < 0 || document.getElementById('sdSprachHinweis')) return;
    const p = document.createElement('p');
    p.id = 'sdSprachHinweis';
    p.style.cssText = 'margin:10px 16px;padding:10px 12px;border-radius:10px;background:var(--soft,#eef6f4);font-size:.9rem;line-height:1.45';
    p.textContent = '🌐 ' + HINWEIS[col];
    const bar = document.querySelector('.topbar');
    if (bar && bar.parentNode) bar.parentNode.insertBefore(p, bar.nextSibling);
  }

  function start() {
    sprachwahl();
    if (col < 0) return;
    document.documentElement.lang = lang;
    if (RTL.includes(lang)) {
      const st = document.createElement('style');
      st.textContent = 'summary,h1,h2,h3,h4,.topbar small,#sdSprachHinweis,main>.hinweis,.erg-karte,p.hilfe,p.info{direction:rtl;text-align:right}input,textarea,select{unicode-bidi:plaintext}#fristInfo{direction:ltr;text-align:left}';
      document.head.appendChild(st);
    }
    hinweis();
    box();
    knoten(document.body);
    new MutationObserver(ms => ms.forEach(m => {
      if (m.type === 'characterData') knoten(m.target);
      else m.addedNodes.forEach(knoten);
    })).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
