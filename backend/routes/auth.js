const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../utils/database');

const JWT_SECRET = 'shipment_delay_secret_key_2024';

// POST /api/auth/login - Direct JWT login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const db = getDatabase();
    const user = await db.get(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT immediately
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.user_id, name: user.email, role: user.role, phone: user.phone, email: user.email }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/signup - Register new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const db = getDatabase();
    
    // Check if user already exists
    const existingUser = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check for valid role, default to user
    const requestedRole = req.body.role === 'admin' ? 'admin' : 'user';
    
    // Insert new user
    await db.run(
      'INSERT INTO users (email, password, role, phone) VALUES (?, ?, ?, ?)',
      [email, password, requestedRole, phone]
    );

    // Get the newly created user
    const newUser = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    // Generate JWT for auto-login
    const token = jwt.sign(
      { userId: newUser.user_id, role: newUser.role, name: newUser.email, phone: newUser.phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: { id: newUser.user_id, name: newUser.email, role: newUser.role, phone: newUser.phone, email: newUser.email }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

module.exports = router;
