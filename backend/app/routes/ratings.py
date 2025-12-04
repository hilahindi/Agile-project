from fastapi import APIRouter

router = APIRouter(prefix="/ratings", tags=["ratings"])

@router.get("/")
def get_ratings():
    return {"message": "Get all ratings"}

@router.post("/")
def create_rating():
    return {"message": "Create new rating"}
