from jose import jwt
from datetime import datetime, timedelta
from typing import Optional
import uuid
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-this-in-production-12345")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def create_test_token(user_id: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    """
    Tworzy testowy JWT token dla development/testowania.
    
    Args:
        user_id: ID użytkownika (jeśli None, generuje losowe UUID)
        expires_delta: Czas wygaśnięcia (domyślnie 30 minut)
        
    Returns:
        str: JWT token
    """
    if user_id is None:
        user_id = str(uuid.uuid4())
    
    if expires_delta is None:
        expires_delta = timedelta(minutes=30)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "sub": user_id,  # subject - user ID
        "exp": expire,   # expiration time
        "iat": datetime.utcnow(),  # issued at
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def decode_token(token: str) -> dict:
    """
    Dekoduje JWT token i zwraca payload.
    
    Args:
        token: JWT token
        
    Returns:
        dict: Payload tokenu
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

if __name__ == "__main__":
    # Przykład użycia
    test_user_id = "123e4567-e89b-12d3-a456-426614174000"
    token = create_test_token(test_user_id)
    print(f"Test token for user {test_user_id}:")
    print(token)
    print("\nDecoded payload:")
    print(decode_token(token)) 