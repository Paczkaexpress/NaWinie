from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError
import logging
import traceback
from typing import Union

logger = logging.getLogger(__name__)

class IngredientNotFoundError(Exception):
    """Wyjątek rzucany gdy składnik nie został znaleziony."""
    def __init__(self, ingredient_id: str):
        self.ingredient_id = ingredient_id
        super().__init__(f"Ingredient with ID {ingredient_id} not found")

class IngredientAlreadyExistsError(Exception):
    """Wyjątek rzucany gdy składnik o podanej nazwie już istnieje."""
    def __init__(self, ingredient_name: str):
        self.ingredient_name = ingredient_name
        super().__init__(f"Ingredient '{ingredient_name}' already exists")

async def validation_exception_handler(request: Request, exc: Union[RequestValidationError, ValidationError]):
    """
    Handler dla błędów walidacji Pydantic.
    
    Args:
        request: FastAPI request object
        exc: Błąd walidacji
        
    Returns:
        JSONResponse: Strukturalny błąd 422
    """
    logger.warning(f"Validation error on {request.method} {request.url}: {exc.errors()}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors()
        }
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler dla standardowych wyjątków HTTP.
    
    Args:
        request: FastAPI request object
        exc: HTTP exception
        
    Returns:
        JSONResponse: Strukturalny błąd HTTP
    """
    logger.warning(f"HTTP {exc.status_code} on {request.method} {request.url}: {exc.detail}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None)
    )

async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Handler dla błędów bazy danych SQLAlchemy.
    
    Args:
        request: FastAPI request object
        exc: SQLAlchemy exception
        
    Returns:
        JSONResponse: Strukturalny błąd 500
    """
    logger.error(f"Database error on {request.method} {request.url}: {str(exc)}")
    logger.error(f"Full traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

async def integrity_exception_handler(request: Request, exc: IntegrityError):
    """
    Handler dla błędów integralności bazy danych.
    
    Args:
        request: FastAPI request object
        exc: IntegrityError exception
        
    Returns:
        JSONResponse: Strukturalny błąd 409
    """
    logger.warning(f"Integrity constraint violation on {request.method} {request.url}: {str(exc)}")
    
    # Sprawdź czy to błąd unikalności nazwy składnika
    if "ingredients" in str(exc.orig) and "name" in str(exc.orig):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Ingredient with this name already exists"}
        )
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Conflict with existing data"}
    )

async def ingredient_not_found_handler(request: Request, exc: IngredientNotFoundError):
    """
    Handler dla wyjątku IngredientNotFoundError.
    
    Args:
        request: FastAPI request object
        exc: IngredientNotFoundError exception
        
    Returns:
        JSONResponse: Strukturalny błąd 404
    """
    logger.info(f"Ingredient not found on {request.method} {request.url}: {exc.ingredient_id}")
    
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Ingredient not found"}
    )

async def ingredient_exists_handler(request: Request, exc: IngredientAlreadyExistsError):
    """
    Handler dla wyjątku IngredientAlreadyExistsError.
    
    Args:
        request: FastAPI request object
        exc: IngredientAlreadyExistsError exception
        
    Returns:
        JSONResponse: Strukturalny błąd 409
    """
    logger.warning(f"Duplicate ingredient on {request.method} {request.url}: {exc.ingredient_name}")
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Ingredient with this name already exists"}
    )

async def general_exception_handler(request: Request, exc: Exception):
    """
    Handler dla wszystkich nieobsłużonych wyjątków.
    
    Args:
        request: FastAPI request object
        exc: Generic exception
        
    Returns:
        JSONResponse: Strukturalny błąd 500
    """
    logger.error(f"Unhandled exception on {request.method} {request.url}: {str(exc)}")
    logger.error(f"Full traceback: {traceback.format_exc()}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    ) 