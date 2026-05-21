const {
  getNextMissingField,
  getQuestionForField,
  isRequestComplete,
} = require('../src/prompts/missingDataPrompt');

describe('Missing Data Engine', () => {
  test('returns destination_city first when empty', () => {
    expect(getNextMissingField({})).toBe('destination_city');
  });

  test('returns departure_city when destination is known', () => {
    expect(getNextMissingField({ destination_city: 'Jeddah' })).toBe('departure_city');
  });

  test('returns travel_date after cities known', () => {
    expect(getNextMissingField({
      destination_city: 'Jeddah',
      departure_city: 'Khartoum',
    })).toBe('travel_date');
  });

  test('returns null when all priority fields are present', () => {
    const entities = {
      destination_city: 'Jeddah',
      departure_city: 'Khartoum',
      travel_date: '2026-06-01',
      traveler_count: '2',
      return_date: '2026-06-10',
      class: 'economy',
      hotel_preference: '4-star',
      budget: '1000',
    };
    expect(getNextMissingField(entities)).toBeNull();
  });

  test('isRequestComplete returns false when fields missing', () => {
    expect(isRequestComplete({ destination_city: 'Jeddah' })).toBe(false);
  });

  test('isRequestComplete returns true when all required fields present', () => {
    expect(isRequestComplete({
      destination_city: 'Jeddah',
      departure_city: 'Khartoum',
      travel_date: '2026-06-01',
      traveler_count: '1',
    })).toBe(true);
  });

  test('getQuestionForField returns correct question', () => {
    expect(getQuestionForField('departure_city')).toBe('Which city will you be departing from?');
    expect(getQuestionForField('travel_date')).toBe('What date are you planning to travel?');
  });
});
