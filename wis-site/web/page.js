'use strict';

/**
 * Renders the single WIS page from the reviewed knowledge (content/knowledge.json) and the assistant
 * settings (content/assistant.json). Markup and classes come from the approved WIS design system;
 * every string from content is escaped. Visitor-facing text only: no designer notes or component names.
 */

/** @param {unknown} s */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c);
/** Latin product names keep their own direction inside Arabic text. */
/** @param {string} s */
const latin = (s) => `<span class="latin">${esc(s)}</span>`;
/** @param {string} name @param {string} [extra] */
const icon = (name, extra = '') => `<span data-icon="${esc(name)}"${extra}></span>`;

/** @param {string} id */
const waveSvg = (id) => `<svg class="wis-hero__wave" aria-hidden="true" focusable="false">
      <defs>
        <filter id="wblur-${id}" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
        <linearGradient id="wwash-${id}" gradientUnits="userSpaceOnUse" x1="0" x2="100" y1="0" y2="0"><stop offset="0" stop-color="#7ef7ff" stop-opacity=".26"/><stop offset="1" stop-color="#7ef7ff" stop-opacity="0"/></linearGradient>
      </defs>
      <path class="wash" fill="url(#wwash-${id})"/>
      <path class="glow" filter="url(#wblur-${id})"/>
      <path class="echo"/><path class="mid"/><path class="core"/>
    </svg>`;

const NAV = [
  ['#solutions', 'الحلول'],
  ['#how', 'كيف نعمل'],
  ['#projects', 'المشاريع'],
  ['#lab', 'مختبر WIS']
];
const BAR_NAV = [
  ['#solutions', 'الحلول'],
  ['#how', 'كيف نعمل'],
  ['#simulation', 'المحاكاة'],
  ['#projects', 'المشاريع'],
  ['#security', 'الأمان'],
  ['#contact', 'التواصل']
];

/** @param {any} k */
function hero(k) {
  const c = k.company;
  const pic = (/** @type {'past'|'present'} */ which, /** @type {boolean} */ eager) => `<picture>
          <source media="(max-width: 899px)" srcset="assets/img/hero-${which}-mobile.webp" width="1000" height="1538">
          <img class="wis-hero__img" src="assets/img/hero-${which}-1920.webp" width="1920" height="1200" alt="" decoding="async"${eager ? ' fetchpriority="high"' : ' loading="eager"'}>
        </picture>`;
  return `<div class="wis-hero-track" id="top">
  <section class="wis-hero site-hero" data-wis="hero" aria-labelledby="hero-title">
    <div class="wis-hero__media">
      <div class="wis-hero__layer wis-hero__layer--past" aria-hidden="true">
        ${pic('past', true)}
        <div class="wis-hero__shade"></div>
      </div>
      <div class="wis-hero__layer wis-hero__layer--present" aria-hidden="true">
        ${pic('present', false)}
        <div class="wis-hero__shade"></div>
      </div>
      ${waveSvg('h')}
    </div>
    <div class="wis-hero__ui wis-hero__ui--present">
      <header class="wis-hero__nav wis-nav">
        <a class="wis-brand" href="#top" aria-label="${esc(c.short)} — ${esc(c.name)}"><span class="wis-brand__mark">${esc(c.short)}</span><span class="wis-brand__name">${esc(c.name)}</span></a>
        <nav class="wis-nav__links" aria-label="أقسام الموقع">
          ${NAV.map(([h, t]) => `<a class="wis-nav__link" href="${h}">${esc(t)}</a>`).join('\n          ')}
        </nav>
        <a class="wis-btn wis-btn--secondary wis-btn--sm wis-hero__contact" href="#contact">تواصل معنا</a>
        <button class="wis-iconbtn wis-hero__menu" type="button" data-menu-toggle aria-controls="site-menu" aria-expanded="false" aria-label="فتح القائمة">${icon('menu')}</button>
      </header>
      <div class="wis-hero__content">
        <h1 class="wis-hero__title" id="hero-title">انقل أعمالك إلى <span class="nowrap">عصر الوكلاء الذكيين.</span></h1>
        <p class="wis-hero__desc">${esc(c.description)}</p>
        <div class="wis-hero__actions">
          <a class="wis-btn wis-btn--primary" href="#solutions">اكتشف الحل المناسب لشركتك${icon('arrow')}</a>
          <a class="wis-btn wis-btn--secondary" href="#inside">${icon('play')}شاهد كيف يعمل الوكيل</a>
        </div>
      </div>
    </div>
    <div class="wis-scrollcue" aria-hidden="true"><span class="wis-scrollcue__track"></span>مرّر لترى التحوّل</div>
    <div class="wis-hero__handoff" aria-hidden="true"></div>
  </section>
</div>`;
}

function siteBar() {
  return `<header class="site-bar" aria-label="شريط التنقل">
  <div class="site-bar__inner">
    <a class="wis-brand" href="#top" aria-label="WIS — العودة إلى البداية"><span class="wis-brand__mark">WIS</span></a>
    <nav class="site-bar__links" aria-label="أقسام الصفحة">
      ${BAR_NAV.map(([h, t]) => `<a class="wis-nav__link" href="${h}" data-nav-link>${esc(t)}</a>`).join('\n      ')}
    </nav>
    <a class="wis-btn wis-btn--secondary wis-btn--sm site-bar__cta" href="#contact">${icon('chat')}مساعد WIS</a>
    <button class="wis-iconbtn site-bar__menu" type="button" data-menu-toggle aria-controls="site-menu" aria-expanded="false" aria-label="فتح القائمة">${icon('menu')}</button>
  </div>
</header>
<div class="site-menu" id="site-menu" data-wis="menu" hidden>
  <nav aria-label="قائمة الأقسام">
    <ul>
      ${BAR_NAV.concat([['#inside', 'داخل الوكيل'], ['#lab', 'مختبر WIS']]).map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`).join('\n      ')}
    </ul>
  </nav>
  <button class="wis-btn wis-btn--secondary wis-btn--block" type="button" data-menu-close>إغلاق القائمة</button>
