import { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  blurRadius?: number;
}

/**
 * LazyImage component with blur placeholder
 * - Shows blurred placeholder while loading
 * - Lazy loads image using native img loading="lazy"
 * - Smooth fade-in animation when loaded
 * - Reduces Largest Contentful Paint (LCP)
 * - Handles re-renders properly by using a unique key when src changes
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  containerClassName = '',
  blurRadius = 20
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imageKey, setImageKey] = useState(src);

  useEffect(() => {
    // When src changes, reset loaded state and force re-render of img element
    setIsLoaded(false);
    setError(false);
    setImageKey(src);
  }, [src]);

  return (
    <div className={containerClassName}>
      {/* Placeholder blur — shown while loading */}
      {!isLoaded && !error && (
        <div 
          className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse"
          style={{ filter: `blur(${blurRadius}px)` }}
        />
      )}

      {/* Main image — key changes force complete re-mount to ensure fresh load */}
      <img
        key={imageKey}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`${className} ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300`}
      />

      {/* Error fallback */}
      {error && (
        <div className={`${className} bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center`}>
          <span className="text-xs text-neutral-400">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
