const logger = require('../utils/logger');

/**
 * Flight search tool — currently returns mock data.
 * Replace the body with a real GDS / API call (Amadeus, Sabre, etc.)
 */
async function searchFlights({ departure, destination, date, returnDate, travelers, travelClass }) {
  logger.info('searchFlights called', { departure, destination, date });

  // TODO: Integrate with Amadeus / Sabre / Sky Scanner API
  return {
    source: 'mock',
    results: [
      {
        airline: 'SaudiAir',
        flightNumber: 'SV101',
        departure,
        destination,
        departureTime: `${date}T08:00:00`,
        arrivalTime: `${date}T10:30:00`,
        duration: '2h 30m',
        class: travelClass || 'economy',
        price: 350,
        currency: 'USD',
        seatsAvailable: 12,
      },
      {
        airline: 'FlyNas',
        flightNumber: 'XY204',
        departure,
        destination,
        departureTime: `${date}T14:00:00`,
        arrivalTime: `${date}T16:45:00`,
        duration: '2h 45m',
        class: travelClass || 'economy',
        price: 290,
        currency: 'USD',
        seatsAvailable: 5,
      },
    ],
    searchedAt: new Date().toISOString(),
  };
}

module.exports = { searchFlights };
