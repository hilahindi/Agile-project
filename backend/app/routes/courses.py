from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[schemas.CourseResponse])
def get_all_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all courses with pagination."""
    courses = db.query(models.Course).offset(skip).limit(limit).all()
    return courses


@router.get("/{course_id}", response_model=schemas.CourseDetailsResponse)
def get_course_details(course_id: int, db: Session = Depends(get_db)):
    """Get detailed course information including prerequisites, skills, and clusters."""
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Build response with proper prerequisite mapping
    # The prerequisites relationship returns CoursePrerequisite objects
    # We need to map them to PrerequisiteCourseResponse objects
    prerequisites = [
        schemas.PrerequisiteCourseResponse(
            id=cp.required_course_id,
            name=db.query(models.Course).filter(
                models.Course.id == cp.required_course_id
            ).first().name
        )
        for cp in course.prerequisites
    ]
    
    # Map skills
    skills = [
        schemas.SkillResponse(
            id=skill.id,
            name=skill.name,
            type=skill.type,
            description=skill.description
        )
        for skill in course.skills
    ]
    
    # Map clusters
    clusters = [
        schemas.ClusterResponse(
            id=cluster.id,
            name=cluster.name,
            description=cluster.description
        )
        for cluster in course.clusters
    ]
    
    return schemas.CourseDetailsResponse(
        id=course.id,
        name=course.name,
        description=course.description,
        workload=course.workload,
        credits=course.credits,
        status=course.status,
        prerequisites=prerequisites,
        skills=skills,
        clusters=clusters,
        created_at=course.created_at
    )


@router.get("/{course_id}/stats", response_model=schemas.CourseStatsResponse)
def get_course_stats(course_id: int, db: Session = Depends(get_db)):
    """Get aggregated statistics for a course."""
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Query reviews for this course
    reviews = db.query(models.CourseReview).filter(
        models.CourseReview.course_id == course_id
    ).all()
    
    if not reviews:
        return schemas.CourseStatsResponse(
            review_count=0,
            avg_final_score=0.0,
            avg_industry_relevance=0.0,
            avg_instructor_quality=0.0,
            avg_useful_learning=0.0
        )
    
    # Calculate averages
    review_count = len(reviews)
    avg_final_score = sum(r.final_score for r in reviews) / review_count
    avg_industry_relevance = sum(r.industry_relevance_rating for r in reviews) / review_count
    avg_instructor_quality = sum(r.instructor_rating for r in reviews) / review_count
    avg_useful_learning = sum(r.useful_learning_rating for r in reviews) / review_count
    
    return schemas.CourseStatsResponse(
        review_count=review_count,
        avg_final_score=round(avg_final_score, 2),
        avg_industry_relevance=round(avg_industry_relevance, 2),
        avg_instructor_quality=round(avg_instructor_quality, 2),
        avg_useful_learning=round(avg_useful_learning, 2)
    )


@router.get("/{course_id}/reviews", response_model=schemas.PaginatedCourseReviewsResponse)
def get_course_reviews(
    course_id: int, 
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get paginated reviews for a specific course."""
    # Check if course exists
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Query total count
    total = db.query(models.CourseReview).filter(
        models.CourseReview.course_id == course_id
    ).count()
    
    # Query reviews (newest first)
    reviews = db.query(models.CourseReview).filter(
        models.CourseReview.course_id == course_id
    ).order_by(desc(models.CourseReview.created_at)).offset(offset).limit(page_size).all()
    
    # Build response items with student names
    items = [
        schemas.CourseReviewDetailedResponse(
            id=review.id,
            course_id=review.course_id,
            student_id=review.student_id,
            final_score=review.final_score,
            created_at=review.created_at,
            student_name=review.student.name if review.student else "Unknown",
            languages_learned=review.languages_learned,
            course_outputs=review.course_outputs,
            industry_relevance_text=review.industry_relevance_text,
            instructor_feedback=review.instructor_feedback,
            useful_learning_text=review.useful_learning_text,
            industry_relevance_rating=review.industry_relevance_rating,
            instructor_rating=review.instructor_rating,
            useful_learning_rating=review.useful_learning_rating
        )
        for review in reviews
    ]
    
    return schemas.PaginatedCourseReviewsResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total
    )


@router.post("/", response_model=schemas.CourseResponse)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db)):
    """Create a new course."""
    db_course = models.Course(**course.dict())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.put("/{course_id}", response_model=schemas.CourseResponse)
def update_course(course_id: int, course: schemas.CourseCreate, db: Session = Depends(get_db)):
    """Update an existing course."""
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    for key, value in course.dict().items():
        setattr(db_course, key, value)
    
    db.commit()
    db.refresh(db_course)
    return db_course


@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    """Delete a course."""
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    db.delete(db_course)
    db.commit()
    return {"message": "Course deleted successfully"}
