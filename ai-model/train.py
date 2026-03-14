import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

# Create model directory if it doesn't exist
os.makedirs('model', exist_ok=True)

# Generate synthetic training data
np.random.seed(42)
n_samples = 2000

data = {
    'distance_km': np.random.randint(100, 3000, n_samples),
    'traffic_level': np.random.randint(0, 100, n_samples),
    'weather_severity': np.random.randint(0, 10, n_samples),  # 0=clear, 10=extreme
    'news_disruption': np.random.randint(0, 5, n_samples),    # 0=none, 5=major
    'carrier_reliability': np.random.randint(60, 100, n_samples),  # %
    'historical_delay_rate': np.random.uniform(0, 0.4, n_samples),
    'eta_hours': np.random.randint(4, 72, n_samples),
}

df = pd.DataFrame(data)

# Create risk score (target)
df['risk_score'] = (
    df['traffic_level'] * 0.35 +
    df['weather_severity'] * 7 +
    df['news_disruption'] * 4 +
    (100 - df['carrier_reliability']) * 0.3 +
    df['historical_delay_rate'] * 50 +
    (df['distance_km'] / 3000) * 20
).clip(0, 100)

df['delay'] = (df['risk_score'] > 60).astype(int)

# Features and target
X = df[['distance_km', 'traffic_level', 'weather_severity', 
        'news_disruption', 'carrier_reliability', 'historical_delay_rate', 'eta_hours']]
y = df['delay']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest
rf_model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
rf_model.fit(X_train, y_train)

y_pred = rf_model.predict(X_test)
print(f"Random Forest Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

# Save model
joblib.dump(rf_model, 'model/model.pkl')
print("✅ Model saved to model/model.pkl")
