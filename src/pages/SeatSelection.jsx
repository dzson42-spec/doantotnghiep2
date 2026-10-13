import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getStoredMovies, generateSeats } from '../data/mockData';
import { Armchair, Info } from 'lucide-react';
import ImgWithFallback from '../components/ImgWithFallback';
import './SeatSelection.css';

const SeatSelection = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const showtimeId = searchParams.get('showtimeId');
  const moviesList = getStoredMovies();
  const movie = moviesList.find(m => String(m.id || m._id) === String(id));

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes (5 * 60)

  useEffect(() => {
    setSeats(generateSeats(showtimeId));
  }, [showtimeId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert('Hết thời gian giữ ghế. Vui lòng chọn lại.');
      navigate(`/movie/${id}`);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate, id]);

  if (!movie || !date || !time || !showtimeId) {
    return <div className="container" style={{ marginTop: '100px' }}>Dữ liệu không hợp lệ. Vui lòng quay lại.</div>;
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeatClick = (seat) => {
    if (seat.status === 'booked') return;

    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 8) {
        alert('Bạn chỉ có thể chọn tối đa 8 ghế.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    // Lưu tạm vào state hoặc localStorage
    const bookingData = {
      movie,
      date,
      time,
      showtimeId,
      selectedSeats,
      totalPrice
    };
    localStorage.setItem('tempBooking', JSON.stringify(bookingData));
    navigate('/checkout');
  };

  return (
    <div className="seat-selection-page">
      <div className="container">
        <div className="seat-layout-grid">
          
          {/* Main Seat Map */}
          <div className="seat-map-container">
            <div className="screen-container">
              <div className="screen"></div>
              <p className="screen-text">MÀN HÌNH</p>
            </div>

            <div className="seats-grid">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(row => (
                <div key={row} className="seat-row">
                  <span className="row-label">{row}</span>
                  {seats.filter(s => s.row === row).map(seat => {
                    const isSelected = selectedSeats.some(s => s.id === seat.id);
                    return (
                      <button
                        key={seat.id}
                        className={`seat-btn ${seat.type} ${seat.status} ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.status === 'booked'}
                        title={`${seat.id} - ${formatPrice(seat.price)}`}
                      >
                        <Armchair size={seat.type === 'couple' ? 32 : 24} className="seat-icon" />
                        <span className="seat-id">{seat.id}</span>
                      </button>
                    )
                  })}
                  <span className="row-label right">{row}</span>
                </div>
              ))}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat-demo standard"></div>
                <span>Ghế thường (80k)</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo vip"></div>
                <span>Ghế VIP (120k)</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo couple"></div>
                <span>Ghế Đôi (200k)</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo selected"></div>
                <span>Đang chọn</span>
              </div>
              <div className="legend-item">
                <div className="seat-demo booked"></div>
                <span>Đã đặt</span>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="booking-summary">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid hsl(var(--color-border))', paddingBottom: '1rem' }}>
              <h2 className="summary-title" style={{ border: 'none', margin: 0, padding: 0 }}>Thông tin đặt vé</h2>
              <div style={{ backgroundColor: 'hsl(var(--color-warning)/0.2)', color: 'hsl(var(--color-warning))', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                Thời gian giữ ghế: {formatTime(timeLeft)}
              </div>
            </div>
            
            <div className="summary-movie-info">
              <ImgWithFallback src={movie.poster} alt={movie.title} className="summary-poster" />
              <div>
                <h3 className="summary-movie-title">{movie.title}</h3>
                <p className="summary-text">{movie.genre}</p>
              </div>
            </div>

            <div className="summary-details">
              <div className="summary-row">
                <span className="label">Suất chiếu:</span>
                <span className="value">{time} - {new Date(date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="summary-row">
                <span className="label">Ghế đã chọn:</span>
                <span className="value seats-list">
                  {selectedSeats.length > 0 ? selectedSeats.map(s => s.id).join(', ') : 'Chưa chọn ghế'}
                </span>
              </div>
            </div>

            <div className="summary-total">
              <span>Tổng cộng:</span>
              <span className="total-price">{formatPrice(totalPrice)}</span>
            </div>

            {selectedSeats.length > 0 ? (
              <button className="btn btn-primary btn-full animate-fade-in" onClick={handleContinue}>
                Tiếp tục thanh toán
              </button>
            ) : (
              <div className="warning-box">
                <Info size={16} />
                <span>Vui lòng chọn ít nhất 1 ghế để tiếp tục.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
