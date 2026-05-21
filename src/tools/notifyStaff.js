const { staff } = require('../config/env');
const logger = require('../utils/logger');
const whatsappService = require('../services/whatsappService');

async function notifyStaff({ customer, reason, entities, leadScore }) {
  const summary = `
🔔 *Lead Escalation Alert*

👤 Customer: ${customer.name || customer.phone}
📱 Phone: ${customer.phone}
⭐ Lead Score: ${leadScore || 'N/A'}
📋 Reason: ${reason}

✈️ *Travel Request:*
• From: ${entities?.departure_city || 'Unknown'}
• To: ${entities?.destination_city || 'Unknown'}
• Date: ${entities?.travel_date || 'Unknown'}
• Travelers: ${entities?.traveler_count || 'Unknown'}
• Budget: ${entities?.budget ? `$${entities.budget}` : 'Not specified'}
• Class: ${entities?.class || 'Not specified'}

Please follow up with this customer.
  `.trim();

  logger.info(`Notifying staff about customer ${customer.phone} — reason: ${reason}`);

  if (staff.phone) {
    try {
      await whatsappService.sendMessage(staff.phone, summary);
    } catch (err) {
      logger.warn(`Staff WhatsApp notification failed: ${err.message}`);
    }
  }

  return { notified: true, summary };
}

module.exports = { notifyStaff };
