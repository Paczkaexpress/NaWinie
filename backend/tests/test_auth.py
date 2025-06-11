"""
Tests for authentication module - JWT token validation.
"""

import pytest
from fastapi import HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from datetime import datetime, timedelta

from backend.dependencies.auth import get_current_user_id
from backend.utils.jwt_helper import create_test_token, decode_token


class TestJWTHelper:
    """Test JWT helper functions."""

    def test_create_test_token_with_user_id(self):
        """Test creating token with specific user ID."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_test_token(user_id)
        
        # Decode and verify
        payload = decode_token(token)
        assert payload["sub"] == user_id
        assert "exp" in payload
        assert "iat" in payload

    def test_create_test_token_without_user_id(self):
        """Test creating token without user ID (generates random UUID)."""
        token = create_test_token()
        
        # Should not raise error and should have valid UUID in payload
        payload = decode_token(token)
        assert "sub" in payload
        assert len(payload["sub"]) == 36  # UUID length
        assert payload["sub"].count("-") == 4  # UUID format

    def test_create_test_token_with_custom_expiry(self):
        """Test creating token with custom expiry time."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        expires_delta = timedelta(minutes=5)
        
        token = create_test_token(user_id, expires_delta)
        payload = decode_token(token)
        
        # Just verify that expiry is set and token has proper structure
        assert "exp" in payload
        assert "sub" in payload
        assert payload["sub"] == user_id
        
        # Verify that expiry is in the future
        exp_time = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        assert exp_time > now

    def test_decode_token_valid(self):
        """Test decoding valid JWT token."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_test_token(user_id)
        
        payload = decode_token(token)
        assert payload["sub"] == user_id

    def test_decode_token_invalid(self):
        """Test decoding invalid JWT token."""
        from jose import JWTError
        
        with pytest.raises(JWTError):
            decode_token("invalid.token.here")


class TestGetCurrentUserIdDependency:
    """Test get_current_user_id dependency."""

    def test_valid_token_returns_user_id(self):
        """Test that valid token returns correct user ID."""
        user_id = "123e4567-e89b-12d3-a456-426614174000"
        token = create_test_token(user_id)
        
        # Mock HTTPAuthorizationCredentials
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        result = get_current_user_id(credentials)
        assert result == user_id

    def test_invalid_token_raises_401(self):
        """Test that invalid token raises 401 exception."""
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="invalid.token.here"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(credentials)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Authentication required"

    def test_token_without_sub_raises_401(self):
        """Test that token without 'sub' claim raises 401."""
        from jose import jwt
        from backend.dependencies.auth import SECRET_KEY, ALGORITHM
        
        # Create token without 'sub' claim
        payload = {
            "exp": datetime.utcnow() + timedelta(minutes=30),
            "iat": datetime.utcnow(),
            # Missing 'sub' claim
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(credentials)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Authentication required"

    def test_expired_token_raises_401(self):
        """Test that expired token raises 401."""
        from jose import jwt
        from backend.dependencies.auth import SECRET_KEY, ALGORITHM
        
        # Create expired token
        payload = {
            "sub": "123e4567-e89b-12d3-a456-426614174000",
            "exp": datetime.utcnow() - timedelta(minutes=1),  # Expired 1 minute ago
            "iat": datetime.utcnow() - timedelta(minutes=31),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token
        )
        
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(credentials)
        
        assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
        assert exc_info.value.detail == "Authentication required" 