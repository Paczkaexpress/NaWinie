"""
OpenAPI documentation configuration for Na Winie API.
"""

from typing import Dict, Any
from fastapi.openapi.utils import get_openapi
from fastapi import FastAPI

def custom_openapi(app: FastAPI) -> Dict[str, Any]:
    """
    Generuje niestandardową dokumentację OpenAPI.
    
    Args:
        app: FastAPI application instance
        
    Returns:
        Dict zawierający kompletną specyfikację OpenAPI
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Na Winie API",
        version="1.0.0",
        description=get_api_description(),
        routes=app.routes,
        servers=[
            {
                "url": "http://localhost:8000",
                "description": "Development server"
            },
            {
                "url": "https://api.nawinie.com",
                "description": "Production server"
            }
        ]
    )
    
    # Dodaj informacje o security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token received from authentication endpoint"
        }
    }
    
    # Dodaj globalne security dla chronionych endpointów
    openapi_schema["security"] = [{"BearerAuth": []}]
    
    # Dodaj tags descriptions
    openapi_schema["tags"] = [
        {
            "name": "Ingredients",
            "description": "Operations related to ingredients management",
            "externalDocs": {
                "description": "Ingredients documentation",
                "url": "https://docs.nawinie.com/ingredients"
            }
        },
        {
            "name": "Users", 
            "description": "User management and profile operations"
        },
        {
            "name": "Monitoring",
            "description": "API health monitoring and metrics",
            "externalDocs": {
                "description": "Monitoring guide",
                "url": "https://docs.nawinie.com/monitoring"
            }
        }
    ]
    
    # Dodaj informacje o rate limiting
    add_rate_limiting_info(openapi_schema)
    
    # Dodaj przykłady błędów
    add_error_examples(openapi_schema)
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

def get_api_description() -> str:
    """Zwraca szczegółowy opis API."""
    return """
## Na Winie API - Complete Ingredients Management

API dla aplikacji Na Winie umożliwiającej zarządzanie składnikami kulinarnych przepisów.

### Funkcjonalność

#### 🥕 Składniki (Ingredients)
- **GET /api/ingredients** - Lista składników z paginacją, wyszukiwaniem i sortowaniem
- **POST /api/ingredients** - Dodawanie nowych składników (wymaga uwierzytelnienia)  
- **GET /api/ingredients/{id}** - Szczegóły konkretnego składnika

#### 👤 Użytkownicy (Users)
- Zarządzanie profilami użytkowników
- Uwierzytelnienie JWT

#### 📊 Monitorowanie (Monitoring)
- **GET /api/monitoring/health** - Status zdrowia API
- **GET /api/monitoring/metrics** - Szczegółowe metryki wydajności
- **GET /api/monitoring/cache/stats** - Statystyki cache'u

### Uwierzytelnienie

API wykorzystuje **JWT Bearer tokens** dla chronionych endpointów.

