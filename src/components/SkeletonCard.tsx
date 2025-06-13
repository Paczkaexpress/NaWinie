import React from "react";

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse border rounded-lg overflow-hidden bg-muted">
    <div className="h-40 bg-gray-300" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4" />
      <div className="h-3 bg-gray-300 rounded w-1/2" />
      <div className="h-3 bg-gray-300 rounded w-1/3" />
    </div>
  </div>
);

export default SkeletonCard; 