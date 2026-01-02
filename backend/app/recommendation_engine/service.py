"""Core recommendation engine service.

Implements the course recommendation algorithm based on:
1. Role fit (career goal technical skills overlap)
2. Affinity (similarity to completed courses using clusters + tech skills)
3. Review quality (Bayesian smoothed scores)
"""

from . import config
from . import queries
from typing import List, Dict, Any, Tuple, Set
from sqlalchemy.orm import Session


def _compute_course_similarity(
    course_a_id: int,
    course_b_id: int,
    course_clusters_map: Dict[int, list],
    tech_skills_map: Dict[int, Set[int]],
) -> Tuple[float, bool, float]:
    """Compute similarity between two courses using clusters and technical skills.
    
    Args:
        course_a_id, course_b_id: Course IDs to compare
        course_clusters_map: Map of course_id -> list of cluster objects
        tech_skills_map: Map of course_id -> set of technical skill IDs
    
    Returns:
        (similarity_score, cluster_matched, tech_overlap_score)
        - similarity_score: alpha * cluster_match + (1-alpha) * tech_overlap [0..1]
        - cluster_matched: bool, whether they share a cluster
        - tech_overlap_score: Jaccard similarity on technical skills [0..1]
    """
    # Cluster match (binary)
    clusters_a = set(cl.id for cl in course_clusters_map.get(course_a_id, []))
    clusters_b = set(cl.id for cl in course_clusters_map.get(course_b_id, []))
    cluster_match = 1.0 if (clusters_a & clusters_b) else 0.0

    # Tech skills Jaccard similarity
    skills_a = tech_skills_map.get(course_a_id, set())
    skills_b = tech_skills_map.get(course_b_id, set())
    
    if not skills_a and not skills_b:
        tech_overlap_score = 0.0
    else:
        intersection = len(skills_a & skills_b)
        union = len(skills_a | skills_b)
        tech_overlap_score = intersection / union if union > 0 else 0.0

    # Blend using alpha
    similarity = config.ALPHA * cluster_match + (1 - config.ALPHA) * tech_overlap_score

    return similarity, bool(cluster_match), tech_overlap_score


