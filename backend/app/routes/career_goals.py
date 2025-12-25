from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CareerGoal, CareerGoalTechnicalSkill, CareerGoalHumanSkill, Skill
from typing import List, Dict

router = APIRouter(prefix="/career-goals", tags=["career-goals"])

@router.get("/", response_model=List[Dict])
def get_all_career_goals(db: Session = Depends(get_db)):
    goals = db.query(CareerGoal).all()
    # Gather technical/human skills as list-of-names for each goal
    def skill_names(goal, relation_attr):
        return [db.query(Skill).get(rel.skill_id).name for rel in getattr(goal, relation_attr)]

    seen_names = set()
    filtered = []
    for goal in goals:
        if goal.name not in seen_names:
            seen_names.add(goal.name)
            filtered.append(goal)

    return [
        {
            "id": goal.id,
            "name": goal.name,
            "description": goal.description,
            "technical_skills": skill_names(goal, 'technical_skills'),
            "human_skills": skill_names(goal, 'human_skills'),
        }
        for goal in filtered
    ]

