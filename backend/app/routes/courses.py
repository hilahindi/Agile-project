from fastapi import APIRouter

router = APIRouter(prefix="/courses", tags=["courses"])

@router.get("/")
def get_courses():
    return {"message": "Get all courses"}

@router.get("/{course_id}")
def get_course(course_id: int):
    return {"message": f"Get course {course_id}"}
