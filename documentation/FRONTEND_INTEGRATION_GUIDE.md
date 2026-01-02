# Frontend Integration Guide - Backend Schema Changes

## What Changed for Frontend Developers

The backend database schema has been refactored from array-based fields to proper relational modeling. **The API response format remains mostly the same**, but with some enhancements.

---

## Student Object - Before & After

### Before (Old Array-Based Schema)
```json
{
  "id": 1,
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 2,
  "hashed_password": "...",
  "courses_taken": [10016, 10117, 10208],
  "career_goals": ["Backend Developer"],
  "human_skills": [1, 3, 5],
  "created_at": "2024-01-15T10:30:00"
}
```

### After (New Relational Schema)
```json
{
  "id": 1,
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "career_goal": {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs."
  },
  "human_skill_ids": [1, 3, 5],
  "courses_taken": [10016, 10117, 10208],
  "created_at": "2024-01-15T10:30:00"
}
```

---

## Breaking Changes (Minimum Updates Needed)

### 1. Career Goals Field Changed

**Old:**
```javascript
student.career_goals      // Array of strings: ["Backend Developer", ...]
```

**New:**
```javascript
student.career_goal_id     // Single integer: 1
student.career_goal        // Full object with id, name, description
student.career_goal?.name  // Access name via relationship
```

**Update Code:**
```javascript
// OLD CODE
const goal = student.career_goals[0];

// NEW CODE
const goal = student.career_goal?.name;
// OR to get the full object
const goalObj = student.career_goal;
```

### 2. Human Skills Field Renamed

**Old:**
```javascript
student.human_skills       // Array of integers: [1, 3, 5]
```

**New:**
```javascript
student.human_skill_ids    // Array of integers: [1, 3, 5] - SAME VALUES
```

**Update Code:**
```javascript
// OLD CODE
const skillIds = student.human_skills;

// NEW CODE
const skillIds = student.human_skill_ids;
```

### 3. Courses Taken (No change in format)

```javascript
// Still works the same way!
student.courses_taken      // Array of integers: [10016, 10117, 10208]
```

✅ **No updates needed** - already compatible with new schema

---

## Request Format Changes

### Registration Request

**Old:**
```json
{
  "name": "john_doe",
  "password": "securepass123",
  "faculty": "Computer Science",
  "year": 2,
  "career_goals": ["Backend Developer"],
  "human_skills": [1, 3, 5],
  "courses_taken": []
}
```

**New:**
```json
{
  "name": "john_doe",
  "password": "securepass123",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "human_skill_ids": [1, 3, 5]
}
```

**Update Frontend Code:**

```javascript
// OLD
const registerUser = async (formData) => {
  const response = await fetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: formData.name,
      password: formData.password,
      faculty: formData.faculty,
      year: formData.year,
      career_goals: [selectedCareerGoal],  // CHANGE THIS
      human_skills: selectedSkillIds,      // CHANGE THIS
      courses_taken: []
    })
  });
  return response.json();
};

// NEW
const registerUser = async (formData) => {
  const response = await fetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: formData.name,
      password: formData.password,
      faculty: formData.faculty,
      year: formData.year,
      career_goal_id: selectedCareerGoalId,      // NOW AN ID
      human_skill_ids: selectedSkillIds           // RENAMED
    })
  });
  return response.json();
};
```

### Update Profile Request

**Old:**
```json
{
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 3,
  "career_goals": ["Full Stack Developer"],
  "human_skills": [1, 2, 3, 4]
}
```

**New:**
```json
{
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 3,
  "career_goal_id": 2,
  "human_skill_ids": [1, 2, 3, 4]
}
```

---

## Frontend Files That Need Updates

### 1. **authService.js** - Update Registration

