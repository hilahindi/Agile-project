/**
 * TypeScript types for course recommendation engine responses and requests.
 * Matches the backend Pydantic schemas.
 */

/** Basic skill information. */
export interface SkillInfo {
  skill_id: number;
  name: string;
}

/** Matched technical skill with relevance score. */
export interface SkillMatch extends SkillInfo {
  relevance_score: number;
}

/** Details about a completed course contributing to affinity. */
export interface AffinityExplanationDetail {
  completed_course_id: number;
  completed_course_name: string;
  similarity_score: number;
  cluster_matched: boolean;
  tech_overlap_score: number;
}

/** Explanation of how affinity was computed. */
export interface AffinityExplanation {
  top_contributing_courses: AffinityExplanationDetail[];
}

/** Breakdown of score components. */
export interface ScoreBreakdown {
  s_role: number;
  s_affinity: number;
  q_smoothed: number;
}

/** Single recommended course with full explainability. */
export interface CourseRecommendation {
  course_id: number;
  name: string;
  final_score: number;
  breakdown: ScoreBreakdown;
  avg_score_raw: number | null;
  review_count: number;
  matched_technical_skills: SkillMatch[];
  missing_technical_skills: number[];
  affinity_explanation: AffinityExplanation | null;
}

/** Blocked course due to missing prerequisites. */
export interface BlockedCourse {
  course_id: number;
  course_name: string;
  missing_prereqs: number[];
}

/** Full response from recommendation endpoints. */
export interface RecommendationsResponse {
  soft_readiness: number;
  overlap_human_skills: SkillInfo[];
  missing_human_skills: SkillInfo[];
  recommendations: CourseRecommendation[];
  blocked_reason: string | null;
  blocked_courses: BlockedCourse[] | null;
}

/** Query parameters for recommendation endpoints. */
export interface RecommendationParams {
  k?: number;
  enforce_prereqs?: boolean;
}
