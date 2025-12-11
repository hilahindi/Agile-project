import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from . import models
from .crud import get_student_by_name # Assuming get_student_by_name is implemented in crud.py

# --- Configuration ---
# Generate a secure secret key and set the algorithm
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-replace-me-in-production")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Password Utilities ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- Authentication Core ---
def authenticate_user(db: Session, username: str, password: str) -> Optional[models.Student]:
    """
    Fetches the user and verifies the password.
    """
    user = get_student_by_name(db, name=username)
    if not user:
        return None
    
    # Verify the password against the stored hash
    if not verify_password(password, user.hashed_password):
        return None
        
    return user

# --- JWT Token Utilities ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt