import React from 'react';
import { X } from 'lucide-react';
import './TrailerModal.css';

const TrailerModal = ({ isOpen, onClose, videoId }) => {
  if (!isOpen) return null;

  return (
    <div className="trailer-overlay animate-fade-in">
      <div className="trailer-content">
        <button className="trailer-close" onClick={onClose} aria-label="Đóng trailer">
          <X size={32} />
        </button>
        <div className="video-container">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="no-video">Video không khả dụng</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
