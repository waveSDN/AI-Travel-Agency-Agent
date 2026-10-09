'use strict';

/**
 * Request limits enforced on the server (the browser is never trusted to count).
 * These counters live in this process's memory: with several instances or restarts they are
 * per instance, so they are NOT a global cap. A shared store (e.g. Redis) is needed for that.
 */

class WindowCounter {
  /** @param {{ limit: number, windowMs: number, now?: () => number, maxKeys?: number }} o */
  constructor(o) {
    this.limit = o.limit;
    this.windowMs = o.windowMs;
    this.now = o.now || Date.now;
    this.maxKeys = o.maxKeys || 10000;
    /** @type {Map<string, { start: number, count: number }>} */
    this.map = new Map();
  }

  /**
   * Count one hit for key if under the limit.
   * @param {string} key
   * @returns {{ ok: boolean, retryAfterSec: number }}
   */
  hit(key) {
    const t = this.now();
    let w = this.map.get(key);
    if (!w || t - w.start >= this.windowMs) {
      if (!w && this.map.size >= this.maxKeys) this.prune(t);
      w = { start: t, count: 0 };
      this.map.set(key, w);
    }
    if (w.count >= this.limit) return { ok: false, retryAfterSec: Math.max(1, Math.ceil((w.start + this.windowMs - t) / 1000)) };
    w.count++;
    return { ok: true, retryAfterSec: 0 };
  }

  /** @param {number} t */
  prune(t) {
    for (const [k, w] of this.map) if (t - w.start >= this.windowMs) this.map.delete(k);
    if (this.map.size >= this.maxKeys) this.map.clear();
  }
}

/** Requests to the model per UTC day for the whole process. */
class DailyBudget {
  /** @param {{ limit: number, now?: () => number }} o */
  constructor(o) {
    this.limit = o.limit;
    this.now = o.now || Date.now;
    this.day = '';
    this.used = 0;
  }

  /** @returns {boolean} */
  take() {
    const d = new Date(this.now()).toISOString().slice(0, 10);
    if (d !== this.day) { this.day = d; this.used = 0; }
    if (this.used >= this.limit) return false;
    this.used++;
    return true;
  }

  /** Give back a unit when the request never reached the provider. */
  refund() { if (this.used > 0) this.used--; }
}

module.exports = { WindowCounter, DailyBudget };
