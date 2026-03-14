const express = require('express');
const router = express.Router();
const { getDatabase } = require('../utils/database');

// GET /api/shipments - all shipments (admin)
router.get('/shipments', async (req, res) => {
  try {
    const db = getDatabase();
    const shipments = await db.all('SELECT * FROM shipments');
    const predictions = await db.all('SELECT * FROM predictions');

    const enriched = shipments.map(s => {
      const pred = predictions.find(p => p.shipment_id === s.shipment_id) || {};
      return { ...s, ...pred };
    });

    const total = shipments.length;
    const delayed = shipments.filter(s => s.status === 'Delayed').length;
    const onTime = shipments.filter(s => s.status === 'On Time').length;
    const inTransit = shipments.filter(s => s.status === 'In Transit').length;

    res.json({
      success: true,
      stats: { total, delayed, onTime, inTransit },
      shipments: enriched
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shipment/:id - single shipment with risk data
router.get('/shipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const shipment = await db.get(
      'SELECT * FROM shipments WHERE shipment_id = ?',
      [id.toUpperCase()]
    );
    
    if (!shipment) {
      return res.status(404).json({ success: false, message: `Shipment ${id} not found` });
    }

    const prediction = await db.get(
      'SELECT * FROM predictions WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1',
      [id.toUpperCase()]
    ) || {
      risk_score: 0,
      delay_probability: 0,
      reason: 'No data',
      recommended_action: 'N/A',
      alternate_route: 'N/A',
      time_saved_hours: 0,
      confidence: 0
    };

    res.json({
      success: true,
      shipment: { ...shipment, ...prediction }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/shipments - create new shipment (admin) + auto-generate risk prediction
router.post('/shipments', async (req, res) => {
  try {
    const db = getDatabase();
    const {
      order_id, origin, destination, carrier, distance_km,
      eta_hours, current_lat, current_lng, customer_id, customer_phone
    } = req.body;

    const { generateRiskReason } = require('../utils/weatherService');

    const counts = await db.all('SELECT COUNT(*) as count FROM shipments');
    const newId = `SHP${1000 + (counts?.[0]?.count || 0) + 1}`;
    
    // Insert shipment
    await db.run(
      `INSERT INTO shipments 
       (shipment_id, order_id, origin, destination, carrier, status, distance_km, 
        eta_hours, current_lat, current_lng, customer_id, customer_phone)
       VALUES (?, ?, ?, ?, ?, 'In Transit', ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        order_id || `ORD${Date.now()}`,
        origin,
        destination,
        carrier,
        parseFloat(distance_km) || 0,
        parseFloat(eta_hours) || 0,
        parseFloat(current_lat) || 0,
        parseFloat(current_lng) || 0,
        customer_id || 1,
        customer_phone || '9876543210'
      ]
    );

    // Generate dynamic risk prediction based on real weather & traffic
    const riskData = await generateRiskReason(origin, destination, distance_km, eta_hours, carrier);
    
    // Calculate delay probability based on risk score
    const delayProbability = Math.min(riskData.riskScore / 100, 1);
    const recommendedAction = riskData.riskScore >= 70 
      ? 'Expedite delivery / Customer notification recommended'
      : riskData.riskScore >= 40 
      ? 'Monitor closely'
      : 'Standard monitoring';

    // Store prediction
    await db.run(
      `INSERT INTO predictions 
       (shipment_id, risk_score, delay_probability, reason, recommended_action, confidence, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        riskData.riskScore,
        delayProbability,
        riskData.reasons,
        recommendedAction,
        Math.random() * 0.2 + 0.8, // 80-100% confidence
        new Date().toISOString()
      ]
    );

    res.json({
      success: true,
      shipment: { shipment_id: newId },
      prediction: {
        risk_score: riskData.riskScore,
        reason: riskData.reasons,
        delay_probability: delayProbability
      },
      message: `Shipment ${newId} created with real-time risk assessment`
    });
  } catch (error) {
    console.error('Shipment creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/shipments/:id/location - update truck location
router.put('/shipments/:id/location', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const db = getDatabase();

    await db.run(
      'UPDATE shipments SET current_lat = ?, current_lng = ? WHERE shipment_id = ?',
      [parseFloat(lat), parseFloat(lng), id.toUpperCase()]
    );

    res.json({ success: true, message: 'Location updated', lat, lng });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/shipments/user/:customerId - user's shipments
router.get('/shipments/user/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const db = getDatabase();
    
    const userShipments = await db.all(
      'SELECT * FROM shipments WHERE customer_id = ?',
      [customerId]
    );

    const enriched = [];
    for (const s of userShipments) {
      const pred = await db.get(
        'SELECT * FROM predictions WHERE shipment_id = ? ORDER BY created_at DESC LIMIT 1',
        [s.shipment_id]
      );
      enriched.push({ ...s, ...pred });
    }

    res.json({ success: true, shipments: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/route-info - calculate distance and ETA
router.get('/route-info', async (req, res) => {
  try {
    const { origin, destination, carrier } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ 
        success: false, 
        message: 'Origin and destination are required' 
      });
    }

    const { getRouteInfo } = require('../utils/routeDatabase');
    const routeInfo = getRouteInfo(origin, destination, carrier || 'DHL');
    
    res.json(routeInfo);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
