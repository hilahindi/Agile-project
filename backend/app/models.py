from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, func, UniqueConstraint, Index
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
    career_goals = Column(ARRAY(String), default=list)  # Career goals/job roles
    human_skills = Column(ARRAY(Integer), default=list)  # Array of skill IDs
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
    workload = Column(Integer, nullable=True)     # hours per week
    credits = Column(Float, nullable=True)        # credit hours
    status = Column(String, nullable=True)        # Mandatory, Selective, Service
    created_at = Column(DateTime, default=datetime.utcnow)

    ratings = relationship("Rating", back_populates="course", cascade="all, delete-orphan")
    course_reviews = relationship("CourseReview", back_populates="course", cascade="all, delete-orphan")
    prerequisites = relationship(
        "CoursePrerequisite",
        foreign_keys="CoursePrerequisite.course_id",
        back_populates="course",
        cascade="all, delete-orphan"
    )
    skills = relationship("Skill", secondary="course_skills", back_populates="courses")
    clusters = relationship("Cluster", secondary="course_clusters", back_populates="courses")


# --------------------
# Course Prerequisites Table (Junction Table)
# --------------------
class CoursePrerequisite(Base):
    __tablename__ = "course_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    required_course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course", foreign_keys=[course_id], back_populates="prerequisites")
    required_course = relationship("Course", foreign_keys=[required_course_id])


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
# Career Goals Table
# --------------------
class CareerGoal(Base):
    __tablename__ = "career_goals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), nullable=False)
    description = Column(Text)

    technical_skills = relationship('CareerGoalTechnicalSkill', back_populates='career_goal', cascade='all, delete-orphan')
    human_skills = relationship('CareerGoalHumanSkill', back_populates='career_goal', cascade='all, delete-orphan')

# --------------------
# Skills Table
# --------------------
class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), nullable=False)
    type = Column(String(20), nullable=False)  # 'technical' or 'human'
    description = Column(Text)

    technical_career_goals = relationship('CareerGoalTechnicalSkill', back_populates='skill', cascade='all, delete-orphan')
    human_career_goals = relationship('CareerGoalHumanSkill', back_populates='skill', cascade='all, delete-orphan')
    courses = relationship("Course", secondary="course_skills", back_populates="skills")

# -------------------------------
# CareerGoalTechnicalSkills Join Table
# -------------------------------
class CareerGoalTechnicalSkill(Base):
    __tablename__ = 'career_goal_technical_skills'
    career_goal_id = Column(Integer, ForeignKey('career_goals.id', ondelete='CASCADE'), primary_key=True)
    skill_id = Column(Integer, ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True)

    career_goal = relationship('CareerGoal', back_populates='technical_skills')
    skill = relationship('Skill', back_populates='technical_career_goals')

# -------------------------------
# CareerGoalHumanSkills Join Table
# -------------------------------
class CareerGoalHumanSkill(Base):
    __tablename__ = 'career_goal_human_skills'
    career_goal_id = Column(Integer, ForeignKey('career_goals.id', ondelete='CASCADE'), primary_key=True)
    skill_id = Column(Integer, ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True)

    career_goal = relationship('CareerGoal', back_populates='human_skills')
    skill = relationship('Skill', back_populates='human_career_goals')

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


# --------------------
# Course Skills (Junction Table)
# --------------------
class CourseSkill(Base):
    __tablename__ = "course_skills"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    relevance_score = Column(Float, nullable=True)  # 0.0 to 1.0, optional
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('course_id', 'skill_id', name='uq_course_skill'),
        Index('ix_course_skills_course_id', 'course_id'),
        Index('ix_course_skills_skill_id', 'skill_id'),
    )


# --------------------
# Clusters Table
# --------------------
class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)  # e.g., "Machine Learning"
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    courses = relationship("Course", secondary="course_clusters", back_populates="clusters")


# --------------------
# Course Clusters (Junction Table)
# --------------------
class CourseCluster(Base):
    __tablename__ = "course_clusters"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    cluster_id = Column(Integer, ForeignKey("clusters.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('course_id', 'cluster_id', name='uq_course_cluster'),
        Index('ix_course_clusters_course_id', 'course_id'),
        Index('ix_course_clusters_cluster_id', 'cluster_id'),
    )