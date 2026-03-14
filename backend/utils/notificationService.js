const twilio = require('twilio');
const { getDatabase } = require('./database');

function cleanEnvValue(value) {
  if (typeof value !== 'string') return value;
  // Remove wrapping quotes and accidental separators copied from docs.
  return value.trim().replace(/^[:=\s]+/, '').replace(/^['\"]|['\"]$/g, '');
}

// Twilio credentials (free sandbox)
const TWILIO_SID = cleanEnvValue(process.env.TWILIO_SID);
const TWILIO_TOKEN = cleanEnvValue(process.env.TWILIO_TOKEN || process.env.TWILIO_AUTH_TOKEN);
const TWILIO_WHATSAPP = cleanEnvValue(process.env.TWILIO_WHATSAPP).replace(/\s+/g, '');
const BUSINESS_PHONE = process.env.BUSINESS_PHONE;

const client = TWILIO_SID && TWILIO_TOKEN ? twilio(TWILIO_SID, TWILIO_TOKEN) : null;

// Track recent alerts to prevent duplicates (30 second window)
const recentAlerts = new Map();
const ALERT_COOLDOWN_MS = 30000; // 30 seconds

function normalizeRecipientPhone(phone) {
  if (!phone) return null;
  const digitsOnly = String(phone).replace(/\D/g, '');
  if (!digitsOnly) return null;
  if (digitsOnly.length === 10) return digitsOnly;
  if (digitsOnly.length > 10) return digitsOnly;
  return digitsOnly;
}

function formatWhatsAppTo(phone) {
  const normalized = normalizeRecipientPhone(phone);
  if (!normalized) return null;
  if (normalized.length === 10) return `whatsapp:+91${normalized}`;
  return `whatsapp:+${normalized}`;
}

function getAlertRecipients(shipment) {
  const candidates = [shipment.customer_phone, shipment.driver_phone];
  const unique = new Set();
  candidates.forEach((phone) => {
    const normalized = normalizeRecipientPhone(phone);
    if (normalized) unique.add(normalized);
  });
  return Array.from(unique);
}

/**
 * Send WhatsApp Alert (ONLY Channel)
 */
async function sendAlertNotification(shipment, prediction) {
  const {
    shipment_id,
    origin,
    destination,
    distance_km,
    eta_hours
  } = shipment;

  const { risk_score, reason, alternate_route, time_saved_hours } = prediction;

  // Only send if risk is high
  if (risk_score < 70) {
    console.log(`ℹ️  Risk ${risk_score}% below threshold - no alert sent`);
    return { success: false, reason: 'Low risk' };
  }

  const recipients = getAlertRecipients(shipment);
  if (recipients.length === 0) {
    console.log(`⚠️  No valid recipient phones configured for ${shipment_id}`);
    return { success: false, reason: 'No recipients configured' };
  }

  const alertData = {
    shipmentId: shipment_id,
    reason,
    riskScore: risk_score,
    newEta: Math.ceil(eta_hours + (time_saved_hours || 3)),
    alternateRoute: alternate_route
  };

  let sentCount = 0;
  const db = getDatabase();
  for (const recipientPhone of recipients) {
    let whatsappSent = false;
    try {
      whatsappSent = await sendWhatsAppAlert({ ...alertData, phone: recipientPhone });
    } catch (err) {
      console.error('❌ WhatsApp alert failed:', err.message);
    }

    if (whatsappSent) {
      sentCount += 1;
      try {
        await db.run(
          `INSERT INTO alerts 
           (shipment_id, customer_phone, channel, status, risk_score, reason, message, delivery_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shipment_id,
            recipientPhone,
            'whatsapp',
            'sent',
            risk_score,
            reason,
            `High delay risk (${risk_score}%) - ${reason}. New ETA: ${alertData.newEta}h`,
            'delivered'
          ]
        );
      } catch (dbErr) {
        console.error('⚠️  Failed to log alert to database:', dbErr.message);
      }
    }
  }

  return {
    success: sentCount > 0,
    channel: 'whatsapp',
    sentCount,
    message: sentCount > 0
      ? `Alert sent via WhatsApp to ${sentCount} recipient(s)`
      : 'Failed to send WhatsApp alert'
  };
}

/**
 * Send WhatsApp Message (FREE via Twilio Sandbox)
 */
async function sendWhatsAppAlert(alertData) {
  try {
    if (!client || !TWILIO_WHATSAPP) {
      throw new Error('Twilio is not configured. Check TWILIO_SID, TWILIO_TOKEN/TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP in backend/.env');
    }

    const message = `⚠️ *SHIPMENT DELAY ALERT*

*Shipment ID:* ${alertData.shipmentId}
*Risk Level:* 🔴 HIGH (${alertData.riskScore}%)

*Issue:* ${alertData.reason}

*New ETA:* +${alertData.newEta} hours delay expected

*Alternative Route:* ${alertData.alternateRoute}
*Est. Time Saved:* ⏱️ Hours

Track live: http://localhost:5173/shipment/${alertData.shipmentId}

_ShipAlert - AI Early Warning System_`;

    // Send via Twilio WhatsApp Sandbox
    const to = formatWhatsAppTo(alertData.phone);
    if (!to) {
      throw new Error('Invalid recipient phone number');
    }

    await client.messages.create({
      from: TWILIO_WHATSAPP,
      to,
      body: message
    });

    console.log(`✅ WhatsApp sent to ${to}`);
    return true;
  } catch (err) {
    console.log(`⚠️  WhatsApp send failed: ${err.message}`);
    return false;
  }
}



/**
 * Manual Alert (for admin button)
 */
async function sendManualAlert(phone, shipmentId, reason, newEta) {
  const recipients = Array.isArray(phone) ? phone : [phone];
  let sentCount = 0;

  for (const recipientPhone of recipients) {
    const alertData = {
      shipmentId,
      phone: recipientPhone,
      reason,
      riskScore: 'Manual Alert',
      newEta,
      alternateRoute: 'Contact admin for details'
    };

    try {
      const whatsappSent = await sendWhatsAppAlert(alertData);
      if (whatsappSent) sentCount += 1;
    } catch (err) {
      console.error('❌ Manual alert failed:', err.message);
    }
  }

  return {
    success: sentCount > 0,
    channel: 'whatsapp',
    sentCount,
    message: sentCount > 0
      ? `Manual alert sent via WhatsApp to ${sentCount} recipient(s)`
      : 'Failed to send WhatsApp alert'
  };
}

module.exports = {
  sendAlertNotification,
  sendManualAlert,
  sendWhatsAppAlert
};