```javascript
// Location: frontend/src/services/authService.js

export const register = async (name, password, faculty, year, careerGoalId, humanSkillIds) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      password,
      faculty,
      year,
      career_goal_id: careerGoalId,    // CHANGED: was career_goals (array)
      human_skill_ids: humanSkillIds    // CHANGED: was human_skills
    })
  });
  
  if (!response.ok) throw new Error('Registration failed');
  return response.json();
};
```

### 2. **ProfileSetup.jsx** - Update Registration Form

```javascript
// Location: frontend/src/components/ProfileSetup.jsx

const handleSubmit = async () => {
  try {
    const userData = {
      name: formData.name,
      password: formData.password,
      faculty: selectedFaculty,
      year: selectedYear,
      career_goal_id: selectedCareerGoal,      // CHANGED: was career_goals (array of strings)
      human_skill_ids: selectedHumanSkills      // CHANGED: was human_skills (same format)
    };
    
    const response = await register(
      userData.name,
      userData.password,
      userData.faculty,
      userData.year,
      userData.career_goal_id,     // Pass ID instead of name
      userData.human_skill_ids
    );
    
    // Response now includes career_goal object
    if (response.career_goal) {
      setSelectedCareerGoal(response.career_goal.id);
    }
  } catch (error) {
    setError(error.message);
  }
};
```

### 3. **ProfilePage.jsx** - Update Profile Display & Editing

```javascript
// Location: frontend/src/components/ProfilePage.jsx

useEffect(() => {
  if (profile) {
    setFormData({
      name: profile.name,
      faculty: profile.faculty,
      year: profile.year,
      career_goal_id: profile.career_goal_id,        // CHANGED: was career_goals
      human_skill_ids: profile.human_skill_ids,      // CHANGED: was human_skills
      courses_taken: profile.courses_taken           // No change needed
    });
  }
}, [profile]);

// Display career goal
<div>
  <label>Career Goal</label>
  <p>{profile.career_goal?.name}</p>  {/* Access via relationship */}
  {editMode && (
    <select 
      value={formData.career_goal_id}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        career_goal_id: parseInt(e.target.value)
      }))}
    >
      {careerGoals.map(goal => (
        <option key={goal.id} value={goal.id}>{goal.name}</option>
      ))}
    </select>
  )}
</div>

// Update human skills
const handleSkillToggle = (skillId) => {
  setFormData(prev => ({
    ...prev,
    human_skill_ids: prev.human_skill_ids.includes(skillId)
      ? prev.human_skill_ids.filter(id => id !== skillId)
      : [...prev.human_skill_ids, skillId]
  }));
};
```

---

## API Response Examples

### GET /students/{id}

**Response:**
```json
{
  "id": 1,
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "career_goal": {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs."
  },
  "human_skill_ids": [1, 3, 5],
  "courses_taken": [10016, 10117, 10208],
  "created_at": "2024-01-15T10:30:00"
}
```

**JavaScript Usage:**
```javascript
const student = await fetchStudent(1);

// Access career goal
console.log(student.career_goal.name);        // "Backend Developer"

// Access skills (IDs only)
console.log(student.human_skill_ids);         // [1, 3, 5]

// Access courses
console.log(student.courses_taken);           // [10016, 10117, 10208]
```

### GET /career-goals/

**Response:**
```json
[
  {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs.",
    "technical_skills": ["Python", "SQL", "Node.js", "Git"],
    "human_skills": ["Teamwork", "Problem-solving"]
  },
  {
    "id": 2,
    "name": "Frontend Developer",
    "description": "Develops the user interface of apps.",
    "technical_skills": ["JavaScript", "React", "Git"],
    "human_skills": ["Communication", "Adaptability"]
  }
]
```

**JavaScript Usage:**
```javascript
const careerGoals = await fetch('/career-goals/').then(r => r.json());

// Create dropdown options
careerGoals.map(goal => ({
  label: goal.name,
  value: goal.id,          // Use ID for value
  description: goal.description
}));
```

---

## Quick Migration Checklist

