/**
 * Database Configuration & Schema
 * SQLite3 - Production Ready
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../shipalert.db');

class Database {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection
   */
  initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err);
          reject(err);
        } else {
          console.log('✅ SQLite connected:', DB_PATH);
          this.createTables()
            .then(() => {
              console.log('✅ Database schema initialized');
              resolve();
            })
            .catch(reject);
        }
      });
    });
  }

  /**
   * Create all tables
   */
  createTables() {
    return Promise.all([
      this.run(`
        CREATE TABLE IF NOT EXISTS users (
          user_id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'customer',
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `),
      this.run(`
        CREATE TABLE IF NOT EXISTS shipments (
          shipment_id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          origin TEXT NOT NULL,
          destination TEXT NOT NULL,
          carrier TEXT NOT NULL,
          status TEXT DEFAULT 'In Transit',
          distance_km REAL,
          eta_hours REAL,
          current_lat REAL,
          current_lng REAL,
          customer_id INTEGER,
          customer_phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(customer_id) REFERENCES users(user_id)
        )
      `),
      this.run(`
        CREATE TABLE IF NOT EXISTS predictions (
          prediction_id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id TEXT NOT NULL,
          risk_score REAL,
          delay_probability REAL,
          reason TEXT,
          recommended_action TEXT,
          alternate_route TEXT,
          time_saved_hours REAL,
          confidence REAL,
          weather_condition TEXT,
          traffic_level REAL,
          model_version TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(shipment_id) REFERENCES shipments(shipment_id)
        )
      `),
      this.run(`
        CREATE TABLE IF NOT EXISTS alerts (
          alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
          shipment_id TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          channel TEXT,
          status TEXT DEFAULT 'pending',
          risk_score REAL,
          reason TEXT,
          message TEXT,
          delivery_status TEXT,
          retry_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sent_at DATETIME,
          delivered_at DATETIME,
          FOREIGN KEY(shipment_id) REFERENCES shipments(shipment_id)
        )
      `)
    ]);
  }

  /**
   * Run SQL query with parameters
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) {
          console.error('❌ SQL Error:', err, sql);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get single row
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ SQL Error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all rows
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ SQL Error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Close database
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}

module.exports = {
  getDatabase,
  Database
};
