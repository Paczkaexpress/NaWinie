"""
Pytest configuration and fixtures for Na Winie API tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid
import time
import subprocess
import threading
import requests
import sys
import os
from datetime import datetime

# Set testing environment variable to prevent production database connection
os.environ["TESTING"] = "1"

from backend.main import app
from backend.database import get_db, Base
from backend.models.user import User
from backend.utils.jwt_helper import create_test_token
from backend.utils.rate_limiter import rate_limiter
from backend.utils.cache import cache

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def server_process():
    """Start the uvicorn server for integration tests and stop it after tests."""
    # Check if server is already running
    try:
        response = requests.get("http://localhost:8000/", timeout=2)
        if response.status_code == 200:
            print("Server already running, using existing instance")
            yield None
            return
    except requests.exceptions.ConnectionError:
        pass
    
    # Start the server
    print("Starting uvicorn server for integration tests...")
    process = subprocess.Popen([
        sys.executable, "-m", "uvicorn", 
        "backend.main:app", 
        "--host", "127.0.0.1", 
        "--port", "8000",
        "--reload"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Wait for server to start
    for _ in range(30):  # Wait up to 30 seconds
        try:
            response = requests.get("http://localhost:8000/", timeout=1)
            if response.status_code == 200:
                print("Server started successfully")
                break
        except requests.exceptions.ConnectionError:
            time.sleep(1)
    else:
        process.terminate()
        pytest.fail("Server failed to start within 30 seconds")
    
    yield process
    
    # Cleanup
    print("Stopping server...")
    process.terminate()
    process.wait(timeout=10)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()

@pytest.fixture
def test_user_id():
    """Return a consistent test user ID."""
    return "123e4567-e89b-12d3-a456-426614174000"

@pytest.fixture
def test_user(db_session, test_user_id):
    """Create a test user in the database."""
    user = User(
        id=uuid.UUID(test_user_id),
        email="test@example.com",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user

@pytest.fixture
def test_user_token(test_user_id):
    """Generate a valid JWT token for the test user."""
    return create_test_token(test_user_id)

@pytest.fixture
def auth_headers(test_user_token):
    """Return authorization headers with valid JWT token."""
    return {"Authorization": f"Bearer {test_user_token}"}

@pytest.fixture
def invalid_token():
    """Return an invalid JWT token."""
    return "invalid.jwt.token"

@pytest.fixture
def non_existent_user_token():
    """Generate a JWT token for a non-existent user."""
    return create_test_token("00000000-0000-0000-0000-000000000000")

@pytest.fixture(autouse=True)
def reset_optimizations():
    """Reset rate limiter and cache before each test to prevent test interference."""
    # Clear rate limiter
    rate_limiter._windows.clear()
    rate_limiter._last_cleanup = time.time()
    
    # Clear cache
    cache.clear()
    
    yield
    
    # Cleanup after test
    rate_limiter._windows.clear()
    cache.clear() 