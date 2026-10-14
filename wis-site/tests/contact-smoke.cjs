'use strict';

// Focused contact regression checks without calling WhatsApp or Gemini.
// Run: node --test tests/contact-smoke.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { renderPage } = require('../web/page');
const k = require('../content/knowledge.json');
const a = require('../content/assistant.json');

test('contact renders the approved number and safe, usable links', () => {
  const html = renderPage(k, a, { version: 'contact-test' });
  assert.match(html, /href="https:\/\/wa.me\/966579204081" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="tel:\+966579204081"/);
  assert.match(html, /dir="ltr">\+966579204081/);
  assert.match(html, /data-as-whatsapp data-whatsapp-number="966579204081"/);
  assert.doesNotMatch(html, /مسار التواصل[^<]*لم يُفعَّل|لا يوجد رقم منشور|غير مفعّل/);
  assert.match(html, /لا يرسله الموقع تلقائيًا/);
});

test('a malformed contact number cannot create an arbitrary link', () => {
  const invalid = { ...k, contact: { ...k.contact, whatsappNumber: 'javascript:alert(1)' } };
  assert.throws(() => renderPage(invalid, a, { version: 'test' }), /Invalid WhatsApp/);
});

function assistantHarness() {
  class Element {
    constructor() { this.listeners = {}; this.children = []; this.attributes = {}; this.dataset = {}; this.value = ''; this.textContent = ''; this.hidden = true; this.href = 'https://wa.me/966579204081'; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    appendChild(child) { this.children.push(child); return child; }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key] || null; }
    focus() {}
    select() {}
  }
  const nodes = {};
  const get = (selector) => nodes[selector] || (nodes[selector] = new Element());
  get('[data-as-whatsapp]').attributes['data-whatsapp-number'] = k.contact.whatsappNumber;
  const groups = a.steps.map((step) => {
    const group = new Element();
    group.dataset.choice = step.id;
    group.chips = step.options.map((option) => { const chip = new Element(); chip.dataset.value = option.id; return chip; });
    group.querySelectorAll = () => group.chips;
    return group;
  });
  const root = { querySelector: get, querySelectorAll: (selector) => selector === '[data-choice]' ? groups : groups.flatMap((g) => g.chips) };
  const requests = [];
  const context = { window: { WIS: { data: { assistant: a, sectors: k.sectors, faq: k.faq } } },
    document: { readyState: 'complete', querySelector: () => root, createElement: () => new Element(), createTextNode: (text) => ({ textContent: text }) },
    fetch: (url, options) => { requests.push({ url, options }); return new Promise(() => {}); },
    navigator: {}, encodeURIComponent };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../web/assets/js/assistant.js'), 'utf8'), context);
  function choose(index, value) {
    const group = groups[index], chip = group.chips.find((c) => c.dataset.value === value);
    group.listeners.click({ target: { closest: () => chip } });
  }
  return { get, choose, requests };
}

test('WhatsApp uses the current edited summary, safely encodes it, and resets it', () => {
  const h = assistantHarness();
  h.choose(0, 'clinic'); h.choose(1, 'delay'); h.choose(2, 'faster');
  const field = h.get('[data-as-summary-text]'), link = h.get('[data-as-whatsapp]');
  assert.match(field.value, /القطاع: عيادة/);
  assert.equal(new URL(link.href).searchParams.get('text'), field.value);
  const edited = 'احتياجي أنا & مثال + #\n<script>نص فقط</script> 👋';
  field.value = edited;
  field.listeners.input();
  assert.equal(new URL(link.href).hostname, 'wa.me');
  assert.equal(new URL(link.href).pathname, '/966579204081');
  assert.equal(new URL(link.href).searchParams.get('text'), edited);
  assert.equal(new URL(link.href).searchParams.size, 1);
  h.choose(2, 'explore');
  assert.equal(new URL(link.href).searchParams.get('text'), edited);
  assert.deepEqual(h.requests.map((r) => r.url), ['/api/assistant/status']);
  h.get('[data-as-restart]').listeners.click();
  assert.equal(link.href, 'https://wa.me/966579204081');
  assert.equal(field.value, '');
});

test('an empty edited summary opens a clean contact link', () => {
  const h = assistantHarness();
  h.choose(0, 'travel'); h.choose(1, 'followup'); h.choose(2, 'tracked');
  const field = h.get('[data-as-summary-text]');
  field.value = '   ';
  field.listeners.input();
  assert.equal(h.get('[data-as-whatsapp]').href, 'https://wa.me/966579204081');
});
