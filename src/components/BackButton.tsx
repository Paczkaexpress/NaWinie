import React from 'react';

interface BackButtonProps {
  onClick?: () => void;
  className?: string;
}

export default function BackButton({ onClick, className = '' }: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior - go back in history
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // If no history, go to home page
        window.location.href = '/';
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center px-3 py-2 text-sm font-MEDIUM text-gray-700 
        bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        transition-colors duration-200 ${className}
      `}
      aria-label="Wróć do poprzedniej strony"
    >
      <svg 
        className="w-4 h-4 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 19l-7-7 7-7" 
        />
      </svg>
      Wstecz
    </button>
  );
} 