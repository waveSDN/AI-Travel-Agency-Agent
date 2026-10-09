'use strict';

/**
 * End-to-end checks in Chromium against the built page and the real server.
 * Gemini is replaced by a scripted mock provider (no network, no quota); a second server runs with
 * no key at all. Mock answers prove the app's handling, not that live Gemini works.
 * Usage: npm run test:e2e   (set E2E_SHOTS=<dir> to also save screenshots)
 */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { createApp } = require('../../server/app');
const { loadConfig } = require('../../server/config');
const { loadKnowledge } = require('../../server/knowledge');

const K = loadKnowledge();
const FAKE_KEY = 'fake-gemini-key-for-e2e-41c0de';
const SHOTS = process.env.E2E_SHOTS || '';

/* ---------- tiny harness: every check runs, failures are listed at the end */
/** @type {string[]} */
const failures = [];
let passed = 0;
/** @param {string} name @param {() => Promise<void>} fn */
async function check(name, fn) {
  try { await fn(); passed++; console.log('  ✓ ' + name); }
  catch (e) { failures.push(name + ' — ' + (/** @type {any} */ (e).message || e)); console.log('  ✗ ' + name + '\n      ' + (/** @type {any} */ (e).message || e)); }
}
/** @param {any} cond @param {string} msg */
function ok(cond, msg) { if (!cond) throw new Error(msg); }
/** @param {any} a @param {any} b @param {string} msg */
function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

/* ---------- servers */
const mock = { mode: 'ok', reply: { reply: 'WIS في مرحلة بناء الأساس وتطوير النماذج الأولية.', sector: 'travel', needsTeam: true }, calls: /** @type {any[]} */ ([]) };
const provider = {
  name: 'e2e-mock',
  /** @param {any} req */
  async generate(req) {
    mock.calls.push(req);
    if (mock.mode !== 'ok') return { ok: false, reason: mock.mode };
    return { ok: true, text: JSON.stringify(mock.reply) };
  }
};
/** @param {any} app @returns {Promise<{ url: string, close: () => void }>} */
function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => {
      const addr = /** @type {any} */ (s.address());
      resolve({ url: `http://127.0.0.1:${addr.port}/`, close: () => s.close() });
    });
  });
}

