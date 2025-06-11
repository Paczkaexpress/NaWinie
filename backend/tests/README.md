# Na Winie API - Test Suite Documentation

## Overview

This directory contains comprehensive test suites for the Na Winie API application. The tests cover unit testing for business logic, integration testing for API endpoints, and error scenario validation.

## Test Structure

```
tests/
├── conftest.py                                 # Pytest configuration and shared fixtures
├── test_auth.py                               # Authentication and JWT token tests
├── test_users_endpoint.py                     # User management endpoint tests
├── test_user_service.py                       # User service unit tests  
├── test_ingredients_endpoint.py               # Ingredient management endpoint tests
├── test_ingredient_service.py                 # Ingredient service unit tests
├── test_user_default_ingredients_service.py   # User default ingredients service tests
├── test_user_default_ingredients_endpoint.py  # User default ingredients endpoint tests
├── test_optimizations.py                      # Performance and caching tests
└── README.md                                  # This documentation
```

## Running Tests

### Prerequisites
1. Ensure virtual environment is activated:
   ```bash
   venv\Scripts\Activate.ps1  # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Run All Tests
```bash
pytest
```

### Run Specific Test Files
```bash
# Test specific module
pytest tests/test_user_default_ingredients_service.py
pytest tests/test_user_default_ingredients_endpoint.py

# Test specific class or method
pytest tests/test_user_default_ingredients_service.py::TestUserDefaultIngredientsService::test_get_user_defaults_empty_list
```

### Run Tests with Coverage
```bash
pytest --cov=backend --cov-report=html
```

### Run Tests with Verbose Output
```bash
pytest -v
```

## Test Categories

### Unit Tests
- **Service Layer Tests**: Test business logic in isolation
  - `test_user_service.py` - User management business logic
  - `test_ingredient_service.py` - Ingredient management business logic  
  - `test_user_default_ingredients_service.py` - User default ingredients business logic

### Integration Tests
- **Endpoint Tests**: Test complete request/response cycles
  - `test_users_endpoint.py` - User API endpoints
  - `test_ingredients_endpoint.py` - Ingredient API endpoints
  - `test_user_default_ingredients_endpoint.py` - User default ingredients API endpoints

### Security Tests
- **Authentication Tests**: JWT token validation and authorization
  - `test_auth.py` - JWT token generation, validation, and security

### Performance Tests
- **Optimization Tests**: Caching, rate limiting, and performance
  - `test_optimizations.py` - Cache behavior and rate limiting

## User Default Ingredients Test Coverage

### Service Layer Tests (`test_user_default_ingredients_service.py`)

**Positive Scenarios:**
- ✅ Get empty list of user defaults
- ✅ Get list with data and proper DTO mapping
- ✅ Pagination functionality (page/limit parameters)
- ✅ Successfully add ingredient to defaults
- ✅ Successfully remove ingredient from defaults

**Error Scenarios:**
- ✅ Invalid pagination parameters (page < 1, limit > 100)
- ✅ Add non-existent ingredient
- ✅ Add ingredient already in defaults (409 conflict)
- ✅ Add ingredient when max limit reached (100 ingredients)
- ✅ Remove ingredient not in defaults
- ✅ Remove ingredient as wrong user

### Endpoint Tests (`test_user_default_ingredients_endpoint.py`)

**Authentication & Authorization:**
- ✅ Unauthorized access (no token)
- ✅ Invalid JWT token
- ✅ User isolation (users can only access their own data)

**GET `/api/users/me/default-ingredients`:**
- ✅ Get empty list
- ✅ Get list with data
- ✅ Pagination query parameters
- ✅ Invalid pagination parameters

**POST `/api/users/me/default-ingredients`:**
- ✅ Successfully add ingredient
- ✅ Invalid request body
- ✅ Invalid ingredient ID format
- ✅ Ingredient not found
- ✅ Ingredient already exists

**DELETE `/api/users/me/default-ingredients/{ingredient_id}`:**
- ✅ Successfully remove ingredient
- ✅ Invalid ingredient ID format
- ✅ Ingredient not in user's defaults
- ✅ Non-existent ingredient

## Test Fixtures

### Database Fixtures
- `db_session` - Fresh database session for each test
- `client` - FastAPI test client with database override

### User Fixtures
- `test_user_id` - Consistent test user UUID
- `test_user` - Test user in database
- `test_user_token` - Valid JWT token
- `auth_headers` - Authorization headers

### Ingredient Fixtures
- `test_ingredient` - Test ingredient in database
- `test_ingredient2` - Second test ingredient
- `test_user_default` - User default ingredient relationship

### Security Fixtures
- `invalid_token` - Invalid JWT for negative testing
- `non_existent_user_token` - Valid JWT for non-existent user

## API Error Codes

### User Default Ingredients Endpoints

| Status Code | Scenario | Error Message |
|-------------|----------|---------------|
| 400 | Invalid pagination | "Numer strony musi być większy niż 0" |
| 400 | Invalid limit | "Limit musi być między 1 a 100" |
| 400 | Max limit reached | "Przekroczono maksymalną liczbę domyślnych składników (100)" |
| 401 | Authentication required | "Authentication required" |
| 404 | Ingredient not found | "Składnik o ID {id} nie istnieje" |
| 404 | Not in defaults | "Składnik nie jest w domyślnych użytkownika" |
| 409 | Already exists | "Składnik '{name}' już jest w domyślnych" |
| 422 | Validation error | Pydantic validation details |

## Best Practices

### Test Naming
- Use descriptive test method names that explain the scenario
- Follow pattern: `test_[method]_[scenario]_[expected_result]`
- Example: `test_add_default_ingredient_not_found`

### Test Structure
- **Arrange**: Set up test data and fixtures
- **Act**: Execute the operation being tested
- **Assert**: Verify the expected outcome

### Fixtures Usage
- Use specific fixtures for test requirements
- Combine fixtures to build complex test scenarios
- Keep fixtures focused and reusable

### Error Testing
- Test all documented error scenarios
- Verify correct HTTP status codes
- Check error message content for specificity

### Security Testing
- Always test unauthorized access
- Verify user isolation
- Test with invalid tokens and malformed requests

## Continuous Integration

These tests are designed to run in CI/CD environments:
- Isolated database per test (SQLite in-memory)
- No external dependencies
- Deterministic results
- Fast execution time

## Adding New Tests

When adding new functionality:

1. **Unit Tests**: Test business logic in service layer
2. **Integration Tests**: Test complete API workflows
3. **Error Tests**: Cover all error scenarios
4. **Security Tests**: Verify authentication/authorization
5. **Documentation**: Update this README with new test coverage
