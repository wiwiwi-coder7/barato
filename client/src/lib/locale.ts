export const APP_LOCALES = ["fa", "en", "ar"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_META: Record<AppLocale, { label: string; nativeLabel: string; dir: "rtl" | "ltr"; formatting: string }> = {
  fa: { label: "فارسی", nativeLabel: "فارسی", dir: "rtl", formatting: "fa-IR" },
  en: { label: "English", nativeLabel: "English", dir: "ltr", formatting: "en-US" },
  ar: { label: "العربية", nativeLabel: "العربية", dir: "rtl", formatting: "ar-SA" },
};

type Translation = Record<AppLocale, string>;
const translations = new Map<string, Translation>();

function register(fa: string, en: string, ar: string) {
  const translation = { fa, en, ar } satisfies Translation;
  [fa, en, ar].forEach(source => translations.set(source, translation));
}

[
  ["برای تو", "For You", "لك"], ["مدیریت لینک‌های شخصی", "Manage personal links", "إدارة الروابط الشخصية"],
  ["زبان سایت", "Site language", "لغة الموقع"],
  ["پنل مدیریت", "Admin panel", "لوحة الإدارة"], ["ساخت لینک", "Create link", "إنشاء رابط"], ["ساخت لینک تازه", "Create new link", "إنشاء رابط جديد"],
  ["ورود به پنل", "Sign in", "تسجيل الدخول"], ["خروج", "Sign out", "تسجيل الخروج"], ["خروج از پنل", "Sign out of admin", "تسجيل الخروج من لوحة الإدارة"],
  ["بازگشت به ساخت لینک", "Back to link creation", "العودة إلى إنشاء الرابط"], ["رمز مدیریت", "Admin password", "كلمة مرور الإدارة"],
  ["رمز را وارد کن", "Enter password", "أدخل كلمة المرور"], ["رمز اختصاصی مدیر را وارد کن تا لینک‌هایت را مدیریت کنی.", "Enter the private admin password to manage your links.", "أدخل كلمة مرور المسؤول الخاصة لإدارة روابطك."],
  ["یک لینک شخصی، فقط برای یک نفر", "One personal link, for one person", "رابط شخصي، لشخص واحد"], ["چیزی برای گفتن داری؟", "Something to say?", "لديك شيء لتقوله؟"],
  ["با یک لینک، خصوصی و ساده.", "With one link, private and simple.", "برابط واحد، خاص وبسيط."], ["یک نام، رنگی که دوست داری و هر چیز کوچکی که می‌خواهی در این لینک خصوصی باقی بماند.", "A name, a color you like, and any small thing you want to keep private in this link.", "اسم ولون تحبه وأي شيء صغير تريد أن يبقى خاصًا في هذا الرابط."],
  ["لینک شخصی", "Personal link", "رابط شخصي"], ["رنگ دلخواه", "Your color", "لونك المفضل"], ["پیام کوتاه", "Short message", "رسالة قصيرة"],
  ["لینکت را بساز", "Create your link", "أنشئ رابطك"], ["ساخت لینک شخصی", "Create a personal link", "إنشاء رابط شخصي"],
  ["نام یک نفر", "Recipient name", "اسم الشخص"], ["مثلاً نرگس", "For example, Narges", "مثلاً نرجس"], ["آن‌چه در لینک دیده می‌شود، فقط برای همان نفر است.", "What appears in this link is only for that person.", "ما يظهر في هذا الرابط مخصص لهذا الشخص فقط."],
  ["یادداشت شخصی", "Personal note", "ملاحظة شخصية"], ["(اختیاری)", "(optional)", "(اختياري)"], ["یک جمله‌ی کوتاه، فقط برای همان نفر.", "A short line, just for that person.", "عبارة قصيرة لذلك الشخص فقط."],
  ["یک تبریک کوتاه برای روز تولد.", "A short birthday wish.", "تهنئة قصيرة بعيد الميلاد."], ["تصویر شخصی", "Personal image", "صورة شخصية"],
  ["باز است", "Unlocked", "مفتوح"], ["قفل‌شده", "Locked", "مقفل"], ["رمز قابلیت تصویر", "Image feature password", "كلمة مرور ميزة الصورة"], ["باز کردن", "Unlock", "فتح"],
  ["انتخاب تصویر از دستگاه", "Choose an image from your device", "اختر صورة من جهازك"], ["JPG، PNG یا WebP تا ۱ مگابایت", "JPG, PNG, or WebP up to 1 MB", "JPG أو PNG أو WebP حتى 1 ميغابايت"],
  ["تاریخ انقضا", "Expiration date", "تاريخ الانتهاء"], ["بعد از این زمان، لینک برای بازدیدکننده غیرفعال می‌شود.", "After this time, the link becomes unavailable to visitors.", "بعد هذا الوقت، يصبح الرابط غير متاح للزوار."],
  ["رنگ متن‌ها", "Text color", "لون النص"], ["ظاهر لینک", "Link appearance", "مظهر الرابط"], ["روشن و لطیف", "Light and soft", "فاتح وناعم"], ["بنفش و رویایی", "Purple and dreamy", "بنفسجي وحالم"],
  ["ساخت لینک تولد", "Create birthday link", "إنشاء رابط عيد ميلاد"], ["در حال آماده‌سازی لینک…", "Preparing your link…", "جارٍ تجهيز رابطك…"],
  ["کاربر گرامی هیچگونه اطلاعات شخصی شما فاش نمیشود", "Your personal information is never disclosed.", "لن يتم الكشف عن أي من معلوماتك الشخصية."],
  ["لینکت آماده است", "Your link is ready", "رابطك جاهز"], ["کپی لینک", "Copy link", "نسخ الرابط"], ["باز کردن لینک ←", "Open link →", "فتح الرابط ←"],
  ["در حال آماده‌سازی تنظیمات تولد…", "Preparing birthday settings…", "جارٍ تجهيز إعدادات عيد الميلاد…"], ["ساخت لینک تولد موقتاً از پنل مدیر غیرفعال است.", "Birthday link creation is temporarily disabled by the admin.", "إنشاء رابط عيد الميلاد معطّل مؤقتًا من قِبل الإدارة."],
  ["نوع لینک", "Link type", "نوع الرابط"], ["هدیهٔ معمولی", "Regular gift", "هدية عادية"], ["تولد", "Birthday", "عيد ميلاد"], ["سن جدید", "Age", "العمر"],
  ["مثلاً ۱۷", "For example, 17", "مثلاً 17"], ["برای کیک‌های بدون شمع، رقم‌های سن به‌صورت شمع روی کیک می‌آیند.", "For cakes without candles, the age digits appear as candles on the cake.", "للكعكات بلا شموع، تظهر أرقام العمر كشموع على الكعكة."],
  ["کیک مورد نظر", "Choose a cake", "اختر الكعكة"], ["در حال آماده‌سازی کیک‌ها…", "Preparing cakes…", "جارٍ تجهيز الكعكات…"], ["شمع داخلی دارد", "Has built-in candles", "تحتوي على شموع مدمجة"],
  ["این لینک در دسترس نیست", "This link is unavailable", "هذا الرابط غير متاح"], ["ممکن است آدرس نادرست باشد یا این لینک دیگر فعال نباشد.", "The address may be incorrect or this link may no longer be active.", "قد يكون العنوان غير صحيح أو لم يعد هذا الرابط نشطًا."],
  ["در حال باز کردن هدیه…", "Opening your gift…", "جارٍ فتح هديتك…"], ["روی متن بزن تا شروع شود", "Tap the text to begin", "اضغط على النص للبدء"],
  ["دوستت دارم", "I love you", "أحبك"], ["I LOVE YOU", "I LOVE YOU", "أحبك"], ["برای آدین", "For Adin", "لآدين"], ["از اول", "Restart", "إعادة البدء"],
  ["تصویر گربه", "Cat image", "صورة القطة"], ["تصویر کیک", "Cake image", "صورة الكعكة"], ["تصویر موتور", "Motorcycle image", "صورة الدراجة"], ["این بخش هنوز کامل نشده است.", "This section is not complete yet.", "هذا القسم غير مكتمل بعد."],
  ["روی گربه بزن", "Tap the cat", "اضغط على القطة"], ["مرحله‌ی دوم", "Second stage", "المرحلة الثانية"], ["روی کیک بزن", "Tap the cake", "اضغط على الكعكة"], ["یه لحظه…", "One moment…", "لحظة واحدة…"],
  ["روی موتور نگه دار تا صداش رو بشنوی", "Hold the motorcycle to hear it", "اضغط مطولاً على الدراجة لسماع صوتها"], ["در حال پخش…", "Playing…", "جارٍ التشغيل…"], ["نگه دار", "Hold", "اضغط مطولاً"],
  ["تولدت مبارک", "Happy birthday", "عيد ميلاد سعيد"], ["آرزوت را کردی؛ تولدت مبارک", "You made your wish—happy birthday", "تمنيت أمنيتك—عيد ميلاد سعيد"],
  ["خاموش کردن با فوت", "Blow to extinguish", "أطفئها بالنفخ"], ["خاموش‌کردن شمع بدون میکروفون", "Extinguish candle without a microphone", "أطفئ الشمعة من دون ميكروفون"],
  ["میکروفون این دستگاه در دسترس نیست؛ می‌توانی دکمهٔ خاموش‌کردن شمع را بزنی.", "This device has no microphone; you can use the extinguish button.", "لا يتوفر ميكروفون في هذا الجهاز؛ يمكنك استخدام زر الإطفاء."],
  ["اجازهٔ میکروفون داده نشد؛ دکمهٔ خاموش‌کردن شمع همچنان کار می‌کند.", "Microphone permission was not granted; the extinguish button still works.", "لم يتم منح إذن الميكروفون؛ زر الإطفاء ما زال يعمل."],
  ["فضای مدیریت", "Management space", "مساحة الإدارة"], ["لینک‌های ساخته‌شده", "Created links", "الروابط المنشأة"], ["لینک‌ها را ببین، ویرایش کن یا در صورت نیاز حذف کن.", "View, edit, or delete your links when needed.", "اعرض روابطك أو عدّلها أو احذفها عند الحاجة."],
  ["نمای کلی", "Overview", "نظرة عامة"], ["لینک‌ها و آمار", "Links & analytics", "الروابط والإحصاءات"], ["امنیت", "Security", "الأمان"], ["تعداد لینک‌ها", "Links", "الروابط"], ["مجموع بازدیدها", "Total visits", "إجمالي الزيارات"], ["آخرین به‌روزرسانی", "Last refresh", "آخر تحديث"], ["هر ۱۵ ثانیه", "Every 15 seconds", "كل 15 ثانية"],
  ["امنیت پنل", "Panel security", "أمان اللوحة"], ["تغییر رمز مدیریت", "Change admin password", "تغيير كلمة مرور الإدارة"], ["رمز جدید باید دست‌کم ۱۲ کاراکتر داشته باشد. پس از ذخیره، همهٔ نشست‌های قبلی بسته می‌شوند.", "The new password must be at least 12 characters. Saving it signs out all existing sessions.", "يجب أن تتكون كلمة المرور الجديدة من 12 حرفًا على الأقل. حفظها يسجل خروج جميع الجلسات الحالية."],
  ["رمز فعلی", "Current password", "كلمة المرور الحالية"], ["رمز جدید", "New password", "كلمة مرور جديدة"], ["تکرار رمز جدید", "Confirm new password", "تأكيد كلمة المرور الجديدة"], ["ذخیرهٔ رمز جدید", "Save new password", "حفظ كلمة المرور الجديدة"],
  ["تولد عمومی", "Public birthday", "عيد ميلاد عام"], ["تنظیمات تجربهٔ شمع", "Candle experience settings", "إعدادات تجربة الشمعة"], ["برای عموم فعال", "Publicly enabled", "مفعل للعامة"], ["برای عموم غیرفعال", "Publicly disabled", "معطل للعامة"],
  ["فعال‌بودن ساخت تولد", "Enable birthday creation", "تفعيل إنشاء عيد الميلاد"], ["متن بالای شمع", "Candle prompt", "النص فوق الشمعة"], ["رنگ زمینهٔ تجربه", "Experience background color", "لون خلفية التجربة"], ["ذخیرهٔ تنظیمات", "Save settings", "حفظ الإعدادات"],
  ["گالری کیک‌ها", "Cake gallery", "معرض الكعكات"], ["کیک‌های قابل انتخاب کاربران", "Cakes users can choose", "الكعكات التي يمكن للمستخدمين اختيارها"], ["نمایش عمومی", "Show publicly", "إظهار للعامة"], ["ذخیره", "Save", "حفظ"], ["حذف", "Delete", "حذف"], ["افزودن کیک جدید", "Add a new cake", "أضف كعكة جديدة"], ["نام کیک", "Cake name", "اسم الكعكة"], ["ترتیب کیک", "Cake order", "ترتيب الكعكة"], ["تصویر", "Image", "صورة"], ["افزودن به گالری", "Add to gallery", "أضف إلى المعرض"],
  ["مسیر اختصاصی آدین", "Adin’s private route", "مسار آدين الخاص"], ["محتوای تولد آدین", "Adin’s birthday content", "محتوى عيد ميلاد آدين"], ["قابل‌ویرایش", "Editable", "قابل للتعديل"], ["مشاهده و تست", "View and test", "عرض واختبار"], ["کپی لینک تولد", "Copy birthday link", "نسخ رابط عيد الميلاد"],
  ["ویرایش لینک", "Edit link", "تعديل الرابط"], ["تغییرات فقط روی همین لینک اعمال می‌شود.", "Changes apply only to this link.", "تنطبق التغييرات على هذا الرابط فقط."], ["نام", "Name", "الاسم"], ["متن بعد از نام", "Text after the name", "النص بعد الاسم"], ["یادداشت شخصی اختیاری", "Optional personal note", "ملاحظة شخصية اختيارية"],
  ["جزئیات فنی لینک", "Link technical details", "التفاصيل التقنية للرابط"], ["لینک منتخب", "Selected link", "الرابط المحدد"], ["هنوز رخدادی ثبت نشده است", "No events have been recorded yet", "لم يتم تسجيل أي أحداث بعد"], ["در دسترس نیست", "Unavailable", "غير متاح"], ["موقعیت تقریبی", "Approximate location", "الموقع التقريبي"], ["دستگاه و مرورگر", "Device & browser", "الجهاز والمتصفح"],
  ["حذف لینک", "Delete link", "حذف الرابط"], ["انصراف", "Cancel", "إلغاء"], ["حذف قطعی", "Delete permanently", "حذف نهائي"],
  ["صفحه پیدا نشد", "Page not found", "الصفحة غير موجودة"], ["صفحه‌ای که دنبال آن هستید وجود ندارد.", "The page you are looking for does not exist.", "الصفحة التي تبحث عنها غير موجودة."], ["بازگشت به خانه", "Go Home", "العودة للرئيسية"],
  ["صفحه پیدا نشد", "Page Not Found", "الصفحة غير موجودة"], ["متأسفیم، صفحه‌ای که به دنبال آن هستید وجود ندارد.", "Sorry, the page you are looking for doesn't exist.", "عذرًا، الصفحة التي تبحث عنها غير موجودة."], ["ممکن است منتقل یا حذف شده باشد.", "It may have been moved or deleted.", "ربما تم نقلها أو حذفها."],
  ["لینک کپی شد.", "Link copied.", "تم نسخ الرابط."], ["با موفقیت وارد شدی.", "Signed in successfully.", "تم تسجيل الدخول بنجاح."], ["از پنل خارج شدی.", "You signed out of the panel.", "تم تسجيل الخروج من اللوحة."],
  ["رمز تغییر کرد؛ برای امنیت، همهٔ نشست‌ها بسته شدند.", "Password changed; all sessions were closed for security.", "تم تغيير كلمة المرور وإغلاق جميع الجلسات للأمان."], ["تغییرات ذخیره شد.", "Changes saved.", "تم حفظ التغييرات."], ["لینک حذف شد.", "Link deleted.", "تم حذف الرابط."],
  ["تنظیمات تولد عمومی ذخیره شد.", "Public birthday settings saved.", "تم حفظ إعدادات عيد الميلاد العامة."], ["کیک جدید به گالری اضافه شد.", "New cake added to the gallery.", "تمت إضافة كعكة جديدة إلى المعرض."], ["تنظیمات کیک ذخیره شد.", "Cake settings saved.", "تم حفظ إعدادات الكعكة."], ["کیک از گالری حذف شد.", "Cake removed from the gallery.", "تم حذف الكعكة من المعرض."], ["محتوای تولد ذخیره شد.", "Birthday content saved.", "تم حفظ محتوى عيد الميلاد."],
  ["برای ساخت لینک تولد، سن و کیک را انتخاب کن.", "Select an age and a cake to create a birthday link.", "اختر العمر والكعكة لإنشاء رابط عيد ميلاد."], ["لینک شخصی‌ات آماده شد.", "Your personal link is ready.", "رابطك الشخصي جاهز."],
  ["قابلیت تصویر باز شد.", "Image feature unlocked.", "تم فتح ميزة الصورة."], ["برای بارگذاری تصویر ابتدا رمز قابلیت تصویر را وارد کنید.", "Enter the image feature password before uploading.", "أدخل كلمة مرور ميزة الصورة قبل الرفع."],
  ["بارگذاری کیک انجام نشد.", "Cake upload failed.", "فشل رفع الكعكة."], ["بارگذاری تصویر انجام نشد.", "Image upload failed.", "فشل رفع الصورة."], ["تصویر هم به هدیه اضافه شد.", "The image was added to the gift.", "تمت إضافة الصورة إلى الهدية."],
  ["آرزو کن و شمع را فوت کن", "Make a wish and blow out the candle", "تمنَّ أمنية وانفخ الشمعة"],
  ["تم", "Theme", "المظهر"], ["بنفش", "Purple", "بنفسجي"], ["روشن", "Light", "فاتح"], ["بازدید", "visits", "زيارات"], ["بدون انقضا", "No expiration", "بلا انتهاء"], ["منقضی‌شده", "Expired", "منتهي"],
  ["صورتی", "Pink", "وردي"], ["آبی", "Blue", "أزرق"], ["صورتی، بنفش و آبی", "Pink, purple, and blue", "وردي وبنفسجي وأزرق"], ["عمیق، آرام و درخشان", "Deep, calm, and glowing", "عميق وهادئ ومتوهج"],
  ["ساخت لینک", "Link created", "تم إنشاء الرابط"], ["بازدید لینک", "Link visited", "تمت زيارة الرابط"], ["موقعیت تقریبی در دسترس نیست", "Approximate location unavailable", "الموقع التقريبي غير متاح"],
  ["این تنظیمات روی لینک‌های تولد تازه اعمال می‌شود. خاموش‌کردن عرضه، فقط ساخت لینک جدید را متوقف می‌کند.", "These settings apply to new birthday links. Disabling availability only stops new link creation.", "تنطبق هذه الإعدادات على روابط عيد الميلاد الجديدة. تعطيل الإتاحة يوقف إنشاء الروابط الجديدة فقط."],
  ["کاربران عادی فقط در زمان فعال‌بودن، گزینهٔ تولد را می‌بینند.", "Regular users see the birthday option only while it is enabled.", "يرى المستخدمون العاديون خيار عيد الميلاد فقط عندما يكون مفعلاً."],
  ["این اطلاعات فقط برای مدیریت لینک نمایش داده می‌شود و رخدادهای قدیمی پس از ۳۰ روز حذف می‌شوند.", "This information is visible only for link management, and old events are deleted after 30 days.", "تظهر هذه المعلومات لإدارة الرابط فقط، وتحذف الأحداث القديمة بعد 30 يومًا."],
  ["رخدادها فقط از زمان فعال‌شدن این قابلیت ثبت می‌شوند.", "Events are collected only from the time this feature was enabled.", "يتم جمع الأحداث فقط منذ تفعيل هذه الميزة."],
  ["IP", "IP", "IP"], ["خالی بگذارید تا لینک بدون انقضا بماند.", "Leave empty to keep the link without an expiration.", "اتركه فارغًا ليبقى الرابط بلا انتهاء."],
  ["ذخیره‌ی تغییرات", "Save changes", "حفظ التغييرات"], ["تصویر شخصی", "Personal image", "صورة شخصية"], ["پیش‌نمایش تصویر", "Image preview", "معاينة الصورة"], ["جایگزینی تصویر", "Replace image", "استبدال الصورة"], ["حذف تصویر", "Remove image", "إزالة الصورة"], ["انتخاب تصویر جدید", "Choose a new image", "اختر صورة جديدة"],
  ["متن‌ها و عکس‌های سه مرحله را اینجا تغییر بده. ترتیب گربه، کیک و موتور ثابت می‌ماند.", "Edit the text and images for the three stages here. The cat, cake, and motorcycle sequence stays fixed.", "عدّل النصوص والصور للمراحل الثلاث هنا. يبقى ترتيب القطة والكعكة والدراجة ثابتًا."],
  ["متن زیر گربه", "Text under the cat", "النص أسفل القطة"], ["متن زیر کیک", "Text under the cake", "النص أسفل الكعكة"], ["متن بخش موتور", "Motorcycle section text", "نص قسم الدراجة"], ["ذخیره‌ی محتوای تولد", "Save birthday content", "حفظ محتوى عيد الميلاد"],
  ["انتخاب", "Choose", "اختر"], ["پیش‌نمایش", "Preview", "معاينة"], ["ترتیب", "Order", "الترتيب"], ["شمع داخلی", "Built-in candles", "شموع مدمجة"],
  ["هنوز لینکی ساخته نشده است.", "No links have been created yet.", "لم يتم إنشاء أي روابط بعد."], ["اولین لینک شخصی‌ات را بساز.", "Create your first personal link.", "أنشئ أول رابط شخصي لك."], ["کپی", "Copy", "نسخ"], ["ویرایش", "Edit", "تعديل"], ["جزئیات فنی لینک", "Link technical details", "التفاصيل التقنية للرابط"],
  ["در حال آماده‌سازی لینک…", "Preparing link…", "جارٍ تجهيز الرابط…"], ["لینک آماده است؛ تصویر در پس‌زمینه افزوده می‌شود.", "Your link is ready; the image is being added in the background.", "رابطك جاهز؛ تتم إضافة الصورة في الخلفية."], ["تصویر با موفقیت به هدیه اضافه شد.", "The image was successfully added to the gift.", "تمت إضافة الصورة إلى الهدية بنجاح."],
].forEach(([fa, en, ar]) => register(fa, en, ar));

export function translateText(source: string, locale: AppLocale) {
  const prefix = source.match(/^\s*/)?.[0] ?? "";
  const suffix = source.match(/\s*$/)?.[0] ?? "";
  const core = source.trim();
  const translation = translations.get(core)?.[locale];
  return translation ? `${prefix}${translation}${suffix}` : source;
}

export function detectBrowserLocale(): AppLocale {
  if (typeof navigator === "undefined") return "fa";
  const candidate = (navigator.languages?.[0] ?? navigator.language ?? "fa").toLowerCase();
  if (candidate.startsWith("ar")) return "ar";
  if (candidate.startsWith("fa")) return "fa";
  return "en";
}
