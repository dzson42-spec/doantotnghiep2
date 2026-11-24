import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Play, Ticket, Info } from 'lucide-react';
import ImgWithFallback from './ImgWithFallback';
import TrailerModal from './TrailerModal';
import { extractYoutubeId } from '../data/mockData';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const movieId = movie.id || movie._id;
  const videoId = extractYoutubeId(movie.trailerUrl);

  const getAgeBadgeClass = (age) => {
    if (age === 'T18') return 'age-t18';
    if (age === 'T16') return 'age-t16';
    if (age === 'T13') return 'age-t13';
    return 'age-p';
  };

  return (
    <>
      <div className="movie-card animate-fade-in">
        <div className="movie-poster-container">
          {movie.ageRating && (
            <span className={`card-age-badge ${getAgeBadgeClass(movie.ageRating)}`}>
              {movie.ageRating}
            </span>
          )}
          <Link to={`/movie/${movieId}`} className="movie-poster-link">
            <ImgWithFallback src={movie.poster} alt={movie.title} className="movie-poster" />
          </Link>
          <div className="movie-overlay">
            {videoId && (
              <button
                type="button"
                className="card-play-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsTrailerOpen(true);
                }}
                aria-label={`Xem trailer ${movie.title}`}
                title="Xem Trailer"
              >
                <Play size={26} fill="currentColor" />
              </button>
            )}
            <div className="card-overlay-actions">
              <Link to={`/movie/${movieId}`} className="card-action-btn detail-btn">
                <Info size={14} /> Xem Chi Tiết
              </Link>
              <Link to={`/movie/${movieId}?book=1#booking-section`} className="card-action-btn buy-btn">
                <Ticket size={14} /> Mua Vé
              </Link>
            </div>
          </div>
        </div>
        <div className="movie-info">
          <Link to={`/movie/${movieId}`} className="movie-title-link">
            <h3 className="movie-title" title={movie.title}>{movie.title}</h3>
          </Link>
          <p className="movie-genre">{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || 'Phim chiếu rạp'}</p>
          <div className="movie-meta">
            <span className="meta-item">
              <Clock size={14} className="meta-icon" />
              {typeof movie.duration === 'number' ? `${movie.duration} phút` : movie.duration}
            </span>
            <span className="meta-item">
              <Star size={14} className="meta-icon star-icon" />
              {typeof movie.rating === 'object' && movie.rating?.average ? `${movie.rating.average}/10` : (movie.rating || '8.5/10')}
            </span>
          </div>
        </div>
      </div>

      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        videoId={videoId}
        title={movie.title}
      />
    </>
  );
};

export default MovieCard;
