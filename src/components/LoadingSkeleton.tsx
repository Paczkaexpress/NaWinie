import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'circle' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  className = '',
  animate = true
}) => {
  const baseClasses = 'bg-gray-200 rounded';
  const animationClasses = animate ? 'animate-pulse' : '';
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded';
      case 'text':
        return 'rounded h-4';
      case 'card':
        return 'rounded-lg';
      default:
        return 'rounded';
    }
  };

  const getDefaultHeight = () => {
    if (height) return height;
    switch (variant) {
      case 'text':
        return '1rem';
      case 'circle':
        return width;
      case 'card':
        return '12rem';
      default:
        return '2rem';
    }
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof getDefaultHeight() === 'number' ? `${getDefaultHeight()}px` : getDefaultHeight(),
  };

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${animationClasses} ${className}`}
      style={style}
    />
  );
};

// Recipe-specific skeleton components
export const RecipeHeaderSkeleton: React.FC = () => (
  <div className="mb-8">
    <div className="mb-4">
      <LoadingSkeleton width="4rem" height="1.5rem" />
    </div>
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
      <div className="flex-1">
        <LoadingSkeleton height="2.5rem" className="mb-4" />
        <div className="flex flex-wrap items-center gap-4">
          <LoadingSkeleton width="5rem" height="1rem" />
          <LoadingSkeleton width="4rem" height="1.5rem" />
          <LoadingSkeleton width="8rem" height="1rem" />
          <LoadingSkeleton width="10rem" height="1rem" />
        </div>
      </div>
      <div className="flex gap-3">
        <LoadingSkeleton width="5rem" height="2.5rem" />
        <LoadingSkeleton width="5rem" height="2.5rem" />
      </div>
    </div>
    <div className="mt-6 h-px bg-gray-200"></div>
  </div>
);

export const RecipeDetailsSkeleton: React.FC = () => (
  <div className="space-y-8">
    {/* Image skeleton */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <LoadingSkeleton height="1.5rem" width="8rem" className="mb-4" />
      <LoadingSkeleton variant="rectangular" height="24rem" />
    </div>

    {/* Ingredients skeleton */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <LoadingSkeleton height="1.5rem" width="10rem" className="mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <LoadingSkeleton variant="circle" width="0.5rem" height="0.5rem" />
                <LoadingSkeleton width="8rem" height="1rem" />
              </div>
              <LoadingSkeleton width="4rem" height="1rem" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Steps skeleton */}
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <LoadingSkeleton height="1.5rem" width="12rem" className="mb-4" />
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <LoadingSkeleton variant="circle" width="2rem" height="2rem" />
            <div className="flex-1 space-y-2">
              <LoadingSkeleton height="1rem" />
              <LoadingSkeleton height="1rem" width="80%" />
              <LoadingSkeleton height="1rem" width="60%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const RecipeRatingSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <LoadingSkeleton height="1.5rem" width="8rem" className="mb-4" />
    <div className="mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} variant="circle" width="1.5rem" height="1.5rem" />
            ))}
          </div>
          <LoadingSkeleton width="3rem" height="1.5rem" />
        </div>
        <LoadingSkeleton width="6rem" height="1rem" />
      </div>
    </div>
    <div className="space-y-4">
      <LoadingSkeleton height="1rem" width="12rem" />
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <LoadingSkeleton key={i} variant="circle" width="2rem" height="2rem" />
        ))}
      </div>
      <LoadingSkeleton width="8rem" height="2.5rem" />
    </div>
  </div>
);

export default LoadingSkeleton; 