const { createClient } = require('@supabase/supabase-js');
const { supabase: config } = require('../config/env');
const logger = require('../utils/logger');

let client = null;

function getClient() {
  if (!client) {
    client = createClient(config.url, config.serviceKey, {
      auth: { persistSession: false },
    });
    logger.info('Supabase client initialized');
  }
  return client;
}

module.exports = { getClient };
