"""
Security middleware for Na Winie API.
"""

import time
import json
from typing import Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

from .input_sanitizer import InputSanitizer
from .monitoring import performance_monitor

logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """Middleware for security monitoring and input sanitization."""
    
    def __init__(self, app):
        self.app = app
        self.suspicious_activity_threshold = 10  # Suspicious attempts per minute
        self.user_activity_tracker: Dict[str, list] = {}
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        start_time = time.time()
        
        # Track security events
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        try:
            # Check for suspicious patterns in URL
            path = request.url.path
            if self._is_suspicious_path(path):
                logger.warning(f"Suspicious path accessed from {client_ip}: {path}")
                await self._log_security_event("suspicious_path", client_ip, {"path": path})
            
            # Check for suspicious headers
            if self._has_suspicious_headers(request):
                logger.warning(f"Suspicious headers from {client_ip}")
                await self._log_security_event("suspicious_headers", client_ip, {"user_agent": user_agent})
            
            # Monitor request patterns
            self._track_user_activity(client_ip)
            
            # Call the main application
            response = await self._call_app_with_monitoring(scope, receive, send, start_time)
            
        except Exception as e:
            logger.error(f"Security middleware error: {e}")
            # Continue with normal flow even if security monitoring fails
            await self.app(scope, receive, send)
    
    async def _call_app_with_monitoring(self, scope, receive, send, start_time: float):
        """Call the app with response monitoring."""
        status_code = 200
        
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
                
                # Add security headers
                headers = list(message.get("headers", []))
                security_headers = self._get_security_headers()
                for name, value in security_headers.items():
                    headers.append([name.encode(), value.encode()])
                message["headers"] = headers
            
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            status_code = 500
            logger.error(f"Application error: {e}")
            raise
        finally:
            # Log security metrics
            end_time = time.time()
            duration = end_time - start_time
            
            # Log slow requests (potential DoS)
            if duration > 5.0:  # > 5 seconds
                client_ip = scope.get("client", {}).get("host", "unknown")
                path = scope.get("path", "/")
                logger.warning(f"Slow request from {client_ip}: {path} took {duration:.2f}s")
                await self._log_security_event("slow_request", client_ip, {
                    "path": path,
                    "duration": duration
                })
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address."""
        # Check X-Forwarded-For header (proxy/load balancer)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"
    
    def _is_suspicious_path(self, path: str) -> bool:
        """Check if the path contains suspicious patterns."""
        suspicious_patterns = [
            "/.env", "/config", "/admin", "/phpmyadmin", "/wp-admin",
            "/backup", "/test", "/debug", "/.git", "/sql",
            "../", "..\\", "<script", "javascript:", "data:",
            "union select", "drop table", "exec(", "eval(",
        ]
        
        path_lower = path.lower()
        return any(pattern in path_lower for pattern in suspicious_patterns)
    
    def _has_suspicious_headers(self, request: Request) -> bool:
        """Check for suspicious request headers."""
        user_agent = request.headers.get("user-agent", "").lower()
        
        # Common bot/scanner patterns
        suspicious_ua_patterns = [
            "sqlmap", "nikto", "nmap", "masscan", "dirb", "gobuster",
            "burpsuite", "nessus", "openvas", "acunetix", "appscan",
            "w3af", "skipfish", "wpscan", "whatweb"
        ]
        
        return any(pattern in user_agent for pattern in suspicious_ua_patterns)
    
    def _track_user_activity(self, client_ip: str):
        """Track user activity for rate limiting and anomaly detection."""
        current_time = time.time()
        
        if client_ip not in self.user_activity_tracker:
            self.user_activity_tracker[client_ip] = []
        
        activity_log = self.user_activity_tracker[client_ip]
        activity_log.append(current_time)
        
        # Clean old entries (older than 1 minute)
        cutoff_time = current_time - 60
        self.user_activity_tracker[client_ip] = [
            timestamp for timestamp in activity_log if timestamp > cutoff_time
        ]
        
        # Check for suspicious activity
        recent_requests = len(self.user_activity_tracker[client_ip])
        if recent_requests > self.suspicious_activity_threshold:
            logger.warning(f"High request volume from {client_ip}: {recent_requests} requests/minute")
    
    def _get_security_headers(self) -> Dict[str, str]:
        """Get security headers to add to responses."""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
        }
    
    async def _log_security_event(self, event_type: str, client_ip: str, details: Dict[str, Any]):
        """Log security events for monitoring."""
        security_event = {
            "timestamp": time.time(),
            "event_type": event_type,
            "client_ip": client_ip,
            "details": details
        }
        
        # In production, this could be sent to a SIEM system
        logger.warning(f"Security event: {json.dumps(security_event)}")

class InputSanitizationMiddleware:
    """Middleware for automatic input sanitization."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Only sanitize POST/PUT/PATCH requests with JSON bodies
        if scope.get("method") in ["POST", "PUT", "PATCH"]:
            try:
                # Check if there's a content-length header to avoid hanging on empty bodies
                headers = dict(scope.get("headers", []))
                content_length = headers.get(b"content-length")
                content_type = headers.get(b"content-type", b"").decode().lower()
                
                # Only process if there's actual content and it's JSON
                if content_length and int(content_length) > 0 and "application/json" in content_type:
                    request = Request(scope, receive)
                    body = await request.body()
                    
                    if body:
                        # Try to parse as JSON
                        try:
                            data = json.loads(body)
                            if isinstance(data, dict):
                                # Sanitize the data
                                sanitized_data = InputSanitizer.sanitize_request_data(data)
                                
                                # Replace the body with sanitized data
                                new_body = json.dumps(sanitized_data).encode()
                                
                                # Create new receive function with sanitized body
                                async def sanitized_receive():
                                    return {
                                        "type": "http.request",
                                        "body": new_body,
                                        "more_body": False
                                    }
                                
                                await self.app(scope, sanitized_receive, send)
                                return
                        except json.JSONDecodeError:
                            # Not JSON data, proceed normally
                            pass
            except Exception as e:
                logger.error(f"Input sanitization error: {e}")
                # Continue with original request if sanitization fails
        
        # Default behavior for other requests or when no sanitization needed
        await self.app(scope, receive, send)

