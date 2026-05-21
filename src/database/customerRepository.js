const { getClient } = require('./supabase');
const { DatabaseError } = require('../utils/errors');
const logger = require('../utils/logger');

async function findOrCreateByPhone(phone) {
  const db = getClient();

  const { data: existing, error: findErr } = await db
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (findErr) throw new DatabaseError(`findOrCreateByPhone: ${findErr.message}`);

  if (existing) {
    await db.from('customers').update({ last_message: new Date().toISOString() }).eq('id', existing.id);
    return existing;
  }

  const { data: created, error: createErr } = await db
    .from('customers')
    .insert({ phone, last_message: new Date().toISOString() })
    .select()
    .single();

  if (createErr) throw new DatabaseError(`createCustomer: ${createErr.message}`);

  logger.info(`New customer created: ${phone}`);
  return created;
}

async function updateCustomer(id, fields) {
  const db = getClient();
  const { data, error } = await db.from('customers').update(fields).eq('id', id).select().single();
  if (error) throw new DatabaseError(`updateCustomer: ${error.message}`);
  return data;
}

async function findById(id) {
  const db = getClient();
  const { data, error } = await db.from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw new DatabaseError(`findById: ${error.message}`);
  return data;
}

async function getCustomersForFollowUp(cutoffDate) {
  const db = getClient();
  const { data, error } = await db
    .from('customers')
    .select('*')
    .lt('last_message', cutoffDate)
    .eq('escalated', false);
  if (error) throw new DatabaseError(`getCustomersForFollowUp: ${error.message}`);
  return data || [];
}

module.exports = {
  findOrCreateByPhone,
  updateCustomer,
  findById,
  getCustomersForFollowUp,
};
