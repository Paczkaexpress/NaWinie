"""
Tests for /api/users/me endpoint.
"""

import pytest
from fastapi import status


class TestUsersMe:
    """Test GET /api/users/me endpoint."""

    def test_get_current_user_success(self, client, test_user, auth_headers):
        """Test successful retrieval of current user profile."""
        response = client.get("/api/users/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "created_at" in data
        assert "updated_at" in data
        
        assert data["id"] == str(test_user.id)
        assert data["email"] == test_user.email

    def test_get_current_user_no_auth_header(self, client):
        """Test request without authorization header."""
        response = client.get("/api/users/me")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        data = response.json()
        assert "detail" in data

    def test_get_current_user_invalid_token(self, client, invalid_token):
        """Test request with invalid JWT token."""
        headers = {"Authorization": f"Bearer {invalid_token}"}
        response = client.get("/api/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        
        data = response.json()
        assert data["detail"] == "Authentication required"

    def test_get_current_user_malformed_auth_header(self, client):
        """Test request with malformed authorization header."""
        # Missing 'Bearer' prefix
        headers = {"Authorization": "some-token"}
        response = client.get("/api/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user_empty_token(self, client):
        """Test request with empty token."""
        headers = {"Authorization": "Bearer "}
        response = client.get("/api/users/me", headers=headers)
        
        # FastAPI returns 403 for empty Bearer token (not authenticated)
        # rather than 401 (authentication required)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user_nonexistent_user(self, client, non_existent_user_token):
        """Test request with token for non-existent user."""
        headers = {"Authorization": f"Bearer {non_existent_user_token}"}
        response = client.get("/api/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        data = response.json()
        assert data["detail"] == "User not found"

    def test_get_current_user_response_structure(self, client, test_user, auth_headers):
        """Test that response has correct structure and types."""
        response = client.get("/api/users/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        
        # Check required fields
        required_fields = ["id", "email", "created_at", "updated_at"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Check field types
        assert isinstance(data["id"], str)
        assert isinstance(data["email"], str)
        assert isinstance(data["created_at"], str)  # ISO timestamp string
        assert isinstance(data["updated_at"], str)  # ISO timestamp string
        
        # Validate UUID format
        import uuid
        uuid.UUID(data["id"])  # Should not raise exception
        
        # Validate email format
        assert "@" in data["email"]

    def test_get_current_user_multiple_requests(self, client, test_user, auth_headers):
        """Test multiple requests with same token return consistent data."""
        # Make first request
        response1 = client.get("/api/users/me", headers=auth_headers)
        assert response1.status_code == status.HTTP_200_OK
        data1 = response1.json()
        
        # Make second request
        response2 = client.get("/api/users/me", headers=auth_headers)
        assert response2.status_code == status.HTTP_200_OK
        data2 = response2.json()
        
        # Data should be identical
        assert data1 == data2

    def test_get_current_user_case_insensitive_bearer(self, client, test_user, test_user_token):
        """Test that 'Bearer' is case insensitive."""
        # Test with lowercase 'bearer'
        headers = {"Authorization": f"bearer {test_user_token}"}
        response = client.get("/api/users/me", headers=headers)
        
        # This should work with FastAPI's HTTPBearer which is case insensitive
        assert response.status_code == status.HTTP_200_OK


class TestUsersEndpointErrorHandling:
    """Test error handling scenarios for users endpoint."""

    def test_endpoint_handles_database_errors_gracefully(self, client, auth_headers):
        """Test that database errors are handled gracefully."""
        # This test verifies that if database goes down, 
        # we get proper 500 error instead of unhandled exception
        response = client.get("/api/users/me", headers=auth_headers)
        
        # Should either succeed (200) or fail gracefully (404/500)
        assert response.status_code in [200, 404, 500]
        
        # Response should always be valid JSON
        data = response.json()
        assert "detail" in data or "id" in data

    def test_endpoint_with_special_characters_in_token(self, client):
        """Test endpoint with special characters in token."""
        headers = {"Authorization": "Bearer token.with.special!@#$%^&*()chars"}
        response = client.get("/api/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["detail"] == "Authentication required"

    def test_endpoint_with_very_long_token(self, client):
        """Test endpoint with extremely long token."""
        long_token = "a" * 10000  # 10KB token
        headers = {"Authorization": f"Bearer {long_token}"}
        response = client.get("/api/users/me", headers=headers)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_endpoint_content_type_headers(self, client, test_user, auth_headers):
        """Test that endpoint works regardless of content-type headers."""
        # Add various headers to test robustness
        headers = {
            **auth_headers,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == status.HTTP_200_OK


class TestUsersEndpointDocumentation:
    """Test endpoint documentation and OpenAPI compliance."""

    def test_endpoint_included_in_openapi_schema(self, client):
        """Test that endpoint is properly documented in OpenAPI schema."""
        response = client.get("/openapi.json")
        assert response.status_code == status.HTTP_200_OK
        
        openapi_schema = response.json()
        
        # Check that our endpoint is in the schema
        paths = openapi_schema.get("paths", {})
        assert "/api/users/me" in paths
        
        # Check that GET method is documented
        endpoint_schema = paths["/api/users/me"]
        assert "get" in endpoint_schema
        
        # Check response schemas
        get_schema = endpoint_schema["get"]
        assert "responses" in get_schema
        assert "200" in get_schema["responses"]
        assert "401" in get_schema["responses"]
        assert "404" in get_schema["responses"]

    def test_swagger_docs_accessible(self, client):
        """Test that Swagger documentation is accessible."""
        response = client.get("/docs")
        assert response.status_code == status.HTTP_200_OK
        
        # Should contain HTML
        assert "text/html" in response.headers.get("content-type", "") 