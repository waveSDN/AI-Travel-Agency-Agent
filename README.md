<div align="right">

# ✈️ Layla Travel AI — وكيل السفر الذكي

> **موظف وكالة سفر بالذكاء الاصطناعي يعمل على واتساب** — يفهم العملاء، يجمع البيانات، يتذكر المحادثات، ويحوّل الاستفسارات إلى حجوزات.

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat&logo=express&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Sonnet_4.6-D97757?style=flat)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-43%2F43_passing-success)
![License](https://img.shields.io/badge/License-MIT-blue)

🔗 **رابط المشروع:** https://github.com/waveSDN/AI-Travel-Agency-Agent

</div>

---

## 🌟 ما هو هذا المشروع؟

**Layla Travel AI** هو وكيل ذكاء اصطناعي إنتاجي (production-ready) مصمم لشركات السياحة والسفر. يعمل عبر واتساب ويتصرف **مثل موظف بشري** لا مثل بوت محفوظ الردود.

يستلم رسائل العملاء، يفهم نواياهم، يجمع المعلومات تدريجياً (مدينة، تاريخ، عدد مسافرين، ميزانية)، يحفظ كل شيء في قاعدة بيانات، يقترح الرحلات والفنادق، ويتابع العملاء تلقائياً حتى الحجز.

---

## 🆚 لماذا هذا المشروع مختلف؟

| الميزة | بوت تقليدي | **Layla Travel AI** |
|---|:---:|:---:|
| 🧠 ذاكرة المحادثات | ❌ | ✅ قصيرة + طويلة المدى |
| 🛠️ استخدام أدوات ديناميكية | محدود | ✅ نظام Tool Registry |
| 🔁 متابعة تلقائية | ❌ | ✅ بعد يوم / 3 / 7 |
| ⭐ تقييم العملاء (Lead Scoring) | ❌ | ✅ 0–100 + تصنيف |
| 🤝 تحويل للموظف البشري | بدائي | ✅ ذكي (غضب / VIP / ثقة منخفضة) |
| 📊 مراقبة شاملة | ❌ | ✅ Logs + Metrics + Tracing |
| 🏗️ معمارية قابلة للتوسع | ❌ | ✅ Workflows + Events + Tools |

---

## 🎯 الميزات الرئيسية

- 💬 **يفهم اللغة الطبيعية** — يستخرج النية والكيانات من رسائل العميل (عربي + إنجليزي)
- 🧩 **نظام أسئلة ذكي** — يسأل سؤالاً واحداً فقط في كل مرة، حسب الأولوية
- 🧠 **ذاكرة محادثات** — يتذكر العميل وتفضيلاته عبر الجلسات
- ✈️ **بحث الرحلات والفنادق** — أدوات قابلة للتوصيل مع APIs حقيقية (Amadeus / Booking)
- 📊 **تقييم العملاء تلقائياً** — Lead Score من 0 إلى 100 (Hot / Warm / Cold)
- 🚨 **تحويل ذكي للموظف** — عند الغضب أو العميل VIP أو ضعف الثقة
- ⏰ **متابعة تلقائية** — رسائل تذكير مجدولة بـ cron
- 🔒 **أمان كامل** — helmet + rate limiting + input validation
- 📈 **مراقبة إنتاجية** — eventBus + metrics + structured logs
- 🐳 **جاهز للنشر** — Dockerfile + docker-compose مع n8n اختياري

---

## 🏗️ كيف يعمل؟

```
   عميل واتساب
       │
       ▼
┌──────────────┐
│   Webhook    │ ← Express + helmet + rate limit + validation
│ POST /webhook │
└──────┬───────┘
       │
       ▼
┌──────────────┐    ┌───────────────────┐
│ Travel Agent │───▶│  Workflow Engine  │ — steps قابلة للتوسعة
└──────┬───────┘    └────────┬──────────┘
       │                     │
       ▼                     ▼
┌──────────────┐    ┌───────────────────┐
│ Tool Registry│    │  Claude Service   │ ← المكان الوحيد المتصل
└──────┬───────┘    └────────┬──────────┘    بـ Anthropic SDK
       │                     │
       ▼                     ▼
┌──────────────┐    ┌───────────────────┐
│   Event Bus  │───▶│  Observability    │ — logs + metrics + tracing
└──────┬───────┘    └───────────────────┘
       │
       ▼
┌──────────────┐
│   Supabase   │ — 4 جداول (customers, conversations, requests, followups)
└──────────────┘
```

---

## 💬 لقطة من محادثة حقيقية

```
العميل:    أريد تذكرة إلى جدة
ليلى:     أهلاً وسهلاً 🌹 من أي مدينة ستسافر؟

العميل:    من الخرطوم
ليلى:     ممتاز! في أي تاريخ تخطط للسفر؟

العميل:    الجمعة القادمة، 3 أشخاص
ليلى:     تمام، رحلة لـ 3 مسافرين من الخرطوم إلى جدة يوم الجمعة 2026-05-29.
          هل تفضل اقتصادي، رجال أعمال، أم درجة أولى؟

العميل:    اقتصادي
ليلى:     ✈️ وجدت لك خيارين:
          • SaudiAir SV101 — 08:00 صباحاً — 290$
          • FlyNas XY204 — 14:00 — 350$

          أيهما تفضل لأبدأ بإجراءات الحجز؟
```

في الخلفية:
- ✅ تم حفظ العميل في قاعدة البيانات
- ✅ تم احتساب Lead Score = 75 (Hot 🔥)
- ✅ تم جدولة 3 رسائل متابعة (يوم 1، 3، 7)

---

## 🧱 البنية التقنية

| الطبقة | التقنية |
|---|---|
| **Runtime** | Node.js 20.x |
| **Web Framework** | Express 4.x |
| **AI** | Claude Sonnet 4.6 (Anthropic SDK) |
| **Database** | Supabase (PostgreSQL) |
| **Messaging** | WhatsApp Business API (Meta Graph) |
| **Automation** | n8n (اختياري) |
| **Security** | helmet, express-rate-limit, express-validator |
| **Logging** | Winston (structured JSON) |
| **Scheduling** | node-cron |
| **Testing** | Jest + Supertest (43/43 ✅) |
| **Deployment** | Docker + docker-compose |

---

## 📁 هيكل المشروع

```
AI-Travel-Agency-Agent/
├── src/
│   ├── agents/             ← Travel Agent — منسّق المحادثة
│   ├── workflows/          ← محرّك سير العمل متعدد الخطوات
│   ├── tools/              ← Tool Registry (searchFlights, saveLead, ...)
│   ├── services/           ← claudeService, whatsappService, leadScoring
│   ├── prompts/            ← system prompt + extraction + missing-data
│   ├── memory/             ← ذاكرة المحادثات (قصيرة وطويلة المدى)
│   ├── events/             ← Event Bus
│   ├── observability/      ← tracer + metrics + structured logging
│   ├── database/           ← Supabase repositories + migrations.sql
│   ├── routes/             ← /webhook, /health, /metrics
│   ├── controllers/        ← webhookController
│   ├── middleware/         ← errorHandler, rateLimiter, validateWebhook
│   ├── config/             ← env loader + validation
│   ├── utils/              ← logger, errors
│   ├── app.js              ← Express app factory
│   └── index.js            ← نقطة الدخول
├── tests/                  ← Jest tests (8 suites، 43 اختبار)
├── Dockerfile
├── docker-compose.yml      ← يتضمن n8n اختياري
├── .env.example
└── package.json
```

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 20.x أو أعلى
- حساب Supabase (مجاني)
- مفتاح API من Anthropic

### الخطوات

```bash
# 1. استنسخ المستودع
git clone https://github.com/waveSDN/AI-Travel-Agency-Agent.git
cd AI-Travel-Agency-Agent

# 2. ثبّت المكتبات
npm install

# 3. انسخ ملف البيئة وضع مفاتيحك
cp .env.example .env
# عدّل .env (انظر القسم التالي)

# 4. شغّل migrations في Supabase
#    افتح Supabase Dashboard → SQL Editor
#    الصق محتوى src/database/migrations.sql ثم Run

# 5. شغّل السيرفر
npm start

# أو بـ Docker
docker-compose up
```

### اختبار سريع

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"user":"+966500000000","message":"أريد تذكرة إلى جدة"}'
```

---

## 🔐 متغيرات البيئة

| المتغير | الوصف | مطلوب؟ |
|---|---|:---:|
| `SUPABASE_URL` | رابط مشروع Supabase | ✅ |
| `SUPABASE_SERVICE_KEY` | مفتاح service_role من Supabase | ✅ |
| `ANTHROPIC_API_KEY` | مفتاح Claude API (يبدأ بـ `sk-ant-`) | ✅ |
| `CLAUDE_MODEL` | اسم النموذج (افتراضي `claude-sonnet-4-6`) | ⬜ |
| `WHATSAPP_ACCESS_TOKEN` | توكن واتساب من Meta | ⬜ |
| `WHATSAPP_PHONE_NUMBER_ID` | معرّف رقم واتساب التجاري | ⬜ |
| `WHATSAPP_VERIFY_TOKEN` | كلمة سرية للتحقق من webhook | ⬜ |
| `STAFF_PHONE` | رقم الموظف لإشعارات الـ escalation | ⬜ |
| `PORT` | منفذ السيرفر (افتراضي `3000`) | ⬜ |
| `RATE_LIMIT_MAX` | الحد الأقصى للطلبات (افتراضي 100/15د) | ⬜ |
| `LEAD_SCORE_VIP_THRESHOLD` | حد VIP (افتراضي 80) | ⬜ |
| `LEAD_SCORE_ESCALATE_THRESHOLD` | حد التحويل لبشري (افتراضي 30) | ⬜ |

> 📘 **شرح تفصيلي لكل متغير**: انظر `.env.example`

---

## 🗄️ قاعدة البيانات

أربعة جداول تُنشأ تلقائياً من `src/database/migrations.sql`:

| الجدول | الغرض |
|---|---|
| `customers` | بيانات العملاء + Lead Score + علم VIP + حالة الـ escalation |
| `conversations` | كل رسالة (من العميل أو الوكيل) مع timestamp |
| `travel_requests` | طلبات السفر المستخرجة (من / إلى / تاريخ / ميزانية / حالة) |
| `follow_ups` | رسائل المتابعة المجدولة + حالة الإرسال |

---

## 🌐 نقاط الـ API

| Endpoint | الطريقة | الغرض |
|---|:---:|---|
| `/webhook` | `POST` | استقبال رسائل واتساب |
| `/webhook` | `GET` | التحقق من Webhook (Meta) |
| `/health` | `GET` | فحص صحة السيرفر + قاعدة البيانات |
| `/metrics` | `GET` | عدّادات + histograms (latency, tokens, errors) |

---

## 📡 نظام الأحداث (Event Bus)

كل ما يحدث داخل النظام يُنشر كحدث، ويمكن لأي مكون الاشتراك فيه:

```js
message.received      // وصول رسالة جديدة
intent.detected       // تم تحديد النية + الكيانات
tool.called           // بدء تنفيذ أداة
tool.completed        // نجاح الأداة + الزمن
tool.failed           // فشل الأداة
claude.called         // استدعاء Claude + استهلاك التوكنز
agent.responded       // رد الوكيل + Lead Score + latency
lead.scored           // تم احتساب التقييم
escalation.triggered  // تحويل لبشري
followup.scheduled    // جدولة متابعة
error.occurred        // خطأ في أي طبقة
```

---

## 🧪 الاختبارات

```bash
npm test
```

النتيجة: **43/43 اختبار ناجح** عبر 8 suites:
- ✅ webhook validation + verification
- ✅ Lead scoring (8 سيناريوهات)
- ✅ Missing data engine (7 سيناريوهات)
- ✅ Tool Registry (registration, invocation, errors)
- ✅ Workflow Engine (linear, branch, short-circuit)
- ✅ Event Bus (pub/sub + wildcard)
- ✅ Tracer + Metrics

---

## 🐳 النشر بـ Docker

```bash
docker-compose up -d
```

يشغّل:
- **agent** على المنفذ `3000`
- **n8n** (أتمتة workflows) على المنفذ `5678` — admin/changeme

```bash
docker-compose logs -f agent   # عرض السجلات
docker-compose down            # إيقاف
```

---

## 🏛️ البنية المعمارية الإنتاجية

تم بناء المشروع وفق معايير وكلاء الذكاء الاصطناعي الحديثة:

- 🔌 **عزل Claude SDK** — ملف `claudeService.js` هو **الوحيد** الذي يستورد `@anthropic-ai/sdk`
- 🧩 **Workflow Engine** — تعريف خطوات المعالجة بشكل تصريحي (declarative) مع short-circuit و branching
- 🛠️ **Tool Registry** — تسجيل أدوات بصيغة JSON-Schema متوافقة مع Anthropic Tool Use
- 📢 **Event-driven** — جميع التفاعلات تمر عبر `eventBus`
- 🔭 **Observability كاملة** — كل طلب له `traceId` يربط كل الأحداث + spans + latency
- ⚡ **استجابة Webhook لحظية** — إرجاع `200` فوراً، ثم المعالجة `setImmediate` حتى لا يعيد واتساب الإرسال

---

## 🗺️ خارطة الطريق

- [ ] **Redis + BullMQ Queue** — معالجة الرسائل كـ jobs لتحمّل أحمال عالية
- [ ] **Idempotency** — تجاهل رسائل واتساب المكررة (نفس message_id)
- [ ] **Workflows لكل intent** — flightWorkflow, hotelWorkflow, visaWorkflow, bookingWorkflow
- [ ] **جداول إضافية** — `events`, `processed_messages`, `lead_scores` (تاريخي)
- [ ] **ربط APIs حقيقية** — Amadeus للطيران، Booking.com للفنادق
- [ ] **CRM Sync** — تصدير الـ leads إلى HubSpot / Salesforce
- [ ] **دفع إلكتروني** — Stripe / Mada / STC Pay
- [ ] **لوحة تحكم** — صفحة admin لمتابعة العملاء والمحادثات
- [ ] **دعم لغات إضافية** — فرنسي، أردو، فلبيني

---

## 🤝 المساهمة

نرحب بالمساهمات! اتبع هذه الخطوات:

1. اعمل Fork للمستودع
2. أنشئ فرعاً جديداً: `git checkout -b feature/my-feature`
3. اكتب الكود + الاختبارات
4. تأكد من نجاح `npm test`
5. افتح Pull Request

---

## 📄 الترخيص

هذا المشروع تحت **رخصة MIT** — يمكنك استخدامه تجارياً وتعديله بحرية.

---

## 👤 المؤلف

**waveSDN** — [GitHub](https://github.com/waveSDN)

📧 للاستفسارات التجارية أو التعاون، تواصل عبر صفحة المشروع على GitHub.

---

<div align="center">

**صنع بـ ❤️ في السودان 🇸🇩 — لتمكين شركات السياحة العربية بالذكاء الاصطناعي**

⭐ إذا أعجبك المشروع، لا تنسَ إعطاءه نجمة على GitHub!

</div>
