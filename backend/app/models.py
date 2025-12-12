from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# --------------------
# Student Table
# --------------------
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False) # Changed to unique for login
    hashed_password = Column(String, nullable=False) # <<< ADDED for Authentication
    faculty = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    courses_taken = Column(ARRAY(Integer), default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    ratings = relationship("Rating", back_populates="student", cascade="all, delete-orphan")
    course_reviews = relationship("CourseReview", back_populates="student", cascade="all, delete-orphan")


# --------------------
# Course Table
# --------------------
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    difficulty = Column(Integer, nullable=True)   # 1–5
    workload = Column(Integer, nullable=True)     # hours per week
    created_at = Column(DateTime, default=datetime.utcnow)

    ratings = relationship("Rating", back_populates="course", cascade="all, delete-orphan")
    course_reviews = relationship("CourseReview", back_populates="course", cascade="all, delete-orphan")


# --------------------
# Ratings Table
# --------------------
class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    score = Column(Float, nullable=False)  # 1–5
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="ratings")
    course = relationship("Course", back_populates="ratings")


# --------------------
# Course Reviews Table
# --------------------
class CourseReview(Base):
    __tablename__ = "course_reviews"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    languages_learned = Column(Text, nullable=True)
    course_outputs = Column(Text, nullable=True)
    industry_relevance_text = Column(Text, nullable=True)
    instructor_feedback = Column(Text, nullable=True)
    useful_learning_text = Column(Text, nullable=True)

    industry_relevance_rating = Column(Integer, nullable=False)  # 1-5
    instructor_rating = Column(Integer, nullable=False)          # 1-5
    useful_learning_rating = Column(Integer, nullable=False)     # 1-5

    final_score = Column(Float, nullable=False)  # MUST be 1-10
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="course_reviews")
    course = relationship("Course", back_populates="course_reviews")