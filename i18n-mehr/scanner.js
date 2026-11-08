/* Scanner: Übersetzungsschicht. Die App ist auf Deutsch geschrieben; dieses Skript ersetzt sichtbare deutsche Texte
   (Textknoten, placeholder, aria-label, title, alt, Bestätigungsfragen) durch die gewählte Sprache.
   Spalten: en, fa, ar, ur, uk, ti. Noch nicht von Muttersprachlern geprüft. Unbekannte Texte bleiben deutsch. */
(function () {
  const SPR = ['en', 'fa', 'ar', 'ur', 'uk', 'ti'];
  const NAMEN = { de: 'Deutsch', en: 'English', fa: 'دری', ar: 'العربية', ur: 'اردو', uk: 'Українська', ti: 'ትግርኛ' };
  let lang = 'de';
  try { lang = localStorage.getItem('sdSprache') || 'de'; } catch (e) { /* ohne Speicher */ }
  if (lang !== 'de' && !SPR.includes(lang)) lang = 'de';
  window.SD_LANG = lang;   // für die KI-Fenster (sd-ki.js)
  const RTL = ['fa', 'ar', 'ur'];

  const W = {
    'Ablage': ['Library', 'بایگانی', 'الأرشيف', 'محفوظات', 'Архів', 'መዝገብ'],
    'Verlauf': ['History', 'تاریخچه', 'السجل', 'تاریخ', 'Історія', 'ታሪኽ'],
    'Licht': ['Light', 'نور', 'الضوء', 'روشنی', 'Світло', 'ብርሃን'],
    'Blatt ruhig halten': ['Hold the page steady', 'برگه را ثابت نگه دار', 'ثبّت الورقة', 'صفحہ ساکن رکھیں', 'Тримайте аркуш нерухомо', 'ወረቐት ኣጽኒዕካ ሓዝ'],
    'QR-Code oder Barcode ins Bild halten': ['Hold a QR code or barcode in view', 'کد QR یا بارکد را جلوی دوربین بگیر', 'ضع رمز QR أو الباركود أمام الكاميرا', 'QR کوڈ یا بار کوڈ تصویر میں رکھیں', 'Наведіть на QR-код або штрихкод', 'QR ኮድ ወይ ባርኮድ ኣብ ስእሊ ሓዝ'],
    'Keine Kamera verfügbar': ['No camera available', 'دوربین در دسترس نیست', 'لا تتوفر كاميرا', 'کوئی کیمرہ دستیاب نہیں', 'Камера недоступна', 'ካሜራ የለን'],
    'Fotos oder Bilder vom Gerät importieren und wie einen Scan bearbeiten.': ['Import photos or images from your device and edit them like a scan.', 'عکس‌ها یا تصاویر را از دستگاه وارد کن و مثل اسکن ویرایش کن.', 'استورد صوراً من جهازك وعدّلها كمسح ضوئي.', 'آلے سے تصاویر درآمد کریں اور اسکین کی طرح ترمیم کریں۔', 'Імпортуйте фото з пристрою й редагуйте як скан.', 'ስእልታት ካብ መሳርሒ ኣእቱን ከም ስካን ኣመሓይሽን።'],
    'Foto aufnehmen': ['Take photo', 'عکس گرفتن', 'التقاط صورة', 'تصویر لیں', 'Зробити фото', 'ስእሊ ኣልዕል'],
    'Bilder importieren': ['Import images', 'وارد کردن تصاویر', 'استيراد صور', 'تصاویر درآمد کریں', 'Імпортувати зображення', 'ስእልታት ኣእቱ'],
    'Scan-Art': ['Scan type', 'نوع اسکن', 'نوع المسح', 'اسکین کی قسم', 'Тип сканування', 'ዓይነት ስካን'],
    'Dokument': ['Document', 'سند', 'مستند', 'دستاویز', 'Документ', 'ሰነድ'],
    'QR / Barcode': ['QR / barcode', 'QR / بارکد', 'QR / باركود', 'QR / بار کوڈ', 'QR / штрихкод', 'QR / ባርኮድ'],
    'Visitenkarte': ['Business card', 'کارت ویزیت', 'بطاقة عمل', 'وزیٹنگ کارڈ', 'Візитка', 'ካርድ ቢዝነስ'],
    'Seitenliste': ['Page list', 'فهرست صفحه‌ها', 'قائمة الصفحات', 'صفحات کی فہرست', 'Список сторінок', 'ዝርዝር ገጻት'],
    'Aufnehmen': ['Capture', 'گرفتن', 'التقاط', 'لیں', 'Зняти', 'ኣልዕል'],
    'Import': ['Import', 'وارد کردن', 'استيراد', 'درآمد', 'Імпорт', 'ኣእቱ'],
    'Zurück': ['Back', 'برگشت', 'رجوع', 'واپس', 'Назад', 'ተመለስ'],
    'Drehen': ['Rotate', 'چرخاندن', 'تدوير', 'گھمائیں', 'Повернути', 'ኣዙር'],
    'Übernehmen': ['Accept', 'تأیید', 'قبول', 'قبول کریں', 'Прийняти', 'ተቐበል'],
    'Seiten': ['Pages', 'صفحه‌ها', 'الصفحات', 'صفحات', 'Сторінки', 'ገጻት'],
    'Neu': ['New', 'جدید', 'جديد', 'نیا', 'Нове', 'ሓድሽ'],
    'Schließen': ['Close', 'بستن', 'إغلاق', 'بند کریں', 'Закрити', 'ዕጸው'],
    'Fertig': ['Done', 'تمام', 'تم', 'مکمل', 'Готово', 'ተወዲኡ'],
    'Dateiname': ['File name', 'نام فایل', 'اسم الملف', 'فائل کا نام', 'Назва файлу', 'ስም ፋይል'],
    'Teilen': ['Share', 'اشتراک', 'مشاركة', 'شیئر', 'Поділитися', 'ኣካፍል'],
    'Drucken': ['Print', 'چاپ', 'طباعة', 'پرنٹ', 'Друк', 'ሕተም'],
    'Text': ['Text', 'متن', 'نص', 'متن', 'Текст', 'ጽሑፍ'],
    'KI': ['AI', 'هوش مصنوعی', 'ذكاء اصطناعي', 'AI', 'ШІ', 'AI'],
    'Text erkennen, als TXT speichern und als unsichtbare Textebene ins PDF legen': ['Recognize text, save as TXT and add it as an invisible text layer to the PDF', 'تشخیص متن، ذخیره به TXT و افزودن به‌عنوان لایه متنی نامرئی در PDF', 'التعرف على النص وحفظه TXT وإضافته كطبقة نص مخفية في PDF', 'متن پہچانیں، TXT میں محفوظ کریں اور PDF میں پوشیدہ متن کی تہہ بنائیں', 'Розпізнати текст, зберегти як TXT і додати невидимим шаром у PDF', 'ጽሑፍ ኣለሊ፣ ከም TXT ዓቅብ፣ ኣብ PDF ከም ዘይርአ ጽሑፍ ወስኽ'],
    'Zusammenfassen, übersetzen und mehr – mit SD Lotse oder Gemini': ['Summarize, translate and more – with SD Lotse or Gemini', 'خلاصه، ترجمه و بیشتر – با SD Lotse یا Gemini', 'تلخيص وترجمة والمزيد – مع SD Lotse أو Gemini', 'خلاصہ، ترجمہ اور مزید – SD Lotse یا Gemini کے ساتھ', 'Підсумок, переклад тощо — із SD Lotse чи Gemini', 'ኣሕጽር፣ ተርጉምን ካልእን – ብ SD Lotse ወይ Gemini'],
    'Erkannter Text': ['Recognized text', 'متن تشخیص‌داده‌شده', 'النص المتعرَّف عليه', 'پہچانا گیا متن', 'Розпізнаний текст', 'ዝተለለየ ጽሑፍ'],
    'Kopieren': ['Copy', 'کپی', 'نسخ', 'کاپی', 'Копіювати', 'ቅዳሕ'],
    'Als TXT': ['As TXT', 'به TXT', 'كملف TXT', 'TXT میں', 'Як TXT', 'ከም TXT'],
    'Neues Dokument': ['New document', 'سند جدید', 'مستند جديد', 'نئی دستاویز', 'Новий документ', 'ሓድሽ ሰነድ'],
    'Suchen (Name oder erkannter Text)': ['Search (name or recognized text)', 'جستجو (نام یا متن تشخیص‌داده‌شده)', 'بحث (الاسم أو النص المتعرَّف عليه)', 'تلاش (نام یا پہچانا گیا متن)', 'Пошук (назва чи розпізнаний текст)', 'ድለ (ስም ወይ ዝተለለየ ጽሑፍ)'],
    'Filter': ['Filter', 'فیلتر', 'تصفية', 'فلٹر', 'Фільтр', 'ፍልተር'],
    'Alle': ['All', 'همه', 'الكل', 'سب', 'Усі', 'ኩሉ'],
    'Dokumente': ['Documents', 'اسناد', 'المستندات', 'دستاویزات', 'Документи', 'ሰነዳት'],
    'Visitenkarten': ['Business cards', 'کارت‌های ویزیت', 'بطاقات العمل', 'وزیٹنگ کارڈز', 'Візитки', 'ካርድታት ቢዝነስ'],
    'Code erkannt': ['Code recognized', 'کد تشخیص داده شد', 'تم التعرف على الرمز', 'کوڈ پہچانا گیا', 'Код розпізнано', 'ኮድ ተለሊዩ'],
    'Weiter scannen': ['Keep scanning', 'ادامه اسکن', 'متابعة المسح', 'اسکین جاری رکھیں', 'Сканувати далі', 'ስካን ቀጽል'],
    'Öffnen': ['Open', 'باز کردن', 'فتح', 'کھولیں', 'Відкрити', 'ክፈት'],
    'Code-Verlauf': ['Code history', 'تاریخچه کدها', 'سجل الرموز', 'کوڈ کی تاریخ', 'Історія кодів', 'ታሪኽ ኮድ'],
    'Alle löschen': ['Delete all', 'حذف همه', 'حذف الكل', 'سب حذف کریں', 'Видалити все', 'ኩሉ ደምስስ'],
    'Löschen': ['Delete', 'حذف', 'حذف', 'حذف کریں', 'Видалити', 'ደምስስ'],
    'Mit KI ausfüllen': ['Fill in with AI', 'پر کردن با هوش مصنوعی', 'تعبئة بالذكاء الاصطناعي', 'AI سے بھریں', 'Заповнити за допомогою ШІ', 'ብ AI ምላእ'],
    'Als Kontakt (.vcf)': ['As contact (.vcf)', 'به‌عنوان مخاطب (.vcf)', 'كجهة اتصال (.vcf)', 'بطور رابطہ (.vcf)', 'Як контакт (.vcf)', 'ከም ርክብ (.vcf)'],
    'Wird verarbeitet': ['Processing', 'در حال پردازش', 'جارٍ المعالجة', 'کارروائی جاری ہے', 'Обробка', 'ይስራሕ ኣሎ'],
    '(ohne Namen)': ['(no name)', '(بی‌نام)', '(دون اسم)', '(بغیر نام)', '(без назви)', '(ስም የብሉን)'],
    'Alles bleibt nur in diesem Browser auf diesem Gerät.': ['Everything stays only in this browser on this device.', 'همه‌چیز فقط در همین مرورگر روی همین دستگاه می‌ماند.', 'يبقى كل شيء في هذا المتصفح على هذا الجهاز فقط.', 'سب کچھ صرف اسی براؤزر میں اسی آلے پر رہتا ہے۔', 'Усе залишається лише в цьому браузері на цьому пристрої.', 'ኩሉ ኣብዚ መርበብ ኣብዚ መሳርሒ ጥራይ ይተርፍ።'],
    'Als Kontakt speichern': ['Save as contact', 'ذخیره به‌عنوان مخاطب', 'حفظ كجهة اتصال', 'بطور رابطہ محفوظ کریں', 'Зберегти як контакт', 'ከም ርክብ ዓቅብ'],
    'Anrufen': ['Call', 'تماس', 'اتصال', 'کال کریں', 'Зателефонувати', 'ደውል'],
    'Auswerten': ['Analyze', 'ارزیابی', 'تحليل', 'جائزہ لیں', 'Проаналізувати', 'ገምግም'],
    'Abbrechen': ['Cancel', 'لغو', 'إلغاء', 'منسوخ', 'Скасувати', 'ሰርዝ'],
    'Bild nicht lesbar': ['Image not readable', 'تصویر خوانا نیست', 'الصورة غير مقروءة', 'تصویر پڑھی نہیں جا سکتی', 'Зображення не читається', 'ስእሊ ኣይንበብን'],
    'Bild wird geladen': ['Loading image', 'تصویر بارگذاری می‌شود', 'جارٍ تحميل الصورة', 'تصویر لوڈ ہو رہی ہے', 'Завантаження зображення', 'ስእሊ ይጽዕን ኣሎ'],
    'Bitte Bilddateien wählen (JPG, PNG, WebP)': ['Please choose image files (JPG, PNG, WebP)', 'لطفاً فایل تصویری انتخاب کن (JPG، PNG، WebP)', 'يرجى اختيار ملفات صور (JPG، PNG، WebP)', 'براہ کرم تصویری فائلیں منتخب کریں (JPG، PNG، WebP)', 'Виберіть файли зображень (JPG, PNG, WebP)', 'በጃኻ ፋይላት ስእሊ ምረጽ (JPG፣ PNG፣ WebP)'],
    'Blatt erkannt': ['Page detected', 'برگه تشخیص داده شد', 'تم التعرف على الورقة', 'صفحہ پہچانا گیا', 'Аркуш розпізнано', 'ወረቐት ተለሊዩ'],
    'Blatt nicht sicher erkannt – bitte die grünen Ecken auf die Blattecken ziehen': ['Page not reliably detected – please drag the green corners onto the page corners', 'برگه با اطمینان تشخیص داده نشد – لطفاً گوشه‌های سبز را روی گوشه‌های برگه بکش', 'لم يُتعرف على الورقة بثقة – اسحب الزوايا الخضراء إلى زوايا الورقة', 'صفحہ یقینی طور پر نہیں پہچانا گیا – سبز کونے صفحے کے کونوں پر کھینچیں', 'Аркуш розпізнано ненадійно — перетягніть зелені кути на кути аркуша', 'ወረቐት ብርግጽ ኣይተለለየን – ቀጠልያ ኩርናዓት ናብ ኩርናዓት ወረቐት ስሓብ'],
    'Blatt wird gesucht': ['Looking for the page', 'در جستجوی برگه', 'جارٍ البحث عن الورقة', 'صفحہ تلاش ہو رہا ہے', 'Пошук аркуша', 'ወረቐት ይድለ ኣሎ'],
    'Code wird gesucht': ['Looking for a code', 'در جستجوی کد', 'جارٍ البحث عن رمز', 'کوڈ تلاش ہو رہا ہے', 'Пошук коду', 'ኮድ ይድለ ኣሎ'],
    'Den ganzen Code-Verlauf löschen?': ['Delete the whole code history?', 'کل تاریخچه کدها حذف شود؟', 'حذف سجل الرموز بالكامل؟', 'کوڈ کی پوری تاریخ حذف کریں؟', 'Видалити всю історію кодів?', 'ምሉእ ታሪኽ ኮድ ይደምሰስ?'],
    'Der Code enthält einen Kontakt.': ['The code contains a contact.', 'کد یک مخاطب دارد.', 'يحتوي الرمز على جهة اتصال.', 'کوڈ میں ایک رابطہ ہے۔', 'Код містить контакт.', 'እቲ ኮድ ርክብ ሒዙ ኣሎ።'],
    'Der Kamerazugriff wurde nicht erlaubt. Fotos oder Bilder kannst du trotzdem importieren.': ['Camera access was not allowed. You can still import photos or images.', 'دسترسی به دوربین مجاز نشد. با این حال می‌توانی عکس یا تصویر وارد کنی.', 'لم يُسمح بالوصول إلى الكاميرا. لا يزال بإمكانك استيراد صور.', 'کیمرے تک رسائی کی اجازت نہیں دی گئی۔ آپ پھر بھی تصاویر درآمد کر سکتے ہیں۔', 'Доступ до камери не дозволено. Фото все одно можна імпортувати.', 'ናብ ካሜራ ምብጻሕ ኣይተፈቕደን። ስእልታት ግን ከተእቱ ትኽእል።'],
    'Der Text liegt jetzt auch unsichtbar im PDF. Das PDF ist dadurch durchsuchbar.': ['The text is now also invisibly in the PDF, so the PDF is searchable.', 'متن حالا نامرئی در PDF هم هست. به همین دلیل PDF قابل جستجو است.', 'النص موجود الآن أيضاً بشكل مخفي في PDF، لذا يمكن البحث فيه.', 'متن اب PDF میں بھی پوشیدہ ہے، اس لیے PDF میں تلاش ممکن ہے۔', 'Текст тепер також невидимо в PDF, тож у PDF можна шукати.', 'እቲ ጽሑፍ ሕጂ ኣብ PDF ብዘይርአ ኣሎ፣ ስለዚ PDF ክድለ ይኽእል።'],
    'Der erkannte Kartentext wird zur Auswertung an den gewählten Online-Dienst gesendet.': ['The recognized card text is sent to the chosen online service for analysis.', 'متن کارت برای ارزیابی به سرویس آنلاین انتخاب‌شده فرستاده می‌شود.', 'يُرسل نص البطاقة إلى الخدمة المختارة عبر الإنترنت للتحليل.', 'کارڈ کا متن جائزے کے لیے منتخب آن لائن سروس کو بھیجا جاتا ہے۔', 'Розпізнаний текст картки надсилається вибраному онлайн-сервісу.', 'ጽሑፍ ካርድ ንግምገማ ናብ ዝተመርጸ ኦንላይን ኣገልግሎት ይለኣኽ።'],
    'Die KI hat keine verwertbare Antwort geliefert. Bitte nochmal versuchen.': ['The AI gave no usable answer. Please try again.', 'هوش مصنوعی جواب قابل استفاده‌ای نداد. دوباره امتحان کن.', 'لم يقدم الذكاء الاصطناعي إجابة صالحة. حاول مجدداً.', 'AI نے قابل استعمال جواب نہیں دیا۔ دوبارہ کوشش کریں۔', 'ШІ не дав придатної відповіді. Спробуйте ще раз.', 'AI ጠቓሚ መልሲ ኣይሃበን። ደጊምካ ፈትን።'],
    'Die KI hat nichts geändert.': ['The AI changed nothing.', 'هوش مصنوعی چیزی تغییر نداد.', 'لم يغيّر الذكاء الاصطناعي شيئاً.', 'AI نے کچھ نہیں بدلا۔', 'ШІ нічого не змінив.', 'AI ገለ ኣይቀየረን።'],
    'Die Kamera geht nur über HTTPS oder localhost. Fotos oder Bilder kannst du trotzdem importieren.': ['The camera only works over HTTPS or localhost. You can still import photos or images.', 'دوربین فقط با HTTPS یا localhost کار می‌کند. با این حال می‌توانی تصویر وارد کنی.', 'الكاميرا تعمل فقط عبر HTTPS أو localhost. لا يزال بإمكانك استيراد صور.', 'کیمرہ صرف HTTPS یا localhost پر چلتا ہے۔ آپ پھر بھی تصاویر درآمد کر سکتے ہیں۔', 'Камера працює лише через HTTPS або localhost. Фото все одно можна імпортувати.', 'ካሜራ ብ HTTPS ወይ localhost ጥራይ ይሰርሕ። ስእልታት ግን ከተእቱ ትኽእል።'],
    'Dieser Browser gibt keine Kamera frei. Fotos oder Bilder kannst du trotzdem importieren.': ['This browser does not provide a camera. You can still import photos or images.', 'این مرورگر دوربین را در دسترس نمی‌گذارد. با این حال می‌توانی تصویر وارد کنی.', 'هذا المتصفح لا يتيح الكاميرا. لا يزال بإمكانك استيراد صور.', 'یہ براؤزر کیمرہ فراہم نہیں کرتا۔ آپ پھر بھی تصاویر درآمد کر سکتے ہیں۔', 'Цей браузер не надає камеру. Фото все одно можна імпортувати.', 'እዚ መርበብ ካሜራ ኣይህብን። ስእልታት ግን ከተእቱ ትኽእል።'],
    'Dokument nicht gefunden': ['Document not found', 'سند پیدا نشد', 'لم يُعثر على المستند', 'دستاویز نہیں ملی', 'Документ не знайдено', 'ሰነድ ኣይተረኽበን'],
    'Dokument wird geöffnet': ['Opening document', 'سند باز می‌شود', 'جارٍ فتح المستند', 'دستاویز کھل رہی ہے', 'Відкриття документа', 'ሰነድ ይኽፈት ኣሎ'],
    'Drehen fehlgeschlagen': ['Rotation failed', 'چرخاندن ناموفق بود', 'فشل التدوير', 'گھمانا ناکام', 'Не вдалося повернути', 'ምዝዋር ኣይተዓወተን'],
    'Druckansicht wird vorbereitet': ['Preparing print view', 'نمای چاپ آماده می‌شود', 'جارٍ تجهيز عرض الطباعة', 'پرنٹ منظر تیار ہو رہا ہے', 'Підготовка до друку', 'ናይ ሕትመት ትርኢት ይዳሎ ኣሎ'],
    'Drucken fehlgeschlagen': ['Printing failed', 'چاپ ناموفق بود', 'فشلت الطباعة', 'پرنٹ ناکام', 'Не вдалося надрукувати', 'ሕትመት ኣይተዓወተን'],
    'E-Mail schreiben': ['Write email', 'نوشتن ایمیل', 'كتابة بريد', 'ای میل لکھیں', 'Написати лист', 'ኢመይል ጽሓፍ'],
    'Eintrag löschen': ['Delete entry', 'حذف مورد', 'حذف الإدخال', 'اندراج حذف کریں', 'Видалити запис', 'መእተዊ ደምስስ'],
    'Es wurde kein Text erkannt.': ['No text was recognized.', 'متنی تشخیص داده نشد.', 'لم يُتعرف على أي نص.', 'کوئی متن نہیں پہچانا گیا۔', 'Текст не розпізнано.', 'ጽሑፍ ኣይተለለየን።'],
    'Felder wurden automatisch erkannt – bitte kurz prüfen.': ['Fields were detected automatically – please check briefly.', 'فیلدها خودکار تشخیص داده شدند – لطفاً کوتاه بررسی کن.', 'تم التعرف على الحقول تلقائياً – يرجى المراجعة.', 'خانے خود بخود پہچانے گئے – براہ کرم جانچ لیں۔', 'Поля розпізнано автоматично — перевірте.', 'ቦታታት ባዕሎም ተለሊዮም – በጃኻ ፈትሽ።'],
    'Firma': ['Company', 'شرکت', 'الشركة', 'کمپنی', 'Компанія', 'ትካል'],
    'Gelöscht': ['Deleted', 'حذف شد', 'تم الحذف', 'حذف ہو گیا', 'Видалено', 'ተደምሲሱ'],
    'KI nicht verfügbar. Sie braucht beim ersten Mal eine Internetverbindung.': ['AI not available. It needs an internet connection the first time.', 'هوش مصنوعی در دسترس نیست. بار اول به اینترنت نیاز دارد.', 'الذكاء الاصطناعي غير متاح. يحتاج إلى إنترنت في المرة الأولى.', 'AI دستیاب نہیں۔ پہلی بار انٹرنیٹ کی ضرورت ہے۔', 'ШІ недоступний. Уперше потрібен інтернет.', 'AI የለን። ንመጀመርታ ግዜ ኢንተርነት የድልዮ።'],
    'Kanten neu erkannt': ['Edges re-detected', 'لبه‌ها دوباره تشخیص داده شدند', 'أُعيد التعرف على الحواف', 'کنارے دوبارہ پہچانے گئے', 'Краї розпізнано заново', 'ወሰናት ደጊሞም ተለሊዮም'],
    'Karte ruhig halten': ['Hold the card steady', 'کارت را ثابت نگه دار', 'ثبّت البطاقة', 'کارڈ ساکن رکھیں', 'Тримайте картку нерухомо', 'ካርድ ኣጽኒዕካ ሓዝ'],
    'Kein Code im Bild gefunden': ['No code found in the image', 'کدی در تصویر پیدا نشد', 'لم يُعثر على رمز في الصورة', 'تصویر میں کوئی کوڈ نہیں ملا', 'Код на зображенні не знайдено', 'ኣብ ስእሊ ኮድ ኣይተረኽበን'],
    'Kein QR-Code im Bild gefunden (Barcodes nur in Chrome/Edge)': ['No QR code found in the image (barcodes only in Chrome/Edge)', 'کد QR در تصویر پیدا نشد (بارکد فقط در Chrome/Edge)', 'لم يُعثر على رمز QR (الباركود فقط في Chrome/Edge)', 'تصویر میں QR کوڈ نہیں ملا (بار کوڈ صرف Chrome/Edge میں)', 'QR-код не знайдено (штрихкоди лише в Chrome/Edge)', 'QR ኮድ ኣይተረኽበን (ባርኮድ ኣብ Chrome/Edge ጥራይ)'],
    'Kein Text erkannt. Felder selbst ausfüllen oder die Karte nochmal schärfer aufnehmen.': ['No text recognized. Fill in the fields yourself or take a sharper photo of the card.', 'متنی تشخیص داده نشد. فیلدها را خودت پر کن یا کارت را واضح‌تر عکس بگیر.', 'لم يُتعرف على نص. املأ الحقول بنفسك أو صوّر البطاقة بوضوح أكبر.', 'کوئی متن نہیں پہچانا گیا۔ خانے خود بھریں یا کارڈ کی واضح تصویر لیں۔', 'Текст не розпізнано. Заповніть поля самі або зніміть картку чіткіше.', 'ጽሑፍ ኣይተለለየን። ቦታታት ባዕልኻ ምላእ ወይ ካርድ ብዝበለጸ ንጹር ኣልዕል።'],
    'Kein erkannter Text – die KI hat nichts zum Auswerten': ['No recognized text – nothing for the AI to analyze', 'متنی تشخیص داده نشده – هوش مصنوعی چیزی برای ارزیابی ندارد', 'لا نص متعرَّف عليه – لا شيء ليحلله الذكاء الاصطناعي', 'کوئی پہچانا گیا متن نہیں – AI کے پاس جائزے کو کچھ نہیں', 'Немає розпізнаного тексту — ШІ нічого аналізувати', 'ዝተለለየ ጽሑፍ የለን – AI ዝግምግሞ የብሉን'],
    'Keine Internetverbindung': ['No internet connection', 'اتصال اینترنت نیست', 'لا يوجد اتصال بالإنترنت', 'انٹرنیٹ کنکشن نہیں', 'Немає інтернету', 'ኢንተርነት የለን'],
    'Keine Kamera gefunden. Fotos oder Bilder vom Gerät importieren und wie einen Scan bearbeiten.': ['No camera found. Import photos or images from your device and edit them like a scan.', 'دوربینی پیدا نشد. عکس‌ها را از دستگاه وارد کن و مثل اسکن ویرایش کن.', 'لم يُعثر على كاميرا. استورد صوراً من جهازك وعدّلها كمسح ضوئي.', 'کوئی کیمرہ نہیں ملا۔ آلے سے تصاویر درآمد کریں اور اسکین کی طرح ترمیم کریں۔', 'Камеру не знайдено. Імпортуйте фото з пристрою й редагуйте як скан.', 'ካሜራ ኣይተረኽበን። ስእልታት ካብ መሳርሒ ኣእቱን ከም ስካን ኣመሓይሽን።'],
    'Keine Kanten gefunden, bitte Ecken ziehen': ['No edges found, please drag the corners', 'لبه‌ای پیدا نشد، لطفاً گوشه‌ها را بکش', 'لم يُعثر على حواف، يرجى سحب الزوايا', 'کوئی کنارے نہیں ملے، براہ کرم کونے کھینچیں', 'Краї не знайдено, перетягніть кути', 'ወሰናት ኣይተረኽቡን፣ በጃኻ ኩርናዓት ስሓብ'],
    'Keine Verbindung zum PC': ['No connection to the PC', 'اتصال به کامپیوتر نیست', 'لا اتصال بالحاسوب', 'PC سے رابطہ نہیں', 'Немає з’єднання з ПК', 'ምስ ኮምፒተር ርክብ የለን'],
    'Kontakt gespeichert': ['Contact saved', 'مخاطب ذخیره شد', 'تم حفظ جهة الاتصال', 'رابطہ محفوظ ہو گیا', 'Контакт збережено', 'ርክብ ተዓቂቡ'],
    'Kontaktdatei gespeichert – öffnen, um sie ins Adressbuch zu übernehmen': ['Contact file saved – open it to add it to your address book', 'فایل مخاطب ذخیره شد – برای افزودن به دفترچه تلفن بازش کن', 'تم حفظ ملف جهة الاتصال – افتحه لإضافته إلى دفتر العناوين', 'رابطے کی فائل محفوظ – ایڈریس بک میں شامل کرنے کے لیے کھولیں', 'Файл контакту збережено — відкрийте, щоб додати в адресну книгу', 'ፋይል ርክብ ተዓቂቡ – ናብ መዝገብ ኣድራሻ ንምውሳኽ ክፈቶ'],
    'Kopieren nicht möglich': ['Copying not possible', 'کپی ممکن نیست', 'النسخ غير ممكن', 'کاپی ممکن نہیں', 'Копіювання неможливе', 'ምቕዳሕ ኣይከኣልን'],
    'Kopieren nicht möglich, Text ist markiert': ['Copying not possible, the text is selected', 'کپی ممکن نیست، متن انتخاب شده است', 'النسخ غير ممكن، النص محدد', 'کاپی ممکن نہیں، متن منتخب ہے', 'Копіювання неможливе, текст виділено', 'ምቕዳሕ ኣይከኣልን፣ ጽሑፍ ተመሪጹ ኣሎ'],
    'Kopiert': ['Copied', 'کپی شد', 'تم النسخ', 'کاپی ہو گیا', 'Скопійовано', 'ተቐዲሑ'],
    'Licht nicht steuerbar': ['Light cannot be controlled', 'نور قابل کنترل نیست', 'لا يمكن التحكم بالضوء', 'روشنی کنٹرول نہیں ہو سکتی', 'Світлом не можна керувати', 'ብርሃን ክቆጻጸር ኣይከኣልን'],
    'Link öffnen': ['Open link', 'باز کردن لینک', 'فتح الرابط', 'لنک کھولیں', 'Відкрити посилання', 'ሊንክ ክፈት'],
    'Löschen fehlgeschlagen': ['Delete failed', 'حذف ناموفق بود', 'فشل الحذف', 'حذف ناکام', 'Не вдалося видалити', 'ምድምሳስ ኣይተዓወተን'],
    'Mobil': ['Mobile', 'موبایل', 'الجوال', 'موبائل', 'Мобільний', 'ሞባይል'],
    'Name': ['Name', 'نام', 'الاسم', 'نام', 'Ім’я', 'ስም'],
    'Neues Dokument. Das bisherige liegt in der Ablage.': ['New document. The previous one is in the library.', 'سند جدید. قبلی در بایگانی است.', 'مستند جديد. السابق موجود في الأرشيف.', 'نئی دستاویز۔ پچھلی محفوظات میں ہے۔', 'Новий документ. Попередній — в архіві.', 'ሓድሽ ሰነድ። እቲ ቀዳማይ ኣብ መዝገብ ኣሎ።'],
    'Nichts gefunden': ['Nothing found', 'چیزی پیدا نشد', 'لم يُعثر على شيء', 'کچھ نہیں ملا', 'Нічого не знайдено', 'ገለ ኣይተረኽበን'],
    'Noch keine Codes gescannt': ['No codes scanned yet', 'هنوز کدی اسکن نشده', 'لم تُمسح رموز بعد', 'ابھی کوئی کوڈ اسکین نہیں ہوا', 'Ще не відскановано кодів', 'ገና ኮድ ኣይተሰከነን'],
    'Noch keine Seiten': ['No pages yet', 'هنوز صفحه‌ای نیست', 'لا صفحات بعد', 'ابھی کوئی صفحہ نہیں', 'Ще немає сторінок', 'ገና ገጻት የለን'],
    'Noch keine Verbindung zum PC – Seiten bleiben hier, bitte gleich nochmal tippen.': ['No connection to the PC yet – pages stay here, please tap again in a moment.', 'هنوز اتصال به کامپیوتر نیست – صفحه‌ها اینجا می‌مانند، کمی بعد دوباره بزن.', 'لا اتصال بالحاسوب بعد – تبقى الصفحات هنا، اضغط مجدداً بعد قليل.', 'ابھی PC سے رابطہ نہیں – صفحات یہیں رہیں گے، تھوڑی دیر میں دوبارہ دبائیں۔', 'Ще немає з’єднання з ПК — сторінки залишаються тут, натисніть ще раз.', 'ገና ምስ ኮምፒተር ርክብ የለን – ገጻት ኣብዚ ይተርፉ፣ ቁሩብ ጸኒሕካ ደጊምካ ጠውቕ።'],
    'Noch nichts gespeichert. Gescannte Dokumente und Visitenkarten landen automatisch hier.': ['Nothing saved yet. Scanned documents and business cards land here automatically.', 'هنوز چیزی ذخیره نشده. سندها و کارت‌های ویزیت اسکن‌شده خودکار اینجا می‌آیند.', 'لم يُحفظ شيء بعد. تصل المستندات وبطاقات العمل الممسوحة إلى هنا تلقائياً.', 'ابھی کچھ محفوظ نہیں۔ اسکین شدہ دستاویزات اور وزیٹنگ کارڈز خود یہاں آتے ہیں۔', 'Ще нічого не збережено. Скановані документи й візитки потрапляють сюди автоматично.', 'ገና ዝተዓቀበ የለን። ዝተሰከኑ ሰነዳትን ካርድታትን ባዕሎም ኣብዚ ይመጹ።'],
    'Offen': ['Open', 'باز', 'مفتوح', 'کھلا', 'Відкрито', 'ክፉት'],
    'Ort': ['City', 'شهر', 'المدينة', 'شہر', 'Місто', 'ከተማ'],
    'PDF gespeichert (Teilen nicht verfügbar)': ['PDF saved (sharing not available)', 'PDF ذخیره شد (اشتراک در دسترس نیست)', 'تم حفظ PDF (المشاركة غير متاحة)', 'PDF محفوظ (شیئر دستیاب نہیں)', 'PDF збережено (поділитися неможливо)', 'PDF ተዓቂቡ (ምክፋል የለን)'],
    'PDF wird erstellt': ['Creating PDF', 'PDF ساخته می‌شود', 'جارٍ إنشاء PDF', 'PDF بن رہی ہے', 'Створення PDF', 'PDF ይፍጠር ኣሎ'],
    'Passwort kopieren': ['Copy password', 'کپی رمز', 'نسخ كلمة المرور', 'پاس ورڈ کاپی کریں', 'Копіювати пароль', 'ቃል-ምስጢር ቅዳሕ'],
    'Popup blockiert': ['Pop-up blocked', 'پنجره بازشو مسدود شد', 'تم حظر النافذة المنبثقة', 'پاپ اپ بلاک', 'Спливне вікно заблоковано', 'ፖፕ-ኣፕ ተዓጊቱ'],
    'Position': ['Position', 'سمت', 'المنصب', 'عہدہ', 'Посада', 'መዝነት'],
    'SD Lotse arbeitet lokal – der Kartentext verlässt dein Gerät nicht.': ['SD Lotse works locally – the card text does not leave your device.', 'SD Lotse محلی کار می‌کند – متن کارت از دستگاه تو بیرون نمی‌رود.', 'يعمل SD Lotse محلياً – لا يغادر نص البطاقة جهازك.', 'SD Lotse مقامی طور پر کام کرتا ہے – کارڈ کا متن آلے سے باہر نہیں جاتا۔', 'SD Lotse працює локально — текст картки не залишає пристрій.', 'SD Lotse ኣብ መሳርሒኻ ይሰርሕ – ጽሑፍ ካርድ ካብ መሳርሒኻ ኣይወጽእን።'],
    'Scanner schließen': ['Close scanner', 'بستن اسکنر', 'إغلاق الماسح', 'اسکینر بند کریں', 'Закрити сканер', 'ስካነር ዕጸው'],
    'Seite drehen': ['Rotate page', 'چرخاندن صفحه', 'تدوير الصفحة', 'صفحہ گھمائیں', 'Повернути сторінку', 'ገጽ ኣዙር'],
    'Seite gespeichert': ['Page saved', 'صفحه ذخیره شد', 'تم حفظ الصفحة', 'صفحہ محفوظ ہو گیا', 'Сторінку збережено', 'ገጽ ተዓቂቡ'],
    'Seite nicht lesbar': ['Page not readable', 'صفحه خوانا نیست', 'الصفحة غير مقروءة', 'صفحہ پڑھا نہیں جا سکتا', 'Сторінка не читається', 'ገጽ ኣይንበብን'],
    'Seite wird gedreht': ['Rotating page', 'صفحه می‌چرخد', 'جارٍ تدوير الصفحة', 'صفحہ گھوم رہا ہے', 'Поворот сторінки', 'ገጽ ይዝወር ኣሎ'],
    'Seite wird geladen': ['Loading page', 'صفحه بارگذاری می‌شود', 'جارٍ تحميل الصفحة', 'صفحہ لوڈ ہو رہا ہے', 'Завантаження сторінки', 'ገጽ ይጽዕን ኣሎ'],
    'Seite wird übernommen': ['Adding page', 'صفحه اضافه می‌شود', 'جارٍ إضافة الصفحة', 'صفحہ شامل ہو رہا ہے', 'Додавання сторінки', 'ገጽ ይውሰኽ ኣሎ'],
    'Seiten werden an den PC gesendet': ['Sending pages to the PC', 'صفحه‌ها به کامپیوتر فرستاده می‌شوند', 'جارٍ إرسال الصفحات إلى الحاسوب', 'صفحات PC کو بھیجے جا رہے ہیں', 'Надсилання сторінок на ПК', 'ገጻት ናብ ኮምፒተር ይለኣኹ ኣለዉ'],
    'Seiten werden übergeben': ['Handing over pages', 'صفحه‌ها منتقل می‌شوند', 'جارٍ تسليم الصفحات', 'صفحات منتقل ہو رہے ہیں', 'Передавання сторінок', 'ገጻት ይሰጋገሩ ኣለዉ'],
    'Senden fehlgeschlagen – die Seiten bleiben hier, bitte erneut versuchen.': ['Sending failed – the pages stay here, please try again.', 'ارسال ناموفق بود – صفحه‌ها اینجا می‌مانند، دوباره امتحان کن.', 'فشل الإرسال – تبقى الصفحات هنا، حاول مجدداً.', 'بھیجنا ناکام – صفحات یہیں رہیں گے، دوبارہ کوشش کریں۔', 'Не вдалося надіслати — сторінки залишаються тут, спробуйте ще раз.', 'ምልኣኽ ኣይተዓወተን – ገጻት ኣብዚ ይተርፉ፣ ደጊምካ ፈትን።'],
    'Speichern auf dem Gerät nicht möglich': ['Saving on the device is not possible', 'ذخیره روی دستگاه ممکن نیست', 'الحفظ على الجهاز غير ممكن', 'آلے پر محفوظ کرنا ممکن نہیں', 'Зберегти на пристрої неможливо', 'ኣብ መሳርሒ ምዕቃብ ኣይከኣልን'],
    'Speichern auf dem Gerät nicht möglich. Seiten bleiben nur bis zum Schließen.': ['Saving on the device is not possible. Pages are kept only until you close.', 'ذخیره روی دستگاه ممکن نیست. صفحه‌ها فقط تا بستن می‌مانند.', 'الحفظ على الجهاز غير ممكن. تبقى الصفحات حتى الإغلاق فقط.', 'آلے پر محفوظ کرنا ممکن نہیں۔ صفحات صرف بند کرنے تک رہیں گے۔', 'Зберегти на пристрої неможливо. Сторінки залишаться лише до закриття.', 'ኣብ መሳርሒ ምዕቃብ ኣይከኣልን። ገጻት ክሳብ ምዕጻው ጥራይ ይጸንሑ።'],
    'Sprachdaten werden vorbereitet': ['Preparing language data', 'داده‌های زبان آماده می‌شود', 'جارٍ تجهيز بيانات اللغة', 'زبان کا ڈیٹا تیار ہو رہا ہے', 'Підготовка мовних даних', 'ሓበሬታ ቋንቋ ይዳሎ ኣሎ'],
    'Straße': ['Street', 'خیابان', 'الشارع', 'گلی', 'Вулиця', 'ጎደና'],
    'Teilen fehlgeschlagen': ['Sharing failed', 'اشتراک ناموفق بود', 'فشلت المشاركة', 'شیئر ناکام', 'Не вдалося поділитися', 'ምክፋል ኣይተዓወተን'],
    'Teilen nicht verfügbar – Inhalt kopiert': ['Sharing not available – content copied', 'اشتراک در دسترس نیست – محتوا کپی شد', 'المشاركة غير متاحة – تم نسخ المحتوى', 'شیئر دستیاب نہیں – مواد کاپی ہو گیا', 'Поділитися неможливо — вміст скопійовано', 'ምክፋል የለን – ትሕዝቶ ተቐዲሑ'],
    'Teilen nicht verfügbar – Kontaktdatei gespeichert': ['Sharing not available – contact file saved', 'اشتراک در دسترس نیست – فایل مخاطب ذخیره شد', 'المشاركة غير متاحة – تم حفظ ملف جهة الاتصال', 'شیئر دستیاب نہیں – رابطے کی فائل محفوظ', 'Поділитися неможливо — файл контакту збережено', 'ምክፋል የለን – ፋይል ርክብ ተዓቂቡ'],
    'Telefon': ['Phone', 'تلفن', 'الهاتف', 'فون', 'Телефон', 'ተሌፎን'],
    'Text auf der Karte wird erkannt': ['Recognizing text on the card', 'متن روی کارت تشخیص داده می‌شود', 'جارٍ التعرف على نص البطاقة', 'کارڈ پر متن پہچانا جا رہا ہے', 'Розпізнавання тексту на картці', 'ጽሑፍ ኣብ ካርድ ይለለ ኣሎ'],
    'Text kopiert': ['Text copied', 'متن کپی شد', 'تم نسخ النص', 'متن کاپی ہو گیا', 'Текст скопійовано', 'ጽሑፍ ተቐዲሑ'],
    'Textdatei gespeichert': ['Text file saved', 'فایل متنی ذخیره شد', 'تم حفظ الملف النصي', 'متن فائل محفوظ', 'Текстовий файл збережено', 'ፋይል ጽሑፍ ተዓቂቡ'],
    'Texterkennung fehlgeschlagen': ['Text recognition failed', 'تشخیص متن ناموفق بود', 'فشل التعرف على النص', 'متن کی شناخت ناکام', 'Не вдалося розпізнати текст', 'ምልላይ ጽሑፍ ኣይተዓወተን'],
    'Texterkennung nicht verfügbar – bitte die Felder selbst ausfüllen.': ['Text recognition not available – please fill in the fields yourself.', 'تشخیص متن در دسترس نیست – لطفاً فیلدها را خودت پر کن.', 'التعرف على النص غير متاح – يرجى ملء الحقول بنفسك.', 'متن کی شناخت دستیاب نہیں – براہ کرم خانے خود بھریں۔', 'Розпізнавання тексту недоступне — заповніть поля самі.', 'ምልላይ ጽሑፍ የለን – በጃኻ ቦታታት ባዕልኻ ምላእ።'],
    'Texterkennung nicht verfügbar': ['Text recognition not available', 'تشخیص متن در دسترس نیست', 'التعرف على النص غير متاح', 'متن کی شناخت دستیاب نہیں', 'Розпізнавання тексту недоступне', 'ምልላይ ጽሑፍ የለን'],
    'Verbinde mit PC …': ['Connecting to PC …', 'اتصال به کامپیوتر …', 'جارٍ الاتصال بالحاسوب …', 'PC سے جڑ رہا ہے …', 'З’єднання з ПК …', 'ምስ ኮምፒተር ይራኸብ ኣሎ …'],
    'Visitenkarte gelöscht': ['Business card deleted', 'کارت ویزیت حذف شد', 'تم حذف بطاقة العمل', 'وزیٹنگ کارڈ حذف ہو گیا', 'Візитку видалено', 'ካርድ ቢዝነስ ተደምሲሱ'],
    'Visitenkarte nicht gefunden': ['Business card not found', 'کارت ویزیت پیدا نشد', 'لم يُعثر على بطاقة العمل', 'وزیٹنگ کارڈ نہیں ملا', 'Візитку не знайдено', 'ካርድ ቢዝነስ ኣይተረኽበን'],
    'Visitenkarten bitte einzeln importieren – die erste wird geöffnet': ['Please import business cards one at a time – the first one will be opened', 'لطفاً کارت‌های ویزیت را یکی‌یکی وارد کن – اولی باز می‌شود', 'يرجى استيراد بطاقات العمل واحدة تلو الأخرى – ستُفتح الأولى', 'براہ کرم وزیٹنگ کارڈز ایک ایک کر کے درآمد کریں – پہلا کھلے گا', 'Імпортуйте візитки по одній — буде відкрито першу', 'በጃኻ ካርድታት ሓደ ብሓደ ኣእቱ – እቲ ቀዳማይ ይኽፈት'],
    'Webseite': ['Website', 'وب‌سایت', 'الموقع', 'ویب سائٹ', 'Вебсайт', 'መርበብ'],
    'Wird ausgewertet …': ['Analyzing …', 'در حال ارزیابی …', 'جارٍ التحليل …', 'جائزہ جاری ہے …', 'Аналіз …', 'ይግምገም ኣሎ …'],
    'Zuschneiden fehlgeschlagen': ['Cropping failed', 'برش ناموفق بود', 'فشل القص', 'کاٹنا ناکام', 'Не вдалося обрізати', 'ምቑራጽ ኣይተዓወተን'],
    'kein Speicher': ['no storage', 'بدون حافظه', 'لا تخزين', 'کوئی اسٹوریج نہیں', 'немає сховища', 'መዘክር የለን'],
    'Öffnen fehlgeschlagen': ['Opening failed', 'باز کردن ناموفق بود', 'فشل الفتح', 'کھولنا ناکام', 'Не вдалося відкрити', 'ምኽፋት ኣይተዓወተን'],
    'Übergabe fehlgeschlagen': ['Handover failed', 'انتقال ناموفق بود', 'فشل التسليم', 'منتقلی ناکام', 'Не вдалося передати', 'ምስግጋር ኣይተዓወተን'],
    '✓ An PC senden': ['✓ Send to PC', '✓ ارسال به کامپیوتر', '✓ إرسال إلى الحاسوب', '✓ PC کو بھیجیں', '✓ Надіслати на ПК', '✓ ናብ ኮምፒተር ስደድ'],
    '✓ In die Mappe': ['✓ To the folder', '✓ به پوشه', '✓ إلى الملف', '✓ فولڈر میں', '✓ До папки', '✓ ናብ ማህደር'],
    '✓ Ins PDF-Studio': ['✓ To PDF Studio', '✓ به استودیو PDF', '✓ إلى استوديو PDF', '✓ PDF اسٹوڈیو میں', '✓ До PDF-студії', '✓ ናብ PDF ስቱድዮ'],
    '✓ Mit PC verbunden': ['✓ Connected to PC', '✓ به کامپیوتر وصل است', '✓ متصل بالحاسوب', '✓ PC سے جڑا ہوا', '✓ З’єднано з ПК', '✓ ምስ ኮምፒተር ተራኺቡ'],
    '1 Seite an den PC gesendet': ['1 page sent to the PC', '۱ صفحه به کامپیوتر فرستاده شد', 'أُرسلت صفحة واحدة إلى الحاسوب', '1 صفحہ PC کو بھیجا گیا', '1 сторінку надіслано на ПК', '1 ገጽ ናብ ኮምፒተር ተላኢኹ'],
    'Visitenkarte mit KI ausfüllen': ['Fill in business card with AI', 'پر کردن کارت ویزیت با هوش مصنوعی', 'تعبئة بطاقة العمل بالذكاء الاصطناعي', 'وزیٹنگ کارڈ AI سے بھریں', 'Заповнити візитку за допомогою ШІ', 'ካርድ ቢዝነስ ብ AI ምላእ'],
    'Ablage nicht verfügbar (Browser-Speicher gesperrt).': ['Library not available (browser storage blocked).', 'بایگانی در دسترس نیست (حافظه مرورگر مسدود است).', 'الأرشيف غير متاح (تخزين المتصفح محظور).', 'محفوظات دستیاب نہیں (براؤزر اسٹوریج بند)۔', 'Архів недоступний (сховище браузера заблоковано).', 'መዝገብ የለን (መዘክር መርበብ ተዓጽዩ)።'],
    'Sprache': ['Language', 'زبان', 'اللغة', 'زبان', 'Мова', 'ቋንቋ']
  };
  // Texte mit Zahlen oder Namen
  const P = [
    [/^(\d+) Seiten?$/, ['$1 page(s)', '$1 صفحه', '$1 صفحات', '$1 صفحات', '$1 стор.', '$1 ገጻት']],
    [/^(\d+) Seiten an den PC gesendet$/, ['$1 pages sent to the PC', '$1 صفحه به کامپیوتر فرستاده شد', 'أُرسلت $1 صفحات إلى الحاسوب', '$1 صفحات PC کو بھیجے گئے', '$1 стор. надіслано на ПК', '$1 ገጻት ናብ ኮምፒተር ተላኢኾም']],
    [/^Text wird erkannt (\d+) von (\d+)$/, ['Recognizing text $1 of $2', 'تشخیص متن $1 از $2', 'التعرف على النص $1 من $2', 'متن کی شناخت $2 میں سے $1', 'Розпізнавання тексту $1 з $2', 'ምልላይ ጽሑፍ $1 ካብ $2']],
    [/^Alles bleibt nur in diesem Browser auf diesem Gerät · belegt: (.+) MB$/, ['Everything stays only in this browser on this device · used: $1 MB', 'همه‌چیز فقط در همین مرورگر روی همین دستگاه می‌ماند · اشغال: $1 MB', 'يبقى كل شيء في هذا المتصفح على هذا الجهاز فقط · المستخدم: $1 MB', 'سب کچھ صرف اسی براؤزر میں رہتا ہے · استعمال: $1 MB', 'Усе залишається лише в цьому браузері · зайнято: $1 MB', 'ኩሉ ኣብዚ መርበብ ጥራይ ይተርፍ · ተታሒዙ: $1 MB']],
    [/^Die KI hat (\d+) Felde?r? ausgefüllt oder verbessert – bitte prüfen\.$/, ['The AI filled in or improved $1 field(s) – please check.', 'هوش مصنوعی $1 فیلد را پر یا بهتر کرد – لطفاً بررسی کن.', 'ملأ الذكاء الاصطناعي أو حسّن $1 حقول – يرجى المراجعة.', 'AI نے $1 خانے بھرے یا بہتر کیے – براہ کرم جانچیں۔', 'ШІ заповнив або покращив полів: $1 — перевірте.', 'AI $1 ቦታታት መሊኡ ወይ ኣመሓይሹ – በጃኻ ፈትሽ።']],
    [/^„(.+)“ endgültig löschen\?$/, ['Delete “$1” permanently?', '«$1» برای همیشه حذف شود؟', 'حذف «$1» نهائياً؟', '«$1» مستقل طور پر حذف کریں؟', 'Остаточно видалити «$1»?', '«$1» ንሓዋሩ ይደምሰስ?']],
    [/^✓ An PC \((\d+)\)$/, ['✓ To PC ($1)', '✓ به کامپیوتر ($1)', '✓ إلى الحاسوب ($1)', '✓ PC کو ($1)', '✓ На ПК ($1)', '✓ ናብ ኮምፒተር ($1)']],
    [/^Bild nicht lesbar: (.+)$/, ['Image not readable: $1', 'تصویر خوانا نیست: $1', 'الصورة غير مقروءة: $1', 'تصویر پڑھی نہیں جا سکتی: $1', 'Зображення не читається: $1', 'ስእሊ ኣይንበብን: $1']],
    [/^Laden fehlgeschlagen: (.+)$/, ['Loading failed: $1', 'بارگذاری ناموفق بود: $1', 'فشل التحميل: $1', 'لوڈ ناکام: $1', 'Не вдалося завантажити: $1', 'ምጽዓን ኣይተዓወተን: $1']],
    [/^Öffnet die Seite (.+) in einem neuen Tab\. Nur öffnen, wenn du der Quelle vertraust\.$/, ['Opens the page $1 in a new tab. Only open it if you trust the source.', 'صفحه $1 را در زبانه جدید باز می‌کند. فقط اگر به منبع اعتماد داری باز کن.', 'يفتح الصفحة $1 في علامة تبويب جديدة. افتحها فقط إذا كنت تثق بالمصدر.', 'صفحہ $1 نئے ٹیب میں کھولتا ہے۔ صرف تب کھولیں جب ماخذ پر بھروسہ ہو۔', 'Відкриває сторінку $1 у новій вкладці. Відкривайте, лише якщо довіряєте джерелу.', 'ገጽ $1 ኣብ ሓድሽ ታብ ይኸፍት። ነቲ ምንጪ እንተ ኣመንካዮ ጥራይ ክፈቶ።']]
  ];
  const col = SPR.indexOf(lang);

  function uebersetze(s) {
    if (col < 0 || !s) return null;
    const kern = s.trim();
    if (!kern) return null;
    const w = W[kern];
    if (w) return s.replace(kern, w[col]);
    for (const [re, z] of P) { if (re.test(kern)) return s.replace(kern, kern.replace(re, z[col])); }
    return null;
  }
  const NICHT = 'TEXTAREA,SCRIPT,STYLE,#codeValue,#docName,#textOut';
  function knoten(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement;
      if (!p || p.closest(NICHT)) return;
      const u = uebersetze(n.nodeValue);
      if (u != null && u !== n.nodeValue) n.nodeValue = u;
    } else if (n.nodeType === 1) {
      if (n.matches && n.matches(NICHT)) return;
      ['placeholder', 'aria-label', 'title', 'alt'].forEach(a => {
        const v = n.getAttribute && n.getAttribute(a);
        if (v) { const u = uebersetze(v); if (u != null && u !== v) n.setAttribute(a, u); }
      });
      n.childNodes && n.childNodes.forEach(knoten);
    }
  }
  if (col >= 0) {
    const origConfirm = window.confirm.bind(window);
    window.confirm = (m) => origConfirm(uebersetze(String(m)) || m);
    document.documentElement.lang = lang;
    if (RTL.includes(lang)) {
      const st = document.createElement('style');
      st.textContent = '.sheet,.toast,.busy,.live-hint,.no-cam,.text-note{direction:rtl}.sheet input,.sheet textarea,#codeValue{direction:ltr;unicode-bidi:plaintext}';
      document.head.appendChild(st);
    }
  }

  function sprachwahl() {
    const inner = document.querySelector('#libSheet .sheet-inner');
    if (!inner || document.getElementById('sdSprachwahl')) return;
    const row = document.createElement('label');
    row.className = 'doc-name-row';
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    row.innerHTML = '<span>🌐 ' + (col >= 0 ? W['Sprache'][col] : 'Sprache') + '</span>';
    const sel = document.createElement('select');
    sel.id = 'sdSprachwahl';
    sel.className = 'doc-name';
    sel.style.maxWidth = '180px';
    sel.innerHTML = Object.keys(NAMEN).map(l => '<option value="' + l + '">' + NAMEN[l] + '</option>').join('');
    sel.value = lang;
    sel.addEventListener('change', () => { try { localStorage.setItem('sdSprache', sel.value); } catch (e) { /* ohne Speicher */ } location.reload(); });
    row.appendChild(sel);
    const note = document.getElementById('libNote');
    inner.insertBefore(row, note || null);
  }

  function start() {
    sprachwahl();
    if (col < 0) return;
    knoten(document.body);
    new MutationObserver(ms => ms.forEach(m => {
      if (m.type === 'characterData') knoten(m.target);
      else if (m.type === 'attributes') knoten(m.target);
      else m.addedNodes.forEach(knoten);
    })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'aria-label', 'title', 'alt'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
