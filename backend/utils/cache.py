"""
Cache utilities for Na Winie API.
"""

import json
import hashlib
from typing import Optional, Any, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class InMemoryCache:
    """
    Simple in-memory cache implementation.
    Production powinno używać Redis, ale to jest dla development.
    """
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Pobiera wartość z cache."""
        if key in self._cache:
            entry = self._cache[key]
            
            # Sprawdź czy nie wygasł
            if datetime.utcnow() < entry['expires_at']:
                logger.debug(f"Cache HIT: {key}")
                return entry['value']
            else:
                # Usuń wygasły wpis
                del self._cache[key]
                logger.debug(f"Cache EXPIRED: {key}")
        
        logger.debug(f"Cache MISS: {key}")
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 900) -> None:
        """Zapisuje wartość w cache z TTL."""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.utcnow()
        }
        
        logger.debug(f"Cache SET: {key} (TTL: {ttl_seconds}s)")
    
    def delete(self, key: str) -> None:
        """Usuwa wpis z cache."""
        if key in self._cache:
            del self._cache[key]
            logger.debug(f"Cache DELETE: {key}")
    
    def clear(self) -> None:
        """Czyści cały cache."""
        count = len(self._cache)
        self._cache.clear()
        logger.debug(f"Cache CLEAR: {count} entries removed")
    
    def stats(self) -> Dict[str, Any]:
        """Zwraca statystyki cache."""
        now = datetime.utcnow()
        active_entries = sum(1 for entry in self._cache.values() 
                           if now < entry['expires_at'])
        
        return {
            'total_entries': len(self._cache),
            'active_entries': active_entries,
            'expired_entries': len(self._cache) - active_entries
        }

# Global cache instance
cache = InMemoryCache()

class CacheManager:
    """Manager dla cache'owania ingredients."""
    
    @staticmethod
    def get_ingredients_cache_key(query_params: Dict[str, Any]) -> str:
        """Generuje klucz cache dla listy składników."""
        # Sortuj parametry dla spójności
        sorted_params = dict(sorted(query_params.items()))
        
        # Utwórz hash z parametrów
        params_str = json.dumps(sorted_params, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]
        
        return f"ingredients:list:{params_hash}"
    
    @staticmethod
    def get_ingredient_cache_key(ingredient_id: str) -> str:
        """Generuje klucz cache dla pojedynczego składnika."""
        return f"ingredients:item:{ingredient_id}"
    
    @staticmethod
    def get_cached_ingredients(query_params: Dict[str, Any]) -> Optional[Any]:
        """Pobiera z cache listę składników."""
        cache_key = CacheManager.get_ingredients_cache_key(query_params)
        return cache.get(cache_key)
    
    @staticmethod
    def cache_ingredients(query_params: Dict[str, Any], data: Any, ttl: int = 900) -> None:
        """Cache'uje listę składników (TTL: 15 minut)."""
        cache_key = CacheManager.get_ingredients_cache_key(query_params)
        cache.set(cache_key, data, ttl)
    
    @staticmethod
    def get_cached_ingredient(ingredient_id: str) -> Optional[Any]:
        """Pobiera z cache pojedynczy składnik."""
        cache_key = CacheManager.get_ingredient_cache_key(ingredient_id)
        return cache.get(cache_key)
    
    @staticmethod
    def cache_ingredient(ingredient_id: str, data: Any, ttl: int = 3600) -> None:
        """Cache'uje pojedynczy składnik (TTL: 1 godzina)."""
        cache_key = CacheManager.get_ingredient_cache_key(ingredient_id)
        cache.set(cache_key, data, ttl)
    
    @staticmethod
    def invalidate_ingredient_caches(ingredient_id: Optional[str] = None) -> None:
        """Invaliduje cache po utworzeniu/aktualizacji składnika."""
        # Usuń wszystkie listy składników (po dodaniu nowego)
        if ingredient_id is None:
            # Invaliduj wszystkie cache'e list
            cache.clear()  # Prostsze rozwiązanie dla in-memory cache
            logger.info("Invalidated all ingredient list caches")
        else:
            # Usuń konkretny składnik
            cache_key = CacheManager.get_ingredient_cache_key(ingredient_id)
            cache.delete(cache_key)
            logger.info(f"Invalidated cache for ingredient {ingredient_id}")

# Dla produkcji - Redis cache (zakomentowane, ale gotowe do użycia)
"""
import redis
from typing import Union

class RedisCache:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url, decode_responses=True)
    
    def get(self, key: str) -> Optional[Any]:
        try:
            value = self.redis.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 900) -> None:
        try:
            self.redis.setex(key, ttl_seconds, json.dumps(value, default=str))
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
    
    def delete(self, key: str) -> None:
        try:
            self.redis.delete(key)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
    
    def clear_pattern(self, pattern: str) -> None:
        try:
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
        except Exception as e:
            logger.error(f"Redis CLEAR PATTERN error: {e}")
""" 