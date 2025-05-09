import { useState } from 'react'
import HotterThanList from './components/HotterThanList'
import './App.css'

// Get API URL from environment variable or use localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)
  const [headline, setHeadline] = useState(null)

  const generateHeadline = (locationName, hotterThan) => {
    if (!hotterThan || hotterThan.length === 0) return null;

    const headlines = [
      `Scorchio, ${locationName}! Set to Sizzle Hotter than {place}!`,
      `Pasty No More! ${locationName} Set to Roast Hotter than {place}!`,
      `Sun's Out in ${locationName}! Hotter than {place} This Weekend!`,
      `${locationName} Boils! Brits Face More Heat Than {place}!`,
      `Great Balls of Fire! ${locationName} to Blaze Past {place}!`,
      `Teneri-NO! ${locationName} to Outshine {place}!`,
      `Blimey ${locationName}! Hotter Than {place} as Heatwave Hits!`,
      `From Chilly to Chile! ${locationName} Set to Beat {place}'s Heat!`,
      `${locationName} Toasty! UK Hotspot Warmer Than {place}!`,
      `No Tan Lines in ${locationName}! Beats {place} in Blistering Heat!`,
      `Cor Blimey! ${locationName} to Cook Hotter than {place}!`,
      `Crikey! ${locationName} Set to Sizzle Past {place}!`,
      `Strewth! ${locationName} to Toast {place} in Heat Battle!`,
      `Blimey O'Riley! ${locationName} to Outshine {place}!`,
      `Cor Blimey! ${locationName} Set to Fry {place} in Heat Clash!`,
      `Get the beers in Sarge! ${locationName} Set to be hotter than {place}!`,
      `Get the beers in Sarge! ${locationName} Set to be hotter than {place}!`,
      `Get the beers in Sarge! ${locationName} Set to be hotter than {place}!`,
    ];

    // Randomly select a place from the hotter-than list
    const randomPlace = hotterThan[Math.floor(Math.random() * hotterThan.length)];
    
    // Get a random headline template
    const template = headlines[Math.floor(Math.random() * headlines.length)];
    return template.replace('{place}', randomPlace.name);
  };

  const handleRegenerateHeadline = () => {
    if (!results?.hotterThan || !results?.locationName) return;
    
    // Generate a new headline with the same data
    const newHeadline = generateHeadline(results.locationName, results.hotterThan);
    
    // Keep generating until we get a different headline
    while (newHeadline === headline) {
      const anotherHeadline = generateHeadline(results.locationName, results.hotterThan);
      if (anotherHeadline !== headline) {
        setHeadline(anotherHeadline);
        return;
      }
    }
    
    setHeadline(newHeadline);
  };

  const handleCheck = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setHeadline(null)

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      const { latitude, longitude } = position.coords
      setLocation({ lat: latitude, lon: longitude })

      const response = await fetch(`${API_URL}/api/hotter-than`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat: latitude, lon: longitude }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch weather data')
      }

      const data = await response.json()
      setResults(data)
      setHeadline(generateHeadline(data.locationName, data.hotterThan))
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hotter Than</h1>
        <p>See if your location will be hotter than famous hot spots!</p>
        <button 
          onClick={handleCheck}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1.1rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#45a049')}
          onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#4CAF50')}
        >
          {loading ? 'Checking...' : 'Check Now'}
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24'
          }}>
            {error}
          </div>
        )}

        {results && (
          <HotterThanList 
            userHigh={results} 
            hotterThan={results.hotterThan} 
            locationName={results.locationName}
            headline={headline}
            onRegenerateHeadline={handleRegenerateHeadline}
          />
        )}
      </main>
    </div>
  )
}

export default App
