'use strict';

/**
 * Builds public/ from sources:
 *   design/tokens.json  -> public/assets/css/tokens.css (same compiler as the design system preview)
 *   web/assets/**       -> public/assets/** (copied as is)
 *   content/*.json + web/page.js -> public/index.html
 * No secrets are read here; the output is static and safe to serve from any host.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { renderPage } = require('../web/page');
const { loadKnowledge, loadAssistant } = require('../server/knowledge');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public');

/** @param {any} t */
function tokensCss(t) {
  const first = t.color.themes[0].id;
  /** @param {any} v */
  const val = (v) => {
    const s = typeof v === 'string' ? v : v[first];
    const m = /^\{(.+)\}$/.exec(s);
    return m ? `var(--${m[1]})` : s;
  };
  const out = [];
  for (const f of t.type.fonts) {
    out.push(`@font-face{font-family:'${f.family}';src:url('../${f.file}') format('woff2');font-weight:${f.weight};font-style:normal;font-display:swap}`);
  }
  const cols = t.color.tokens.map((/** @type {any} */ c) => `--${c.name}:${val(c.value)}`).join(';');
  const shad = ((t.shadow && t.shadow.tokens) || []).map((/** @type {any} */ c) => `--${c.name}:${val(c.value)}`).join(';');
  out.push(`:root,[data-theme="${first}"]{${cols};${shad}}`);
  const rest = [];
  for (const fam of ['spacing', 'radius', 'layout']) for (const c of ((t[fam] && t[fam].tokens) || [])) rest.push(`--${c.name}:${c.value}`);
  for (const [k, v] of Object.entries(t.type.families)) rest.push(`--font-${k}:${v}`);
  out.push(`:root{${rest.join(';')}}`);
  for (const g of t.type.groups) {
    for (const st of g.styles) {
      const fam = st.family || g.family;
      out.push(`.${st.name}{font-family:var(--font-${fam});font-size:${st.fontSize};line-height:${st.lineHeight};font-weight:${st.fontWeight}}`);
    }
  }
  return out.join('\n') + '\n';
}

/** @param {string} src @param {string} dst */
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function build() {
  const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'design', 'tokens.json'), 'utf8'));
  const knowledge = loadKnowledge();
  const assistant = loadAssistant();

  fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(path.join(ROOT, 'web', 'assets'), path.join(OUT, 'assets'));
  // fonts are referenced from tokens.json as fonts/<file>; keep that path under assets/
  fs.writeFileSync(path.join(OUT, 'assets', 'css', 'tokens.css'), tokensCss(tokens));

  const hash = crypto.createHash('sha256');
  for (const f of ['design/tokens.json', 'content/knowledge.json', 'content/assistant.json', 'web/page.js', 'web/assets/css/wis.css', 'web/assets/css/site.css', 'web/assets/js/wis.js', 'web/assets/js/assistant.js']) {
    hash.update(fs.readFileSync(path.join(ROOT, f)));
  }
  const version = hash.digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'index.html'), renderPage(knowledge, assistant, { version }));
  // not public yet: ask crawlers to stay away (the page also carries noindex)
  fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  return { version };
}

if (require.main === module) {
  const { version } = build();
  console.log(`built public/ (version ${version})`);
}

module.exports = { build, tokensCss };
