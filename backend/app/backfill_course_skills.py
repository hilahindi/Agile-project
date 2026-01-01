"""
Idempotent backfill script to map courses to skills using intelligent keyword matching.
Run this after seeding the database with courses and skills.

Usage:
    python -m backend.app.backfill_course_skills
    
or from FastAPI:
    # Add an endpoint that triggers this
"""

from .database import SessionLocal
from . import models
from sqlalchemy.exc import IntegrityError
import sys

# ============================================================================
# KEYWORD MAPPINGS
# ============================================================================

TECHNICAL_SKILL_KEYWORDS = {
    "Python": ["python", "py", "ml", "machine learning", "ai", "data science", "deep learning"],
    "JavaScript": ["javascript", "js", "react", "vue", "angular", "frontend", "web", "node", "typescript"],
    "SQL": ["database", "sql", "db", "relational", "query", "data"],
    "React": ["react", "frontend", "ui", "interface", "javascript"],
    "Node.js": ["node", "nodejs", "backend", "api", "server", "express"],
    "TensorFlow": ["tensorflow", "ml", "machine learning", "deep learning", "neural", "ai", "keras"],
    "C++": ["c++", "cpp", "assembly", "low-level", "systems", "compiler", "os"],
    "AWS": ["aws", "amazon", "cloud", "infrastructure", "devops", "security"],
    "Docker": ["docker", "container", "containerization", "devops"],
    "Git": ["git", "version control", "github", "gitlab"],
}

HUMAN_SKILL_KEYWORDS = {
    "Teamwork": ["project", "team", "collaboration", "group", "software engineering", "se"],
    "Communication": ["presentation", "communication", "verbal", "writing", "seminar"],
    "Self-learner": ["theory", "research", "ml", "machine learning", "advanced", "deep"],
    "Problem-solving": ["algorithm", "problem", "optimization", "solve"],
    "Adaptability": ["change", "adapt", "flexible", "agile"],
    "Leadership": ["project", "lead", "management", "engineering"],
}

# ============================================================================
# SKILL MAPPING HEURISTICS
# ============================================================================

def categorize_course(course_name: str, course_description: str) -> tuple[list[str], list[str]]:
    """
    Intelligently categorize a course and return recommended technical and human skills.
    
    Args:
        course_name: Name of the course
        course_description: Description of the course (may be None)
    
    Returns:
        (technical_skills, human_skills) - lists of skill names to assign
    """
    combined_text = (course_name + " " + (course_description or "")).lower()
    
    technical_assigned = set()
    human_assigned = set()
    
    # --- DETECT COURSE CATEGORY ---
    is_web = any(keyword in combined_text for keyword in ["web", "ui", "interface", "frontend", "react", "javascript"])
    is_backend = any(keyword in combined_text for keyword in ["server", "service", "api", "node"])
    is_db = any(keyword in combined_text for keyword in ["database", "data", "sql", "mining", "big data"])
    is_ml = any(keyword in combined_text for keyword in ["machine learning", "deep", "neural", "ai", "vision", "nlp"])
    is_systems = any(keyword in combined_text for keyword in ["operating", "systems", "parallel", "compiler", "assembly", "os"])
    is_security = any(keyword in combined_text for keyword in ["security", "cyber", "cryptography", "secure"])
    is_project = any(keyword in combined_text for keyword in ["project", "software engineering", "seminar", "capstone"])
    
    # --- ALWAYS ADD GIT (version control is universal) ---
    technical_assigned.add("Git")
    
    # --- CATEGORY-SPECIFIC MAPPINGS ---
    if is_web:
        technical_assigned.update(["JavaScript", "React", "Node.js", "Docker"])
        if is_db:
            technical_assigned.add("SQL")
    elif is_backend:
        technical_assigned.update(["Node.js", "Docker", "SQL", "AWS"])
    elif is_db:
        technical_assigned.update(["SQL", "Python", "AWS", "Docker"])
    elif is_ml:
        technical_assigned.update(["Python", "TensorFlow", "Docker", "AWS"])
        human_assigned.add("Self-learner")
    elif is_systems:
        technical_assigned.update(["C++", "Docker", "AWS"])
        technical_assigned.discard("Git")  # Re-add ensures consistency
        technical_assigned.add("Git")
    elif is_security:
        technical_assigned.update(["Docker", "AWS", "Python", "SQL"])
    else:
        # Default tech stack
        technical_assigned.update(["Python", "SQL", "Docker"])
    
    # Ensure we have 4-6 technical skills
    if len(technical_assigned) < 4:
        # Add common skills to reach minimum
        technical_assigned.update(["Python", "Git", "Docker"])
    
    # Trim to 4-6 (prefer to keep important ones)
    if len(technical_assigned) > 6:
        # Keep Git, Docker, and most relevant ones
        keep = ["Git", "Docker", "Python", "SQL"]
        to_keep = [s for s in keep if s in technical_assigned]
        # Add most specific ones
        others = [s for s in technical_assigned if s not in to_keep]
        technical_assigned = set(to_keep + others[:6-len(to_keep)])
    
    # --- HUMAN SKILLS ---
    human_assigned.add("Problem-solving")  # Universal for technical courses
    
    if is_project or "seminar" in combined_text or "capstone" in combined_text:
        human_assigned.update(["Teamwork", "Communication"])
    
    if is_ml or "research" in combined_text:
        human_assigned.add("Self-learner")
    
    if is_project:
        human_assigned.add("Leadership")
    
    # Ensure 2-3 human skills
    if len(human_assigned) < 2:
        human_assigned.add("Self-learner")
    if len(human_assigned) > 3:
        # Trim to 3, keeping Problem-solving
        keep = ["Problem-solving"]
        others = [s for s in human_assigned if s != "Problem-solving"]
        human_assigned = set(keep + others[:3-len(keep)])
    
    return list(technical_assigned), list(human_assigned)


