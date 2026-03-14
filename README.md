# 🚀 ShipAlert - AI Early Warning System for Shipment Delays

**Intelligent real-time shipment monitoring with multi-channel alerts (Zero Cost)**

---

## 📋 Quick Start

### **Requirements**
- Node.js 16+ | Python 3.8+ | 3 Terminal Windows

### **Setup**

```bash
# Terminal 1: AI Model
cd ai-model
pip install -r requirements.txt 
python app.py

# Terminal 2: Backend
cd backend
npm install
npm start

# Terminal 3: Frontend
cd frontend
npm install
npm run dev
```

**Open:** http://localhost:5173 → Click "Admin" → Send OTP (check Terminal 2)

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - UI components & state management
- **Material-UI (MUI)** - Professional UI components
- **Vite** - Lightning-fast build tool
- **Mapbox GL** - Interactive mapping & route visualization
- **Axios** - HTTP client for API calls

### **Backend**
- **Node.js + Express** - REST API server
- **SQLite3** - Lightweight database
- **Twilio SDK** - WhatsApp integration
- **CORS** - Cross-origin resource handling

### **AI/ML Pipeline**
- **Python 3.8+** - ML engine
- **Scikit-learn** - Machine learning algorithms
- **Pandas/NumPy** - Data processing
- **Flask** - ML service API
- **Joblib** - Model serialization

### **External APIs**
- **Open-Meteo Weather API** - Real-time weather data (FREE)
- **Twilio WhatsApp Sandbox** - Alert delivery (FREE)
- **Mapbox** - Route mapping & visualization

---

## 🏗️ Architecture & Workflow

### **System Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    SHIPALERT SYSTEM FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. USER ACTION (Frontend)
   ├─ Admin creates shipment
   ├─ Selects origin & destination
   └─ Auto-calculates distance & ETA

        ↓

2. BACKEND PROCESSING
   ├─ Validates shipment data
   ├─ Stores in SQLite database
   ├─ Fetches real-time weather (Open-Meteo API)
   ├─ Analyzes traffic patterns
   └─ Triggers AI prediction request

        ↓

3. AI PREDICTION ENGINE (Python)
   ├─ Loads trained ML model
   ├─ Extracts features:
   │  ├─ Distance (km)
   │  ├─ Weather conditions
   │  ├─ Traffic level %
   │  ├─ Time of day (rush hours)
   │  └─ Historical risk patterns
   ├─ Calculates risk score (0-100%)
   ├─ Generates natural risk reasons
   └─ Returns confidence metrics

        ↓

4. ALERT DECISION LOGIC
   ├─ If risk < 40%  → Dashboard only
   ├─ If risk 40-70% → Console log
   └─ If risk ≥ 70%  → Send WhatsApp Alert

        ↓

5. ALERT DELIVERY (WhatsApp via Twilio)
   ├─ Customer phone validated
   ├─ Alert message formatted
   ├─ Sent via Twilio WhatsApp Sandbox
   └─ Logged in database with timestamp

        ↓

6. REAL-TIME TRACKING (Map)
   ├─ Truck marker moves every 15 seconds
   ├─ GPS coordinates update in database
   ├─ Location displays on interactive map
   ├─ Progress bar updates
   └─ Journey status reflects in UI
```

### **Database Schema**

```sql
-- Shipments Table
CREATE TABLE shipments (
  id INTEGER PRIMARY KEY,
  shipment_id TEXT UNIQUE,
  order_id TEXT,
  origin TEXT,
  destination TEXT,
  distance_km REAL,
  eta_hours REAL,
  carrier TEXT,
  status TEXT,
  current_lat REAL,
  current_lng REAL,
  customer_phone TEXT,
  risk_score REAL,
  created_at TIMESTAMP
);

