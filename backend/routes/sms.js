const express = require('express');
const router = express.Router();
const { sendManualAlert } = require('../utils/notificationService');

// POST /api/sms/alert - Send delay alert (now multi-channel)
router.post('/alert', async (req, res) => {
  try {
    const { phone, phones, shipmentId, reason, newEta, trackingUrl } = req.body;
    const recipients = Array.from(new Set([
      ...(Array.isArray(phones) ? phones : []),
      phone
    ].filter(Boolean).map((p) => String(p).trim())));

    if (recipients.length === 0 || !shipmentId) {
      return res.status(400).json({ success: false, message: 'At least one phone and shipmentId required' });
    }

    // Use WhatsApp notification system
    const result = await sendManualAlert(recipients, shipmentId, reason, newEta);

    res.json({
      success: result.success,
      channel: result.channel,
      message: result.message,
      requestedRecipients: recipients.length,
      sentRecipients: result.sentCount || 0
    });

  } catch (error) {
    console.error('Alert route error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
