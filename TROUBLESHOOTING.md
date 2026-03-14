# 🔧 Troubleshooting Guide

## ⚡ Quick Fixes

### **Port Already in Use**
```bash
# Kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5001 (AI)
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### **Module Not Found Errors**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# AI Model
cd ai-model
pip install -r requirements.txt
```

### **OTP Not Showing**
✅ Check **Terminal 2** (Backend console)
- Look for: `📱 OTP for Admin User`
- Should appear when you click "Send OTP"
- If not showing:
  1. Refresh browser
  2. Click "Send OTP" again
  3. Check backend logs immediately

### **Dashboard Not Loading**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check if frontend is running
# Should see Vite server output in Terminal 3
```

---

## 🚨 Common Issues

### **Issue: "Cannot find module" in backend**

**Solution:**
```bash
cd backend
rm -r node_modules package-lock.json
npm install
npm start
```

### **Issue: "ModuleNotFoundError" in AI model**

**Solution:**
```bash
cd ai-model
pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

### **Issue: Alert not triggering**

**Check:**
1. Shipment risk score ≥ 70%?
   ```bash
   # View shipment_risk.csv
   # SHP1003: 76% ✅
   # SHP1008: 68% ⚠️  (won't alert unless ≥70%)
   ```

2. Backend running?
   ```bash
   # Terminal 2 should show: "Listening on port 5000"
   ```

3. Check backend logs for auto-alert
   ```bash
   # Should see: "⚡ AUTO-ALERT: High risk detected"
   ```

### **Issue: Email/WhatsApp not sending**

**Expected behavior (no config):**
- ✅ Alert logs to console
- ❌ Email/WhatsApp skipped (no credentials)

**To enable real alerts:**
1. Add `.env` in `/backend` folder
2. Add Twilio & Gmail credentials
3. Restart backend: `npm start`

### **Issue: Map not showing**

**Check:**
1. MapBox has free tier enabled
2. Frontend loaded without errors
3. Shipment has valid coordinates
4. Browser console for errors: `F12`

### **Issue: Login keeps asking for OTP**

**Solution:**
1. Refresh page: `Ctrl+Shift+R`
2. Clear browser cache
3. Check localStorage in DevTools
4. Restart frontend: `Ctrl+C` then `npm run dev`

---

## 🧪 Testing Commands

### **Test Backend Health**
```bash
curl http://localhost:5000/api/health
# Expected: {"status":"ok","message":"Shipment Delay API is running"}
```

### **Test AI Prediction**
```bash
curl http://localhost:5000/api/ai/predict/SHP1003
# Should show: risk_score, reason, alternate_route
```

### **Test Auto-Alert**
```bash
cd backend
node test-alerts.js
# Should show alerts for high-risk shipments
```

### **Manual Alert Test**
```bash
curl -X POST http://localhost:5000/api/sms/alert \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543213",
    "shipmentId": "SHP1001",
    "reason": "Test Alert",
    "newEta": 3
  }'
```

---

## 📝 Debug Mode

### **Enable Debug Logs**

**Backend:**
```bash
cd backend
DEBUG=* npm start
```

**Frontend:**
```bash
cd frontend
npm run dev  # Already verbose
```

### **Check Logs**

**Backend current transaction:**
```bash
# Watch Terminal 2 for real-time logs
```

**Frontend errors:**
```bash
# Press F12 → Console to see errors
```

---

## 📊 Data Issues

### **Issue: Shipment data disappears after viewing**

**Fixed:** ✅ CSV data is now preserved
- No overwriting when AI predicts
- Data persists across sessions

### **Issue: Risk scores showing N/A**

**Check:**
```bash
# Open /data/shipment_risk.csv
# Verify all rows have numeric values
# Run latest version if upgraded
```

### **Reset Data**
```bash
# Restore from backup
cp data/shipments.csv.bak data/shipments.csv
cp data/shipment_risk.csv.bak data/shipment_risk.csv

# Or: Re-enter sample data
# See README.md for high-risk shipments
```

---

## 🚀 Performance Issues

### **Issue: Dashboard loading slow**

**Causes:**
- AI service not responding (wait 8 seconds for timeout)
- Many shipments loading (normal with 16+)
- Browser cache issue

**Solution:**
```bash
# Hard refresh browser
Ctrl+Shift+Delete  # Clear cache
Ctrl+Shift+R       # Hard reload

# Or restart all services:
# Kill all terminals and restart
```

### **Issue: Notifications delayed**

**Check:**
1. Network connection stable?
2. Backend processing? (check logs)
3. Alert service running? (verify .env if configured)

---

## 🔐 Security Notes

### **For Demo Only**
- ⚠️  Credentials are hardcoded (demo purposes)
- ⚠️  No database encryption
- ⚠️  Should use .env in production

### **To Harden:**
```bash
# Create .env with real secrets
cp backend/.env.example backend/.env

# Update with actual credentials
# Use environment variables in deployment
# Enable HTTPS in production
```

---

## 📞 Still Need Help?

**Check in this order:**

1. ✅ All 3 terminals running without errors?
2. ✅ Ports 5000, 5001, 5173 available?
3. ✅ Node.js and Python installed?
4. ✅ `/data` folder has CSV files?
5. ✅ Check error messages in Terminal 2

**Terminal 2 is your best friend** - Most issues show there first!

---

## ✅ Validation Checklist

Before demo, verify:

- [ ] Terminal 1: AI model running (no errors)
- [ ] Terminal 2: Backend running on port 5000
- [ ] Terminal 3: Frontend running on port 5173
- [ ] Browser: http://localhost:5173 loads
- [ ] Login: Admin credentials work
- [ ] Dashboard: SHP1001 displays properly
- [ ] Auto-Alert: Viewing SHP1013 triggers alert (check Terminal 2)
- [ ] Map: MapBox loads without errors

**Everything checked? You're ready to demo!** 🎉

