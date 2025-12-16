from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==================== AUTH SCHEMAS ====================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# ==================== STUDENT SCHEMAS ====================
class StudentBase(BaseModel):
    """Base schema for Student."""
    name: str
    faculty: Optional[str] = None
    year: Optional[int] = None
    courses_taken: List[int] = []
    career_goals: List[str] = []


class StudentCreate(StudentBase):
    """Schema for creating a basic Student (without auth password)."""
    pass

class StudentCreateAuth(StudentBase):
    """Schema for creating a Student with a password for registration."""
    password: str = Field(min_length=6) # <<< ADDED for Registration


class StudentResponse(StudentBase):
    """Schema for Student response."""
    id: int
    created_at: datetime
    # NOTE: hashed_password is NOT included for security

    class Config:
        from_attributes = True


# ==================== COURSE SCHEMAS ====================
class CourseBase(BaseModel):
    """Base schema for Course."""
    name: str
    description: Optional[str] = None
    difficulty: Optional[int] = None
    workload: Optional[int] = None


class CourseCreate(CourseBase):
    """Schema for creating a Course."""
    pass


class CourseResponse(CourseBase):
    """Schema for Course response."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== ENROLLMENT SCHEMAS ====================
class EnrollmentBase(BaseModel):
    """Base schema for Enrollment."""
    courses_taken: List[int]


class EnrollmentUpdate(EnrollmentBase):
    """Schema for updating student courses."""
    pass


# ==================== RATING SCHEMAS ====================
class RatingBase(BaseModel):
    """Base schema for Rating."""
    course_id: int
    score: float
    comment: Optional[str] = None


class RatingCreate(RatingBase):
    """Schema for creating a Rating. Student ID is derived from authentication."""
    pass


class RatingResponse(RatingBase):
    """Schema for Rating response."""
    id: int
    student_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== COURSE REVIEW SCHEMAS ====================
class CourseReviewBase(BaseModel):
    """Base schema for Course Review."""
    course_id: int
    languages_learned: Optional[str] = None
    course_outputs: Optional[str] = None
    industry_relevance_text: Optional[str] = None
    instructor_feedback: Optional[str] = None
    useful_learning_text: Optional[str] = None

    industry_relevance_rating: int  # 1–5
    instructor_rating: int          # 1–5
    useful_learning_rating: int     # 1–5


class CourseReviewCreate(CourseReviewBase):
    """Schema for creating a Course Review. Student ID is derived from authentication."""
    pass


class CourseReviewResponse(CourseReviewBase):
    """Schema for Course Review response."""
    id: int
    student_id: int
    final_score: float
    created_at: datetime
    student: Optional['StudentResponse'] = None

    class Config:
        from_attributes = True


# Rebuild models to resolve forward references
CourseReviewResponse.model_rebuild()