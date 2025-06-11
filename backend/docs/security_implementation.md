# Security Implementation Documentation

## Overview

This document describes the security features implemented in the Na Winie API, specifically for the user default ingredients functionality and overall application security.

## Security Features Implemented

### 1. Rate Limiting

**Purpose**: Prevent abuse and DoS attacks by limiting the number of requests per user/IP.

**Implementation**:
- Sliding window rate limiter with in-memory storage
- Configurable limits per endpoint type
- User-based limiting (JWT user_id) with IP fallback

**Rate Limits**:
```python
LIMITS = {
    'user_defaults_get': (200, 60),      # 200 GET requests/minute
    'user_defaults_post': (20, 60),      # 20 POST requests/minute
    'user_defaults_delete': (50, 60),    # 50 DELETE requests/minute
    'ingredients_get': (100, 60),        # 100 GET requests/minute
    'ingredients_post': (10, 60),        # 10 POST requests/minute
    'general': (1000, 60),               # 1000 requests/minute overall
}
```

**Usage**:
```python
@router.get("/")
async def get_user_default_ingredients(
    _rate_limit: None = Depends(rate_limit_dependency("user_defaults_get"))
):
    pass
```

**Headers Returned**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (on 429 error)

### 2. Input Sanitization

**Purpose**: Prevent XSS, SQL injection, and other input-based attacks.

**Features**:
- HTML escaping for all string inputs
- SQL injection pattern detection
- XSS pattern detection  
- UUID format validation
- Search query sanitization
- Request data sanitization

**Usage**:
```python
from backend.utils.input_sanitizer import sanitize_string, validate_uuid

# Sanitize user input
clean_name = sanitize_string(user_input, max_length=100)

# Validate UUID
ingredient_uuid = validate_uuid(ingredient_id)

# Sanitize entire request payload
sanitized_data = InputSanitizer.sanitize_request_data(request_data)
```

**Patterns Detected**:

*SQL Injection*:
- `SELECT ... FROM`
- `DROP TABLE`
- `UNION SELECT`
- SQL comments (`--`, `/*`)
- Quote patterns

*XSS*:
- `<script>` tags
- `javascript:` URLs
- Event handlers (`onclick=`, etc.)
- `<iframe>`, `<object>`, `<embed>` tags

### 3. Security Middleware

**Purpose**: Automatic security monitoring and header injection.

**Features**:
- Suspicious path detection
- Malicious user agent detection
- Security header injection
- Request monitoring and logging
- Slow request detection

**Security Headers Added**:
```python
{
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY", 
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
}
```

**Suspicious Patterns Detected**:
- Admin paths: `/admin`, `/wp-admin`, `/phpmyadmin`
- Config files: `/.env`, `/config`, `/.git`
- Path traversal: `../`, `..\\`
- Scanner user agents: `sqlmap`, `nikto`, `nmap`, `burpsuite`

### 4. Performance Monitoring

**Purpose**: Track API performance and detect anomalies.

**Metrics Tracked**:
- Request duration per endpoint
- Error rates
- System resource usage (CPU, memory, disk)
- Request patterns and volumes

**Health Check Endpoints**:
- `GET /api/monitoring/health` - Basic health status
- `GET /api/monitoring/metrics` - Detailed performance metrics
- `GET /api/monitoring/cache/stats` - Cache statistics

**Health Status Levels**:
- `healthy`: All metrics within normal ranges
- `degraded`: Some metrics elevated but functional
- `unhealthy`: Critical metrics exceeded, service impaired

### 5. Authentication & Authorization

**JWT Token Security**:
- Token expiration validation
- User isolation (users can only access their own data)
- Secure user ID extraction from tokens

**Authorization Checks**:
```python
# Ensure user can only access their own default ingredients
if user_default.user_id != current_user_id:
    raise HTTPException(404, "Default ingredient not found")
```

## Security Testing

### Unit Tests
- Input sanitization functions
- Rate limiting logic
- UUID validation
- Pagination parameter validation

### Integration Tests  
- Security middleware functionality
- Rate limiting on endpoints
- Input sanitization in request flow
- Security header injection

### Security Test Cases
- SQL injection attempts
- XSS payload detection
- Rate limit enforcement
- Suspicious path access
- Malicious user agent detection

## Security Configuration

### Environment Variables
```bash
# Rate limiting (optional, defaults provided)
RATE_LIMIT_GENERAL=1000
RATE_LIMIT_USER_DEFAULTS_GET=200
RATE_LIMIT_USER_DEFAULTS_POST=20

# Security monitoring
SECURITY_LOG_LEVEL=WARNING
SUSPICIOUS_ACTIVITY_THRESHOLD=10
```

### Logging Configuration
Security events are logged with structured JSON format:
```json
{
  "timestamp": 1703076000.0,
  "event_type": "suspicious_path", 
  "client_ip": "192.168.1.100",
  "details": {
    "path": "/admin",
    "user_agent": "sqlmap/1.0"
  }
}
```

## Best Practices

### For Developers

1. **Always use input sanitization** for user-provided data
2. **Apply rate limiting** to all public endpoints
3. **Validate UUIDs** using the provided utility functions
4. **Log security events** using the security utilities
5. **Test security features** in all new endpoints

### For Operations

1. **Monitor security logs** for suspicious activity
2. **Set up alerts** for high error rates or unusual patterns
3. **Review rate limit configurations** based on usage patterns
4. **Keep security headers** updated with current best practices
5. **Regularly test** security measures with controlled attacks

## Future Enhancements

1. **Redis-based rate limiting** for distributed deployments
2. **CAPTCHA integration** for repeated violations
3. **IP blacklisting** for persistent attackers
4. **Advanced anomaly detection** using ML models
5. **Integration with SIEM systems** for enterprise monitoring

## Compliance

This implementation helps meet security requirements for:
- **OWASP Top 10** protection
- **Input validation** standards
- **Rate limiting** best practices
- **Security monitoring** requirements
- **Data protection** regulations 