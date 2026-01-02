# Course Recommendation Engine - Implementation Summary

## Overview
A complete course recommendation engine has been implemented for the full-stack web application. The engine uses a sophisticated algorithm combining three scoring dimensions to personalize course recommendations for students based on their selected career goals.

## Backend Implementation

### Algorithm Summary (Spec Compliance)

The recommendation engine computes a final score for each course using the formula:
```
final_score = w1*S_role + w2*S_affinity + w5*q_smoothed
```

Where:
- **S_role** (w1=0.60): Technical fit with career goal skills
- **S_affinity** (w2=0.20): Similarity to completed courses (clusters + Jaccard tech overlap)
- **q_smoothed** (w5=0.20): Bayesian-smoothed review quality

### Key Features Implemented

#### 1. **Role-Based Technical Fit (S_role)**
- Computes average relevance of required technical skills
- Missing skills treated as 0 relevance
- Returns 0 if goal has no required technical skills

#### 2. **Course Affinity (S_affinity)** ✨ *Updated from spec*
- **NOT cosine similarity** (previous implementation)
- **NEW: Cluster + Jaccard approach**
  - `cluster_match`: Binary (1 if courses share cluster, else 0)
  - `tech_overlap_score`: Jaccard similarity on technical skills
  - Combined: `sim = ALPHA * cluster_match + (1-ALPHA) * tech_overlap`
  - Default: ALPHA = 0.6 (clusters are stronger signal)

For each candidate course, computes similarity to completed courses:
- Takes top K=3 similarities
- Averages them for final S_affinity
- If no completed courses: S_affinity = 0

#### 3. **Review Quality Smoothing (q_smoothed)**
- Bayesian smoothing prevents single high review from dominating
- Formula: `q_smoothed = (m*C + n_reviews*q_raw) / (m + n_reviews)`
  - m = 5 (prior strength)
  - C = global mean review score
  - q_raw = course average (normalized by 10)

#### 4. **Soft Readiness with Blocker** ✨ *Updated from spec*
- Computes human skills overlap with goal: `overlap / required_skills`
- **BLOCKER RULE**: If required_human_skills > 0 AND overlap == 0:
  - Returns empty recommendations list
  - Returns `blocked_reason` in response
  - Returns lists of missing/required skills for frontend guidance
