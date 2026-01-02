from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, crud
from ..database import get_db
from ..auth_utils import get_current_student
from typing import List

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/", response_model=List[schemas.StudentResponse])
def get_all_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all students with pagination."""
    students = db.query(models.Student).offset(skip).limit(limit).all()
    def serialize(s):
        return {
            'id': s.id,
            'name': s.name,
            'faculty': s.faculty,
            'year': s.year,
            'career_goal': s.career_goal if hasattr(s, 'career_goal') else None,
            'human_skill_ids': [sk.id for sk in getattr(s, 'human_skills', [])],
            'courses_taken': [sc.course_id for sc in getattr(s, 'student_courses', [])],
            'created_at': s.created_at,
        }
    return [serialize(s) for s in students]


@router.get("/me", response_model=schemas.StudentResponse)
def get_current_user_profile(
    current_student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    """Get the current authenticated student's profile."""
    student = db.query(models.Student).filter(models.Student.id == current_student.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        'id': student.id,
        'name': student.name,
        'faculty': student.faculty,
        'year': student.year,
        'career_goal_id': student.career_goal_id,
        'career_goal': student.career_goal if hasattr(student, 'career_goal') else None,
        'human_skill_ids': [sk.id for sk in getattr(student, 'human_skills', [])],
        'courses_taken': [sc.course_id for sc in getattr(student, 'student_courses', [])],
        'created_at': student.created_at,
    }


@router.get("/{student_id}", response_model=schemas.StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student by ID."""
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        'id': student.id,
        'name': student.name,
        'faculty': student.faculty,
        'year': student.year,
        'career_goal': student.career_goal if hasattr(student, 'career_goal') else None,
        'human_skill_ids': [sk.id for sk in getattr(student, 'human_skills', [])],
        'courses_taken': [sc.course_id for sc in getattr(student, 'student_courses', [])],
        'created_at': student.created_at,
    }


@router.post("/", response_model=schemas.StudentResponse)
def create_student(student: schemas.StudentCreateAuth, db: Session = Depends(get_db)):
    """Create a new student."""
    from ..auth_utils import get_password_hash
    student_data = student.model_dump()
    student_data['hashed_password'] = get_password_hash(student_data.pop('password'))
    db_student = crud.create_student(db, student_data)
    return {
        'id': db_student.id,
        'name': db_student.name,
        'faculty': db_student.faculty,
        'year': db_student.year,
        'career_goal': db_student.career_goal if hasattr(db_student, 'career_goal') else None,
        'human_skill_ids': [sk.id for sk in getattr(db_student, 'human_skills', [])],
        'courses_taken': [sc.course_id for sc in getattr(db_student, 'student_courses', [])],
        'created_at': db_student.created_at,
    }


@router.put("/{student_id}", response_model=schemas.StudentResponse)
def update_student(student_id: int, student: schemas.StudentCreate, db: Session = Depends(get_db)):
    """Update an existing student."""
    student_data = student.model_dump()
    db_student = crud.update_student(db, student_id, student_data)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {
        'id': db_student.id,
        'name': db_student.name,
        'faculty': db_student.faculty,
        'year': db_student.year,
        'career_goal': db_student.career_goal if hasattr(db_student, 'career_goal') else None,
        'human_skill_ids': [sk.id for sk in getattr(db_student, 'human_skills', [])],
        'courses_taken': [sc.course_id for sc in getattr(db_student, 'student_courses', [])],
        'created_at': db_student.created_at,
    }


@router.put("/{student_id}/courses", response_model=schemas.StudentResponse)
def update_student_courses(student_id: int, enrollment: schemas.EnrollmentUpdate, db: Session = Depends(get_db)):
    """Update the list of courses a student has taken (status='completed')."""
    db_student = crud.get_student(db, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Clear existing courses and add new ones with 'completed' status
    db.query(models.StudentCourse).filter(models.StudentCourse.student_id == student_id).delete()
    db.commit()
    
    for course_id in enrollment.courses_taken:
        crud.add_student_course(db, student_id, course_id, status="completed")
    
    db.refresh(db_student)
    return {
        'id': db_student.id,
        'name': db_student.name,
        'faculty': db_student.faculty,
        'year': db_student.year,
        'career_goal': db_student.career_goal if hasattr(db_student, 'career_goal') else None,
        'human_skill_ids': [sk.id for sk in getattr(db_student, 'human_skills', [])],
        'courses_taken': [sc.course_id for sc in getattr(db_student, 'student_courses', [])],
        'created_at': db_student.created_at,
    }


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    """Delete a student."""
    db_student = crud.get_student(db, student_id)
    
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted successfully"}

