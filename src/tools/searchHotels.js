const logger = require('../utils/logger');

/**
 * Hotel search tool — currently returns mock data.
 * Replace with Booking.com / Expedia / Hotelbeds API.
 */
async function searchHotels({ city, checkIn, checkOut, guests, preference }) {
  logger.info('searchHotels called', { city, checkIn });

  const stars = preference?.includes('5') ? 5 : preference?.includes('4') ? 4 : 3;

  return {
    source: 'mock',
    results: [
      {
        name: `Grand Hyatt ${city}`,
        stars,
        pricePerNight: stars === 5 ? 280 : stars === 4 ? 160 : 90,
        currency: 'USD',
        rating: 4.7,
        amenities: ['Pool', 'Gym', 'Free WiFi', 'Airport Shuttle'],
        checkIn,
        checkOut,
      },
      {
        name: `Marriott ${city}`,
        stars,
        pricePerNight: stars === 5 ? 320 : stars === 4 ? 180 : 100,
        currency: 'USD',
        rating: 4.5,
        amenities: ['Pool', 'Spa', 'Free WiFi', 'Restaurant'],
        checkIn,
        checkOut,
      },
    ],
    searchedAt: new Date().toISOString(),
  };
}

module.exports = { searchHotels };
