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
    workload: Optional[int] = None
    credits: Optional[float] = None
    status: Optional[str] = None


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


class CourseResponse(BaseModel):
    """Schema for Course in responses."""
    id: int
    name: str
    description: Optional[str] = None
    difficulty: Optional[int] = None
    workload: Optional[int] = None
    credits: Optional[float] = None

    class Config:
        from_attributes = True


class SkillResponse(BaseModel):
    """Schema for Skill in responses."""
    id: int
    name: str
    type: str  # 'technical' or 'human'
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ClusterResponse(BaseModel):
    """Schema for Cluster in responses."""
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

    class Config:
        from_attributes = True


class CourseWithSkillsResponse(CourseResponse):
    """Extended Course response that includes associated skills."""
    skills: List['SkillResponse'] = []

    class Config:
        from_attributes = True


class CourseWithSkillsAndClustersResponse(CourseResponse):
    """Extended Course response with skills and clusters."""
    skills: List['SkillResponse'] = []
    clusters: List['ClusterResponse'] = []

    class Config:
        from_attributes = True


class CourseReviewResponse(CourseReviewBase):
    """Schema for Course Review response."""
    id: int
    student_id: int
    final_score: float
    created_at: datetime
    student: Optional['StudentResponse'] = None
    course: Optional['CourseResponse'] = None

    class Config:
        from_attributes = True


# ==================== COURSE DETAIL SCHEMAS ====================
class PrerequisiteCourseResponse(BaseModel):
    """Schema for prerequisite course in course details."""
    id: int
    name: str

    class Config:
        from_attributes = True


class CourseDetailsResponse(BaseModel):
    """Schema for detailed course response with prerequisites, skills, and clusters."""
    id: int
    name: str
    description: Optional[str] = None
    workload: Optional[int] = None
    credits: Optional[float] = None
    status: Optional[str] = None
    prerequisites: List[PrerequisiteCourseResponse] = []
    skills: List['SkillResponse'] = []
    clusters: List['ClusterResponse'] = []
    created_at: datetime

    class Config:
        from_attributes = True


class CourseStatsResponse(BaseModel):
    """Schema for course statistics (aggregated ratings)."""
    review_count: int
    avg_final_score: Optional[float] = 0.0
    avg_industry_relevance: Optional[float] = 0.0
    avg_instructor_quality: Optional[float] = 0.0
    avg_useful_learning: Optional[float] = 0.0


class CourseReviewDetailedResponse(CourseReviewBase):
    """Schema for detailed course review with student name."""
    id: int
    course_id: int
    student_id: int
    final_score: float
    created_at: datetime
    student_name: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedCourseReviewsResponse(BaseModel):
    """Schema for paginated course reviews."""
    items: List[CourseReviewDetailedResponse]
    page: int
    page_size: int
    total: int


# Rebuild models to resolve forward references
CourseReviewResponse.model_rebuild()