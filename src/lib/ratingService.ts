// Shared rating service to manage recipe ratings across the application
interface RatingData {
  total_votes: number;
  sum_ratings: number;
  average_rating: number;
}

// Storage keys for localStorage
const RATING_STORAGE_KEY = 'na_winie_ratings';
const USER_RATINGS_KEY = 'na_winie_user_ratings';

// Server-side in-memory storage (fallback when localStorage not available)
let serverRatingStorage: Record<string, RatingData> = {};
let serverUserRatings: Record<string, Record<string, number>> = {};

export class RatingService {
  // Check if we're in browser environment
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Get rating storage from localStorage (browser) or memory (server)
  private static getRatingStorage(): Record<string, RatingData> {
    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem(RATING_STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    } else {
      // Server-side: use in-memory storage
      return serverRatingStorage;
    }
  }

  // Save rating storage to localStorage (browser) or memory (server)
  private static saveRatingStorage(storage: Record<string, RatingData>): void {
    if (this.isBrowser()) {
      try {
        localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(storage));
      } catch (error) {
        console.error('Failed to save rating storage:', error);
      }
    } else {
      // Server-side: save to memory
      serverRatingStorage = { ...storage };
    }
  }

  // Get user ratings from localStorage (browser) or memory (server)
  private static getUserRatingsStorage(): Record<string, Record<string, number>> {
    if (this.isBrowser()) {
      try {
        const stored = localStorage.getItem(USER_RATINGS_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    } else {
      // Server-side: use in-memory storage
      return serverUserRatings;
    }
  }

  // Save user ratings to localStorage (browser) or memory (server)
  private static saveUserRatingsStorage(storage: Record<string, Record<string, number>>): void {
    if (this.isBrowser()) {
      try {
        localStorage.setItem(USER_RATINGS_KEY, JSON.stringify(storage));
      } catch (error) {
        console.error('Failed to save user ratings storage:', error);
      }
    } else {
      // Server-side: save to memory
      serverUserRatings = { ...storage };
    }
  }

  // Sync server storage with client storage (call this from client-side)
  static syncWithClient(): void {
    if (!this.isBrowser()) return;
    
    try {
      // Get client storage
      const clientRatings = this.getRatingStorage();
      const clientUserRatings = this.getUserRatingsStorage();
      
      // This method is mainly for future use when we implement proper sync
      console.log('Client ratings synced:', Object.keys(clientRatings).length, 'recipes');
    } catch (error) {
      console.error('Failed to sync ratings:', error);
    }
  }

  // Initialize rating data for a recipe if it doesn't exist
  static initializeRating(recipeId: string, initialRating: number = 0, initialVotes: number = 0): void {
    const storage = this.getRatingStorage();
    if (!storage[recipeId]) {
      storage[recipeId] = {
        total_votes: initialVotes,
        sum_ratings: initialVotes * initialRating,
        average_rating: initialRating
      };
      this.saveRatingStorage(storage);
    }
  }

  // Get current rating data for a recipe
  static getRating(recipeId: string): RatingData | null {
    const storage = this.getRatingStorage();
    return storage[recipeId] || null;
  }

  // Submit a new rating for a recipe
  static submitRating(recipeId: string, userId: string, rating: number): RatingData | null {
    const userRatings = this.getUserRatingsStorage();
    
    // Check if user already rated this recipe
    if (!userRatings[recipeId]) {
      userRatings[recipeId] = {};
    }
    
    if (userRatings[recipeId][userId]) {
      throw new Error('User has already rated this recipe');
    }

    // Initialize rating data if it doesn't exist
    let storage = this.getRatingStorage();
    if (!storage[recipeId]) {
      this.initializeRating(recipeId, 0, 0);
      // Get fresh storage data after initialization
      storage = this.getRatingStorage();
    }

    // Add the new rating
    userRatings[recipeId][userId] = rating;
    const currentData = storage[recipeId];
    
    // Make sure currentData exists (it should after initialization)
    if (!currentData) {
      console.error('Rating initialization failed for recipe:', recipeId);
      console.error('Storage state:', storage);
      throw new Error('Failed to initialize rating data');
    }
    
    const newTotalVotes = currentData.total_votes + 1;
    const newSumRatings = currentData.sum_ratings + rating;
    const newAverageRating = newSumRatings / newTotalVotes;

    storage[recipeId] = {
      total_votes: newTotalVotes,
      sum_ratings: newSumRatings,
      average_rating: Math.round(newAverageRating * 10) / 10 // Round to 1 decimal place
    };

    // Save both storage objects
    this.saveRatingStorage(storage);
    this.saveUserRatingsStorage(userRatings);

    return storage[recipeId];
  }

  // Check if a user has rated a specific recipe
  static hasUserRated(recipeId: string, userId: string): boolean {
    const userRatings = this.getUserRatingsStorage();
    return !!(userRatings[recipeId] && userRatings[recipeId][userId]);
  }

  // Get user's rating for a specific recipe
  static getUserRating(recipeId: string, userId: string): number | null {
    const userRatings = this.getUserRatingsStorage();
    return userRatings[recipeId]?.[userId] || null;
  }

  // Get all rating data (for debugging/admin purposes)
  static getAllRatings(): Record<string, RatingData> {
    return this.getRatingStorage();
  }

  // Clear all ratings (for testing purposes)
  static clearAllRatings(): void {
    if (this.isBrowser()) {
      try {
        localStorage.removeItem(RATING_STORAGE_KEY);
        localStorage.removeItem(USER_RATINGS_KEY);
      } catch (error) {
        console.error('Failed to clear ratings storage:', error);
      }
    } else {
      // Server-side: clear memory storage
      serverRatingStorage = {};
      serverUserRatings = {};
    }
  }

  // Get debug info
  static getDebugInfo(): any {
    return {
      isBrowser: this.isBrowser(),
      ratingCount: Object.keys(this.getRatingStorage()).length,
      userRatingCount: Object.keys(this.getUserRatingsStorage()).length,
      serverRatingCount: Object.keys(serverRatingStorage).length,
      serverUserRatingCount: Object.keys(serverUserRatings).length
    };
  }
} 