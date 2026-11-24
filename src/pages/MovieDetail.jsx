import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getStoredMovies, getStoredShowtimes, extractYoutubeId } from '../data/mockData';
import { Play, Clock, Star, Calendar, Ticket, Home as HomeIcon, Film } from 'lucide-react';
import ImgWithFallback from '../components/ImgWithFallback';
import TrailerModal from '../components/TrailerModal';
import './MovieDetail.css';

const getRatedDescription = (ageRating) => {
  switch (ageRating) {
    case 'T18':
      return 'T18 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 18 TUỔI TRỞ LÊN (18+)';
    case 'T16':
      return 'T16 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 16 TUỔI TRỞ LÊN (16+)';
    case 'T13':
      return 'T13 - PHIM ĐƯỢC PHỔ BIẾN ĐẾN NGƯỜI XEM TỪ ĐỦ 13 TUỔI TRỞ LÊN (13+)';
    case 'P':
      return 'P - PHIM ĐƯỢC PHÉP PHỔ BIẾN ĐẾN NGƯỜI XEM Ở MỌI ĐỘ TUỔI';
    default:
      return ageRating || 'Phim chiếu rạp';
  }
};

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookingRef = useRef(null);
  const [moviesList, setMoviesList] = useState(getStoredMovies);
  const [allShowtimes, setAllShowtimes] = useState(getStoredShowtimes);
  const [activeTab, setActiveTab] = useState('detail');

  useEffect(() => {
    const handleMovies = () => setMoviesList(getStoredMovies());
    const handleShowtimes = () => setAllShowtimes(getStoredShowtimes());
    window.addEventListener("moviesChange", handleMovies);
    window.addEventListener("showtimesChange", handleShowtimes);
    const handleStorage = (e) => {
      if (!e.key || e.key === "cinevite_movies") handleMovies();
      if (!e.key || e.key === "cinevite_showtimes") handleShowtimes();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("moviesChange", handleMovies);
      window.removeEventListener("showtimesChange", handleShowtimes);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const movie = moviesList.find(m => String(m.id || m._id) === String(id));
  const movieShowtimes = useMemo(() => {
    const mId = movie?.id;
    const m_Id = movie?._id;
    return (
      allShowtimes[id] ||
      (mId && allShowtimes[mId]) ||
      (mId && allShowtimes[String(mId)]) ||
      (m_Id && allShowtimes[m_Id]) ||
      (m_Id && allShowtimes[String(m_Id)]) ||
      []
    );
  }, [allShowtimes, id, movie]);
  
  const [selectedDate, setSelectedDate] = useState(movieShowtimes[0]?.date || '');
  const [selectedTime, setSelectedTime] = useState(null); // Lưu nguyên object { time, showtimeId }
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  useEffect(() => {
    if (movieShowtimes.length > 0 && !selectedDate) {
      setSelectedDate(movieShowtimes[0].date);
    }
  }, [movieShowtimes, selectedDate]);

  useEffect(() => {
    if (location.search.includes('book=1') || location.hash === '#booking-section') {
      setTimeout(() => {
        bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, location.search, location.hash]);

  if (!movie) {
    return (
      <div className="container" style={{ marginTop: '100px', textAlign: 'center' }}>
        <h2>Không tìm thấy phim</h2>
        <Link to="/" className="btn btn-primary">Về Trang Chủ</Link>
      </div>
    );
  }

  const videoId = extractYoutubeId(movie.trailerUrl);

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      navigate(`/book/${id}?date=${selectedDate}&time=${selectedTime.time}&showtimeId=${selectedTime.showtimeId}`);
    }
  };

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentDayShowtimes = movieShowtimes.find(st => st.date === selectedDate)?.times || [];

  return (
    <div className="movie-detail">
      {/* Breadcrumb & Header */}
      <div className="container detail-breadcrumb">
        <Link to="/" className="breadcrumb-link" aria-label="Trang chủ">
          <HomeIcon size={15} />
        </Link>
        <span className="breadcrumb-sep">&rsaquo;</span>
        <Link to="/movies" className="breadcrumb-link">Phim</Link>
        <span className="breadcrumb-sep">&rsaquo;</span>
        <span className="breadcrumb-current">{movie.title}</span>
      </div>

      {/* Main CGV-style Movie Content */}
      <div className="container detail-wrapper">
        <h2 className="detail-page-heading">Nội Dung Phim</h2>

        <div className="detail-content">
          <div className="detail-poster-container" onClick={() => videoId && setIsTrailerOpen(true)} title={videoId ? 'Bấm để xem Trailer' : ''}>
            <ImgWithFallback src={movie.poster} alt={movie.title} className="detail-poster" />
            {videoId && (
              <div className="detail-poster-play">
                <span className="detail-poster-play-btn">
                  <Play size={26} fill="currentColor" />
                </span>
              </div>
            )}
          </div>

          <div className="detail-info">
            <h1 className="detail-title">{movie.title}</h1>

            <div className="detail-specs">
              <div className="spec-row">
                <span className="spec-label">Đạo diễn:</span>
                <span className="spec-value">{movie.director || 'Đang cập nhật'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Diễn viên:</span>
                <span className="spec-value">{Array.isArray(movie.cast) ? movie.cast.join(', ') : (movie.cast || 'Đang cập nhật')}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Thể loại:</span>
                <span className="spec-value">{Array.isArray(movie.genre) ? movie.genre.join(', ') : (movie.genre || 'Phim chiếu rạp')}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Khởi chiếu:</span>
                <span className="spec-value">{movie.releaseDate || 'Đang cập nhật'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Thời lượng:</span>
                <span className="spec-value">{typeof movie.duration === 'number' ? `${movie.duration} phút` : movie.duration}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Ngôn ngữ:</span>
                <span className="spec-value">{movie.language || 'Phụ đề Tiếng Việt'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Rated:</span>
                <span className="spec-value spec-rated">{getRatedDescription(movie.ageRating)}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Đánh giá:</span>
                <span className="spec-value spec-rating">
                  <Star size={15} className="star-icon" fill="currentColor" />
                  {typeof movie.rating === 'object' && movie.rating?.average ? `${movie.rating.average}/10` : (movie.rating || '8.5/10')}
                </span>
              </div>
            </div>

            <div className="detail-badges">
              {movie.ageRating && <span className="badge age-badge">{movie.ageRating}</span>}
              {movie.format && <span className="badge format-badge">{Array.isArray(movie.format) ? movie.format.join(', ') : movie.format}</span>}
              {movie.language && <span className="badge lang-badge">{movie.language}</span>}
            </div>

            <div className="detail-actions">
              <button type="button" className="btn btn-primary btn-buy-ticket" onClick={scrollToBooking}>
                <Ticket size={18} /> Mua Vé Ngay
              </button>
              <button type="button" className="btn btn-secondary trailer-btn" onClick={() => setIsTrailerOpen(true)}>
                <Play size={18} fill="currentColor" /> Xem Trailer
              </button>
            </div>
          </div>
        </div>

        {/* CGV-style Detail / Trailer Tabs */}
        <div className="detail-tabs-bar">
          <div className="detail-ribbon">
            <button
              type="button"
              className={`ribbon-tab ${activeTab === 'detail' ? 'active' : ''}`}
              onClick={() => setActiveTab('detail')}
            >
              <Film size={15} /> Chi tiết
            </button>
            <span className="ribbon-divider">|</span>
            <button
              type="button"
              className={`ribbon-tab ${activeTab === 'trailer' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('trailer');
                setIsTrailerOpen(true);
              }}
            >
              <Play size={14} /> Trailer
            </button>
          </div>
        </div>

        <div className="detail-synopsis-box">
          <p>{movie.synopsis || 'Nội dung đang được cập nhật...'}</p>
        </div>
      </div>

      <TrailerModal 
        isOpen={isTrailerOpen} 
        onClose={() => setIsTrailerOpen(false)} 
        videoId={videoId}
        title={movie.title}
      />

      {/* Booking Section */}
      <div id="booking-section" ref={bookingRef} className="container booking-section">
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
                    onClick={() => { setSelectedDate(st.date); setSelectedTime(null); }}
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
