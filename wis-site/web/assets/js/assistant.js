/* مساعد WIS — guided steps, approved answers, optional questions to the server, and a summary built
   from the visitor's own choices. Everything shown is text (textContent); links and buttons come from
   fixed lists in this file, never from the model. The summary is never sent to Gemini; WhatsApp opens only through a visitor-controlled link. */
(function () {
  'use strict';

  function boot() {
    var W = window.WIS || {};
    var D = (W.data && W.data.assistant) || null;
    var root = document.querySelector('[data-assistant]');
    if (!root || !D) return;
    var UI = D.ui;
    var FAQ = (W.data.faq || []);
    var SECTORS = {};
    (W.data.sectors || []).forEach(function (s) { SECTORS[s.id] = s; });
    var LABELS = {};
    D.steps.forEach(function (s) { LABELS[s.id] = {}; s.options.forEach(function (o) { LABELS[s.id][o.id] = o.label; }); });

    var $ = function (sel) { return root.querySelector(sel); };
    var state = { sector: null, problem: null, goal: null, live: null, busy: false, talked: false, edited: false };
    var statusEl = $('[data-as-status]');
    var log = $('[data-as-log]');
    var form = $('[data-as-form]');
    var input = $('[data-as-input]');
    var count = $('[data-as-count]');
    var note = $('[data-as-note]');
    var sendBtn = $('[data-as-send]');
    var suggest = $('[data-as-suggest]');
    var summary = $('[data-as-summary]');
    var sumList = $('[data-as-summary-list]');
    var sumText = $('[data-as-summary-text]');
    var copyStatus = $('[data-as-copy-status]');
    var whatsapp = $('[data-as-whatsapp]');

    function updateWhatsAppLink() {
      var number = whatsapp && whatsapp.getAttribute('data-whatsapp-number');
      if (!number || !/^\d{8,15}$/.test(number)) return;
      var text = sumText.value;
      whatsapp.href = 'https://wa.me/' + number + (text.trim() ? '?text=' + encodeURIComponent(text) : '');
    }
    var maxChars = +(input && input.getAttribute('maxlength')) || 1500;

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function iconEl(name) { var s = el('span'); s.setAttribute('data-icon', name); return s; }
    function mount(node) { if (W.mountIcons) W.mountIcons(node); }

    /* ---------- availability of live answers */
    function setLive(live) {
      state.live = live;
      statusEl.className = 'wis-tag site-astatus ' + (live ? 'wis-tag--sim is-live' : 'wis-tag--planned is-offline');
      statusEl.textContent = '';
      statusEl.appendChild(iconEl(live ? 'dot' : 'info'));
      statusEl.appendChild(document.createTextNode(live ? 'الرد الذكي متاح' : 'إجابات معتمدة فقط'));
      statusEl.title = live ? UI.liveLabel : UI.offline;
      mount(statusEl);
    }
    fetch('/api/assistant/status', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : { live: false }; })
      .then(function (s) { setLive(!!s.live); if (s.maxMessageChars) maxChars = Math.min(maxChars, s.maxMessageChars); })
      .catch(function () { setLive(false); });

    /* ---------- guided steps: one question at a time, every answer editable */
    root.querySelectorAll('[data-choice]').forEach(function (group) {
      var step = group.dataset.choice;
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.wis-chip');
        if (!chip) return;
        group.querySelectorAll('.wis-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        state[step] = chip.dataset.value;
        var idx = D.steps.findIndex(function (s) { return s.id === step; });
        var next = D.steps[idx + 1];
        if (next) {
          var box = root.querySelector('[data-step="' + next.id + '"]');
          if (box && box.hidden) { box.hidden = false; }
        }
        if (step === 'sector') renderSuggestion();
        renderSummary();
      });
    });

    function exampleButtons(sector, wrap) {
      var s = SECTORS[sector];
      if (!s) return;
      var a = el('a', 'wis-btn wis-btn--secondary wis-btn--sm', 'اعرض مثال ' + s.label);
      a.href = '#agent-fit'; a.setAttribute('data-fit-sector', sector);
      var b = el('a', 'wis-btn wis-btn--ghost wis-btn--sm', 'جرّب المحاكاة');
      b.href = '#simulation=' + sector;
      b.addEventListener('click', function (e) { if (W.openSimulation && W.openSimulation(sector)) e.preventDefault(); });
      wrap.appendChild(a); wrap.appendChild(b);
    }

    function renderSuggestion() {
      suggest.textContent = '';
      var p = el('p');
      var row = el('div', 'wis-row');
      if (SECTORS[state.sector]) {
        p.textContent = 'المثال الأقرب لقطاعك في الموقع: ' + SECTORS[state.sector].label + '. شاهد كيف تتغير مهمة الوكيل وأدواته وصلاحياته، أو جرّب المحاكاة.';
        exampleButtons(state.sector, row);
      } else {
        p.textContent = 'لا يوجد مثال جاهز لقطاعك في الموقع بعد. اختر الأقرب لطريقة عملك:';
        Object.keys(SECTORS).forEach(function (k) {
          var a = el('a', 'wis-btn wis-btn--secondary wis-btn--sm', SECTORS[k].label);
          a.href = '#agent-fit'; a.setAttribute('data-fit-sector', k);
          row.appendChild(a);
        });
      }
      suggest.appendChild(p); suggest.appendChild(row);
      suggest.hidden = false;
    }

    function summaryLines() {
      var ex = SECTORS[state.sector] ? SECTORS[state.sector].label : 'لم يُحدَّد (قطاع آخر)';
      return [
        'ملخص احتياج — من موقع WIS',
        'القطاع: ' + (LABELS.sector[state.sector] || ''),
        'المشكلة: ' + (LABELS.problem[state.problem] || ''),
        'النتيجة المطلوبة: ' + (LABELS.goal[state.goal] || ''),
        'المثال الأقرب في الموقع: ' + ex,
        'الخطوة التالية: نقاش قصير مع فريق WIS لفهم طريقة العمل الحالية.',
        'ملاحظات: '
      ];
    }

    function renderSummary() {
      var complete = state.sector && state.problem && state.goal;
      summary.hidden = !complete;
      if (!complete) return;
      sumList.textContent = '';
      [['القطاع', LABELS.sector[state.sector]], ['المشكلة', LABELS.problem[state.problem]], ['النتيجة', LABELS.goal[state.goal]],
        ['المثال الأقرب', SECTORS[state.sector] ? SECTORS[state.sector].label : 'اختر الأقرب من الأمثلة']].forEach(function (r) {
        sumList.appendChild(el('dt', null, r[0])); sumList.appendChild(el('dd', null, r[1]));
      });
      if (!state.edited) sumText.value = summaryLines().join('\n');
      else copyStatus.textContent = 'عدّلت نص الملخص يدويًا، فلم نغيّره. الجدول أعلاه يعرض اختياراتك الحالية.';
      updateWhatsAppLink();
    }
    sumText.addEventListener('input', function () { state.edited = true; updateWhatsAppLink(); });

    $('[data-as-copy]').addEventListener('click', function () {
      var text = sumText.value;
      function done(ok) { copyStatus.textContent = ok ? 'نُسخ الملخص. يمكنك مراجعته وإرساله إلى فريق WIS عبر WhatsApp.' : 'تعذّر النسخ تلقائيًا. حدّد النص وانسخه يدويًا.'; }
      function fallback() {
        sumText.focus(); sumText.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        done(ok);
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      else fallback();
    });

    $('[data-as-restart]').addEventListener('click', function () {
      state.sector = state.problem = state.goal = null; state.edited = false;
      root.querySelectorAll('[data-choice] .wis-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      D.steps.forEach(function (s, i) { var box = root.querySelector('[data-step="' + s.id + '"]'); if (box) box.hidden = i > 0; });
      suggest.hidden = true; summary.hidden = true; sumText.value = ''; copyStatus.textContent = ''; updateWhatsAppLink();
      var first = root.querySelector('[data-choice] .wis-chip'); if (first) first.focus();
    });

    /* ---------- questions and answers */
    function addQuestion(text) {
      var li = el('li');
      var m = el('div', 'wis-msg wis-msg--customer');
      m.appendChild(el('span', 'wis-msg__who', 'أنت'));
      m.appendChild(document.createTextNode(text));
      li.appendChild(m); log.appendChild(li);
      return li;
    }
    function addAnswer(text, kind, extra) {
      var li = el('li');
      var lab = el('span', 'site-alabel' + (kind === 'live' ? ' site-alabel--live' : ''));
      lab.appendChild(iconEl(kind === 'live' ? 'dot' : 'book'));
      lab.appendChild(document.createTextNode(kind === 'live' ? UI.liveLabel : UI.approvedLabel));
      var m = el('div', 'wis-msg wis-msg--agent');
      m.appendChild(el('span', 'wis-msg__who', D.name));
      m.appendChild(document.createTextNode(text));
      if (extra) m.appendChild(extra);
      li.appendChild(lab); li.appendChild(m); log.appendChild(li);
      mount(li);
      return li;
    }
    function addNotice(text) {
      var li = el('li');
      var m = el('div', 'wis-msg wis-msg--notice');
      m.textContent = text;
      li.appendChild(m); log.appendChild(li);
    }
    function faqById(id) { return FAQ.filter(function (f) { return f.id === id; })[0]; }
    // approved answers for common questions, matched locally when live answers are off; never shown as a live reply
    var MATCH = [
      ['price', /سعر|أسعار|اسعار|تكلف|بكم|كم يكلف|ميزاني|price|cost/i],
      ['actions', /حجز|يحجز|دفع|يدفع|ينفذ|ينفّذ|تنفيذ/],
      ['integrations', /تكامل|يتكامل|ربط|يرتبط|أنظمت|انظمت|نظامنا|api/i],
      ['data', /بيانات|خصوصي|أمان|امان|حماي|تشفير|security|privacy/i],
      ['projects', /حالة|مشروع|مشاريع|جاهز|layla|ليلى|ليلي|medflow|sell|trading|تداول/i],
      ['about', /ما هي|ماهي|من انتم|من أنتم|wis|wave|ويف|الشركة|شركتكم/i]
    ];
    function localAnswer(q) {
      for (var i = 0; i < MATCH.length; i++) if (MATCH[i][1].test(q)) return faqById(MATCH[i][0]);
      return null;
    }

    root.querySelector('[data-as-faq]').addEventListener('click', function (e) {
      var b = e.target.closest('[data-faq]');
      if (!b) return;
      var f = faqById(b.dataset.faq);
      if (!f) return;
      addQuestion(f.q);
      addAnswer(f.a, 'approved');
    });

    function actionsFor(sector, needsTeam) {
      var wrap = el('div', 'site-aactions');
      if (SECTORS[sector]) exampleButtons(sector, wrap);
      if (needsTeam) {
        var b = el('a', 'wis-btn wis-btn--ghost wis-btn--sm', 'جهّز ملخص احتياجك');
        b.href = '#assistant';
        b.addEventListener('click', function (e) {
          e.preventDefault();
          var target = summary.hidden ? root.querySelector('[data-choice] .wis-chip') : sumText;
          if (target) { target.scrollIntoView({ block: 'center', behavior: W.reduce && W.reduce() ? 'auto' : 'smooth' }); target.focus({ preventScroll: true }); }
        });
        wrap.appendChild(b);
      }
      return wrap.childNodes.length ? wrap : null;
    }

    function offlineReply(q, message) {
      var f = localAnswer(q);
      addNotice(message || UI.offline);
      if (f) addAnswer(f.a, 'approved');
      else addAnswer(W.data.unknown + ' اختر من الأسئلة الشائعة أعلاه، أو جهّز ملخص احتياجك.', 'approved');
    }

    input.addEventListener('input', function () { count.textContent = input.value.length + ' / ' + maxChars; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.busy) return;
      var q = input.value.replace(/\s+/g, ' ').trim();
      note.textContent = '';
      if (!q) { note.textContent = 'اكتب سؤالك أولًا.'; input.focus(); return; }
      if (q.length > maxChars) { note.textContent = 'رسالتك أطول من ' + maxChars + ' حرف. اختصرها ثم أرسلها.'; return; }
      addQuestion(q);
      input.value = ''; count.textContent = '0 / ' + maxChars;
      if (state.live !== true) { offlineReply(q); return; }

      state.busy = true; sendBtn.disabled = true; note.textContent = 'جارٍ تجهيز الرد…';
      state.talked = true;
      var ctx = {};
      ['sector', 'problem', 'goal'].forEach(function (k) { if (state[k]) ctx[k] = state[k]; });
      fetch('/api/assistant/message', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ message: q, context: ctx })
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false, reason: 'unavailable' }; });
      }).then(function (res) {
        if (res && res.ok && typeof res.reply === 'string') {
          if (res.redacted) addNotice(UI.redacted);
          addAnswer(res.reply, 'live', actionsFor(res.sector, res.needsTeam));
        } else {
          var reason = res && res.reason;
          if (reason === 'too_long' || reason === 'empty' || reason === 'invalid' || reason === 'only_sensitive') { addNotice(res.message || 'تعذّر إرسال الرسالة.'); return; }
          if (reason === 'rate_limited') { addNotice(res.message); return; }
          if (reason === 'quota' || reason === 'daily_limit' || reason === 'disabled' || reason === 'not_configured') setLive(false);
          offlineReply(q, res && res.message);
        }
      }).catch(function () {
        offlineReply(q, UI.offline);
      }).then(function () {
        state.busy = false; sendBtn.disabled = false; note.textContent = '';
      });
    });

    $('[data-as-clear]').addEventListener('click', function () {
      log.textContent = '';
      input.value = ''; count.textContent = '0 / ' + maxChars;
      var msg = 'مُسحت المحادثة من هذه الصفحة.';
      if (state.talked) {
        fetch('/api/assistant/clear', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(function () {});
        msg = 'مُسحت المحادثة من هذه الصفحة ومن ذاكرة خادم WIS المؤقتة. لا يشمل ذلك ما وصل إلى Google عبر Gemini.';
        state.talked = false;
      }
      note.textContent = msg;
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