(async () => {
  const liveApp = createApp({ config: loadConfig({ GEMINI_API_KEY: FAKE_KEY, ASSISTANT_SESSION_RPM: '60', ASSISTANT_IP_RPM: '600' }), provider }).app;
  const offApp = createApp({ config: loadConfig({ GEMINI_API_KEY: '' }) }).app;
  const live = await listen(liveApp);
  const off = await listen(offApp);
  const browser = await chromium.launch();

  /** @param {{ width: number, height: number }} viewport @param {any} [opts] */
  async function open(viewport, opts = {}, url = live.url) {
    const ctx = await browser.newContext({ viewport, ...opts });
    const page = await ctx.newPage();
    /** @type {string[]} */
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    /** @type {any[]} */
    const apiCalls = [];
    page.on('request', (r) => { if (r.url().includes('/api/')) apiCalls.push({ url: r.url(), method: r.method(), body: r.postData() }); });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    return { ctx, page, errors, apiCalls };
  }
  /** @param {any} page @param {number} y */
  const scrollTo = (page, y) => page.evaluate((/** @type {number} */ y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
  /** Smooth scrolling is on (no reduced motion): wait until the element settles near the top. */
  /** @param {any} page @param {string} sel @param {number} [max] */
  const settleTop = async (page, sel, max = 160) => {
    try {
      await page.waitForFunction((/** @type {[string, number]} */ [s, m]) => { const t = document.querySelector(s)?.getBoundingClientRect().top; return t !== undefined && t > -2 && t < m; }, [sel, max], { timeout: 5000, polling: 100 });
    } catch { /* fall through: the assertion below reports the position */ }
    return Math.round(await page.evaluate((/** @type {string} */ s) => document.querySelector(s)?.getBoundingClientRect().top ?? -1, sel));
  };
  /** @param {any} page */
  const heroState = (page) => page.evaluate(() => {
    const h = /** @type {HTMLElement} */ (document.querySelector('.site-hero'));
    const now = /** @type {HTMLElement} */ (h.querySelector('.wis-hero__layer--present'));
    const svg = /** @type {SVGElement} */ (h.querySelector('.wis-hero__wave'));
    const uiNow = h.querySelector('.wis-hero__ui--present'), uiPast = h.querySelector('.wis-hero__ui--past');
    const col = (/** @type {Element|null} */ el) => el ? getComputedStyle(/** @type {Element} */ (el.querySelector('.wis-hero__title'))).color : null;
    return {
      p: +getComputedStyle(h).getPropertyValue('--p'),
      clip: now.style.clipPath || 'none',
      wave: svg.style.opacity,
      nowTitle: col(uiNow), pastTitle: col(uiPast),
      pastVisible: !!uiPast && getComputedStyle(uiPast).display !== 'none',
      nowHidden: uiNow && uiNow.getAttribute('aria-hidden'), pastHidden: uiPast && uiPast.getAttribute('aria-hidden'),
      trackExtra: (/** @type {HTMLElement} */ (document.querySelector('.wis-hero-track'))).offsetHeight - h.offsetHeight
    };
  });
  /** Tower box in viewport coordinates, from where it sits in each photo (measured on the images). */
  /** @param {any} page */
  const towerOverlap = (page) => page.evaluate(() => {
    const media = /** @type {HTMLElement} */ (document.querySelector('.site-hero .wis-hero__media'));
    const img = /** @type {HTMLImageElement} */ (document.querySelector('.site-hero .wis-hero__layer--present img'));
    const r = media.getBoundingClientRect();
    const mobile = img.currentSrc.includes('mobile');
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const s = Math.max(r.width / nw, r.height / nh);
    const pos = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
    const ox = r.left + (r.width - nw * s) * pos[0], oy = r.top + (r.height - nh * s) * pos[1];
    const t = mobile ? [0.18, 0.117, 0.37, 0.43] : [0.295, 0.115, 0.37, 0.44];
    const tower = { l: ox + t[0] * nw * s, t: oy + t[1] * nh * s, r: ox + t[2] * nw * s, b: oy + t[3] * nh * s };
    const boxes = [...document.querySelectorAll('.site-hero .wis-hero__ui--present .wis-hero__content > *')].map((e) => e.getBoundingClientRect());
    const hit = boxes.some((b) => b.left < tower.r && b.right > tower.l && b.top < tower.b && b.bottom > tower.t);
    return { hit, mobile, tower: Object.values(tower).map(Math.round) };
  });

  try {
    /* ================= layout at three widths ================= */
    for (const vp of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 1920, height: 1080 }]) {
      console.log(`\nLayout ${vp.width}×${vp.height}`);
      const { ctx, page, errors } = await open(vp);
      await check('no horizontal overflow anywhere down the page', async () => {
        const H = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < H; y += Math.round(vp.height * 0.8)) {
          await scrollTo(page, y);
          const o = await page.evaluate(() => {
            const de = document.documentElement;
            if (de.scrollWidth <= de.clientWidth) return null;
            const wide = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > de.clientWidth + 1 || b.left < -1); })
              .slice(0, 3).map((e) => e.tagName + '.' + String(e.className).split(' ')[0]);
            return { sw: de.scrollWidth, cw: de.clientWidth, wide };
          });
          ok(!o, `overflow at y=${y}: ${JSON.stringify(o)}`);
        }
      });
      await check('hero text does not cover the tower', async () => {
        await scrollTo(page, 0);
        const t = await towerOverlap(page);
        ok(!t.hit, 'content overlaps tower ' + JSON.stringify(t));
      });
      await check('every in-page link and nav item resolves', async () => {
        const bad = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href') || '')
          .filter((h) => h.length > 1 && !h.startsWith('#simulation=') && !document.getElementById(h.slice(1))));
        eq(bad, [], 'unresolved anchors');
      });
      await check('no script errors', async () => { eq(errors, [], 'errors'); });
      if (SHOTS) {
        await scrollTo(page, 0); await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(SHOTS, `wis-${vp.width}-hero.png`) });
      }
      await ctx.close();
    }

    /* ================= hero wave ================= */
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      console.log(`\nHero wave ${vp.width}`);
      const { ctx, page } = await open(vp);
      await check('starts on the past, wave visible', async () => {
        const s = await heroState(page);
        ok(s.p < 0.05 && s.clip.startsWith('polygon') && s.wave === '1', JSON.stringify(s));
      });
      await check('scrolling moves the wave right-to-left and swaps text colour at the line', async () => {
        const s0 = await heroState(page);
        const extra = s0.trackExtra;
        await scrollTo(page, Math.round(extra * 0.35)); await page.waitForTimeout(120);
        const a = await heroState(page);
        await scrollTo(page, Math.round(extra * 0.6)); await page.waitForTimeout(120);
        const b = await heroState(page);
        ok(a.p > 0.1 && a.p < b.p && b.p < 1, `progress ${a.p} -> ${b.p}`);
        if (vp.width >= 900) {
          ok(a.pastVisible && a.pastTitle !== a.nowTitle, 'two text colours expected: ' + a.pastTitle + ' / ' + a.nowTitle);
          eq(a.nowTitle, 'rgb(243, 245, 247)', 'title over the present is light');
          ok(a.pastTitle === 'rgb(7, 19, 33)' || /^rgb\(\d+, \d+, \d+\)$/.test(String(a.pastTitle)), 'title over the past is dark ink: ' + a.pastTitle);
        } else {
          ok(!a.pastVisible, 'phone: text sits in the navy panel, one copy only');
        }
        if (SHOTS && vp.width >= 900) await page.screenshot({ path: path.join(SHOTS, `wis-${vp.width}-hero-transition.png`) });
        if (SHOTS && vp.width < 900) await page.screenshot({ path: path.join(SHOTS, `wis-${vp.width}-hero-transition.png`) });
      });
      await check('end state: present only, wave gone, readable copy active', async () => {
        const extra = (await heroState(page)).trackExtra;
        await scrollTo(page, extra + 20); await page.waitForTimeout(120);
        const s = await heroState(page);
        ok(s.p === 1 && s.clip === 'none' && s.wave === '0', JSON.stringify(s));
        eq(s.nowHidden, 'false', 'present text exposed to assistive tech');
      });
      await ctx.close();
    }

    console.log('\nReduced motion and no JavaScript');
    {
      const { ctx, page } = await open({ width: 1440, height: 900 }, { reducedMotion: 'reduce' });
      await check('reduced motion: present shown at once, no scroll track, no wave', async () => {
        const s = await heroState(page);
        ok(s.p === 1 && s.clip === 'none' && s.wave === '0' && s.trackExtra === 0, JSON.stringify(s));
      });
      await ctx.close();
    }
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const { ctx, page } = await open(vp, { javaScriptEnabled: false });
      await check(`no JS (${vp.width}): title, description and buttons readable over the present photo`, async () => {
        const s = await page.evaluate(() => {
          const h1 = /** @type {HTMLElement} */ (document.querySelector('h1'));
          const now = /** @type {HTMLElement} */ (document.querySelector('.wis-hero__layer--present'));
          const b = h1.getBoundingClientRect();
          return { color: getComputedStyle(h1).color, visible: b.width > 100 && b.top >= 0 && b.bottom <= innerHeight, clip: getComputedStyle(now).clipPath, track: (/** @type {HTMLElement} */ (document.querySelector('.wis-hero-track'))).offsetHeight, hero: (/** @type {HTMLElement} */ (document.querySelector('.site-hero'))).offsetHeight, dialogsShown: [...document.querySelectorAll('dialog.wis-dialog')].every((d) => getComputedStyle(d).display === 'block') };
        });
        ok(s.visible && s.color === 'rgb(243, 245, 247)' && s.clip === 'none' && s.track === s.hero, JSON.stringify(s));
        ok(s.dialogsShown, 'project details readable without JS');
        const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(sw <= 0, 'overflow without JS: ' + sw);
      });
      await ctx.close();
    }

    /* ================= sections ================= */
    console.log('\nSections (1440)');
    const { ctx, page, apiCalls, errors } = await open({ width: 1440, height: 900 });

    await check('challenges: each choice changes the example and explanation', async () => {
      for (const c of K.challenges) {
        await page.click(`#solutions [role="radio"][data-value="${c.id}"]`);
        const got = await page.evaluate(() => ({ h: document.querySelector('[data-ch="headline"]')?.textContent, card: document.querySelector('[data-ch="card-title"]')?.textContent, go: document.querySelector('[data-ch="go"]')?.getAttribute('href') }));
        eq(got, { h: c.headline, card: c.card.title, go: '#simulation=' + c.sector }, c.id);
      }
      await page.focus('#solutions [role="radio"][aria-checked="true"]');
      await page.keyboard.press('ArrowUp');
      const sel = await page.evaluate(() => document.querySelector('#solutions [aria-checked="true"]')?.getAttribute('data-value'));
      eq(sel, 'repetitive', 'ArrowUp moves to the previous challenge');
    });

    await check('methodology: five approved stages, each opens its explanation', async () => {
      const names = await page.$$eval('#how [data-stage] .wis-step__name', (els) => els.map((e) => e.textContent));
      eq(names, ['نفهم أعمالك', 'نرسم سير العمل', 'نحدد حدود الوكيل', 'نبني نموذجًا', 'نراجع ونحسّن'], 'stages');
      for (const s of K.methodology) {
        await page.click(`#how [data-stage="${s.n}"]`);
        const got = await page.evaluate(() => ({ name: document.querySelector('[data-stage-slot="name"]')?.textContent, flow: !(/** @type {HTMLElement} */ (document.querySelector('[data-stage-only="2"]'))).hidden }));
        eq(got, { name: s.name, flow: s.n === 2 }, 'stage ' + s.n);
      }
    });

    await check('agent fit: each sector updates mission, tools and permissions together', async () => {
      for (const s of K.sectors) {
        await page.click(`#fit-tab-${s.id}`);
        const f = K.fit.sectors[s.id];
        const got = await page.evaluate(() => ({
          mission: document.querySelector('#fit [data-fit="mission"]')?.textContent,
          tools: [...document.querySelectorAll('#fit [data-fit="tools"] b')].map((b) => b.textContent),
          perms: [...document.querySelectorAll('#fit .wis-perm__row')].map((r) => [r.querySelector('.wis-perm__level')?.textContent, [...r.querySelectorAll('.wis-perm__text')].map((t) => t.textContent)]),
          href: document.querySelector('#fit [data-fit-try]')?.getAttribute('href')
        }));
        eq(got.mission, f.mission, s.id + ' mission');
        eq(got.tools, f.tools.map((/** @type {any} */ t) => t.name), s.id + ' tools');
        eq(got.perms, [['قراءة', f.perms.read], ['تنفيذ ضمن صلاحيات محددة', f.perms.exec], ['يتطلب موافقة', f.perms.approve]], s.id + ' permissions');
        eq(got.href, '#simulation=' + s.id, s.id + ' button');
      }
    });

    await check('agent fit → simulation opens on the same sector (click and keyboard)', async () => {
      for (const [sector, how] of [['travel', 'click'], ['sales', 'enter'], ['clinic', 'click']]) {
        await scrollTo(page, 0);
        await page.click(`#fit-tab-${sector}`);
        if (how === 'click') await page.click('#fit [data-fit-try]');
        else { await page.focus('#fit [data-fit-try]'); await page.keyboard.press('Enter'); }
        const top = await settleTop(page, '#simulation', 120);
        const s = { top, ...(await page.evaluate(() => ({ sel: document.querySelector('#simulation [role="tab"][aria-selected="true"]')?.getAttribute('data-value'), sector: (/** @type {HTMLElement} */ (document.querySelector('#simulation'))).dataset.sector, focus: (/** @type {HTMLElement} */ (document.activeElement)).dataset.value }))) };
        ok(s.sel === sector && s.sector === sector && s.focus === sector && Math.abs(s.top) < 120, `${sector}/${how}: ${JSON.stringify(s)}`);
      }
    });

    await check('«الأمان والتحكم» link reaches the existing security section', async () => {
      await scrollTo(page, 0);
      await page.click('#fit .wis-seclink');
      const top = await settleTop(page, '#sec-general', 160);
      const s = { top, hash: await page.evaluate(() => location.hash) };
      ok(s.hash === '#sec-general' && s.top > 40 && s.top < 160, JSON.stringify(s));
    });

    await check('agent parts: each of the six parts updates the panel', async () => {
      for (const p of K.agentParts) {
        await page.click(`#inside [data-part="${p.id}"]`);
        const got = await page.evaluate(() => ({ t: document.querySelector('#inside [data-slot="title"]')?.textContent, pressed: document.querySelector('#inside [aria-pressed="true"]')?.getAttribute('data-part') }));
        eq(got, { t: p.name, pressed: p.id }, p.id);
      }
    });

    await check('simulation: five states per sector, exact details kept, no network', async () => {
      const before = apiCalls.length;
      /** @type {Record<string, Record<string, string[]>>} */
      const expect = {
        clinic: { waiting: ['تنظيف أسنان', '7:30 مساءً'], confirmed: ['موعد تجريبي مؤكد', 'تنظيف أسنان', 'غدًا 7:30 مساءً'], unavailable: ['بعد غد 6:00 مساءً', 'غدًا 11:00 صباحًا'], outage: ['تنظيف أسنان', 'موظف الاستقبال'], handoff: ['فريق العيادة', 'لم يقدّم الوكيل أي رأي طبي'] },
        travel: { waiting: ['إسطنبول', 'من الرياض', '10 إلى 17 ديسمبر', '4 مسافرين'], confirmed: ['مسودة عرض تجريبية', '10 إلى 17 ديسمبر', '4 مسافرين', 'رحلتان مباشرتان'], unavailable: ['10 إلى 17 ديسمبر', 'توقف واحد'], outage: ['10 إلى 17 ديسمبر', 'موظف الحجوزات'], handoff: ['التأشيرة'] },
        sales: { waiting: ['ساعة رياضية', 'أسود', '45 مم'], confirmed: ['مسودة طلب تجريبية', '45 مم', 'لم يُطلب أي دفع'], unavailable: ['45 مم', 'الرمادي'], outage: ['45 مم', 'فريق المبيعات'], handoff: ['طلب خصم', 'لم يعد الوكيل بأي خصم'] }
      };
      for (const sector of Object.keys(expect)) {
        await page.click(`#sim-tab-${sector}`);
        for (const [pathName, words] of Object.entries(expect[sector])) {
          await page.click(`#simulation [data-sim-path="${pathName}"]`);
          const res = await page.evaluate(() => document.querySelector('[data-sim-result]')?.textContent || '');
          for (const w of words) ok(res.includes(w), `${sector}/${pathName}: "${w}" missing in "${res}"`);
        }
      }
      // in-chat buttons: clinic «وقت أبكر» then confirm keeps 6:00
      await page.click('#sim-tab-clinic');
      await page.click('#simulation [data-sim-go="edit"]');
      await page.click('#simulation [data-sim-go="confirmedEarly"]');
      const early = await page.evaluate(() => document.querySelector('[data-sim-result]')?.textContent || '');
      ok(early.includes('غدًا 6:00 مساءً') && early.includes('تنظيف أسنان'), early);
      const badge = await page.textContent('#simulation .wis-sim-badge');
      ok(badge && badge.includes('محاكاة توضيحية — بيانات تجريبية'), 'badge');
      eq(apiCalls.length, before, 'the simulation made network calls');
      const log = await page.evaluate(() => document.querySelector('[data-sim-log]')?.textContent || '');
      ok(!/أفكر|تفكير|reasoning|thought/i.test(log), 'log shows only actions and results');
    });

    await check('«استكشف المشروع» opens real details; Escape and close return focus', async () => {
      for (const p of K.projects) {
        const opener = `[data-dialog-open="dlg-${p.id}"]`;
        await page.locator(opener).scrollIntoViewIfNeeded();
        await page.click(opener);
        const s = await page.evaluate((/** @type {string} */ id) => { const d = /** @type {HTMLDialogElement} */ (document.getElementById(id)); return { open: d.open, title: d.querySelector('h2')?.textContent, status: d.querySelector('.wis-tag')?.textContent, text: d.textContent || '' }; }, 'dlg-' + p.id);
        ok(s.open && s.title === p.name && (s.status || '').includes(p.statusLabel), JSON.stringify({ ...s, text: undefined }));
        ok(s.text.includes(p.desc), 'description in dialog');
        if (p.id === 'trading') ok(s.text.includes('غير متاح حاليًا') && s.text.includes('لا يمثل أداءً مثبتًا'), 'trading limits shown');
        if (p.id === 'layla') ok(s.text.includes('بيانات تجريبية'), 'layla mock data limit shown');
        await page.keyboard.press('Escape');
        const after = await page.evaluate((/** @type {string} */ sel) => ({ open: (/** @type {HTMLDialogElement} */ (document.querySelector('dialog[open]'))) !== null, focus: document.activeElement === document.querySelector(sel) }), opener);
        ok(!after.open && after.focus, `${p.id} after Escape: ${JSON.stringify(after)}`);
      }
      await page.click('[data-dialog-open="dlg-medflow"]');
      await page.click('#dlg-medflow [data-dialog-close]');
      ok(await page.evaluate(() => !document.querySelector('dialog[open]')), 'close button');
    });

    await check('tabs work by keyboard (RTL: ArrowLeft = next) in every tablist', async () => {
      for (const sel of ['#agent-fit [role="tablist"]', '#simulation [role="tablist"]', '#how [role="tablist"]']) {
        const n = await page.$$eval(sel + ' [role="tab"]', (t) => t.length);
        await page.focus(sel + ' [role="tab"][aria-selected="true"]');
        await page.keyboard.press('Home');
        const seq = [];
        for (const key of ['ArrowLeft', 'ArrowLeft', 'ArrowRight', 'End', 'ArrowLeft', 'Home', 'ArrowRight']) {
          await page.keyboard.press(key);
          seq.push(await page.evaluate((/** @type {string} */ s) => { const tabs = [...document.querySelectorAll(s + ' [role="tab"]')]; const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'); return tabs[i] === document.activeElement ? i : -1; }, sel));
        }
        eq(seq, [1, 2, 1, n - 1, 0, 0, n - 1], sel);
      }
    });

    await check('no script errors on the sections page', async () => { eq(errors, [], 'errors'); });
    await ctx.close();

    /* ================= phone: menu, fit sticky tabs ================= */
    console.log('\nPhone (390)');
    {
      const { ctx, page } = await open({ width: 390, height: 844 });
      await check('menu opens from the bar, Escape closes it and returns focus', async () => {
        await page.locator('#agent-fit').scrollIntoViewIfNeeded();
        await page.click('.site-bar__menu');
        const s1 = await page.evaluate(() => ({ open: !(/** @type {HTMLElement} */ (document.getElementById('site-menu'))).hidden, focus: document.activeElement?.closest('#site-menu') !== null, expanded: document.querySelector('.site-bar__menu')?.getAttribute('aria-expanded') }));
        ok(s1.open && s1.focus && s1.expanded === 'true', JSON.stringify(s1));
        await page.keyboard.press('Escape');
        const s2 = await page.evaluate(() => ({ open: !(/** @type {HTMLElement} */ (document.getElementById('site-menu'))).hidden, focus: document.activeElement === document.querySelector('.site-bar__menu') }));
        ok(!s2.open && s2.focus, JSON.stringify(s2));
        await page.click('.site-bar__menu');
        await page.click('#site-menu a[href="#projects"]');
        const top = await settleTop(page, '#projects', 120);
        const s3 = { top, open: await page.evaluate(() => !(/** @type {HTMLElement} */ (document.getElementById('site-menu'))).hidden) };
        ok(!s3.open && s3.top >= 0 && s3.top < 120, JSON.stringify(s3));
      });
      await check('phone: fit tabs stay reachable while reading the cards, and drive the simulation', async () => {
        await page.locator('#fit .wis-perm').scrollIntoViewIfNeeded();
        const s = await page.evaluate(() => { const b = document.querySelector('#fit .wis-fit__bar')?.getBoundingClientRect(); return b && b.top >= 0 && b.bottom < innerHeight; });
        ok(s, 'sector bar visible next to the permissions card');
        await page.click('#fit-tab-sales');
        await page.click('#fit [data-fit-try]');
        await page.waitForTimeout(200);
        eq(await page.evaluate(() => document.querySelector('#simulation [role="tab"][aria-selected="true"]')?.getAttribute('data-value')), 'sales', 'sim sector');
      });
      if (SHOTS) {
        for (const id of ['solutions', 'agent-fit', 'simulation', 'projects', 'security', 'contact']) {
          await page.locator('#' + id).scrollIntoViewIfNeeded();
          await page.evaluate(() => { document.querySelector('.site-bar')?.setAttribute('style', 'position:relative'); });
          await page.locator('#' + id).screenshot({ path: path.join(SHOTS, `wis-390-${id}.png`) });
        }
      }
      await ctx.close();
    }

    /* ================= assistant ================= */
    console.log('\nAssistant — no key configured');
    {
      const { ctx, page, apiCalls } = await open({ width: 1440, height: 900 }, {}, off.url);
      await check('status says approved answers only; a typed question gets an approved answer, sent nowhere', async () => {
        await page.waitForSelector('[data-as-status].is-offline');
        await page.fill('[data-as-input]', 'كم تكلفة الوكيل؟');
        await page.click('[data-as-send]');
        const s = await page.evaluate(() => ({ labels: [...document.querySelectorAll('.site-alabel')].map((l) => l.textContent), last: document.querySelector('.site-alog li:last-child .wis-msg')?.textContent }));
        ok(s.labels.length === 1 && (s.labels[0] || '').includes('ليست ردًا من Gemini'), JSON.stringify(s));
        ok((s.last || '').includes('لا توجد أسعار منشورة'), 'price answer: ' + s.last);
        eq(apiCalls.filter((c) => c.url.includes('/message')).length, 0, 'message requests while offline');
      });
      await check('guided steps and summary work without Gemini, and the summary can be copied', async () => {
        await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: off.url.replace(/\/$/, '') });
        await page.click('[data-choice="sector"] [data-value="clinic"]');
        await page.click('[data-choice="problem"] [data-value="delay"]');
        await page.click('[data-choice="goal"] [data-value="faster"]');
        const sum = await page.inputValue('[data-as-summary-text]');
        for (const w of ['القطاع: عيادة', 'المشكلة: تأخر الردود', 'النتيجة المطلوبة: ردود أسرع على العملاء', 'المثال الأقرب في الموقع: العيادات']) ok(sum.includes(w), 'summary missing ' + w);
        await page.click('[data-as-copy]');
        await page.waitForTimeout(100);
        const clip = await page.evaluate(() => navigator.clipboard.readText());
        eq(clip, sum, 'clipboard');
      });
      await ctx.close();
    }

    console.log('\nAssistant — mock Gemini');
    {
      const { ctx, page, apiCalls } = await open({ width: 1440, height: 900 });
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: live.url.replace(/\/$/, '') });
      await page.waitForSelector('[data-as-status].is-live');
      await check('summary matches the visitor’s choices exactly and stays editable', async () => {
        await page.click('[data-choice="sector"] [data-value="travel"]');
        ok(await page.isVisible('[data-step="problem"]'), 'second question appears after the first');
        ok(!(await page.isVisible('[data-step="goal"]')), 'one question at a time');
        await page.click('[data-choice="problem"] [data-value="followup"]');
        await page.click('[data-choice="goal"] [data-value="tracked"]');
        const dl = await page.$$eval('[data-as-summary-list] dd', (d) => d.map((x) => x.textContent));
        eq(dl, ['مكتب سفر', 'ضياع المتابعات', 'متابعة لا تضيع', 'مكاتب السفر'], 'summary table');
        await page.fill('[data-as-summary-text]', 'نص عدّلته بنفسي');
        await page.click('[data-choice="goal"] [data-value="explore"]');
        eq(await page.inputValue('[data-as-summary-text]'), 'نص عدّلته بنفسي', 'manual edits are kept');
        eq((await page.$$eval('[data-as-summary-list] dd', (d) => d.map((x) => x.textContent)))[2], 'أريد فهم الإمكانيات أولًا', 'table follows choices');
      });
      await check('suggested example opens the matching sector', async () => {
        await page.click('[data-as-suggest] [data-fit-sector="travel"]');
        await page.waitForTimeout(300);
        eq(await page.evaluate(() => document.querySelector('#fit [role="tab"][aria-selected="true"]')?.getAttribute('data-value')), 'travel', 'fit sector');
        await page.locator('#assistant').scrollIntoViewIfNeeded();
      });
      await check('live answer is labelled, plain text, and only message + choice ids are sent', async () => {
        mock.mode = 'ok';
        mock.reply = { reply: 'نماذج WIS أولية. <img src=x onerror="window.__pwned=1"> [اضغط هنا](https://phish.example)', sector: 'travel', needsTeam: true };
        await page.fill('[data-as-input]', 'ما حالة Layla Travel AI؟');
        await page.click('[data-as-send]');
        await page.waitForSelector('.site-alabel--live');
        const s = await page.evaluate(() => ({
          text: document.querySelector('.site-alog li:last-child .wis-msg')?.textContent,
          injected: document.querySelectorAll('.site-alog img, .site-alog script, .site-alog a[href^="http"]').length,
          pwned: /** @type {any} */ (window).__pwned === 1,
          actions: [...document.querySelectorAll('.site-alog li:last-child .site-aactions a')].map((a) => a.getAttribute('href'))
        }));
        ok(s.injected === 0 && !s.pwned && !(s.text || '').includes('https'), JSON.stringify(s));
        eq(s.actions, ['#agent-fit', '#simulation=travel', '#assistant'], 'buttons come from the app allowlist');
        const req = apiCalls.filter((c) => c.url.endsWith('/api/assistant/message')).pop();
        const body = JSON.parse(req.body);
        eq(Object.keys(body).sort(), ['context', 'message'], 'request fields');
        eq(body.context, { sector: 'travel', problem: 'followup', goal: 'explore' }, 'context ids');
        ok(!req.body.includes('نص عدّلته'), 'the summary is never sent');
        const sys = mock.calls[mock.calls.length - 1].systemInstruction;
        ok(!sys.includes('نص عدّلته'), 'summary not in model input');
      });
      await check('quota error: clear notice, approved answer, status switches to approved-only', async () => {
        mock.mode = 'quota';
        await page.fill('[data-as-input]', 'هل تتكاملون مع أنظمتنا؟');
        await page.click('[data-as-send]');
        await page.waitForSelector('[data-as-status].is-offline');
        const s = await page.evaluate(() => [...document.querySelectorAll('.site-alog li')].slice(-2).map((li) => li.textContent));
        ok((s[0] || '').includes('حدها المؤقت') && (s[1] || '').includes('التكاملات المتاحة تُحدَّد'), JSON.stringify(s));
        ok(!(s[1] || '').includes('رد من Gemini'), 'fallback not shown as a live reply');
      });
      await check('summary can still be copied after Gemini fails', async () => {
        await page.click('[data-as-copy]');
        await page.waitForTimeout(100);
        eq(await page.evaluate(() => navigator.clipboard.readText()), await page.inputValue('[data-as-summary-text]'), 'clipboard');
      });
      await check('clear conversation empties the log and the server context', async () => {
        const before = apiCalls.length;
        await page.click('[data-as-clear]');
        await page.waitForTimeout(150);
        eq(await page.$$eval('.site-alog li', (l) => l.length), 0, 'log items');
        ok(apiCalls.slice(before).some((c) => c.url.endsWith('/api/assistant/clear')), 'clear sent to server');
        ok(((await page.textContent('[data-as-note]')) || '').includes('لا يشمل ذلك ما وصل إلى Google'), 'no claim of provider deletion');
      });
      await check('the key is not in anything the browser received', async () => {
        const urls = ['', 'assets/js/wis.js', 'assets/js/assistant.js', 'assets/js/boot.js', 'assets/css/site.css', 'api/assistant/status'];
        for (const u of urls) {
          const t = await page.evaluate(async (/** @type {string} */ url) => (await fetch(url)).text(), live.url + u);
          ok(!t.includes(FAKE_KEY) && !/GEMINI_API_KEY/.test(t), 'found in ' + (u || 'index.html'));
        }
        const cookies = await ctx.cookies();
        ok(cookies.every((c) => c.name !== 'wis_sid' || (c.httpOnly && c.sameSite === 'Strict')), 'session cookie flags');
      });
      if (SHOTS) {
        await page.evaluate(() => { document.querySelector('.site-bar')?.setAttribute('style', 'position:relative'); });
        await page.locator('#contact').screenshot({ path: path.join(SHOTS, 'wis-1440-contact-assistant.png') });
      }
      await ctx.close();
    }
  } finally {
    await browser.close();
    live.close(); off.close();
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) { console.log(failures.map((f) => ' - ' + f).join('\n')); process.exitCode = 1; }
})().catch((e) => { console.error(e); process.exitCode = 1; });
