const eventBus = require('../events/eventBus');
const metrics = require('./metrics');
const logger = require('../utils/logger');

/**
 * Subscribes to the event bus and produces structured logs + metrics.
 * This is the SINGLE place where we wire up cross-cutting observability —
 * the agent and tools never log directly to this concern.
 *
 * Captures (per requirement):
 *   • User message
 *   • Intent
 *   • Tools used
 *   • Claude response
 *   • Latency
 *   • Errors
 */
function structuredLog(payload) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...payload });
  logger.info(line);
}

function register() {
  eventBus.on('message.received', (e) => {
    metrics.increment('messages_received_total');
    structuredLog({
      kind: 'message.received',
      traceId: e.traceId,
      phone: e.customer?.phone,
      messageLength: e.message?.length,
      messagePreview: e.message?.slice(0, 200),
    });
  });

  eventBus.on('intent.detected', (e) => {
    metrics.increment('intents_total', { intent: e.intent || 'unknown' });
    metrics.observe('intent_detection_latency_ms', e.latencyMs || 0);
    structuredLog({
      kind: 'intent.detected',
      traceId: e.traceId,
      intent: e.intent,
      entities: e.entities,
      latencyMs: e.latencyMs,
    });
  });

  eventBus.on('tool.called', (e) => {
    metrics.increment('tool_calls_total', { tool: e.tool });
    structuredLog({
      kind: 'tool.called',
      traceId: e.traceId,
      tool: e.tool,
      args: e.args,
    });
  });

  eventBus.on('tool.completed', (e) => {
    metrics.observe('tool_latency_ms', e.latencyMs || 0, { tool: e.tool });
    structuredLog({
      kind: 'tool.completed',
      traceId: e.traceId,
      tool: e.tool,
      latencyMs: e.latencyMs,
      success: true,
    });
  });

  eventBus.on('tool.failed', (e) => {
    metrics.increment('tool_failures_total', { tool: e.tool });
    structuredLog({
      kind: 'tool.failed',
      traceId: e.traceId,
      tool: e.tool,
      error: e.error,
      latencyMs: e.latencyMs,
    });
  });

  eventBus.on('claude.called', (e) => {
    metrics.observe('claude_latency_ms', e.latencyMs || 0, { kind: e.kind });
    metrics.increment('claude_calls_total', { kind: e.kind });
    if (e.usage?.input_tokens) {
      metrics.observe('claude_input_tokens', e.usage.input_tokens, { kind: e.kind });
    }
    if (e.usage?.output_tokens) {
      metrics.observe('claude_output_tokens', e.usage.output_tokens, { kind: e.kind });
    }
    structuredLog({
      kind: 'claude.called',
      traceId: e.traceId,
      callKind: e.kind,
      latencyMs: e.latencyMs,
      usage: e.usage,
    });
  });

  eventBus.on('agent.responded', (e) => {
    metrics.observe('agent_total_latency_ms', e.latencyMs || 0);
    metrics.increment('agent_responses_total');
    structuredLog({
      kind: 'agent.responded',
      traceId: e.traceId,
      phone: e.customer?.phone,
      replyPreview: e.reply?.slice(0, 300),
      leadScore: e.leadScore,
      latencyMs: e.latencyMs,
      toolsUsed: e.toolsUsed,
    });
  });

  eventBus.on('lead.scored', (e) => {
    metrics.observe('lead_score', e.score);
    metrics.increment('leads_total', { classification: e.classification });
  });

  eventBus.on('escalation.triggered', (e) => {
    metrics.increment('escalations_total', { reason: e.reason });
    structuredLog({
      kind: 'escalation.triggered',
      traceId: e.traceId,
      phone: e.customer?.phone,
      reason: e.reason,
    });
  });

  eventBus.on('followup.scheduled', (e) => {
    metrics.increment('followups_scheduled_total', {}, e.count || 0);
  });

  eventBus.on('error.occurred', (e) => {
    metrics.increment('errors_total', { source: e.source });
    structuredLog({
      kind: 'error.occurred',
      traceId: e.traceId,
      source: e.source,
      error: e.error,
    });
  });

  logger.info('Observability subscriber registered (listening on event bus)');
}

module.exports = { register };
