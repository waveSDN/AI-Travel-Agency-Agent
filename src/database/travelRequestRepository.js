const { getClient } = require('./supabase');
const { DatabaseError } = require('../utils/errors');

async function upsertTravelRequest(customerId, entities) {
  const db = getClient();

  const { data: existing } = await db
    .from('travel_requests')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .maybeSingle();

  const payload = {
    customer_id: customerId,
    departure_city: entities.departure_city || null,
    destination_city: entities.destination_city || null,
    travel_date: entities.travel_date || null,
    return_date: entities.return_date || null,
    traveler_count: entities.traveler_count ? parseInt(entities.traveler_count, 10) : 1,
    budget: entities.budget ? parseFloat(entities.budget) : null,
    hotel_preference: entities.hotel_preference || null,
    travel_class: entities.class || null,
    intent: entities.intent || null,
    raw_entities: entities,
    status: 'pending',
  };

  if (existing) {
    const { data, error } = await db
      .from('travel_requests')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new DatabaseError(`updateTravelRequest: ${error.message}`);
    return data;
  }

  const { data, error } = await db.from('travel_requests').insert(payload).select().single();
  if (error) throw new DatabaseError(`createTravelRequest: ${error.message}`);
  return data;
}

async function getActiveRequest(customerId) {
  const db = getClient();
  const { data, error } = await db
    .from('travel_requests')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .maybeSingle();
  if (error) throw new DatabaseError(`getActiveRequest: ${error.message}`);
  return data;
}

async function updateStatus(requestId, status) {
  const db = getClient();
  const { data, error } = await db
    .from('travel_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw new DatabaseError(`updateStatus: ${error.message}`);
  return data;
}

module.exports = { upsertTravelRequest, getActiveRequest, updateStatus };
