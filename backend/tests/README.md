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
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies (if needed)
pip install -r requirements.txt
```

### Run Tests
```bash
# Run all tests (from project root directory)
python -m pytest backend/tests/

# Run with verbose output
python -m pytest backend/tests/ -v

# Run specific test file
python -m pytest backend/tests/test_auth.py -v

# Run specific test class
python -m pytest backend/tests/test_auth.py::TestJWTHelper -v

# Run tests matching pattern
python -m pytest backend/tests/ -k "test_auth" -v
```

## Test Categories

- **Authentication (`test_auth.py`)**: JWT tokens, validation, auth middleware
- **User Service (`test_user_service.py`)**: Business logic, error handling, UUID validation  
- **API Endpoint (`test_users_endpoint.py`)**: HTTP responses (200/401/403/404), OpenAPI docs

---

🎯 **Quick Commands:**
```bash
python -m pytest backend/tests/                    # All tests
python -m pytest backend/tests/ -v                 # Verbose
python -m pytest backend/tests/ -k "test_auth"     # Auth tests only
python -m pytest backend/tests/ --tb=short         # Short traceback
python -m pytest backend/tests/ -x                 # Stop on first failure
```

## Test Coverage

### 📊 Running with Coverage (Optional)
If you have `pytest-cov` installed:

```bash
# Install coverage tool
pip install pytest-cov

# Run tests with coverage report
python -m pytest backend/tests/ --cov=backend

# Generate HTML coverage report
python -m pytest backend/tests/ --cov=backend --cov-report=html

# Coverage with missing lines
python -m pytest backend/tests/ --cov=backend --cov-report=term-missing
```

## Test Breakdown:
- **Authentication**: 9 tests
- **User Service**: 11 tests  
- **API Endpoint**: 15 tests
- **Total**: 35 tests ✅

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
    python -m pytest backend/tests/ --tb=short -v
```

```bash
# Local development script
#!/bin/bash
# test.sh
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
python -m pytest backend/tests/ -v
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

## Running Tests from Different Directories

**Important**: Always run tests from the project root directory:

```bash
# ✅ Correct - from project root
D:\training\10x_training\NaWinie> python -m pytest backend/tests/ -v

# ❌ Incorrect - from backend directory  
D:\training\10x_training\NaWinie\backend> pytest -v
# Error: ModuleNotFoundError: No module named 'backend'
```

---