- [ ] Update `authService.js` - Change request format for registration
- [ ] Update `ProfileSetup.jsx` - Change form submission to use `career_goal_id`
- [ ] Update `ProfilePage.jsx` - Change display/edit of career goal
- [ ] Update form data storage - Rename `career_goals` to `career_goal_id`
- [ ] Update API calls - Pass ID instead of name for career goal
- [ ] Update display code - Use `profile.career_goal?.name` instead of array
- [ ] Test registration flow
- [ ] Test profile display
- [ ] Test profile editing
- [ ] Test course selection (should work unchanged)
- [ ] Test skill selection (renamed field, same values)

---

## No Changes Required For

✅ **Courses** - Format unchanged
- Still request with: `courses_taken: [id1, id2, ...]`
- Still receive with: `courses_taken: [id1, id2, ...]`

✅ **Login/Authentication** - No changes needed
- Token generation unchanged
- Protected endpoints unchanged

✅ **Course listing** - No changes needed
- `/courses/` endpoint unchanged
- Course details endpoint unchanged

---

## Example: Complete Migration

### Before: ProfileSetup.jsx
```javascript
const handleSubmit = async () => {
  const userData = {
    name: formData.name,
    password: formData.password,
    faculty: selectedFaculty,
    year: selectedYear,
    career_goals: [selectedCareerGoal],      // OLD: Array of strings
    human_skills: selectedHumanSkills,       // OLD: Array of IDs
    courses_taken: []
  };
  
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const user = await response.json();
  setUser(user);
};
```

### After: ProfileSetup.jsx
```javascript
const handleSubmit = async () => {
  const userData = {
    name: formData.name,
    password: formData.password,
    faculty: selectedFaculty,
    year: selectedYear,
    career_goal_id: selectedCareerGoal,      // NEW: Single ID
    human_skill_ids: selectedHumanSkills     // RENAMED: Array of IDs (same format)
  };
  
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const user = await response.json();
  setUser(user);
};
```

---

## Testing the Changes

### Manual Testing

```bash
# 1. Register new user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "testuser",
    "password": "test123",
    "faculty": "CS",
    "year": 2,
    "career_goal_id": 1,
    "human_skill_ids": [1, 2, 3]
  }'

# 2. Check response format
# Should include career_goal object, not career_goals array
# Should include human_skill_ids (not human_skills)
# Should include courses_taken as empty array
```

### Automated Tests (Frontend)

```javascript
// tests/auth.test.js
describe('Authentication', () => {
  it('should register with career_goal_id instead of career_goals', async () => {
    const result = await register(
      'testuser',
      'password',
      'CS',
      2,
      1,           // career_goal_id (was array)
      [1, 2, 3]    // human_skill_ids (was called human_skills)
    );
    
    expect(result.career_goal_id).toBe(1);
    expect(result.career_goal.name).toBeDefined();
    expect(result.human_skill_ids).toEqual([1, 2, 3]);
  });
});
```

---

## Backward Compatibility Notes

**The API remains mostly compatible:**
- ✅ Response still includes `courses_taken` as array of IDs
- ✅ User can still update courses the same way
- ⚠️ Career goal format changed (array → single ID + object)
- ⚠️ Field name changed (human_skills → human_skill_ids)

---

## Support Resources

1. **See latest API docs:** `http://localhost:8000/docs` (Swagger UI)
2. **Database Schema Details:** `DATABASE_REFACTORING_GUIDE.md`
3. **Implementation Details:** `SCHEMA_REFACTOR_SUMMARY.md`
4. **Running Application:** `RUNNING_APPLICATION.md`

---

## Questions?

If any component doesn't work as expected:

1. Check the response format from the API (`/docs` page)
2. Verify request body matches new format (career_goal_id, human_skill_ids)
3. Check browser console for errors
4. Verify career_goal object is not null before accessing `.name`

The backend is ready. Frontend updates are straightforward and listed above.
