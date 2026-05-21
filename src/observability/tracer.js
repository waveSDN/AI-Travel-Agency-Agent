const { randomUUID } = require('crypto');

/**
 * Lightweight tracer — tracks the lifecycle of one user request.
 * Captures latency for each phase and produces a single structured trace at the end.
 */
class Trace {
  constructor(meta = {}) {
    this.traceId = randomUUID();
    this.startedAt = Date.now();
    this.meta = meta;
    this.spans = [];
    this.events = [];
    this.errors = [];
  }

  startSpan(name, attrs = {}) {
    const span = { name, attrs, startedAt: Date.now(), endedAt: null, durationMs: null };
    this.spans.push(span);
    return {
      end: (extra = {}) => {
        span.endedAt = Date.now();
        span.durationMs = span.endedAt - span.startedAt;
        Object.assign(span.attrs, extra);
        return span;
      },
      fail: (err) => {
        span.endedAt = Date.now();
        span.durationMs = span.endedAt - span.startedAt;
        span.error = err.message || String(err);
        this.errors.push({ span: name, error: span.error });
        return span;
      },
    };
  }

  addEvent(name, data = {}) {
    this.events.push({ name, data, at: Date.now() - this.startedAt });
  }

  recordError(source, err) {
    this.errors.push({ source, error: err.message || String(err), at: Date.now() - this.startedAt });
  }

  finalize() {
    const endedAt = Date.now();
    return {
      traceId: this.traceId,
      ...this.meta,
      startedAt: new Date(this.startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      totalLatencyMs: endedAt - this.startedAt,
      spans: this.spans,
      events: this.events,
      errors: this.errors,
      success: this.errors.length === 0,
    };
  }
}

function createTrace(meta) {
  return new Trace(meta);
}

module.exports = { createTrace, Trace };
