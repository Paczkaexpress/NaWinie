import React from 'react';

interface PrepTimeDisplayProps {
  prepTime: number;
  className?: string;
}

export function PrepTimeDisplay({ prepTime, className = '' }: PrepTimeDisplayProps) {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} godz.`;
    }
    return `${hours} godz. ${remainingMinutes} min`;
  };

  return (
    <div className={`flex items-center text-gray-600 ${className}`}>
      <svg 
        className="w-5 h-5 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      <span className="text-sm font-medium">
        {formatTime(prepTime)}
      </span>
    </div>
  );
}

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
  className?: string;
}

export function DifficultyBadge({ difficulty, className = '' }: DifficultyBadgeProps) {
  const getDifficultyConfig = (level: 'easy' | 'medium' | 'hard') => {
    switch (level) {
      case 'easy':
        return {
          text: 'Łatwy',
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'medium':
        return {
          text: 'Średni',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'hard':
        return {
          text: 'Trudny',
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      default:
        return {
          text: 'Nieznany',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const config = getDifficultyConfig(difficulty);

  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className} ${className}`}
    >
      {config.text}
    </span>
  );
}

interface RatingDisplayProps {
  averageRating: number;
  totalVotes: number;
  className?: string;
}

export function RatingDisplay({ averageRating, totalVotes, className = '' }: RatingDisplayProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <svg 
            key={i} 
            className="w-5 h-5 text-yellow-400 fill-current" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <svg 
            key={i} 
            className="w-5 h-5 text-yellow-400" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`half-star-${i}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path 
              fill={`url(#half-star-${i})`}
              stroke="currentColor"
              strokeWidth="1"
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
          </svg>
        );
      } else {
        // Empty star
        stars.push(
          <svg 
            key={i} 
            className="w-5 h-5 text-gray-300 fill-current" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      }
    }
    
    return stars;
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center mr-2">
        {renderStars(averageRating)}
      </div>
      <span className="text-sm text-gray-600">
        {averageRating.toFixed(1)} ({totalVotes} {totalVotes === 1 ? 'ocena' : 'ocen'})
      </span>
    </div>
  );
} 