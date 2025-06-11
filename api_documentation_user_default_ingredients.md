# User Default Ingredients API Documentation

## Overview

The User Default Ingredients API allows authenticated users to manage their list of default ingredients - items they typically have available at home (like salt, pepper, oil). This helps with recipe filtering and meal planning.

## Base URL
```
http://localhost:8000/api
```

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get User Default Ingredients

Retrieves a paginated list of the authenticated user's default ingredients.

```http
GET /users/me/default-ingredients
```

#### Query Parameters
| Parameter | Type | Default | Required | Description |
|-----------|------|---------|----------|-------------|
| `page` | integer | 1 | No | Page number (minimum: 1) |
| `limit` | integer | 50 | No | Items per page (minimum: 1, maximum: 100) |

#### Response (200 OK)
```json
{
  "data": [
    {
      "ingredient_id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Sól",
      "unit_type": "g",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "ingredient_id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "Pieprz",
      "unit_type": "g", 
      "created_at": "2024-01-15T10:31:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total_items": 2,
    "total_pages": 1
  }
}
```

#### Error Responses
| Status | Description | Example |
|--------|-------------|---------|
| 400 | Invalid pagination parameters | `{"detail": "Numer strony musi być większy niż 0"}` |
| 401 | Authentication required | `{"detail": "Authentication required"}` |
| 500 | Internal server error | `{"detail": "Internal server error"}` |

---

### 2. Add Ingredient to Defaults

Adds an ingredient to the authenticated user's list of default ingredients.

```http
POST /users/me/default-ingredients
```

#### Request Body
```json
{
  "ingredient_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

#### Schema
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ingredient_id` | UUID | Yes | ID of ingredient to add to defaults |

#### Response (201 Created)
```json
{
  "user_id": "789e0123-e89b-12d3-a456-426614174000",
  "ingredient_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2024-01-15T10:32:00Z"
}
```

#### Error Responses
| Status | Description | Example |
|--------|-------------|---------|
| 400 | Maximum limit reached | `{"detail": "Przekroczono maksymalną liczbę domyślnych składników (100)"}` |
| 401 | Authentication required | `{"detail": "Authentication required"}` |
| 404 | Ingredient not found | `{"detail": "Składnik o ID 123e4567... nie istnieje"}` |
| 409 | Ingredient already in defaults | `{"detail": "Składnik 'Sól' już jest w domyślnych"}` |
| 422 | Validation error | Pydantic validation details |
| 500 | Internal server error | `{"detail": "Internal server error"}` |

---

### 3. Remove Ingredient from Defaults

Removes an ingredient from the authenticated user's list of default ingredients.

```http
DELETE /users/me/default-ingredients/{ingredient_id}
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ingredient_id` | UUID | Yes | ID of ingredient to remove from defaults |

#### Response (204 No Content)
```
(Empty response body)
```

#### Error Responses
| Status | Description | Example |
|--------|-------------|---------|
| 400 | Invalid ingredient ID format | `{"detail": "Nieprawidłowy format ID składnika"}` |
| 401 | Authentication required | `{"detail": "Authentication required"}` |
| 404 | Ingredient not in defaults | `{"detail": "Składnik nie jest w domyślnych użytkownika"}` |
| 422 | Validation error | Pydantic validation details |
| 500 | Internal server error | `{"detail": "Internal server error"}` |

## Business Rules

### Limitations
- Maximum 100 default ingredients per user
- Users can only manage their own default ingredients
- Ingredient must exist in the system before adding to defaults
- Cannot add duplicate ingredients to defaults

### Security
- All endpoints require valid JWT authentication
- User isolation - users can only access their own data
- Input validation on all parameters
- Rate limiting applied

## Examples

### Example 1: Get Default Ingredients
```bash
curl -X GET "http://localhost:8000/api/users/me/default-ingredients?page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example 2: Add Ingredient to Defaults
```bash
curl -X POST "http://localhost:8000/api/users/me/default-ingredients" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"ingredient_id": "123e4567-e89b-12d3-a456-426614174000"}'
```

### Example 3: Remove Ingredient from Defaults
```bash
curl -X DELETE "http://localhost:8000/api/users/me/default-ingredients/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## OpenAPI Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## Error Handling

All errors follow a consistent format:

```json
{
  "detail": "Error message describing what went wrong",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2024-01-15T10:32:00Z"
}
```

Common error patterns:
- **400 Bad Request**: Invalid input parameters or business rule violations
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Requested resource doesn't exist or user doesn't have access
- **409 Conflict**: Resource already exists or conflicts with current state
- **422 Unprocessable Entity**: Request body validation errors
- **500 Internal Server Error**: Unexpected server errors

## SDKs and Integration

This API is compatible with:
- OpenAPI 3.0 code generators
- Postman collections
- REST client libraries
- Frontend frameworks (React, Vue, Angular)

## Testing

For testing endpoints, you can generate test JWT tokens using:
```bash
python backend/utils/jwt_helper.py
```

## Rate Limiting

Default rate limits apply:
- 100 requests per minute per user
- Burst allowance of 20 requests

## Support

For questions or issues:
- Check the interactive documentation at `/docs`
- Review test cases in `backend/tests/test_user_default_ingredients_*`
- See implementation details in `backend/routers/user_default_ingredients.py` 