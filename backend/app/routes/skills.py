from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..models import Skill
from ..schemas import SkillResponse
from ..database import get_db
from typing import List, Optional

router = APIRouter(prefix="/skills", tags=["skills"])

@router.get("/", response_model=List[SkillResponse])
def get_skills(type: Optional[str] = Query(None, description="Filter by skill type: 'technical' or 'human'"), db: Session = Depends(get_db)):
    query = db.query(Skill)
    if type:
        query = query.filter(Skill.type == type)
    return query.all()

