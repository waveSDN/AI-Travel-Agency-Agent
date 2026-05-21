const registry = require('./registry');
const { searchFlights } = require('./searchFlights');
const { searchHotels } = require('./searchHotels');
const { saveLead } = require('./saveLead');
const { notifyStaff } = require('./notifyStaff');
const { scheduleFollowUps } = require('./followUp');

/**
 * Register all tools into the central registry on startup.
 * This is the SINGLE place where tools are wired in.
 */
function registerAll() {
  registry.register({
    name: 'searchFlights',
    description: 'Search for flights between two cities on a given date.',
    parameters: {
      type: 'object',
      properties: {
        departure: { type: 'string', description: 'Departure city name' },
        destination: { type: 'string', description: 'Destination city name' },
        date: { type: 'string', description: 'Travel date in YYYY-MM-DD format' },
        returnDate: { type: 'string', description: 'Return date in YYYY-MM-DD (optional)' },
        travelers: { type: 'integer', description: 'Number of travelers', default: 1 },
        travelClass: { type: 'string', enum: ['economy', 'business', 'first'], default: 'economy' },
      },
      required: ['departure', 'destination', 'date'],
    },
    handler: (args) => searchFlights(args),
  });

  registry.register({
    name: 'searchHotels',
    description: 'Search for hotels in a city for a given check-in / check-out range.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name where hotels are searched' },
        checkIn: { type: 'string', description: 'Check-in date YYYY-MM-DD' },
        checkOut: { type: 'string', description: 'Check-out date YYYY-MM-DD' },
        guests: { type: 'integer', description: 'Number of guests', default: 1 },
        preference: { type: 'string', description: 'Star preference, e.g. 4-star' },
      },
      required: ['city', 'checkIn'],
    },
    handler: (args) => searchHotels(args),
  });

  registry.register({
    name: 'saveLead',
    description: 'Persist a customer lead with extracted travel entities and compute lead score.',
    parameters: {
      type: 'object',
      properties: {
        customer: { type: 'object', description: 'Customer record from DB' },
        entities: { type: 'object', description: 'Extracted travel entities' },
      },
      required: ['customer', 'entities'],
    },
    handler: (args) => saveLead(args),
  });

  registry.register({
    name: 'notifyStaff',
    description: 'Send an escalation alert to staff via WhatsApp.',
    parameters: {
      type: 'object',
      properties: {
        customer: { type: 'object' },
        reason: { type: 'string', description: 'Why this lead is being escalated' },
        entities: { type: 'object' },
        leadScore: { type: 'integer' },
      },
      required: ['customer', 'reason'],
    },
    handler: (args) => notifyStaff(args),
  });

  registry.register({
    name: 'scheduleFollowUps',
    description: 'Schedule automatic follow-up messages at day 1, 3, and 7.',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: 'UUID of the customer' },
      },
      required: ['customerId'],
    },
    handler: ({ customerId }) => scheduleFollowUps(customerId),
  });
}

module.exports = { registry, registerAll };