</div>`;
}

/** @param {number} n @param {string} label */
const eyebrow = (n, label) => `<span class="wis-eyebrow"><span class="wis-eyebrow__num">${String(n).padStart(2, '0')}</span>${esc(label)}</span>`;

/** @param {any} k */
function challenges(k) {
  const sel = 'followup';
  const c = k.challenges.find((/** @type {any} */ x) => x.id === sel);
  const n = c.steps.length, cur = c.current;
  return `<section class="wis-section" id="solutions" aria-labelledby="t-solutions" data-wis="challenges">
  <div class="wis-section__rail" aria-hidden="true"></div>
  <header class="wis-section__head">
    ${eyebrow(1, 'التحديات')}
    <h2 class="section-title" id="t-solutions">ابدأ بالتحدّي الذي يستهلك وقت فريقك</h2>
    <p class="lead">اختر التحدي الأقرب لعملك، وسنريك كيف يتعامل معه وكيل ذكي بمثال توضيحي.</p>
  </header>
  <div class="wis-split site-split">
    <div class="wis-options" role="radiogroup" aria-label="التحديات" data-wis="radios">
      ${k.challenges.map((/** @type {any} */ ch) => `<button type="button" class="wis-option" role="radio" aria-checked="${ch.id === sel}" data-value="${esc(ch.id)}">
        <span class="wis-option__radio" aria-hidden="true"></span>
        <span><span class="wis-option__title">${esc(ch.title)}</span><br><span class="wis-option__desc">${esc(ch.desc)}</span></span>
        <span class="wis-option__go" data-icon="arrow"></span>
      </button>`).join('\n      ')}
    </div>
    <article class="wis-panel" aria-labelledby="ch-headline" aria-live="polite" data-challenge-panel>
      <div class="wis-panel__head">
        <div class="wis-stack" style="gap:2px">
          <span class="small faint" data-ch="kicker">${esc(c.kicker)}</span>
          <h3 class="title" id="ch-headline" data-ch="headline">${esc(c.headline)}</h3>
        </div>
        <span class="wis-tag wis-tag--illustrative wis-tag--lg">${icon('dot')}مثال توضيحي</span>
      </div>
      <div class="wis-panel__body wis-stack site-chbody">
        <div class="wis-value" data-ch="value">${icon('check')}<p><s>${esc(c.before)}</s> ${esc(c.after)}</p></div>
        <div class="wis-steps site-steps4" style="--n:${n}" data-ch="steps">
          <div class="wis-steps__fill" style="width:calc(${Math.round((cur - 1) / (n - 1) * 100)}% - 22px)"></div>
          ${c.steps.map((/** @type {any} */ s, /** @type {number} */ i) => `<div class="wis-step${i + 1 < cur ? ' wis-step--done' : ''}"${i + 1 === cur ? ' aria-current="step"' : ''}><span class="wis-step__node">${i + 1}</span><span class="wis-step__name">${esc(s.name)}</span><span class="wis-step__out">${esc(s.out)}</span></div>`).join('\n          ')}
        </div>
        <div class="wis-reqcard">
          <div class="wis-reqcard__head">
            <span class="wis-reqcard__title" data-ch="card-title">${esc(c.card.title)}</span>
            <span class="wis-log__state site-state-warn" data-ch="card-state">${esc(c.card.state)}</span>
          </div>
          <dl class="wis-kv wis-kv--2 site-kv" data-ch="card-rows">
            ${c.card.rows.map((/** @type {string[]} */ r) => `<dt>${esc(r[0])}</dt><dd>${r[1].startsWith('!') ? `<span class="wis-missing">${icon('alert')}${esc(r[1].slice(1))}</span>` : esc(r[1])}</dd>`).join('')}
          </dl>
        </div>
        <div class="wis-row site-chfoot">
          <span class="small muted">بيانات المثال تجريبية. المدة والتذكير يحددهما فريقك.</span>
          <a class="wis-btn wis-btn--ghost" href="#simulation=${esc(c.sector)}" data-ch="go" data-sector="${esc(c.sector)}">شاهد مثالًا كاملًا في المحاكاة${icon('arrow')}</a>
        </div>
      </div>
    </article>
  </div>
