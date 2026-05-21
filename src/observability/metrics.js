/**
 * In-memory metrics aggregator.
 * Exposed via GET /metrics — replace with Prometheus/Datadog in production.
 */
const counters = new Map();
const histograms = new Map();

function increment(name, labels = {}, by = 1) {
  const key = serializeKey(name, labels);
  counters.set(key, (counters.get(key) || 0) + by);
}

function observe(name, value, labels = {}) {
  const key = serializeKey(name, labels);
  if (!histograms.has(key)) {
    histograms.set(key, { count: 0, sum: 0, min: Infinity, max: -Infinity });
  }
  const h = histograms.get(key);
  h.count += 1;
  h.sum += value;
  h.min = Math.min(h.min, value);
  h.max = Math.max(h.max, value);
}

function snapshot() {
  return {
    counters: Object.fromEntries(counters),
    histograms: Object.fromEntries(
      [...histograms.entries()].map(([k, v]) => [
        k,
        { ...v, avg: v.count > 0 ? v.sum / v.count : 0 },
      ]),
    ),
    capturedAt: new Date().toISOString(),
  };
}

function serializeKey(name, labels) {
  const labelStr = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(',');
  return labelStr ? `${name}{${labelStr}}` : name;
}

function reset() {
  counters.clear();
  histograms.clear();
}

module.exports = { increment, observe, snapshot, reset };
