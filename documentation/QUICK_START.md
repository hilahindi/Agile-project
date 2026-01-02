# Quick Start Guide - Course Recommendation Engine

## Running the Backend

### Start the API Server
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`
Docs at: `http://localhost:8000/docs`

### Test the Recommendations Engine
```bash
cd backend
python -m app.recommendation_engine.tests.dev_script
```

This will:
- Test smoothing formula correctness
- Verify soft_readiness = 1.0 (no human skills required)
- Check blocker triggers correctly
- Validate similarity calculation (clusters + Jaccard)
- Verify prerequisite enforcement
- Confirm score ordering
- Show example recommendations for a sample student

### Key Endpoints to Test

#### Get Recommendations (Current Student)
```bash
curl -X GET "http://localhost:8000/recommendations/courses?k=10&enforce_prereqs=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Recommendations (Specific Goal)
```bash
curl -X GET "http://localhost:8000/recommendations/courses/for-goal/1?k=5&enforce_prereqs=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Current Student Info
```bash
curl -X GET "http://localhost:8000/students/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Running the Frontend

### Start the React App
```bash
cd frontend
npm install
npm start
```

App will open at: `http://localhost:3000`

### View Recommendations
1. Log in with a student account
2. Ensure student has:
   - Career goal selected
   - Some human skills added
   - Some completed courses (for affinity)
3. Navigate to Dashboard
4. Scroll to "Most Recommended Courses" section
5. Click "Details" to expand explanations

### Test Different Scenarios

#### Scenario 1: No Career Goal
- Create new student without career goal
- Navigate to Dashboard
- Should see: "Complete your profile" message

#### Scenario 2: Soft Blocker (Zero Skill Overlap)
- Student has career goal with required human skills
- Student has NO human skills
- Navigate to Dashboard
- Should see: "No overlap" blocker message + CTA

#### Scenario 3: Normal Recommendations
- Student has career goal + human skills + completed courses
- Navigate to Dashboard
- Should see: Table of 5-10 recommendations ranked by final score

#### Scenario 4: Affinity Explanation
- Expand a course row (click Details button)
- Should see:
  - Matched technical skills with relevance scores
  - Missing technical skills (if any)
  - Goal alignment & soft readiness
  - Top completed courses contributing to affinity

## Database Setup (If Needed)

### Create Test Data
```bash
cd backend
python -m app.seed_data
```

Or use the test data population script:
```bash
python -m app.recommendation_engine.tests.populate_test_data
```

### Manual Database Testing
```bash
# Connect to PostgreSQL
psql -U postgres -d agile_db

# Check career goals
SELECT id, name, description FROM career_goals LIMIT 5;

# Check a student's skills
SELECT s.id, s.name, s.type
FROM skills s
INNER JOIN student_human_skills shs ON s.id = shs.skill_id
WHERE shs.student_id = 1;

# Check completed courses for a student
SELECT c.id, c.name
FROM courses c
INNER JOIN student_courses sc ON c.id = sc.course_id
WHERE sc.student_id = 1 AND sc.status = 'completed';
```

## Debugging

### Enable SQL Logging
In `backend/app/database.py`, enable echo:
```python
engine = create_engine(DATABASE_URL, echo=True)  # Will print SQL queries
```

### Check Response Format
Use the FastAPI docs at `http://localhost:8000/docs`
- Try out endpoints directly
- See request/response schemas
- Get example payloads

### Common Issues

**Issue**: "Student has no career goal set"
- **Fix**: Set career_goal_id in student record
- **SQL**: `UPDATE students SET career_goal_id = 1 WHERE id = YOUR_STUDENT_ID;`

**Issue**: No recommendations appear
- **Possible causes**:
  1. Student has no completed courses (S_affinity = 0 for all)
  2. Soft blocker triggered (zero human skills overlap)
  3. All candidate courses blocked by missing prerequisites
- **Check**: Run test script, look for blocked_reason in response

**Issue**: Recommendations seem wrong
- **Debug**: Check the breakdown scores in the expanded view
  - S_role too low? Goal skills don't match course
  - S_affinity too low? No completed similar courses
  - Q_smoothed too low? Few or low reviews for course

## Files to Know

### Backend Algorithm
- `backend/app/recommendation_engine/service.py` - Main algorithm (300+ lines)
- `backend/app/recommendation_engine/config.py` - Tuneable constants
- `backend/app/recommendation_engine/queries.py` - Database helpers
- `backend/app/recommendation_engine/schemas.py` - Response schemas

### Frontend Component
- `frontend/src/components/MostRecommendedCourses.jsx` - Main component (400 lines)
- `frontend/src/types/recommendation.types.ts` - TypeScript types
- `frontend/src/services/recommendationService.js` - API client

### Documentation
- `COMPLETION_SUMMARY.md` - This is what was delivered
- `RECOMMENDATION_ENGINE_IMPLEMENTATION.md` - Technical deep dive
- `IMPLEMENTATION_CHECKLIST.md` - Detailed requirements checklist

## Configuration

### Algorithm Weights (Tuneable)
File: `backend/app/recommendation_engine/config.py`

```python
W1 = 0.60   # Role (career fit) - increase for goal alignment
W2 = 0.20   # Affinity (personalization) - increase for course similarity
W5 = 0.20   # Quality (reviews) - increase to trust reviews more

ALPHA = 0.6         # Cluster weight (0.6 = clusters 60%, tech skills 40%)
TOP_K_SIMILAR = 3   # Number of completed courses to compare
PRIOR_M = 5         # Smoothing prior strength (higher = trust global mean more)
```

To adjust:
1. Edit `config.py`
2. Restart backend
3. Test with same student to see different ranking

## Performance Notes

### Query Count
- ~8 database queries per recommendation request
- Bulk fetching prevents N+1 queries
- No caching implemented (can add if needed)

### Response Time
- Target: < 500ms
- With 60-70 courses: typically 50-200ms
- In-memory similarity computation (no FAISS or ML models)

### Scalability
- Current approach scales to ~100 courses efficiently
- Beyond 1000 courses, consider:
  - Caching completed/recommended sets
  - Async computation
  - Vector database (FAISS, Pinecone, etc.)

## Testing Checklist

Run through these to verify the system:

- [ ] Backend starts without errors
- [ ] Frontend loads and shows Dashboard
- [ ] Test script runs all 6 test scenarios
- [ ] Log in with student account
- [ ] See MostRecommendedCourses section
- [ ] Table displays courses with scores
- [ ] Click course name → navigates to course detail
- [ ] Click Details button → shows explainability
- [ ] Matched skills show with green chips
- [ ] Missing skills show with red chips
- [ ] Affinity explanation shows top courses
- [ ] Refresh button re-fetches data
- [ ] Test blocker scenario (no skill overlap)
- [ ] Test empty state (no career goal)
- [ ] Check browser network tab → /recommendations/courses API called
- [ ] Verify auth token sent in headers

## Support & Questions

If you encounter issues:

1. **Check the test script output** first: `dev_script.py`
2. **Review the explainability** in the UI (click Details)
3. **Look at the breakdown scores** - understand why each course ranked
4. **Check the database** - verify student has goal, skills, completed courses
5. **Read the documentation** - RECOMMENDATION_ENGINE_IMPLEMENTATION.md

---

**Version**: 1.0
**Status**: Ready for QA & Integration Testing
**Last Updated**: January 2026