# ============================================================================
# BACKFILL EXECUTION
# ============================================================================

def backfill_course_skills():
    """
    Idempotent backfill: map all courses to skills.
    - Creates new course_skills links
    - Never deletes existing links
    - Logs progress and summary
    """
    db = SessionLocal()
    
    try:
        # Load all courses and skills
        courses = db.query(models.Course).all()
        
        # Build skill lookup
        all_skills = db.query(models.Skill).all()
        skill_map = {skill.name: skill.id for skill in all_skills}
        
        print(f"\n{'='*70}")
        print(f"COURSE-SKILLS BACKFILL")
        print(f"{'='*70}")
        print(f"Found {len(courses)} courses and {len(all_skills)} skills")
        print(f"{'='*70}\n")
        
        total_links_added = 0
        course_samples = []
        
        for i, course in enumerate(courses, 1):
            # Get recommended skills for this course
            tech_skills, human_skills = categorize_course(
                course.name,
                course.description or ""
            )
            
            recommended_skills = tech_skills + human_skills
            links_added = 0
            skill_details = []
            
            for skill_name in recommended_skills:
                if skill_name not in skill_map:
                    print(f"  ⚠️  Skill '{skill_name}' not found in database for course '{course.name}'")
                    continue
                
                skill_id = skill_map[skill_name]
                skill = next((s for s in all_skills if s.id == skill_id), None)
                
                # Check if link already exists
                existing = db.query(models.CourseSkill).filter(
                    models.CourseSkill.course_id == course.id,
                    models.CourseSkill.skill_id == skill_id
                ).first()
                
                if not existing:
                    try:
                        new_link = models.CourseSkill(
                            course_id=course.id,
                            skill_id=skill_id,
                            relevance_score=None  # Could be computed later
                        )
                        db.add(new_link)
                        links_added += 1
                        total_links_added += 1
                    except IntegrityError:
                        db.rollback()
                        # Link already exists, skip
                        pass
                
                if skill:
                    skill_details.append(f"{skill_name} ({skill.type})")
            
            db.commit()
            
            # Log progress
            status = "✓" if links_added > 0 else "○"
            print(f"{status} [{i:3d}/{len(courses)}] {course.name[:50]:50s} → +{links_added} links")
            
            if len(course_samples) < 5:
                course_samples.append({
                    "course_id": course.id,
                    "course_name": course.name,
                    "skills": skill_details,
                    "links_added": links_added,
                })
        
        # Print summary
        print(f"\n{'='*70}")
        print(f"BACKFILL COMPLETE")
        print(f"{'='*70}")
        print(f"Total courses processed: {len(courses)}")
        print(f"Total links added:      {total_links_added}")
        print(f"{'='*70}\n")
        
        # Print sample
        print("SAMPLE COURSES WITH SKILLS:")
        print("-" * 70)
        for sample in course_samples:
            print(f"\n  Course {sample['course_id']}: {sample['course_name']}")
            print(f"  Links added: {sample['links_added']}")
            for skill in sample['skills']:
                print(f"    • {skill}")
        
        print(f"\n{'='*70}\n")
        
    except Exception as e:
        print(f"\n❌ Error during backfill: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    backfill_course_skills()
