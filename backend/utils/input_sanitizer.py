"""
Input sanitization utilities for Na Winie API.
"""

import re
import html
from typing import Optional, Any
from uuid import UUID
import logging

logger = logging.getLogger(__name__)

class InputSanitizer:
    """Utilities for sanitizing user input data."""
    
    # Regex patterns for validation
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)
    SAFE_TEXT_PATTERN = re.compile(r'^[a-zA-Z0-9\s\-_.,!?()]+$')
    
    # Dangerous SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        re.compile(r'(\bSELECT\b.*\bFROM\b)', re.IGNORECASE),
        re.compile(r'(\bINSERT\b.*\bINTO\b)', re.IGNORECASE), 
        re.compile(r'(\bUPDATE\b.*\bSET\b)', re.IGNORECASE),
        re.compile(r'(\bDELETE\b.*\bFROM\b)', re.IGNORECASE),
        re.compile(r'(\bDROP\b.*\bTABLE\b)', re.IGNORECASE),
        re.compile(r'(\bUNION\b.*\bSELECT\b)', re.IGNORECASE),
        re.compile(r'(\bEXEC\b|\bEXECUTE\b)', re.IGNORECASE),
        re.compile(r'(--|\#|\/\*|\*\/)', re.IGNORECASE),
        # More specific SQL quote patterns (with SQL keywords)
        re.compile(r"('.*\b(OR|AND|SELECT|FROM|WHERE|INSERT|DELETE|UPDATE|DROP)\b.*')", re.IGNORECASE),
        re.compile(r"(\".*\b(OR|AND|SELECT|FROM|WHERE|INSERT|DELETE|UPDATE|DROP)\b.*\")", re.IGNORECASE),
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        re.compile(r'<script[^>]*>', re.IGNORECASE),
        re.compile(r'</script>', re.IGNORECASE),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'<iframe[^>]*>', re.IGNORECASE),
        re.compile(r'<object[^>]*>', re.IGNORECASE),
        re.compile(r'<embed[^>]*>', re.IGNORECASE),
    ]

    @staticmethod
    def sanitize_string(text: Optional[str], max_length: int = 255, allow_special_chars: bool = False) -> Optional[str]:
        """
        Sanitize string input.
        
        Args:
            text: Input string to sanitize
            max_length: Maximum allowed length
            allow_special_chars: Whether to allow special characters
            
        Returns:
            Sanitized string or None if input was None/empty
            
        Raises:
            ValueError: If input contains dangerous patterns
        """
        if text is None:
            return None
        
        # Convert to string and strip whitespace
        text = str(text).strip()
        
        if not text:
            return None
        
        # Check for SQL injection patterns
        for pattern in InputSanitizer.SQL_INJECTION_PATTERNS:
            if pattern.search(text):
                logger.warning(f"Potential SQL injection attempt detected: {text[:50]}...")
                raise ValueError("Invalid characters detected in input")
        
        # When allow_special_chars is False (default), check for XSS patterns and reject
        # When allow_special_chars is True, escape HTML but don't reject
        if not allow_special_chars:
            for pattern in InputSanitizer.XSS_PATTERNS:
                if pattern.search(text):
                    logger.warning(f"Potential XSS attempt detected: {text[:50]}...")
                    raise ValueError("Invalid characters detected in input")
        
        # HTML escape the content to prevent XSS while preserving the text
        text = html.escape(text)
        
        # Check against safe text pattern if special chars not allowed
        # But allow HTML escaped content to pass through
        if not allow_special_chars and not InputSanitizer.SAFE_TEXT_PATTERN.match(text):
            # Allow escaped HTML characters to pass
            if not any(escaped in text for escaped in ['&lt;', '&gt;', '&amp;', '&quot;', '&#x27;']):
                raise ValueError("Text contains invalid characters")
        
        # Truncate if too long
        if len(text) > max_length:
            logger.warning(f"Input text truncated from {len(text)} to {max_length} characters")
            text = text[:max_length]
        
        return text

    @staticmethod
    def sanitize_search_query(query: Optional[str]) -> Optional[str]:
        """
        Sanitize search query input.
        
        Args:
            query: Search query string
            
        Returns:
            Sanitized query string
        """
        if not query:
            return None
        
        # Basic sanitization for search
        sanitized = InputSanitizer.sanitize_string(query, max_length=100, allow_special_chars=True)
        
        if not sanitized:
            return None
        
        # Remove potentially dangerous SQL wildcards/operators if not escaped
        sanitized = sanitized.replace('%', '\\%').replace('_', '\\_')
        
        # Remove multiple spaces
        sanitized = re.sub(r'\s+', ' ', sanitized)
        
        return sanitized

    @staticmethod
    def sanitize_ingredient_name(name: Optional[str]) -> Optional[str]:
        """
        Sanitize ingredient name.
        
        Args:
            name: Ingredient name
            
        Returns:
            Sanitized and capitalized ingredient name
        """
        if not name:
            return None
        
        # Basic sanitization
        sanitized = InputSanitizer.sanitize_string(name, max_length=100, allow_special_chars=False)
        
        if not sanitized:
            return None
        
        # Capitalize first letter of each word
        sanitized = sanitized.title()
        
        # Remove extra spaces
        sanitized = re.sub(r'\s+', ' ', sanitized)
        
        return sanitized

    @staticmethod
    def validate_uuid(uuid_str: Any) -> UUID:
        """
        Validate and convert UUID string.
        
        Args:
            uuid_str: UUID string or UUID object
            
        Returns:
            Validated UUID object
            
        Raises:
            ValueError: If UUID is invalid
        """
        if isinstance(uuid_str, UUID):
            return uuid_str
        
        if not isinstance(uuid_str, str):
            raise ValueError("UUID must be a string")
        
        uuid_str = uuid_str.strip().lower()
        
        if not InputSanitizer.UUID_PATTERN.match(uuid_str):
            raise ValueError("Invalid UUID format")
        
        try:
            return UUID(uuid_str)
        except ValueError as e:
            logger.warning(f"Invalid UUID format: {uuid_str}")
            raise ValueError("Invalid UUID format") from e

    @staticmethod
    def validate_pagination_params(page: int, limit: int, max_limit: int = 100) -> tuple[int, int]:
        """
        Validate and sanitize pagination parameters.
        
        Args:
            page: Page number
            limit: Items per page
            max_limit: Maximum allowed limit
            
        Returns:
            Tuple of validated (page, limit)
            
        Raises:
            ValueError: If parameters are invalid
        """
        # Validate page
        if not isinstance(page, int) or page < 1:
            raise ValueError("Page must be a positive integer")
        
        if page > 10000:  # Reasonable upper limit to prevent abuse
            raise ValueError("Page number too large")
        
        # Validate limit
        if not isinstance(limit, int) or limit < 1:
            raise ValueError("Limit must be a positive integer")
        
        if limit > max_limit:
            raise ValueError(f"Limit cannot exceed {max_limit}")
        
        return page, limit

    @staticmethod
    def sanitize_request_data(data: dict) -> dict:
        """
        Sanitize all string values in request data.
        
        Args:
            data: Dictionary with request data
            
        Returns:
            Dictionary with sanitized string values
        """
        sanitized = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Different sanitization based on field name
                if 'name' in key.lower():
                    sanitized[key] = InputSanitizer.sanitize_ingredient_name(value)
                elif 'search' in key.lower() or 'query' in key.lower():
                    sanitized[key] = InputSanitizer.sanitize_search_query(value)
                else:
                    sanitized[key] = InputSanitizer.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = InputSanitizer.sanitize_request_data(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    InputSanitizer.sanitize_string(item) if isinstance(item, str) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized

# Global sanitizer instance
input_sanitizer = InputSanitizer()

def sanitize_string(text: Optional[str], max_length: int = 255) -> Optional[str]:
    """Convenience function for string sanitization."""
    return InputSanitizer.sanitize_string(text, max_length)

def sanitize_search_query(query: Optional[str]) -> Optional[str]:
    """Convenience function for search query sanitization."""
    return InputSanitizer.sanitize_search_query(query)

def validate_uuid(uuid_str: Any) -> UUID:
    """Convenience function for UUID validation."""
    return InputSanitizer.validate_uuid(uuid_str) 