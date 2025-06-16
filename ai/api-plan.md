# REST API Plan

## 1. Resources

*   **Users**: Represents user profiles (`users` table).
*   **Ingredients**: Represents available ingredients (`ingredients` table).
*   **Default Ingredients**: Represents globally common ingredients (`default_ingredients` table).
*   **User Default Ingredients**: Represents ingredients a user always has (`user_default_ingredients` table).
*   **Recipes**: Represents recipes with instructions and details (`recipes` table).
*   **Recipe Ingredients**: Represents the ingredients required for a recipe (`recipe_ingredients` table).
*   **Recipe Views**: Tracks user views of recipes (`recipe_views` table).
*   **Ingredient Popularity**: Tracks how often ingredients are searched (`ingredient_popularity` table).
*   **Authentication**: Handles user login and registration.

## 2. Endpoints

### Authentication

*   **POST** `/auth/register`
    *   **Description**: Register a new user.
    *   **Request Body**:
        ```json
        {
          "email": "user@example.com",
          "password": "securepassword"
        }
        ```
    *   **Response Body**:
        ```json
        {
          "id": "uuid",
          "email": "user@example.com",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    *   **Success**: 201 Created
    *   **Error**: 400 Bad Request (Invalid input), 409 Conflict (Email already exists)
*   **POST** `/auth/login`
    *   **Description**: Log in a user and return an authentication token (e.g., JWT).
    *   **Request Body**:
        ```json
        {
          "email": "user@example.com",
          "password": "securepassword"
        }
        ```
    *   **Response Body**:
        ```json
        {
          "access_token": "jwt_token",
          "token_type": "bearer"
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 401 Unauthorized (Invalid credentials)
*   **POST** `/auth/logout` (Optional, depending on token strategy)
    *   **Description**: Invalidate the user's session/token. Requires Authentication.
    *   **Success**: 204 No Content
    *   **Error**: 401 Unauthorized

### Users

*   **GET** `/users/me`
    *   **Description**: Get the profile of the currently authenticated user. Requires Authentication.
    *   **Response Body**:
        ```json
        {
          "id": "uuid",
          "email": "user@example.com",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 401 Unauthorized, 404 Not Found

### Ingredients

*   **GET** `/ingredients`
    *   **Description**: Get a list of all available ingredients. Supports pagination, filtering by name (search), and sorting.
    *   **Query Parameters**: `page`, `limit`, `search` (name), `sortBy` (name, unit\_type, created\_at), `sortOrder` (asc, desc)
    *   **Response Body**:
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "name": "Flour",
              "unit_type": "g",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
            // ... more ingredients
          ],
          "pagination": { "page": 1, "limit": 20, "total_items": 100, "total_pages": 5 }
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 400 Bad Request (Invalid query params)
*   **POST** `/ingredients`
    *   **Description**: Add a new ingredient (Potentially admin-only or rate-limited). Requires Authentication.
    *   **Request Body**:
        ```json
        {
          "name": "New Spice",
          "unit_type": "g"
        }
        ```
    *   **Response Body**:
        ```json
        {
          "id": "uuid",
          "name": "New Spice",
          "unit_type": "g",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    *   **Success**: 201 Created
    *   **Error**: 400 Bad Request (Invalid input, missing fields), 401 Unauthorized, 403 Forbidden, 409 Conflict (Name exists)
*   **GET** `/ingredients/{ingredientId}`
    *   **Description**: Get details of a specific ingredient.
    *   **Response Body**:
        ```json
        {
          "id": "uuid",
          "name": "Flour",
          "unit_type": "g",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 404 Not Found

### Default Ingredients (User Specific)

*   **GET** `/users/me/default-ingredients`
    *   **Description**: Get the list of ingredients the authenticated user marked as always available. Requires Authentication.
    *   **Response Body**:
        ```json
        [
          {
            "ingredient_id": "uuid",
            "name": "Salt", // Joined from ingredients table for convenience
            "unit_type": "g",
            "created_at": "timestamp"
          }
          // ... other default ingredients
        ]
        ```
    *   **Success**: 200 OK
    *   **Error**: 401 Unauthorized
*   **POST** `/users/me/default-ingredients`
    *   **Description**: Add an ingredient to the user's default list. Requires Authentication.
    *   **Request Body**:
        ```json
        {
          "ingredient_id": "uuid_of_ingredient_to_add"
        }
        ```
    *   **Response Body**:
        ```json
        {
          "user_id": "uuid_user",
          "ingredient_id": "uuid_ingredient",
          "created_at": "timestamp"
        }
        ```
    *   **Success**: 201 Created
    *   **Error**: 400 Bad Request (Invalid ID), 401 Unauthorized, 404 Not Found (Ingredient doesn't exist), 409 Conflict (Already exists)
*   **DELETE** `/users/me/default-ingredients/{ingredientId}`
    *   **Description**: Remove an ingredient from the user's default list. Requires Authentication.
    *   **Success**: 204 No Content
    *   **Error**: 401 Unauthorized, 404 Not Found (Ingredient not in user's list)

### Recipes

*   **GET** `/recipes`
    *   **Description**: Get a list of all recipes. Supports pagination, filtering (by complexity, author), and sorting (by name, rating, prep\_time, created\_at).
    *   **Query Parameters**: `page`, `limit`, `complexity` (EASY, MEDIUM, HARD), `authorId`, `sortBy`, `sortOrder`
    *   **Response Body**:
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "name": "Simple Pancakes",
              "preparation_time_minutes": 20,
              "complexity_level": "EASY",
              "author_id": "uuid",
              "average_rating": 4.5,
              "total_votes": 15,
              "created_at": "timestamp",
              "updated_at": "timestamp"
              // steps and ingredients might be omitted for list view, fetched on detail view
            }
            // ... more recipes
          ],
          "pagination": { "page": 1, "limit": 10, "total_items": 50, "total_pages": 5 }
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 400 Bad Request (Invalid query params)
*   **GET** `/recipes/find-by-ingredients`
    *   **Description**: Find recipes that can be made with a given list of ingredient IDs. Increments popularity for searched ingredients. Includes user's default ingredients automatically if authenticated.
    *   **Query Parameters**: `ingredientIds` (comma-separated list of UUIDs).
    *   **Response Body**: (Similar structure to `/recipes`, potentially ranked by ingredient match relevance)
        ```json
        {
          "data": [ // Recipes matching provided ingredients
            // ... recipe details ...
          ],
          "pagination": { // Optional, if result set is large
            "page": 1, "limit": 10, "total_items": 5, "total_pages": 1
          }
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 400 Bad Request (Missing or invalid `ingredientIds`)
*   **POST** `/recipes`
    *   **Description**: Create a new recipe. Requires Authentication.
    *   **Request Body**:
        ```json
        {
          "name": "New Recipe",
          "preparation_time_minutes": 30,
          "complexity_level": "MEDIUM",
          "steps": [
            {"step": 1, "description": "Do step 1."},
            {"step": 2, "description": "Do step 2."}
          ],
          "ingredients": [
            {
              "ingredient_id": "uuid",
              "amount": 100,
              "is_optional": false,
              "substitute_recommendation": null
            },
            // ... other ingredients
          ]
        }
        ```
    *   **Response Body**: (Full recipe details including generated ID and author\_id)
        ```json
        {
          "id": "uuid",
          "name": "New Recipe",
          "preparation_time_minutes": 30,
          "complexity_level": "MEDIUM",
          "steps": [...],
          "author_id": "uuid_of_authenticated_user",
          "average_rating": 0,
          "total_votes": 0,
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "ingredients": [...] // Echoing the created recipe ingredients
        }
        ```
    *   **Success**: 201 Created
    *   **Error**: 400 Bad Request (Invalid input, missing fields), 401 Unauthorized
*   **GET** `/recipes/{recipeId}`
    *   **Description**: Get full details of a specific recipe, including steps and ingredients.
    *   **Response Body**:
        ```json
        {
          "id": "uuid",
          "name": "Simple Pancakes",
          "preparation_time_minutes": 20,
          "complexity_level": "EASY",
          "steps": [
            {"step": 1, "description": "Mix flour..."}, ...
          ],
          "author_id": "uuid",
          "average_rating": 4.5,
          "total_votes": 15,
          "created_at": "timestamp",
          "updated_at": "timestamp",
          "ingredients": [
            {
              "ingredient_id": "uuid",
              "name": "Flour", // Joined for convenience
              "unit_type": "g",
              "amount": 150,
              "is_optional": false,
              "substitute_recommendation": null
            },
            // ... other ingredients
          ]
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 404 Not Found
*   **PUT** `/recipes/{recipeId}`
    *   **Description**: Update an existing recipe. Requires Authentication, user must be the author.
    *   **Request Body**: (Similar to POST /recipes, but partial updates allowed)
    *   **Response Body**: (Updated full recipe details)
    *   **Success**: 200 OK
    *   **Error**: 400 Bad Request, 401 Unauthorized, 403 Forbidden (Not author), 404 Not Found
*   **DELETE** `/recipes/{recipeId}`
    *   **Description**: Delete a recipe. Requires Authentication, user must be the author (or admin).
    *   **Success**: 204 No Content
    *   **Error**: 401 Unauthorized, 403 Forbidden, 404 Not Found
*   **POST** `/recipes/{recipeId}/rate`
    *   **Description**: Submit a rating for a recipe. Requires Authentication.
    *   **Request Body**:
        ```json
        {
          "rating": 5 // Integer between 1 and 5
        }
        ```
    *   **Response Body**: (Updated average rating and total votes)
        ```json
        {
          "average_rating": 4.6,
          "total_votes": 16
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 400 Bad Request (Invalid rating), 401 Unauthorized, 404 Not Found, 409 Conflict (User already rated) - *Note: DB schema doesn't explicitly track individual votes, this requires adding a `recipe_ratings` table or similar logic.*

### User Activity

*   **GET** `/users/me/recipe-views`
    *   **Description**: Get the authenticated user's recipe view history. Requires Authentication. Supports pagination.
    *   **Query Parameters**: `page`, `limit`
    *   **Response Body**:
        ```json
        {
          "data": [
            {
              "id": "uuid",
              "recipe_id": "uuid",
              "recipe_name": "Simple Pancakes", // Joined for convenience
              "view_start": "timestamp",
              "view_end": "timestamp",
              "created_at": "timestamp"
            }
            // ... more views
          ],
          "pagination": { ... }
        }
        ```
    *   **Success**: 200 OK
    *   **Error**: 401 Unauthorized

## 3. Authentication and Authorization

*   **Authentication**: Use JSON Web Tokens (JWT).
    *   The `/auth/login` endpoint will return an `access_token` (JWT) upon successful authentication.
    *   The client must include this token in the `Authorization` header for protected endpoints using the `Bearer` scheme (e.g., `Authorization: Bearer <token>`).
    *   The backend (FastAPI) will use middleware to verify the JWT on incoming requests to protected routes. The token will contain the user's ID (`sub` claim).
*   **Authorization**:
    *   Basic access control is implemented via requiring authentication for specific endpoints.
    *   Fine-grained control (e.g., editing/deleting recipes only by the author) is handled within the endpoint logic by comparing the authenticated user's ID (from JWT) with the resource's `author_id` or `user_id`.
    *   Supabase RLS policies provide database-level security, which acts as a secondary layer of defense. API logic should still perform primary authorization checks.

## 4. Validation and Business Logic

*   **Validation**:
    *   Leverage FastAPI's integration with Pydantic for automatic request body validation based on defined models.
    *   **Users**: `email` must be unique and valid format.
    *   **Ingredients**: `name` must be unique. `unit_type` must be one of ('ml', 'g', 'szt').
    *   **Recipes**: `name` is required. `preparation_time_minutes` must be > 0. `complexity_level` must be one of ('EASY', 'MEDIUM', 'HARD'). `steps` must be a valid JSON array of objects with `step` (integer) and `description` (text). `average_rating` between 0-5. `total_votes` >= 0.
    *   **Recipe Ingredients**: `amount` must be > 0. Foreign keys (`recipe_id`, `ingredient_id`) must exist.
    *   **Recipe Views**: `view_end` must be > `view_start` if not null.
    *   **Ingredient Popularity**: `search_count` >= 0.
    *   **Ratings**: Rating value must be between 1 and 5.
*   **Business Logic Implementation**:
    *   **Recipe Suggestion (`GET /recipes/find-by-ingredients`)**:
        *   Accepts a list of `ingredientIds`.
        *   If the user is authenticated, retrieve their default ingredients from `user_default_ingredients` and add them to the search list.
        *   Query `recipe_ingredients` to find `recipe_id`s that use *any* of the provided/default `ingredientIds`.
        *   *Improvement*: Rank results based on the percentage of required ingredients matched vs. provided ingredients.
        *   For each `ingredientId` in the initial request, call the `increment_ingredient_popularity` function/logic.
    *   **Recipe Rating (`POST /recipes/{recipeId}/rate`)**:
        *   Validate rating (1-5).
        *   Check if the user has already rated (requires additional tracking, e.g., a `recipe_ratings` table: `user_id, recipe_id, rating`).
        *   If not rated, record the rating.
        *   Update the `recipes` table: increment `total_votes` and recalculate `average_rating`. This should ideally be atomic or handled by a database trigger/function for consistency.
    *   **Recipe View Tracking (`POST /recipes/{recipeId}/view`, `PUT /recipes/views/{viewId}/end`)**:
        *   `/view` creates a new `recipe_views` record with the current time as `view_start`.
        *   `/end` updates the corresponding `recipe_views` record (identified by `viewId`) setting `view_end` to the current time. Requires checking if the authenticated user owns the `viewId`.
    *   **Timestamp Updates**: The `update_updated_at` trigger handles `updated_at` timestamps automatically on the database level for `users`, `recipes`, and `ingredients`. API updates don't need to set this manually.
    *   **Author Checks**: Endpoints like `PUT /recipes/{recipeId}` and `DELETE /recipes/{recipeId}` must verify `auth.uid() == recipe.author_id`.
    *   **Popular Ingredients**: The `GET /ingredients/popular` endpoint directly queries the `ingredient_popularity` table or the `popular_ingredients` materialized view. 