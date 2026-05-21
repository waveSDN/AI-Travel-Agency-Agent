const logger = require('../utils/logger');

/**
 * Scores a lead from 0–100 based on available signals.
 *
 * Weights:
 *   Budget provided:      +25
 *   Budget > $1000:       +10
 *   Date provided:        +20
 *   Urgency high:         +20
 *   Urgency medium:       +10
 *   Traveler count > 1:   +10
 *   Destination known:    +10
 *   Round trip:           +5
 */
function computeLeadScore({ customer, entities }) {
  let score = 0;

  if (entities.budget) {
    score += 25;
    if (parseFloat(entities.budget) > 1000) score += 10;
  }

  if (entities.travel_date) score += 20;

  if (entities.urgency === 'high') score += 20;
  else if (entities.urgency === 'medium') score += 10;

  if (entities.traveler_count && parseInt(entities.traveler_count, 10) > 1) score += 10;

  if (entities.destination_city) score += 10;

  if (entities.is_round_trip === 'true' || entities.is_round_trip === true) score += 5;

  const clamped = Math.min(100, Math.max(0, score));
  logger.debug(`Lead score computed: ${clamped}`, { phone: customer?.phone, entities });

  return clamped;
}

function classifyLead(score) {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

module.exports = { computeLeadScore, classifyLead };
