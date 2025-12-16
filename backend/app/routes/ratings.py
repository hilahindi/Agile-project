from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..auth_utils import get_current_student

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.get("/", response_model=list[schemas.RatingResponse])
def get_all_ratings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all ratings with pagination."""
    ratings = db.query(models.Rating).offset(skip).limit(limit).all()
    return ratings


@router.get("/{rating_id}", response_model=schemas.RatingResponse)
def get_rating(rating_id: int, db: Session = Depends(get_db)):
    """Get a specific rating by ID."""
    rating = db.query(models.Rating).filter(models.Rating.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    return rating


@router.get("/course/{course_id}", response_model=list[schemas.RatingResponse])
def get_course_ratings(course_id: int, db: Session = Depends(get_db)):
    """Get all ratings for a specific course."""
    ratings = db.query(models.Rating).filter(models.Rating.course_id == course_id).all()
    return ratings


@router.get("/student/{student_id}", response_model=list[schemas.RatingResponse])
def get_student_ratings(student_id: int, db: Session = Depends(get_db)):
    """Get all ratings from a specific student."""
    ratings = db.query(models.Rating).filter(models.Rating.student_id == student_id).all()
    return ratings


@router.post("/", response_model=schemas.RatingResponse)
def create_rating(
    rating: schemas.RatingCreate, 
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Create a new rating. Student ID is automatically set from the authenticated user.
    """
    # Verify course exists
    course = db.query(models.Course).filter(models.Course.id == rating.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Create rating with student_id from authentication context
    db_rating = models.Rating(
        student_id=current_student.id,
        course_id=rating.course_id,
        score=rating.score,
        comment=rating.comment,
    )
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    return db_rating


@router.put("/{rating_id}", response_model=schemas.RatingResponse)
def update_rating(rating_id: int, rating: schemas.RatingCreate, db: Session = Depends(get_db)):
    """Update an existing rating."""
    db_rating = db.query(models.Rating).filter(models.Rating.id == rating_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    for key, value in rating.dict().items():
        setattr(db_rating, key, value)
    
    db.commit()
    db.refresh(db_rating)
    return db_rating


@router.delete("/{rating_id}")
def delete_rating(rating_id: int, db: Session = Depends(get_db)):
    """Delete a rating."""
    db_rating = db.query(models.Rating).filter(models.Rating.id == rating_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    db.delete(db_rating)
    db.commit()
    return {"message": "Rating deleted successfully"}
