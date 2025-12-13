"""
Seed script to initialize the database with tables only (no sample data).
This ensures a clean schema is ready for production use.
"""

from .database import SessionLocal, engine
from . import models
from sqlalchemy import text
# auth_utils import is still needed for the student model dependency on startup
from .auth_utils import get_password_hash 


def seed_database():
    """Initialize the database tables without populating sample data."""
    db = SessionLocal()
    
    # --- CRITICAL: Drop all existing tables to apply the new schema ---
    try:
        # Drop all tables with CASCADE to handle dependencies and ensure the new schema is used
        db.execute(text("DROP TABLE IF EXISTS course_reviews CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS ratings CASCADE"))
        db.execute(text("DROP TABLE IF EXISTS students CASCADE")) 
        db.execute(text("DROP TABLE IF EXISTS courses CASCADE"))
        db.commit()
        print("Existing tables dropped successfully.")
    except Exception as e:
        db.rollback()
        # This will still print a warning if a table didn't exist, but it's safe.
        print(f"Warning during DROP (may occur if tables didn't exist): {e}") 
    
    # Create all tables (Now includes 'hashed_password' on the students table)
    models.Base.metadata.create_all(bind=engine)
    print("Database schema created successfully (tables: students, courses, ratings, course_reviews).")
    
    # --- ADD SAMPLE COURSES ---
    sample_courses = [
        models.Course(
            id=10123,
            name="Introduction to Computer Science",
            description="CS101 - Learn fundamental programming concepts and problem-solving techniques",
            difficulty=2,
            workload=4  # credits
        ),
        models.Course(
            id=10124,
            name="Data Structures",
            description="CS201 - Master arrays, linked lists, trees, and algorithms",
            difficulty=4,
            workload=4  # credits
        ),
        models.Course(
            id=10125,
            name="Database Systems",
            description="CS301 - Design and implement relational databases",
            difficulty=3,
            workload=3  # credits
        ),
        models.Course(
            id=10126,
            name="Web Development",
            description="CS302 - Build modern web applications with HTML, CSS, JavaScript",
            difficulty=3,
            workload=3  # credits
        ),
        models.Course(
            id=10127,
            name="Machine Learning",
            description="CS401 - Introduction to ML algorithms and neural networks",
            difficulty=5,
            workload=4  # credits
        ),
    ]
    
    db.add_all(sample_courses)
    db.commit()
    print("Sample courses added successfully.")
    
    # --- ADD DEMO STUDENT ---
    demo_student = models.Student(
        name="demo",
        hashed_password=get_password_hash("demo123"),
        faculty="Computer Science",
        year=3
    )
    db.add(demo_student)
    db.commit()
    print("Demo student created successfully (username: demo, password: demo123).")
    
    # --- ADD SAMPLE COURSE REVIEWS ---
    sample_reviews = [
        models.CourseReview(
            student_id=1,
            course_id=10123,
            languages_learned="HTML, CSS, JavaScript",
            course_outputs="Personal Portfolio Website, Responsive Design",
            industry_relevance_text="Highly relevant for web development careers",
            instructor_feedback="Excellent teaching methodology and clear explanations",
            useful_learning_text="Learned practical skills applicable to real projects",
            industry_relevance_rating=5,
            instructor_rating=5,
            useful_learning_rating=5,
            final_score=10.0
        ),
        models.CourseReview(
            student_id=1,
            course_id=10124,
            languages_learned="Python, Advanced OOP",
            course_outputs="Multiple backend projects, API development",
            industry_relevance_text="Essential for backend development positions",
            instructor_feedback="Great depth of knowledge, challenging assignments",
            useful_learning_text="Very useful for production-level coding",
            industry_relevance_rating=5,
            instructor_rating=4,
            useful_learning_rating=5,
            final_score=9.4
        ),
        models.CourseReview(
            student_id=1,
            course_id=10125,
            languages_learned="React, JavaScript ES6+",
            course_outputs="Interactive React Components, Full App",
            industry_relevance_text="Very relevant for modern frontend development",
            instructor_feedback="Good course content, could use more examples",
            useful_learning_text="Practical knowledge for frontend jobs",
            industry_relevance_rating=5,
            instructor_rating=4,
            useful_learning_rating=4,
            final_score=8.8
        ),
    ]
    
    db.add_all(sample_reviews)
    db.commit()
    print("Sample course reviews added successfully.")
    
    db.close()


if __name__ == "__main__":
    seed_database()