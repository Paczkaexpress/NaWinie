"""
Monitoring and health check router for Na Winie API.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from ..utils.monitoring import HealthCheckEndpoint, performance_monitor
from ..utils.cache import cache

router = APIRouter()

@router.get(
    "/health",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Returns the health status of the API",
    tags=["monitoring"],
    responses={
        200: {
            "description": "API is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "healthy",
                        "timestamp": "2023-12-01T12:00:00.000Z",
                        "uptime_seconds": 3600,
                        "issues": [],
                        "metrics": {
                            "response_time": 0.156,
                            "error_rate": 0.0,
                            "total_requests": 1234
                        }
                    }
                }
            }
        },
        503: {
            "description": "API is unhealthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "unhealthy",
                        "timestamp": "2023-12-01T12:00:00.000Z",
                        "uptime_seconds": 3600,
                        "issues": ["High error rate: 15.2%"],
                        "metrics": {
                            "response_time": 2.456,
                            "error_rate": 15.2,
                            "total_requests": 1234
                        }
                    }
                }
            }
        }
    }
)
async def health_check() -> Dict[str, Any]:
    """
    Sprawdza status zdrowia API.
    
    Endpoint publiczny używany przez load balancery i monitoring systems.
    Zwraca informacje o:
    - Status zdrowia (healthy, degraded, unhealthy)
    - Metryki wydajności (response time, error rate)
    - Czas działania aplikacji
    - Lista problemów (jeśli istnieją)
    
    Returns:
        Dict zawierający status zdrowia i metryki
        
    Raises:
        HTTPException 503: Gdy API jest w stanie unhealthy
    """
    health_status = HealthCheckEndpoint.health_check()
    
    # Zwróć 503 jeśli API jest unhealthy
    if health_status['status'] == 'unhealthy':
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status

@router.get(
    "/metrics",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Detailed metrics",
    description="Returns detailed performance metrics for the API",
    tags=["monitoring"],
    responses={
        200: {
            "description": "Detailed metrics",
            "content": {
                "application/json": {
                    "example": {
                        "total_requests": 1234,
                        "uptime_seconds": 3600,
                        "recent_requests_5min": 150,
                        "average_response_time": 0.156,
                        "error_rate": 2.1,
                        "endpoint_stats": {
                            "GET /api/ingredients": {
                                "request_count": 100,
                                "avg_response_time": 0.123,
                                "error_count": 2,
                                "max_response_time": 0.456,
                                "min_response_time": 0.089
                            }
                        },
                        "system_stats": {
                            "cpu_percent": 45.2,
                            "memory_percent": 68.3,
                            "memory_available_mb": 2048.5,
                            "disk_percent": 72.1,
                            "disk_free_gb": 15.2
                        }
                    }
                }
            }
        }
    }
)
async def get_metrics() -> Dict[str, Any]:
    """
    Pobiera szczegółowe metryki wydajności API.
    
    Endpoint do monitorowania zawierający:
    - Statystyki requestów (total, recent, per endpoint)
    - Średnie czasy odpowiedzi
    - Rate błędów
    - Statystyki systemowe (CPU, memory, disk)
    - Uptime aplikacji
    
    Returns:
        Dict zawierający szczegółowe metryki wydajności
    """
    return HealthCheckEndpoint.detailed_metrics()

@router.get(
    "/cache/stats",
    response_model=Dict[str, Any],
    status_code=status.HTTP_200_OK,
    summary="Cache statistics",
    description="Returns cache performance statistics",
    tags=["monitoring"],
    responses={
        200: {
            "description": "Cache statistics",
            "content": {
                "application/json": {
                    "example": {
                        "total_entries": 156,
                        "active_entries": 142,
                        "expired_entries": 14
                    }
                }
            }
        }
    }
)
async def get_cache_stats() -> Dict[str, Any]:
    """
    Pobiera statystyki cache'u.
    
    Endpoint do monitorowania cache'u zawierający:
    - Liczba aktywnych wpisów
    - Liczba wygasłych wpisów
    - Ogólną liczbę wpisów
    
    Returns:
        Dict zawierający statystyki cache'u
    """
    return cache.stats()

@router.post(
    "/cache/clear",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear cache",
    description="Clears all cache entries",
    tags=["monitoring"],
    responses={
        204: {
            "description": "Cache cleared successfully"
        }
    }
)
async def clear_cache() -> None:
    """
    Czyści cały cache.
    
    Endpoint administracyjny do manualnego czyszczenia cache'u.
    Może być użyteczny podczas deployment lub debugging.
    
    Returns:
        204 No Content
    """
    cache.clear()
    return None 