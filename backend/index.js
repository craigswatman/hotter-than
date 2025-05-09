const express = require('express');
const cors = require('cors');
const hotPlaces = require('./hotPlaces');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 1000 * 60 * 60 * 6; // 6 hours (Open-Meteo updates every 6 hours)

// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// Helper to get location name from coordinates
async function getLocationName(lat, lon) {
  const { default: fetch } = await import('node-fetch');
  
  // Round coordinates to 4 decimal places
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLon = Math.round(lon * 10000) / 10000;
  
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${roundedLat}&lon=${roundedLon}&format=json&zoom=10`;
  console.log('Geocoding URL:', url);
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'hotterThan.com - Temperature Comparison App'
      }
    });
    if (!res.ok) {
      console.error('Geocoding API error status:', res.status);
      throw new Error(`Geocoding API responded with status: ${res.status}`);
    }
    const data = await res.json();
    console.log('Geocoding API response:', JSON.stringify(data, null, 2));
    
    if (!data || !data.address) {
      console.log('No results found for coordinates:', roundedLat, roundedLon);
      return 'Your location';
    }

    // Try to get the most specific location name
    const locationName = data.address.city || 
                        data.address.town || 
                        data.address.village || 
                        data.address.suburb || 
                        data.address.county || 
                        data.address.state || 
                        'Your location';
    console.log('Selected location name:', locationName);
    return locationName;
  } catch (error) {
    console.error('Error fetching location name:', error);
    return 'Your location';
  }
}

// Helper to get high temperatures for given lat/lon
async function getHighTemps(lat, lon) {
  const { default: fetch } = await import('node-fetch');
  
  // Create cache key from coordinates
  const cacheKey = `${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached data for:', cacheKey);
    return cached.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max&timezone=auto&forecast_days=7`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      }
      throw new Error(`Weather API responded with status: ${res.status}`);
    }
    const data = await res.json();
    if (!data.daily || !data.daily.temperature_2m_max || !data.daily.time) {
      console.error('Unexpected API response format:', data);
      throw new Error('Weather API returned unexpected data format');
    }
    
    const result = {
      today: data.daily.temperature_2m_max[0],
      nextDays: data.daily.temperature_2m_max.slice(1),
      dates: data.daily.time.slice(1)
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
}

// Main endpoint
app.post('/api/hotter-than', async (req, res) => {
  try {
    const { lat, lon } = req.body;
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Get location name and temperature data in parallel
    const [locationName, userTemps] = await Promise.all([
      getLocationName(lat, lon),
      getHighTemps(lat, lon)
    ]);
    
    // For demo, assume user's average high is 18C (could be improved with a real climatology API)
    const userAvgHigh = 18;

    // For each hot place, get temperatures and compare
    const results = await Promise.all(hotPlaces.map(async place => {
      try {
        const placeTemps = await getHighTemps(place.lat, place.lon);
        
        // Check if user is hotter than place on any day
        const comparisons = placeTemps.nextDays.map((placeHigh, index) => ({
          date: placeTemps.dates[index],
          placeHigh,
          userHigh: userTemps.nextDays[index],
          isHotter: userTemps.nextDays[index] > placeHigh
        }));

        // Include if user is hotter on any day and place's average is higher than user's average
        if (comparisons.some(comp => comp.isHotter) && place.avgHigh > userAvgHigh) {
          console.log(`Found hotter comparison for ${place.name}:`);
          console.log('Today:', {
            place: placeTemps.today,
            user: userTemps.today,
            diff: userTemps.today - placeTemps.today
          });
          console.log('Next days:', comparisons.map(day => ({
            date: day.date,
            place: day.placeHigh,
            user: day.userHigh,
            diff: day.userHigh - day.placeHigh
          })));
          
          return {
            name: place.name,
            today: {
              placeHigh: placeTemps.today,
              userHigh: userTemps.today
            },
            nextDays: comparisons,
            avgHigh: place.avgHigh,
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching data for ${place.name}:`, error);
        return null;
      }
    }));

    const filtered = results.filter(Boolean);

    res.json({ 
      locationName,
      today: { high: userTemps.today },
      nextDays: userTemps.nextDays.map((high, index) => ({
        date: userTemps.dates[index],
        high
      })),
      hotterThan: filtered 
    });
  } catch (err) {
    console.error('Error in /api/hotter-than:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
