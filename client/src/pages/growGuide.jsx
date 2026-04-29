import { useEffect, useState } from 'react';
import '../Pages_css/growGuide.css';

const ScaleBar = ({ value, max = 10 }) => (
  <div className="gg-scale-bar">
    <div className="gg-scale-fill" style={{ width: `${(value / max) * 100}%` }} />
  </div>
);

const GrowModal = ({ slug, onClose }) => {
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/flowers/${slug}`)
      .then(r => r.json())
      .then(setPlant)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="gg-modal-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={e => e.stopPropagation()}>
        <button className="gg-modal-close" onClick={onClose}>✕</button>

        {loading && <p className="gg-modal-loading">Loading...</p>}

        {!loading && plant && (
          <>
            {plant.image_url && (
              <img className="gg-modal-image" src={plant.image_url} alt={plant.name} />
            )}
            <h2 className="gg-modal-name">{plant.name}</h2>
            {plant.scientific_name && (
              <p className="gg-modal-sci">{plant.scientific_name}</p>
            )}

            <div className="gg-modal-stats">
              {plant.growth_habit && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Growth Habit</span>
                  <span className="gg-stat-value">{plant.growth_habit}</span>
                </div>
              )}
              {plant.growth_rate && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Growth Rate</span>
                  <span className="gg-stat-value">{plant.growth_rate}</span>
                </div>
              )}
              {plant.light != null && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Light (0–10)</span>
                  <div className="gg-stat-bar">
                    <ScaleBar value={plant.light} />
                    <span className="gg-stat-num">{plant.light}</span>
                  </div>
                </div>
              )}
              {plant.atmospheric_humidity != null && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Humidity (0–10)</span>
                  <div className="gg-stat-bar">
                    <ScaleBar value={plant.atmospheric_humidity} />
                    <span className="gg-stat-num">{plant.atmospheric_humidity}</span>
                  </div>
                </div>
              )}
              {plant.soil_nutriments != null && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Soil Nutrients (0–10)</span>
                  <div className="gg-stat-bar">
                    <ScaleBar value={plant.soil_nutriments} />
                    <span className="gg-stat-num">{plant.soil_nutriments}</span>
                  </div>
                </div>
              )}
              {plant.soil_salinity != null && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Soil Salinity (0–10)</span>
                  <div className="gg-stat-bar">
                    <ScaleBar value={plant.soil_salinity} />
                    <span className="gg-stat-num">{plant.soil_salinity}</span>
                  </div>
                </div>
              )}
              {(plant.ph_minimum != null || plant.ph_maximum != null) && (
                <div className="gg-stat-row">
                  <span className="gg-stat-label">Soil pH</span>
                  <span className="gg-stat-value">
                    {plant.ph_minimum ?? '?'} – {plant.ph_maximum ?? '?'}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const GrowGuide = () => {
  const [flowers, setFlowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlug, setActiveSlug] = useState(null);

  useEffect(() => {
    fetch('/api/flowers?source=trefle')
      .then(r => r.json())
      .then(data => setFlowers(Array.isArray(data.data) ? data.data : []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="gg-page">
      <h1 className="gg-title">Grow Guide</h1> 
      <br/>
      <p className="gg-subtitle">Click a plant to see its growing requirements.</p>

      {isLoading && <p className="gg-status">Loading plants...</p>}

      <div className="gg-grid">
        {flowers.map(flower => (
          <button
            key={flower.id}
            className="gg-card"
            onClick={() => setActiveSlug(flower.id)}
          >
            <div className="gg-card-image">
              {flower.image_url
                ? <img src={flower.image_url} alt={flower.name} />
                : <span className="gg-card-placeholder">🌱</span>
              }
            </div>
            <p className="gg-card-name">{flower.name}</p>
          </button>
        ))}
      </div>

      {activeSlug && (
        <GrowModal slug={activeSlug} onClose={() => setActiveSlug(null)} />
      )}
    </main>
  );
};

export default GrowGuide;
