from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

# --------------------
# Student Table
# --------------------
class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    faculty = Column(String, nullable=True)
    year = Column(Integer, nullable=True)

    enrollments = relationship("Enrollment", back_populates="student")
    ratings = relationship("Rating", back_populates="student")


# --------------------
# Course Table
# --------------------
class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    difficulty = Column(Integer, nullable=True)   # 1–5
    workload = Column(Integer, nullable=True)     # hours per week

    enrollments = relationship("Enrollment", back_populates="course")
    ratings = relationship("Rating", back_populates="course")


# --------------------
# Enrollment Table
# --------------------
class Enrollment(Base):
    __tablename__ = "enrollment"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


# --------------------
# Ratings Table
# --------------------
class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    score = Column(Float, nullable=False)  # 1–5
    comment = Column(String, nullable=True)

    student = relationship("Student", back_populates="ratings")
    course = relationship("Course", back_populates="ratings")
