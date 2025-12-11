from sqlalchemy.orm import Session
from typing import Dict, Any
from . import models, schemas

# ==================== Student CRUD Operations ====================

def get_student(db: Session, student_id: int):
    """Retrieve a student by their ID."""
    return db.query(models.Student).filter(models.Student.id == student_id).first()

def get_student_by_name(db: Session, name: str):
    """Retrieve a student by their unique name (used for login/registration)."""
    return db.query(models.Student).filter(models.Student.name == name).first()

def get_students(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve a list of students with pagination."""
    return db.query(models.Student).offset(skip).limit(limit).all()

# Note: student_data is a dictionary created from the Pydantic schema in the route
def create_student(db: Session, student_data: Dict[str, Any]):
    """
    Create a new student record.
    The data dictionary contains 'hashed_password' for auth.
    """
    db_student = models.Student(**student_data)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

# ==================== Course CRUD Operations (Example) ====================

def get_course(db: Session, course_id: int):
    """Retrieve a course by its ID."""
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def get_courses(db: Session, skip: int = 0, limit: int = 100):
    """Retrieve a list of courses with pagination."""
    return db.query(models.Course).offset(skip).limit(limit).all()

# ... other CRUD functions for update, delete, ratings, etc. would go here