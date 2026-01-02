"""
Idempotent backfill script to map courses to skills using intelligent, domain-aware categorization.
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
# SKILL MAPPING HEURISTICS - Domain-Aware Course Categorization
# ============================================================================

# Predefined skill mappings for specific courses or course categories
COURSE_SKILL_MAPPINGS = {
    # Mathematics Courses
    "calculus": {
        "technical": ["Calculus", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "linear algebra": {
        "technical": ["Linear Algebra", "Discrete Mathematics"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "linear algebra 2": {
        "technical": ["Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "discrete mathematics": {
        "technical": ["Discrete Mathematics", "Computational Theory"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "probability": {
        "technical": ["Probability & Statistics", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "intro to probability": {
        "technical": ["Probability & Statistics"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "statistics": {
        "technical": ["Probability & Statistics", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "database systems": {
        "technical": ["SQL", "Database Design"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "machine learning": {
        "technical": ["Machine Learning", "Python", "Linear Algebra", "Probability & Statistics"],
        "human": ["Self-learner", "Problem-solving", "Critical Thinking"]
    },
    "analysis of algorithms": {
        "technical": ["Algorithms", "Computational Theory", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "advanced algorithms": {
        "technical": ["Algorithms", "Computational Theory", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "mathematical logic": {
        "technical": ["Mathematical Logic", "Discrete Mathematics", "Computational Theory"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    
    # Intro CS Courses
    "intro to computer science": {
        "technical": ["Python", "Data Structures", "Algorithms", "Software Design"],
        "human": ["Problem-solving", "Self-learner", "Teamwork"]
    },
    
    # Core Programming & Theory
    "object oriented programming": {
        "technical": ["Python", "C++", "Software Design", "Data Structures"],
        "human": ["Problem-solving", "Teamwork"]
    },
    "data structures": {
        "technical": ["Data Structures", "Algorithms", "Python"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "algorithms": {
        "technical": ["Algorithms", "Data Structures", "Computational Theory"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "analysis of algorithms": {
        "technical": ["Algorithms", "Computational Theory", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    
    # Systems & Low-Level
    "computer org": {
        "technical": ["Computer Architecture", "Operating Systems", "C++"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "assembly": {
        "technical": ["Computer Architecture", "Operating Systems", "C++"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "operating system": {
        "technical": ["Operating Systems", "Computer Architecture", "C++", "Parallel Programming"],
        "human": ["Problem-solving", "Teamwork"]
    },
    "system programming": {
        "technical": ["Operating Systems", "C++", "Computer Architecture"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "embedded": {
        "technical": ["Embedded Systems", "Computer Architecture", "C++"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    
    # Theory & Computation
    "computational models": {
        "technical": ["Computational Theory", "Discrete Mathematics", "Algorithms"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "automata": {
        "technical": ["Computational Theory", "Discrete Mathematics", "Mathematical Logic"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "compiler": {
        "technical": ["Compiler Design", "Computational Theory", "C++"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "parallel": {
        "technical": ["Parallel Programming", "Operating Systems", "C++"],
        "human": ["Problem-solving", "Teamwork"]
    },
    
    # Network & Communication
    "network": {
        "technical": ["Network Programming", "Computer Architecture"],
        "human": ["Problem-solving", "Teamwork"]
    },
    "communication": {
        "technical": ["Network Programming", "Algorithms"],
        "human": ["Problem-solving", "Communication"]
    },
    
    # Software Engineering & Design
    "software engineering": {
        "technical": ["Software Design", "Data Structures", "Testing & QA", "Agile Development"],
        "human": ["Teamwork", "Communication", "Leadership", "Problem-solving"]
    },
    "design": {
        "technical": ["Software Design", "Testing & QA"],
        "human": ["Teamwork", "Problem-solving", "Creativity"]
    },
    "testing": {
        "technical": ["Testing & QA", "Python", "Software Design"],
        "human": ["Problem-solving", "Attention to Detail"]
    },
    "agile": {
        "technical": ["Agile Development", "Testing & QA", "Git", "CI/CD"],
        "human": ["Teamwork", "Communication", "Adaptability", "Leadership"]
    },
    
    # Database
    "database": {
        "technical": ["SQL", "Database Design", "Data Structures"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "sql": {
        "technical": ["SQL", "Database Design"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "big data": {
        "technical": ["SQL", "Database Design", "Python", "Data Structures"],
        "human": ["Problem-solving", "Self-learner"]
    },
    
    # Web Development
    "web": {
        "technical": ["React", "JavaScript", "HTML/CSS", "Node.js", "SQL"],
        "human": ["Problem-solving", "Teamwork", "Creativity"]
    },
    "frontend": {
        "technical": ["React", "JavaScript", "HTML/CSS", "Software Design"],
        "human": ["Problem-solving", "Teamwork", "Creativity"]
    },
    "backend": {
        "technical": ["Node.js", "Python", "SQL", "Docker", "AWS"],
        "human": ["Problem-solving", "Teamwork"]
    },
    "ui": {
        "technical": ["React", "JavaScript", "HTML/CSS", "Computer Graphics"],
        "human": ["Teamwork", "Communication", "Creativity"]
    },
    "user interface": {
        "technical": ["React", "JavaScript", "HTML/CSS", "Software Design"],
        "human": ["Teamwork", "Communication", "Creativity"]
    },
    "ux": {
        "technical": ["React", "JavaScript", "HTML/CSS"],
        "human": ["Communication", "Creativity", "Problem-solving"]
    },
    "visual design": {
        "technical": ["HTML/CSS", "Computer Graphics"],
        "human": ["Creativity", "Communication"]
    },
    
    # AI & Machine Learning
    "machine learning": {
        "technical": ["Machine Learning", "Python", "Linear Algebra", "Probability & Statistics"],
        "human": ["Self-learner", "Problem-solving", "Critical Thinking"]
    },
    "deep learning": {
        "technical": ["TensorFlow", "PyTorch", "Python", "Linear Algebra"],
        "human": ["Self-learner", "Problem-solving", "Critical Thinking"]
    },
    "neural": {
        "technical": ["TensorFlow", "PyTorch", "Python", "Linear Algebra"],
        "human": ["Self-learner", "Problem-solving"]
    },
    "ai": {
        "technical": ["Python", "Algorithms", "Machine Learning"],
        "human": ["Problem-solving", "Self-learner"]
    },
    "natural language": {
        "technical": ["Python", "Machine Learning", "Discrete Mathematics"],
        "human": ["Problem-solving", "Self-learner"]
    },
    "vision": {
        "technical": ["Computer Vision", "Python", "Linear Algebra", "Machine Learning"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "game": {
        "technical": ["Python", "C++", "Algorithms", "Software Design"],
        "human": ["Teamwork", "Creativity", "Problem-solving"]
    },
    
    # Security
    "security": {
        "technical": ["Cryptography", "Network Security", "Python"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "cryptography": {
        "technical": ["Cryptography", "Linear Algebra", "Probability & Statistics"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "cyber": {
        "technical": ["Network Security", "Cryptography", "Operating Systems"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "secure coding": {
        "technical": ["Secure Coding", "Python", "Testing & QA"],
        "human": ["Problem-solving", "Attention to Detail"]
    },
    
    # Graphics & Vision
    "graphics": {
        "technical": ["Computer Graphics", "Linear Algebra", "C++"],
        "human": ["Creativity", "Problem-solving"]
    },
    
    # DevOps & Tools
    "devops": {
        "technical": ["Docker", "AWS", "Git", "CI/CD", "Linux"],
        "human": ["Teamwork", "Problem-solving"]
    },
    "docker": {
        "technical": ["Docker", "AWS", "Git"],
        "human": ["Problem-solving"]
    },
    "development tools": {
        "technical": ["Git", "Docker", "CI/CD"],
        "human": ["Problem-solving"]
    },
    
    # Projects & Seminars
    "project": {
        "technical": ["Software Design", "Data Structures", "Algorithms", "Testing & QA"],
        "human": ["Teamwork", "Communication", "Leadership", "Problem-solving"]
    },
    "seminar": {
        "technical": ["Software Design", "Algorithms"],
        "human": ["Communication", "Self-learner", "Teamwork"]
    },
    "capstone": {
        "technical": ["Software Design", "Data Structures", "Algorithms", "Testing & QA"],
        "human": ["Teamwork", "Communication", "Leadership"]
    },
    
    # Service Courses
    "operation research": {
        "technical": ["Linear Algebra", "Algorithms", "Probability & Statistics"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "stochastic": {
        "technical": ["Probability & Statistics", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "game theory": {
        "technical": ["Algorithms", "Probability & Statistics", "Linear Algebra"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "data mining": {
        "technical": ["SQL", "Python", "Machine Learning", "Database Design"],
        "human": ["Problem-solving", "Self-learner"]
    },
    "optimization": {
        "technical": ["Linear Algebra", "Algorithms", "Calculus"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
    "social networks": {
        "technical": ["Algorithms", "Data Structures", "Probability & Statistics"],
        "human": ["Problem-solving", "Critical Thinking"]
    },
}


def categorize_course(course_name: str, course_description: str) -> tuple[list[str], list[str]]:
    """
    Intelligently categorize a course and return realistic domain-specific skills.
    
    Uses predefined mappings for common course types, then falls back to keyword detection.
    
    Args:
        course_name: Name of the course
        course_description: Description of the course (may be None)
    
    Returns:
        (technical_skills, human_skills) - lists of skill names to assign
    """
    combined_text = (course_name + " " + (course_description or "")).lower()
    
    # Check for predefined mappings
    for keyword, skill_mapping in COURSE_SKILL_MAPPINGS.items():
        if keyword in combined_text:
            return skill_mapping["technical"], skill_mapping["human"]
    
    # Fallback: Basic keyword-based categorization
    technical_assigned = set()
    human_assigned = set()
    
    # Detect broader categories from the course
    is_math = any(word in combined_text for word in ["calculus", "algebra", "geometry", "probability", "statistics", "math"])
    is_theory = any(word in combined_text for word in ["theory", "model", "automata", "computation", "formal"])
    is_systems = any(word in combined_text for word in ["system", "operating", "architecture", "parallel", "embedded"])
    is_programming = any(word in combined_text for word in ["programming", "code", "language", "java", "python", "c++"])
    is_project = any(word in combined_text for word in ["project", "capstone", "seminar", "workshop"])
    
    # Mathematical courses
    if is_math:
        if "calculus" in combined_text:
            technical_assigned.update(["Calculus", "Linear Algebra"])
        elif "algebra" in combined_text:
            technical_assigned.update(["Linear Algebra", "Discrete Mathematics"])
        elif "probability" in combined_text or "statistics" in combined_text:
            technical_assigned.update(["Probability & Statistics", "Linear Algebra"])
        else:
            technical_assigned.update(["Calculus", "Linear Algebra"])
        human_assigned.update(["Problem-solving", "Critical Thinking"])
        return list(technical_assigned), list(human_assigned)
    
    # Theory courses
    if is_theory:
        technical_assigned.update(["Computational Theory", "Algorithms", "Discrete Mathematics"])
        human_assigned.update(["Problem-solving", "Critical Thinking"])
        return list(technical_assigned), list(human_assigned)
    
    # Systems courses
    if is_systems:
        technical_assigned.update(["Operating Systems", "Computer Architecture", "C++"])
        if "parallel" in combined_text:
            technical_assigned.add("Parallel Programming")
        human_assigned.update(["Problem-solving", "Critical Thinking"])
        return list(technical_assigned), list(human_assigned)
    
    # Programming courses
    if is_programming:
        technical_assigned.update(["Python", "Data Structures", "Algorithms", "Software Design"])
        human_assigned.update(["Problem-solving", "Teamwork"])
        return list(technical_assigned), list(human_assigned)
    
    # Project-based courses
    if is_project:
        technical_assigned.update(["Software Design", "Data Structures", "Algorithms"])
        human_assigned.update(["Teamwork", "Communication", "Problem-solving"])
        if "seminar" in combined_text or "research" in combined_text:
            human_assigned.add("Self-learner")
        return list(technical_assigned), list(human_assigned)
    
    # Default for courses we don't recognize
    technical_assigned.update(["Python", "Data Structures", "Algorithms"])
    human_assigned.update(["Problem-solving", "Teamwork"])
    
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
                            relevance_score=1.0  # Default relevance for all links
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
