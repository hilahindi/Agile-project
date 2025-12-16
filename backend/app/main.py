# backend/app/main.py

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles 
from fastapi.middleware.cors import CORSMiddleware # <<< 1. IMPORT
from .routes import students, courses, ratings, course_reviews, auth
from .database import Base, engine
# CRITICAL: Import all models to ensure they're loaded into memory before table creation
from .models import Student, Course, Rating, CourseReview
from .seed_data import seed_database
import os

# Define the path to the React build directory (ensure this path matches your volume mount)
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), 'frontend_build')

seed_database() 

app = FastAPI()

# 2. DEFINE ALLOWED ORIGINS
# Since the frontend is running on localhost:3000 (usually) and the backend is 8000,
# we need to allow the frontend's origin.
origins = [
    "*"
]

# 3. ADD CORS MIDDLEWARE TO APP
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # Lists the origins permitted to make requests
    allow_credentials=True,             # Allow cookies/authorization headers
    allow_methods=["*"],                # Allow all methods (GET, POST, PUT, DELETE, OPTIONS, etc.)
    allow_headers=["*"],                # Allow all headers
)

app.include_router(students.router)
app.include_router(courses.router)
app.include_router(ratings.router)
app.include_router(course_reviews.router)
app.include_router(auth.router)

# Mount the StaticFiles directory to serve the frontend
if os.path.isdir(FRONTEND_BUILD_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_BUILD_DIR, html=True), name="frontend")


@app.get("/api_status") 
def root():
    return {"message": "API is running. Access API documentation at /docs."}