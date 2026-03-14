const axios = require('axios');

// City coordinates for weather API
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

/**
 * Fetch current weather data from Open-Meteo API (free, no auth required)
 */
async function getWeatherData(city) {
  try {
    const coords = CITY_COORDINATES[city];
    if (!coords) return null;

    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: coords.lat,
        longitude: coords.lng,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
        timezone: 'auto',
        temperature_unit: 'celsius'
      },
      timeout: 5000
    });

    const current = response.data.current;
    return {
      city,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      weatherCode: current.weather_code,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation,
      description: getWeatherDescription(current.weather_code),
      isRisky: isRiskyWeather(current.weather_code, current.wind_speed_10m, current.precipitation)
    };
  } catch (error) {
    console.error(`Weather fetch error for ${city}:`, error.message);
    return null;
  }
}

/**
 * Get weather description from WMO weather code
 */
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy with Rime',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Hail'
  };
  return weatherCodes[code] || 'Unknown';
}

/**
 * Determine if weather is risky for shipment
 */
function isRiskyWeather(weatherCode, windSpeed, precipitation) {
  // Rain/Thunderstorm risk
  if ([61, 63, 65, 71, 73, 75, 80, 81, 82, 95, 96, 99].includes(weatherCode)) {
    return true;
  }
  
  // High wind risk (>40 km/h)
  if (windSpeed > 40) {
    return true;
  }
  
  // Heavy precipitation
  if (precipitation > 5) {
    return true;
  }
  
  return false;
}

/**
 * Calculate traffic factor based on time and route
 * Returns traffic condition and impact factor (0-1)
 */
function getTrafficFactor(distance = 1000) {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  let trafficLevel = 'Light';
  let factor = 0.1; // 10% delay factor

  // Rush hour: 7-10 AM and 5-8 PM
  if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) {
    trafficLevel = 'Heavy';
    factor = 0.35; // 35% delay factor
  }
  // Mid-day (12-4 PM): Moderate
  else if (hour >= 12 && hour < 16) {
    trafficLevel = 'Moderate';
    factor = 0.20; // 20% delay factor
  }
  // Night (10 PM - 7 AM): Very Light
  else if (hour >= 22 || hour < 7) {
    trafficLevel = 'Very Light';
    factor = 0.05; // 5% delay factor
  }
  // Weekend increases traffic slightly
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    factor += 0.1;
  }

  return {
    level: trafficLevel,
    factor: Math.min(factor, 0.5), // Cap at 50%
    timeOfDay: hour
  };
}

/**
 * Generate risk reason based on weather and traffic
 */
async function generateRiskReason(origin, destination, distance, eta, carrier = 'DHL') {
  try {
    const originWeather = await getWeatherData(origin);
    const destWeather = await getWeatherData(destination);
    const traffic = getTrafficFactor(distance);

    const reasons = [];
    let riskScore = 0;

    // Weather-based reasons
    if (originWeather?.isRisky) {
      reasons.push(`${originWeather.description} in ${origin}`);
      riskScore += 15;
    }
    if (destWeather?.isRisky) {
      reasons.push(`${destWeather.description} in ${destination}`);
      riskScore += 15;
    }

    // Traffic-based reasons
    if (traffic.level === 'Heavy') {
      reasons.push('Heavy Traffic');
      riskScore += 20;
    } else if (traffic.level === 'Moderate') {
      reasons.push('Moderate Traffic');
      riskScore += 10;
    }

    // Distance-based reason
    if (distance > 1500) {
      reasons.push('Long Route');
      riskScore += 10;
    }

    // Random environmental factors for realism
    const randomFactors = [
      'Road Construction Activity',
      'Festival Season Traffic',
      'Weather Monitoring Required',
      'Route Congestion'
    ];
    
    if (Math.random() < 0.3) {
      const randomFactor = randomFactors[Math.floor(Math.random() * randomFactors.length)];
      if (!reasons.includes(randomFactor)) {
        reasons.push(randomFactor);
        riskScore += 5;
      }
    }

    return {
      reasons: reasons.length > 0 ? reasons.join(' + ') : 'Clear Weather',
      riskScore: Math.min(riskScore, 90),
      weatherData: {
        origin: originWeather,
        destination: destWeather
      },
      trafficData: traffic
    };
  } catch (error) {
    console.error('Error generating risk reason:', error.message);
    return {
      reasons: 'Unable to fetch real-time data',
      riskScore: 30,
      weatherData: null,
      trafficData: getTrafficFactor(distance)
    };
  }
}

module.exports = {
  getWeatherData,
  getTrafficFactor,
  generateRiskReason,
  CITY_COORDINATES
};
