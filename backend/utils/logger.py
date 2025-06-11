"""
Enhanced logging configuration for Recipe API.
Provides structured logging with contextual information.
"""

import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID
import sys
import os
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Check if we're in test environment
IS_TESTING = os.getenv("PYTEST_CURRENT_TEST") is not None

class StructuredLogger:
    """Enhanced logger with structured output and context"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Prevent duplicate handlers
        if not self.logger.handlers:
            self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup file and console handlers with formatting"""
        
        # Console handler with simple format
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_format = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s'
        )
        console_handler.setFormatter(console_format)
        self.logger.addHandler(console_handler)
        
        # File handler with JSON format for structured logging (skip in tests)
        if not IS_TESTING:
            file_handler = logging.FileHandler(logs_dir / "recipe_api.log", encoding='utf-8')
            file_handler.setLevel(logging.INFO)
            self.logger.addHandler(file_handler)
    
    def _format_structured_message(self, event: str, context: Dict[str, Any]) -> str:
        """Format message with structured context"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event,
            "context": context
        }
        
        # For file logging, use JSON format
        json_message = json.dumps(log_entry, default=str, ensure_ascii=False)
        
        # For console, use readable format
        console_message = f"{event}"
        if context:
            context_str = " | ".join([f"{k}={v}" for k, v in context.items()])
            console_message += f" ({context_str})"
        
        return console_message
    
    def info(self, event: str, **context):
        """Log info level with structured context"""
        message = self._format_structured_message(event, context)
        self.logger.info(message)
    
    def warning(self, event: str, **context):
        """Log warning level with structured context"""
        message = self._format_structured_message(event, context)
        self.logger.warning(message)
    
    def error(self, event: str, **context):
        """Log error level with structured context"""
        message = self._format_structured_message(event, context)
        self.logger.error(message)
    
    def debug(self, event: str, **context):
        """Log debug level with structured context"""
        message = self._format_structured_message(event, context)
        self.logger.debug(message)

# Recipe-specific logger instances
recipe_logger = StructuredLogger("backend.recipes")
rating_logger = StructuredLogger("backend.ratings")
auth_logger = StructuredLogger("backend.auth")
db_logger = StructuredLogger("backend.database")

class RecipeEventLogger:
    """Specialized logger for recipe-related events"""
    
    @staticmethod
    def recipe_created(recipe_id: UUID, user_id: UUID, recipe_name: str):
        """Log recipe creation event"""
        recipe_logger.info(
            "Recipe created successfully",
            recipe_id=str(recipe_id),
            user_id=str(user_id),
            recipe_name=recipe_name
        )
    
    @staticmethod
    def recipe_updated(recipe_id: UUID, user_id: UUID, updated_fields: list):
        """Log recipe update event"""
        recipe_logger.info(
            "Recipe updated successfully", 
            recipe_id=str(recipe_id),
            user_id=str(user_id),
            updated_fields=updated_fields
        )
    
    @staticmethod
    def recipe_deleted(recipe_id: UUID, user_id: UUID):
        """Log recipe deletion event"""
        recipe_logger.info(
            "Recipe deleted successfully",
            recipe_id=str(recipe_id),
            user_id=str(user_id)
        )
    
    @staticmethod
    def recipe_access_denied(recipe_id: UUID, user_id: UUID, action: str):
        """Log unauthorized access attempt"""
        recipe_logger.warning(
            "Recipe access denied",
            recipe_id=str(recipe_id),
            user_id=str(user_id),
            action=action
        )
    
    @staticmethod
    def recipe_not_found(recipe_id: UUID, user_id: Optional[UUID] = None):
        """Log recipe not found event"""
        context = {"recipe_id": str(recipe_id)}
        if user_id:
            context["user_id"] = str(user_id)
        
        recipe_logger.warning("Recipe not found", **context)
    
    @staticmethod
    def recipe_validation_error(user_id: UUID, error_details: str):
        """Log recipe validation error"""
        recipe_logger.error(
            "Recipe validation failed",
            user_id=str(user_id),
            error=error_details
        )

class RatingEventLogger:
    """Specialized logger for rating-related events"""
    
    @staticmethod
    def rating_created(recipe_id: UUID, user_id: UUID, rating: int, new_average: float, total_votes: int):
        """Log rating creation event"""
        rating_logger.info(
            "Recipe rated successfully",
            recipe_id=str(recipe_id),
            user_id=str(user_id),
            rating=rating,
            new_average=new_average,
            total_votes=total_votes
        )
    
    @staticmethod
    def rating_duplicate_attempt(recipe_id: UUID, user_id: UUID):
        """Log duplicate rating attempt"""
        rating_logger.warning(
            "Duplicate rating attempt",
            recipe_id=str(recipe_id),
            user_id=str(user_id)
        )
    
    @staticmethod
    def rating_invalid_value(user_id: UUID, invalid_rating: int):
        """Log invalid rating value"""
        rating_logger.error(
            "Invalid rating value provided",
            user_id=str(user_id),
            invalid_rating=invalid_rating
        )

class AuthEventLogger:
    """Specialized logger for authentication events"""
    
    @staticmethod
    def token_validation_failed(token_prefix: str, error: str):
        """Log token validation failure"""
        auth_logger.warning(
            "Token validation failed",
            token_prefix=token_prefix[:10] + "..." if len(token_prefix) > 10 else token_prefix,
            error=error
        )
    
    @staticmethod
    def user_authenticated(user_id: UUID, endpoint: str):
        """Log successful user authentication"""
        auth_logger.info(
            "User authenticated successfully",
            user_id=str(user_id),
            endpoint=endpoint
        )
    
    @staticmethod
    def unauthorized_access_attempt(endpoint: str, ip_address: Optional[str] = None):
        """Log unauthorized access attempt"""
        context = {"endpoint": endpoint}
        if ip_address:
            context["ip_address"] = ip_address
        
        auth_logger.warning("Unauthorized access attempt", **context)

class DatabaseEventLogger:
    """Specialized logger for database events"""
    
    @staticmethod
    def query_performance_warning(query_type: str, duration_ms: float, table: str):
        """Log slow query warning"""
        db_logger.warning(
            "Slow query detected",
            query_type=query_type,
            duration_ms=duration_ms,
            table=table
        )
    
    @staticmethod
    def connection_error(error: str):
        """Log database connection error"""
        db_logger.error(
            "Database connection failed",
            error=error
        )
    
    @staticmethod
    def transaction_rollback(operation: str, error: str):
        """Log transaction rollback"""
        db_logger.error(
            "Transaction rolled back",
            operation=operation,
            error=error
        )

class PerformanceLogger:
    """Logger for performance monitoring"""
    
    @staticmethod
    def endpoint_performance(endpoint: str, method: str, duration_ms: float, status_code: int):
        """Log endpoint performance metrics"""
        level = "warning" if duration_ms > 1000 else "info"  # Warn if over 1 second
        
        getattr(recipe_logger, level)(
            "Endpoint performance",
            endpoint=endpoint,
            method=method,
            duration_ms=duration_ms,
            status_code=status_code
        )
    
    @staticmethod
    def database_query_performance(operation: str, table: str, duration_ms: float, affected_rows: int = 0):
        """Log database query performance"""
        level = "warning" if duration_ms > 500 else "info"  # Warn if over 500ms
        
        getattr(db_logger, level)(
            "Database query performance",
            operation=operation,
            table=table,
            duration_ms=duration_ms,
            affected_rows=affected_rows
        )

# Export logger instances for easy import
__all__ = [
    'recipe_logger',
    'rating_logger', 
    'auth_logger',
    'db_logger',
    'RecipeEventLogger',
    'RatingEventLogger', 
    'AuthEventLogger',
    'DatabaseEventLogger',
    'PerformanceLogger'
] 