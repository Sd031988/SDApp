/* Bewerbungs-Tracker: weitere Sprachen. Noch nicht von Muttersprachlern geprüft. */
(function () {
  const X = {
    fa: {
      titel: 'پیگیری درخواست‌ها', untertitel: 'همه درخواست‌ها، وقت‌ها و هزینه‌ها در یک نگاه', neu: '＋ درخواست جدید', suche: 'جستجوی شرکت یا شغل …', werkzeuge: '🧰 ابزارها',
      steuer_info: 'هزینه‌های درخواست کار (پوشه، پست، عکس) و رفت‌وآمد به مصاحبه را می‌توانی از مالیات کم کنی. با یک ضربه به کمک مالیاتی می‌روند – به ترتیب سال.', steuer_btn: '🧾 انتقال هزینه‌ها به کمک مالیاتی', steuer_oeffnen: 'باز کردن کمک مالیاتی',
      daten_info: '🔒 درخواست‌هایت فقط در همین مرورگر روی دستگاه تو ذخیره می‌شوند. با پشتیبان‌گیری می‌توانی آن‌ها را با خودت ببری؛ به‌صورت جدول (CSV) در Excel هم باز می‌شوند.', csv: '📊 به‌صورت جدول (CSV)', export: '⬇️ پشتیبان', import: '⬆️ بارگیری پشتیبان', alle_loeschen: '🗑️ حذف همه',
      dlg_neu: 'درخواست جدید', dlg_bearbeiten: 'ویرایش درخواست', f_firma_l: 'شرکت', f_position_l: 'شغل', f_ort_l: 'محل', f_status_l: 'وضعیت', f_link_l: 'لینک آگهی کار', f_kontakt_l: 'شخص تماس', f_kontakt_ph: 'مثلاً Frau Müller', f_kontaktinfo_l: 'ایمیل / تلفن',
      f_beworben_l: 'تاریخ درخواست', f_frist_l: 'مهلت درخواست', f_schritt_l: 'قدم بعدی', f_schritt_ph: 'مثلاً مصاحبه، پیگیری', f_schrittam_l: 'در تاریخ', f_kosten_l: 'هزینه درخواست (€)', f_kosten_ph: 'پوشه، پست، عکس', f_km_l: 'رفت‌وآمد به مصاحبه (کیلومتر رفت + برگشت)', f_notizen_l: 'یادداشت',
      speichern: 'ذخیره', abbrechen: 'لغو', loeschen: 'حذف', st_gemerkt: 'نگه‌داشته', st_beworben: 'درخواست داده', st_gespraech: 'مصاحبه', st_zusage: 'قبول', st_absage: 'رد', alle: 'همه',
      z_gesamt: 'درخواست‌ها', z_gespraech: 'مصاحبه‌ها', z_zusage: 'قبولی‌ها', z_antwort: 'نرخ جواب', leer: 'هنوز چیزی اینجا نیست.', leer_start: 'هنوز درخواستی نیست. روی «＋ درخواست جدید» بزن.', beworben_am: 'درخواست در {d}', frist_bis: 'مهلت تا {d}', heute: 'امروز', ueberfaellig: 'گذشته',
      b_anschreiben: '✍️ نامه درخواست', b_ueben: '🎤 تمرین', t_ueben: 'تمرین مصاحبه برای این شغل', t_bearbeiten: 'ویرایش', t_kalender: 'وقت در تقویم', t_anzeige: 'باز کردن آگهی کار', t_anschreiben: 'نوشتن نامه برای این شغل در برنامه رزومه',
      er_titel: '🔔 یادآوری‌ها', er_faellig: '{firma}: «{schritt}» – {wann}', er_nachfassen: '{firma}: {tage} روز بدون جواب – پیگیری کنی؟', er_frist: '{firma}: مهلت درخواست {wann}', er_oeffnen: 'باز کردن', in_tagen: '{n} روز دیگر', morgen: 'فردا',
      steuer_ok: '✓ منتقل شد: {n} مورد برای {jahre}. موارد قبلی به‌روز شدند، دوباره ساخته نشدند.', steuer_leer: 'درخواستی با هزینه یا کیلومتر و «تاریخ درخواست» پیدا نشد.', loeschen_frage: 'این درخواست حذف شود؟', alle_frage: 'واقعاً همه درخواست‌ها روی این دستگاه حذف شوند؟',
      import_frage: 'پشتیبان بارگیری شود؟ درخواست‌های با همان شناسه جایگزین می‌شوند، بقیه می‌مانند.', import_ok: '✓ پشتیبان بارگیری شد ({n} درخواست).', import_fehler: 'فایل خوانده نشد.', export_ok: '✓ پشتیبان دانلود شد.', geloescht: '✓ حذف شد.'
    },
    ar: {
      titel: 'متتبع الطلبات', untertitel: 'كل الطلبات والمواعيد والتكاليف أمامك', neu: '＋ طلب جديد', suche: 'ابحث عن شركة أو وظيفة …', werkzeuge: '🧰 أدوات',
      steuer_info: 'يمكنك خصم تكاليف التقديم (الملفات، البريد، الصور) ورحلات المقابلات من الضرائب. بضغطة تنتقل إلى مساعد الضرائب – مرتبة حسب السنة.', steuer_btn: '🧾 نقل التكاليف إلى مساعد الضرائب', steuer_oeffnen: 'فتح مساعد الضرائب',
      daten_info: '🔒 تُحفظ طلباتك في هذا المتصفح على جهازك فقط. بالنسخة الاحتياطية يمكنك نقلها؛ وكجدول (CSV) تفتح في Excel أيضاً.', csv: '📊 كجدول (CSV)', export: '⬇️ نسخة احتياطية', import: '⬆️ تحميل نسخة احتياطية', alle_loeschen: '🗑️ حذف الكل',
      dlg_neu: 'طلب جديد', dlg_bearbeiten: 'تعديل الطلب', f_firma_l: 'الشركة', f_position_l: 'الوظيفة', f_ort_l: 'المكان', f_status_l: 'الحالة', f_link_l: 'رابط إعلان الوظيفة', f_kontakt_l: 'الشخص المسؤول', f_kontakt_ph: 'مثلاً Frau Müller', f_kontaktinfo_l: 'البريد / الهاتف',
      f_beworben_l: 'تاريخ التقديم', f_frist_l: 'آخر موعد للتقديم', f_schritt_l: 'الخطوة التالية', f_schritt_ph: 'مثلاً مقابلة، متابعة', f_schrittam_l: 'في', f_kosten_l: 'تكاليف التقديم (€)', f_kosten_ph: 'ملف، بريد، صور', f_km_l: 'الرحلة إلى المقابلة (كم ذهاباً وإياباً)', f_notizen_l: 'ملاحظات',
      speichern: 'حفظ', abbrechen: 'إلغاء', loeschen: 'حذف', st_gemerkt: 'محفوظ', st_beworben: 'تم التقديم', st_gespraech: 'مقابلة', st_zusage: 'قبول', st_absage: 'رفض', alle: 'الكل',
      z_gesamt: 'الطلبات', z_gespraech: 'المقابلات', z_zusage: 'القبولات', z_antwort: 'نسبة الردود', leer: 'لا شيء هنا بعد.', leer_start: 'لا توجد طلبات بعد. اضغط «＋ طلب جديد».', beworben_am: 'قُدّم في {d}', frist_bis: 'المهلة حتى {d}', heute: 'اليوم', ueberfaellig: 'متأخر',
      b_anschreiben: '✍️ رسالة التقديم', b_ueben: '🎤 تدريب', t_ueben: 'التدرّب على مقابلة هذه الوظيفة', t_bearbeiten: 'تعديل', t_kalender: 'الموعد في التقويم', t_anzeige: 'فتح إعلان الوظيفة', t_anschreiben: 'كتابة رسالة لهذه الوظيفة في تطبيق السيرة الذاتية',
      er_titel: '🔔 تذكيرات', er_faellig: '{firma}: «{schritt}» – {wann}', er_nachfassen: '{firma}: لا رد منذ {tage} يوماً – هل تتابع؟', er_frist: '{firma}: آخر موعد للتقديم {wann}', er_oeffnen: 'فتح', in_tagen: 'بعد {n} أيام', morgen: 'غداً',
      steuer_ok: '✓ تم النقل: {n} بنداً لـ {jahre}. البنود المنقولة سابقاً حُدّثت ولم تتكرر.', steuer_leer: 'لم يُعثر على طلب بتكاليف أو كيلومترات وتاريخ تقديم.', loeschen_frage: 'حذف هذا الطلب؟', alle_frage: 'هل تريد حقاً حذف كل الطلبات على هذا الجهاز؟',
      import_frage: 'تحميل النسخة الاحتياطية؟ الطلبات ذات المعرّف نفسه تُستبدل والأخرى تبقى.', import_ok: '✓ تم تحميل النسخة الاحتياطية ({n} طلباً).', import_fehler: 'تعذّرت قراءة الملف.', export_ok: '✓ تم تنزيل النسخة الاحتياطية.', geloescht: '✓ تم الحذف.'
    },
    ur: {
      titel: 'درخواست ٹریکر', untertitel: 'تمام درخواستیں، ملاقاتیں اور اخراجات ایک نظر میں', neu: '＋ نئی درخواست', suche: 'کمپنی یا نوکری تلاش کریں …', werkzeuge: '🧰 اوزار',
      steuer_info: 'درخواست کے اخراجات (فولڈر، ڈاک، تصاویر) اور انٹرویو کے سفر ٹیکس سے منہا کیے جا سکتے ہیں۔ ایک ٹیپ سے یہ ٹیکس مددگار میں چلے جاتے ہیں – سال کے حساب سے۔', steuer_btn: '🧾 اخراجات ٹیکس مددگار میں منتقل کریں', steuer_oeffnen: 'ٹیکس مددگار کھولیں',
      daten_info: '🔒 آپ کی درخواستیں صرف اسی براؤزر میں آپ کے آلے پر محفوظ ہوتی ہیں۔ بیک اپ سے انہیں ساتھ لے جا سکتے ہیں؛ جدول (CSV) کے طور پر Excel میں بھی کھلتی ہیں۔', csv: '📊 جدول (CSV) کے طور پر', export: '⬇️ بیک اپ', import: '⬆️ بیک اپ لوڈ کریں', alle_loeschen: '🗑️ سب حذف کریں',
      dlg_neu: 'نئی درخواست', dlg_bearbeiten: 'درخواست میں ترمیم', f_firma_l: 'کمپنی', f_position_l: 'نوکری', f_ort_l: 'جگہ', f_status_l: 'حیثیت', f_link_l: 'نوکری کے اشتہار کا لنک', f_kontakt_l: 'رابطہ شخص', f_kontakt_ph: 'مثلاً Frau Müller', f_kontaktinfo_l: 'ای میل / فون',
      f_beworben_l: 'درخواست کی تاریخ', f_frist_l: 'درخواست کی آخری تاریخ', f_schritt_l: 'اگلا قدم', f_schritt_ph: 'مثلاً انٹرویو، پوچھنا', f_schrittam_l: 'تاریخ', f_kosten_l: 'درخواست کے اخراجات (€)', f_kosten_ph: 'فولڈر، ڈاک، تصاویر', f_km_l: 'انٹرویو کا سفر (کلومیٹر آنا جانا)', f_notizen_l: 'نوٹس',
      speichern: 'محفوظ کریں', abbrechen: 'منسوخ', loeschen: 'حذف کریں', st_gemerkt: 'محفوظ', st_beworben: 'درخواست دی', st_gespraech: 'انٹرویو', st_zusage: 'منظوری', st_absage: 'انکار', alle: 'سب',
      z_gesamt: 'درخواستیں', z_gespraech: 'انٹرویو', z_zusage: 'منظوریاں', z_antwort: 'جواب کی شرح', leer: 'ابھی یہاں کچھ نہیں۔', leer_start: 'ابھی کوئی درخواست نہیں۔ «＋ نئی درخواست» پر ٹیپ کریں۔', beworben_am: '{d} کو درخواست دی', frist_bis: '{d} تک آخری تاریخ', heute: 'آج', ueberfaellig: 'تاخیر شدہ',
      b_anschreiben: '✍️ درخواست کا خط', b_ueben: '🎤 مشق', t_ueben: 'اس نوکری کے انٹرویو کی مشق', t_bearbeiten: 'ترمیم', t_kalender: 'ملاقات کیلنڈر میں', t_anzeige: 'نوکری کا اشتہار کھولیں', t_anschreiben: 'سی وی ایپ میں اس نوکری کا خط لکھیں',
      er_titel: '🔔 یاد دہانیاں', er_faellig: '{firma}: «{schritt}» – {wann}', er_nachfassen: '{firma}: {tage} دن سے کوئی جواب نہیں – پوچھیں؟', er_frist: '{firma}: درخواست کی آخری تاریخ {wann}', er_oeffnen: 'کھولیں', in_tagen: '{n} دن میں', morgen: 'کل',
      steuer_ok: '✓ منتقل: {jahre} کے لیے {n} اندراج۔ پہلے منتقل شدہ اپ ڈیٹ ہوئے، دوبارہ نہیں بنے۔', steuer_leer: 'اخراجات یا کلومیٹر اور درخواست کی تاریخ والی کوئی درخواست نہیں ملی۔', loeschen_frage: 'یہ درخواست حذف کریں؟', alle_frage: 'کیا واقعی اس آلے پر تمام درخواستیں حذف کریں؟',
      import_frage: 'بیک اپ لوڈ کریں؟ ایک جیسی شناخت والی درخواستیں بدل جائیں گی، باقی رہیں گی۔', import_ok: '✓ بیک اپ لوڈ ہو گیا ({n} درخواستیں)۔', import_fehler: 'فائل پڑھی نہیں جا سکی۔', export_ok: '✓ بیک اپ ڈاؤن لوڈ ہو گیا۔', geloescht: '✓ حذف ہو گیا۔'
    },
    uk: {
      titel: 'Трекер заявок', untertitel: 'Усі заявки, зустрічі й витрати на виду', neu: '＋ Нова заявка', suche: 'Шукати компанію чи посаду …', werkzeuge: '🧰 Інструменти',
      steuer_info: 'Витрати на заявки (папки, пошта, фото) та поїздки на співбесіди можна відняти від податків. Одним дотиком вони потрапляють у податкового помічника — за роками.', steuer_btn: '🧾 Перенести витрати в податкового помічника', steuer_oeffnen: 'Відкрити податкового помічника',
      daten_info: '🔒 Ваші заявки зберігаються лише в цьому браузері на вашому пристрої. Резервна копія дозволяє взяти їх із собою; як таблиця (CSV) вони відкриваються й в Excel.', csv: '📊 Як таблиця (CSV)', export: '⬇️ Резервна копія', import: '⬆️ Завантажити копію', alle_loeschen: '🗑️ Видалити все',
      dlg_neu: 'Нова заявка', dlg_bearbeiten: 'Редагувати заявку', f_firma_l: 'Компанія', f_position_l: 'Посада', f_ort_l: 'Місце', f_status_l: 'Статус', f_link_l: 'Посилання на вакансію', f_kontakt_l: 'Контактна особа', f_kontakt_ph: 'напр. Frau Müller', f_kontaktinfo_l: 'Ел. пошта / телефон',
      f_beworben_l: 'Дата заявки', f_frist_l: 'Строк подання', f_schritt_l: 'Наступний крок', f_schritt_ph: 'напр. співбесіда, уточнити', f_schrittam_l: 'дата', f_kosten_l: 'Витрати на заявку (€)', f_kosten_ph: 'Папка, пошта, фото', f_km_l: 'Поїздка на співбесіду (км туди й назад)', f_notizen_l: 'Нотатки',
      speichern: 'Зберегти', abbrechen: 'Скасувати', loeschen: 'Видалити', st_gemerkt: 'Збережено', st_beworben: 'Подано', st_gespraech: 'Співбесіда', st_zusage: 'Прийнято', st_absage: 'Відмова', alle: 'Усі',
      z_gesamt: 'Заявки', z_gespraech: 'Співбесіди', z_zusage: 'Пропозиції', z_antwort: 'Частка відповідей', leer: 'Тут поки нічого.', leer_start: 'Заявок ще немає. Натисніть «＋ Нова заявка».', beworben_am: 'подано {d}', frist_bis: 'строк до {d}', heute: 'сьогодні', ueberfaellig: 'прострочено',
      b_anschreiben: '✍️ Супровідний лист', b_ueben: '🎤 Тренування', t_ueben: 'Тренувати співбесіду на цю посаду', t_bearbeiten: 'Редагувати', t_kalender: 'Зустріч у календар', t_anzeige: 'Відкрити вакансію', t_anschreiben: 'Написати лист до цієї посади в застосунку резюме',
      er_titel: '🔔 Нагадування', er_faellig: '{firma}: «{schritt}» — {wann}', er_nachfassen: '{firma}: {tage} днів без відповіді — уточнити?', er_frist: '{firma}: строк подання {wann}', er_oeffnen: 'відкрити', in_tagen: 'через {n} днів', morgen: 'завтра',
      steuer_ok: '✓ Перенесено: {n} позицій за {jahre}. Уже перенесені записи оновлено, не продубльовано.', steuer_leer: 'Не знайдено заявок із витратами чи кілометрами та датою подання.', loeschen_frage: 'Видалити цю заявку?', alle_frage: 'Справді видалити ВСІ заявки на цьому пристрої?',
      import_frage: 'Завантажити копію? Заявки з тим самим ідентифікатором буде замінено, інші залишаться.', import_ok: '✓ Копію завантажено ({n} заявок).', import_fehler: 'Не вдалося прочитати файл.', export_ok: '✓ Копію завантажено.', geloescht: '✓ Видалено.'
    },
    ti: {
      titel: 'መከታተሊ ሕቶታት ስራሕ', untertitel: 'ኩሎም ሕቶታት፣ ቆጸራታትን ወጻኢታትን ኣብ ሓደ ትርኢት', neu: '＋ ሓድሽ ሕቶ ስራሕ', suche: 'ትካል ወይ ስራሕ ድለ …', werkzeuge: '🧰 መሳርሒታት',
      steuer_info: 'ወጻኢ ሕቶ ስራሕ (ፋይል፣ ፖስታ፣ ስእልታት) ከምኡ’ውን ጉዕዞ ናብ ቃለ-መሕትት ካብ ግብሪ ክትቕንሶ ትኽእል። ብሓደ ምጥዋቕ ናብ ሓጋዚ ግብሪ ይኸዱ – ብዓመት ተሰሪዖም።', steuer_btn: '🧾 ወጻኢታት ናብ ሓጋዚ ግብሪ ኣሰጋግር', steuer_oeffnen: 'ሓጋዚ ግብሪ ክፈት',
      daten_info: '🔒 ሕቶታትካ ኣብዚ መርበብ ኣብ መሳርሒኻ ጥራይ ይዕቀቡ። ብቅዳሕ ውሕስነት ምሳኻ ክትወስዶም ትኽእል፤ ከም ሰንጠረዥ (CSV) ኣብ Excel እውን ይኽፈቱ።', csv: '📊 ከም ሰንጠረዥ (CSV)', export: '⬇️ ቅዳሕ ውሕስነት', import: '⬆️ ቅዳሕ ውሕስነት ጽዓን', alle_loeschen: '🗑️ ኩሉ ደምስስ',
      dlg_neu: 'ሓድሽ ሕቶ ስራሕ', dlg_bearbeiten: 'ሕቶ ስራሕ ኣስተኻኽል', f_firma_l: 'ትካል', f_position_l: 'ስራሕ', f_ort_l: 'ቦታ', f_status_l: 'ኩነታት', f_link_l: 'ሊንክ ምልክታ ስራሕ', f_kontakt_l: 'ሰብ ርክብ', f_kontakt_ph: 'ንኣብነት Frau Müller', f_kontaktinfo_l: 'ኢመይል / ተሌፎን',
      f_beworben_l: 'ዕለት ሕቶ', f_frist_l: 'ግዜ ገደብ ሕቶ', f_schritt_l: 'ቀጻሊ ስጉምቲ', f_schritt_ph: 'ንኣብነት ቃለ-መሕትት፣ ምሕታት', f_schrittam_l: 'ብዕለት', f_kosten_l: 'ወጻኢ ሕቶ ስራሕ (€)', f_kosten_ph: 'ፋይል፣ ፖስታ፣ ስእልታት', f_km_l: 'ጉዕዞ ናብ ቃለ-መሕትት (ኪሜ ምኻድ + ምምላስ)', f_notizen_l: 'መዘኻኸሪታት',
      speichern: 'ዓቅብ', abbrechen: 'ሰርዝ', loeschen: 'ደምስስ', st_gemerkt: 'ተዓቂቡ', st_beworben: 'ተሓቲቱ', st_gespraech: 'ቃለ-መሕትት', st_zusage: 'ተቐባልነት', st_absage: 'ተነጺጉ', alle: 'ኩሉ',
      z_gesamt: 'ሕቶታት', z_gespraech: 'ቃለ-መሕትታት', z_zusage: 'ተቐባልነታት', z_antwort: 'መጠን መልሲ', leer: 'ገና ኣብዚ ዝኾነ የለን።', leer_start: 'ገና ሕቶ ስራሕ የለን። ኣብ «＋ ሓድሽ ሕቶ ስራሕ» ጠውቕ።', beworben_am: 'ብ {d} ተሓቲቱ', frist_bis: 'ግዜ ገደብ ክሳብ {d}', heute: 'ሎሚ', ueberfaellig: 'ሓሊፉ',
      b_anschreiben: '✍️ ደብዳበ ሕቶ ስራሕ', b_ueben: '🎤 ተለማመድ', t_ueben: 'ቃለ-መሕትት ነዚ ስራሕ ተለማመድ', t_bearbeiten: 'ኣስተኻኽል', t_kalender: 'ቆጸራ ናብ ካላንደር', t_anzeige: 'ምልክታ ስራሕ ክፈት', t_anschreiben: 'ነዚ ስራሕ ደብዳበ ኣብ ኣፕ ታሪኽ ህይወት ጽሓፍ',
      er_titel: '🔔 መዘኻኸሪታት', er_faellig: '{firma}: «{schritt}» – {wann}', er_nachfassen: '{firma}: ካብ {tage} መዓልቲ መልሲ የለን – ክትሓትት?', er_frist: '{firma}: ግዜ ገደብ ሕቶ {wann}', er_oeffnen: 'ክፈት', in_tagen: 'ድሕሪ {n} መዓልቲ', morgen: 'ጽባሕ',
      steuer_ok: '✓ ተሰጋጊሩ: {n} ኣቕሓታት ን {jahre}። ቅድሚኡ ዝተሰጋገሩ ተሓዲሶም፣ ኣይተደገሙን።', steuer_leer: 'ወጻኢ ወይ ኪሜ ምስ ዕለት ሕቶ ዘለዎ ሕቶ ስራሕ ኣይተረኽበን።', loeschen_frage: 'እዚ ሕቶ ስራሕ ይደምሰስ?', alle_frage: 'ብሓቂ ኩሎም ሕቶታት ኣብዚ መሳርሒ ይደምሰሱ?',
      import_frage: 'ቅዳሕ ውሕስነት ይጽዓን? ሓደ መለለዪ ዘለዎም ሕቶታት ይቕየሩ፣ ካልኦት ይተርፉ።', import_ok: '✓ ቅዳሕ ውሕስነት ተጻዒኑ ({n} ሕቶታት)።', import_fehler: 'ፋይል ክንበብ ኣይከኣለን።', export_ok: '✓ ቅዳሕ ውሕስነት ወሪዱ።', geloescht: '✓ ተደምሲሱ።'
    }
  };
  Object.keys(X).forEach(l => { window.SD_I18N[l] = Object.assign({}, window.SD_I18N.de, X[l]); });
})();
