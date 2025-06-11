import logging
import logging.config
import sys
from datetime import datetime
from typing import Dict, Any

class StructuredFormatter(logging.Formatter):
    """
    Custom formatter dla structured logging.
    Formatuje logi w sposób czytelny i strukturalny.
    """
    
    def format(self, record: logging.LogRecord) -> str:
        # Podstawowe informacje o logu
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Dodaj informacje o pliku i linii dla DEBUG i ERROR
        if record.levelno >= logging.ERROR or record.levelno == logging.DEBUG:
            log_entry.update({
                "file": record.filename,
                "line": record.lineno,
                "function": record.funcName
            })
        
        # Dodaj exception info jeśli istnieje
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Dodaj dodatkowe kontekstowe informacje
        if hasattr(record, 'user_id'):
            log_entry["user_id"] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id
        if hasattr(record, 'endpoint'):
            log_entry["endpoint"] = record.endpoint
        
        # Formatuj jako czytelny string
        parts = [f"[{log_entry['timestamp']}]"]
        parts.append(f"[{log_entry['level']}]")
        parts.append(f"[{log_entry['logger']}]")
        parts.append(log_entry['message'])
        
        if 'user_id' in log_entry:
            parts.append(f"(user: {log_entry['user_id']})")
        
        if record.levelno >= logging.ERROR and 'file' in log_entry:
            parts.append(f"({log_entry['file']}:{log_entry['line']})")
        
        result = " ".join(parts)
        
        if 'exception' in log_entry:
            result += f"\n{log_entry['exception']}"
        
        return result

def setup_logging(log_level: str = "INFO", enable_file_logging: bool = False) -> None:
    """
    Konfiguruje logging dla aplikacji.
    
    Args:
        log_level: Poziom logowania (DEBUG, INFO, WARNING, ERROR)
        enable_file_logging: Czy włączyć logowanie do pliku
    """
    
    # Konfiguracja handlerów
    handlers = ["console"]
    if enable_file_logging:
        handlers.append("file")
    
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "structured": {
                "()": StructuredFormatter,
            },
            "simple": {
                "format": "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "structured",
                "stream": sys.stdout
            }
        },
        "loggers": {
            # Główne loggery aplikacji
            "backend": {
                "level": log_level,
                "handlers": handlers,
                "propagate": False
            },
            # FastAPI logger
            "fastapi": {
                "level": "INFO",
                "handlers": handlers,
                "propagate": False
            },
            # SQLAlchemy logger
            "sqlalchemy.engine": {
                "level": "WARNING",  # Tylko błędy i ostrzeżenia
                "handlers": handlers,
                "propagate": False
            },
            # Uvicorn logger
            "uvicorn": {
                "level": "INFO",
                "handlers": handlers,
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": handlers,
                "propagate": False
            }
        },
        "root": {
            "level": log_level,
            "handlers": handlers
        }
    }
    
    # Dodaj file handler jeśli włączony
    if enable_file_logging:
        logging_config["handlers"]["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "level": log_level,
            "formatter": "structured",
            "filename": "logs/nawinie.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "encoding": "utf8"
        }
    
    logging.config.dictConfig(logging_config)

def get_logger(name: str) -> logging.Logger:
    """
    Pobiera logger z odpowiednią konfiguracją.
    
    Args:
        name: Nazwa loggera (zwykle __name__)
        
    Returns:
        logging.Logger: Skonfigurowany logger
    """
    return logging.getLogger(name)

class LogContext:
    """
    Klasa do zarządzania kontekstem logowania (user_id, request_id itp.)
    """
    
    def __init__(self, logger: logging.Logger, **context):
        self.logger = logger
        self.context = context
    
    def info(self, message: str, **extra):
        """Log INFO z kontekstem."""
        self._log(logging.INFO, message, **extra)
    
    def warning(self, message: str, **extra):
        """Log WARNING z kontekstem."""
        self._log(logging.WARNING, message, **extra)
    
    def error(self, message: str, **extra):
        """Log ERROR z kontekstem."""
        self._log(logging.ERROR, message, **extra)
    
    def debug(self, message: str, **extra):
        """Log DEBUG z kontekstem."""
        self._log(logging.DEBUG, message, **extra)
    
    def _log(self, level: int, message: str, **extra):
        """Wykonuje log z połączonym kontekstem."""
        combined_extra = {**self.context, **extra}
        self.logger.log(level, message, extra=combined_extra)

# Przykład użycia:
if __name__ == "__main__":
    setup_logging("DEBUG", enable_file_logging=True)
    logger = get_logger(__name__)
    
    logger.info("Application starting")
    logger.warning("This is a warning")
    logger.error("This is an error")
    
    # Z kontekstem
    context_logger = LogContext(logger, user_id="123", endpoint="/api/ingredients")
    context_logger.info("User action completed") 