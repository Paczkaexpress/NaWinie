# Na Winie Recipe API - Usage Examples

## Overview

This document provides practical examples for using the Na Winie Recipe API. The API is fully documented with OpenAPI/Swagger and can be explored interactively.

## Accessing Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

## Example API Calls

### 1. Get Recipes List (with filters)

```bash
# Basic pagination
curl -X GET "http://localhost:8000/api/recipes?page=1&limit=10"

# Filter by complexity and sort by rating
curl -X GET "http://localhost:8000/api/recipes?complexity=easy&sortBy=rating&sortOrder=desc"

# Filter by author
curl -X GET "http://localhost:8000/api/recipes?authorId=123e4567-e89b-12d3-a456-426614174001"
```

### 2. Find Recipes by Ingredients

```bash
# Find recipes containing tomatoes and basil
curl -X GET "http://localhost:8000/api/recipes/find-by-ingredients?ingredientIds=uuid1,uuid2"

# With authentication for personalized results
curl -X GET "http://localhost:8000/api/recipes/find-by-ingredients?ingredientIds=uuid1,uuid2" \
  -H "Authorization: Bearer <token>"
```

### 3. Create a New Recipe

```bash
curl -X POST "http://localhost:8000/api/recipes" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Classic Spaghetti Carbonara",
    "preparation_time_minutes": 30,
    "complexity_level": "medium",
    "steps": [
      {"step": 1, "description": "Boil water for pasta"},
      {"step": 2, "description": "Cook spaghetti al dente"},
      {"step": 3, "description": "Mix eggs with cheese"}
    ],
    "ingredients": [
      {
        "ingredient_id": "123e4567-e89b-12d3-a456-426614174000",
        "amount": 400.0,
        "is_optional": false,
        "substitute_recommendation": null
      }
    ]
  }'
```

### 4. Get Recipe Details

```bash
curl -X GET "http://localhost:8000/api/recipes/123e4567-e89b-12d3-a456-426614174000"
```

### 5. Update Recipe (partial update)

```bash
curl -X PUT "http://localhost:8000/api/recipes/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Classic Spaghetti Carbonara",
    "preparation_time_minutes": 25
  }'
```

### 6. Rate a Recipe

```bash
curl -X POST "http://localhost:8000/api/recipes/123e4567-e89b-12d3-a456-426614174000/rate" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5
  }'
```

### 7. Delete Recipe

```bash
curl -X DELETE "http://localhost:8000/api/recipes/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

## Error Handling Examples

### 400 Bad Request
```json
{
  "detail": "Invalid ingredient IDs: ['123e4567-e89b-12d3-a456-426614174999']"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 404 Not Found
```json
{
  "detail": "Recipe not found"
}
```

### 409 Conflict
```json
{
  "detail": "User has already rated this recipe"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "rating"],
      "msg": "ensure this value is less than or equal to 5",
      "type": "value_error.number.not_le"
    }
  ]
}
```

## Response Examples

### Recipe List Response
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Spaghetti Carbonara",
      "preparation_time_minutes": 30,
      "complexity_level": "medium",
      "author_id": "123e4567-e89b-12d3-a456-426614174001",
      "average_rating": 4.5,
      "total_votes": 12,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

### Recipe Detail Response
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Classic Spaghetti Carbonara",
    "preparation_time_minutes": 30,
    "complexity_level": "medium",
    "steps": [
      {"step": 1, "description": "Boil water for pasta"},
      {"step": 2, "description": "Cook spaghetti al dente"}
    ],
    "author_id": "123e4567-e89b-12d3-a456-426614174001",
    "average_rating": 4.5,
    "total_votes": 12,
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "ingredients": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Spaghetti",
        "amount": 400.0,
        "unit": "grams",
        "is_optional": false,
        "substitute_recommendation": null
      }
    ]
  }
}
```

### Rating Response
```json
{
  "average_rating": 4.3,
  "total_votes": 13
}
```

## Interactive Testing

1. Start the API server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Open Swagger UI in browser:
   ```
   http://localhost:8000/docs
   ```

3. Use the "Try it out" feature for each endpoint

4. Authenticate using the lock icon (🔒) for protected endpoints

## Rate Limiting & Constraints

- **Pagination**: Maximum 100 items per page
- **Recipe Names**: 1-255 characters
- **Rating Scale**: 1-5 stars (integers only)
- **One Rating**: Per user per recipe
- **Preparation Time**: Must be positive integer (minutes)

## Best Practices

1. **Always validate UUIDs** before sending requests
2. **Handle error responses** properly in your client code
3. **Use appropriate HTTP methods** (GET for retrieval, POST for creation, etc.)
4. **Include authentication** for all protected endpoints
5. **Implement proper error handling** for all status codes
6. **Use pagination** for large result sets
7. **Cache authentication tokens** to avoid repeated login requests 