import React from 'react';

interface RecipeTitleSectionProps {
  name: string;
  className?: string;
}

export default function RecipeTitleSection({ name, className = '' }: RecipeTitleSectionProps) {
  return (
    <div className={`text-center sm:text-left ${className}`}>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
        {name}
      </h1>
    </div>
  );
} 