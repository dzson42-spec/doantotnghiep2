import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Clock, Ticket } from 'lucide-react';
import { getStoredMovies } from '../data/mockData';
import MovieCard from '../components/MovieCard';
import ImgWithFallback from '../components/ImgWithFallback';
import TrailerModal from '../components/TrailerModal';
import './Home.css';

const Home = () => {
  const [moviesList, setMoviesList] = useState(getStoredMovies);

  useEffect(() => {
    const handleMovies = () => setMoviesList(getStoredMovies());
    window.addEventListener("moviesChange", handleMovies);
    return () => window.removeEventListener("moviesChange", handleMovies);
  }, []);

  const showingMovies = moviesList.filter(m => m.status === 'showing');
  const upcomingMovies = moviesList.filter(m => m.status === 'upcoming');
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  
  // Extract Youtube ID from mockup
  const heroMovie = showingMovies[0] || moviesList[0];
  const trailerId = heroMovie?.trailerUrl?.includes("v=")
    ? heroMovie.trailerUrl.split("v=")[1]?.split("&")[0]
    : heroMovie?.id === 1 ? 'Way9Dexny3w' : heroMovie?.id === 2 ? '5C1Jm427eF0' : 'lV1OOlGwExM';

  const heroPosterUrl = heroMovie?.poster || heroMovie?.backdrop;
  const heroBackdropUrl = heroMovie?.backdrop || heroMovie?.poster;

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-backdrop">
          <img
            className="hero-backdrop-img"
            src={heroBackdropUrl}
            alt={heroMovie?.title || ''}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (heroMovie?.poster && e.target.src !== heroMovie.poster) {
                e.target.src = heroMovie.poster;
              } else {
                e.target.style.opacity = '0';
              }
            }}
          />
          <div className="hero-overlay"></div>
        </div>

        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badges">
              <span className="hero-badge">Đang chiếu rạp</span>
              {heroMovie?.ageRating && (
                <span className="hero-age-badge">{heroMovie.ageRating}</span>
              )}
              {heroMovie?.format && (
                <span className="hero-format-badge">{heroMovie.format}</span>
              )}
            </div>

            <h1 className="hero-title">{heroMovie?.title}</h1>

            <div className="hero-meta">
              <span className="hero-meta-item">
                <Star size={16} className="star-icon" />
                {typeof heroMovie?.rating === 'object' && heroMovie?.rating?.average
                  ? `${heroMovie.rating.average}/10`
                  : (heroMovie?.rating || '8.5/10')}
              </span>
              <span className="hero-meta-item">
                <Clock size={16} />
                {typeof heroMovie?.duration === 'number'
                  ? `${heroMovie.duration} phút`
                  : (heroMovie?.duration || '120 phút')}
              </span>
              <span className="hero-meta-genre">
                {Array.isArray(heroMovie?.genre)
                  ? heroMovie.genre.join(', ')
                  : (heroMovie?.genre || 'Hành động')}
              </span>
            </div>

            <p className="hero-synopsis">{heroMovie?.synopsis}</p>

            <div className="hero-actions">
              <Link to={`/movie/${heroMovie?.id || heroMovie?._id}`} className="btn btn-primary btn-hero">
                <Ticket size={18} /> Đặt Vé Ngay
              </Link>
              <button className="btn btn-secondary btn-hero" onClick={() => setIsTrailerOpen(true)}>
                <Play size={18} /> Xem Trailer
              </button>
            </div>
          </div>

          {/* Poster của phim hiển thị nổi bật */}
          <div className="hero-poster-wrapper">
            <div className="hero-poster-card" onClick={() => setIsTrailerOpen(true)} title="Bấm để xem Trailer">
              <ImgWithFallback
                src={heroPosterUrl}
                alt={heroMovie?.title}
                className="hero-poster-img"
              />
              <div className="hero-poster-overlay">
                <div className="hero-play-button">
                  <Play size={26} fill="currentColor" />
                </div>
                <span className="hero-play-text">Xem Trailer</span>
              </div>
            </div>
            <div className="hero-poster-glow"></div>
          </div>
        </div>
      </section>

      <TrailerModal isOpen={isTrailerOpen} onClose={() => setIsTrailerOpen(false)} videoId={trailerId} />

      {/* Movies List Section */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Phim Đang Chiếu</h2>
          <Link to="/movies" className="section-link">Xem tất cả</Link>
        </div>
        <div className="movies-grid">
          {showingMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Phim Sắp Chiếu</h2>
          <Link to="/movies" className="section-link">Xem tất cả</Link>
        </div>
        <div className="movies-grid">
          {upcomingMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
