'use strict';

/**
 * Conversation context per browser session, in this process's memory only.
 * Nothing is written to disk or logs; entries expire after the TTL, on "clear", or on restart.
 * A session id is a random 128-bit value carried in an httpOnly cookie, so one visitor
 * cannot read or extend another's context.
 */
const crypto = require('node:crypto');

const ID_RE = /^[a-f0-9]{32}$/;

/**
 * @typedef {{ role: 'user'|'model', text: string }} Turn
 * @typedef {{ turns: Turn[], lastSeen: number }} Session
 */

class SessionStore {
  /**
   * @param {{ ttlMs: number, maxSessions: number, maxTurns: number, now?: () => number }} opts
   */
  constructor(opts) {
    this.ttlMs = opts.ttlMs;
    this.maxSessions = opts.maxSessions;
    this.maxTurns = opts.maxTurns;
    this.now = opts.now || Date.now;
    /** @type {Map<string, Session>} */
    this.map = new Map();
  }

  static newId() { return crypto.randomBytes(16).toString('hex'); }
  /** @param {unknown} id */
  static validId(id) { return typeof id === 'string' && ID_RE.test(id); }

  /** @param {string} id */
  get(id) {
    const s = this.map.get(id);
    if (!s) return null;
    if (this.now() - s.lastSeen > this.ttlMs) { this.map.delete(id); return null; }
    return s;
  }

  /** @param {string} id */
  getOrCreate(id) {
    let s = this.get(id);
    if (!s) {
      this.sweep();
      if (this.map.size >= this.maxSessions) {
        // drop the least recently used session (Map keeps insertion order; touch() re-inserts)
        const oldest = this.map.keys().next().value;
        if (oldest !== undefined) this.map.delete(oldest);
      }
      s = { turns: [], lastSeen: this.now() };
      this.map.set(id, s);
    }
    this.touch(id, s);
    return s;
  }

  /** @param {string} id @param {Session} s */
  touch(id, s) {
    s.lastSeen = this.now();
    this.map.delete(id);
    this.map.set(id, s);
  }

  /** Append a completed exchange and keep only the last maxTurns exchanges. */
  /** @param {string} id @param {string} userText @param {string} modelText */
  append(id, userText, modelText) {
    const s = this.getOrCreate(id);
    s.turns.push({ role: 'user', text: userText }, { role: 'model', text: modelText });
    const keep = this.maxTurns * 2;
    if (s.turns.length > keep) s.turns.splice(0, s.turns.length - keep);
  }

  /** @param {string} id */
  clear(id) { return this.map.delete(id); }

  sweep() {
    const t = this.now();
    for (const [id, s] of this.map) if (t - s.lastSeen > this.ttlMs) this.map.delete(id);
  }

  get size() { return this.map.size; }
}

/**
 * History for one request: newest turns first until the character cap, returned oldest-first.
 * Always starts on a user turn so the model sees whole exchanges.
 * @param {Turn[]} turns
 * @param {number} maxChars
 * @returns {Turn[]}
 */
function capHistory(turns, maxChars) {
  /** @type {Turn[]} */
  const out = [];
  let used = 0;
  for (let i = turns.length - 1; i >= 0; i--) {
    const len = turns[i].text.length;
    if (used + len > maxChars) break;
    used += len;
    out.unshift(turns[i]);
  }
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

module.exports = { SessionStore, capHistory };
