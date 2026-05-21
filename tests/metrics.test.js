const metrics = require('../src/observability/metrics');

describe('Metrics', () => {
  beforeEach(() => metrics.reset());

  test('increments counters', () => {
    metrics.increment('messages_total');
    metrics.increment('messages_total');
    metrics.increment('messages_total', { source: 'whatsapp' });

    const snap = metrics.snapshot();
    expect(snap.counters['messages_total']).toBe(2);
    expect(snap.counters['messages_total{source=whatsapp}']).toBe(1);
  });

  test('observes histograms', () => {
    metrics.observe('latency_ms', 100);
    metrics.observe('latency_ms', 200);
    metrics.observe('latency_ms', 300);

    const snap = metrics.snapshot();
    const h = snap.histograms['latency_ms'];
    expect(h.count).toBe(3);
    expect(h.sum).toBe(600);
    expect(h.avg).toBe(200);
    expect(h.min).toBe(100);
    expect(h.max).toBe(300);
  });

  test('labels are sorted deterministically', () => {
    metrics.increment('hits', { b: '2', a: '1' });
    metrics.increment('hits', { a: '1', b: '2' });
    const snap = metrics.snapshot();
    expect(snap.counters['hits{a=1,b=2}']).toBe(2);
  });
});
