# API Endpoint Implementation Plan: GET /recipes/{recipeId}

## 1. Endpoint Overview
This endpoint retrieves the complete details for a specific recipe identified by its `recipeId`. The details include the recipe's metadata (name, preparation time, complexity, author), a list of preparation steps, and a list of required ingredients with their amounts and details.

## 2. Request Details
- **HTTP Method**: `GET`
- **URL Structure**: `/recipes/{recipeId}`
- **Parameters**:
  - **Required**:
    - `recipeId` (Path Parameter): The unique identifier (UUID) of the recipe to retrieve.
  - **Optional**: None
- **Request Body**: None

## 3. Types Used
- **Response DTO**: `RecipeDetailDto` (defined in `src/types.ts`)
- **Nested Types**:
    - `RecipeStep` (part of `RecipeDetailDto`)
    - `RecipeIngredientDto` (part of `RecipeDetailDto`, joins `RecipeIngredients` and `Ingredients` data)

## 4. Response Details
- **Success (200 OK)**:
  ```json
  {
    "id": "uuid",
    "name": "Simple Pancakes",
    "preparation_time_minutes": 20,
    "complexity_level": "EASY",
    "author_id": "uuid",
    "average_rating": 4.5,
    "total_votes": 15,
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "steps": [
      {"step": 1, "description": "Mix flour, sugar, baking powder, and salt."},
      {"step": 2, "description": "In another bowl, whisk egg, milk, and melted butter."},
      {"step": 3, "description": "Pour wet ingredients into dry ingredients and mix until just combined."},
      {"step": 4, "description": "Heat a lightly oiled griddle or frying pan over MEDIUM-high heat."},
      {"step": 5, "description": "Pour or scoop the batter onto the griddle, using approximately 1/4 cup for each pancake."},
      {"step": 6, "description": "Brown on both sides and serve hot."}
    ],
    "ingredients": [
      {
        "recipe_id": "uuid", // Belongs to RecipeIngredients
        "ingredient_id": "uuid", // Belongs to RecipeIngredients & Ingredients
        "amount": 150, // Belongs to RecipeIngredients
        "is_optional": false, // Belongs to RecipeIngredients
        "substitute_recommendation": null, // Belongs to RecipeIngredients
        "name": "Flour", // Joined from Ingredients
        "unit_type": "g" // Joined from Ingredients
      },
      {
        "recipe_id": "uuid",
        "ingredient_id": "uuid",
        "amount": 1,
        "is_optional": false,
        "substitute_recommendation": "1 tsp vanilla extract",
        "name": "Egg",
        "unit_type": "szt"
      }
      // ... other ingredients
    ]
  }
  ```
- **Error (404 Not Found)**:
  ```json
  {
    "detail": "Recipe not found"
  }
  ```
- **Error (422 Unprocessable Entity)**: (Handled automatically by FastAPI for invalid UUID format)
  ```json
  {
    "detail": [
      {
        "loc": ["path", "recipeId"],
        "msg": "value is not a valid uuid",
        "type": "type_error.uuid"
      }
    ]
  }
  ```
- **Error (500 Internal Server Error)**:
  ```json
  {
    "detail": "Internal server error"
  }
  ```

## 5. Data Flow
1.  Client sends a `GET` request to `/recipes/{recipeId}`.
2.  FastAPI router matches the request to the corresponding handler function.
3.  FastAPI validates the `recipeId` path parameter is a valid UUID. If not, it returns a `422` response.
4.  The handler function calls the `RecipeService.get_recipe_by_id(recipe_id)` method.
5.  The `RecipeService` interacts with the database (via a repository or ORM layer):
    a.  Queries the `recipes` table for the record where `id` matches `recipeId`.
    b.  If no recipe is found, the service raises a "Not Found" exception (e.g., `HTTPException(status_code=404)`).
    c.  If found, queries the `recipe_ingredients` table for all records where `recipe_id` matches the found recipe's ID.
    d.  Performs a JOIN between `recipe_ingredients` and `ingredients` on `ingredient_id` to get the `name` and `unit_type` for each ingredient.
6.  The `RecipeService` parses the `steps` JSONB data from the recipe record into a list of `RecipeStep` objects.
7.  The `RecipeService` constructs the `RecipeDetailDto` using the fetched recipe data, parsed steps, and the list of `RecipeIngredientDto` objects.
8.  The handler function receives the `RecipeDetailDto` from the service.
9.  FastAPI automatically serializes the DTO into a JSON response with a `200 OK` status code.

## 6. Security Considerations
- **Authentication**: Not required. This endpoint is public.
- **Authorization**: Handled by Supabase RLS policy ("Recipes are viewable by everyone"). No application-level checks needed for reading.
- **Input Validation**: `recipeId` format (UUID) is validated by FastAPI. No risk of injection via this parameter.

## 7. Error Handling
- **Recipe Not Found**: If the `RecipeService` cannot find a recipe with the given `recipeId`, it should raise an `HTTPException` with `status_code=404` and a detail message like "Recipe not found".
- **Database Errors**: Any exceptions during database interaction (connection errors, query failures) should be caught and logged. A generic `500 Internal Server Error` response should be returned to the client. Use appropriate logging to capture details.
- **Validation Errors**: Invalid `recipeId` format (non-UUID) will automatically result in a `422 Unprocessable Entity` response from FastAPI.

## 8. Performance Considerations
- **Database Queries**: Ensure efficient querying. The primary query for the recipe by `id` (PK) is fast. The query for `recipe_ingredients` joined with `ingredients` should use the indexes on `recipe_ingredients.recipe_id` and `ingredients.id`.
- **Data Serialization**: FastAPI's Pydantic integration handles efficient serialization. The size of the response depends on the number of steps and ingredients; generally not expected to be a bottleneck unless recipes are extremely complex.
- **Caching**: Consider adding caching (e.g., Redis) at the service layer if this endpoint experiences high traffic for frequently accessed recipes. Cache invalidation would be needed when a recipe is updated (`PUT /recipes/{recipeId}`).

## 9. Implementation Steps
1.  **Define DTOs**: Ensure `RecipeDetailDto`, `RecipeStep`, and `RecipeIngredientDto` are correctly defined in `src/types.ts` (or equivalent Python Pydantic models for the backend).
2.  **Create Service Method**: Implement `RecipeService.get_recipe_by_id(recipe_id: UUID)` in the recipe service module (`src/services/recipe_service.py` or similar).
3.  **Implement Database Logic**: Inside the service method, add logic to query the `recipes` table and the `recipe_ingredients` table (with the join to `ingredients`). Handle the case where the recipe is not found by raising `HTTPException(status_code=404)`.
4.  **Implement Data Mapping**: Map the raw database results to the `RecipeDetailDto`, including parsing the JSONB `steps`.
5.  **Create API Route**: Define the FastAPI route (`@router.get("/recipes/{recipeId}", response_model=RecipeDetailDto)`) in the recipe router module (`src/api/routes/recipes.py` or similar).
6.  **Implement Route Handler**: Write the handler function for the route. It should:
    - Accept `recipeId: UUID` as a path parameter.
    - Call the `RecipeService.get_recipe_by_id` method.
    - Return the resulting `RecipeDetailDto`.
7.  **Add Error Handling**: Ensure database errors and other unexpected exceptions in the service/handler are caught and result in a `500 Internal Server Error` response with appropriate logging.
8.  **Write Unit/Integration Tests**: Create tests for the service method (mocking the database) and integration tests for the API endpoint to verify success (200), not found (404), and invalid ID (422) scenarios. 