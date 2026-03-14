#!/usr/bin/env node

/**
 * Migration Script: CSV → SQLite
 * Run: node migrate.js
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./utils/database');
const { readCSV } = require('./utils/csvHelper');

async function migrate() {
  const db = getDatabase();

  try {
    await db.initialize();
    console.log('\n🔄 Starting Data Migration...\n');

    // 1. Migrate Users
    console.log('📝 Migrating users...');
    const users = readCSV('users.csv');
    for (const user of users) {
      await db.run(
        `INSERT OR REPLACE INTO users (user_id, email, password, role, phone) 
         VALUES (?, ?, ?, ?, ?)`,
        [user.user_id, user.email, user.password, user.role || 'customer', user.phone]
      );
    }
    console.log(`✅ ${users.length} users migrated`);

    // 2. Migrate Shipments
    console.log('📦 Migrating shipments...');
    const shipments = readCSV('shipments.csv');
    for (const ship of shipments) {
      await db.run(
        `INSERT OR REPLACE INTO shipments 
         (shipment_id, order_id, origin, destination, carrier, status, distance_km, 
          eta_hours, current_lat, current_lng, customer_id, customer_phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ship.shipment_id,
          ship.order_id,
          ship.origin,
          ship.destination,
          ship.carrier,
          ship.status,
          parseFloat(ship.distance_km) || 0,
          parseFloat(ship.eta_hours) || 0,
          parseFloat(ship.current_lat) || 0,
          parseFloat(ship.current_lng) || 0,
          ship.customer_id || 1,
          ship.customer_phone
        ]
      );
    }
    console.log(`✅ ${shipments.length} shipments migrated`);

    // 3. Migrate Risk Predictions
    console.log('🤖 Migrating predictions...');
    const risks = readCSV('shipment_risk.csv');
    for (const risk of risks) {
      await db.run(
        `INSERT OR REPLACE INTO predictions 
         (shipment_id, risk_score, reason, recommended_action, alternate_route, time_saved_hours, confidence) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          risk.shipment_id,
          parseFloat(risk.risk_score) || 0,
          risk.reason || 'Processing...',
          risk.recommended_action || 'N/A',
          risk.alternate_route || 'N/A',
          parseFloat(risk.time_saved_hours) || 0,
          85
        ]
      );
    }
    console.log(`✅ ${risks.length} predictions migrated`);

    console.log('\n✅ Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Shipments: ${shipments.length}`);
    console.log(`  - Predictions: ${risks.length}`);
    console.log(`  - Database: ${path.resolve('data/shipalert.db')}\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Run migration
migrate();
