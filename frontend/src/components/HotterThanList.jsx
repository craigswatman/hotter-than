function HotterThanList({ userHigh, hotterThan, locationName, headline, onRegenerateHeadline }) {
  if (!userHigh && !hotterThan) return null;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const cardStyle = (isHotter) => ({
    padding: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minWidth: '120px',
    backgroundColor: isHotter ? '#f0fff0' : '#fff0f0',
    color: '#333',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  });

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2>Results</h2>
      {headline && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1.5rem',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: '#856404',
            paddingRight: '100px' // Make room for the button
          }}>
            {headline}
          </div>
          <button
            onClick={onRegenerateHeadline}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#856404',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#6d5204'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#856404'}
          >
            New Headline
          </button>
        </div>
      )}
      <div style={{ marginBottom: '2rem' }}>
        <h3>{locationName || 'Your Location'}'s Forecast</h3>
        <p>Today: {userHigh.today.high}°C</p>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem 0' }}>
          {userHigh.nextDays.map((day) => (
            <div key={day.date} style={cardStyle(false)}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{formatDate(day.date)}</div>
              <div>{day.high}°C</div>
            </div>
          ))}
        </div>
      </div>

      {hotterThan && hotterThan.length > 0 ? (
        <>
          <h3>{locationName || 'Your location'} will be hotter than:</h3>
          {hotterThan.map((place) => (
            <div key={place.name} style={{ marginBottom: '1.5rem' }}>
              <h4>{place.name}</h4>
              <p>Today: {place.today.userHigh}°C vs {place.today.placeHigh}°C</p>
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                {place.nextDays.map((day) => (
                  <div key={day.date} style={{
                    ...cardStyle(day.isHotter),
                    position: 'relative'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{formatDate(day.date)}</div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <span style={{ color: '#666' }}>{locationName || 'You'}: </span>
                      <span style={{ fontWeight: 'bold' }}>{day.userHigh}°C</span>
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>There: </span>
                      <span style={{ fontWeight: 'bold' }}>{day.placeHigh}°C</span>
                    </div>
                    {day.isHotter && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#4CAF50',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <p>{locationName || 'Your location'} is not hotter than any of our hot spots in the forecast!</p>
      )}
    </div>
  );
}

export default HotterThanList;
