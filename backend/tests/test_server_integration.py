"""
Generic server integration tests for FastAPI application.
Tests server connectivity, basic endpoints, authentication, and performance.
"""

import pytest
import requests
import json
import threading
import time
from typing import Dict, Any, List, Optional
from datetime import datetime


class TestServerConnectivity:
    """Basic server connectivity and health tests."""
    
    BASE_URL = "http://localhost:8000"
    
    @pytest.fixture(scope="class")
    def api_endpoints(self) -> Dict[str, str]:
        """Fixture providing common API endpoints for testing."""
        return {
            "root": f"{self.BASE_URL}/",
            "docs": f"{self.BASE_URL}/docs", 
            "openapi": f"{self.BASE_URL}/openapi.json",
            "redoc": f"{self.BASE_URL}/redoc",
        }
    
    @pytest.fixture(scope="class")
    def server_health_check(self, api_endpoints: Dict[str, str]) -> bool:
        """Fixture to verify server is running before running tests."""
        try:
            response = requests.get(api_endpoints["root"], timeout=5)
            if response.status_code == 200:
                return True
            else:
                pytest.skip(f"Server not healthy. Status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            pytest.skip("Server is not running. Start with: python -m uvicorn backend.main:app --reload --port 8000")
        except Exception as e:
            pytest.skip(f"Cannot connect to server: {e}")
    
    def test_server_responds(self, api_endpoints: Dict[str, str], server_health_check: bool):
        """Test that the FastAPI server is running and responds correctly."""
        response = requests.get(api_endpoints["root"], timeout=5)
        
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "Na Winie API" in data["message"]
    
    def test_server_headers(self, api_endpoints: Dict[str, str], server_health_check: bool):
        """Test that server returns proper headers."""
        response = requests.get(api_endpoints["root"], timeout=5)
        
        assert response.status_code == 200
        
        # Check CORS headers are present
        headers = response.headers
        assert "access-control-allow-origin" in headers or "Access-Control-Allow-Origin" in headers
        assert "content-type" in headers
        assert "application/json" in headers.get("content-type", "")


class TestAPIDocumentation:
    """Tests for API documentation endpoints."""
    
    BASE_URL = "http://localhost:8000"
    
    @pytest.fixture(scope="class")
    def openapi_schema(self) -> Dict[str, Any]:
        """Fixture to get OpenAPI schema."""
        try:
            response = requests.get(f"{self.BASE_URL}/openapi.json", timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                pytest.skip(f"Cannot get OpenAPI schema. Status: {response.status_code}")
        except Exception as e:
            pytest.skip(f"Cannot connect to server: {e}")
    
    def test_openapi_schema_available(self, openapi_schema: Dict[str, Any]):
        """Test that OpenAPI schema is accessible and valid."""
        assert "paths" in openapi_schema
        assert "info" in openapi_schema
        assert "openapi" in openapi_schema
        
        # Check basic info
        info = openapi_schema["info"]
        assert "title" in info
        assert "version" in info
        assert "Na Winie API" in info["title"]
    
    def test_swagger_docs_accessible(self):
        """Test that Swagger UI documentation is accessible."""
        response = requests.get(f"{self.BASE_URL}/docs", timeout=5)
        
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        assert "swagger" in response.text.lower() or "openapi" in response.text.lower()
    
    def test_redoc_accessible(self):
        """Test that ReDoc documentation is accessible."""
        response = requests.get(f"{self.BASE_URL}/redoc", timeout=5)
        
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
    
    def test_documented_endpoints_structure(self, openapi_schema: Dict[str, Any]):
        """Test that documented endpoints have proper structure."""
        paths = openapi_schema["paths"]
        
        # Should have some endpoints
        assert len(paths) > 0
        
        # Check that endpoints have proper HTTP methods and documentation
        for path, methods in paths.items():
            assert isinstance(path, str)
            assert path.startswith("/")
            
            for method, details in methods.items():
                if method.lower() in ["get", "post", "put", "delete", "patch"]:
                    assert "responses" in details
                    assert "summary" in details or "description" in details


class TestAuthenticationEndpoints:
    """Tests for authentication-related functionality."""
    
    BASE_URL = "http://localhost:8000"
    
    def test_protected_endpoint_requires_auth(self):
        """Test that protected endpoints require authentication."""
        # Try a few common protected endpoints without auth
        protected_endpoints = [
            "/api/users/me",
            "/api/users/me/recipe-views",
            "/api/users/me/default-ingredients"
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = requests.get(f"{self.BASE_URL}{endpoint}", timeout=5)
                # Should return 401 Unauthorized or 403 Forbidden
                assert response.status_code in [401, 403], f"Endpoint {endpoint} should require auth"
                
                # Should return proper error message
                try:
                    error_data = response.json()
                    assert "detail" in error_data
                except json.JSONDecodeError:
                    pass  # Some endpoints might not return JSON
                    
            except requests.exceptions.ConnectionError:
                pytest.skip(f"Cannot test {endpoint} - server not accessible")
    
    def test_invalid_token_rejection(self):
        """Test that invalid tokens are properly rejected."""
        headers = {"Authorization": "Bearer invalid-token-12345"}
        
        protected_endpoints = [
            "/api/users/me",
            "/api/users/me/recipe-views"
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = requests.get(f"{self.BASE_URL}{endpoint}", headers=headers, timeout=5)
                assert response.status_code == 401, f"Invalid token should be rejected for {endpoint}"
                
                error_data = response.json()
                assert "detail" in error_data
                assert "authentication" in error_data["detail"].lower()
                
            except requests.exceptions.ConnectionError:
                pytest.skip(f"Cannot test {endpoint} - server not accessible")
    
    def test_malformed_auth_headers(self):
        """Test that malformed authorization headers are handled."""
        malformed_headers = [
            {"Authorization": "just-a-token"},  # Missing Bearer
            {"Authorization": "Bearer "},       # Empty token
            {"Authorization": ""},              # Empty header
        ]
        
        for headers in malformed_headers:
            try:
                response = requests.get(f"{self.BASE_URL}/api/users/me", headers=headers, timeout=5)
                assert response.status_code in [401, 403], f"Malformed header should be rejected: {headers}"
            except requests.exceptions.ConnectionError:
                pytest.skip("Cannot test malformed headers - server not accessible")


class TestEndpointValidation:
    """Tests for endpoint parameter validation."""
    
    BASE_URL = "http://localhost:8000"
    
    def test_pagination_parameter_validation(self):
        """Test that pagination parameters are validated properly."""
        endpoint = f"{self.BASE_URL}/api/users/me/recipe-views"
        
        # Test invalid pagination (should still require auth first)
        invalid_params = [
            {"page": 0},           # Page should be >= 1
            {"page": -1},          # Negative page
            {"limit": 0},          # Limit should be >= 1
            {"limit": 101},        # Limit should be <= 100
            {"limit": -1},         # Negative limit
        ]
        
        for params in invalid_params:
            try:
                response = requests.get(endpoint, params=params, timeout=5)
                # Should still require auth first (401/403) rather than validation error (400)
                assert response.status_code in [401, 403], f"Should require auth before validating: {params}"
            except requests.exceptions.ConnectionError:
                pytest.skip("Cannot test pagination - server not accessible")


@pytest.mark.performance
class TestServerPerformance:
    """Performance tests for server responsiveness."""
    
    BASE_URL = "http://localhost:8000"
    
    def test_server_response_time(self):
        """Test that server responds within reasonable time."""
        start_time = datetime.now()
        
        try:
            response = requests.get(f"{self.BASE_URL}/", timeout=10)
            
            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()
            
            # Should respond within 2 seconds for basic endpoint
            assert response_time < 2.0, f"Server response too slow: {response_time}s"
            assert response.status_code == 200
            
        except requests.exceptions.Timeout:
            pytest.fail("Server timed out - performance issue detected")
    
    def test_concurrent_requests_handling(self):
        """Test that server can handle multiple concurrent requests."""
        results = []
        
        def make_request():
            try:
                start = time.time()
                response = requests.get(f"{self.BASE_URL}/", timeout=5)
                duration = time.time() - start
                results.append({
                    "status": response.status_code,
                    "duration": duration,
                    "success": response.status_code == 200
                })
            except Exception as e:
                results.append({
                    "status": None,
                    "duration": float('inf'),
                    "success": False,
                    "error": str(e)
                })
        
        # Make 5 concurrent requests
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all requests to complete
        for thread in threads:
            thread.join(timeout=10)
        
        # All requests should complete successfully
        assert len(results) == 5
        
        successful_requests = [r for r in results if r["success"]]
        assert len(successful_requests) == 5, f"Some requests failed: {results}"
        
        # Average response time should be reasonable
        avg_duration = sum(r["duration"] for r in successful_requests) / len(successful_requests)
        assert avg_duration < 2.0, f"Average response time too slow: {avg_duration}s"
    
    def test_multiple_endpoints_performance(self):
        """Test performance across multiple endpoints."""
        endpoints = [
            "/",
            "/docs",
            "/openapi.json",
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            try:
                response = requests.get(f"{self.BASE_URL}{endpoint}", timeout=5)
                duration = time.time() - start_time
                
                assert response.status_code == 200, f"Endpoint {endpoint} should be accessible"
                assert duration < 3.0, f"Endpoint {endpoint} too slow: {duration}s"
                
            except requests.exceptions.ConnectionError:
                pytest.skip(f"Cannot test {endpoint} - server not accessible")


class TestSpecificEndpoints:
    """Tests for specific application endpoints."""
    
    BASE_URL = "http://localhost:8000"
    
    def test_recipe_views_endpoint_exists(self):
        """Test that recipe views endpoint exists and requires auth."""
        response = requests.get(f"{self.BASE_URL}/api/users/me/recipe-views", timeout=5)
        
        # Should require authentication
        assert response.status_code in [401, 403]
        
        error_data = response.json()
        assert "detail" in error_data
    
    def test_users_me_endpoint_exists(self):
        """Test that users/me endpoint exists and requires auth."""
        response = requests.get(f"{self.BASE_URL}/api/users/me", timeout=5)
        
        # Should require authentication
        assert response.status_code in [401, 403]
    
    def test_ingredients_endpoint_accessible(self):
        """Test that ingredients endpoint is accessible (if public)."""
        try:
            response = requests.get(f"{self.BASE_URL}/api/ingredients", timeout=5)
            # Could be 200 (public) or 401/403 (requires auth)
            assert response.status_code in [200, 401, 403]
        except requests.exceptions.ConnectionError:
            pytest.skip("Cannot test ingredients endpoint - server not accessible")


if __name__ == "__main__":
    # Allow running this file directly with python
    pytest.main([__file__, "-v", "--tb=short"]) 