# Performance monitoring for specific endpoints
class PerformanceTrackingMixin:
    """Mixin to add performance tracking to services."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.service_name = self.__class__.__name__
    
    def track_operation(self, operation_name: str):
        """Decorator factory for tracking operation performance."""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                try:
                    result = await func(*args, **kwargs) if hasattr(func, '__call__') and hasattr(func, '__await__') else func(*args, **kwargs)
                    return result
                except Exception as e:
                    # Track errors
                    performance_monitor.record_request(
                        endpoint=f"{self.service_name}.{operation_name}",
                        method="SERVICE",
                        duration=time.time() - start_time,
                        status_code=500
                    )
                    raise
                finally:
                    # Track successful operations
                    performance_monitor.record_request(
                        endpoint=f"{self.service_name}.{operation_name}",
                        method="SERVICE", 
                        duration=time.time() - start_time,
                        status_code=200
                    )
            return wrapper
        return decorator

# Security utilities
def log_security_warning(message: str, client_ip: str = None, extra_data: Dict[str, Any] = None):
    """Utility function to log security warnings."""
    log_data = {
        "timestamp": time.time(),
        "message": message,
        "client_ip": client_ip,
        "extra_data": extra_data or {}
    }
    logger.warning(f"SECURITY: {json.dumps(log_data)}")

def is_safe_redirect_url(url: str) -> bool:
    """Check if a redirect URL is safe (prevent open redirects)."""
    if not url:
        return False
    
    # Only allow relative URLs or URLs to same domain
    if url.startswith('/'):
        return True
    
    # Block data: and javascript: URLs
    if url.startswith(('data:', 'javascript:', 'vbscript:')):
        return False
    
    # Block external redirects for now
    return False 