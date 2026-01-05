from pydantic import BaseModel
from typing import List, Optional, Dict


class SkillInfo(BaseModel):
    """Basic skill info with name."""
    skill_id: int
    name: str


class SkillMatch(BaseModel):
    """Matched technical skill with relevance score."""
    skill_id: int
    name: str
    relevance_score: float


class AffinityExplanationDetail(BaseModel):
    """Details about a single completed course contributing to affinity."""
    completed_course_id: int
    completed_course_name: str
    similarity_score: float
    cluster_matched: bool  # whether they share a cluster
    tech_overlap_score: float  # Jaccard similarity on technical skills


class AffinityExplanation(BaseModel):
    """Explanation of how affinity was computed."""
    top_contributing_courses: List[AffinityExplanationDetail] = []


class CourseExplain(BaseModel):
    """Single recommended course with breakdown and explainability."""
    course_id: int
    name: str
    final_score: float  # overall score in [0..1]
    breakdown: Dict = {}  # contains s_role, s_affinity, q_smoothed
    avg_score_raw: Optional[float]  # raw 1..10
    review_count: int
    matched_technical_skills: List[SkillMatch] = []
    missing_technical_skills: List[SkillMatch] = []
    affinity_explanation: Optional[AffinityExplanation] = None


class RecommendationsResponse(BaseModel):
    """Full response for course recommendations."""
    soft_readiness: float  # overlap / R_human; 1.0 if R_human is empty
    overlap_human_skills: List[SkillInfo] = []  # human skills student has
    missing_human_skills: List[SkillInfo] = []  # required but student lacks
    recommendations: List[CourseExplain] = []  # empty if blocked
    blocked_reason: Optional[str] = None  # reason if recommendations are blocked
    blocked_courses: Optional[List[Dict]] = None  # courses blocked by missing prereqs

