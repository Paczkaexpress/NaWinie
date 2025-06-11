"""
Rate limiting utilities for Na Winie API.
"""

import time
from typing import Dict, Optional, Tuple
from collections import defaultdict, deque
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
import logging

logger = logging.getLogger(__name__)

class SlidingWindowRateLimiter:
    """
    Sliding window rate limiter implementation.
    Tracks requests per user/IP in a time window.
    """
    
    def __init__(self):
        # Structure: {identifier: deque of request timestamps}
        self._windows: Dict[str, deque] = defaultdict(deque)
        self._last_cleanup = time.time()
    
    def is_allowed(self, identifier: str, limit: int, window_seconds: int) -> Tuple[bool, Dict[str, int]]:
        """
        Sprawdza czy request jest dozwolony.
        
        Args:
            identifier: Unique identifier (user_id, IP, etc.)
            limit: Maksymalna liczba requestów w oknie
            window_seconds: Rozmiar okna w sekundach
            
        Returns:
            Tuple[bool, dict]: (is_allowed, rate_limit_info)
        """
        now = time.time()
        window_start = now - window_seconds
        
        # Pobierz okno dla identyfikatora
        window = self._windows[identifier]
        
        # Usuń stare requesty (poza oknem)
        while window and window[0] < window_start:
            window.popleft()
        
        # Sprawdź czy limit został przekroczony
        current_count = len(window)
        
        if current_count >= limit:
            # Rate limit exceeded
            time_until_reset = int(window[0] - window_start) if window else window_seconds
            
            rate_limit_info = {
                'limit': limit,
                'remaining': 0,
                'reset_time': int(now + time_until_reset),
                'retry_after': time_until_reset
            }
            
            logger.warning(f"Rate limit exceeded for {identifier}: {current_count}/{limit}")
            return False, rate_limit_info
        
        # Dodaj obecny request
        window.append(now)
        
        # Cleanup old windows periodically
        if now - self._last_cleanup > 300:  # Co 5 minut
            self._cleanup_old_windows(window_start)
            self._last_cleanup = now
        
        rate_limit_info = {
            'limit': limit,
            'remaining': limit - (current_count + 1),
            'reset_time': int(now + window_seconds),
            'retry_after': 0
        }
        
        return True, rate_limit_info
    
    def _cleanup_old_windows(self, cutoff_time: float) -> None:
        """Usuwa stare okna żeby oszczędzić pamięć."""
        to_remove = []
        
        for identifier, window in self._windows.items():
            # Usuń stare requesty
            while window and window[0] < cutoff_time:
                window.popleft()
            
            # Jeśli okno jest puste, oznacz do usunięcia
            if not window:
                to_remove.append(identifier)
        
        for identifier in to_remove:
            del self._windows[identifier]
        
        if to_remove:
            logger.debug(f"Cleaned up {len(to_remove)} empty rate limit windows")

# Global rate limiter instance
rate_limiter = SlidingWindowRateLimiter()

class RateLimitConfig:
    """Konfiguracja limitów dla różnych endpointów."""
    
    # Limits: (requests_per_minute, window_seconds)
    LIMITS = {
        'ingredients_get': (100, 60),      # 100 GET requests/minute
        'ingredients_post': (10, 60),      # 10 POST requests/minute  
        'ingredients_get_by_id': (200, 60), # 200 GET by ID/minute
        'general': (1000, 60),             # 1000 requests/minute overall
    }
    
    @classmethod
    def get_limit(cls, endpoint: str) -> Tuple[int, int]:
        """Pobiera limit dla endpointu."""
        return cls.LIMITS.get(endpoint, cls.LIMITS['general'])

def get_client_identifier(request: Request) -> str:
    """
    Pobiera identyfikator klienta dla rate limiting.
    Preferuje user_id z JWT, fallback na IP.
    """
    # Spróbuj pobrać user_id z request state (jeśli jest uwierzytelniony)
    user_id = getattr(request.state, 'user_id', None)
    if user_id:
        return f"user:{user_id}"
    
    # Fallback na IP address
    client_ip = request.client.host if request.client else "unknown"
    
    # Sprawdź X-Forwarded-For (proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    return f"ip:{client_ip}"

def rate_limit_dependency(endpoint: str):
    """
    FastAPI dependency dla rate limiting.
    
    Args:
        endpoint: Nazwa endpointu dla konfiguracji limitów
        
    Returns:
        FastAPI dependency function
    """
    
    def check_rate_limit(request: Request) -> None:
        """Sprawdza rate limit dla requestu."""
        identifier = get_client_identifier(request)
        limit, window = RateLimitConfig.get_limit(endpoint)
        
        allowed, rate_info = rate_limiter.is_allowed(identifier, limit, window)
        
        if not allowed:
            logger.warning(f"Rate limit exceeded for {identifier} on {endpoint}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={
                    "X-RateLimit-Limit": str(rate_info['limit']),
                    "X-RateLimit-Remaining": str(rate_info['remaining']),
                    "X-RateLimit-Reset": str(rate_info['reset_time']),
                    "Retry-After": str(rate_info['retry_after'])
                }
            )
        
        # Dodaj headers z informacjami o rate limit
        # FastAPI nie pozwala na dodawanie headers w dependency,
        # więc zapisujemy w request.state do użycia w response
        request.state.rate_limit_info = rate_info
    
    return check_rate_limit

# Funkcje pomocnicze dla rate limiting
def add_rate_limit_headers(response, rate_info: Dict[str, int]) -> None:
    """Dodaje rate limit headers do response."""
    response.headers["X-RateLimit-Limit"] = str(rate_info['limit'])
    response.headers["X-RateLimit-Remaining"] = str(rate_info['remaining'])
    response.headers["X-RateLimit-Reset"] = str(rate_info['reset_time'])

class RateLimitMiddleware:
    """
    Middleware dla automatycznego dodawania rate limit headers.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Wrapper dla send aby dodać headers
        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                # Sprawdź czy request.state ma rate_limit_info
                # To wymaga dostępu do request, więc jest to uproszczona implementacja
                pass
            await send(message)
        
        await self.app(scope, receive, send_with_headers) 