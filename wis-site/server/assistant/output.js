'use strict';

/**
 * Everything the model returns is untrusted. It must be one JSON object with the expected fields;
 * the reply becomes plain text (no markup, links or contact details), the sector must be one of
 * the site's ids, and replies that state numbers the knowledge never gave (prices, percentages)
 * are replaced. Links and buttons shown to the visitor are built by the app from these ids only.
 */
const { redact } = require('./privacy');

const SECTORS = new Set(['clinic', 'travel', 'sales', 'none']);
const MAX_REPLY = 900;

/** JSON schema sent to Gemini; the app re-validates the result regardless. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'رد عربي قصير بنص عادي' },
    sector: { type: 'string', enum: ['clinic', 'travel', 'sales', 'none'] },
    needsTeam: { type: 'boolean' }
  },
  required: ['reply', 'sector', 'needsTeam']
};

const SAFE_PRICE_REPLY = 'لا توجد في المحتوى المعتمد أسعار أو أرقام أو نسب يمكنني ذكرها. هذه تحتاج مناقشة مع فريق WIS.';

// prices, currencies, percentages and "guaranteed" style promises are never in the approved knowledge
const CLAIMS = [
  /\d[\d,.\s]*\s*(?:ريال|ر\.?\s?س|SAR|SR|دولار|\$|USD|€|يورو)/i,
  /(?:ريال|SAR|\$|USD)\s*\d/i,
  /\d+(?:[.,]\d+)?\s*(?:%|٪|بالمئة|في المئة|بالمائة)/,
  /(?:نضمن|مضمون|ضمان)\s+(?:لك\s+)?(?:الأرباح|الربح|أرباح|عائد|نتائج)/
];

/**
 * @param {string} s
 * @returns {string}
 */
function toPlainText(s) {
  return s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')               // HTML tags
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')        // markdown links/images -> their text
    .replace(/\b(?:https?|ftp|javascript|data):\/*[^\s]*/gi, '')
    .replace(/\bwww\.[^\s]+/gi, '')
    .replace(/[<>`*_#|]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/**
 * @param {unknown} raw text returned by the provider
 * @returns {{ ok: true, reply: string, sector: 'clinic'|'travel'|'sales'|'none', needsTeam: boolean, replaced: boolean }
 *         | { ok: false, reason: 'invalid_output' }}
 */
function parseModelOutput(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 20000) return { ok: false, reason: 'invalid_output' };
  /** @type {any} */
  let data;
  try {
    data = JSON.parse(raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    return { ok: false, reason: 'invalid_output' };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.reply !== 'string') return { ok: false, reason: 'invalid_output' };

  let reply = toPlainText(data.reply);
  reply = redact(reply).text;                         // the model must not hand out contact details either
  if ([...reply].length > MAX_REPLY) reply = [...reply].slice(0, MAX_REPLY).join('').replace(/\s+\S*$/, '') + '…';
  if (!reply.replace(/\[محذوف\]/g, '').trim()) return { ok: false, reason: 'invalid_output' };

  let replaced = false;
  if (CLAIMS.some((re) => re.test(reply))) { reply = SAFE_PRICE_REPLY; replaced = true; }

  const sector = typeof data.sector === 'string' && SECTORS.has(data.sector) ? data.sector : 'none';
  const needsTeam = data.needsTeam === true || replaced;
  return { ok: true, reply, sector: /** @type {any} */ (sector), needsTeam, replaced };
}

module.exports = { parseModelOutput, toPlainText, RESPONSE_SCHEMA, SAFE_PRICE_REPLY };
