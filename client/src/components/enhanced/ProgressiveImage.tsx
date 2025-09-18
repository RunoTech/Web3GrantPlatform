import { useState, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  placeholderClassName?: string;
}

export default function ProgressiveImage({
  src,
  alt,
  className = "",
  fallbackIcon,
  placeholderClassName = "bg-muted"
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
  };

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading State */}
      {(!isLoaded || hasError) && (
        <div className={`absolute inset-0 flex items-center justify-center ${placeholderClassName} ${
          !isLoaded && !hasError ? 'animate-pulse' : ''
        }`}>
          {hasError ? (
            fallbackIcon || <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground" />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-muted-foreground/20 rounded animate-pulse" />
          )}
        </div>
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
}