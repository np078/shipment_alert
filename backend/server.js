require('dotenv').config(); // Load environment variables

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDatabase } = require('./utils/database');

const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const aiRoutes = require('./routes/ai');
const smsRoutes = require('./routes/sms');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', shipmentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sms', smsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Shipment Delay API is running', timestamp: new Date().toISOString() });
});

// Initialize database and start server
(async () => {
  try {
    const db = getDatabase();
    await db.initialize();
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Using SQLite database from ../backend/shipalert.db`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
})();
