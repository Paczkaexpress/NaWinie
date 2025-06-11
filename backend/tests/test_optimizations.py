"""
Tests for performance optimizations: cache, rate limiting, and monitoring.
"""

import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from backend.utils.cache import InMemoryCache, CacheManager, cache
from backend.utils.rate_limiter import SlidingWindowRateLimiter, RateLimitConfig, rate_limiter
from backend.utils.monitoring import PerformanceMonitor, performance_monitor
from backend.main import app

client = TestClient(app)

# Rate limiter fixture moved to conftest.py

class TestInMemoryCache:
    """Test in-memory cache functionality."""
    
    def test_cache_basic_operations(self):
        """Test basic cache get/set operations."""
        test_cache = InMemoryCache()
        
        # Test set and get
        test_cache.set("test_key", "test_value", ttl_seconds=60)
        assert test_cache.get("test_key") == "test_value"
        
        # Test non-existent key
        assert test_cache.get("nonexistent") is None
    
    def test_cache_expiration(self):
        """Test cache TTL expiration."""
        test_cache = InMemoryCache()
        
        # Set with very short TTL
        test_cache.set("expire_key", "expire_value", ttl_seconds=1)
        assert test_cache.get("expire_key") == "expire_value"
        
        # Wait for expiration
        time.sleep(1.1)
        assert test_cache.get("expire_key") is None
    
    def test_cache_clear(self):
        """Test cache clear functionality."""
        test_cache = InMemoryCache()
        
        test_cache.set("key1", "value1")
        test_cache.set("key2", "value2")
        assert test_cache.get("key1") == "value1"
        
        test_cache.clear()
        assert test_cache.get("key1") is None
        assert test_cache.get("key2") is None

class TestRateLimiter:
    """Test rate limiting functionality."""
    
    def test_rate_limiter_basic(self):
        """Test basic rate limiting functionality."""
        limiter = SlidingWindowRateLimiter()
        
        # Test within limits
        allowed, info = limiter.is_allowed("test_user", limit=5, window_seconds=60)
        assert allowed is True
        assert info['remaining'] == 4
        
        # Test multiple requests
        for i in range(4):
            allowed, info = limiter.is_allowed("test_user", limit=5, window_seconds=60)
            assert allowed is True
        
        # Should hit limit
        allowed, info = limiter.is_allowed("test_user", limit=5, window_seconds=60)
        assert allowed is False
        assert info['remaining'] == 0

class TestMonitoring:
    """Test monitoring endpoints."""
    
    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = client.get("/api/monitoring/health")
        assert response.status_code in [200, 503]
        
        data = response.json()
        
        # Handle both healthy (200) and unhealthy (503) responses
        if response.status_code == 200:
            assert 'status' in data
            assert 'timestamp' in data
        else:  # 503 - unhealthy
            assert 'detail' in data
            detail = data['detail']
            assert 'status' in detail
            assert 'timestamp' in detail
            assert detail['status'] == 'unhealthy'
    
    def test_metrics_endpoint(self):
        """Test metrics endpoint."""
        response = client.get("/api/monitoring/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert 'total_requests' in data
        assert 'uptime_seconds' in data
    
    def test_cache_stats_endpoint(self):
        """Test cache stats endpoint."""
        response = client.get("/api/monitoring/cache/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert 'total_entries' in data 