</section>`;
}

/** @param {any} k */
function how(k) {
  const cur = 2;
  const s = k.methodology[cur - 1];
  return `<section class="wis-section" id="how" aria-labelledby="t-how" data-wis="stages">
  <div class="wis-section__rail" aria-hidden="true" style="--node:108px"></div>
  <header class="wis-section__head">
    ${eyebrow(2, 'كيف نعمل')}
    <h2 class="section-title" id="t-how">كيف نبني نظامك الذكي؟</h2>
    <p class="lead">نبدأ من عملك لا من التقنية، ونحدد حدود الوكيل قبل أن نبني.</p>
  </header>
  <div class="wis-steps site-stages" style="--n:5" role="group" aria-label="مراحل العمل الخمس">
    <div class="wis-steps__fill" style="width:calc(25% - 22px)"></div>
    ${k.methodology.map((/** @type {any} */ m) => `<button type="button" class="wis-step${m.n < cur ? ' wis-step--done' : ''}" data-stage="${m.n}" aria-pressed="${m.n === cur}"${m.n === cur ? ' aria-current="step"' : ''} aria-controls="stage-panel"><span class="wis-step__node">${m.n}</span><span class="wis-step__name">${esc(m.name)}</span><span class="wis-step__out">${esc(m.out)}</span></button>`).join('\n    ')}
  </div>
  <article class="wis-panel site-stagepanel" id="stage-panel" aria-live="polite" aria-labelledby="stage-name">
    <div class="wis-panel__head">
      <div class="wis-row" style="gap:16px;flex-wrap:nowrap">
        <span class="wis-step__node site-stagenum" data-stage-slot="num">${s.n}</span>
        <div>
          <h3 class="heading" id="stage-name" data-stage-slot="name">${esc(s.name)}</h3>
          <p class="small muted" data-stage-slot="detail">${esc(s.detail)}</p>
        </div>
      </div>
      <span class="wis-tag wis-tag--planned wis-tag--lg">الناتج: <span data-stage-slot="out">${esc(s.out)}</span></span>
    </div>
    <div class="wis-panel__body" data-stage-only="2">
      <div class="site-flowhead"><span class="small faint">مثال: من الطلب إلى النتيجة</span><span class="wis-tag wis-tag--illustrative">${icon('dot')}تصور توضيحي — ليس لقطة من برنامج قائم</span></div>
      <div class="wis-flow site-flow">
        <div class="wis-flow__node">
          <span class="wis-flow__kicker">${icon('chat')}المدخل</span>
          <span class="wis-flow__title">طلب العميل</span>
          <dl class="wis-flow__kv"><dt>القناة</dt><dd>${latin('WhatsApp')}</dd><dt>الرسالة</dt><dd>«أبغى عرض سعر لرحلة عائلية»</dd></dl>
        </div>
        <span class="wis-flow__arrow" aria-hidden="true"></span>
        <div class="wis-flow__node wis-flow__node--active">
          <span class="wis-flow__kicker">${icon('understand')}الوكيل</span>
          <span class="wis-flow__title">يحدد الإجراء</span>
          <dl class="wis-flow__kv"><dt>الإجراء</dt><dd>تجهيز عرض سعر</dd><dt>ناقص</dt><dd>تاريخ العودة، فيسأل عنه</dd></dl>
        </div>
        <span class="wis-flow__arrow" aria-hidden="true"></span>
        <div class="wis-flow__node">
          <span class="wis-flow__kicker">${icon('tool')}الأداة</span>
          <span class="wis-flow__title">يستخدم الأداة المناسبة</span>
          <dl class="wis-flow__kv"><dt>المصدر</dt><dd>نظام الحجوزات المرتبط</dd><dt>النتيجة</dt><dd>خياران متاحان</dd></dl>
        </div>
        <span class="wis-flow__arrow" aria-hidden="true"></span>
        <div class="wis-flow__split">
          <div class="wis-flow__node" style="padding:14px 18px">
            <span class="wis-flow__kicker">${icon('handoff')}مراجعة بشرية<span class="wis-log__state site-state-warn" style="margin-inline-start:auto">بانتظار الموافقة</span></span>
            <span class="small">موظف الحجوزات يعتمد السعر قبل الإرسال.</span>
          </div>
          <div class="wis-flow__node" style="padding:14px 18px">
            <span class="wis-flow__kicker">${icon('check')}النتيجة للعميل</span>
            <span class="small">يصل العرض للعميل بعد الموافقة فقط.</span>
          </div>
        </div>
      </div>
    </div>
  </article>

  <article class="wis-panel site-roles" aria-labelledby="roles">
    <div class="wis-panel__head site-roles__head">
      <div class="wis-stack" style="gap:12px;min-width:0">
        <h3 class="heading" id="roles">أدوار مقترحة للوكلاء</h3>
        <div class="wis-tabs wis-tabs--line" role="tablist" aria-label="أدوار مقترحة" data-wis="tabs">
          <button type="button" class="wis-tab" role="tab" id="r-mkt-tab" aria-selected="false" aria-controls="r-mkt">التسويق</button>
          <button type="button" class="wis-tab" role="tab" id="r-fin-tab" aria-selected="false" aria-controls="r-fin">المالية</button>
          <button type="button" class="wis-tab" role="tab" id="r-ops-tab" aria-selected="true" aria-controls="r-ops">العمليات</button>
          <button type="button" class="wis-tab" role="tab" id="r-cmp-tab" aria-selected="false" aria-controls="r-cmp">المنافسون</button>
        </div>
      </div>
      <span class="wis-tag wis-tag--illustrative wis-tag--lg">${icon('dot')}مقترح — ليس منتجًا منشورًا أو متاحًا للبيع</span>
    </div>
    <div class="wis-panel__body">
      ${[
        ['r-mkt', 'وصف النشاط والجمهور والقنوات', 'أسئلة السوق وفرص الوصول إلى الجمهور', 'أي قناة تُختبر أولًا', ''],
        ['r-fin', 'ملف إيرادات ومصروفات تجريبي', 'مؤشرات مالية وتنبيهات تحتاج مراجعة', 'أي تنبيه يستحق المتابعة', ''],
        ['r-ops', 'خطوات العمل وأزمنة تنفيذ تجريبية', 'نقاط التأخير وأولويات التحسين', 'أي تحسين يُنفّذ أولًا', 'مثال: أطول انتظار قبل أول رد. المصدر: سجل طلبات تجريبي.'],
        ['r-cmp', 'مصادر عامة محددة عن منافسين', 'مقارنة موثقة وفجوات محتملة', 'أي فجوة تستحق الاستثمار', '']
      ].map(([id, inp, outp, dec, note]) => `<div id="${id}" role="tabpanel" tabindex="0" aria-labelledby="${id}-tab"${id === 'r-ops' ? '' : ' hidden'}><div class="wis-flow site-flow3">
        <div class="wis-flow__node"><span class="wis-flow__kicker">${icon('database')}المدخلات</span><span>${esc(inp)}</span></div><span class="wis-flow__arrow" aria-hidden="true"></span>
        <div class="wis-flow__node${id === 'r-ops' ? ' wis-flow__node--active' : ''}"><span class="wis-flow__kicker">${icon('chart')}المخرج</span><span>${esc(outp)}</span>${note ? `<span class="small muted">${esc(note)}</span>` : ''}</div><span class="wis-flow__arrow" aria-hidden="true"></span>
        <div class="wis-flow__node"><span class="wis-flow__kicker">${icon('user')}يحتاج قرارك</span><span>${esc(dec)}</span></div></div></div>`).join('\n      ')}
      <p class="small faint" style="margin-top:12px">لا تعمل الأدوار الأربعة في كل طلب: يختار النظام ما تحتاجه المهمة، ويجمع المخرجات في تقرير يذكر مصدر كل ملاحظة وما يحتاج قرارك.</p>
    </div>
  </article>
