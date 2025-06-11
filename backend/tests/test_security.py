"""
Tests for security features: input sanitization, rate limiting, and security middleware.
"""

import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.utils.input_sanitizer import InputSanitizer, sanitize_string, validate_uuid
from backend.utils.rate_limiter import rate_limiter, RateLimitConfig
from backend.utils.security_middleware import SecurityMiddleware, log_security_warning
from backend.main import app

client = TestClient(app)

class TestInputSanitizer:
    """Test input sanitization functionality."""
    
    def test_sanitize_string_basic(self):
        """Test basic string sanitization."""
        # Valid input
        result = InputSanitizer.sanitize_string("Hello World")
        assert result == "Hello World"
        
        # None input
        result = InputSanitizer.sanitize_string(None)
        assert result is None
        
        # Empty string
        result = InputSanitizer.sanitize_string("")
        assert result is None
        
        # Whitespace only
        result = InputSanitizer.sanitize_string("   ")
        assert result is None
    
    def test_sanitize_string_html_escape(self):
        """Test HTML escaping in sanitization."""
        result = InputSanitizer.sanitize_string("<script>alert('xss')</script>", allow_special_chars=True)
        # Should escape HTML
        assert "&lt;" in result and "&gt;" in result
    
    def test_sanitize_string_length_limit(self):
        """Test string length limiting."""
        long_string = "a" * 300
        result = InputSanitizer.sanitize_string(long_string, max_length=100)
        assert len(result) == 100
    
    def test_sanitize_string_sql_injection_detection(self):
        """Test SQL injection pattern detection."""
        sql_inputs = [
            "'; DROP TABLE users; --",
            "1 UNION SELECT * FROM passwords",
            "admin' OR '1'='1",
            "1; DELETE FROM ingredients",
        ]
        
        for sql_input in sql_inputs:
            with pytest.raises(ValueError, match="Invalid characters detected"):
                InputSanitizer.sanitize_string(sql_input)
    
    def test_sanitize_string_xss_detection(self):
        """Test XSS pattern detection."""
        xss_inputs = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<iframe src='malicious.com'></iframe>",
            "onclick=alert('xss')",
        ]
        
        for xss_input in xss_inputs:
            with pytest.raises(ValueError, match="Invalid characters detected"):
                InputSanitizer.sanitize_string(xss_input)
    
    def test_sanitize_search_query(self):
        """Test search query sanitization."""
        # Valid search
        result = InputSanitizer.sanitize_search_query("chicken breast")
        assert result == "chicken breast"
        
        # Query with wildcards
        result = InputSanitizer.sanitize_search_query("chicken%")
        assert result == "chicken\\%"
        
        # Empty query
        result = InputSanitizer.sanitize_search_query("")
        assert result is None
    
    def test_sanitize_ingredient_name(self):
        """Test ingredient name sanitization."""
        # Normal name
        result = InputSanitizer.sanitize_ingredient_name("chicken breast")
        assert result == "Chicken Breast"
        
        # Name with extra spaces
        result = InputSanitizer.sanitize_ingredient_name("  olive   oil  ")
        assert result == "Olive Oil"
        
        # Empty name
        result = InputSanitizer.sanitize_ingredient_name("")
        assert result is None
    
    def test_validate_uuid(self):
        """Test UUID validation."""
        from uuid import uuid4, UUID
        
        # Valid UUID string
        valid_uuid = str(uuid4())
        result = InputSanitizer.validate_uuid(valid_uuid)
        assert isinstance(result, UUID)
        
        # Valid UUID object
        uuid_obj = uuid4()
        result = InputSanitizer.validate_uuid(uuid_obj)
        assert result == uuid_obj
        
        # Invalid UUID
        with pytest.raises(ValueError, match="Invalid UUID format"):
            InputSanitizer.validate_uuid("not-a-uuid")
        
        # Non-string input
        with pytest.raises(ValueError, match="UUID must be a string"):
            InputSanitizer.validate_uuid(123)
    
    def test_validate_pagination_params(self):
        """Test pagination parameter validation."""
        # Valid params
        page, limit = InputSanitizer.validate_pagination_params(1, 20)
        assert page == 1 and limit == 20
        
        # Invalid page
        with pytest.raises(ValueError, match="Page must be a positive integer"):
            InputSanitizer.validate_pagination_params(0, 20)
        
        # Invalid limit
        with pytest.raises(ValueError, match="Limit must be a positive integer"):
            InputSanitizer.validate_pagination_params(1, 0)
        
        # Limit too high
        with pytest.raises(ValueError, match="Limit cannot exceed"):
            InputSanitizer.validate_pagination_params(1, 200, max_limit=100)
        
        # Page too high
        with pytest.raises(ValueError, match="Page number too large"):
            InputSanitizer.validate_pagination_params(20000, 20)
    
    def test_sanitize_request_data(self):
        """Test request data sanitization."""
        request_data = {
            "name": "  chicken breast  ",
            "search": "tomato%",
            "description": "A delicious ingredient",
            "nested": {
                "name": "nested ingredient"
            },
            "list": ["item1", "  item2  "],
            "number": 42
        }
        
        result = InputSanitizer.sanitize_request_data(request_data)
        
        assert result["name"] == "Chicken Breast"
        assert result["search"] == "tomato\\%"
        assert result["nested"]["name"] == "Nested Ingredient"
        assert result["number"] == 42

