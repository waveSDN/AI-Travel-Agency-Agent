'use strict';

/**
 * The single reviewed knowledge source. The page build (scripts/build.js) and the assistant both
 * read content/knowledge.json; the assistant only ever sees the public text built here.
 */
const fs = require('node:fs');
const path = require('node:path');

const CONTENT = path.join(__dirname, '..', 'content');

/** @returns {any} */
function loadKnowledge() {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, 'knowledge.json'), 'utf8'));
}
/** @returns {any} */
function loadAssistant() {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, 'assistant.json'), 'utf8'));
}

/**
 * Allowed ids for everything the browser may send as context. Anything else is dropped.
 * @param {any} a assistant.json
 */
function choiceLabels(a) {
  /** @type {Record<string, Record<string, string>>} */
  const out = {};
  for (const step of a.steps) {
    out[step.id] = {};
    for (const o of step.options) out[step.id][o.id] = o.label;
  }
  return out;
}

/**
 * Plain-text digest of the public knowledge for the model. Built from the same JSON the page uses,
 * so the site and the assistant cannot drift apart.
 * @param {any} k knowledge.json
 */
function knowledgeText(k) {
  const L = [];
  const c = k.company;
  L.push(`الشركة: ${c.name} (${c.short}).`, `ما تقدمه: ${c.description}`, `المرحلة: ${c.stage}`, `الجمهور: ${c.audience}`);
  L.push(`غير معلن ولا يجوز ادعاؤه: ${c.notClaimed.join('؛ ')}.`);
  L.push('', 'قطاعات أمثلة الموقع: ' + k.sectors.map((/** @type {any} */ s) => `${s.label} (${s.id})`).join('، ') + '.');
  L.push('', 'التحديات التي يعرضها الموقع:');
  for (const ch of k.challenges) L.push(`- ${ch.title}: ${ch.desc} مثال الموقع: ${ch.headline}. ${ch.after}`);
  L.push('', 'مراحل العمل:');
  for (const m of k.methodology) L.push(`${m.n}. ${m.name}: ${m.detail} الناتج: ${m.out}.`);
  L.push('', 'أجزاء الوكيل:');
  for (const p of k.agentParts) L.push(`${p.n}. ${p.name}: ${p.what}`);
  L.push('', `مثال «${k.fit.title}» (${k.fit.badge}). ${k.fit.integrationsNote}`);
  for (const s of k.sectors) {
    const f = k.fit.sectors[s.id];
    L.push(`- ${s.label}: المهمة: ${f.mission} أدوات مقترحة: ${f.tools.map((/** @type {any} */ t) => t.name).join('، ')}.` +
      ` الصلاحيات: قراءة: ${f.perms.read.join(' ')} تنفيذ ضمن صلاحيات محددة: ${f.perms.exec.join(' ')} يتطلب موافقة: ${f.perms.approve.join(' ')}`);
  }
  L.push('', 'المشاريع وحالاتها (لا تغيّر الحالة):');
  for (const p of k.projects) {
    L.push(`- ${p.name}${p.alias ? ` (${p.alias})` : ''} — ${p.sector} — الحالة: ${p.statusLabel}. ${p.desc}`);
    if (p.limits) L.push(`  حدود: ${p.limits.join(' ')}`);
    if (p.details) L.push('  ' + p.details.map((/** @type {string[]} */ d) => `${d[0]}: ${d[1]}`).join(' '));
    if (p.disclaimer) L.push(`  ${p.disclaimer}`);
    L.push(`  ضوابط مستهدفة: ${p.security.controls.join('، ')}.`);
  }
  L.push('', `الأمان والتحكم (${k.security.generalTitle}): ` + k.security.general.map((/** @type {any} */ g) => g.text).join(' '), k.security.note);
  L.push('', `التواصل: ${k.contact.status}`);
  L.push('', 'إجابات معتمدة:');
  for (const f of k.faq) L.push(`- ${f.q} ${f.a}`);
  L.push('', `عند غياب المعلومة: ${k.unknown}`);
  return L.join('\n');
}

module.exports = { loadKnowledge, loadAssistant, choiceLabels, knowledgeText };
