const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const { sendManualAlert } = require('../utils/notificationService');

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE || '+15005550006';

const client = twilio(TWILIO_SID, TWILIO_TOKEN);

// POST /api/sms/alert - Send delay alert (now multi-channel)
router.post('/alert', async (req, res) => {
  try {
    const { phone, shipmentId, reason, newEta, trackingUrl } = req.body;

    if (!phone || !shipmentId) {
      return res.status(400).json({ success: false, message: 'Phone and shipmentId required' });
    }

    // Use WhatsApp notification system
    const result = await sendManualAlert(phone, shipmentId, reason, newEta);

    res.json({
      success: result.success,
      channel: result.channel,
      message: result.message
    });

  } catch (error) {
    console.error('Alert route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
