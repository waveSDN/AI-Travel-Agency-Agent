const engine = require('../src/workflows/workflowEngine');

describe('Workflow Engine', () => {
  test('runs steps sequentially', async () => {
    const order = [];
    engine.register('linear', [
      { name: 's1', handler: async () => { order.push('s1'); } },
      { name: 's2', handler: async () => { order.push('s2'); } },
      { name: 's3', handler: async () => { order.push('s3'); } },
    ]);

    const result = await engine.run('linear');
    expect(result.ok).toBe(true);
    expect(order).toEqual(['s1', 's2', 's3']);
    expect(result.trail).toHaveLength(3);
  });

  test('short-circuits when step returns stop=true', async () => {
    const order = [];
    engine.register('early-stop', [
      { name: 'a', handler: async () => { order.push('a'); } },
      { name: 'b', handler: async () => { order.push('b'); return { stop: true, result: 'done' }; } },
      { name: 'c', handler: async () => { order.push('c'); } },
    ]);

    const result = await engine.run('early-stop');
    expect(result.ok).toBe(true);
    expect(result.result).toBe('done');
    expect(order).toEqual(['a', 'b']);
  });

  test('branches via next:', async () => {
    const visited = [];
    engine.register('branch', [
      { name: 'start', handler: async () => { visited.push('start'); return { next: 'jump' }; } },
      { name: 'skipped', handler: async () => { visited.push('skipped'); } },
      { name: 'jump', handler: async () => { visited.push('jump'); } },
    ]);

    await engine.run('branch');
    expect(visited).toEqual(['start', 'jump']);
  });

  test('handles step errors', async () => {
    engine.register('failing', [
      { name: 'good', handler: async () => {} },
      { name: 'bad', handler: async () => { throw new Error('kaboom'); } },
    ]);

    const result = await engine.run('failing');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('kaboom');
    expect(result.trail[1].ok).toBe(false);
  });

  test('shares context across steps', async () => {
    engine.register('shared-ctx', [
      { name: 'set', handler: async (ctx) => { ctx.value = 42; } },
      { name: 'read', handler: async (ctx) => { ctx.doubled = ctx.value * 2; } },
    ]);

    const result = await engine.run('shared-ctx');
    expect(result.ctx.doubled).toBe(84);
  });
});
