'use strict';

const { redact, normaliseMessage } = require('../../server/assistant/privacy');
const { parseModelOutput, SAFE_PRICE_REPLY } = require('../../server/assistant/output');
const { WindowCounter, DailyBudget } = require('../../server/assistant/limits');
const { SessionStore, capHistory } = require('../../server/assistant/sessions');
const { loadConfig, geminiReady } = require('../../server/config');

describe('input: normalise and redact', () => {
  test('accepts up to the limit and rejects one character more', () => {
    expect(normaliseMessage('أ'.repeat(1500), 1500)).toMatchObject({ ok: true });
    expect(normaliseMessage('أ'.repeat(1501), 1500)).toEqual({ ok: false, reason: 'too_long' });
  });
  test('rejects empty, whitespace and non-strings', () => {
    expect(normaliseMessage('   \n ', 1500)).toEqual({ ok: false, reason: 'empty' });
    expect(normaliseMessage(42, 1500)).toEqual({ ok: false, reason: 'invalid' });
    expect(normaliseMessage({ text: 'x' }, 1500)).toEqual({ ok: false, reason: 'invalid' });
  });
  test('strips control/bidi characters and angle brackets', () => {
    const r = normaliseMessage('مرحبا‮<script>alert(1)</script>\u0007', 1500);
    expect(r.ok && r.text).toBe('مرحبا script alert(1) /script');
  });
  test.each([
    ['email', 'راسلني على owner@clinic-example.com لو سمحت'],
    ['phone', 'جوالي 0551234567'],
    ['phone', 'رقمي +966 55 123 4567'],
    ['phone', 'رقمي ٠٥٥١٢٣٤٥٦٧ بالأرقام العربية'],
    ['national_id', 'هويتي 1012345678'],
    ['iban', 'الآيبان SA0380000000608010167519'],
    ['card', 'البطاقة 4111 1111 1111 1111'],
    ['passport', 'جواز السفر A12345678']
  ])('redacts %s', (kind, text) => {
    const r = redact(text);
    expect(r.kinds).toContain(kind);
    expect(r.text).toContain('[محذوف]');
    expect(r.text).not.toMatch(/\d{7,}/);
  });
  test('leaves ordinary questions alone (times, sizes, years)', () => {
    const t = 'هل يناسب موعد 7:30 مساءً لمتجر مقاسه 45 مم في 2026؟';
    expect(redact(t)).toEqual({ text: t, kinds: [] });
  });
});

describe('output: the model reply is validated and made safe', () => {
  const j = (/** @type {any} */ o) => JSON.stringify(o);
  test('valid JSON passes through', () => {
    expect(parseModelOutput(j({ reply: 'نموذج أولي.', sector: 'travel', needsTeam: false }))).toEqual({ ok: true, reply: 'نموذج أولي.', sector: 'travel', needsTeam: false, replaced: false });
  });
  test.each([['not json'], [''], [j(['a'])], [j({ text: 'x' })], [j({ reply: 5 })], [j({ reply: '   ' })], [j({ reply: '<b></b>' })]])('rejects malformed output %#', (raw) => {
    expect(parseModelOutput(raw)).toEqual({ ok: false, reason: 'invalid_output' });
  });
  test('unknown sector becomes none; needsTeam must be true exactly', () => {
    const r = parseModelOutput(j({ reply: 'نعم', sector: 'banking', needsTeam: 'yes' }));
    expect(r).toMatchObject({ ok: true, sector: 'none', needsTeam: false });
  });
  test('HTML, scripts, markdown links and URLs are removed', () => {
    const r = parseModelOutput(j({ reply: 'اضغط <a href="https://evil.example">هنا</a> <img src=x onerror=alert(1)> أو [الرابط](javascript:alert(1)) أو www.evil.example و https://x.example/a?b=1', sector: 'none', needsTeam: false }));
    expect(r.ok).toBe(true);
    const reply = /** @type {any} */ (r).reply;
    expect(reply).not.toMatch(/<|>|https?:|javascript:|www\.|onerror/i);
    expect(reply).toContain('هنا');
    expect(reply).toContain('الرابط');
  });
  test('contact details produced by the model are masked', () => {
    const r = /** @type {any} */ (parseModelOutput(j({ reply: 'تواصل على 0551234567 أو sales@wis.example', sector: 'none', needsTeam: false })));
    expect(r.reply).not.toMatch(/055|@/);
  });
  test.each([
    'تكلفة الوكيل 5000 ريال شهريًا',
    'السعر يبدأ من $300',
    'نوفر لك 40% من وقت الفريق',
    'نضمن لك الأرباح من Trading WIS'
  ])('invented prices/percentages/guarantees are replaced: %s', (claim) => {
    const r = /** @type {any} */ (parseModelOutput(j({ reply: claim, sector: 'none', needsTeam: false })));
    expect(r).toMatchObject({ ok: true, reply: SAFE_PRICE_REPLY, replaced: true, needsTeam: true });
  });
  test('very long replies are cut', () => {
    const r = /** @type {any} */ (parseModelOutput(j({ reply: 'كلمة '.repeat(600), sector: 'none', needsTeam: false })));
    expect([...r.reply].length).toBeLessThanOrEqual(901);
  });
});

