from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from ..database import get_db
from ..services.auth_service import get_auth_service, AuthService
from ..models.requests import LoginRequest, RegisterRequest
from ..models.responses import AuthResponse, MessageResponse

router = APIRouter()

@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="User login",
    description="Authenticate user with email and password",
    responses={
        200: {
            "description": "Login successful",
            "model": AuthResponse
        },
        401: {
            "description": "Invalid credentials",
            "content": {
                "application/json": {
                    "example": {"detail": "Incorrect email or password"}
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Invalid input data"}
                }
            }
        }
    }
)
async def login(
    login_data: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
) -> AuthResponse:
    """
    Login endpoint for user authentication.
    
    Authenticates user with email and password, returns JWT token and user profile.
    
    Args:
        login_data: Login credentials (email and password)
        db: Database session (dependency injection)
        auth_service: Authentication service (dependency injection)
        
    Returns:
        AuthResponse: JWT token and user profile
        
    Raises:
        HTTPException 401: Invalid credentials
        HTTPException 422: Validation error
    """
    try:
        return auth_service.login_user(login_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="User registration",
    description="Register new user account",
    responses={
        201: {
            "description": "Registration successful",
            "model": AuthResponse
        },
        400: {
            "description": "Email already registered",
            "content": {
                "application/json": {
                    "example": {"detail": "Email already registered"}
                }
            }
        },
        422: {
            "description": "Validation error",
            "content": {
                "application/json": {
                    "example": {"detail": "Passwords do not match"}
                }
            }
        }
    }
)
async def register(
    register_data: RegisterRequest,
    db: Annotated[Session, Depends(get_db)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)]
) -> AuthResponse:
    """
    Registration endpoint for new users.
    
    Creates new user account and automatically logs them in,
    returning JWT token and user profile.
    
    Args:
        register_data: Registration data (email, password, confirm_password)
        db: Database session (dependency injection)
        auth_service: Authentication service (dependency injection)
        
    Returns:
        AuthResponse: JWT token and user profile
        
    Raises:
        HTTPException 400: Email already registered
        HTTPException 422: Validation error (passwords don't match, etc.)
    """
    try:
        return auth_service.register_and_login_user(register_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        ) 