-- Alerts Table
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  shipment_id TEXT,
  customer_phone TEXT,
  channel TEXT,           -- 'whatsapp'
  status TEXT,            -- 'sent', 'pending'
  risk_score REAL,
  reason TEXT,
  message TEXT,
  delivery_status TEXT,   -- 'delivered'
  created_at TIMESTAMP,
  FOREIGN KEY(shipment_id) REFERENCES shipments(shipment_id)
);
```

---

## ✨ Features

### **🎯 Smart Risk Assessment**
- Real-time risk prediction with weather & traffic analysis
- Auto-calculated distance & ETA between cities
- Dynamic risk reasons (not hardcoded)
- 0-100% confidence-scored predictions
- Multi-factor analysis:
  - Weather conditions (rain, snow, storms)
  - Traffic patterns (rush hours: 7-10 AM, 5-8 PM)
  - Route distance & complexity
  - Historical shipment data

### **📱 Auto-Alerts (WhatsApp Only)**
| Risk Level | Action |
|-----------|--------|
| < 40% | Dashboard only |
| 40-70% | Console log |
| **≥ 70%** | **WhatsApp Alert via Twilio** |

**Alert Contents:**
- Shipment ID & Risk percentage
- Reason for delay (AI-generated)
- New estimated arrival time
- Alternative route recommendation
- Live tracking link

### **📊 Dashboard**
- Real-time shipment tracking
- Risk breakdown visualization (Weather, Traffic, Distance)
- Interactive map with routes (Mapbox)
- GPS location updates (every 15 seconds)
- One-click admin alerts
- Journey progress stepper (Pickup → In Transit → Near Destination → Delivered)
- Risk confidence metrics

### **🗺️ Live Map Tracking**
- Origin marker (Green)
- Destination marker (Red)
- Truck movement (15-second intervals)
- Route visualization
- Current GPS coordinates display
- Zoom & pan controls

---

## 🔧 API Endpoints

### **Authentication**
```
POST   /api/auth/login              # Login with email & password
POST   /api/auth/signup             # Create new user account
```

### **Shipments**
```
GET    /api/shipments               # Fetch all shipments (admin)
GET    /api/shipment/:id            # Get shipment details
POST   /api/shipments               # Create new shipment + auto-predict
PUT    /api/shipments/:id/location  # Update truck GPS location
GET    /api/route-info              # Calculate distance & ETA
```

### **AI Predictions**
```
GET    /api/ai/predict/:id          # Get risk prediction for shipment
```

### **Alerts**
```
POST   /api/sms/alert               # Send manual WhatsApp alert
```

---

## 📊 Example High-Risk Shipments

- `SHP1013` - 89% (Flooding + Heavy Traffic)
- `SHP1012` - 71% (Festival Traffic + Weather)
- `SHP1008` - 68% (Heavy Rain + Long Route)

View any to see auto-alert trigger! 🚀

---

## 💰 Zero-Cost Stack

| Component | Cost |
|-----------|------|
| Weather API | Free (Open-Meteo) |
| WhatsApp Alerts | Free (Twilio Sandbox) |
| Database | Free (SQLite) |
| Maps | Free (Mapbox) |
| **Total** | **$0** |

---

## 🚀 Quick Demo

1. Login as Admin (credentials auto-filled)
2. Go to **Add Shipment** → Select origin city → Select destination city
3. Distance & ETA auto-populate from Open-Meteo API ✓
4. Submit → Risk prediction generated by AI engine
5. View in dashboard → See real weather-based risk reasons!
6. If risk ≥ 70% → WhatsApp alert sent automatically
7. Click **View Map** → Watch truck move in real-time (15-sec intervals)

---

## 🔐 User Roles & Permissions

### **Admin**
- Create new shipments
- View all shipments dashboard
- Send manual alerts
- Track live GPS location
- View risk assessments
- Access admin panel

### **User**
- Track shipments by ID
- View shipment details
- See risk assessment
- View map tracking

---

## 🛠️ Development Setup

### **Backend Setup**
```bash
cd backend
npm install
npm start
# Runs on: http://localhost:5000
```

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
# Runs on: http://localhost:5173
```

### **AI Model Setup**
```bash
cd ai-model
pip install -r requirements.txt
python app.py
# Runs on: http://localhost:5001
```

### **Environment Configuration**
Update `backend/.env` with Twilio credentials:
```env
TWILIO_SID=your-account-sid
TWILIO_TOKEN=your-auth-token
TWILIO_WHATSAPP=whatsapp:+your-number
```

---

## 📁 Project Structure

```
infinite/
├── ai-model/                  # Python ML Pipeline
│   ├── app.py                # Flask API server
│   ├── train.py              # Model training script
│   ├── requirements.txt       # Python dependencies
│   └── model/                # Trained ML models
│
├── backend/                   # Node.js + Express API
│   ├── server.js             # Main server entry
│   ├── package.json
│   ├── .env                  # Twilio credentials
│   ├── routes/
│   │   ├── auth.js           # Login/signup
│   │   ├── shipments.js      # Shipment CRUD
│   │   ├── ai.js             # AI predictions
│   │   └── sms.js            # Alert sending
│   └── utils/
│       ├── database.js       # SQLite connection
│       ├── weatherService.js # Open-Meteo API integration
│       ├── notificationService.js  # WhatsApp alerts
│       └── otp.js            # OTP generation
│
├── frontend/                  # React Dashboard
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx          # Main app component
│   │   ├── main.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AddShipmentPage.jsx
│   │   │   ├── ShipmentDetailsPage.jsx
│   │   │   ├── MapPage.jsx        # Live tracking map
│   │   │   ├── TrackShipmentPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   └── OTPPage.jsx
│   │   └── services/
│   │       └── api.js       # Axios API client
│
├── data/                      # Sample datasets
│   ├── shipments.csv
│   ├── shipment_risk.csv
│   └── users.csv
│
└── README.md
```

---

## 🔄 Data Flow Summary

1. **Shipment Created** → Backend validates & stores in DB
2. **Weather Fetched** → Open-Meteo API (real-time conditions)
3. **AI Prediction** → Python model analyzes 5 risk factors
4. **Risk Score Generated** → 0-100% with confidence
5. **Alert Check** → If ≥ 70%, send WhatsApp via Twilio
6. **Map Updates** → Truck marker moves every 15 seconds
7. **Location Persists** → GPS coordinates saved to database

---

## 📖 Key Features Explained

### **Weather Integration**
- Pulls current weather for origin & destination
- Analyzes rain, snow, storms for delay risk
- Updates every shipment analysis

### **Traffic Patterns**
- Detects rush hours: 7-10 AM, 5-8 PM
- Applies traffic multiplier to risk score
- Adjusts ETA based on congestion

### **AI Risk Model**
- Trained on historical shipment data
- Considers: Distance, Weather, Traffic, Time, Route
- Returns 0-100% risk + natural language reason

### **Real-Time Tracking**
- GPS coordinates update every 15 seconds
- Truck marker animates on Mapbox
- Progress bar reflects journey completion
- Status updates: Pickup → In Transit → Near Destination → Delivered

---

## 🎯 Future Enhancements

- Multi-transporter support (DHL, FedEx, Courier)
- SMS alerts (additional channel)
- Email notifications
- Mobile app (React Native)
- Advanced analytics dashboard
- Machine learning model improvements

---

**Built with:** React 18 • Node.js • Python • SQLite • Open-Meteo API • Twilio • Mapbox  
**Author:** ShipAlert Team | 2026  
**License:** MIT

