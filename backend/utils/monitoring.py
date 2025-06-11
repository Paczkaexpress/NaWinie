"""
Performance monitoring utilities for Na Winie API.
"""

import time
import psutil
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
from fastapi import Request, Response
import logging

logger = logging.getLogger(__name__)

class PerformanceMonitor:
    """Monitor wydajności API."""
    
    def __init__(self, history_size: int = 1000):
        self.history_size = history_size
        self.request_times: deque = deque(maxlen=history_size)
        self.endpoint_stats: Dict[str, deque] = defaultdict(lambda: deque(maxlen=history_size))
        self.error_count: Dict[str, int] = defaultdict(int)
        self.start_time = datetime.utcnow()
    
    def record_request(self, endpoint: str, method: str, duration: float, status_code: int) -> None:
        """Zapisuje statystyki requestu."""
        timestamp = time.time()
        
        request_data = {
            'endpoint': endpoint,
            'method': method,
            'duration': duration,
            'status_code': status_code,
            'timestamp': timestamp
        }
        
        # Globalne statystyki
        self.request_times.append(request_data)
        
        # Statystyki per endpoint
        endpoint_key = f"{method} {endpoint}"
        self.endpoint_stats[endpoint_key].append(request_data)
        
        # Liczniki błędów
        if status_code >= 400:
            self.error_count[endpoint_key] += 1
        
        # Log slow requests
        if duration > 1.0:  # > 1 sekunda
            logger.warning(f"Slow request: {method} {endpoint} took {duration:.2f}s")
    
    def get_stats(self) -> Dict[str, Any]:
        """Pobiera statystyki wydajności."""
        now = time.time()
        
        # Ogólne statystyki
        total_requests = len(self.request_times)
        
        if total_requests == 0:
            return {
                'total_requests': 0,
                'uptime_seconds': int((datetime.utcnow() - self.start_time).total_seconds()),
                'average_response_time': 0,
                'error_rate': 0,
                'system_stats': self._get_system_stats()
            }
        
        # Oblicz średni czas odpowiedzi
        recent_requests = [r for r in self.request_times if now - r['timestamp'] < 300]  # 5 minut
        avg_response_time = sum(r['duration'] for r in recent_requests) / len(recent_requests) if recent_requests else 0
        
        # Oblicz error rate
        recent_errors = sum(1 for r in recent_requests if r['status_code'] >= 400)
        error_rate = (recent_errors / len(recent_requests)) * 100 if recent_requests else 0
        
        # Statystyki per endpoint
        endpoint_stats = {}
        for endpoint, requests in self.endpoint_stats.items():
            if requests:
                recent_endpoint = [r for r in requests if now - r['timestamp'] < 300]
                if recent_endpoint:
                    endpoint_stats[endpoint] = {
                        'request_count': len(recent_endpoint),
                        'avg_response_time': sum(r['duration'] for r in recent_endpoint) / len(recent_endpoint),
                        'error_count': sum(1 for r in recent_endpoint if r['status_code'] >= 400),
                        'max_response_time': max(r['duration'] for r in recent_endpoint),
                        'min_response_time': min(r['duration'] for r in recent_endpoint)
                    }
        
        return {
            'total_requests': total_requests,
            'uptime_seconds': int((datetime.utcnow() - self.start_time).total_seconds()),
            'recent_requests_5min': len(recent_requests),
            'average_response_time': round(avg_response_time, 3),
            'error_rate': round(error_rate, 2),
            'endpoint_stats': endpoint_stats,
            'system_stats': self._get_system_stats()
        }
    
    def _get_system_stats(self) -> Dict[str, Any]:
        """Pobiera statystyki systemu."""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available_mb': round(memory.available / (1024 * 1024), 2),
                'disk_percent': disk.percent,
                'disk_free_gb': round(disk.free / (1024 * 1024 * 1024), 2)
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {'error': 'Unable to get system stats'}
    
    def get_health_status(self) -> Dict[str, Any]:
        """Pobiera status zdrowia aplikacji."""
        stats = self.get_stats()
        
        # Określ status zdrowia na podstawie metryk
        status = "healthy"
        issues = []
        
        # Sprawdź error rate
        if stats['error_rate'] > 10:  # > 10% błędów
            status = "unhealthy"
            issues.append(f"High error rate: {stats['error_rate']}%")
        elif stats['error_rate'] > 5:  # > 5% błędów
            status = "degraded"
            issues.append(f"Elevated error rate: {stats['error_rate']}%")
        
        # Sprawdź response time
        if stats['average_response_time'] > 2.0:  # > 2 sekundy
            status = "unhealthy"
            issues.append(f"Slow response time: {stats['average_response_time']}s")
        elif stats['average_response_time'] > 1.0:  # > 1 sekunda
            if status == "healthy":
                status = "degraded"
            issues.append(f"Elevated response time: {stats['average_response_time']}s")
        
        # Sprawdź system resources
        system_stats = stats.get('system_stats', {})
        if isinstance(system_stats, dict):
            if system_stats.get('cpu_percent', 0) > 90:
                status = "unhealthy"
                issues.append(f"High CPU usage: {system_stats['cpu_percent']}%")
            
            if system_stats.get('memory_percent', 0) > 90:
                status = "unhealthy"
                issues.append(f"High memory usage: {system_stats['memory_percent']}%")
        
        return {
            'status': status,
            'timestamp': datetime.utcnow().isoformat(),
            'uptime_seconds': stats['uptime_seconds'],
            'issues': issues,
            'metrics': {
                'response_time': stats['average_response_time'],
                'error_rate': stats['error_rate'],
                'total_requests': stats['total_requests']
            }
        }

