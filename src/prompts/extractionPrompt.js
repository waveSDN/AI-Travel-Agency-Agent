function buildExtractionPrompt(message, conversationHistory = []) {
  const historyText = conversationHistory
    .slice(-10)
    .map((m) => `${m.role.toUpperCase()}: ${m.message}`)
    .join('\n');

  return `You are a travel data extraction engine. Extract structured travel information from the conversation below.

CONVERSATION HISTORY:
${historyText || '(none)'}

LATEST MESSAGE:
USER: ${message}

Extract all travel-related entities and return ONLY a valid JSON object with these exact keys.
Use null for any field that is not mentioned or cannot be inferred.

{
  "intent": "<flight_booking|hotel_booking|visa_inquiry|travel_package|price_question|general_question|complaint|other>",
  "departure_city": "<city name or null>",
  "destination_city": "<city name or null>",
  "travel_date": "<YYYY-MM-DD or null>",
  "return_date": "<YYYY-MM-DD or null>",
  "traveler_count": "<number as string or null>",
  "budget": "<number as string, no currency symbol, or null>",
  "hotel_preference": "<3-star|4-star|5-star|any|null>",
  "class": "<economy|business|first|null>",
  "is_round_trip": "<true|false|null>",
  "urgency": "<high|medium|low|null>"
}

RULES:
- Return ONLY the JSON object, no markdown, no explanation
- Infer intent from context (e.g. "ticket to Jeddah" = flight_booking)
- Infer urgency: "urgent", "ASAP", "tomorrow" = high; "next week" = medium; "next month" = low
- If they mention a number like "2 tickets" or "family of 4", extract traveler_count
- Normalize city names to English (e.g. جدة → Jeddah, الخرطوم → Khartoum)
- For relative dates like "next Friday", resolve based on today's date: ${new Date().toISOString().split('T')[0]}`;
}

module.exports = { buildExtractionPrompt };
