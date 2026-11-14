import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { getStoredTheaters } from '../data/mockData';
import './TheatersList.css';

const TheatersList = () => {
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState(getStoredTheaters);

  useEffect(() => {
    const syncTheaters = () => setTheaters(getStoredTheaters());
    window.addEventListener("theatersChange", syncTheaters);
    window.addEventListener("storage", (e) => {
      if (!e.key || e.key === "cinevite_theaters") syncTheaters();
    });
    return () => {
      window.removeEventListener("theatersChange", syncTheaters);
    };
  }, []);

  return (
    <div className="theaters-page container animate-fade-in">
      <div className="theaters-header">
        <h1 className="page-title">Hệ Thống Rạp CineVite</h1>
        <p className="page-subtitle">Trải nghiệm điện ảnh đỉnh cao với hệ thống rạp hiện đại bậc nhất.</p>
      </div>

      <div className="theaters-grid">
        {theaters.map(theater => (
          <div key={theater.id || theater._id} className="theater-card">
            <div className="theater-image">
              <div className="theater-overlay">
                <h2>{theater.name}</h2>
              </div>
            </div>
            <div className="theater-info">
              <div className="info-row">
                <MapPin size={18} className="info-icon" />
                <span>{theater.address}</span>
              </div>
              <div className="info-row hotline">
                <Phone size={16} className="info-icon" />
                <span>Hotline:</span>
                <strong>{theater.hotline || "1900 1234"}</strong>
              </div>
              <button className="btn btn-secondary btn-full" style={{ marginTop: '1rem' }} onClick={() => navigate('/movies')}>
                Xem Lịch Chiếu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TheatersList;
