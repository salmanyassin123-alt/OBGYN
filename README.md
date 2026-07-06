# نظام إدارة طابور عيادة الدكتور أحمد يحيى الجوهري - MVP

## التثبيت

```bash
npm install next react react-dom typescript @prisma/client @supabase/supabase-js
npm install -D prisma @types/react @types/node tailwindcss postcss autoprefixer
npx prisma generate
npx prisma db push
```

## الحماية (مهم جدًا)

`/reception` و `/doctor` محميين دلوقتي بكلمة مرور موظفين واحدة. لازم تضيف في الـ Environment Variables (سواء `.env` محليًا أو في Vercel):

```
STAFF_PASSWORD="اختار كلمة مرور قوية هنا"
```

أي حد يحاول يفتح `/reception` أو `/doctor` من غير تسجيل دخول هيتحول تلقائي لصفحة `/login`.

المريضة تقدر تفتح `/book` (الحجز) و `/profile` (ملفها الطبي) بحرية من غير أي تسجيل دخول، لأن دول مخصصين للمرضى.

⚠️ ملحوظة أمان: صفحة `/profile` بتعتمد حاليًا على رقم الهاتف بس كوسيلة تعريف (أي حد يعرف رقم مريضة يقدر يشوف ملفها الطبي). ده مقبول كبداية MVP بس لو حابب حماية أقوى لاحقًا، أضيف تحقق برمز OTP يتبعت على واتساب قبل عرض البيانات.

## متغيرات البيئة (.env)

```
DATABASE_URL="postgresql://...supabase connection string..."
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxxx"
STAFF_PASSWORD="كلمة مرور الموظفين"

TWILIO_ACCOUNT_SID="xxxx"
TWILIO_AUTH_TOKEN="xxxx"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

## تفعيل Realtime في Supabase

لازم تفعّل replication على جداول `Appointment` و `ClinicEvent` و `DoctorStatus` من لوحة تحكم Supabase:
Database → Replication → فعّل الجداول التلاتة (الجدول التالت `DoctorStatus` مهم عشان شاشة الانتظار تعرض حالة الدكتور فورًا).

## بعد أي تعديل في schema.prisma

لازم تشغّل الأمر ده تاني عشان الجدول الجديد/الحقول الجديدة تتحدث فعليًا في قاعدة البيانات:

```bash
npx prisma db push
```

(تم تحديث الـ schema في هذا الإصدار بإضافة حقول: وظيفة المريضة، الأدوية الحالية، عمليات جراحية سابقة، تاريخ الحمل والولادة، تاريخ الأمراض في العائلة، اسم ووظيفة الزوج، ونتائج التحاليل في الزيارة)

## هيكل الصفحات

- `/queue-display` — الشاشة المعلقة في العيادة (تعرض الدور الحالي + قائمة الانتظار realtime)
- `/reception` — لوحة الريسبشن (تسجيل حضور + تسجيل تأخير/طوارئ)
- `/doctor` — لوحة الدكتور (نداء التالية + تسجيل التشخيص والروشتة)

## تدفق العمل (Flow)

1. مريضة تحجز أونلاين → `POST /api/appointments` (bookingSource: ONLINE) → تاخد رقم دور
2. أو تيجي على العيادة مباشرة → الريسبشن تعمل نفس الـ POST (bookingSource: WALK_IN)
3. لما توصل فعليًا → الريسبشن تضغط "تسجيل حضور" → `PATCH /api/appointments/:id/checkin`
4. الدكتور يضغط "نداء التالية" → `PATCH /api/appointments/:id/call`
5. بعد الكشف: الدكتور يسجل التشخيص/الروشتة → `PATCH /api/appointments/:id/complete`
   - يترسل الروشتة على واتساب تلقائيًا
   - يتحدث تقدير وقت الانتظار لكل المنتظرين
   - يترسل تنبيه "باقي 3" لصاحبة الدور المناسب
6. لو حصل تأخير أو طوارئ: الريسبشن تسجل الحدث → `POST /api/events` → تنبيه فوري لكل المنتظرين

## الخطوات التالية المقترحة

- إضافة صفحة حجز عامة للمريضات (`/book`)
- ربط JWT auth (زي اللي عندك في GP101) بدل افتراض patientUserId
- صفحة سجل طبي كامل للمريضة (Visit history)
- Cron job على Supabase Edge Functions لإعادة حساب `estimatedTime` كل 5 دقايق تلقائيًا
