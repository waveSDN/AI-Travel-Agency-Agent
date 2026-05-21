const workflowEngine = require('../workflows/workflowEngine');
const eventBus = require('../events/eventBus');
const { createTrace } = require('../observability/tracer');
const logger = require('../utils/logger');

/**
 * Travel Agent — the thin orchestrator.
 *
 * All it does:
 *   1. Create a trace for the request
 *   2. Emit `message.received`
 *   3. Run the `travel.message` workflow
 *   4. Emit `agent.responded` with latency + lead info
 *
 * Business logic lives in the workflow steps, NOT here.
 * Tool calls go through the registry, NOT direct imports.
 * Claude calls go through `claudeService`, NOT direct SDK calls.
 */
async function process({ customer, message }) {
  const trace = createTrace({ phone: customer.phone, customerId: customer.id });
  const traceId = trace.traceId;
  const startedAt = Date.now();

  eventBus.publish('message.received', { traceId, customer, message });

  const result = await workflowEngine.run('travel.message', {
    customer,
    message,
    trace,
    traceId,
  });

  if (!result.ok) {
    eventBus.publish('error.occurred', { traceId, source: 'travelAgent', error: result.error });
    logger.error(`Workflow failed for ${customer.phone}: ${result.error}`);
    return {
      reply: "I'm sorry, something went wrong. Our team will follow up with you shortly. 🙏",
      entities: {},
      leadScore: 0,
      leadClass: 'cold',
      escalated: true,
      traceId,
      error: result.error,
    };
  }

  const totalLatencyMs = Date.now() - startedAt;
  const ctx = result.ctx;
  const toolsUsed = ctx._trail.filter((s) => s.ok).map((s) => s.step);

  eventBus.publish('agent.responded', {
    traceId,
    customer,
    reply: ctx.reply,
    leadScore: ctx.leadScore,
    latencyMs: totalLatencyMs,
    toolsUsed,
  });

  return {
    reply: ctx.reply,
    entities: ctx.entities,
    leadScore: ctx.leadScore,
    leadClass: ctx.leadClass,
    escalated: ctx.shouldEscalate,
    traceId,
    trace: trace.finalize(),
  };
}

module.exports = { process };
