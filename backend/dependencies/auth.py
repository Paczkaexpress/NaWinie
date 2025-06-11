from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import os
from dotenv import load_dotenv

from ..database import get_db
from ..models.user import User

# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-this-in-production-12345")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """
    Dependency do wyodrębnienia user_id z JWT token.
    
    Args:
        credentials: Token JWT z nagłówka Authorization
        
    Returns:
        str: ID użytkownika z tokenu
        
    Raises:
        HTTPException: 401 jeśli token jest nieprawidłowy lub brak user_id
    """
    try:
        # Decode JWT token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract user_id from token payload
        user_id: Optional[str] = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return user_id
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current user object from JWT token.
    
    Args:
        credentials: JWT token from Authorization header
        db: Database session
        
    Returns:
        User: Current user object
        
    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    try:
        # Decode JWT token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract user_id from token payload
        user_id_str: Optional[str] = payload.get("sub")
        
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Convert to UUID and fetch user
        user_id = UUID(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        return user
        
    except (JWTError, ValueError):  # ValueError for invalid UUID
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optional dependency to get current user object from JWT token.
    Returns None if no token provided or token is invalid.
    """
    if credentials is None:
        return None
        
    try:
        # Decode JWT token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract user_id from token payload
        user_id_str: Optional[str] = payload.get("sub")
        
        if user_id_str is None:
            return None
        
        # Convert to UUID and fetch user
        user_id = UUID(user_id_str)
        user = db.query(User).filter(User.id == user_id).first()
        
        return user
        
    except (JWTError, ValueError):  # ValueError for invalid UUID
        return None 