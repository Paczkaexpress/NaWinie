import type {
  Users,
  Ingredients,
  Recipes,
  RecipeIngredients,
  UserDefaultIngredients,
  RecipeViews,
  IngredientPopularity,
} from '../database.types';

// === Generic Types ===

/** Represents the pagination information returned by list endpoints. */
export type PaginationInfo = {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
};

/** Generic structure for paginated API responses. */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationInfo;
};

// === Authentication ===

/** Command model for user registration. */
export type RegisterUserCommand = Pick<Users, 'email'> & {
  /** User's desired password */
  password: string;
};

/** Command model for user login. */
export type LoginUserCommand = Pick<Users, 'email'> & {
  /** User's password */
  password: string;
};

/** DTO for the authentication token returned upon successful login. */
export type AuthTokenDto = {
  access_token: string;
  token_type: "bearer";
};

// === Users ===

/** DTO representing a user's public profile information. */
export type UserDto = Pick<Users, 'id' | 'email' | 'created_at' | 'updated_at'>;

/** Command model for updating user profile information. */
export type UpdateUserCommand = Partial<Pick<Users, 'email'>>;

// === Ingredients ===

/** DTO representing a single ingredient. */
export type IngredientDto = Ingredients;

/** Paginated response DTO for a list of ingredients. */
export type PaginatedIngredientsDto = PaginatedResponse<IngredientDto>;

/** DTO representing a popular ingredient, combining base ingredient data with popularity stats. */
export type PopularIngredientDto = Ingredients & Pick<IngredientPopularity, 'search_count' | 'last_updated'>;

/** Paginated response DTO for a list of popular ingredients. */
export type PaginatedPopularIngredientsDto = PaginatedResponse<PopularIngredientDto>;

/** Command model for creating a new ingredient. */
export type CreateIngredientCommand = Pick<Ingredients, 'name' | 'unit_type'>;

// === User Default Ingredients ===

/** DTO representing an ingredient marked as default by the user, including joined details. */
export type UserDefaultIngredientDto = Pick<UserDefaultIngredients, 'ingredient_id' | 'created_at'> & Pick<Ingredients, 'name' | 'unit_type'>;

/** Command model for adding an ingredient to the user's default list. */
export type AddUserDefaultIngredientCommand = Pick<UserDefaultIngredients, 'ingredient_id'>;

/** DTO confirming the addition of a default ingredient for a user. */
export type UserDefaultIngredientAddedDto = Pick<UserDefaultIngredients, 'user_id' | 'ingredient_id' | 'created_at'>;

// === Recipes ===

/** DTO representing a recipe item in a list view (omits detailed steps/ingredients). */
export type RecipeListItemDto = Omit<Recipes, 'steps'> & {
  image_data?: string; // Base64 encoded image data
};

/** Paginated response DTO for a list of recipes. */
export type PaginatedRecipesDto = PaginatedResponse<RecipeListItemDto>;

/** Represents a single step in a recipe's preparation instructions. */
export type RecipeStep = {
  step: number;
  description: string;
};

/** Command model for specifying an ingredient when creating/updating a recipe. */
export type CreateRecipeIngredientCommand = Pick<
  RecipeIngredients,
  'ingredient_id' | 'amount' | 'is_optional' | 'substitute_recommendation'
>;

/** Command model for creating a new recipe. */
export type CreateRecipeCommand = Pick<Recipes, 'name' | 'preparation_time_minutes' | 'complexity_level'> & {
  steps: RecipeStep[];
  ingredients: CreateRecipeIngredientCommand[];
};

/** DTO representing a specific ingredient used within a recipe, including joined details. */
export type RecipeIngredientDto = RecipeIngredients & Pick<Ingredients, 'name' | 'unit_type'>;

/** DTO representing the full details of a recipe, including steps and ingredients. */
export type RecipeDetailDto = Omit<Recipes, 'steps'> & {
  steps: RecipeStep[];
  ingredients: RecipeIngredientDto[];
  image_data?: string; // Base64 encoded image data
};

/** Command model for updating an existing recipe (allows partial updates). */
export type UpdateRecipeCommand = Partial<CreateRecipeCommand>;

/** Command model for submitting a rating for a recipe. */
export type RateRecipeCommand = {
  /** The rating value (e.g., 1-5) */
  rating: number;
};

/** DTO representing the updated rating status of a recipe after a vote. */
export type RecipeRatingDto = {
  average_rating: number;
  total_votes: number;
};