</section>`;
}

/** @param {any} k */
function fit(k) {
  const F = k.fit, d = F.sectors.clinic, idp = 'fit';
  return `<section class="wis-section site-fitsection" id="agent-fit" aria-labelledby="${idp}-t">
  <div class="wis-section__rail" aria-hidden="true" style="--node:72px"></div>
  <span class="wis-eyebrow" style="margin-bottom:20px">${'<span class="wis-eyebrow__num">03</span>'}مثال الشركة</span>
  <article class="wis-fit" id="${idp}" data-wis="fit" data-sector="clinic" aria-labelledby="${idp}-t">
    <div class="wis-fit__head">
      <div>
        <h2 class="wis-fit__title" id="${idp}-t">${esc(F.title)}</h2>
        <p class="wis-fit__desc">${esc(F.desc)}</p>
      </div>
      <span class="wis-tag wis-tag--illustrative wis-tag--lg">${icon('dot')}${esc(F.badge)}</span>
    </div>
    <div class="wis-fit__bar">
      <div class="wis-tabs" role="tablist" aria-label="اختر قطاع شركتك" data-wis="tabs">
        ${k.sectors.map((/** @type {any} */ s) => `<button type="button" class="wis-tab" role="tab" id="${idp}-tab-${s.id}" data-value="${s.id}" aria-selected="${s.id === 'clinic'}" aria-controls="${idp}-panel">${esc(s.label)}</button>`).join('\n        ')}
      </div>
      <span class="wis-fit__hint">غيّر القطاع لتتغير البطاقات الثلاث معًا.</span>
    </div>
    <div class="wis-fit__grid" id="${idp}-panel" role="tabpanel" tabindex="0" aria-labelledby="${idp}-tab-clinic" aria-live="polite">
      <section class="wis-fit__card" aria-labelledby="${idp}-c1">
        <div class="wis-fit__cardhead"><span class="wis-fit__num">1</span><h3 class="wis-fit__cardtitle" id="${idp}-c1">مهمة الوكيل</h3></div>
        <p class="wis-fit__mission" data-fit="mission">${esc(d.mission)}</p>
        <span class="wis-fit__exlabel">مثال طلب يصل إليه</span>
        <p class="wis-fit__example" data-fit="example">${esc(d.example)}</p>
      </section>
      <section class="wis-fit__card" aria-labelledby="${idp}-c2">
        <div class="wis-fit__cardhead"><span class="wis-fit__num">2</span><h3 class="wis-fit__cardtitle" id="${idp}-c2">أدوات الوكيل</h3><span class="wis-tag wis-tag--illustrative">${icon('dot')}مقترحة</span></div>
        <ul class="wis-fit__tools" data-fit="tools">${d.tools.map((/** @type {any} */ t) => `<li><span class="wis-fit__ticon">${icon(t.icon)}</span><span><b>${esc(t.name)}</b><span>${esc(t.why)}</span></span></li>`).join('')}</ul>
        <p class="wis-fit__note">${icon('info')}${esc(F.integrationsNote)}</p>
      </section>
      <section class="wis-fit__card" aria-labelledby="${idp}-c3">
        <div class="wis-fit__cardhead"><span class="wis-fit__num">3</span><h3 class="wis-fit__cardtitle" id="${idp}-c3">صلاحيات الوكيل</h3></div>
        <ul class="wis-perm" data-fit="perms">${F.levels.map((/** @type {any} */ l) => `<li class="wis-perm__row wis-perm__row--${l.id}"><span class="wis-perm__level">${icon(l.icon)}${esc(l.label)}</span>${d.perms[l.id].map((/** @type {string} */ t) => `<span class="wis-perm__text">${esc(t)}</span>`).join('')}</li>`).join('')}</ul>
      </section>
    </div>
    <div class="wis-fit__foot">
      <a class="wis-seclink wis-seclink--wrap" href="#sec-general">${icon('guard')}<span>كيف نحمي البيانات ونضبط الصلاحيات؟ <b>الأمان والتحكم</b></span>${icon('arrow')}</a>
      <div class="wis-fit__go">
        <span class="wis-fit__gonote">تفتح المحاكاة على قطاع <b data-fit="sector">العيادات</b></span>
        <a class="wis-btn wis-btn--primary" href="#simulation=clinic" data-fit-try>جرّب مثالًا من هذا القطاع${icon('arrow')}</a>
      </div>
    </div>
  </article>
</section>`;
}

/** @param {any} k */
function inside(k) {
  const pos = { understand: [455, 56], knowledge: [545, 270], memory: [455, 484], tools: [165, 484], permissions: [75, 270], review: [165, 56] };
  const sel = k.agentParts.find((/** @type {any} */ p) => p.id === 'tools');
  return `<section class="wis-section" id="inside" aria-labelledby="t-inside" data-wis="parts">
  <div class="wis-section__rail" aria-hidden="true" style="--node:108px"></div>
  <header class="wis-section__head site-head-wide">
    ${eyebrow(4, 'داخل الوكيل')}
    <h2 class="section-title" id="t-inside">ماذا يحدث بعد رسالتك؟</h2>
    <p class="lead">الوكيل يجمع فهم الطلب، ومعلومات العمل، وأدوات التنفيذ، وحدودًا واضحة للصلاحيات. اضغط على كل جزء لترى كيف يساهم في إكمال المهمة.</p>
  </header>
  <div class="wis-split site-inside">
    <div class="wis-hub site-hub" role="group" aria-label="أجزاء الوكيل">
      <svg class="wis-hub__lines" viewBox="0 0 620 540" aria-hidden="true" focusable="false">
        ${k.agentParts.map((/** @type {any} */ p) => `<line data-part-line="${p.id}"${p.id === 'tools' ? ' class="is-on"' : ''} x1="310" y1="270" x2="${pos[/** @type {keyof typeof pos} */ (p.id)][0]}" y2="${pos[/** @type {keyof typeof pos} */ (p.id)][1]}"/>`).join('\n        ')}
      </svg>
      <div class="wis-hub__core">
        <div class="wis-hub__core-label">رسالة العميل إلى الوكيل</div>
        <div class="wis-hub__msg">«أريد موعدًا غدًا مساءً»</div>
        <div class="wis-hub__core-label" style="margin-top:10px">عيادة افتراضية</div>
      </div>
      ${k.agentParts.map((/** @type {any} */ p) => {
        const [x, y] = pos[/** @type {keyof typeof pos} */ (p.id)];
        return `<button type="button" class="wis-part" data-part="${p.id}" aria-pressed="${p.id === 'tools'}" style="--x:${x}px;--y:${y}px"><span class="wis-part__num">${p.n}</span>${esc(p.name)}</button>`;
      }).join('\n      ')}
    </div>
    <div class="wis-stack" style="gap:20px;min-width:0">
      <article class="wis-panel" aria-live="polite" aria-labelledby="part-title">
        <div class="wis-panel__head">
          <div class="wis-row" style="gap:14px;flex-wrap:nowrap">
            <span class="wis-part__num wis-part__num--lg" data-slot="num">${sel.n}</span>
            <div><span class="small faint">الجزء المختار</span><h3 class="title" id="part-title" data-slot="title">${esc(sel.name)}</h3></div>
          </div>
          <span class="wis-tag wis-tag--illustrative">${icon('dot')}رسم توضيحي</span>
        </div>
        <div class="wis-panel__body wis-stack" style="gap:16px">
          <p class="body site-partwhat" data-slot="what">${esc(sel.what)}</p>
          <div data-slot="result"><div class="wis-toolcard" style="width:100%"><div class="wis-toolcard__head">${icon(sel.tool[0])}${esc(sel.tool[1])}</div><div class="wis-toolcard__result">${esc(sel.tool[2])}</div></div></div>
          <dl class="wis-trio site-trio">
            <div><dt>ما حدث</dt><dd data-slot="happened">${esc(sel.happened)}</dd></div>
            <div><dt>من أين جاءت المعلومة</dt><dd data-slot="source">${esc(sel.source)}</dd></div>
            <div><dt>الخطوة التالية</dt><dd data-slot="next">${esc(sel.next)}</dd></div>
          </dl>
        </div>
      </article>
      <div class="wis-chat wis-chat--compact" role="group" aria-label="محادثة مصغّرة توضيحية">
        <div class="wis-msg wis-msg--customer" data-hl="understand"><span class="wis-msg__who">العميل</span>أريد موعدًا غدًا مساءً</div>
        <div class="wis-msg wis-msg--agent" data-hl="understand knowledge"><span class="wis-msg__who">الوكيل</span>أي خدمة تحتاج: الكشف العام أم تنظيف الأسنان؟</div>
        <div class="wis-msg wis-msg--customer" data-hl="memory"><span class="wis-msg__who">العميل</span>تنظيف أسنان</div>
        <div class="wis-msg wis-msg--agent wis-msg--highlight" data-hl="tools permissions"><span class="wis-msg__who">الوكيل</span>المواعيد المتاحة غدًا: 6:00، 7:30 مساءً. أيهما يناسبك؟ سأطلب تأكيدك قبل الحجز.</div>
      </div>
    </div>
  </div>
