const { getRecentHistory } = require('../database/conversationRepository');
const { getActiveRequest } = require('../database/travelRequestRepository');
const logger = require('../utils/logger');

const shortTermStore = new Map();

function setShortTerm(customerId, key, value) {
  if (!shortTermStore.has(customerId)) {
    shortTermStore.set(customerId, {});
  }
  shortTermStore.get(customerId)[key] = value;
}

function getShortTerm(customerId, key) {
  return shortTermStore.get(customerId)?.[key] ?? null;
}

function clearShortTerm(customerId) {
  shortTermStore.delete(customerId);
}

function getSessionState(customerId) {
  return shortTermStore.get(customerId) || {};
}

function setSessionState(customerId, state) {
  shortTermStore.set(customerId, { ...(shortTermStore.get(customerId) || {}), ...state });
}

async function buildContextForAgent(customer) {
  const [history, activeRequest] = await Promise.all([
    getRecentHistory(customer.id, 20),
    getActiveRequest(customer.id),
  ]);

  const sessionState = getSessionState(customer.id);

  return {
    customer,
    history,
    activeRequest,
    sessionState,
    collectedEntities: sessionState.entities || {},
  };
}

async function mergeEntities(customerId, newEntities) {
  const existing = getShortTerm(customerId, 'entities') || {};
  const merged = {};

  for (const [key, value] of Object.entries(existing)) {
    if (value !== null && value !== '') merged[key] = value;
  }
  for (const [key, value] of Object.entries(newEntities)) {
    if (value !== null && value !== '') merged[key] = value;
  }

  setShortTerm(customerId, 'entities', merged);
  logger.debug(`Entities merged for customer ${customerId}`, { merged });
  return merged;
}

module.exports = {
  setShortTerm,
  getShortTerm,
  clearShortTerm,
  getSessionState,
  setSessionState,
  buildContextForAgent,
  mergeEntities,
};