describe('limits', () => {
  test('per-session window: 5 per minute, then 429 with retry-after, then open again', () => {
    const clock = { t: 0 };
    const w = new WindowCounter({ limit: 5, windowMs: 60000, now: () => clock.t });
    for (let i = 0; i < 5; i++) expect(w.hit('s').ok).toBe(true);
    const sixth = w.hit('s');
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(0);
    expect(w.hit('other').ok).toBe(true);           // another key is independent
    clock.t = 60001;
    expect(w.hit('s').ok).toBe(true);
  });
  test('daily budget stops at the limit and resets on the next UTC day', () => {
    const clock = { t: Date.UTC(2026, 9, 9, 10) };
    const d = new DailyBudget({ limit: 3, now: () => clock.t });
    expect([d.take(), d.take(), d.take(), d.take()]).toEqual([true, true, true, false]);
    clock.t = Date.UTC(2026, 9, 10, 0, 1);
    expect(d.take()).toBe(true);
  });
});

describe('sessions', () => {
  test('keeps only the last N exchanges and expires after the TTL', () => {
    const clock = { t: 0 };
    const s = new SessionStore({ ttlMs: 1000, maxSessions: 10, maxTurns: 2, now: () => clock.t });
    const id = SessionStore.newId();
    for (let i = 1; i <= 3; i++) s.append(id, 'q' + i, 'a' + i);
    expect(s.get(id)?.turns.map((t) => t.text)).toEqual(['q2', 'a2', 'q3', 'a3']);
    clock.t = 1001;
    expect(s.get(id)).toBeNull();
  });
  test('evicts the least recently used session at capacity', () => {
    const s = new SessionStore({ ttlMs: 60000, maxSessions: 2, maxTurns: 10 });
    const [a, b, c] = [SessionStore.newId(), SessionStore.newId(), SessionStore.newId()];
    s.getOrCreate(a); s.getOrCreate(b); s.getOrCreate(a); s.getOrCreate(c);
    expect(s.get(b)).toBeNull();
    expect(s.get(a)).not.toBeNull();
    expect(s.size).toBe(2);
  });
  test('ids are 128-bit hex and validated', () => {
    expect(SessionStore.validId(SessionStore.newId())).toBe(true);
    for (const bad of ['', 'abc', '../etc', 'G'.repeat(32), undefined, 'a'.repeat(33)]) expect(SessionStore.validId(bad)).toBe(false);
  });
  test('history is capped by characters and starts on a visitor turn', () => {
    /** @type {any[]} */
    const turns = [{ role: 'user', text: 'x'.repeat(50) }, { role: 'model', text: 'y'.repeat(50) }, { role: 'user', text: 'z'.repeat(50) }, { role: 'model', text: 'w'.repeat(50) }];
    expect(capHistory(turns, 120).map((t) => t.text[0])).toEqual(['z', 'w']);
    expect(capHistory(turns, 160).map((t) => t.text[0])).toEqual(['z', 'w']);   // never starts on a model turn
    expect(capHistory(turns, 1000)).toHaveLength(4);
  });
});

describe('config', () => {
  test('defaults match the trial limits and clamp bad values', () => {
    const c = loadConfig({});
    expect(c.limits).toMatchObject({ maxMessageChars: 1500, maxTurns: 10, perSessionPerMinute: 5, globalPerDay: 100 });
    expect(c.gemini).toMatchObject({ maxOutputTokens: 512, enabled: true, apiKey: '' });
    expect(geminiReady(c.gemini)).toBe(false);
    const d = loadConfig({ ASSISTANT_MAX_MESSAGE_CHARS: '999999', GEMINI_MAX_OUTPUT_TOKENS: '-5', GEMINI_MAX_RETRIES: '50' });
    expect(d.limits.maxMessageChars).toBe(4000);
    expect(d.gemini.maxOutputTokens).toBe(64);
    expect(d.gemini.maxRetries).toBe(2);
  });
  test('kill switch wins over a configured key', () => {
    expect(geminiReady(loadConfig({ GEMINI_API_KEY: 'k', GEMINI_ENABLED: 'false' }).gemini)).toBe(false);
    expect(geminiReady(loadConfig({ GEMINI_API_KEY: 'k' }).gemini)).toBe(true);
  });
});