</section>`;
}

function simulation() {
  const paths = [['waiting', 'clock', 'انتظار التأكيد'], ['confirmed', 'check', 'التأكيد'], ['unavailable', 'calendar', 'عدم التوفر'], ['outage', 'alert', 'تعطل الاتصال'], ['handoff', 'handoff', 'التحويل لموظف']];
  return `<section class="wis-section" id="simulation" aria-labelledby="t-sim" data-wis="simulation" data-sector="clinic">
  <div class="wis-section__rail" aria-hidden="true" style="--node:108px"></div>
  <div class="wis-head-row site-headrow">
    <header class="wis-section__head">
      ${eyebrow(5, 'المحاكاة')}
      <h2 class="section-title" id="t-sim">شاهد الطلب يتحول إلى نتيجة</h2>
      <p class="lead">جرّب طلبًا كاملًا: ما يكتبه العميل، وما يفعله الوكيل، ومتى يتدخل الموظف.</p>
    </header>
    <span class="wis-tag wis-tag--sim wis-tag--lg wis-sim-badge">${icon('dot')}محاكاة توضيحية — بيانات تجريبية</span>
  </div>
  <div class="wis-row site-simbar">
    <div class="wis-tabs" role="tablist" aria-label="القطاع" data-wis="tabs">
      <button type="button" class="wis-tab" role="tab" id="sim-tab-clinic" aria-selected="true" data-value="clinic" aria-controls="sim-panel">العيادات</button>
      <button type="button" class="wis-tab" role="tab" id="sim-tab-travel" aria-selected="false" data-value="travel" aria-controls="sim-panel">مكاتب السفر</button>
      <button type="button" class="wis-tab" role="tab" id="sim-tab-sales" aria-selected="false" data-value="sales" aria-controls="sim-panel">المتاجر</button>
    </div>
    <div class="wis-row" style="gap:8px">
      <button type="button" class="wis-btn wis-btn--secondary wis-btn--sm" data-sim-reset>${icon('refresh')}أعد التجربة</button>
      <a class="wis-btn wis-btn--ghost wis-btn--sm" href="#contact">ناقش تطبيقه في شركتك${icon('arrow')}</a>
    </div>
  </div>
  <div class="wis-sim" id="sim-panel" role="tabpanel" aria-labelledby="sim-tab-clinic">
    <article class="wis-panel wis-sim__chat" aria-label="المحادثة التجريبية">
      <div class="wis-panel__head site-simhead">
        <div class="wis-row" style="gap:12px;flex-wrap:nowrap">
          <span class="wis-sheet__avatar">${icon('chat')}</span>
          <div><div class="heading" data-sim-name>عيادة أسنان تجريبية</div><div class="small faint">بيانات تجريبية · مسارات مكتوبة مسبقًا · لا اتصال بنموذج لغوي ولا بأي نظام</div></div>
        </div>
      </div>
      <div class="wis-chat wis-sim__thread" data-sim-chat aria-live="polite" tabindex="0" aria-label="رسائل المحادثة"></div>
      <div class="wis-sim__composer">
        <input class="wis-input" type="text" disabled placeholder="المحاكاة بمسارات مكتوبة: استخدم الأزرار داخل المحادثة" aria-label="اكتب رسالة (غير متاح في المحاكاة)">
        <button type="button" class="wis-iconbtn" disabled aria-label="إرسال (غير متاح في المحاكاة)">${icon('send')}</button>
      </div>
    </article>
    <article class="wis-panel wis-sim__side" aria-labelledby="sim-steps">
      <div class="wis-panel__head site-simhead">
        <div><h3 class="heading" id="sim-steps">خطوات التنفيذ</h3><div class="small faint">أفعال ونتائج فقط، دون أفكار داخلية للنموذج</div></div>
      </div>
      <div class="wis-panel__body site-simside">
        <ol class="wis-log" data-sim-log></ol>
        <div class="wis-result" data-sim-result aria-live="polite"></div>
        <div class="wis-q" style="margin-top:18px">
          <div class="wis-q__label" id="sim-paths-label">جرّب حالة أخرى</div>
          <div class="wis-chips" role="group" aria-labelledby="sim-paths-label">
            ${paths.map(([p, ic, t]) => `<button type="button" class="wis-chip wis-chip--icon" data-sim-path="${p}" aria-pressed="${p === 'waiting'}">${icon(ic)}${esc(t)}</button>`).join('\n            ')}
          </div>
        </div>
      </div>
    </article>
  </div>
