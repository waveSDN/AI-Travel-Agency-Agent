/* WIS site behaviours. Vanilla, no dependencies. Adapted from the WIS design system bundle:
   same components and classes; content comes from the reviewed knowledge (the #wis-data block). */
(function () {
  'use strict';
  document.documentElement.classList.add('js'); // also set early by boot.js
  var W = window.WIS = window.WIS || {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  W.esc = esc;
  var dataEl = document.getElementById('wis-data');
  W.data = dataEl ? JSON.parse(dataEl.textContent) : {};

  /* ---------- icons: 24px grid, 1.75 stroke, round joins. Inline so they take currentColor. */
  var P = {
    'arrow': '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    'arrow-down': '<path d="M12 5v14"/><path d="M6 13l6 6 6-6"/>',
    'chevron': '<path d="M14 6l-6 6 6 6"/>',
    'play': '<path d="M8 5.5v13l10.5-6.5z"/>',
    'pause': '<path d="M9 6v12M15 6v12"/>',
    'check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'clock': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'alert': '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4.5"/><path d="M12 17.3v.2"/>',
    'close': '<path d="M6 6l12 12M18 6L6 18"/>',
    'menu': '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'chat': '<path d="M4.5 5h15v10.5H10l-5.5 4z"/>',
    'refresh': '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
    'understand': '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/><path d="M8.5 11h5"/>',
    'book': '<path d="M4 5.5c2.7-1.2 5.4-1 8 .8 2.6-1.8 5.3-2 8-.8V19c-2.7-1.2-5.4-1-8 .8-2.6-1.8-5.3-2-8-.8z"/><path d="M12 6.3v13.5"/>',
    'memory': '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/>',
    'tool': '<path d="M14.5 4.5a4.5 4.5 0 0 0-4 6.3L4.5 16.8V19.5h2.7l6-6a4.5 4.5 0 0 0 6.3-4l-2.6 1.1-2.3-2.3z"/>',
    'shield': '<path d="M12 3.5l7 2.8v5c0 4.3-2.9 7.6-7 9.2-4.1-1.6-7-4.9-7-9.2v-5z"/><path d="M9 12l2 2 4-4"/>',
    'handoff': '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5"/><path d="M15.5 6a3 3 0 0 1 0 5.5"/><path d="M17.5 14.7c1.4.6 2.4 2 2.8 4.3"/>',
    'calendar': '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M9 3.5v4M15 3.5v4"/>',
    'flask': '<path d="M9.5 3.5h5M10.5 3.5v6L5.2 18a1.6 1.6 0 0 0 1.4 2.5h10.8a1.6 1.6 0 0 0 1.4-2.5l-5.3-8.5v-6"/><path d="M7.5 15h9"/>',
    'chart': '<path d="M4 19.5h16"/><path d="M6.5 15l4-4.5 3 3 5-6"/>',
    'pending': '<circle cx="12" cy="12" r="7.5" stroke-dasharray="3 3.2"/>',
    'dot': '<circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/>',
    'lock': '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    'database': '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    'user': '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 19.5c1.2-3.4 3.9-5 7-5s5.8 1.6 7 5"/>',
    'send': '<path d="M20 4L4 11l6.5 2.5L13 20z"/><path d="M20 4l-9.5 9.5"/>',
    'guard': '<path d="M12 3.5l7 2.8v5c0 4.3-2.9 7.6-7 9.2-4.1-1.6-7-4.9-7-9.2v-5z"/><path d="M12 8.5v6" stroke-dasharray="1.5 2.5"/>',
    'info': '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.8v.2"/>',
    'copy': '<rect x="8" y="8" width="11.5" height="11.5" rx="2"/><path d="M5 15.5V6a1.5 1.5 0 0 1 1.5-1.5H16"/>',
    'trash': '<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>'
  };
  W.iconSvg = function (name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || '') + '</svg>';
  };
  W.mountIcons = function (root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (el.dataset.iconMounted) return;
      el.classList.add('wis-icon');
      el.innerHTML = W.iconSvg(el.dataset.icon);
      el.dataset.iconMounted = '1';
    });
  };

  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = function () { return !!(motionQuery && motionQuery.matches); };
  W.reduce = reduce;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var ease = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  W.scrollTo = function (el) { el.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'start' }); };

  /* ---------- Hero: the present is revealed right-to-left behind one smooth wave, driven by scroll.
     Markup holds the PRESENT state with light text (what shows without JS or with reduced motion).
     Wide screens: text sits over the photos; a dark-ink copy lies over the past and the light copy is
     clipped with the present photo, so the text changes colour exactly at the wave.
     Narrow screens: photos on top, text in a navy panel below; only the photos are clipped. */
  W.hero = function (root) {
    var media = root.querySelector('.wis-hero__media');
    var nowPaint = root.querySelector('.wis-hero__layer--present');
    var uiNow = root.querySelector('.wis-hero__ui--present');
    var svg = root.querySelector('.wis-hero__wave');
    var stackedQ = window.matchMedia('(max-width: 899px)');
    var uiPast = null;
    if (uiNow) {
      uiPast = uiNow.cloneNode(true);
      uiPast.classList.remove('wis-hero__ui--present');
      uiPast.classList.add('wis-hero__ui--past', 'wis-on-light');
      uiPast.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
      uiPast.setAttribute('aria-hidden', 'true');
      uiPast.setAttribute('inert', '');
      root.insertBefore(uiPast, nowPaint.parentNode === root ? nowPaint : media.nextSibling);
    }
    var parts = svg ? { glow: svg.querySelector('.glow'), wash: svg.querySelector('.wash'), echo: svg.querySelector('.echo'), mid: svg.querySelector('.mid'), core: svg.querySelector('.core'), washGrad: svg.querySelector('linearGradient') } : null;

    function dims() { var s = stackedQ.matches; return { stacked: s, amp: s ? 13 : 30, lambda: s ? 300 : 560 }; }
    function curve(p, w, h, g) {
      var x0 = w - 18 - p * (w + 90), ph = p * 2.4, pts = [];
      for (var y = -20; y <= h + 20; y += 12) pts.push([x0 + g.amp * Math.sin(2 * Math.PI * y / g.lambda + ph) + g.amp * .28 * Math.sin(2 * Math.PI * y / (g.lambda * .41) + 1.7 * ph), y]);
      return { pts: pts, x0: x0 };
    }
    function d(pts, dx) {
      var s = 'M' + (pts[0][0] + dx).toFixed(1) + ',' + pts[0][1];
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i][0] + pts[i + 1][0]) / 2 + dx, my = (pts[i][1] + pts[i + 1][1]) / 2;
        s += ' Q' + (pts[i][0] + dx).toFixed(1) + ',' + pts[i][1] + ' ' + mx.toFixed(1) + ',' + my;
      }
      return s;
    }
    var last = -1;
    function set(p, force) {
      p = clamp(p, 0, 1);
      if (!force && Math.abs(p - last) < 0.0005) return;
      last = p;
      var g = dims();
      root.style.setProperty('--p', p.toFixed(3));
      root.classList.toggle('is-done', p >= 1);
      var clipped = g.stacked ? [nowPaint] : [nowPaint, uiNow];
      if (g.stacked && uiNow) uiNow.style.clipPath = 'none';
      if (p >= 1) {
        clipped.forEach(function (el) { if (el) el.style.clipPath = 'none'; });
        if (svg) svg.style.opacity = 0;
        swap(true, g.stacked);
        return;
      }
      var w = media.offsetWidth, h = media.offsetHeight;
      var c = curve(p, w, h, g);
      var poly = c.pts.map(function (q) { return q[0].toFixed(1) + 'px ' + q[1] + 'px'; });
      poly.push((w + 40) + 'px ' + (h + 20) + 'px', (w + 40) + 'px -20px');
      var cp = 'polygon(' + poly.join(',') + ')';
      clipped.forEach(function (el) { if (el) el.style.clipPath = cp; });
      if (parts) {
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.style.opacity = 1;
        var line = d(c.pts, 0);
        parts.glow.setAttribute('d', line); parts.mid.setAttribute('d', line); parts.core.setAttribute('d', line);
        parts.echo.setAttribute('d', d(c.pts, 7));
        var back = c.pts.slice().reverse().map(function (q) { return 'L' + (q[0] + 64).toFixed(1) + ',' + q[1]; }).join(' ');
        parts.wash.setAttribute('d', line + ' ' + back + ' Z');
        if (parts.washGrad) { parts.washGrad.setAttribute('x1', c.x0 - g.amp); parts.washGrad.setAttribute('x2', c.x0 + 64 + g.amp); }
      }
      swap(p > .5, g.stacked);
    }
    function swap(presentActive, stacked) {
      // the readable copy is the one most of the screen shows; the other is inert and hidden from assistive tech
      if (!uiNow || !uiPast) return;
      var nowOn = stacked || presentActive;
      uiNow.toggleAttribute('inert', !nowOn); uiNow.setAttribute('aria-hidden', nowOn ? 'false' : 'true');
      uiPast.toggleAttribute('inert', nowOn); uiPast.setAttribute('aria-hidden', nowOn ? 'true' : 'false');
    }
    var track = root.closest('.wis-hero-track');
    function fromScroll() {
      if (reduce() || !track) return set(1, true);
      var r = track.getBoundingClientRect();
      var dist = Math.max(1, track.offsetHeight - root.offsetHeight);
      set(ease(clamp(-r.top / dist, 0, 1)));
    }
    var queued = false;
    function onScroll() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; fromScroll(); }); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { last = -1; fromScroll(); });
    if (motionQuery && motionQuery.addEventListener) motionQuery.addEventListener('change', function () { last = -1; fromScroll(); });
    if (stackedQ.addEventListener) stackedQ.addEventListener('change', function () { last = -1; fromScroll(); });
    root._wisSet = function (p) { set(p, true); };
    fromScroll();
  };

  /* ---------- Tabs (roving focus; ArrowLeft = next in RTL) */
  W.tabs = function (list) {
    var tabs = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function select(t, focus) {
      // tabs may each own a panel, or share one panel whose content is swapped (WIS.fit)
      var target = t.getAttribute('aria-controls');
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        var pid = x.getAttribute('aria-controls');
        if (pid && pid !== target) { var p = document.getElementById(pid); if (p) p.hidden = true; }
      });
      if (target) { var tp = document.getElementById(target); if (tp) { tp.hidden = false; if (t.id) tp.setAttribute('aria-labelledby', t.id); } }
      if (focus) t.focus({ preventScroll: focus === 'quiet' });
      list.dispatchEvent(new CustomEvent('wis:tab', { detail: t.dataset.value || t.textContent.trim() }));
    }
    list._wisSelect = function (value, focus) {
      var t = tabs.filter(function (x) { return (x.dataset.value || x.textContent.trim()) === value; })[0];
      if (t) select(t, focus);
      return t;
    };
    tabs.forEach(function (t, i) {
      t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1;
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var rtl = getComputedStyle(list).direction === 'rtl';
        var next = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[e.key];
        if (e.key === 'Home') next = -i; if (e.key === 'End') next = tabs.length - 1 - i;
        if (next === undefined) return;
        e.preventDefault();
        select(tabs[(i + next + tabs.length) % tabs.length], true);
      });
    });
  };

  /* ---------- Radio group of .wis-option */
  W.radios = function (group) {
    var items = [].slice.call(group.querySelectorAll('[role="radio"]'));
    function pick(it, focus) {
      items.forEach(function (x) { x.setAttribute('aria-checked', x === it); x.tabIndex = x === it ? 0 : -1; });
      if (focus) it.focus();
      group.dispatchEvent(new CustomEvent('wis:change', { detail: it.dataset.value }));
    }
    items.forEach(function (it, i) {
      it.tabIndex = it.getAttribute('aria-checked') === 'true' ? 0 : -1;
      it.addEventListener('click', function () { pick(it); });
      it.addEventListener('keydown', function (e) {
        var k = { ArrowDown: 1, ArrowUp: -1, ArrowLeft: 1, ArrowRight: -1 }[e.key];
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(it); return; }
        if (!k) return;
        e.preventDefault();
        pick(items[(i + k + items.length) % items.length], true);
      });
    });
    group._wisPick = function (value) { var it = items.filter(function (x) { return x.dataset.value === value; })[0]; if (it) pick(it); };
  };

  /* ---------- Challenges: each choice swaps the example and its explanation */
  W.challenges = function (root) {
    var data = {};
    (W.data.challenges || []).forEach(function (c) { data[c.id] = c; });
    var group = root.querySelector('[role="radiogroup"]');
    var panel = root.querySelector('[data-challenge-panel]');
    function render(id) {
      var c = data[id];
      if (!c || !panel) return;
      var n = c.steps.length, cur = c.current;
      var fill = 'calc(' + Math.round((cur - 1) / (n - 1) * 100) + '% - 22px)';
      panel.querySelector('[data-ch="kicker"]').textContent = c.kicker;
      panel.querySelector('[data-ch="headline"]').textContent = c.headline;
      panel.querySelector('[data-ch="value"]').innerHTML = '<span data-icon="check"></span><p><s>' + esc(c.before) + '</s> ' + esc(c.after) + '</p>';
      panel.querySelector('[data-ch="steps"]').innerHTML = '<div class="wis-steps__fill" style="width:' + fill + '"></div>' + c.steps.map(function (s, i) {
        var k = i + 1, cls = k < cur ? ' wis-step--done' : '';
        return '<div class="wis-step' + cls + '"' + (k === cur ? ' aria-current="step"' : '') + '><span class="wis-step__node">' + k + '</span><span class="wis-step__name">' + esc(s.name) + '</span><span class="wis-step__out">' + esc(s.out) + '</span></div>';
      }).join('');
      panel.querySelector('[data-ch="card-title"]').textContent = c.card.title;
      panel.querySelector('[data-ch="card-state"]').textContent = c.card.state;
      panel.querySelector('[data-ch="card-rows"]').innerHTML = c.card.rows.map(function (r) {
        var v = r[1].charAt(0) === '!' ? '<span class="wis-missing"><span data-icon="alert"></span>' + esc(r[1].slice(1)) + '</span>' : esc(r[1]);
        return '<dt>' + esc(r[0]) + '</dt><dd>' + v + '</dd>';
      }).join('');
      var go = panel.querySelector('[data-ch="go"]');
      if (go) { go.setAttribute('href', '#simulation=' + c.sector); go.dataset.sector = c.sector; }
      root.dataset.challenge = id;
      W.mountIcons(panel);
    }
    if (group) group.addEventListener('wis:change', function (e) { render(e.detail); });
    var go = panel && panel.querySelector('[data-ch="go"]');
    if (go) go.addEventListener('click', function (e) { if (W.openSimulation(go.dataset.sector)) e.preventDefault(); });
    var sel = group && group.querySelector('[aria-checked="true"]');
    render(sel ? sel.dataset.value : 'followup');
  };

  /* ---------- Methodology stages: the rail is a set of toggle buttons that swap the stage panel */
  W.stages = function (root) {
    var btns = [].slice.call(root.querySelectorAll('[data-stage]'));
    var data = W.data.stages || [];
    var fill = root.querySelector('.wis-steps__fill');
    function show(n, focus) {
      var s = data[n - 1];
      if (!s) return;
      btns.forEach(function (b) {
        var k = +b.dataset.stage;
        b.classList.toggle('wis-step--done', k < n);
        if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        b.setAttribute('aria-pressed', k === n);
      });
      if (fill) fill.style.width = 'calc(' + ((n - 1) * 25) + '% - ' + (n === 1 ? 0 : 22) + 'px)';
      root.querySelector('[data-stage-slot="num"]').textContent = s.n;
      root.querySelector('[data-stage-slot="name"]').textContent = s.name;
      root.querySelector('[data-stage-slot="detail"]').textContent = s.detail;
      root.querySelector('[data-stage-slot="out"]').textContent = s.out;
      root.querySelectorAll('[data-stage-only]').forEach(function (el) { el.hidden = +el.dataset.stageOnly !== n; });
      if (focus) btns[n - 1].focus();
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { show(+b.dataset.stage); });
      b.addEventListener('keydown', function (e) {
        var k = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
        if (!k) return;
        e.preventDefault();
        show(((i + k + btns.length) % btns.length) + 1, true);
      });
    });
    var cur = root.querySelector('[data-stage][aria-current="step"]');
    show(cur ? +cur.dataset.stage : 2);
  };

  /* ---------- Agent parts: toggle buttons that swap one panel's content */
  W.parts = function (root) {
    var btns = [].slice.call(root.querySelectorAll('[data-part]'));
    var data = {};
    (W.data.parts || []).forEach(function (p) { data[p.id] = p; });
    function show(b) {
      btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      var k = b.dataset.part, d = data[k];
      root.querySelectorAll('[data-part-line]').forEach(function (l) { l.classList.toggle('is-on', l.dataset.partLine === k); });
      if (!d) return;
      var slot = function (n) { return root.querySelector('[data-slot="' + n + '"]'); };
      slot('num').textContent = d.n;
      slot('title').textContent = d.name;
      slot('what').textContent = d.what;
      slot('result').innerHTML = '<div class="wis-toolcard" style="width:100%"><div class="wis-toolcard__head"><span data-icon="' + esc(d.tool[0]) + '"></span>' + esc(d.tool[1]) + '</div><div class="wis-toolcard__result">' + esc(d.tool[2]) + '</div></div>';
      slot('happened').textContent = d.happened;
      slot('source').textContent = d.source;
      slot('next').textContent = d.next;
      root.querySelectorAll('[data-hl]').forEach(function (m) { m.classList.toggle('wis-msg--highlight', (m.dataset.hl || '').split(' ').indexOf(k) > -1); });
      W.mountIcons(root);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { show(b); }); });
  };

  /* ---------- Simulation: scripted paths only (no model, no real booking, no messages sent) */
  var C = function (t) { return { who: 'customer', text: t }; };
  var A = function (t, actions) { return { who: 'agent', text: t, actions: actions }; };
  var T = function (tool, t, err) { return { tool: tool, text: t, error: !!err }; };
  var Y = function (t, icon) { return { who: 'system', text: t, icon: icon }; };
  var L = function (s, t, d, state) { return { s: s, t: t, d: d, state: state }; };
  var code = function (c) { return '<code>' + c + '</code>'; };

  var clinicStart = [C('أريد موعدًا غدًا مساءً'), A('أكيد. أي خدمة تحتاج: الكشف العام أم تنظيف الأسنان؟'), C('تنظيف أسنان'), T('التحقق من المواعيد', 'المتاح غدًا: 6:00، 7:30 مساءً')];
  var clinicLog = [L('done', 'فهم الطلب', 'موعد · غدًا · مساءً · ناقص: الخدمة'), L('done', 'طلب المعلومة الناقصة', 'الخدمة: تنظيف أسنان'), L('done', 'التحقق من التوفر', code('check_availability') + ' ← 6:00، 7:30 مساءً')];
  var travelStart = [C('أبغى رحلة لإسطنبول في ديسمبر لأربعة أشخاص'), A('جميل. من أي مدينة ستغادرون، وما تواريخ السفر التقريبية؟'), C('من الرياض، من 10 إلى 17 ديسمبر')];
  var travelLog = [L('done', 'فهم الطلب', 'رحلة · إسطنبول · ديسمبر · 4 مسافرين'), L('done', 'طلب المعلومة الناقصة', 'المغادرة: الرياض · 10 إلى 17 ديسمبر')];
  var salesStart = [C('عندكم الساعة الرياضية باللون الأسود؟'), A('نعم. أي مقاس تفضّل: 41 أم 45 مم؟'), C('45')];
  var salesLog = [L('done', 'فهم الطلب', 'منتج · اللون: أسود · ناقص: المقاس'), L('done', 'طلب المعلومة الناقصة', 'المقاس: 45 مم')];
  var cat = function (a, b) { return a.concat(b); };

  W.simScripts = {
    clinic: {
      name: 'عيادة أسنان تجريبية',
      paths: {
        waiting: {
          chat: cat(clinicStart, [C('7:30 مناسب'), A('سأحجز لك تنظيف الأسنان غدًا الساعة 7:30 مساءً. هل تؤكد الموعد؟', [{ label: 'تأكيد الموعد التجريبي', go: 'confirmed', primary: true }, { label: 'وقت أبكر', go: 'edit' }])]),
          log: cat(clinicLog, [L('waiting', 'انتظار تأكيد العميل', 'اختار العميل 7:30 مساءً', 'بانتظار التأكيد'), L('pending', 'تأكيد الحجز التجريبي', 'لا يُنفّذ قبل موافقة العميل')]),
          result: '<span data-icon="clock"></span>بانتظار تأكيد العميل: <b>تنظيف أسنان · غدًا 7:30 مساءً</b>. لم يُحجز شيء بعد.'
        },
        edit: {
          chat: cat(clinicStart, [C('أفضّل وقتًا أبكر'), A('المتاح الأبكر غدًا 6:00 مساءً لتنظيف الأسنان. هل أحجزه لك؟', [{ label: 'تأكيد 6:00 مساءً', go: 'confirmedEarly', primary: true }])]),
          log: cat(clinicLog, [L('waiting', 'انتظار تأكيد العميل', 'طلب العميل وقتًا أبكر: عُرض 6:00 مساءً', 'بانتظار التأكيد'), L('pending', 'تأكيد الحجز التجريبي', 'لا يُنفّذ قبل موافقة العميل')]),
          result: '<span data-icon="clock"></span>بانتظار تأكيد العميل: <b>تنظيف أسنان · غدًا 6:00 مساءً</b>. لم يُحجز شيء بعد.'
        },
        confirmed: {
          chat: cat(clinicStart, [C('7:30 مناسب'), A('سأحجز لك تنظيف الأسنان غدًا الساعة 7:30 مساءً. هل تؤكد الموعد؟'), C('أؤكد الموعد'),
            T('تثبيت الحجز', 'موعد تجريبي مؤكد: تنظيف أسنان، غدًا 7:30 مساءً'), Y('محاكاة: لم يُحجز موعد حقيقي ولم تُرسل أي رسالة', 'check')]),
          log: cat(clinicLog, [L('done', 'انتظار تأكيد العميل', 'أكّد العميل 7:30 مساءً'), L('done', 'تأكيد الحجز التجريبي', code('create_booking') + ' ← مؤكد (تجريبي): تنظيف أسنان · غدًا 7:30 مساءً')]),
          result: '<span data-icon="check"></span><b>موعد تجريبي مؤكد · تنظيف أسنان · غدًا 7:30 مساءً</b>. ساهمت: أداة المواعيد، والذاكرة (الخدمة)، والصلاحيات (التأكيد قبل الحجز). لم يُحجز موعد حقيقي.'
        },
        confirmedEarly: {
          chat: cat(clinicStart, [C('أفضّل وقتًا أبكر'), A('المتاح الأبكر غدًا 6:00 مساءً لتنظيف الأسنان. هل أحجزه لك؟'), C('نعم، 6:00 مناسب'),
            T('تثبيت الحجز', 'موعد تجريبي مؤكد: تنظيف أسنان، غدًا 6:00 مساءً'), Y('محاكاة: لم يُحجز موعد حقيقي ولم تُرسل أي رسالة', 'check')]),
          log: cat(clinicLog, [L('done', 'انتظار تأكيد العميل', 'أكّد العميل 6:00 مساءً'), L('done', 'تأكيد الحجز التجريبي', code('create_booking') + ' ← مؤكد (تجريبي): تنظيف أسنان · غدًا 6:00 مساءً')]),
          result: '<span data-icon="check"></span><b>موعد تجريبي مؤكد · تنظيف أسنان · غدًا 6:00 مساءً</b>. لم يُحجز موعد حقيقي.'
        },
        unavailable: {
          chat: [C('أريد موعدًا غدًا مساءً'), A('أكيد. أي خدمة تحتاج: الكشف العام أم تنظيف الأسنان؟'), C('تنظيف أسنان'),
            T('التحقق من المواعيد', 'لا توجد مواعيد مساء الغد'),
            A('لا يتوفر موعد مساء الغد لتنظيف الأسنان. أقرب المتاح: بعد غد 6:00 مساءً، أو غدًا 11:00 صباحًا. أيهما يناسبك؟')],
          log: [clinicLog[0], clinicLog[1], L('done', 'التحقق من التوفر', code('check_availability') + ' ← لا مواعيد مساء الغد'),
            L('waiting', 'اقتراح موعد بديل', 'بعد غد 6:00 مساءً، أو غدًا 11:00 صباحًا', 'بانتظار الاختيار'), L('pending', 'تأكيد الحجز التجريبي', 'لم يبدأ')],
          result: '<span data-icon="clock"></span>لا موعد مساء الغد لتنظيف الأسنان. البديلان المعروضان: <b>بعد غد 6:00 مساءً</b>، أو <b>غدًا 11:00 صباحًا</b>. لم يُحجز شيء.'
        },
        outage: {
          chat: [C('أريد موعدًا غدًا مساءً'), A('أكيد. أي خدمة تحتاج: الكشف العام أم تنظيف الأسنان؟'), C('تنظيف أسنان'),
            T('التحقق من المواعيد', 'تعذّر الاتصال بنظام المواعيد', true),
            A('أعتذر، لا أستطيع الوصول إلى جدول المواعيد الآن. سأحوّل طلبك إلى موظف الاستقبال ليؤكد لك الموعد.'), Y('تحويل إلى موظف الاستقبال مع ملخص الطلب')],
          log: [clinicLog[0], clinicLog[1], L('error', 'التحقق من التوفر', code('check_availability') + ' ← لا استجابة خلال المهلة', 'تعطل الاتصال'),
            L('handoff', 'تحويل لموظف', 'السبب: تعطل الأداة · أُرفق ملخص المحادثة', 'تحويل'), L('pending', 'تأكيد الحجز التجريبي', 'لم يُنفّذ')],
          result: '<span data-icon="handoff"></span>لم يُحجز شيء. الطلب <b>(تنظيف أسنان · غدًا مساءً)</b> لدى موظف الاستقبال مع ملخص المحادثة.'
        },
        handoff: {
          chat: [C('أريد موعدًا غدًا مساءً'), A('أكيد. أي خدمة تحتاج: الكشف العام أم تنظيف الأسنان؟'), C('عندي ألم شديد في الضرس، هل هو خطير؟'),
            A('لا أستطيع تقييم حالتك الصحية. سأحوّلك الآن إلى فريق العيادة ليتواصل معك.'), Y('تحويل إلى فريق العيادة: سؤال يحتاج تقييمًا طبيًا')],
          log: [L('done', 'فهم الطلب', 'موعد · غدًا · مساءً'), L('handoff', 'تحويل لموظف', 'السبب: سؤال يحتاج تقييمًا طبيًا، خارج نطاق الوكيل', 'تحويل'),
            L('pending', 'التحقق من التوفر', 'متوقف حتى يرد فريق العيادة')],
          result: '<span data-icon="handoff"></span>الطلب <b>(موعد غدًا مساءً · ألم في الضرس)</b> لدى فريق العيادة. لم يقدّم الوكيل أي رأي طبي.'
        }
      }
    },
    travel: {
      name: 'مكتب سفر تجريبي',
      paths: {
        waiting: {
          chat: cat(travelStart, [T('البحث عن الرحلات', 'خياران مباشران في هذه التواريخ'),
            A('وجدت رحلتين مباشرتين. هل أجهّز عرض سعر يراجعه موظف الحجوزات قبل إرساله؟', [{ label: 'نعم، جهّز العرض', go: 'confirmed', primary: true }])]),
          log: cat(travelLog, [L('done', 'التحقق من التوفر', code('search_flights') + ' ← خياران مباشران'), L('waiting', 'انتظار تأكيد العميل', 'هل يُجهّز عرض السعر؟', 'بانتظار التأكيد'),
            L('pending', 'مراجعة موظف وإرسال العرض', 'لا يُرسل شيء قبل الموافقة')]),
          result: '<span data-icon="clock"></span>بانتظار موافقة العميل على تجهيز العرض: <b>إسطنبول · من الرياض · 10 إلى 17 ديسمبر · 4 مسافرين</b>.'
        },
        confirmed: {
          chat: cat(travelStart, [T('البحث عن الرحلات', 'خياران مباشران في هذه التواريخ'), C('نعم، جهّز العرض'),
            A('تم. سيراجع موظف الحجوزات العرض ثم يرسله لك.'), Y('محاكاة: مسودة عرض بانتظار مراجعة موظف، ولم يُرسل شيء', 'clock')]),
          log: cat(travelLog, [L('done', 'التحقق من التوفر', code('search_flights') + ' ← خياران مباشران'), L('done', 'انتظار تأكيد العميل', 'وافق العميل على تجهيز العرض'),
            L('waiting', 'مراجعة موظف وإرسال العرض', code('draft_quote') + ' ← مسودة', 'بانتظار الموافقة')]),
          result: '<span data-icon="clock"></span><b>مسودة عرض تجريبية · إسطنبول · من الرياض · 10 إلى 17 ديسمبر · 4 مسافرين · رحلتان مباشرتان</b> · بانتظار مراجعة موظف الحجوزات. لم يُرسل شيء.'
        },
        unavailable: {
          chat: cat(travelStart, [T('البحث عن الرحلات', 'لا رحلات مباشرة في هذه التواريخ'),
            A('لا توجد رحلات مباشرة في هذه التواريخ. هل تقبلون رحلة بتوقف واحد، أو أبحث لكم يومًا قبل أو بعد؟')]),
          log: cat(travelLog, [L('done', 'التحقق من التوفر', code('search_flights') + ' ← لا رحلات مباشرة'), L('waiting', 'اقتراح بديل', 'توقف واحد، أو تغيير اليوم', 'بانتظار الاختيار'),
            L('pending', 'مراجعة موظف وإرسال العرض', 'لم يبدأ')]),
          result: '<span data-icon="clock"></span>لا رحلة مباشرة من الرياض إلى إسطنبول في <b>10 إلى 17 ديسمبر</b>. البديلان: <b>توقف واحد</b>، أو <b>يوم قبل أو بعد</b>. لم يُجهّز عرض.'
        },
        outage: {
          chat: cat(travelStart, [T('البحث عن الرحلات', 'تعذّر الاتصال بنظام الحجوزات', true),
            A('أعتذر، لا أستطيع الوصول إلى نظام الحجوزات الآن. سأحوّل طلبك إلى موظف الحجوزات مع كل التفاصيل.'), Y('تحويل إلى موظف الحجوزات مع ملخص الطلب')]),
          log: cat(travelLog, [L('error', 'التحقق من التوفر', code('search_flights') + ' ← لا استجابة خلال المهلة', 'تعطل الاتصال'),
            L('handoff', 'تحويل لموظف', 'السبب: تعطل الأداة · أُرفق ملخص المحادثة', 'تحويل')]),
          result: '<span data-icon="handoff"></span>الطلب <b>(إسطنبول · من الرياض · 10 إلى 17 ديسمبر · 4 مسافرين)</b> لدى موظف الحجوزات مع ملخص المحادثة.'
        },
        handoff: {
          chat: [travelStart[0], travelStart[1], C('هل تضمنون لي التأشيرة؟'),
            A('قرار التأشيرة لدى الجهات المختصة، ولا أستطيع ضمانه. سأحوّلك إلى موظف الحجوزات ليشرح لك المتطلبات.'), Y('تحويل إلى موظف الحجوزات: سؤال خارج نطاق الوكيل')],
          log: [travelLog[0], L('handoff', 'تحويل لموظف', 'السبب: طلب ضمان لا يملكه الوكيل', 'تحويل'), L('pending', 'التحقق من التوفر', 'متوقف حتى يرد الموظف')],
          result: '<span data-icon="handoff"></span>الطلب <b>(إسطنبول · ديسمبر · 4 مسافرين · سؤال عن التأشيرة)</b> لدى موظف الحجوزات. لم يقدّم الوكيل أي ضمان.'
        }
      }
    },
    sales: {
      name: 'متجر تجريبي',
      paths: {
        waiting: {
          chat: cat(salesStart, [T('التحقق من المخزون', 'متوفرة بالأسود، مقاس 45 مم'),
            A('متوفرة بالأسود مقاس 45 مم. هل أضيفها إلى طلبك؟', [{ label: 'أضف إلى الطلب التجريبي', go: 'confirmed', primary: true }])]),
          log: cat(salesLog, [L('done', 'التحقق من التوفر', code('check_stock') + ' ← متوفر'), L('waiting', 'انتظار تأكيد العميل', 'إضافة المنتج إلى الطلب؟', 'بانتظار التأكيد'),
            L('pending', 'إنشاء الطلب التجريبي', 'لا يُنشأ قبل الموافقة')]),
          result: '<span data-icon="clock"></span>بانتظار تأكيد العميل: <b>ساعة رياضية · أسود · 45 مم · متوفرة</b>.'
        },
        confirmed: {
          chat: cat(salesStart, [T('التحقق من المخزون', 'متوفرة بالأسود، مقاس 45 مم'), C('أضفها'),
            T('إنشاء الطلب', 'مسودة طلب تجريبية: ساعة رياضية سوداء 45 مم'), Y('محاكاة: لم يُنشأ طلب حقيقي ولم يُطلب أي دفع', 'check')]),
          log: cat(salesLog, [L('done', 'التحقق من التوفر', code('check_stock') + ' ← متوفر'), L('done', 'انتظار تأكيد العميل', 'وافق العميل'),
            L('done', 'إنشاء الطلب التجريبي', code('create_order') + ' ← مسودة: ساعة رياضية · أسود · 45 مم')]),
          result: '<span data-icon="check"></span><b>مسودة طلب تجريبية · ساعة رياضية · أسود · 45 مم</b> · يكمل فريق المتجر بقية الخطوات. لم يُطلب أي دفع.'
        },
        unavailable: {
          chat: cat(salesStart, [T('التحقق من المخزون', 'غير متوفرة بالأسود مقاس 45 مم'),
            A('نفدت بالأسود مقاس 45 مم. متوفرة بالرمادي بالمقاس نفسه، أو أبلغك عند توفرها إذا رغبت.')]),
          log: cat(salesLog, [L('done', 'التحقق من التوفر', code('check_stock') + ' ← غير متوفر'), L('waiting', 'اقتراح بديل', 'الرمادي 45 مم، أو تنبيه عند التوفر', 'بانتظار الاختيار'),
            L('pending', 'إنشاء الطلب التجريبي', 'لم يبدأ')]),
          result: '<span data-icon="clock"></span><b>ساعة رياضية · أسود · 45 مم</b> غير متوفرة. البديلان: <b>الرمادي بالمقاس نفسه</b>، أو <b>تنبيه عند التوفر</b>.'
        },
        outage: {
          chat: cat(salesStart, [T('التحقق من المخزون', 'تعذّر الاتصال بنظام المخزون', true),
            A('لا أستطيع التحقق من المخزون الآن. سأحوّل سؤالك إلى فريق المبيعات ليرد عليك.'), Y('تحويل إلى فريق المبيعات مع ملخص الطلب')]),
          log: cat(salesLog, [L('error', 'التحقق من التوفر', code('check_stock') + ' ← لا استجابة خلال المهلة', 'تعطل الاتصال'),
            L('handoff', 'تحويل لموظف', 'السبب: تعطل الأداة · أُرفق ملخص المحادثة', 'تحويل')]),
          result: '<span data-icon="handoff"></span>الطلب <b>(ساعة رياضية · أسود · 45 مم)</b> لدى فريق المبيعات مع ملخص المحادثة.'
        },
        handoff: {
          chat: [salesStart[0], salesStart[1], C('أبغى خصم خاص قبل ما أطلب'),
            A('لا أملك صلاحية تغيير الأسعار. سأحوّلك إلى فريق المبيعات.'), Y('تحويل إلى فريق المبيعات: طلب خارج صلاحيات الوكيل')],
          log: [L('done', 'فهم الطلب', 'منتج · اللون: أسود'), L('handoff', 'تحويل لموظف', 'السبب: طلب خصم خارج الصلاحيات', 'تحويل'), L('pending', 'التحقق من التوفر', 'متوقف حتى يرد الفريق')],
          result: '<span data-icon="handoff"></span>الطلب <b>(ساعة رياضية · أسود · طلب خصم)</b> لدى فريق المبيعات. لم يعد الوكيل بأي خصم.'
        }
      }
    }
  };

  W.simulation = function (root) {
    var S = W.simScripts;
    var chat = root.querySelector('[data-sim-chat]'), log = root.querySelector('[data-sim-log]'), result = root.querySelector('[data-sim-result]');
    var state = { sector: root.dataset.sector || 'clinic', path: 'waiting' };
    function render() {
      var sec = S[state.sector], sc = sec && sec.paths[state.path];
      if (!sc) return;
      chat.innerHTML = sc.chat.map(function (m) {
        if (m.tool) return '<div class="wis-toolcard' + (m.error ? ' wis-toolcard--error' : '') + '"><div class="wis-toolcard__head"><span data-icon="' + (m.error ? 'alert' : 'tool') + '"></span>' + m.tool + '</div><div class="wis-toolcard__result">' + m.text + '</div></div>';
        if (m.who === 'system') return '<div class="wis-msg wis-msg--system"><span data-icon="' + (m.icon || 'handoff') + '"></span>' + m.text + '</div>';
        var actions = m.actions ? '<div class="wis-msg__actions">' + m.actions.map(function (a) {
          return '<button type="button" class="wis-btn wis-btn--' + (a.primary ? 'primary' : 'secondary') + ' wis-btn--sm" data-sim-go="' + a.go + '">' + a.label + '</button>';
        }).join('') + '</div>' : '';
        return '<div class="wis-msg wis-msg--' + m.who + '"><span class="wis-msg__who">' + (m.who === 'agent' ? 'الوكيل' : 'العميل') + '</span>' + m.text + actions + '</div>';
      }).join('');
      log.innerHTML = sc.log.map(function (l) {
        var icon = { done: 'check', waiting: 'clock', error: 'alert', handoff: 'handoff', pending: 'pending' }[l.s];
        return '<li class="wis-log__item wis-log__item--' + l.s + '"><span class="wis-log__mark"><span data-icon="' + icon + '"></span></span><div><div class="wis-log__title">' + l.t +
          (l.state ? '<span class="wis-log__state">' + l.state + '</span>' : '') + '</div>' + (l.d ? '<div class="wis-log__detail">' + l.d + '</div>' : '') + '</div></li>';
      }).join('');
      // keep the result sentence in one flex item next to its icon
      if (result) result.innerHTML = (sc.result || '').replace(/^(<span data-icon="[^"]+"><\/span>)([\s\S]*)$/, '$1<span>$2</span>');
      root.querySelectorAll('[data-sim-name]').forEach(function (n) { n.textContent = sec.name; });
      var base = state.path === 'confirmedEarly' ? 'confirmed' : state.path === 'edit' ? 'waiting' : state.path;
      root.querySelectorAll('[data-sim-path]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.simPath === base); });
      root.dataset.path = state.path;
      chat.scrollTop = chat.scrollHeight;
      W.mountIcons(root);
    }
    root.addEventListener('click', function (e) {
      var go = e.target.closest('[data-sim-go]'), path = e.target.closest('[data-sim-path]'), reset = e.target.closest('[data-sim-reset]');
      if (go) state.path = go.dataset.simGo;
      else if (path) state.path = path.dataset.simPath;
      else if (reset) state.path = 'waiting';
      else return;
      render();
    });
    var tabs = root.querySelector('[role="tablist"]');
    if (tabs) tabs.addEventListener('wis:tab', function (e) { state.sector = e.detail; state.path = 'waiting'; root.dataset.sector = e.detail; render(); });
    function syncTabs(key) {
      if (!tabs) return;
      tabs.querySelectorAll('[role="tab"]').forEach(function (x) { var on = x.dataset.value === key; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; });
    }
    root._wisSetSector = function (key, focusTab) {
      if (!S[key]) return;
      if (tabs && tabs._wisSelect) tabs._wisSelect(key, focusTab ? 'quiet' : false);
      else { syncTabs(key); state.sector = key; state.path = 'waiting'; root.dataset.sector = key; render(); }
    };
    function fromHash(scroll) {
      var m = /simulation=(\w+)/.exec(location.hash);
      if (!m || !S[m[1]]) return;
      root._wisSetSector(m[1]);
      if (scroll) W.scrollTo(root);
    }
    var h0 = /simulation=(\w+)/.exec(location.hash);
    if (h0 && S[h0[1]]) { state.sector = h0[1]; root.dataset.sector = h0[1]; syncTabs(h0[1]); }
    window.addEventListener('hashchange', function () { fromHash(true); });
    render();
  };

  /* Open the in-page simulation on a sector. Returns false when there is none (the #simulation=<sector> link then carries the choice). */
  W.openSimulation = function (sector, focusTab) {
    var sim = document.querySelector('[data-wis~="simulation"]');
    if (!sim || !sim._wisSetSector || !W.simScripts[sector]) return false;
    sim._wisSetSector(sector, focusTab !== false);
    W.scrollTo(sim);
    return true;
  };

  /* ---------- Agent fit: one sector drives all three cards. Illustrative: no real integrations. */
  W.fit = function (root) {
    var F = W.data.fit || {}, D = F.sectors || {}, LEVELS = F.levels || [], labels = {};
    (W.data.sectors || []).forEach(function (s) { labels[s.id] = s.label; });
    var tl = root.querySelector('[role="tablist"]');
    function slot(k) { return root.querySelector('[data-fit="' + k + '"]'); }
    function render(key) {
      var d = D[key];
      if (!d) return;
      root.dataset.sector = key;
      slot('mission').textContent = d.mission;
      slot('example').textContent = d.example;
      slot('tools').innerHTML = d.tools.map(function (t) {
        return '<li><span class="wis-fit__ticon"><span data-icon="' + esc(t.icon) + '"></span></span><span><b>' + esc(t.name) + '</b><span>' + esc(t.why) + '</span></span></li>';
      }).join('');
      slot('perms').innerHTML = LEVELS.map(function (l) {
        return '<li class="wis-perm__row wis-perm__row--' + esc(l.id) + '"><span class="wis-perm__level"><span data-icon="' + esc(l.icon) + '"></span>' + esc(l.label) + '</span>' +
          (d.perms[l.id] || []).map(function (t) { return '<span class="wis-perm__text">' + esc(t) + '</span>'; }).join('') + '</li>';
      }).join('');
      root.querySelectorAll('[data-fit="sector"]').forEach(function (n) { n.textContent = labels[key] || key; });
      var btn = root.querySelector('[data-fit-try]');
      if (btn) btn.setAttribute('href', '#simulation=' + key);
      W.mountIcons(root);
    }
    if (tl) tl.addEventListener('wis:tab', function (e) { render(e.detail); });
    var btn = root.querySelector('[data-fit-try]');
    if (btn) btn.addEventListener('click', function (e) { if (W.openSimulation(root.dataset.sector)) e.preventDefault(); });
    root._wisSetSector = function (key) { if (tl && tl._wisSelect) tl._wisSelect(key, false); else render(key); };
    var sel = tl && tl.querySelector('[aria-selected="true"]');
    render((sel && sel.dataset.value) || root.dataset.sector || 'clinic');
  };

  /* ---------- Illustrative chart: a generated series, never real performance. */
  W.chart = function (root) {
    var n = +(root.dataset.points || 60), seed = +(root.dataset.seed || 7), w = 560, h = 220, pad = 12;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    var v = 100, data = [];
    for (var i = 0; i < n; i++) { v += (rnd() - .5) * 3.2 + Math.sin(i / 7) * .6; data.push(Math.round(v * 10) / 10); }
    var lo = Math.min.apply(null, data), hi = Math.max.apply(null, data);
    var X = function (i) { return pad + i * (w - 2 * pad) / (n - 1); }, Y = function (d) { return h - pad - (d - lo) / (hi - lo) * (h - 2 * pad); };
    var marks = (root.dataset.signals || '12,27,41,52').split(',').map(Number);
    var grid = [0.25, 0.5, 0.75].map(function (f) { var y = pad + f * (h - 2 * pad); return '<line x1="0" x2="' + w + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)" stroke-width="1"/>'; }).join('');
    var line = data.map(function (d, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(d).toFixed(1); }).join('');
    var dots = marks.map(function (i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(data[i]).toFixed(1) + '" r="4" fill="var(--chart-2)" stroke="var(--bg-sunken)" stroke-width="2"/>'; }).join('');
    root.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="سلسلة أسعار مولّدة للتوضيح مع إشارات تجريبية؛ ليست أداءً حقيقيًا" style="direction:ltr">' + grid +
      '<path d="' + line + '" fill="none" stroke="var(--chart-1)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + dots +
      '<line class="x" y1="0" y2="' + h + '" stroke="var(--ink-faint)" stroke-width="1" opacity="0"/><rect width="' + w + '" height="' + h + '" fill="transparent"/></svg><div class="wis-chart__tip" hidden></div>';
    var svg = root.querySelector('svg'), x = svg.querySelector('.x'), tip = root.querySelector('.wis-chart__tip');
    svg.addEventListener('mousemove', function (e) {
      var r = svg.getBoundingClientRect(), i = Math.round(((e.clientX - r.left) / r.width * w - pad) / (w - 2 * pad) * (n - 1));
      i = clamp(i, 0, n - 1);
      x.setAttribute('x1', X(i)); x.setAttribute('x2', X(i)); x.setAttribute('opacity', 1);
      tip.hidden = false;
      tip.innerHTML = 'النقطة ' + (i + 1) + ' · قيمة مولّدة ' + data[i] + (marks.indexOf(i) > -1 ? '<br><b>إشارة تجريبية</b>' : '');
      tip.style.left = (X(i) / w * r.width) + 'px';
    });
    svg.addEventListener('mouseleave', function () { x.setAttribute('opacity', 0); tip.hidden = true; });
  };

  /* ---------- Site navigation: one menu panel opened by every menu button; current section in the bar */
  W.menu = function (menu) {
    var btns = [].slice.call(document.querySelectorAll('[data-menu-toggle][aria-controls="' + menu.id + '"]')).filter(function (b) { return !b.closest('.wis-hero__ui--past'); });
    var opener = null;
    function set(open, returnFocus) {
      menu.hidden = !open;
      btns.forEach(function (b) {
        b.setAttribute('aria-expanded', open);
        b.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
        var ic = b.querySelector('[data-icon]');
        if (ic) { ic.dataset.icon = open ? 'close' : 'menu'; delete ic.dataset.iconMounted; }
        W.mountIcons(b);
      });
      if (open) { var f = menu.querySelector('a'); if (f) f.focus(); }
      else if (returnFocus && opener) opener.focus();
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { opener = b; set(menu.hidden); }); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('[data-menu-close]')) set(false, !e.target.closest('a')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) set(false, true); });
  };
  W.navCurrent = function () {
    var links = [].slice.call(document.querySelectorAll('[data-nav-link]'));
    if (!('IntersectionObserver' in window) || !links.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    var seen = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); if (seen[id]) return; seen[id] = 1; var s = document.getElementById(id); if (s) io.observe(s); });
  };

  /* ---------- Project details: native modal dialogs, Escape closes, focus returns to the opener */
  W.dialogs = function (root) {
    root.querySelectorAll('[data-dialog-open]').forEach(function (b) {
      var dlg = document.getElementById(b.dataset.dialogOpen);
      if (!dlg || typeof dlg.showModal !== 'function') return; // without <dialog> support the link goes to the visible details
      b.addEventListener('click', function (e) {
        e.preventDefault();
        dlg._opener = b;
        dlg.showModal();
        var h = dlg.querySelector('[data-dialog-focus]') || dlg.querySelector('h2, h3');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
      });
    });
    root.querySelectorAll('dialog.wis-dialog').forEach(function (dlg) {
      dlg.addEventListener('close', function () { if (dlg._opener) dlg._opener.focus(); });
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) dlg.close();                                    // backdrop
        var c = e.target.closest('[data-dialog-close]'); if (c) dlg.close();
        var a = e.target.closest('a[href^="#"]');
        if (a && !c) {                                                         // in-page link: close first, then go
          dlg.close();
          var sim = /simulation=(\w+)/.exec(a.getAttribute('href'));
          if (sim && W.openSimulation(sim[1])) { e.preventDefault(); }
        }
      });
    });
  };

  /* ---------- Links that pick a fit sector (assistant suggestions, project dialogs) */
  W.sectorLinks = function (root) {
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-fit-sector]');
      if (!a) return;
      var fit = document.querySelector('[data-wis~="fit"]');
      if (!fit || !fit._wisSetSector) return;
      e.preventDefault();
      fit._wisSetSector(a.dataset.fitSector);
      W.scrollTo(fit);
      var t = fit.querySelector('[role="tab"][aria-selected="true"]'); if (t) t.focus({ preventScroll: true });
    });
  };

  W.init = function (root) {
    root = root || document;
    W.mountIcons(root);
    root.querySelectorAll('[data-wis]').forEach(function (el) {
      el.dataset.wis.split(' ').forEach(function (kind) {
        var fn = { hero: W.hero, tabs: W.tabs, radios: W.radios, challenges: W.challenges, stages: W.stages, parts: W.parts,
          simulation: W.simulation, chart: W.chart, fit: W.fit, menu: W.menu }[kind];
        if (fn) fn(el);
      });
    });
    W.dialogs(root);
    W.sectorLinks(document);
    W.navCurrent();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { W.init(document); });
  else W.init(document);
})();
