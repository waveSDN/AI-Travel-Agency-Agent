const eventBus = require('../src/events/eventBus');

describe('Event Bus', () => {
  test('publishes events to subscribers', (done) => {
    eventBus.once('test.event', (payload) => {
      expect(payload.foo).toBe('bar');
      expect(payload.event).toBe('test.event');
      expect(payload.publishedAt).toBeDefined();
      done();
    });
    eventBus.publish('test.event', { foo: 'bar' });
  });

  test('wildcard subscriber receives all events', (done) => {
    eventBus.once('*', (payload) => {
      expect(payload.event).toBe('wildcard.test');
      done();
    });
    eventBus.publish('wildcard.test', { x: 1 });
  });

  test('exports standard event names', () => {
    const { EVENTS } = require('../src/events/eventBus');
    expect(EVENTS.MESSAGE_RECEIVED).toBe('message.received');
    expect(EVENTS.TOOL_CALLED).toBe('tool.called');
    expect(EVENTS.AGENT_RESPONDED).toBe('agent.responded');
  });
});