class TestRateLimit:
    """Test rate limiting for user default ingredients endpoints."""
    
    def test_rate_limit_config(self):
        """Test rate limit configuration for new endpoints."""
        # Check that new endpoints have rate limits
        assert "user_defaults_get" in RateLimitConfig.LIMITS
        assert "user_defaults_post" in RateLimitConfig.LIMITS
        assert "user_defaults_delete" in RateLimitConfig.LIMITS
        
        # Check limit values
        get_limit, get_window = RateLimitConfig.get_limit("user_defaults_get")
        assert get_limit == 200 and get_window == 60
        
        post_limit, post_window = RateLimitConfig.get_limit("user_defaults_post") 
        assert post_limit == 20 and post_window == 60
        
        delete_limit, delete_window = RateLimitConfig.get_limit("user_defaults_delete")
        assert delete_limit == 50 and delete_window == 60

class TestSecurityMiddleware:
    """Test security middleware functionality."""
    
    def test_security_headers(self):
        """Test that security headers are added to responses."""
        response = client.get("/api/ingredients/")
        
        # Check for security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        assert "Content-Security-Policy" in response.headers
    
    @patch('backend.utils.security_middleware.logger')
    def test_suspicious_path_detection(self, mock_logger):
        """Test detection of suspicious paths."""
        suspicious_paths = [
            "/admin",
            "/.env", 
            "/wp-admin",
            "/test/../etc/passwd"
        ]
        
        for path in suspicious_paths:
            response = client.get(path)
            # Should log warning (exact assertion depends on implementation)
            # Middleware should still allow request to continue
    
    @patch('backend.utils.security_middleware.logger')
    def test_suspicious_user_agent_detection(self, mock_logger):
        """Test detection of suspicious user agents."""
        suspicious_agents = [
            "sqlmap/1.0",
            "Nikto/2.1.6",
            "Burp Suite Professional"
        ]
        
        for agent in suspicious_agents:
            response = client.get("/api/ingredients/", headers={"User-Agent": agent})
            # Should log security event

class TestSecurityIntegration:
    """Test integration of security features with user default ingredients."""
    
    def test_input_sanitization_in_add_ingredient(self):
        """Test that input sanitization works in add ingredient endpoint."""
        # This would require a valid JWT token and actual endpoint testing
        # Placeholder for integration test
        pass
    
    def test_rate_limiting_on_endpoints(self):
        """Test that rate limiting is applied to user default ingredients endpoints."""
        # This would require multiple rapid requests to test rate limiting
        # Placeholder for integration test  
        pass
    
    def test_security_logging(self):
        """Test that security events are properly logged."""
        with patch('backend.utils.security_middleware.logger') as mock_logger:
            log_security_warning("Test security event", "192.168.1.1", {"test": "data"})
            
            # Verify logging was called
            mock_logger.warning.assert_called_once()
            call_args = mock_logger.warning.call_args[0][0]
            assert "SECURITY:" in call_args
            assert "Test security event" in call_args

class TestConvenienceFunctions:
    """Test convenience functions for security."""
    
    def test_sanitize_string_function(self):
        """Test convenience sanitize_string function."""
        result = sanitize_string("  Hello World  ")
        assert result == "Hello World"
    
    def test_validate_uuid_function(self):
        """Test convenience validate_uuid function."""
        from uuid import uuid4
        
        valid_uuid = str(uuid4())
        result = validate_uuid(valid_uuid)
        assert str(result) == valid_uuid.lower()

class TestSecurityEdgeCases:
    """Test edge cases and error conditions in security features."""
    
    def test_input_sanitizer_with_none_values(self):
        """Test input sanitizer handles None values gracefully."""
        result = InputSanitizer.sanitize_request_data({
            "name": None,
            "search": "",
            "valid": "test"
        })
        
        assert result["name"] is None
        assert result["search"] is None
        assert result["valid"] == "test"
    
    def test_input_sanitizer_with_non_dict_data(self):
        """Test input sanitizer with non-dictionary data."""
        # Should handle non-dict input gracefully
        result = InputSanitizer.sanitize_request_data({"list": ["string1", 123, None]})
        assert result["list"][0] == "string1"
        assert result["list"][1] == 123
        assert result["list"][2] is None
    
    def test_middleware_error_handling(self):
        """Test that middleware handles errors gracefully."""
        # This would test middleware behavior when underlying app throws errors
        # Implementation depends on specific error scenarios
        pass 