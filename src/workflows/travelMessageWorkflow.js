const engine = require('./workflowEngine');
const eventBus = require('../events/eventBus');
const claudeService = require('../services/claudeService');
const { buildExtractionPrompt } = require('../prompts/extractionPrompt');
const systemPrompt = require('../prompts/systemPrompt');
const { getNextMissingField, getQuestionForField, isRequestComplete } = require('../prompts/missingDataPrompt');
const memoryManager = require('../memory/memoryManager');
const { saveMessage } = require('../database/conversationRepository');
const { cancelFollowUpsForCustomer } = require('../database/followUpRepository');
const { computeLeadScore, classifyLead } = require('../services/leadScoringService');
const { leadScore: thresholds } = require('../config/env');
const toolsRegistry = require('../tools/registry');

const ANGER_SIGNALS = ['angry', 'terrible', 'awful', 'refund', 'useless', 'scam', 'رديء', 'احتيال', 'مشكلة'];

function detectAnger(message) {
  const lower = message.toLowerCase();
  return ANGER_SIGNALS.some((word) => lower.includes(word));
}

/**
 * The main workflow executed for every incoming customer message.
 * Each step has a single, named responsibility — easy to trace and unit-test.
 */
function register() {
  engine.register('travel.message', [
    {
      name: 'load_context',
      handler: async (ctx) => {
        ctx.context = await memoryManager.buildContextForAgent(ctx.customer);
        await cancelFollowUpsForCustomer(ctx.customer.id);
        await saveMessage({ customerId: ctx.customer.id, message: ctx.message, role: 'user' });
      },
    },
    {
      name: 'extract_entities',
      handler: async (ctx) => {
        const span = ctx.trace.startSpan('extract_entities');
        const prompt = buildExtractionPrompt(ctx.message, ctx.context.history);
        const startedAt = Date.now();
        const extracted = await claudeService.extractJSON(prompt);
        const latencyMs = Date.now() - startedAt;
        eventBus.publish('claude.called', { traceId: ctx.traceId, kind: 'extraction', latencyMs });
        span.end({ extracted: !!extracted });

        ctx.entities = extracted
          ? await memoryManager.mergeEntities(ctx.customer.id, extracted)
          : ctx.context.collectedEntities;

        eventBus.publish('intent.detected', {
          traceId: ctx.traceId,
          intent: ctx.entities.intent,
          entities: ctx.entities,
          latencyMs,
        });
      },
    },
    {
      name: 'score_lead',
      handler: async (ctx) => {
        ctx.leadScore = computeLeadScore({ customer: ctx.customer, entities: ctx.entities });
        ctx.leadClass = classifyLead(ctx.leadScore);
        eventBus.publish('lead.scored', {
          traceId: ctx.traceId,
          customer: ctx.customer,
          score: ctx.leadScore,
          classification: ctx.leadClass,
        });
      },
    },
    {
      name: 'check_escalation',
      handler: async (ctx) => {
        const alreadyEscalated = memoryManager.getShortTerm(ctx.customer.id, 'escalated');
        const reason = detectAnger(ctx.message)
          ? 'Customer expressed frustration'
          : ctx.customer.is_vip
            ? 'VIP customer'
            : ctx.leadScore < thresholds.escalateThreshold
              ? 'Low confidence score'
              : null;

        ctx.shouldEscalate = Boolean(reason) || Boolean(alreadyEscalated);

        if (reason && !alreadyEscalated) {
          memoryManager.setShortTerm(ctx.customer.id, 'escalated', true);
          await toolsRegistry.invoke(
            'notifyStaff',
            { customer: ctx.customer, reason, entities: ctx.entities, leadScore: ctx.leadScore },
            { traceId: ctx.traceId },
          );
          eventBus.publish('escalation.triggered', {
            traceId: ctx.traceId,
            customer: ctx.customer,
            reason,
          });
        }
      },
    },
    {
      name: 'persist_lead',
      handler: async (ctx) => {
        await toolsRegistry.invoke(
          'saveLead',
          { customer: ctx.customer, entities: ctx.entities },
          { traceId: ctx.traceId },
        );
      },
    },
    {
      name: 'maybe_schedule_followups',
      handler: async (ctx) => {
        if (isRequestComplete(ctx.entities) && !memoryManager.getShortTerm(ctx.customer.id, 'followupsScheduled')) {
          memoryManager.setShortTerm(ctx.customer.id, 'followupsScheduled', true);
          const result = await toolsRegistry.invoke(
            'scheduleFollowUps',
            { customerId: ctx.customer.id },
            { traceId: ctx.traceId },
          );
          if (result.ok) {
            eventBus.publish('followup.scheduled', {
              traceId: ctx.traceId,
              customerId: ctx.customer.id,
              count: 3,
            });
          }
        }
      },
    },
    {
      name: 'generate_reply',
      handler: async (ctx) => {
        const span = ctx.trace.startSpan('generate_reply');
        const messages = ctx.context.history.map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.message,
        }));

        const nextField = getNextMissingField(ctx.entities);
        let instruction = '';
        if (ctx.shouldEscalate) {
          instruction = '\n\n[SYSTEM: Escalation triggered. Empathize and tell the customer a human agent will be in touch shortly.]';
        } else if (!isRequestComplete(ctx.entities) && nextField) {
          instruction = `\n\n[SYSTEM: Missing field: ${nextField}. Ask only: "${getQuestionForField(nextField)}" — nothing else.]`;
        } else if (isRequestComplete(ctx.entities)) {
          instruction = `\n\n[SYSTEM: All required info collected. Summarize the travel request and confirm with the customer. Lead score: ${ctx.leadScore} (${ctx.leadClass}).]`;
        }

        messages.push({ role: 'user', content: ctx.message + instruction });

        const startedAt = Date.now();
        const response = await claudeService.chat({ systemPrompt, messages });
        const latencyMs = Date.now() - startedAt;
        eventBus.publish('claude.called', {
          traceId: ctx.traceId,
          kind: 'chat',
          latencyMs,
          usage: response.usage,
        });
        span.end({ latencyMs });

        ctx.reply = response.text;
        await saveMessage({ customerId: ctx.customer.id, message: ctx.reply, role: 'assistant' });
      },
    },
  ]);
}

module.exports = { register };
