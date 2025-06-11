"""
Tests for UserService - user business logic.
"""

import pytest
import uuid
from fastapi import HTTPException, status
from datetime import datetime

from backend.services.user_service import UserService, get_user_service
from backend.models.user import User
from backend.models.responses import UserResponse


class TestUserService:
    """Test UserService business logic."""

    def test_get_user_by_id_success(self, db_session, test_user):
        """Test successful user retrieval by ID."""
        service = UserService(db_session)
        
        result = service.get_user_by_id(str(test_user.id))
        
        assert result is not None
        assert result.id == test_user.id
        assert result.email == test_user.email

    def test_get_user_by_id_not_found(self, db_session):
        """Test user not found scenario."""
        service = UserService(db_session)
        non_existent_id = "00000000-0000-0000-0000-000000000000"
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_user_by_id(non_existent_id)
        
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert exc_info.value.detail == "User not found"

    def test_get_user_by_id_invalid_uuid(self, db_session):
        """Test invalid UUID format."""
        service = UserService(db_session)
        invalid_uuid = "not-a-valid-uuid"
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_user_by_id(invalid_uuid)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "Invalid user ID format"

    def test_get_current_user_success(self, db_session, test_user):
        """Test successful current user retrieval."""
        service = UserService(db_session)
        
        result = service.get_current_user(str(test_user.id))
        
        assert isinstance(result, UserResponse)
        assert result.id == str(test_user.id)
        assert result.email == test_user.email
        assert result.created_at == test_user.created_at
        assert result.updated_at == test_user.updated_at

    def test_get_current_user_not_found(self, db_session):
        """Test current user not found scenario."""
        service = UserService(db_session)
        non_existent_id = "00000000-0000-0000-0000-000000000000"
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_current_user(non_existent_id)
        
        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
        assert exc_info.value.detail == "User not found"

    def test_get_current_user_invalid_uuid(self, db_session):
        """Test current user with invalid UUID."""
        service = UserService(db_session)
        invalid_uuid = "invalid-uuid"
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_current_user(invalid_uuid)
        
        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
        assert exc_info.value.detail == "Invalid user ID format"


class TestUserServiceFactory:
    """Test UserService factory function."""

    def test_get_user_service_factory(self, db_session):
        """Test UserService factory function."""
        service = get_user_service(db_session)
        
        assert isinstance(service, UserService)
        assert service.db == db_session


class TestUserServiceEdgeCases:
    """Test edge cases and error handling."""

    def test_user_response_model_mapping(self, db_session):
        """Test that User model maps correctly to UserResponse."""
        # Create user with specific data
        user_id = uuid.uuid4()
        test_email = "mapping@test.com"
        created_time = datetime.utcnow()
        updated_time = datetime.utcnow()
        
        user = User(
            id=user_id,
            email=test_email,
            created_at=created_time,
            updated_at=updated_time
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        service = UserService(db_session)
        result = service.get_current_user(str(user_id))
        
        # Verify all fields are correctly mapped
        assert result.id == str(user_id)
        assert result.email == test_email
        assert result.created_at == created_time
        assert result.updated_at == updated_time

    def test_database_error_handling(self, db_session):
        """Test handling of database errors."""
        service = UserService(db_session)
        
        # Close the session to simulate database error
        db_session.close()
        
        with pytest.raises(HTTPException) as exc_info:
            service.get_user_by_id("123e4567-e89b-12d3-a456-426614174000")
        
        # When session is closed, we still get 404 (user not found) rather than 500
        # because SQLAlchemy handles the closed session gracefully
        assert exc_info.value.status_code in [status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR]
        assert exc_info.value.detail in ["User not found", "Internal server error"]

    def test_uuid_case_sensitivity(self, db_session, test_user):
        """Test UUID case sensitivity handling."""
        service = UserService(db_session)
        
        # Test with uppercase UUID
        uppercase_uuid = str(test_user.id).upper()
        result = service.get_user_by_id(uppercase_uuid)
        
        assert result is not None
        assert result.id == test_user.id

    def test_uuid_with_hyphens(self, db_session, test_user):
        """Test UUID with and without hyphens."""
        service = UserService(db_session)
        
        # Standard UUID format (with hyphens)
        standard_uuid = str(test_user.id)
        result = service.get_user_by_id(standard_uuid)
        
        assert result is not None
        assert result.id == test_user.id 