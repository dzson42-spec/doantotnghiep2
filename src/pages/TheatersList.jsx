import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import './TheatersList.css';

const theaters = [
  { id: 1, name: 'CineVite Landmark', address: 'Tầng B1, Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', hotline: '1900 1234' },
  { id: 2, name: 'CineVite Q7', address: 'Tầng 3, Crescent Mall, 101 Tôn Dật Tiên, Quận 7, TP.HCM', hotline: '1900 1235' },
  { id: 3, name: 'CineVite Gò Vấp', address: 'Vincom Plaza Gò Vấp, 12 Phan Văn Trị, Phường 7, Quận Gò Vấp, TP.HCM', hotline: '1900 1236' }
];

const TheatersList = () => {
  const navigate = useNavigate();

  return (
    <div className="theaters-page container animate-fade-in">
      <div className="theaters-header">
        <h1 className="page-title">Hệ Thống Rạp CineVite</h1>
        <p className="page-subtitle">Trải nghiệm điện ảnh đỉnh cao với hệ thống rạp hiện đại bậc nhất.</p>
      </div>

      <div className="theaters-grid">
        {theaters.map(theater => (
          <div key={theater.id} className="theater-card">
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
                <span>Hotline:</span>
                <strong>{theater.hotline}</strong>
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