- Does NOT add soft_readiness to final score (it's metadata only)

#### 5. **Candidate Filtering**
- Excludes already-completed courses
- Optional prerequisite enforcement
- Returns blocked courses list when enforced

#### 6. **Explainability** ✨
For each recommendation, returns:
- **breakdown**: Individual component scores (s_role, s_affinity, q_smoothed)
- **matched_technical_skills**: Required skills present in course with relevance scores
- **missing_technical_skills**: Required skills absent from course
- **affinity_explanation**: Top contributing completed courses with:
  - Similarity score
  - Whether clusters matched
  - Jaccard tech overlap score
- **Response-level fields**: soft_readiness, overlap/missing human skills, blocked_reason

### File Structure

```
backend/app/recommendation_engine/
├── __init__.py           # Package initialization
├── config.py             # Weights, alphas, constants
├── queries.py            # Bulk data fetchers (no N+1)
├── service.py            # Core algorithm implementation
├── schemas.py            # Pydantic response schemas
├── router.py             # FastAPI endpoints
└── tests/
    ├── dev_script.py     # Comprehensive test suite
    └── populate_test_data.py
```

### Configuration (config.py)

```python
W1 = 0.60   # Role (career fit)
W2 = 0.20   # Affinity (course similarity)
W5 = 0.20   # Review quality

ALPHA = 0.6         # Cluster weight in similarity
TOP_K_SIMILAR = 3   # Top K completed courses for affinity
PRIOR_M = 5         # Prior strength for smoothing
```

### Endpoints

1. **GET /recommendations/courses**
   - Auth required (current student)
   - Query params: `k` (default 10), `enforce_prereqs` (default true)
   - Uses student's career_goal_id
   - Returns full RecommendationsResponse

2. **GET /recommendations/courses/for-goal/{career_goal_id}**
   - Auth required
   - Get recommendations for specific goal
   - Same response structure

### Supporting Endpoints (Verified/Created)

- ✅ GET /career-goals - Returns goals with descriptions and skills
- ✅ GET /skills?type=human|technical - Returns filterable skills
- ✅ GET /students/me - **NEW** - Returns current student profile with career_goal_id
- ✅ GET /courses - Returns basic course info

### Database Access Optimizations

All queries are bulk-fetched to avoid N+1:
- Career goal skills (technical + human)
- Student completed course IDs
- Student human skills
- Course technical skills (filtered by type='technical')
- Course clusters
- Course review stats (count, avg) + global mean
- Course prerequisites
- Skill name mapping

Total: ~7-8 database queries per recommendation request

### Response Schema (RecommendationsResponse)

```typescript
{
  soft_readiness: number,           // [0..1]
  overlap_human_skills: SkillInfo[],
  missing_human_skills: SkillInfo[],
  recommendations: CourseRecommendation[],
  blocked_reason: string | null,
  blocked_courses: BlockedCourse[] | null
}
```

## Frontend Implementation

### Component: MostRecommendedCourses.jsx

**Location**: `frontend/src/components/MostRecommendedCourses.jsx`

**Features**:
1. ✅ Fetches recommendations on mount
2. ✅ Displays in responsive table format
3. ✅ Expandable rows for detailed explanations
4. ✅ Handles all edge cases:
   - Not logged in
   - No career goal set
   - Blocked by soft blocker (zero human skills overlap)
   - No recommendations available
   - Loading/error states

**Table Columns**:
- Rank (#)
- Course Name (clickable link to course details)
- Final Score (0-10 scale, 2 decimals)
- Avg Review Score + Count (e.g., "8.8 (12)")
- Career Fit (s_role, 2 decimals)
- Affinity (s_affinity, 2 decimals)
- Quality (q_smoothed, 2 decimals)
- Details button (expand for explainability)

**Expandable Details Show**:
- ✅ Matched technical skills with relevance scores (green chips)
- ✅ Missing technical skills (red chips)
- ✅ Goal alignment: soft_readiness % + student's human skills
- ✅ Affinity explanation:
  - Top contributing completed courses
  - Similarity score
  - Whether clusters matched
  - Jaccard tech overlap score
- ✅ "No affinity data" message if no completed courses

**Empty States**:
- **Blocked**: Shows blocked_reason, missing skills list, + CTA to update profile
- **No recommendations**: Shows friendly message + CTA to complete profile
- **Not logged in**: Shows login prompt

**Styling**:
- Material-UI components (Chip, Stack, Table, etc.)
- Responsive design
- Consistent with existing dashboard
- Icon animations (expand/collapse)
- Color coding: green (matched), red (missing)

### TypeScript Types (recommendation.types.ts)

**Location**: `frontend/src/types/recommendation.types.ts`

Complete type definitions matching backend schemas:
- `CourseRecommendation`
- `AffinityExplanation` + `AffinityExplanationDetail`
- `ScoreBreakdown`
- `RecommendationsResponse`
- `BlockedCourse`
- `SkillInfo`, `SkillMatch`

### Service Client (recommendationService.js)

**Existing** - Updated for new response schema:
- `getCourseRecommendations(params)` - Handles auth headers, error parsing

## Testing & Validation

### Backend Test Suite (dev_script.py)

Run with: `python -m backend.app.recommendation_engine.tests.dev_script`

**Tests Included**:
1. ✅ Smoothing formula correctness
2. ✅ soft_readiness = 1.0 when no human skills required
3. ✅ Blocker triggers when overlap = 0
4. ✅ Similarity calculation (clusters + Jaccard, not cosine)
5. ✅ Prerequisite enforcement
6. ✅ Final score ordering (descending)
7. ✅ Example recommendation for sample student

**Output**: Prints test results and example recommendations

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Backend endpoints return deterministic results | ✅ | service.py, tests |
| If overlap = 0 with required human skills, recommendations empty + blocked_reason | ✅ | service.py line ~128-135 |
| Affinity uses cluster match + Jaccard | ✅ | `_compute_course_similarity()` |
| Dashboard shows recommendations section | ✅ | MostRecommendedCourses.jsx |
| Explainability UI works (expand/modal) | ✅ | Collapse component shows all details |
| No N+1 queries | ✅ | Bulk fetch in service.py |
| Follows project conventions | ✅ | Code style, naming, structure |

## Important Notes & Gotchas

### 1. Student Human Skills
- Stored in `student_human_skills` junction table
- Queried via raw SQL (not ORM model - it's a Table, not Model)
- See `queries.py: get_student_human_skills()`

### 2. Technical Skills Filter
- Only courses with `skill.type='technical'` contribute to affinity
- Query uses JOIN with Skills table to filter
- See `queries.py: get_course_technical_skills_map()`

### 3. Soft Readiness NOT in Final Score
- It's a response-level metadata field only
- Used as a blocker (= 0) or for explainability (0 < x < 1)
- NOT additive in final score calculation

### 4. Clusters in Affinity
- Clusters are NOT a goal-level boost (removed old S_cluster)
- Clusters are course-to-course similarity signals
- Inferred clusters concept (from old spec) is NOT used

### 5. Review Quality Baseline
- If NO reviews exist for a course: q_smoothed = global_mean
- Global mean computed from ALL CourseReview.final_score entries
- Prevents bias toward unreviewed courses

### 6. Missing Prerequisites
- Returned in `blocked_courses` list with course_name + missing_prereq_ids
- Useful for frontend to show which courses to complete first
- Only when `enforce_prereqs=True`

## Future Enhancements

Possible improvements (out of scope for this release):
- A/B testing recommendation weights
- ML-based weight optimization
- Learning path suggestions (prerequisite chains)
- Diversity adjustment (don't recommend same cluster repeatedly)
- Time-to-completion estimates
- Skill gap analysis with learning resources

---

**Implementation Date**: January 2026  
**Status**: ✅ Complete & Tested  
**Code Review**: Pending QA
