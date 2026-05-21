const { createTrace } = require('../src/observability/tracer');

describe('Tracer', () => {
  test('creates a trace with a unique id', () => {
    const t1 = createTrace();
    const t2 = createTrace();
    expect(t1.traceId).not.toBe(t2.traceId);
  });

  test('spans record duration', async () => {
    const trace = createTrace();
    const span = trace.startSpan('test_span');
    await new Promise((r) => setTimeout(r, 10));
    span.end({ result: 'ok' });

    const finalized = trace.finalize();
    expect(finalized.spans).toHaveLength(1);
    expect(finalized.spans[0].name).toBe('test_span');
    expect(finalized.spans[0].durationMs).toBeGreaterThanOrEqual(10);
    expect(finalized.spans[0].attrs.result).toBe('ok');
  });

  test('finalize sets success=false when errors recorded', () => {
    const trace = createTrace();
    trace.recordError('test', new Error('oops'));
    const finalized = trace.finalize();
    expect(finalized.success).toBe(false);
    expect(finalized.errors).toHaveLength(1);
  });

  test('finalize captures total latency', async () => {
    const trace = createTrace();
    await new Promise((r) => setTimeout(r, 20));
    const finalized = trace.finalize();
    expect(finalized.totalLatencyMs).toBeGreaterThanOrEqual(20);
  });
});
