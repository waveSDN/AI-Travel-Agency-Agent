const customerRepo = require('../database/customerRepository');
const travelRepo = require('../database/travelRequestRepository');
const { computeLeadScore } = require('../services/leadScoringService');
const logger = require('../utils/logger');

async function saveLead({ customer, entities }) {
  const score = computeLeadScore({ customer, entities });

  const [updatedCustomer, travelRequest] = await Promise.all([
    customerRepo.updateCustomer(customer.id, { lead_score: score }),
    travelRepo.upsertTravelRequest(customer.id, entities),
  ]);

  logger.info(`Lead saved — customer: ${customer.phone}, score: ${score}`);

  return { customer: updatedCustomer, travelRequest, leadScore: score };
}

module.exports = { saveLead };