</section>`;
}

/** @param {any} k */
function projects(k) {
  const P = Object.fromEntries(k.projects.map((/** @type {any} */ p) => [p.id, p]));
  const mocks = {
    medflow: `<div class="wis-mock">
          <div class="wis-mock__head"><span>مواعيد الغد · مساءً</span><span class="wis-mock__bar" style="width:56px"></span></div>
          <div class="wis-mock__row"><span class="wis-mock__dot wis-mock__dot--on"></span>${latin('6:00')} م · متاح</div>
          <div class="wis-mock__row"><span class="wis-mock__dot wis-mock__dot--on"></span>${latin('7:30')} م · متاح</div>
          <div class="wis-mock__row"><span class="wis-mock__dot wis-mock__dot--warn"></span>${latin('8:15')} م · بانتظار تأكيد العميل</div>
        </div>`,
    layla: `<div class="wis-mock">
          <div class="wis-mock__bubble">أبغى رحلة لإسطنبول في ديسمبر</div>
          <div class="wis-mock__bubble wis-mock__bubble--agent">من أي مدينة ستغادرون؟</div>
          <div class="wis-mock__bubble">من الرياض</div>
          <div class="wis-mock__row" style="justify-content:space-between"><span>الطلب: إسطنبول · 4 مسافرين</span><span class="wis-mock__dot wis-mock__dot--warn"></span></div>
        </div>`,
    sell: `<div class="wis-mock">
          <div class="wis-mock__row"><span class="wis-mock__thumb"></span><span style="flex:1">ساعة رياضية · أسود · ${latin('45')} مم</span><span class="wis-mock__pill">متوفر</span></div>
          <div class="wis-mock__bubble">هل تتوفر بمقاس أصغر؟</div>
          <div class="wis-mock__bubble wis-mock__bubble--agent">نعم، بمقاس ${latin('41')} مم أيضًا.</div>
          <div class="wis-mock__row"><span class="wis-mock__dot wis-mock__dot--on"></span>مسودة طلب · بانتظار مراجعة المتجر</div>
        </div>`
  };
  const card = (/** @type {string} */ id) => {
    const p = P[id];
    return `<article class="wis-card" aria-labelledby="pc-${id}">
      <div class="wis-card__media" aria-hidden="true">
        ${mocks[/** @type {keyof typeof mocks} */ (id)]}
        <span class="wis-tag wis-tag--illustrative">${icon('dot')}رسم توضيحي</span>
      </div>
      <div class="wis-card__body">
        <span class="wis-card__sector">${esc(p.sector)}${p.alias ? ` · ${latin(p.alias)}` : ''}</span>
        <h3 class="wis-card__name" id="pc-${id}">${esc(p.name)}</h3>
        <p class="wis-card__desc">${esc(p.desc)}</p>
        <a class="wis-seclink" href="#${p.security.anchor}">${icon('guard')}<b>الأمان والتحكم</b> · ضوابط مستهدفة${icon('arrow')}</a>
        <div class="wis-card__foot">
          <span class="wis-tag wis-tag--prototype">${icon('flask')}${esc(p.statusLabel)}</span>
          <a class="wis-btn wis-btn--ghost wis-btn--sm" href="#dlg-${id}" data-dialog-open="dlg-${id}" aria-haspopup="dialog">استكشف المشروع<span class="sr-only"> ${esc(p.name)}</span>${icon('arrow')}</a>
        </div>
      </div>
    </article>`;
  };
  const t = P.trading;
  return `<section class="wis-section" id="projects" aria-labelledby="t-projects">
  <div class="wis-section__rail" aria-hidden="true" style="--node:108px"></div>
  <header class="wis-section__head site-head-wide">
    ${eyebrow(6, 'المشاريع')}
    <h2 class="section-title" id="t-projects">نماذج أولية نبنيها ونختبرها</h2>
    <p class="lead">كل مشروع معروض بحالته الحالية. الرسوم داخل البطاقات توضيحية، لا لقطات من المنتجات.</p>
  </header>
  <div class="wis-cards site-cards">
    ${['medflow', 'layla', 'sell'].map(card).join('\n    ')}
  </div>
  <article class="wis-lab site-lab" id="lab" aria-labelledby="lab-title">
    <div class="wis-stack" style="gap:16px;min-width:0">
      <span class="wis-eyebrow" style="color:var(--violet-text)">مختبر WIS</span>
      <div class="wis-row" style="gap:16px;align-items:center">
        <h3 class="title latin site-labtitle" id="lab-title">${esc(t.name)}</h3>
        <span class="wis-tag wis-tag--dev wis-tag--lg">${icon('flask')}${esc(t.statusLabel)}</span>
      </div>
      <p class="body site-labdesc">${esc(t.desc)}</p>
      <section class="wis-details" aria-labelledby="lab-details">
        <h4 class="wis-details__title" id="lab-details">تفاصيل المشروع</h4>
        <dl class="wis-details__list">
          ${t.details.map((/** @type {string[]} */ d) => `<dt>${esc(d[0])}</dt><dd>${d[0] === 'التنفيذ المالي الحقيقي' ? `<span class="wis-details__limit">${icon('lock')}${esc(d[1])}</span>` : esc(d[1])}</dd>`).join('\n          ')}
        </dl>
        <p class="wis-details__foot">${esc(t.disclaimer)}</p>
      </section>
      <a class="wis-seclink" href="#${t.security.anchor}">${icon('guard')}<b>الأمان والتحكم</b> · ضوابط مستهدفة${icon('arrow')}</a>
    </div>
    <figure class="wis-chart site-chart">
      <div class="wis-chart__head">
        <figcaption class="small" style="font-weight:600">سلسلة أسعار مولّدة للتوضيح</figcaption>
        <span class="wis-tag wis-tag--illustrative">${icon('dot')}بيانات توضيحية</span>
      </div>
      <div class="wis-chart__plot" data-wis="chart" data-points="64" data-seed="19" data-signals="9,23,38,51"></div>
      <div class="wis-chart__axis"><span>الأقدم</span><span>الأحدث</span></div>
      <div class="wis-chart__legend" style="margin-top:10px">
        <span class="wis-chart__key"><span class="wis-chart__swatch"></span>السعر (مولّد)</span>
        <span class="wis-chart__key"><span class="wis-chart__swatch--dot"></span>إشارة تجريبية</span>
      </div>
      <p class="small faint" style="margin-top:8px">كل ما في الرسم محاكاة، لا يمثل أداءً مثبتًا ولا نتيجة تداول.</p>
    </figure>
    <div class="wis-lab__foot">
      <ol class="wis-lab__pipeline" aria-label="مراحل المشروع">
        ${t.pipeline.map((/** @type {string} */ s, /** @type {number} */ i) => `<li class="site-pipe"><span class="wis-lab__stage">${esc(s)}</span>${i < t.pipeline.length - 1 ? `<span class="wis-lab__sep" data-icon="arrow"></span>` : ''}</li>`).join('')}
      </ol>
      <a class="wis-btn wis-btn--secondary wis-btn--sm" href="#dlg-trading" data-dialog-open="dlg-trading" aria-haspopup="dialog">استكشف المشروع<span class="sr-only"> ${esc(t.name)}</span>${icon('arrow')}</a>
    </div>
  </article>
</section>`;
}

/** @param {any} k */
function dialogs(k) {
  return k.projects.map((/** @type {any} */ p) => {
    const tag = p.status === 'dev' ? 'wis-tag--dev' : 'wis-tag--prototype';
    const list = (/** @type {string[]} */ xs) => `<ul class="wis-sec__list">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    const body = p.details
      ? `<dl class="wis-details__list">${p.details.map((/** @type {string[]} */ d) => `<dt>${esc(d[0])}</dt><dd>${esc(d[1])}</dd>`).join('')}</dl>
        <p class="wis-details__foot">${esc(p.disclaimer)}</p>
        <h3 class="wis-dialog__h">مراحل المشروع</h3>${list(p.pipeline)}`
      : `<h3 class="wis-dialog__h">ما يركّز عليه النموذج</h3>${list(p.focus)}
        <h3 class="wis-dialog__h">حدود واضحة</h3>${list(p.limits)}`;
    const sim = p.simSector ? `<a class="wis-btn wis-btn--secondary wis-btn--sm" href="#simulation=${esc(p.simSector)}">جرّب مثالًا مشابهًا في المحاكاة${icon('arrow')}</a>` : '';
    return `<dialog class="wis-dialog" id="dlg-${p.id}" aria-labelledby="dlg-${p.id}-t">
  <div class="wis-dialog__inner">
    <div class="wis-dialog__head">
      <div class="wis-stack" style="gap:4px;min-width:0">
        <span class="wis-card__sector">${esc(p.sector)}${p.alias ? ` · ${latin(p.alias)}` : ''}</span>
        <h2 class="wis-dialog__title latin" id="dlg-${p.id}-t" data-dialog-focus>${esc(p.name)}</h2>
      </div>
      <span class="wis-tag ${tag} wis-tag--lg">${icon('flask')}${esc(p.statusLabel)}</span>
      <button type="button" class="wis-iconbtn wis-dialog__close" data-dialog-close aria-label="إغلاق تفاصيل ${esc(p.name)}">${icon('close')}</button>
    </div>
    <div class="wis-dialog__body">
      <p class="wis-dialog__desc">${esc(p.desc)}</p>
      ${body}
      <h3 class="wis-dialog__h">ضوابط مستهدفة</h3>${list(p.security.controls)}
      <p class="wis-details__foot">${esc(k.security.note)}</p>
    </div>
    <div class="wis-dialog__foot">
      <a class="wis-seclink" href="#${p.security.anchor}">${icon('guard')}<b>الأمان والتحكم</b>${icon('arrow')}</a>
      <div class="wis-row" style="gap:8px">
        ${sim}
        <a class="wis-btn wis-btn--primary wis-btn--sm" href="#contact">ناقش احتياج شركتك${icon('arrow')}</a>
      </div>
    </div>
  </div>
</dialog>`;
  }).join('\n');
}