# Global monitor instance
performance_monitor = PerformanceMonitor()

class TimingMiddleware:
    """Middleware do mierzenia czasu wykonania requestów."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        
        # Pobierz informacje o request
        method = scope.get("method", "UNKNOWN")
        path = scope.get("path", "/")
        
        status_code = 200  # Default
        
        # Wrapper dla send aby przechwycić status code
        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except Exception as e:
            status_code = 500
            raise
        finally:
            # Zapisz statystyki
            end_time = time.time()
            duration = end_time - start_time
            
            # Uprość path (usuń parametry)
            simplified_path = self._simplify_path(path)
            
            performance_monitor.record_request(
                endpoint=simplified_path,
                method=method,
                duration=duration,
                status_code=status_code
            )
    
    def _simplify_path(self, path: str) -> str:
        """Upraszcza path do kategorii endpoint (usuwa UUID itp.)."""
        # Zamień UUID na placeholder
        import re
        path = re.sub(
            r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '/{id}',
            path,
            flags=re.IGNORECASE
        )
        
        # Zamień inne ID na placeholder
        path = re.sub(r'/\d+', '/{id}', path)
        
        return path

class HealthCheckEndpoint:
    """Endpoint do health checku."""
    
    @staticmethod
    def health_check() -> Dict[str, Any]:
        """Zwraca podstawowy health check."""
        return performance_monitor.get_health_status()
    
    @staticmethod
    def detailed_metrics() -> Dict[str, Any]:
        """Zwraca szczegółowe metryki."""
        return performance_monitor.get_stats()

# Alerting (placeholder - w produkcji integracja z Slack/email/etc.)
class AlertManager:
    """Manager alertów dla krytycznych problemów."""
    
    def __init__(self):
        self.last_alert_times: Dict[str, datetime] = {}
        self.alert_cooldown = timedelta(minutes=15)  # Nie spam alertów
    
    def check_and_alert(self) -> None:
        """Sprawdza metryki i wysyła alerty jeśli potrzeba."""
        health = performance_monitor.get_health_status()
        
        if health['status'] == 'unhealthy':
            self._send_alert('critical', health['issues'])
        elif health['status'] == 'degraded':
            self._send_alert('warning', health['issues'])
    
    def _send_alert(self, level: str, issues: list) -> None:
        """Wysyła alert (placeholder)."""
        alert_key = f"{level}:{'-'.join(issues)}"
        now = datetime.utcnow()
        
        # Sprawdź cooldown
        if alert_key in self.last_alert_times:
            if now - self.last_alert_times[alert_key] < self.alert_cooldown:
                return
        
        self.last_alert_times[alert_key] = now
        
        # W produkcji: wyślij do Slack, email, etc.
        logger.error(f"ALERT [{level.upper()}]: {'; '.join(issues)}")

# Global alert manager
alert_manager = AlertManager() 