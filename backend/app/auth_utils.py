import os
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from . import models
from .crud import get_student_by_name # Assuming get_student_by_name is implemented in crud.py
from .database import get_db

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


def decode_token(token: str) -> Optional[dict]:
    """
    Decodes a JWT token and returns the payload.
    Returns None if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


security = HTTPBearer()


def get_current_student(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.Student:
    """
    Dependency that extracts and validates the JWT token from the Authorization header.
    Returns the authenticated Student object.
    Raises HTTPException if token is invalid or student not found.
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    student_id = payload.get("student_id")
    if student_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing student_id",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    
    return student