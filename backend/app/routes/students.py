from fastapi import APIRouter

router = APIRouter(prefix="/students", tags=["students"])

@router.get("/")
def get_students():
    return {"message": "Get all students"}

@router.get("/{student_id}")
def get_student(student_id: int):
    return {"message": f"Get student {student_id}"}
