import React from 'react';

interface RecipeDetailSkeletonProps {
  className?: string;
}

export default function RecipeDetailSkeleton({ className = '' }: RecipeDetailSkeletonProps) {
  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${className}`} data-testid="recipe-detail-skeleton">
      <div className="animate-pulse">
        {/* Back Button Skeleton */}
        <div className="h-10 bg-gray-200 rounded-lg w-24 mb-6"></div>

        {/* Recipe Header Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="bg-gray-300 h-64 md:h-80 lg:h-96"></div>
          <div className="p-6">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>

        {/* Recipe Info Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex flex-col items-center sm:items-start">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Ingredients Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-3">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center py-2">
                  <div className="h-4 bg-gray-200 rounded flex-1 mr-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Rating Skeleton */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="flex items-center space-x-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="w-8 h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start py-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share Button Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 