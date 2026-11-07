import { useState } from 'react';

/**
 * Hotel photo with a graceful branded fallback if the remote image fails
 * to load (no broken-image icons anywhere).
 */
export default function HotelImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700 ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg viewBox="0 0 24 24" className="h-1/3 w-1/3 max-h-16 max-w-16 text-white/80" fill="currentColor" aria-hidden="true">
          <path d="M2 20h20v2H2zM3 18V6a1 1 0 011-1h7a1 1 0 011 1v3h2V8a1 1 0 011-1h5a1 1 0 011 1v10zM6 8h2v2H6zm0 4h2v2H6zm4-4h2v2h-2zm0 4h2v2h-2zm7 0h2v2h-2zm0-4h2v2h-2z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