/** @param {any} k */
function security(k) {
  const S = k.security;
  const sec = (/** @type {any} */ p) => `<article class="wis-sec${p.status === 'dev' ? ' wis-sec--lab' : ''}" id="${p.security.anchor}" aria-labelledby="${p.security.anchor}-t">
      <div class="wis-sec__head">
        <span class="wis-sec__icon">${icon('guard')}</span>
        <div><h3 class="wis-sec__name latin" id="${p.security.anchor}-t">${esc(p.name)}</h3><div class="wis-sec__sector">${esc(p.sector)}</div></div>
        <span class="wis-tag ${p.status === 'dev' ? 'wis-tag--dev' : 'wis-tag--prototype'}">${icon('flask')}${esc(p.statusLabel)}</span>
      </div>
      <p class="wis-sec__label">ضوابط مستهدفة لـ:</p>
      <ul class="wis-sec__list">${p.security.controls.map((/** @type {string} */ c) => `<li>${esc(c)}</li>`).join('')}</ul>
    </article>`;
  return `<section class="wis-section" id="security" aria-labelledby="t-security">
  <div class="wis-section__rail" aria-hidden="true" style="--node:108px"></div>
  <header class="wis-section__head site-head-wide">
    ${eyebrow(7, 'الأمان')}
    <h2 class="section-title" id="t-security">${esc(S.title)}</h2>
    <p class="lead">${esc(S.intro)}</p>
  </header>
  <article class="wis-secgen" id="sec-general" aria-labelledby="sg-t" tabindex="-1">
    <div class="wis-secgen__head">
      <span class="wis-sec__icon">${icon('guard')}</span>
      <div><h3 class="wis-sec__name" id="sg-t">${esc(S.generalTitle)}</h3><div class="wis-sec__sector">نستهدفها في كل وكيل نصممه لشركة، وتُفصَّل لكل مشروع في البطاقات التالية.</div></div>
      <span class="wis-tag wis-tag--planned">${icon('guard')}ضوابط مستهدفة</span>
    </div>
    <ul class="wis-secgen__list">
      ${S.general.map((/** @type {any} */ g) => `<li class="wis-secgen__item">${icon(g.icon)}<span class="wis-secgen__name">${esc(g.name)}</span><span class="wis-secgen__text">${esc(g.text)}</span></li>`).join('\n      ')}
    </ul>
  </article>
  <div class="wis-sec-grid site-secgrid">
    ${k.projects.map(sec).join('\n    ')}
  </div>
  <div class="wis-notice wis-notice--target" style="margin-top:24px">
    ${icon('info')}
    <p>${esc(S.note)}</p>
  </div>
</section>`;
}

