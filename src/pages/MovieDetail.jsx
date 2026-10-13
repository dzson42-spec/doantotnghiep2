import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStoredMovies, getStoredShowtimes } from '../data/mockData';
import { Play, Clock, Star, Calendar } from 'lucide-react';
import ImgWithFallback from '../components/ImgWithFallback';
import TrailerModal from '../components/TrailerModal';
import './MovieDetail.css';
import './MovieDetailAdditional.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [moviesList, setMoviesList] = useState(getStoredMovies);
  const [allShowtimes, setAllShowtimes] = useState(getStoredShowtimes);

  useEffect(() => {
    const handleMovies = () => setMoviesList(getStoredMovies());
    const handleShowtimes = () => setAllShowtimes(getStoredShowtimes());
    window.addEventListener("moviesChange", handleMovies);
    window.addEventListener("showtimesChange", handleShowtimes);
    return () => {
      window.removeEventListener("moviesChange", handleMovies);
      window.removeEventListener("showtimesChange", handleShowtimes);
    };
  }, []);

  const movie = moviesList.find(m => String(m.id || m._id) === String(id));
  const movieShowtimes = useMemo(
    () => allShowtimes[id] || (movie?._id && allShowtimes[movie._id]) || [],
    [allShowtimes, id, movie]
  );
  
  const [selectedDate, setSelectedDate] = useState(movieShowtimes[0]?.date || '');
  const [selectedTime, setSelectedTime] = useState(null); // Lưu nguyên object { time, showtimeId }
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (movieShowtimes.length > 0 && !selectedDate) {
      setSelectedDate(movieShowtimes[0].date);
    }
  }, [movieShowtimes, selectedDate]);

  if (!movie) {
    return (
      <div className="container" style={{ marginTop: '100px', textAlign: 'center' }}>
        <h2>Không tìm thấy phim</h2>
        <Link to="/" className="btn btn-primary">Về Trang Chủ</Link>
      </div>
    );
  }

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      navigate(`/book/${id}?date=${selectedDate}&time=${selectedTime.time}&showtimeId=${selectedTime.showtimeId}`);
    }
  };

  const currentDayShowtimes = movieShowtimes.find(st => st.date === selectedDate)?.times || [];

  return (
    <div className="movie-detail">
      {/* Detail Hero */}
      <div className="detail-hero" style={{ backgroundImage: `url(${movie.backdrop})` }}>
        <div className="detail-hero-overlay"></div>
        <div className="container detail-content">
          <div className="detail-poster-container">
            <ImgWithFallback src={movie.poster} alt={movie.title} className="detail-poster" />
          </div>
          <div className="detail-info">
            <h1 className="detail-title">{movie.title}</h1>
            <p className="detail-genre">{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Phim chiếu rạp'}</p>
            
            <div className="detail-badges">
              {movie.ageRating && <span className="badge age-badge">{movie.ageRating}</span>}
              {movie.format && <span className="badge format-badge">{Array.isArray(movie.format) ? movie.format.join(', ') : movie.format}</span>}
              {movie.language && <span className="badge lang-badge">{movie.language}</span>}
            </div>

            <div className="detail-meta" style={{ marginTop: '1rem' }}>
              <span className="meta-item"><Clock size={16} /> {typeof movie.duration === 'number' ? `${movie.duration} phút` : movie.duration}</span>
              <span className="meta-item"><Star size={16} className="star-icon" /> {typeof movie.rating === 'object' && movie.rating?.average ? `${movie.rating.average}/10` : (movie.rating || '8.5/10')}</span>
            </div>
            
            <div className="detail-synopsis">
              <h3>Nội dung phim</h3>
              <p>{movie.synopsis || 'Nội dung đang được cập nhật...'}</p>
            </div>
            
            <div className="detail-cast">
              <h3>Diễn viên</h3>
              <p>{Array.isArray(movie.cast) ? movie.cast.join(', ') : (movie.cast || 'Đang cập nhật')}</p>
            </div>
            
            <button className="btn btn-secondary trailer-btn" onClick={() => setIsTrailerOpen(true)}>
              <Play size={18} /> Xem Trailer
            </button>
          </div>
        </div>
      </div>

      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        videoId={
          movie.trailerUrl?.includes("v=")
            ? movie.trailerUrl.split("v=")[1]?.split("&")[0]
            : movie.trailerUrl?.includes("youtu.be/")
              ? movie.trailerUrl.split("youtu.be/")[1]?.split("?")[0]
              : movie.id === 1 ? 'Way9Dexny3w' : movie.id === 2 ? '5C1Jm427eF0' : 'lV1OOlGwExM'
        } 
      />

      {/* Booking Section */}
      <div className="container booking-section">
        <h2 className="section-title">Lịch Chiếu & Đặt Vé</h2>
        
        {movieShowtimes.length > 0 ? (
          <div className="booking-card">
            {/* Date Selector */}
            <div className="date-selector">
              <h3 className="step-title"><Calendar size={20} /> Chọn Ngày</h3>
              <div className="date-list">
                {movieShowtimes.map(st => (
                  <button 
                    key={st.date}
                    className={`date-btn ${selectedDate === st.date ? 'active' : ''}`}
                    onClick={() => { setSelectedDate(st.date); setSelectedTime(''); }}
                  >
                    {new Date(st.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Time Selector */}
            {selectedDate && (
              <div className="time-selector animate-fade-in">
                <h3 className="step-title"><Clock size={20} /> Chọn Suất Chiếu</h3>
                <div className="time-list">
                  {currentDayShowtimes.map(tObj => (
                    <button
                      key={tObj.showtimeId}
                      className={`time-btn ${selectedTime?.showtimeId === tObj.showtimeId ? 'active' : ''}`}
                      onClick={() => setSelectedTime(tObj)}
                    >
                      {tObj.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Continue Button */}
            {selectedDate && selectedTime && (
              <div className="booking-action animate-fade-in">
                <button className="btn btn-primary btn-large" onClick={handleBooking}>
                  Tiếp tục chọn ghế
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-showtimes">
            <p>Hiện chưa có lịch chiếu cho phim này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetail;
