const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { getDatabase } = require('../utils/database');
const { sendAlertNotification } = require('../utils/notificationService');
const { generateRiskReason } = require('../utils/weatherService');

const AI_SERVICE_URL = 'http://localhost:5001';

// GET /api/ai/predict/:shipmentId
router.get('/predict/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const db = getDatabase();
    
    // Get shipment from database
    const shipment = await db.get(
      'SELECT * FROM shipments WHERE shipment_id = ?',
      [shipmentId.toUpperCase()]
    );

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    let prediction;
    let fromAI = false;

    // Try calling AI model for REAL prediction
    try {
      const aiPayload = {
        shipment_id: shipment.shipment_id,
        origin: shipment.origin,
        destination: shipment.destination,
        distance_km: parseFloat(shipment.distance_km),
        eta_hours: parseFloat(shipment.eta_hours),
        carrier_reliability: 80,
        historical_delay_rate: 0.15
      };

      const aiResponse = await fetch(`${AI_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiPayload),
        timeout: 8000
      });
      
      if (aiResponse.ok) {
        prediction = await aiResponse.json();
        fromAI = true;
        console.log(`✅ AI Prediction for ${shipmentId}: ${prediction.risk_score}%`);
      } else {
        throw new Error('AI response not ok');
      }
    } catch (aiError) {
      console.log(`⚠️  AI service unavailable for ${shipmentId}, using weather-based prediction`);
      
      // Generate real-time prediction based on weather and traffic
      const weatherPrediction = await generateRiskReason(
        shipment.origin,
        shipment.destination,
        parseFloat(shipment.distance_km),
        parseFloat(shipment.eta_hours),
        shipment.carrier
      );

      // Fallback to database predictions if available
      const existingPred = await db.get(
        'SELECT * FROM predictions WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1',
        [shipmentId.toUpperCase()]
      );
      
      if (existingPred && existingPred.reason && existingPred.reason !== 'No prediction available') {
        prediction = {
          shipment_id: shipmentId,
          risk_score: parseFloat(existingPred.risk_score) || weatherPrediction.riskScore,
          delay_probability: parseFloat(existingPred.delay_probability) || 0,
          reason: existingPred.reason,
          recommended_action: existingPred.recommended_action || 'N/A',
          alternate_route: existingPred.alternate_route || 'N/A',
          time_saved_hours: parseFloat(existingPred.time_saved_hours) || 0,
          confidence: parseFloat(existingPred.confidence) || 85,
          source: 'database'
        };
      } else {
        // Use weather-based prediction
        prediction = {
          shipment_id: shipmentId,
          risk_score: weatherPrediction.riskScore,
          delay_probability: weatherPrediction.riskScore / 100,
          reason: weatherPrediction.reasons,
          recommended_action: weatherPrediction.riskScore >= 70 
            ? 'Expedite delivery / Customer notification recommended'
            : weatherPrediction.riskScore >= 40 
            ? 'Monitor closely'
            : 'Standard monitoring',
          alternate_route: 'N/A',
          time_saved_hours: 0,
          confidence: 0.85,
          source: 'weather-service'
        };
      }
    }

    // Store prediction in database (if from AI or weather service, update; always track)
    if (fromAI || prediction.source === 'weather-service') {
      // Check if prediction already exists for this shipment
      const existingPredCheck = await db.get(
        'SELECT * FROM predictions WHERE shipment_id = ?',
        [shipment.shipment_id]
      );

      if (existingPredCheck) {
        // Update existing prediction
        await db.run(
          `UPDATE predictions 
           SET risk_score = ?, delay_probability = ?, reason = ?, recommended_action = ?, confidence = ?, model_version = ?
           WHERE shipment_id = ?`,
          [
            parseFloat(prediction.risk_score) || 0,
            parseFloat(prediction.delay_probability) || 0,
            prediction.reason || 'Processing...',
            prediction.recommended_action || 'N/A',
            parseFloat(prediction.confidence) || 85,
            fromAI ? '1.0' : 'weather-0.1',
            shipment.shipment_id
          ]
        );
      } else {
        // Insert new prediction
        await db.run(
          `INSERT INTO predictions 
           (shipment_id, risk_score, delay_probability, reason, recommended_action, 
            alternate_route, time_saved_hours, confidence, model_version, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shipment.shipment_id,
            parseFloat(prediction.risk_score) || 0,
            parseFloat(prediction.delay_probability) || 0,
            prediction.reason || 'Processing...',
            prediction.recommended_action || 'N/A',
            prediction.alternate_route || 'N/A',
            parseFloat(prediction.time_saved_hours) || 0,
            parseFloat(prediction.confidence) || 85,
            fromAI ? '1.0' : 'weather-0.1',
            new Date().toISOString()
          ]
        );
      }
    }

    // 🚀 AUTO-TRIGGER ALERT if risk is high
    const riskScore = parseFloat(prediction.risk_score) || 0;
    if (riskScore >= 70 && shipment) {
      try {
        console.log(`\n⚡ AUTO-ALERT: High risk ${riskScore}% for ${shipmentId}`);
        await sendAlertNotification(shipment, prediction);
      } catch (alertErr) {
        console.error('⚠️  Alert notification failed:', alertErr.message);
      }
    }

    res.json({ success: true, prediction, fromAI });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
