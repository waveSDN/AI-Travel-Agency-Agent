const { getClient } = require('./supabase');
const { DatabaseError } = require('../utils/errors');

async function saveMessage({ customerId, message, role, metadata = {} }) {
  const db = getClient();
  const { data, error } = await db
    .from('conversations')
    .insert({ customer_id: customerId, message, role, metadata })
    .select()
    .single();
  if (error) throw new DatabaseError(`saveMessage: ${error.message}`);
  return data;
}

async function getRecentHistory(customerId, limit = 20) {
  const db = getClient();
  const { data, error } = await db
    .from('conversations')
    .select('role, message, timestamp')
    .eq('customer_id', customerId)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw new DatabaseError(`getRecentHistory: ${error.message}`);
  return (data || []).reverse();
}

async function getFullHistory(customerId) {
  const db = getClient();
  const { data, error } = await db
    .from('conversations')
    .select('*')
    .eq('customer_id', customerId)
    .order('timestamp', { ascending: true });
  if (error) throw new DatabaseError(`getFullHistory: ${error.message}`);
  return data || [];
}

module.exports = { saveMessage, getRecentHistory, getFullHistory };
