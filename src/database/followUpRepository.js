const { getClient } = require('./supabase');
const { DatabaseError } = require('../utils/errors');

async function scheduleFollowUp({ customerId, scheduledAt, message }) {
  const db = getClient();
  const { data, error } = await db
    .from('follow_ups')
    .insert({ customer_id: customerId, scheduled_at: scheduledAt, message, status: 'pending' })
    .select()
    .single();
  if (error) throw new DatabaseError(`scheduleFollowUp: ${error.message}`);
  return data;
}

async function getPendingFollowUps() {
  const db = getClient();
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('follow_ups')
    .select('*, customers(phone, name)')
    .eq('status', 'pending')
    .lte('scheduled_at', now);
  if (error) throw new DatabaseError(`getPendingFollowUps: ${error.message}`);
  return data || [];
}

async function markSent(followUpId) {
  const db = getClient();
  const { error } = await db
    .from('follow_ups')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', followUpId);
  if (error) throw new DatabaseError(`markSent: ${error.message}`);
}

async function cancelFollowUpsForCustomer(customerId) {
  const db = getClient();
  const { error } = await db
    .from('follow_ups')
    .update({ status: 'cancelled' })
    .eq('customer_id', customerId)
    .eq('status', 'pending');
  if (error) throw new DatabaseError(`cancelFollowUps: ${error.message}`);
}

module.exports = {
  scheduleFollowUp,
  getPendingFollowUps,
  markSent,
  cancelFollowUpsForCustomer,
};
