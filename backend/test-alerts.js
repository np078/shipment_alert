#!/usr/bin/env node

/**
 * TEST SCRIPT - Auto-Alert System
 * Run: node test-alerts.js
 * 
 * This simulates checking high-risk shipments and triggering alerts
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000/api';

async function testAlerts() {
  console.log('\n🧪 TESTING AUTO-ALERT SYSTEM');
  console.log('='.repeat(70));

  // High-risk shipments from dataset
  const highRiskShipments = ['SHP1003', 'SHP1008', 'SHP1012', 'SHP1013'];

  for (const shipmentId of highRiskShipments) {
    console.log(`\n📦 Testing: ${shipmentId}`);
    console.log('-'.repeat(70));

    try {
      // This will trigger the AI prediction
      // If risk > 70%, auto-alert will be sent
      const response = await fetch(`${API_URL}/ai/predict/${shipmentId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        const { risk_score, reason } = data.prediction;
        console.log(`✅ Risk Score: ${risk_score}%`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Status: ${risk_score >= 70 ? '🔴 AUTO-ALERT TRIGGERED' : '🟢 No alert needed'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`);
    }

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ TEST COMPLETE - Check backend console for alert logs');
  console.log('='.repeat(70) + '\n');
}

testAlerts().catch(console.error);
