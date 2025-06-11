# Na Winie API Tests

Comprehensive test suite for the Na Winie FastAPI application using pytest.

## Test Structure

```
backend/tests/
├── conftest.py           # Pytest fixtures and configuration
├── test_auth.py          # Authentication tests (9 tests)
├── test_user_service.py  # User service logic tests (11 tests)
└── test_users_endpoint.py # API endpoint tests (15 tests)
```

## Quick Start

### Prerequisites
```bash
# Activate virtual environment
venv\Scripts\activate

# Install dependencies (if needed)
pip install -r requirements.txt
```

### Run Tests
```bash
# Run all tests
$env:PYTHONPATH = "."; pytest

# Run with verbose output
$env:PYTHONPATH = "."; pytest -v

# Run specific test file
$env:PYTHONPATH = "."; pytest backend/tests/test_auth.py
```

## Test Categories

- **Authentication (`test_auth.py`)**: JWT tokens, validation, auth middleware
- **User Service (`test_user_service.py`)**: Business logic, error handling, UUID validation  
- **API Endpoint (`test_users_endpoint.py`)**: HTTP responses (200/401/403/404), OpenAPI docs

---

🎯 **Quick Commands:**
```bash
$env:PYTHONPATH = "."; pytest                    # All tests
$env:PYTHONPATH = "."; pytest -v                 # Verbose
$env:PYTHONPATH = "."; pytest -k "test_auth"     # Auth tests only
$env:PYTHONPATH = "."; pytest --tb=short         # Short traceback
```

## Test Coverage

### 📊 Running with Coverage (Optional)
If you have `pytest-cov` installed:

```bash
# Install coverage tool
pip install pytest-cov

# Run tests with coverage report
$env:PYTHONPATH = "."; pytest --cov=backend

# Generate HTML coverage report
$env:PYTHONPATH = "."; pytest --cov=backend --cov-report=html

# Coverage with missing lines
$env:PYTHONPATH = "."; pytest --cov=backend --cov-report=term-missing
```

## Test Breakdown:
- **Authentication**: 9 tests
- **User Service**: 11 tests  
- **API Endpoint**: 15 tests

## Configuration

Tests are configured via `pytest.ini` in project root:
- Test paths: `backend/tests`
- Python paths: `.` (project root)
- Default options: verbose, short traceback
- Warning filters: ignore deprecation warnings

## CI/CD Integration

For automated testing in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run tests
  run: |
    export PYTHONPATH=.
    pytest backend/tests/ --tb=short -v
```

## Adding New Tests

When adding new tests:

1. **Create test file**: `test_[module_name].py`
2. **Import fixtures**: Use existing fixtures from `conftest.py`
3. **Follow naming**: `test_[functionality]_[scenario]`
4. **Add docstrings**: Describe what test verifies
5. **Use assertions**: Clear, specific assertions
6. **Test edge cases**: Happy path + error scenarios

Example:
```python
def test_new_functionality_success(self, client, test_user, auth_headers):
    """Test successful new functionality."""
    response = client.get("/api/new-endpoint", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert "expected_field" in data
```

---