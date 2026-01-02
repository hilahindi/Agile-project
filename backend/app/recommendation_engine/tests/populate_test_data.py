from ..service import recommend_courses
from ...database import SessionLocal
from ... import models

"""
Idempotent test data population for recommendations debugging.

What it does:
- Ensures candidate courses have positive relevance for skills 1 and 3
- Ensures candidate courses are assigned cluster id 1 (Machine Learning)
- Adds a couple of course_reviews so q_smoothed becomes meaningful
- Sets student.courses_taken for student id 2 to a small set so affinity can be computed

Run with:
    python -m backend.app.recommendation_engine.tests.populate_test_data

Modify the COURSE_IDS, SKILL_IDS, STUDENT_ID as needed for your environment.
"""

from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
from datetime import datetime

DB = SessionLocal()

# TODO: adjust these ids to match your environment if needed
STUDENT_ID = 2
COURSE_IDS = [90901, 90905, 90926, 10128, 10145, 10120, 10352, 10355, 10356, 10127]
SKILL_IDS = [1, 3]  # skill ids to ensure relevance for (from your report)
CLUSTER_ID = 1  # Machine Learning cluster (exists in your DB per earlier response)


def ensure_course_skill(course_id: int, skill_id: int, relevance: float = 0.75):
    existing = DB.query(models.CourseSkill).filter(
        models.CourseSkill.course_id == course_id,
        models.CourseSkill.skill_id == skill_id,
    ).first()
    if existing:
        # update only if None or zero
        if not existing.relevance_score or existing.relevance_score == 0:
            existing.relevance_score = relevance
            DB.add(existing)
            print(f"Updated relevance for course {course_id} skill {skill_id} -> {relevance}")
        return
    try:
        new = models.CourseSkill(course_id=course_id, skill_id=skill_id, relevance_score=relevance)
        DB.add(new)
        DB.commit()
        print(f"Inserted CourseSkill: course={course_id} skill={skill_id} rel={relevance}")
    except IntegrityError:
        DB.rollback()


def ensure_course_cluster(course_id: int, cluster_id: int):
    existing = DB.query(models.CourseCluster).filter(
        models.CourseCluster.course_id == course_id,
        models.CourseCluster.cluster_id == cluster_id,
    ).first()
    if existing:
        return
    try:
        new = models.CourseCluster(course_id=course_id, cluster_id=cluster_id)
        DB.add(new)
        DB.commit()
        print(f"Inserted CourseCluster: course={course_id} cluster={cluster_id}")
    except IntegrityError:
        DB.rollback()


def ensure_course_review(course_id: int, student_id: int, final_score: float):
    # Insert a review (no uniqueness constraint), idempotency handled by checking similar review
    existing = DB.query(models.CourseReview).filter(
        models.CourseReview.course_id == course_id,
        models.CourseReview.student_id == student_id,
        models.CourseReview.final_score == final_score,
    ).first()
    if existing:
        return
    try:
        r = models.CourseReview(
            student_id=student_id,
            course_id=course_id,
            industry_relevance_rating=4,
            instructor_rating=4,
            useful_learning_rating=4,
            final_score=final_score,
            created_at=datetime.utcnow(),
        )
        DB.add(r)
        DB.commit()
        print(f"Inserted CourseReview: course={course_id} score={final_score}")
    except IntegrityError:
        DB.rollback()


def set_student_completed(student_id: int, completed_ids: list):
    """Insert rows into student_courses table with status='completed' if they don't already exist."""
    # Ensure student exists
    student = DB.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        print(f"Student {student_id} not found")
        return

    for cid in completed_ids:
        exists = DB.execute(text("SELECT 1 FROM student_courses WHERE student_id = :sid AND course_id = :cid"), {'sid': student_id, 'cid': cid}).fetchone()
        if exists:
            continue
        try:
            DB.execute(text("INSERT INTO student_courses (student_id, course_id, status, created_at) VALUES (:sid, :cid, 'completed', :created)"), {'sid': student_id, 'cid': cid, 'created': datetime.utcnow()})
            DB.commit()
            print(f"Inserted student_courses: student={student_id} course={cid} status=completed")
        except Exception as e:
            DB.rollback()
            print(f"Failed to insert student_courses for student={student_id} course={cid}: {e}")


def main():
    print("Populating test data for recommendation engine...")

    # Ensure skills exist
    for cid in COURSE_IDS:
        for sid in SKILL_IDS:
            ensure_course_skill(cid, sid, relevance=0.75)

    # Ensure clusters
    for cid in COURSE_IDS:
        ensure_course_cluster(cid, CLUSTER_ID)

    # Add a couple of reviews per course to make q_smoothed meaningful
    for cid in COURSE_IDS[:6]:
        ensure_course_review(cid, STUDENT_ID, final_score=8.5)
        ensure_course_review(cid, STUDENT_ID, final_score=7.5)

    # Set student's completed courses so affinity can compute
    # Choose three courses (these will be considered completed)
    completed = [COURSE_IDS[0], COURSE_IDS[1], COURSE_IDS[2]]
    set_student_completed(STUDENT_ID, completed)

    print("Done.")


if __name__ == '__main__':
    main()
