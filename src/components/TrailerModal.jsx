import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './TrailerModal.css';

const TrailerModal = ({ isOpen, onClose, videoId, title }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="trailer-overlay animate-fade-in" onClick={onClose}>
      <div className="trailer-content" onClick={(e) => e.stopPropagation()}>
        <button className="trailer-close" onClick={onClose} aria-label="Đóng trailer">
          <X size={32} />
        </button>
        <div className="video-container">
          {videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={title ? `Trailer - ${title}` : 'YouTube video player'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="no-video">Video không khả dụng</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TrailerModal;
