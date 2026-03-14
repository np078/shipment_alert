// City coordinates for distance calculation
const CITY_COORDINATES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Goa': { lat: 15.4909, lng: 73.8278 }
};

// Predefined route distances (for accuracy) - in kilometers
const ROUTE_DISTANCES = {
  'Mumbai-Delhi': 1400, 'Delhi-Mumbai': 1400,
  'Mumbai-Bangalore': 980, 'Bangalore-Mumbai': 980,
  'Mumbai-Chennai': 1330, 'Chennai-Mumbai': 1330,
  'Mumbai-Hyderabad': 710, 'Hyderabad-Mumbai': 710,
  'Mumbai-Pune': 150, 'Pune-Mumbai': 150,
  'Delhi-Bangalore': 2150, 'Bangalore-Delhi': 2150,
  'Delhi-Chennai': 2700, 'Chennai-Delhi': 2700,
  'Delhi-Kolkata': 1450, 'Kolkata-Delhi': 1450,
  'Bangalore-Chennai': 350, 'Chennai-Bangalore': 350,
  'Bangalore-Hyderabad': 560, 'Hyderabad-Bangalore': 560,
  'Chennai-Hyderabad': 600, 'Hyderabad-Chennai': 600,
  'Delhi-Pune': 1400, 'Pune-Delhi': 1400,
  'Mumbai-Kolkata': 2000, 'Kolkata-Mumbai': 2000,
  'Bangalore-Kolkata': 2200, 'Kolkata-Bangalore': 2200,
  'Delhi-Ahmedabad': 940, 'Ahmedabad-Delhi': 940,
  'Mumbai-Ahmedabad': 430, 'Ahmedabad-Mumbai': 430,
  'Delhi-Jaipur': 260, 'Jaipur-Delhi': 260,
  'Jaipur-Bangalore': 1450, 'Bangalore-Jaipur': 1450,
  'Pune-Hyderabad': 570, 'Hyderabad-Pune': 570,
  'Delhi-Lucknow': 440, 'Lucknow-Delhi': 440,
  'Mumbai-Goa': 590, 'Goa-Mumbai': 590,
  'Bangalore-Goa': 720, 'Goa-Bangalore': 720
};

// Average speed for different carriers (km/hour)
const CARRIER_SPEEDS = {
  'DHL': 60,
  'FedEx': 65,
  'BlueDart': 55,
  'DTDC': 50,
  'Ekart': 50
};

/**
 * Calculate distance between two cities using Haversine formula
 * Falls back to predefined routes if available
 */
function calculateDistance(origin, destination) {
  // Check predefined routes first
  const routeKey = `${origin}-${destination}`;
  if (ROUTE_DISTANCES[routeKey]) {
    return ROUTE_DISTANCES[routeKey];
  }

  // Fallback: calculate using coordinates
  const originCoords = CITY_COORDINATES[origin];
  const destCoords = CITY_COORDINATES[destination];

  if (!originCoords || !destCoords) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (destCoords.lat - originCoords.lat) * (Math.PI / 180);
  const dLng = (destCoords.lng - originCoords.lng) * (Math.PI / 180);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(originCoords.lat * (Math.PI / 180)) * 
    Math.cos(destCoords.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Add 10-15% for actual road route (not straight line)
  return Math.round(distance * 1.12);
}

/**
 * Calculate ETA in hours based on distance and carrier speed
 * Adds buffer time for traffic, stops, etc.
 */
function calculateETA(distance, carrier = 'DHL') {
  const baseSpeed = CARRIER_SPEEDS[carrier] || 55;
  
  // Calculate base travel time
  let eta = distance / baseSpeed;
  
  // Add buffer time based on distance
  if (distance > 1500) {
    eta += 2; // Long routes: add 2 hours for stops, fuel, etc.
  } else if (distance > 800) {
    eta += 1; // Medium routes: add 1 hour
  } else {
    eta += 0.5; // Short routes: add 30 mins
  }
  
  // Round to nearest 0.5 hour
  eta = Math.round(eta * 2) / 2;
  
  return eta;
}

/**
 * Get distance and ETA for a origin-destination pair
 */
function getRouteInfo(origin, destination, carrier = 'DHL') {
  const distance = calculateDistance(origin, destination);
  
  if (!distance) {
    return {
      success: false,
      message: 'Invalid origin or destination'
    };
  }
  
  const eta = calculateETA(distance, carrier);
  
  return {
    success: true,
    distance_km: distance,
    eta_hours: eta
  };
}

module.exports = {
  calculateDistance,
  calculateETA,
  getRouteInfo,
  CITY_COORDINATES,
  CARRIER_SPEEDS
};
