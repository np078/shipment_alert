const twilio = require('twilio');
const { getDatabase } = require('./database');

// Twilio credentials (free sandbox)
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP;
const BUSINESS_PHONE = process.env.BUSINESS_PHONE;

const client = twilio(TWILIO_SID, TWILIO_TOKEN);

// Track recent alerts to prevent duplicates (30 second window)
const recentAlerts = new Map();
const ALERT_COOLDOWN_MS = 30000; // 30 seconds

/**
 * Send WhatsApp Alert (ONLY Channel)
 */
async function sendAlertNotification(shipment, prediction) {
  const {
    shipment_id,
    customer_phone,
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

  const alertData = {
    shipmentId: shipment_id,
    phone: customer_phone,
    reason,
    riskScore: risk_score,
    newEta: Math.ceil(eta_hours + (time_saved_hours || 3)),
    alternateRoute: alternate_route
  };

  // Send WhatsApp Alert
  let whatsappSent = false;

  try {
    whatsappSent = await sendWhatsAppAlert(alertData);
  } catch (err) {
    console.error('❌ WhatsApp alert failed:', err.message);
  }

  // 💾 Store alert in database
  if (whatsappSent) {
    try {
      const db = getDatabase();
      await db.run(
        `INSERT INTO alerts 
         (shipment_id, customer_phone, channel, status, risk_score, reason, message, delivery_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipment_id,
          customer_phone,
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

  return {
    success: whatsappSent,
    channel: 'whatsapp',
    message: whatsappSent ? 'Alert sent via WhatsApp' : 'Failed to send WhatsApp alert'
  };
}

/**
 * Send WhatsApp Message (FREE via Twilio Sandbox)
 */
async function sendWhatsAppAlert(alertData) {
  try {
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
    await client.messages.create({
      from: TWILIO_WHATSAPP,
      to: `whatsapp:+91${alertData.phone}`,
      body: message
    });

    console.log(`✅ WhatsApp sent to +91${alertData.phone}`);
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
  const alertData = {
    shipmentId,
    phone,
    reason,
    riskScore: 'Manual Alert',
    newEta,
    alternateRoute: 'Contact admin for details'
  };

  try {
    const whatsappSent = await sendWhatsAppAlert(alertData);
    return {
      success: whatsappSent,
      channel: 'whatsapp',
      message: whatsappSent ? 'Manual alert sent via WhatsApp' : 'Failed to send WhatsApp alert'
    };
  } catch (err) {
    console.error('❌ Manual alert failed:', err.message);
    return {
      success: false,
      channel: 'whatsapp',
      message: 'Failed to send WhatsApp alert: ' + err.message
    };
  }
}

module.exports = {
  sendAlertNotification,
  sendManualAlert,
  sendWhatsAppAlert
};
