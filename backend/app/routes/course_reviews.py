from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CourseReview, Student, Course
from ..schemas import CourseReviewCreate, CourseReviewResponse
from ..auth_utils import get_current_student


# ==================== SCORE CALCULATION ====================
def calculate_final_score(industry: int, instructor: int, useful: int) -> float:
    """
    Final score scaled between 1 and 10.

    Formula:
        weighted_sum = (industry * 5) + (instructor * 2) + (useful * 3)
        # denominator = 5 + 2 + 3 = 10
        score_1_to_5 = weighted_sum / 10
        final_score = score_1_to_5 * 2  # Now range = 1–10

    Return a rounded float with 2 decimals.
    """
    weighted_sum = (industry * 5) + (instructor * 2) + (useful * 3)
    score_1_to_5 = weighted_sum / 10
    final_score = score_1_to_5 * 2
    return round(final_score, 2)


# ==================== ROUTER ====================
router = APIRouter(prefix="/reviews", tags=["Course Reviews"])


@router.get("/", response_model=list[CourseReviewResponse])
def get_all_reviews(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all course reviews with pagination."""
    reviews = db.query(CourseReview).offset(skip).limit(limit).all()
    return reviews


@router.post("/", response_model=CourseReviewResponse)
def create_course_review(
    review_data: CourseReviewCreate,
    current_student: Student = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Create a new course review.
    Student ID is automatically set from the authenticated user.
    Calculates final_score using the weighted formula.
    """
    # Verify course exists
    course = db.query(Course).filter(Course.id == review_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Calculate final score
    final_score = calculate_final_score(
        industry=review_data.industry_relevance_rating,
        instructor=review_data.instructor_rating,
        useful=review_data.useful_learning_rating
    )

    # Create review record with student_id from authentication context
    new_review = CourseReview(
        student_id=current_student.id,
        course_id=review_data.course_id,
        languages_learned=review_data.languages_learned,
        course_outputs=review_data.course_outputs,
        industry_relevance_text=review_data.industry_relevance_text,
        instructor_feedback=review_data.instructor_feedback,
        useful_learning_text=review_data.useful_learning_text,
        industry_relevance_rating=review_data.industry_relevance_rating,
        instructor_rating=review_data.instructor_rating,
        useful_learning_rating=review_data.useful_learning_rating,
        final_score=final_score
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


@router.get("/course/{course_id}", response_model=list[CourseReviewResponse])
def get_reviews_by_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific course."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    reviews = db.query(CourseReview).filter(
        CourseReview.course_id == course_id
    ).all()

    return reviews


@router.get("/student/{student_id}", response_model=list[CourseReviewResponse])
def get_reviews_by_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews submitted by a specific student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    reviews = db.query(CourseReview).filter(
        CourseReview.student_id == student_id
    ).all()

    return reviews
