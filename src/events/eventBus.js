const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * Central event bus for the entire application.
 * All cross-cutting concerns (observability, analytics, side-effects) subscribe here.
 *
 * Standard events:
 *   message.received   { traceId, customer, message }
 *   intent.detected    { traceId, customer, intent, entities, latencyMs }
 *   tool.called        { traceId, tool, args }
 *   tool.completed     { traceId, tool, result, latencyMs }
 *   tool.failed        { traceId, tool, error, latencyMs }
 *   claude.called      { traceId, kind, latencyMs, usage }
 *   agent.responded    { traceId, customer, reply, leadScore, latencyMs }
 *   lead.scored        { traceId, customer, score, classification }
 *   escalation.triggered { traceId, customer, reason }
 *   followup.scheduled { traceId, customerId, count }
 *   error.occurred     { traceId, source, error }
 */
class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50);
  }

  publish(event, payload = {}) {
    const enriched = { ...payload, event, publishedAt: new Date().toISOString() };
    logger.debug(`[event] ${event}`, { meta: { traceId: payload.traceId } });
    this.emit(event, enriched);
    this.emit('*', enriched);
  }
}

const eventBus = new EventBus();

module.exports = eventBus;
module.exports.EVENTS = Object.freeze({
  MESSAGE_RECEIVED: 'message.received',
  INTENT_DETECTED: 'intent.detected',
  TOOL_CALLED: 'tool.called',
  TOOL_COMPLETED: 'tool.completed',
  TOOL_FAILED: 'tool.failed',
  CLAUDE_CALLED: 'claude.called',
  AGENT_RESPONDED: 'agent.responded',
  LEAD_SCORED: 'lead.scored',
  ESCALATION_TRIGGERED: 'escalation.triggered',
  FOLLOWUP_SCHEDULED: 'followup.scheduled',
  ERROR_OCCURRED: 'error.occurred',
});
