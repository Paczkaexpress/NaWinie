import React, { useEffect, useRef, useCallback } from "react";
import type { RecipeListItemDto } from "../types";
import RecipeCard from "./RecipeCard";
import SkeletonCard from "./SkeletonCard";

export interface RecipeGridProps {
  recipes: RecipeListItemDto[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

const RecipeGrid: React.FC<RecipeGridProps> = ({ recipes, isLoading, hasMore, loadMore }) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    [hasMore, isLoading, loadMore]
  );

  useEffect(() => {
    const current = sentinelRef.current;
    if (!current) return;

    const observer = new IntersectionObserver(handleObserver, { rootMargin: "300px" });
    observer.observe(current);

    return () => {
      observer.unobserve(current);
      observer.disconnect();
    };
  }, [handleObserver]);

  return (
    <section>
      {recipes.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 py-8">Brak przepisów spełniających kryteria.</p>
      )}

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}

        {/* Show skeletons during initial loading */}
        {isLoading && recipes.length === 0 &&
          Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)}
      </div>

      {/* Loading / sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Progress indicator when loading additional pages */}
      {isLoading && recipes.length > 0 && (
        <p className="text-center py-4 text-gray-500">Ładowanie...</p>
      )}
    </section>
  );
};

export default RecipeGrid; 