/** @param {any} k @param {any} a */
function contact(k, a) {
  const number = String(k.contact.whatsappNumber || '');
  if (!/^\d{8,15}$/.test(number)) throw new Error('Invalid WhatsApp contact number');
  const whatsappUrl = `https://wa.me/${number}`;
  const steps = a.steps.map((/** @type {any} */ s, /** @type {number} */ i) => `<div class="wis-q site-astep" data-step="${s.id}"${i ? ' hidden' : ''}>
          <div class="wis-msg wis-msg--agent site-amsg"><span class="wis-msg__who">${esc(a.name)}</span>${esc(s.question)}</div>
          <div class="wis-q__label" id="q-${s.id}"><span class="num">${i + 1}/${a.steps.length}</span>${esc(s.question)}</div>
          <div class="wis-chips" role="group" aria-labelledby="q-${s.id}" data-choice="${s.id}">
            ${s.options.map((/** @type {any} */ o) => `<button type="button" class="wis-chip" aria-pressed="false" data-value="${esc(o.id)}">${icon('check')}${esc(o.label)}</button>`).join('\n            ')}
          </div>
        </div>`).join('\n        ');
  return `<section class="wis-section" id="contact" aria-labelledby="t-contact">
  <div class="wis-section__rail" aria-hidden="true" style="--node:108px"></div>
  <div class="site-contact">
    <div class="wis-stack site-contact__intro">
      <header class="wis-section__head" style="margin-bottom:8px">
        ${eyebrow(8, 'التواصل')}
        <h2 class="section-title" id="t-contact">جهّز ملخص احتياجك</h2>
        <p class="lead">أجب عن ثلاثة أسئلة قصيرة، وشاهد المثال الأقرب لقطاعك، ثم راجع ملخصك وتواصل مع فريق WIS عبر WhatsApp. تستطيع أن تسأل عن WIS ومشاريعها في أي وقت.</p>
      </header>
      <div class="wis-notice wis-notice--limit">${icon('info')}<p>${esc(k.contact.status)} ${esc(k.contact.copyHint)}</p></div>
      <a class="wis-route" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">
        ${icon('chat')}
        <span class="wis-route__text"><span>تواصل مع فريق WIS عبر ${latin('WhatsApp')}</span><small>يفتح المحادثة لتراجع رسالتك وترسلها بنفسك</small></span>
        ${icon('arrow')}
      </a>
      <a class="wis-seclink" href="tel:+${number}">${icon('chat')}<b dir="ltr">${esc(k.contact.phoneDisplay)}</b></a>
      <div class="wis-notice">${icon('shield')}<p><strong>ما يفعله المساعد وما لا يفعله.</strong> يشرح WIS ومشاريعها من المحتوى المعتمد، ويقترح المثال الأقرب، ويجهّز ملخصًا تراجعه بنفسك. لا ينفّذ حجزًا أو دفعًا، ولا يقدّم استشارة طبية أو استثمارية، ولا يطلب بياناتك الشخصية.</p></div>
    </div>

    <section class="wis-panel wis-assistant" id="assistant" aria-labelledby="as-title" data-assistant>
      <div class="wis-sheet__head">
        <span class="wis-sheet__avatar">${icon('chat')}</span>
        <div><h3 class="wis-sheet__title" id="as-title">${esc(a.name)}</h3><div class="wis-sheet__sub">إجابات من محتوى WIS المعتمد · ليس محادثة حرة</div></div>
        <span class="wis-tag wis-tag--planned site-astatus" data-as-status role="status">${icon('pending')}جارٍ التحقق</span>
      </div>
      <div class="site-abody">
        <div class="wis-msg wis-msg--agent site-amsg"><span class="wis-msg__who">${esc(a.name)}</span>${esc(a.ui.greeting)}</div>
        ${steps}
        <div class="site-asuggest" data-as-suggest hidden aria-live="polite"></div>
        <section class="site-asummary" data-as-summary hidden aria-labelledby="as-sum-t">
          <h4 class="wis-q__label" id="as-sum-t">${esc(a.ui.summaryTitle)}</h4>
          <dl class="wis-summary" data-as-summary-list></dl>
          <label class="wis-q__label" for="as-summary-text">نص الملخص <span class="wis-q__hint">قابل للتعديل</span></label>
          <textarea class="wis-input site-textarea" id="as-summary-text" rows="7" data-as-summary-text></textarea>
          <p class="wis-q__hint">${esc(a.ui.summaryNote)}</p>
          <div class="wis-row" style="gap:8px">
            <a class="wis-btn wis-btn--primary wis-btn--sm" data-as-whatsapp data-whatsapp-number="${number}" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">${icon('chat')}افتح الملخص في WhatsApp</a>
            <button type="button" class="wis-btn wis-btn--secondary wis-btn--sm" data-as-copy>${icon('copy')}انسخ الملخص</button>
            <button type="button" class="wis-btn wis-btn--secondary wis-btn--sm" data-as-restart>${icon('refresh')}ابدأ من جديد</button>
          </div>
          <p class="small muted" data-as-copy-status role="status"></p>
          <p class="wis-sheet__note site-left">${esc(a.ui.contactPending)}</p>
        </section>

        <section class="site-aask" aria-labelledby="as-ask-t">
          <h4 class="wis-q__label" id="as-ask-t">أسئلة شائعة <span class="wis-q__hint">إجابات معتمدة</span></h4>
          <div class="wis-chips" data-as-faq>
            ${k.faq.map((/** @type {any} */ f) => `<button type="button" class="wis-chip site-faqchip" data-faq="${esc(f.id)}">${esc(f.q)}</button>`).join('\n            ')}
          </div>
          <ol class="site-alog" data-as-log aria-live="polite" aria-label="الأسئلة والإجابات"></ol>
          <form class="site-aform" data-as-form novalidate>
            <label class="wis-q__label" for="as-q">اسأل عن WIS <span class="wis-q__hint">اختياري</span></label>
            <p class="site-aprivacy" id="as-privacy">${icon('info')}<span>${esc(a.ui.privacy)} <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">شروط Gemini API</a></span></p>
            <textarea class="wis-input site-textarea" id="as-q" rows="3" maxlength="1500" aria-describedby="as-privacy as-count" data-as-input placeholder="مثال: ما حالة مشروع Layla Travel AI؟"></textarea>
            <div class="wis-row site-aformrow">
              <span class="wis-q__hint" id="as-count" data-as-count>0 / 1500</span>
              <div class="wis-row" style="gap:8px">
                <button type="button" class="wis-btn wis-btn--ghost wis-btn--sm" data-as-clear>${icon('trash')}مسح المحادثة</button>
                <button type="submit" class="wis-btn wis-btn--primary wis-btn--sm" data-as-send>${icon('send')}أرسل السؤال</button>
              </div>
            </div>
            <p class="small muted" data-as-note role="status"></p>
          </form>
        </section>
      </div>
    </section>
  </div>
</section>`;
}

/** @param {any} k */
function footer(k) {
  return `<footer class="site-footer">
  <div class="site-footer__inner">
    <a class="wis-brand" href="#top"><span class="wis-brand__mark">WIS</span><span class="wis-brand__name">${esc(k.company.name)}</span></a>
    <p class="small muted">${esc(k.company.stage)} الأمثلة والمحاكاة في هذا الموقع توضيحية ببيانات تجريبية، ولا تتصل بأي نظام.</p>
  </div>
</footer>`;
}

/** Data the browser needs, from the same knowledge. `<` is escaped so the block cannot close itself. */
/** @param {any} k @param {any} a */
function clientData(k, a) {
  const data = {
    sectors: k.sectors,
    challenges: k.challenges,
    stages: k.methodology,
    parts: k.agentParts,
    fit: { levels: k.fit.levels, sectors: k.fit.sectors },
    faq: k.faq,
    unknown: k.unknown,
    assistant: { name: a.name, steps: a.steps, ui: a.ui }
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * @param {any} k knowledge.json
 * @param {any} a assistant.json
 * @param {{ version: string }} build
 */
function renderPage(k, a, build) {
  const v = encodeURIComponent(build.version);
  return `<!doctype html>
<html lang="ar" dir="rtl" data-theme="night">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(k.company.short)} — ${esc(k.company.headline)}</title>
<meta name="description" content="${esc(k.company.description)}">
<meta name="theme-color" content="#071321">
<meta name="robots" content="noindex, nofollow">
<link rel="preload" href="assets/fonts/IBMPlexSansArabic-Bold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/IBMPlexSansArabic-Regular.woff2" as="font" type="font/woff2" crossorigin>
<script src="assets/js/boot.js?v=${v}"></script>
<link rel="stylesheet" href="assets/css/tokens.css?v=${v}">
<link rel="stylesheet" href="assets/css/wis.css?v=${v}">
<link rel="stylesheet" href="assets/css/site.css?v=${v}">
<script src="assets/js/wis.js?v=${v}" defer></script>
<script src="assets/js/assistant.js?v=${v}" defer></script>
</head>
<body class="wis">
<a class="site-skip" href="#main">تخطَّ إلى المحتوى</a>
${hero(k)}
${siteBar()}
<main id="main" tabindex="-1">
${challenges(k)}
${how(k)}
${fit(k)}
${inside(k)}
${simulation()}
${projects(k)}
${security(k)}
${contact(k, a)}
</main>
${footer(k)}
${dialogs(k)}
<script type="application/json" id="wis-data">${clientData(k, a)}</script>
</body>
</html>
`;
}

module.exports = { renderPage, esc };

