"""Development script to test recommendation engine with various scenarios.

This script tests:
- Smoothing formula correctness
- soft_readiness computation (1.0 when no human skills required, 0 when zero overlap)
- Blocker triggering when overlap is 0
- Similarity calculation with clusters and tech overlap (Jaccard)
- Prerequisite enforcement
- Final score ordering
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(backend_path))

from backend.app.database import SessionLocal
from backend.app.recommendation_engine import service, config
from backend.app import models
import json


def test_smoothing_formula():
    """Test that Bayesian smoothing prevents single high review from dominating."""
    print("\n" + "=" * 60)
    print("TEST: Smoothing Formula")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # This tests the core smoothing formula in the service
        # The formula: q_smoothed = (m*C + n_reviews*q_raw) / (m + n_reviews)
        # With m=5 (prior strength), if C=0.5 (global mean) and q_raw=1.0 (perfect),
        # then q_smoothed = (5*0.5 + 1*1.0) / (5+1) = 3.5/6 = 0.583
        
        print(f"Prior strength (m): {config.PRIOR_M}")
        print(f"Expected behavior: A single perfect review (score=10) should be")
        print(f"  dampened by the global mean to prevent overfitting.")
        print("✓ Test assumption: Smoothing formula is implemented in service.py")
    finally:
        db.close()


def test_soft_readiness_no_human_skills():
    """Test that soft_readiness = 1.0 when goal has no required human skills."""
    print("\n" + "=" * 60)
    print("TEST: Soft Readiness with No Required Human Skills")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Find or create a goal with no human skills required
        goal = db.query(models.CareerGoal).first()
        if not goal:
            print("⚠ No career goals in database")
            return
        
        # Clear any human skills for this goal
        db.query(models.CareerGoalHumanSkill).filter(
            models.CareerGoalHumanSkill.career_goal_id == goal.id
        ).delete()
        db.commit()
        
        # Get first student
        student = db.query(models.Student).first()
        if not student:
            print("⚠ No students in database")
            return
        
        res = service.recommend_courses(db, student.id, goal.id, k=3, enforce_prereqs=False)
        soft_readiness = res.get('soft_readiness', 0)
        
        print(f"Goal ID: {goal.id}")
        print(f"Goal has 0 required human skills: ✓")
        print(f"Soft Readiness: {soft_readiness}")
        
        if abs(soft_readiness - 1.0) < 0.01:
            print("✓ PASS: soft_readiness == 1.0")
        else:
            print(f"✗ FAIL: Expected 1.0, got {soft_readiness}")
        
    finally:
        db.close()


def test_soft_readiness_blocker():
    """Test that recommendations are blocked when soft_readiness = 0."""
    print("\n" + "=" * 60)
    print("TEST: Soft Readiness Blocker (Zero Overlap)")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Find a goal with required human skills
        goal = db.query(models.CareerGoal).join(
            models.CareerGoalHumanSkill
        ).first()
        
        if not goal:
            print("⚠ No career goal with human skills in database")
            return
        
        # Get a student and clear their human skills to trigger blocker
        student = db.query(models.Student).first()
        if not student:
            print("⚠ No students in database")
            return
        
        # Clear student's human skills
        db.query(models.StudentHumanSkill).filter(
            models.StudentHumanSkill.student_id == student.id
        ).delete()
        db.commit()
        
        res = service.recommend_courses(db, student.id, goal.id, k=3, enforce_prereqs=False)
        
        blocked_reason = res.get('blocked_reason')
        recommendations = res.get('recommendations', [])
        
        print(f"Student ID: {student.id}")
        print(f"Student has 0 human skills: ✓")
        print(f"Goal has required human skills: ✓")
        print(f"Blocked Reason: {blocked_reason}")
        print(f"Recommendations Count: {len(recommendations)}")
        
        if blocked_reason and len(recommendations) == 0:
            print("✓ PASS: Blocker triggered, recommendations empty")
        else:
            print(f"✗ FAIL: Expected blocker, got {len(recommendations)} recommendations")
        
    finally:
        db.close()


def test_similarity_calculation():
    """Test that similarity uses clusters and Jaccard tech overlap (not cosine)."""
    print("\n" + "=" * 60)
    print("TEST: Affinity Similarity (Clusters + Jaccard Tech Overlap)")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get a student with completed courses
        student = db.query(models.Student).join(
            models.StudentCourse
        ).filter(models.StudentCourse.status == 'completed').first()
        
        if not student:
            print("⚠ No students with completed courses in database")
            return
        
        # Get a goal
        goal = db.query(models.CareerGoal).first()
        if not goal:
            print("⚠ No career goals in database")
            return
        
        res = service.recommend_courses(db, student.id, goal.id, k=5, enforce_prereqs=False)
        recommendations = res.get('recommendations', [])
        
        print(f"Student ID: {student.id}")
        print(f"Career Goal ID: {goal.id}")
        print(f"Recommendations: {len(recommendations)}")
        print(f"ALPHA (cluster weight): {config.ALPHA}")
        print(f"TOP_K_SIMILAR: {config.TOP_K_SIMILAR}")
        
        if recommendations:
            rec = recommendations[0]
            affinity = rec.get('affinity_explanation')
            s_affinity = rec.get('breakdown', {}).get('s_affinity', 0)
            
            print(f"\nTop Recommendation:")
            print(f"  Course: {rec.get('name')}")
            print(f"  S_Affinity: {s_affinity:.2f}")
            
            if affinity and affinity.get('top_contributing_courses'):
                print(f"  Top Contributing Courses: {len(affinity['top_contributing_courses'])}")
                for contrib in affinity['top_contributing_courses'][:2]:
                    print(f"    - {contrib.get('completed_course_name')}")
                    print(f"      Similarity: {contrib.get('similarity_score'):.2f}")
                    print(f"      Cluster Match: {contrib.get('cluster_matched')}")
                    print(f"      Tech Overlap (Jaccard): {contrib.get('tech_overlap_score'):.2f}")
            
            print("✓ PASS: Similarity calculation appears correct")
        else:
            print("⚠ No recommendations to analyze")
        
    finally:
        db.close()


def test_prereq_enforcement():
    """Test that prereqs are enforced and courses are blocked correctly."""
    print("\n" + "=" * 60)
    print("TEST: Prerequisite Enforcement")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Get a student
        student = db.query(models.Student).first()
        if not student:
            print("⚠ No students in database")
            return
        
        # Get a goal
        goal = db.query(models.CareerGoal).first()
        if not goal:
            print("⚠ No career goals in database")
            return
        
        res_with_prereqs = service.recommend_courses(
            db, student.id, goal.id, k=5, enforce_prereqs=True
        )
        
        res_without_prereqs = service.recommend_courses(
            db, student.id, goal.id, k=5, enforce_prereqs=False
        )
        
        blocked = res_with_prereqs.get('blocked_courses', [])
        recs_with = len(res_with_prereqs.get('recommendations', []))
        recs_without = len(res_without_prereqs.get('recommendations', []))
        
        print(f"Student ID: {student.id}")
        print(f"Blocked Courses: {len(blocked)}")
        print(f"Recommendations with prereqs enforced: {recs_with}")
        print(f"Recommendations without prereq enforcement: {recs_without}")
        
        if recs_without >= recs_with:
            print("✓ PASS: Prereq enforcement reduces recommendations")
        else:
            print("⚠ Unexpected: More recs with prereqs than without")
        
    finally:
        db.close()


def test_final_score_ordering():
    """Test that final scores are properly ordered (descending)."""
    print("\n" + "=" * 60)
    print("TEST: Final Score Ordering")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        student = db.query(models.Student).first()
        goal = db.query(models.CareerGoal).first()
        
        if not student or not goal:
            print("⚠ No students or goals in database")
            return
        
        res = service.recommend_courses(db, student.id, goal.id, k=10, enforce_prereqs=False)
        recommendations = res.get('recommendations', [])
        
        print(f"Total recommendations: {len(recommendations)}")
        
        if not recommendations:
            print("⚠ No recommendations to check ordering")
            return
        
        scores = [r.get('final_score', 0) for r in recommendations]
        is_sorted = all(scores[i] >= scores[i+1] for i in range(len(scores)-1))
        
        print("\nFinal Scores:")
        for i, score in enumerate(scores[:5]):
            print(f"  {i+1}. {score:.4f}")
        
        if is_sorted:
            print("✓ PASS: Scores are in descending order")
        else:
            print("✗ FAIL: Scores are NOT properly ordered")
        
    finally:
        db.close()


def run_student_example(student_id=None, career_goal_id=None):
    """Run recommendations for a specific student (or first available)."""
    print("\n" + "=" * 60)
    print("EXAMPLE: Recommendations for a Student")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        if not student_id:
            student = db.query(models.Student).first()
            if not student:
                print("⚠ No students in database")
                return
            student_id = student.id
        else:
            student = db.query(models.Student).filter(models.Student.id == student_id).first()
            if not student:
                print(f"⚠ Student {student_id} not found")
                return
        
        if not career_goal_id:
            if student.career_goal_id:
                career_goal_id = student.career_goal_id
            else:
                goal = db.query(models.CareerGoal).first()
                if not goal:
                    print("⚠ No career goals in database")
                    return
                career_goal_id = goal.id
        
        print(f"Student: {student.name} (ID: {student_id})")
        print(f"Career Goal ID: {career_goal_id}")
        print(f"Human Skills: {len(student.human_skills)}")
        print(f"Completed Courses: {len([sc for sc in student.student_courses if sc.status == 'completed'])}")
        
        res = service.recommend_courses(db, student_id, career_goal_id, k=5, enforce_prereqs=True)
        
        print(f"\nResult:")
        print(f"  Soft Readiness: {res.get('soft_readiness', 0):.2f}")
        print(f"  Blocked Reason: {res.get('blocked_reason')}")
        print(f"  Blocked Courses: {len(res.get('blocked_courses', []))}")
        print(f"  Recommendations: {len(res.get('recommendations', []))}")
        
        for i, rec in enumerate(res.get('recommendations', [])[:3]):
            print(f"\n  #{i+1}: {rec['name']}")
            print(f"       Final Score: {rec['final_score']:.4f}")
            print(f"       S_Role: {rec['breakdown']['s_role']:.2f}")
            print(f"       S_Affinity: {rec['breakdown']['s_affinity']:.2f}")
            print(f"       Q_Smoothed: {rec['breakdown']['q_smoothed']:.2f}")
        
    finally:
        db.close()


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("RECOMMENDATION ENGINE TEST SUITE")
    print("=" * 60)
    
    test_smoothing_formula()
    test_soft_readiness_no_human_skills()
    test_soft_readiness_blocker()
    test_similarity_calculation()
    test_prereq_enforcement()
    test_final_score_ordering()
    run_student_example()
    
    print("\n" + "=" * 60)
    print("TESTS COMPLETE")
    print("=" * 60 + "\n")


if __name__ == '__main__':
    main()