```http
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting

API implementuje rate limiting per użytkownik/IP:

- **GET endpoints**: 100-200 requests/minute
- **POST endpoints**: 10 requests/minute  
- **Global limit**: 1000 requests/minute

### Błędy

API zwraca standardowe HTTP status codes z szczegółowymi komunikatami błędów:

- `400` - Nieprawidłowe parametry żądania
- `401` - Wymagane uwierzytelnienie
- `403` - Brak uprawnień
- `404` - Zasób nie znaleziony
- `409` - Konflikt (np. duplikat)
- `429` - Rate limit exceeded
- `500` - Błąd serwera

### Cache

API wykorzystuje inteligentny cache system:

- **Lists cache**: 15 minut TTL
- **Individual items**: 1 godzina TTL
- Automatyczna invalidacja po zmianach

### Performance

API jest zoptymalizowane pod kątem wydajności:

- Database indexing dla wyszukiwania
- Pagination dla dużych zbiorów danych
- Response compression
- Request timing monitoring
    """

def add_rate_limiting_info(openapi_schema: Dict[str, Any]) -> None:
    """Dodaje informacje o rate limiting do dokumentacji."""
    
    # Dodaj header do wszystkich responses
    rate_limit_headers = {
        "X-RateLimit-Limit": {
            "description": "The number of allowed requests in the current period",
            "schema": {"type": "integer"}
        },
        "X-RateLimit-Remaining": {
            "description": "The number of remaining requests in the current period",
            "schema": {"type": "integer"}
        },
        "X-RateLimit-Reset": {
            "description": "The time at which the current period will reset as Unix timestamp",
            "schema": {"type": "integer"}
        }
    }
    
    # Dodaj 429 response do wszystkich endpoints
    rate_limit_response = {
        "description": "Too Many Requests - Rate limit exceeded",
        "headers": {
            **rate_limit_headers,
            "Retry-After": {
                "description": "Number of seconds to wait before retrying",
                "schema": {"type": "integer"}
            }
        },
        "content": {
            "application/json": {
                "schema": {
                    "type": "object",
                    "properties": {
                        "detail": {
                            "type": "string",
                            "example": "Rate limit exceeded"
                        }
                    }
                }
            }
        }
    }
    
    # Dodaj do wszystkich paths
    for path_item in openapi_schema["paths"].values():
        for operation in path_item.values():
            if isinstance(operation, dict) and "responses" in operation:
                operation["responses"]["429"] = rate_limit_response
                
                # Dodaj rate limit headers do successful responses
                for status_code, response in operation["responses"].items():
                    if status_code.startswith("2") and isinstance(response, dict):
                        if "headers" not in response:
                            response["headers"] = {}
                        response["headers"].update(rate_limit_headers)

def add_error_examples(openapi_schema: Dict[str, Any]) -> None:
    """Dodaje szczegółowe przykłady błędów."""
    
    error_examples = {
        "400": {
            "description": "Bad Request - Invalid parameters",
            "content": {
                "application/json": {
                    "examples": {
                        "invalid_query": {
                            "summary": "Invalid query parameters",
                            "value": {
                                "detail": "Invalid query parameters: page must be >= 1"
                            }
                        },
                        "validation_error": {
                            "summary": "Validation error",
                            "value": {
                                "detail": [
                                    {
                                        "loc": ["body", "name"],
                                        "msg": "field required",
                                        "type": "value_error.missing"
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        "401": {
            "description": "Unauthorized - Authentication required",
            "content": {
                "application/json": {
                    "examples": {
                        "missing_token": {
                            "summary": "Missing authorization token",
                            "value": {
                                "detail": "Authentication required"
                            }
                        },
                        "invalid_token": {
                            "summary": "Invalid or expired token",
                            "value": {
                                "detail": "Invalid authentication credentials"
                            }
                        }
                    }
                }
            }
        },
        "404": {
            "description": "Not Found - Resource not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Ingredient not found"
                    }
                }
            }
        },
        "409": {
            "description": "Conflict - Resource already exists",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Ingredient with this name already exists"
                    }
                }
            }
        },
        "500": {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error"
                    }
                }
            }
        }
    }
    
    # Dodaj komponenty błędów
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    if "responses" not in openapi_schema["components"]:
        openapi_schema["components"]["responses"] = {}
    
    openapi_schema["components"]["responses"].update(error_examples)

def get_api_examples() -> Dict[str, Any]:
    """Zwraca przykłady requestów i responses."""
    
    return {
        "ingredient_request": {
            "summary": "Create new ingredient",
            "value": {
                "name": "Organic Tomatoes",
                "unit_type": "g"
            }
        },
        "ingredient_response": {
            "summary": "Ingredient response",
            "value": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "Organic Tomatoes", 
                "unit_type": "g",
                "created_at": "2023-12-01T10:00:00.000Z",
                "updated_at": "2023-12-01T10:00:00.000Z"
            }
        },
        "ingredients_list": {
            "summary": "Paginated ingredients list",
            "value": {
                "data": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "name": "Flour",
                        "unit_type": "g",
                        "created_at": "2023-12-01T10:00:00.000Z",
                        "updated_at": "2023-12-01T10:00:00.000Z"
                    },
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440001", 
                        "name": "Sugar",
                        "unit_type": "g",
                        "created_at": "2023-12-01T10:30:00.000Z",
                        "updated_at": "2023-12-01T10:30:00.000Z"
                    }
                ],
                "pagination": {
                    "page": 1,
                    "limit": 20,
                    "total_items": 156,
                    "total_pages": 8
                }
            }
        }
    } 