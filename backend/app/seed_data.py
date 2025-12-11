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
    print("Database schema created successfully (tables: students, courses, ratings).")
    
    # --- SKIPPING SAMPLE DATA INSERTION ---
    # The following blocks for courses, students, and ratings have been removed
    # to honor your request for a clean database.
    
    db.close()


if __name__ == "__main__":
    seed_database()