const FIELD_QUESTIONS = {
  destination_city: "Where would you like to travel to?",
  departure_city: "Which city will you be departing from?",
  travel_date: "What date are you planning to travel?",
  return_date: "When are you planning to return?",
  traveler_count: "How many travelers will be going?",
  class: "What class would you prefer — economy, business, or first class?",
  hotel_preference: "Do you have a hotel preference? (3-star, 4-star, or 5-star)",
  budget: "Do you have a budget in mind for this trip?",
};

const PRIORITY_ORDER = [
  'destination_city',
  'departure_city',
  'travel_date',
  'traveler_count',
  'return_date',
  'class',
  'hotel_preference',
  'budget',
];

function getNextMissingField(entities) {
  for (const field of PRIORITY_ORDER) {
    if (!entities[field]) return field;
  }
  return null;
}

function getQuestionForField(field) {
  return FIELD_QUESTIONS[field] || null;
}

function getMissingFields(entities) {
  return PRIORITY_ORDER.filter(
    (field) => !entities[field] && field !== 'return_date' && field !== 'hotel_preference' && field !== 'budget',
  );
}

function isRequestComplete(entities) {
  const required = ['destination_city', 'departure_city', 'travel_date', 'traveler_count'];
  return required.every((field) => Boolean(entities[field]));
}

module.exports = {
  getNextMissingField,
  getQuestionForField,
  getMissingFields,
  isRequestComplete,
  PRIORITY_ORDER,
};
