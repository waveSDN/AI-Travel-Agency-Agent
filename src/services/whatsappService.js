const https = require('https');
const { whatsapp: config } = require('../config/env');
const logger = require('../utils/logger');

function buildPayload(to, text) {
  return JSON.stringify({
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  });
}

async function sendMessage(to, text) {
  if (!config.accessToken || !config.phoneNumberId) {
    logger.warn('WhatsApp credentials not configured — skipping send', { to });
    return { skipped: true };
  }

  const payload = buildPayload(to, text);
  const path = `/v20.0/${config.phoneNumberId}/messages`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          logger.info(`WhatsApp message sent to ${to}`);
          resolve(JSON.parse(body));
        } else {
          logger.error('WhatsApp API error', { status: res.statusCode, body });
          reject(new Error(`WhatsApp API returned ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { sendMessage };
