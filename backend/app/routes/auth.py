from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from .. import crud, schemas, models
from ..database import get_db
from ..auth_utils import authenticate_user, create_access_token, get_password_hash

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

# Configuration for token expiration (e.g., 30 minutes)
ACCESS_TOKEN_EXPIRE_MINUTES = 30


@router.post("/register", response_model=schemas.StudentResponse)
def register_student(user: schemas.StudentCreateAuth, db: Session = Depends(get_db)):
    """
    Register a new student/user. Checks for existing users by name.
    """
    # Check if a user with this name already exists
    db_user = crud.get_student_by_name(db, name=user.name)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this name already exists"
        )
    
    # Hash the password and create the new user
    hashed_password = get_password_hash(user.password)
    
    # Create a dictionary with all student fields, replacing plain password with hash
    student_data = user.model_dump(exclude={"password"})
    student_data["hashed_password"] = hashed_password
    
    # Use crud function to create the student
    return crud.create_student(db, student_data)


@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Login endpoint. Authenticates user and returns a JWT access token.
    Token includes both username and student_id for later use in protected endpoints.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create the JWT token with both username and student_id
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.name, "student_id": user.id}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


# Placeholder for CRUD function definition (normally in crud.py)
# Since I cannot modify crud.py directly, you must ensure this is implemented there:
"""
def get_student_by_name(db: Session, name: str):
    return db.query(models.Student).filter(models.Student.name == name).first()

def create_student(db: Session, student: dict):
    db_student = models.Student(**student)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student
"""