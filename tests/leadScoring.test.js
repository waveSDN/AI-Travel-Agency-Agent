const { computeLeadScore, classifyLead } = require('../src/services/leadScoringService');

describe('Lead Scoring', () => {
  const customer = { phone: '+966500000000' };

  test('returns 0 for empty entities', () => {
    expect(computeLeadScore({ customer, entities: {} })).toBe(0);
  });

  test('scores budget correctly', () => {
    const score = computeLeadScore({ customer, entities: { budget: '500' } });
    expect(score).toBe(25);
  });

  test('adds bonus for budget over 1000', () => {
    const score = computeLeadScore({ customer, entities: { budget: '2000' } });
    expect(score).toBe(35);
  });

  test('scores high urgency', () => {
    const score = computeLeadScore({ customer, entities: { urgency: 'high' } });
    expect(score).toBe(20);
  });

  test('scores full request correctly', () => {
    const entities = {
      budget: '1500',
      travel_date: '2026-06-01',
      urgency: 'high',
      traveler_count: '3',
      destination_city: 'Jeddah',
      is_round_trip: 'true',
    };
    const score = computeLeadScore({ customer, entities });
    expect(score).toBe(100);
  });

  test('classifyLead returns hot for score >= 70', () => {
    expect(classifyLead(70)).toBe('hot');
    expect(classifyLead(100)).toBe('hot');
  });

  test('classifyLead returns warm for score 40-69', () => {
    expect(classifyLead(40)).toBe('warm');
    expect(classifyLead(69)).toBe('warm');
  });

  test('classifyLead returns cold for score < 40', () => {
    expect(classifyLead(0)).toBe('cold');
    expect(classifyLead(39)).toBe('cold');
  });
});
