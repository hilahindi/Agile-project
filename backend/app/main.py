from fastapi import FastAPI
from .routes import students, courses, ratings
from .database import Base, engine
from . import models

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(students.router)
app.include_router(courses.router)
app.include_router(ratings.router)

@app.get("/")
def root():
    return {"message": "API is running"}