def recommend_courses(
    db: Session,
    student_id: int,
    career_goal_id: int,
    k: int = 10,
    enforce_prereqs: bool = True,
) -> Dict[str, Any]:
    """Generate top-K course recommendations for a student based on career goal.
    
    Algorithm:
    1. Filter candidate courses (exclude completed, optionally enforce prereqs)
    2. Compute S_role: technical fit with career goal
    3. Compute S_affinity: similarity to completed courses (clusters + tech overlap)
    4. Compute soft_readiness: human skills overlap with goal
    5. Apply blocker: if R_human > 0 and overlap == 0, return empty
    6. Compute review quality with Bayesian smoothing
    7. Final score = w1*S_role + w2*S_affinity + w5*q_smoothed
    8. Return top K with full explainability
    
    Args:
        db: Database session
        student_id: Student ID
        career_goal_id: Career goal ID to recommend for
        k: Number of recommendations to return (default 10)
        enforce_prereqs: Whether to enforce prerequisites (default True)
    
    Returns:
        Dict with recommendations, soft_readiness, blocked_reason if applicable
    """
    # ===== BULK FETCH =====
    student = queries.get_student(db, student_id)
    if not student:
        raise ValueError("Student not found")

    all_courses = queries.get_all_courses(db)
    all_skills = queries.get_all_skills(db)
    
    # Maps for efficient lookup
    skill_map = {s.id: s.name for s in all_skills}
    skill_by_type = {'technical': set(), 'human': set()}
    for s in all_skills:
        if s.type in skill_by_type:
            skill_by_type[s.type].add(s.id)

    course_clusters_map = queries.get_course_clusters_map(db)
    course_tech_skills_map = queries.get_course_technical_skills_map(db)
    course_skills_rows = queries.get_all_course_skills(db)
    review_stats, global_mean = queries.get_course_review_stats(db)
    prereq_map = queries.get_course_prereqs(db)

    # Student state
    student_completed_ids = queries.get_student_completed_course_ids(db, student_id)
    student_human_skills = set(queries.get_student_human_skills(db, student_id))

    # Career goal required skills
    tech_ids, human_ids = queries.get_career_goal_skills(db, career_goal_id)
    R_tech = set(tech_ids)  # Required technical skills
    R_human = set(human_ids)  # Required human skills

    # ===== SOFT READINESS & BLOCKER LOGIC =====
    if not R_human:
        soft_readiness = 1.0
        overlap_human = []
        missing_human = []
        blocked_reason = None
    else:
        overlap_human_ids = R_human & student_human_skills
        missing_human_ids = R_human - student_human_skills
        soft_readiness = len(overlap_human_ids) / len(R_human) if R_human else 1.0
        
        overlap_human = [{'skill_id': sid, 'name': skill_map.get(sid, '')} for sid in overlap_human_ids]
        missing_human = [{'skill_id': sid, 'name': skill_map.get(sid, '')} for sid in missing_human_ids]
        
        # BLOCKER: If student has 0 overlap with required human skills
        if soft_readiness == 0:
            blocked_reason = "No overlap between student's human skills and required human skills for this goal"
            return {
                'soft_readiness': soft_readiness,
                'overlap_human_skills': overlap_human,
                'missing_human_skills': missing_human,
                'recommendations': [],
                'blocked_reason': blocked_reason,
                'blocked_courses': [] if enforce_prereqs else None,
            }

    # ===== CANDIDATE FILTERING =====
    candidate_courses = [c for c in all_courses if c.id not in student_completed_ids]

    blocked_courses = []
    if enforce_prereqs:
        filtered = []
        for c in candidate_courses:
            reqs = prereq_map.get(c.id, set())
            missing = [r for r in reqs if r not in student_completed_ids]
            if missing:
                blocked_courses.append({
                    'course_id': c.id,
                    'course_name': c.name,
                    'missing_prereqs': missing,
                })
            else:
                filtered.append(c)
        candidate_courses = filtered

    # ===== COMPUTE SCORES FOR EACH CANDIDATE =====
    results = []

    # Normalize review quality baseline
    C = (global_mean / 10.0) if global_mean is not None else 0.5

    # Build course_skills lookup map for efficiency
    course_skills_lookup = {}
    for course_id, skill_id, relevance in course_skills_rows:
        if course_id not in course_skills_lookup:
            course_skills_lookup[course_id] = {}
        course_skills_lookup[course_id][skill_id] = float(relevance) if relevance is not None else 0.0

    for c in candidate_courses:
        # ===== S_ROLE: Technical fit with career goal =====
        if not R_tech:
            s_role = 0.0
        else:
            scores = []
            for sid in R_tech:
                # Find relevance_score in course_skills for this skill
                relevance = course_skills_lookup.get(c.id, {}).get(sid, 0.0)
                scores.append(relevance)
            s_role = float(sum(scores) / len(scores)) if scores else 0.0

        # ===== S_AFFINITY: Course-to-course similarity =====
        if not student_completed_ids:
            s_affinity = 0.0
            affinity_details = []
        else:
            # Compute similarity to each completed course
            sims = []
            affinity_details_raw = []
            for completed_id in student_completed_ids:
                completed_course = next((co for co in all_courses if co.id == completed_id), None)
                if not completed_course:
                    continue
                
                sim, cluster_match, tech_overlap = _compute_course_similarity(
                    c.id, completed_id, course_clusters_map, course_tech_skills_map
                )
                sims.append((sim, completed_id, completed_course.name, cluster_match, tech_overlap))

            # Top K similarities
            if sims:
                sims_sorted = sorted(sims, key=lambda x: x[0], reverse=True)
                top_k = min(config.TOP_K_SIMILAR, len(sims_sorted))
                s_affinity = float(sum(s[0] for s in sims_sorted[:top_k]) / top_k)
                
                affinity_details = [
                    {
                        'completed_course_id': s[1],
                        'completed_course_name': s[2],
                        'similarity_score': s[0],
                        'cluster_matched': s[3],
                        'tech_overlap_score': s[4],
                    }
                    for s in sims_sorted[:top_k]
                ]
            else:
                s_affinity = 0.0
                affinity_details = []

        # ===== Q_SMOOTHED: Review quality with Bayesian smoothing =====
        stats = review_stats.get(c.id)
        if stats:
            n_reviews = stats['n']
            avg_raw = stats['avg']
            q_raw = (avg_raw / 10.0) if avg_raw is not None else C
        else:
            n_reviews = 0
            q_raw = C

        m = config.PRIOR_M
        q_smoothed = float((m * C + n_reviews * q_raw) / (m + n_reviews)) if (m + n_reviews) > 0 else C

        # ===== FINAL SCORE =====
        final_score = (config.W1 * s_role) + (config.W2 * s_affinity) + (config.W5 * q_smoothed)

        # ===== EXPLAINABILITY: Matched and missing technical skills =====
        matched_technical = []
        missing_technical = []
        for sid in R_tech:
            relevance = course_skills_lookup.get(c.id, {}).get(sid, 0.0)
            
            if relevance > 0:
                matched_technical.append({
                    'skill_id': sid,
                    'name': skill_map.get(sid, ''),
                    'relevance_score': relevance,
                })
            else:
                missing_technical.append(sid)

        # Raw average score
        avg_score_raw = stats['avg'] if stats and stats.get('avg') is not None else None

        results.append({
            'course_id': c.id,
            'name': c.name,
            'final_score': final_score,
            'breakdown': {
                's_role': s_role,
                's_affinity': s_affinity,
                'q_smoothed': q_smoothed,
            },
            'avg_score_raw': float(avg_score_raw) if avg_score_raw is not None else None,
            'review_count': n_reviews,
            'matched_technical_skills': matched_technical,
            'missing_technical_skills': missing_technical,
            'affinity_explanation': {
                'top_contributing_courses': affinity_details,
            } if affinity_details else None,
        })

    # ===== SORT & RETURN TOP K =====
    sorted_results = sorted(results, key=lambda x: x['final_score'], reverse=True)[:k]

    return {
        'soft_readiness': soft_readiness,
        'overlap_human_skills': overlap_human,
        'missing_human_skills': missing_human,
        'recommendations': sorted_results,
        'blocked_reason': None,
        'blocked_courses': blocked_courses if enforce_prereqs else None,
    }
