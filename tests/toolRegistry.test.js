const registry = require('../src/tools/registry');

describe('Tool Registry', () => {
  beforeEach(() => {
    // reset registry between tests
    for (const tool of registry.list()) registry.unregister(tool.name);
  });

  test('registers and retrieves a tool', () => {
    registry.register({
      name: 'testTool',
      description: 'A test tool',
      parameters: { type: 'object', properties: {} },
      handler: async () => ({ ok: true }),
    });

    expect(registry.has('testTool')).toBe(true);
    expect(registry.get('testTool').description).toBe('A test tool');
  });

  test('rejects invalid registration', () => {
    expect(() => registry.register({})).toThrow(/name, description, handler required/);
  });

  test('produces Anthropic-compatible tool definitions', () => {
    registry.register({
      name: 'search',
      description: 'Search something',
      parameters: { type: 'object', properties: { q: { type: 'string' } } },
      handler: async () => ({}),
    });

    const tools = registry.toAnthropicTools();
    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      name: 'search',
      description: 'Search something',
      input_schema: { type: 'object', properties: { q: { type: 'string' } } },
    });
  });

  test('invoke returns ok=true on success', async () => {
    registry.register({
      name: 'addTool',
      description: 'Adds numbers',
      parameters: {},
      handler: async ({ a, b }) => a + b,
    });

    const result = await registry.invoke('addTool', { a: 2, b: 3 });
    expect(result.ok).toBe(true);
    expect(result.result).toBe(5);
    expect(typeof result.latencyMs).toBe('number');
  });

  test('invoke returns ok=false on failure', async () => {
    registry.register({
      name: 'broken',
      description: 'Always fails',
      parameters: {},
      handler: async () => { throw new Error('boom'); },
    });

    const result = await registry.invoke('broken', {});
    expect(result.ok).toBe(false);
    expect(result.error).toBe('boom');
  });

  test('invoke throws for unknown tool', async () => {
    await expect(registry.invoke('missing', {})).rejects.toThrow(/Tool not found/);
  });
});
