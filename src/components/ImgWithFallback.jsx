import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const ImgWithFallback = ({ src, alt, className }) => {
  const [hasError, setHasError] = useState(false);

  return (
    hasError ? (
      <div className={`${className} fallback-img`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#94a3b8' }}>
        <ImageIcon size={48} />
      </div>
    ) : (
      <img
        src={src}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    )
  );
};

export default ImgWithFallback;
