import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import ImgWithFallback from './ImgWithFallback';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  return (
    <div className="movie-card animate-fade-in">
      <div className="movie-poster-container">
        <ImgWithFallback src={movie.poster} alt={movie.title} className="movie-poster" />
        <div className="movie-overlay">
          <Link to={`/movie/${movie.id || movie._id}`} className="btn btn-primary">Đặt Vé Ngay</Link>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
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
  );
};

export default MovieCard;
