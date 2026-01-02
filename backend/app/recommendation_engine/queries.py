from sqlalchemy.orm import Session
from .. import models
from sqlalchemy import func
from collections import defaultdict
from sqlalchemy import text


def get_student(db: Session, student_id: int):
    return db.query(models.Student).filter(models.Student.id == student_id).first()


def get_student_human_skills(db: Session, student_id: int):
    """Return list of skill_ids that the student has marked as human skills.
    Queries the student_human_skills junction table via raw SQL.
    """
    try:
        rows = db.execute(
            text("SELECT skill_id FROM student_human_skills WHERE student_id = :sid"), 
            {'sid': student_id}
        ).fetchall()
        return [int(r[0]) for r in rows]
    except Exception:
        return []


def get_all_course_skills(db: Session):
    # returns list of (course_id, skill_id, relevance_score)
    rows = db.query(models.CourseSkill.course_id, models.CourseSkill.skill_id, models.CourseSkill.relevance_score).all()
    return rows


def get_course_technical_skills_map(db: Session):
    """Return map course_id -> set(skill_ids) for technical skills only.
    Joins CourseSkill with Skill table to filter by type='technical'.
    """
    rows = db.query(models.CourseSkill.course_id, models.Skill.id).join(
        models.Skill, models.CourseSkill.skill_id == models.Skill.id
    ).filter(models.Skill.type == 'technical').all()
    
    m = defaultdict(set)
    for course_id, skill_id in rows:
        m[course_id].add(skill_id)
    return m


def get_all_skills(db: Session):
    return db.query(models.Skill).all()


def get_career_goal_skills(db: Session, career_goal_id: int):
    """Return (tech_ids, human_ids) tuple of skill IDs required by a career goal."""
    tech = db.query(models.CareerGoalTechnicalSkill.skill_id).filter(
        models.CareerGoalTechnicalSkill.career_goal_id == career_goal_id
    ).all()
    human = db.query(models.CareerGoalHumanSkill.skill_id).filter(
        models.CareerGoalHumanSkill.career_goal_id == career_goal_id
    ).all()
    tech_ids = [r[0] for r in tech]
    human_ids = [r[0] for r in human]
    return tech_ids, human_ids


def get_all_courses(db: Session):
    return db.query(models.Course).all()


def get_course_clusters_map(db: Session):
    """Return map course_id -> list of cluster objects."""
    rows = db.query(models.CourseCluster.course_id, models.Cluster).join(
        models.Cluster, models.CourseCluster.cluster_id == models.Cluster.id
    ).all()
    m = defaultdict(list)
    for course_id, cluster in rows:
        m[course_id].append(cluster)
    return m


def get_course_review_stats(db: Session):
    """Return (per_course_stats, global_mean) tuple.
    per_course_stats: dict course_id -> {'n': count, 'avg': avg_score}
    global_mean: average final_score across all course reviews.
    """
    per = db.query(
        models.CourseReview.course_id, 
        func.count(models.CourseReview.id).label('n'), 
        func.avg(models.CourseReview.final_score).label('avg')
    ).group_by(models.CourseReview.course_id).all()
    
    stats = {r.course_id: {'n': int(r.n), 'avg': float(r.avg)} for r in per}
    global_mean_row = db.query(func.avg(models.CourseReview.final_score)).one()
    global_mean = float(global_mean_row[0]) if global_mean_row[0] is not None else None
    return stats, global_mean


def get_course_prereqs(db: Session):
    """Return map course_id -> set(required_course_id)."""
    rows = db.query(models.CoursePrerequisite.course_id, models.CoursePrerequisite.required_course_id).all()
    m = defaultdict(set)
    for course_id, req_id in rows:
        m[course_id].add(req_id)
    return m


def get_student_completed_course_ids(db: Session, student_id: int):
    """Return list of course_ids the student has completed (status='completed').
    Uses the `student_courses` junction table.
    """
    try:
        rows = db.execute(
            text("SELECT course_id FROM student_courses WHERE student_id = :sid AND status = 'completed'"), 
            {'sid': student_id}
        ).fetchall()
        return [int(r[0]) for r in rows]
    except Exception:
        # Fallback: check StudentCourse model directly
        return []

