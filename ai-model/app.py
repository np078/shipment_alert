from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import requests
import os
import random

app = Flask(__name__)
CORS(app)

# Load model
MODEL_PATH = 'model/model.pkl'
model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("✅ Model loaded successfully")
else:
    print("⚠️  Model not found. Run train.py first.")

# API Keys
WEATHER_API_KEY = "e08e6e745ff647dc80555621252109"
NEWS_API_KEY = "609458217854407491cd1991bba5300f"

WEATHER_SEVERITY_MAP = {
    'Sunny': 0, 'Clear': 0, 'Partly cloudy': 1, 'Overcast': 2,
    'Mist': 3, 'Fog': 4, 'Light rain': 4, 'Moderate rain': 6,
    'Heavy rain': 8, 'Thunderstorm': 9, 'Blizzard': 10,
    'Cyclone': 10, 'Landslide warning': 10
}

DELAY_REASONS = {
    (80, 100): ["Severe Cyclone Warning", "Major Flooding", "Road Closure due to Landslide"],
    (60, 80):  ["Heavy Rain + High Traffic", "Festival Traffic Congestion", "Fog + Low Visibility"],
    (40, 60):  ["Moderate Traffic Delays", "Strong Winds", "Construction Zone"],
    (0, 40):   ["Clear Weather", "Light Traffic", "Normal Conditions"]
}

ROUTE_RECOMMENDATIONS = {
    "Mumbai→Delhi":    {"alt": "Mumbai → Udaipur → Ajmer → Delhi (NH48)", "saved": 2},
    "Chennai→Bangalore": {"alt": "Chennai → Vellore → Bangalore (NH48)", "saved": 1},
    "Kolkata→Hyderabad": {"alt": "Kolkata → Nagpur → Hyderabad (NH30)", "saved": 3},
    "Delhi→Mumbai":    {"alt": "Delhi → Jaipur → Ahmedabad → Mumbai (NH48)", "saved": 2},
    "Hyderabad→Chennai": {"alt": "Hyderabad → Nellore → Chennai (NH65)", "saved": 4},
    "default":         {"alt": "Contact logistics team for alternate route", "saved": 0}
}

def get_weather_severity(city):
    try:
        url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={city}&aqi=yes"
        resp = requests.get(url, timeout=5)
        data = resp.json()
        condition = data['current']['condition']['text']
        severity = WEATHER_SEVERITY_MAP.get(condition, 3)
        wind_kph = data['current']['wind_kph']
        precip_mm = data['current']['precip_mm']
        if wind_kph > 60: severity = max(severity, 7)
        if precip_mm > 20: severity = max(severity, 6)
        return severity, condition
    except Exception as e:
        print(f"⚠️ Weather API error: {e}")
        return 3, "Unknown"

def get_news_disruption(region="India"):
    try:
        url = f"https://newsapi.org/v2/top-headlines?country=in&category=general&apiKey={NEWS_API_KEY}"
        resp = requests.get(url, timeout=5)
        articles = resp.json().get('articles', [])
        disruption_keywords = ['flood', 'cyclone', 'storm', 'landslide', 'accident', 'blockade', 'strike', 'traffic']
        score = 0
        for article in articles[:10]:
            title = (article.get('title') or '').lower()
            desc = (article.get('description') or '').lower()
            for kw in disruption_keywords:
                if kw in title or kw in desc:
                    score += 1
                    break
        return min(score, 5)
    except Exception as e:
        print(f"⚠️ News API error: {e}")
        return 1

def get_delay_reason(risk_score):
    for (lo, hi), reasons in DELAY_REASONS.items():
        if lo <= risk_score < hi:
            return random.choice(reasons)
    return "Normal Conditions"

def get_route_recommendation(origin, destination, risk_score):
    key = f"{origin}→{destination}"
    rec = ROUTE_RECOMMENDATIONS.get(key, ROUTE_RECOMMENDATIONS["default"])
    if risk_score >= 60:
        return rec
    return {"alt": f"{origin} → {destination} (Current Route - No Change Needed)", "saved": 0}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        shipment_id = data.get('shipment_id', 'UNKNOWN')
        origin = data.get('origin', 'Mumbai')
        destination = data.get('destination', 'Delhi')
        distance_km = float(data.get('distance_km', 1000))
        eta_hours = float(data.get('eta_hours', 20))
        carrier_reliability = float(data.get('carrier_reliability', 80))
        historical_delay_rate = float(data.get('historical_delay_rate', 0.15))

        # Get live data
        weather_severity, weather_condition = get_weather_severity(origin)
        news_disruption = get_news_disruption()
        traffic_level = random.randint(20, 90)  # Simulated (no free Traffic API)

        # Predict
        if model:
            features = np.array([[
                distance_km, traffic_level, weather_severity,
                news_disruption, carrier_reliability,
                historical_delay_rate, eta_hours
            ]])
            delay_prob = model.predict_proba(features)[0][1]
            risk_score = round(delay_prob * 100, 1)
        else:
            # Fallback heuristic
            risk_score = min(100, weather_severity * 8 + traffic_level * 0.3 + news_disruption * 5)
            risk_score = round(risk_score, 1)

        is_delayed = risk_score >= 60
        reason = get_delay_reason(risk_score)
        route_rec = get_route_recommendation(origin, destination, risk_score)

        # Enrich reason with weather condition
        if weather_condition not in ['Unknown', 'Clear', 'Sunny']:
            reason = f"{weather_condition} + {reason}"

        result = {
            "shipment_id": shipment_id,
            "risk_score": risk_score,
            "delay": is_delayed,
            "reason": reason,
            "weather_condition": weather_condition,
            "weather_severity": weather_severity,
            "traffic_level": traffic_level,
            "news_disruption_score": news_disruption,
            "recommended_action": route_rec["alt"] if is_delayed else "No action needed",
            "alternate_route": route_rec["alt"],
            "time_saved_hours": route_rec["saved"],
            "confidence": round(min(95, 70 + risk_score * 0.25), 1)
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 AI Prediction Service running on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
