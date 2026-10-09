'use strict';

/**
 * Input checks and data minimisation before anything leaves for Gemini.
 * Redaction is best effort: it catches common shapes (email, phone, ID, IBAN, card, passport),
 * not every piece of personal data. The UI says so.
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
/** @param {string} s */
const toLatinDigits = (s) => s.replace(ARABIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));

const MASK = '[محذوف]';

/** Order matters: longer, more specific shapes first. */
const PATTERNS = /** @type {Array<[string, RegExp]>} */ ([
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ['iban', /\bSA\d{2}(?:[ -]?[A-Z0-9]{4}){5}\b|\bSA\d{22}\b/gi],
  ['card', /\b(?:\d[ -]?){13,19}\b/g],
  ['phone', /(?:\+|00)\d{1,3}[ -]?(?:\d[ -]?){6,12}\d|\b0?5\d(?:[ -]?\d){7}\b/g],
  ['national_id', /\b[12]\d{9}\b/g],
  ['passport', /\b[A-Z]{1,2}\d{6,8}\b/g],
  ['long_number', /\b\d{8,}\b/g]
]);

/**
 * @param {string} text
 * @returns {{ text: string, kinds: string[] }}
 */
function redact(text) {
  let out = toLatinDigits(text);
  /** @type {Set<string>} */
  const kinds = new Set();
  for (const [kind, re] of PATTERNS) {
    out = out.replace(re, () => { kinds.add(kind); return MASK; });
  }
  return { text: out, kinds: [...kinds] };
}

/**
 * Normalise a visitor message: strip control characters and markup-looking brackets,
 * collapse whitespace, and enforce the length limit on what the visitor actually typed.
 * @param {unknown} raw
 * @param {number} maxChars
 * @returns {{ ok: true, text: string } | { ok: false, reason: 'empty'|'too_long'|'invalid' }}
 */
function normaliseMessage(raw, maxChars) {
  if (typeof raw !== 'string') return { ok: false, reason: 'invalid' };
  if ([...raw].length > maxChars) return { ok: false, reason: 'too_long' };
  const text = raw
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return { ok: false, reason: 'empty' };
  return { ok: true, text };
}

module.exports = { redact, normaliseMessage, toLatinDigits, MASK };
