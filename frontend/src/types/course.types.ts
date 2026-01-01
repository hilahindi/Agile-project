/**
 * types/course.types.ts
 * TypeScript type definitions for course-related data structures
 */

export interface PrerequisiteCourse {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  name: string;
  description?: string;
  workload?: number;
  credits?: number;
  status?: string;
  prerequisites: PrerequisiteCourse[];
  created_at: string;
}

export interface CourseStats {
  review_count: number;
  avg_final_score: number;
  avg_industry_relevance: number;
  avg_instructor_quality: number;
  avg_useful_learning: number;
}

export interface CourseReviewDetailed {
  id: number;
  course_id: number;
  student_id: number;
  final_score: number;
  created_at: string;
  student_name?: string;
  languages_learned?: string;
  course_outputs?: string;
  industry_relevance_text?: string;
  instructor_feedback?: string;
  useful_learning_text?: string;
  industry_relevance_rating: number;
  instructor_rating: number;
  useful_learning_rating: number;
}

export interface PaginatedCourseReviews {
  items: CourseReviewDetailed[];
  page: number;
  page_size: number;
  total: number;
}

export interface CourseDetailsPageState {
  course: Course | null;
  stats: CourseStats | null;
  reviews: PaginatedCourseReviews | null;
  loading: boolean;
  error: string | null;
}
