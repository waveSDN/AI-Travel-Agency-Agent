const express = require('express');
const { getClient } = require('../database/supabase');
const { server } = require('../config/env');

const router = express.Router();

router.get('/', async (req, res) => {
  const checks = { status: 'ok', uptime: process.uptime(), env: server.env };

  try {
    const db = getClient();
    await db.from('customers').select('count').limit(1);
    checks.database = 'connected';
  } catch {
    checks.database = 'error';
    checks.status = 'degraded';
  }

  res.status(checks.status === 'ok' ? 200 : 503).json(checks);
});

module.exports = router;