// === Recipe Views ===

/** DTO representing a recorded recipe view event. */
export type RecipeViewDto = {
  /** The unique ID of the view record */
  view_id: string;
} & Pick<RecipeViews, 'recipe_id' | 'user_id' | 'view_start'>;

/** DTO representing an item in the user's recipe view history, including joined recipe name. */
export type UserRecipeViewHistoryItemDto = Pick<RecipeViews, 'id' | 'recipe_id' | 'view_start' | 'view_end' | 'created_at'> & {
  /** The name of the viewed recipe */
  recipe_name: string;
};

/** Paginated response DTO for the user's recipe view history. */
export type PaginatedUserRecipeViewHistoryDto = PaginatedResponse<UserRecipeViewHistoryItemDto>;

// === Add Recipe Form Types ===

/** Form data for creating a new recipe */
export type CreateRecipeFormData = {
  name: string;
  preparation_time_minutes: number;
  complexity_level: 'easy' | 'medium' | 'hard';
  steps: RecipeStepFormData[];
  ingredients: RecipeIngredientFormData[];
  image?: File;
};

/** Ingredient data in the form */
export type RecipeIngredientFormData = {
  ingredient_id: string;
  amount: number;
  is_optional: boolean;
  substitute_recommendation: string | null;
};

/** Step data in the form */
export type RecipeStepFormData = {
  step: number;
  description: string;
};

/** Basic recipe information section */
export type BasicRecipeInfo = {
  name: string;
  preparation_time_minutes: number;
  complexity_level: 'easy' | 'medium' | 'hard';
};

/** Form validation state */
export type FormValidationState = {
  name: string | null;
  preparation_time_minutes: string | null;
  complexity_level: string | null;
  steps: Array<string | null>;
  ingredients: Array<{
    ingredient_id: string | null;
    amount: string | null;
    substitute_recommendation: string | null;
  }>;
  image: string | null;
  general: string | null;
};

/** Image preview data */
export type ImagePreview = {
  file: File;
  url: string;
};

// Recipe Detail View Types
export type RecipeDetailViewState = {
  recipe: RecipeDetailDto | null;
  isLoading: boolean;
  error: string | null;
  isRatingLoading: boolean;
  ratingError: string | null;
};

export type RecipeRatingState = {
  hasRated: boolean;
  currentUserRating?: number;
  isSubmitting: boolean;
};

// === Recipe Management View Types (new) ===

/** Props for the main recipe management view */
export type RecipeManagementViewProps = {
  recipeId: string;
  initialRecipe?: RecipeDetailDto;
  currentUser: UserDto;
};

/** State for recipe management view */
export type RecipeManagementState = {
  recipe: RecipeDetailDto | null;
  isLoading: boolean;
  error: string | null;
  isEditModalOpen: boolean;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
};

/** Props for recipe management header */
export type RecipeHeaderProps = {
  recipe: RecipeDetailDto;
  isAuthor: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
};

/** Props for recipe details section */
export type RecipeDetailsSectionProps = {
  recipe: RecipeDetailDto;
  isEditable: boolean;
};

/** Props for recipe rating section */
export type RecipeRatingSectionProps = {
  recipeId: string;
  currentRating: RecipeRatingDto;
  isAuthor: boolean;
  hasUserRated: boolean;
  onRatingSubmit: (rating: number) => Promise<void>;
};

/** State for rating component */
export type RatingComponentState = {
  selectedRating: number;
  isSubmitting: boolean;
  error: string | null;
};

/** Props for recipe edit modal */
export type RecipeEditModalProps = {
  isOpen: boolean;
  recipe: RecipeDetailDto;
  onSave: (data: UpdateRecipeCommand) => Promise<void>;
  onCancel: () => void;
};

/** Form data for editing a recipe */
export type EditRecipeFormData = {
  name: string;
  preparation_time_minutes: number;
  complexity_level: 'easy' | 'medium' | 'hard';
  steps: RecipeStepFormData[];
  ingredients: RecipeIngredientFormData[];
};

/** Validation state for edit form */
export type EditFormValidationState = {
  name: string | null;
  preparation_time_minutes: string | null;
  complexity_level: string | null;
  steps: Array<string | null>;
  ingredients: Array<{
    ingredient_id: string | null;
    amount: string | null;
  }>;
  general: string | null;
}; 