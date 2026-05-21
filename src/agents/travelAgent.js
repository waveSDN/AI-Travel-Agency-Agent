const claudeService = require('../services/claudeService');
const { buildExtractionPrompt } = require('../prompts/extractionPrompt');
const systemPrompt = require('../prompts/systemPrompt');
const { getNextMissingField, getQuestionForField, isRequestComplete } = require('../prompts/missingDataPrompt');
const memoryManager = require('../memory/memoryManager');
const { saveMessage } = require('../database/conversationRepository');
const { saveLead } = require('../tools/saveLead');
const { notifyStaff } = require('../tools/notifyStaff');
const { scheduleFollowUps } = require('../tools/followUp');
const { followUpRepository } = require('../database');
const { computeLeadScore, classifyLead } = require('../services/leadScoringService');
const { leadScore: thresholds } = require('../config/env');
const logger = require('../utils/logger');

const ANGER_SIGNALS = ['angry', 'terrible', 'awful', 'refund', 'useless', 'scam', 'رديء', 'احتيال', 'مشكلة'];

function detectAnger(message) {
  const lower = message.toLowerCase();
  return ANGER_SIGNALS.some((word) => lower.includes(word));
}

async function process({ customer, message }) {
  logger.info(`Processing message from ${customer.phone}: "${message}"`);

  const context = await memoryManager.buildContextForAgent(customer);

  await saveMessage({ customerId: customer.id, message, role: 'user' });

  const extractionPrompt = buildExtractionPrompt(message, context.history);
  const extracted = await claudeService.extractJSON(extractionPrompt);

  let entities = context.collectedEntities;
  if (extracted) {
    entities = await memoryManager.mergeEntities(customer.id, extracted);
  }

  const score = computeLeadScore({ customer, entities });
  const leadClass = classifyLead(score);

  const shouldEscalate =
    detectAnger(message) ||
    score < thresholds.escalateThreshold ||
    customer.is_vip ||
    memoryManager.getShortTerm(customer.id, 'escalated');

  if (shouldEscalate && !memoryManager.getShortTerm(customer.id, 'escalated')) {
    memoryManager.setShortTerm(customer.id, 'escalated', true);
    await notifyStaff({
      customer,
      reason: detectAnger(message) ? 'Customer expressed frustration' : customer.is_vip ? 'VIP customer' : 'Low confidence score',
      entities,
      leadScore: score,
    });
  }

  await saveLead({ customer, entities });

  if (isRequestComplete(entities) && !memoryManager.getShortTerm(customer.id, 'followupsScheduled')) {
    memoryManager.setShortTerm(customer.id, 'followupsScheduled', true);
    await scheduleFollowUps(customer.id).catch((err) =>
      logger.warn(`Follow-up scheduling failed: ${err.message}`),
    );
  }

  const conversationMessages = context.history.map((h) => ({
    role: h.role === 'assistant' ? 'assistant' : 'user',
    content: h.message,
  }));

  const nextField = getNextMissingField(entities);
  let agentInstruction = '';

  if (shouldEscalate) {
    agentInstruction = '\n\n[SYSTEM: Escalation triggered. Empathize with the customer and inform them a human agent will be in touch shortly.]';
  } else if (!isRequestComplete(entities) && nextField) {
    const question = getQuestionForField(nextField);
    agentInstruction = `\n\n[SYSTEM: Missing field: ${nextField}. Ask only: "${question}" — nothing else.]`;
  } else if (isRequestComplete(entities)) {
    agentInstruction = `\n\n[SYSTEM: All required info collected. Summarize the travel request and confirm with the customer. Lead score: ${score} (${leadClass}).]`;
  }

  conversationMessages.push({ role: 'user', content: message + agentInstruction });

  const aiResponse = await claudeService.chat({
    systemPrompt,
    messages: conversationMessages,
  });

  await saveMessage({ customerId: customer.id, message: aiResponse.text, role: 'assistant' });

  logger.info(`Agent replied to ${customer.phone}`, { score, leadClass, intent: entities.intent });

  return {
    reply: aiResponse.text,
    entities,
    leadScore: score,
    leadClass,
    escalated: shouldEscalate,
  };
}

module.exports = { process };
