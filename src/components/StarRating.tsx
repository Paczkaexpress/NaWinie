import React, { useState, useCallback, useMemo, memo } from 'react';

interface StarRatingProps {
  currentRating?: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StarRating = memo(function StarRating({ 
  currentRating = 0, 
  onRate, 
  disabled = false,
  size = 'md',
  className = '' 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const sizeClasses = useMemo(() => ({
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }), []);

  const handleMouseEnter = useCallback((rating: number) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (!disabled) {
      setHoverRating(0);
    }
  }, [disabled]);

  const handleClick = useCallback((rating: number) => {
    if (!disabled) {
      onRate(rating);
    }
  }, [disabled, onRate]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, rating: number) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRate(rating);
    }
  }, [disabled, onRate]);

  const getStarColor = useCallback((starIndex: number) => {
    const activeRating = hoverRating || currentRating;
    
    if (disabled) {
      return starIndex <= currentRating ? 'text-gray-400' : 'text-gray-200';
    }
    
    if (starIndex <= activeRating) {
      return hoverRating > 0 ? 'text-yellow-500' : 'text-yellow-400';
    }
    
    return 'text-gray-300';
  }, [hoverRating, currentRating, disabled]);

  const stars = useMemo(() => 
    [1, 2, 3, 4, 5].map((starIndex) => (
      <button
        key={starIndex}
        type="button"
        disabled={disabled}
        className={`
          ${sizeClasses[size]} 
          ${getStarColor(starIndex)} 
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'} 
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded
        `}
        onMouseEnter={() => handleMouseEnter(starIndex)}
        onClick={() => handleClick(starIndex)}
        onKeyDown={(e) => handleKeyDown(e, starIndex)}
        aria-label={`Oceń ${starIndex} ${starIndex === 1 ? 'gwiazdkę' : 'gwiazdek'}`}
        title={`Oceń ${starIndex} ${starIndex === 1 ? 'gwiazdkę' : 'gwiazdek'}`}
      >
        <svg
          className="w-full h-full fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </button>
    ))
  , [sizeClasses, size, getStarColor, disabled, handleMouseEnter, handleClick, handleKeyDown]);

  const hoverText = useMemo(() => {
    if (hoverRating > 0 && !disabled) {
      return `${hoverRating} ${hoverRating === 1 ? 'gwiazdka' : 'gwiazdek'}`;
    }
    return null;
  }, [hoverRating, disabled]);

  return (
    <div 
      className={`flex items-center space-x-1 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      {stars}
      
      {hoverText && (
        <span className="ml-2 text-sm text-gray-600 font-medium">
          {hoverText}
        </span>
      )}
    </div>
  );
});

export default StarRating; 