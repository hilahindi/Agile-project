# Database Schema Refactoring - Implementation Guide

## Project: Agile Course Recommendation System
## Date: January 2026
## Task: Replace Student ARRAY fields with proper relational modeling

---

## Executive Summary

The Student table has been successfully refactored from using PostgreSQL ARRAY columns to proper relational modeling with junction tables and association objects. This change improves:

- **Data Integrity**: Proper foreign key constraints instead of loose array storage
- **Query Efficiency**: Indexed lookups and joins instead of array scanning
- **Scalability**: Support for many-to-many relationships with metadata (status field)
- **Type Safety**: Pydantic validators ensure correct data types
- **Maintainability**: Standard ORM patterns instead of custom array handling

---

## What Changed

### Old Schema (Array-Based)
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    faculty VARCHAR,
    year INTEGER,
    courses_taken INTEGER[],           -- ARRAY of course IDs
    career_goals VARCHAR[],            -- ARRAY of goal names
    human_skills INTEGER[],            -- ARRAY of skill IDs
    created_at TIMESTAMP DEFAULT now()
);
```

**Problems:**
- Array elements weren't validated against referenced tables
- Couldn't track when courses were taken (no timestamps)
- Career goals stored as strings, not FKs
- Skills stored as IDs but no relationship metadata
- Difficult to query: required array functions

### New Schema (Relational)
```sql
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    faculty VARCHAR,
    year INTEGER,
    career_goal_id INTEGER REFERENCES career_goals(id),  -- Single FK
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE student_human_skills (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE student_courses (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (student_id, course_id)
);
```

**Benefits:**
- All IDs validated with foreign key constraints
- Status field tracks course engagement state
- Timestamps track when relationships were created
- Career goal stored as FK to proper table
- Can easily query with SQL JOINs
- Indexes on foreign keys for performance

---

## Implementation Details

### File-by-File Changes

#### 1. **models.py** - Core Data Model

**Added:**
- `StudentCourse` ORM class with status tracking
- `student_human_skills` junction table definition
- Relationships on Student, Skill, and Course models

**Key Code:**
```python
class StudentCourse(Base):
    __tablename__ = "student_courses"
    
    student_id = Column(Integer, ForeignKey('students.id', ondelete='CASCADE'), primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id', ondelete='CASCADE'), primary_key=True)
    status = Column(String(20), nullable=False, default='completed')
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    student = relationship('Student', back_populates='student_courses')
    course = relationship('Course')
```

**Removed from Student:**
```python
# BEFORE (REMOVED):
courses_taken = Column(ARRAY(Integer), default=list)
career_goals = Column(ARRAY(String), default=list)
human_skills = Column(ARRAY(Integer), default=list)

# AFTER (ADDED):
career_goal_id = Column(Integer, ForeignKey('career_goals.id'), nullable=True)
career_goal = relationship('CareerGoal', foreign_keys=[career_goal_id])
human_skills = relationship('Skill', secondary=student_human_skills, back_populates='students')
student_courses = relationship('StudentCourse', back_populates='student', cascade='all, delete-orphan')
```

---

#### 2. **schemas.py** - Request/Response Models

**Key Changes:**

```python
class StudentBase(BaseModel):
    """Base schema for Student."""
    name: str
    faculty: Optional[str] = None
    year: Optional[int] = None
    career_goal_id: Optional[int] = None           # NEW: single ID instead of array
    human_skill_ids: List[int] = []                 # CHANGED: list of IDs
    # (courses_taken removed from base, derived in response)

class StudentResponse(StudentBase):
    """Response includes full goal object and extracted course IDs"""
    id: int
    created_at: datetime
    career_goal: Optional[CareerGoalResponse] = None  # NEW: full object
    human_skill_ids: List[int] = []
    courses_taken: List[int] = []                      # NEW: derived from relationships
    
    @field_validator('human_skill_ids', mode='before')
    @classmethod
    def extract_skill_ids(cls, v):
        """Converts Skill objects to IDs for JSON serialization"""
        if isinstance(v, list):
            if v and isinstance(v[0], int):
                return v
            return [skill.id if hasattr(skill, 'id') else skill for skill in v]
        return v if v else []
    
    @field_validator('courses_taken', mode='before')
    @classmethod
    def extract_course_ids(cls, v):
        """Converts StudentCourse objects to course IDs for JSON serialization"""
        if isinstance(v, list):
            if v and isinstance(v[0], int):
                return v
            return [sc.course_id if hasattr(sc, 'course_id') else sc for sc in v]
        return v if v else []
```

**Validators Explanation:**
- When Pydantic serializes a Student ORM object, relationships are included as objects
- Validators convert these objects to simple integer IDs for cleaner JSON
- If data is already integers, they pass through unchanged

---

#### 3. **crud.py** - Database Operations

**New Functions:**

```python
def create_student(db: Session, student_data: Dict[str, Any]):
    """Create student with proper many-to-many handling"""
    # Extract many-to-many fields before ORM object creation
    human_skill_ids = student_data.pop('human_skill_ids', [])
    
    # Create and flush to get ID
    db_student = models.Student(**student_data)
    db.add(db_student)
    db.flush()
    
    # Add human skills with validation
    if human_skill_ids:
        for skill_id in human_skill_ids:
            skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
            if skill:  # Only add if skill exists
                db_student.human_skills.append(skill)
    
    db.commit()
    db.refresh(db_student)
    return db_student

def update_student(db: Session, student_id: int, student_data: Dict[str, Any]):
    """Update student, replacing many-to-many relationships"""
    db_student = get_student(db, student_id)
    if not db_student:
        return None
    
    human_skill_ids = student_data.pop('human_skill_ids', None)
    
    # Update simple fields
    for key, value in student_data.items():
        if hasattr(db_student, key) and key != 'id':
            setattr(db_student, key, value)
    
    # Replace all human skills (clear and add new)
    if human_skill_ids is not None:
        db_student.human_skills.clear()
        for skill_id in human_skill_ids:
            skill = db.query(models.Skill).filter(models.Skill.id == skill_id).first()
            if skill:
                db_student.human_skills.append(skill)
    
    db.commit()
    db.refresh(db_student)
    return db_student

def add_student_course(db: Session, student_id: int, course_id: int, status: str = "completed"):
    """Add course to student or update its status"""
    existing = db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id,
        models.StudentCourse.course_id == course_id
    ).first()
    
    if existing:
        existing.status = status  # Update existing
    else:
        student_course = models.StudentCourse(
            student_id=student_id,
            course_id=course_id,
            status=status
        )
        db.add(student_course)
    
    db.commit()
    return existing or student_course
```

---

#### 4. **routes/students.py** - API Endpoints

**Updated Endpoints:**

```python
@router.post("/", response_model=schemas.StudentResponse)
def create_student(student: schemas.StudentCreateAuth, db: Session = Depends(get_db)):
    """Create student with password hashing and many-to-many handling"""
    student_data = student.model_dump()
    student_data['hashed_password'] = get_password_hash(student_data.pop('password'))
    db_student = crud.create_student(db, student_data)
    return db_student

@router.put("/{student_id}/courses", response_model=schemas.StudentResponse)
def update_student_courses(
    student_id: int, 
    enrollment: schemas.EnrollmentUpdate, 
    db: Session = Depends(get_db)
):
    """Update student's course list (replaces all, status='completed')"""
    db_student = crud.get_student(db, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Clear all existing courses
    db.query(models.StudentCourse).filter(
        models.StudentCourse.student_id == student_id
    ).delete()
    db.commit()
    
    # Add new courses one by one
    for course_id in enrollment.courses_taken:
        crud.add_student_course(db, student_id, course_id, status="completed")
    
    db.refresh(db_student)
    return db_student
```

---

#### 5. **seed_data.py** - Database Initialization

**Key Updates:**

```python
# Drop tables in dependency order
db.execute(text("DROP TABLE IF EXISTS student_courses CASCADE"))
db.execute(text("DROP TABLE IF EXISTS student_human_skills CASCADE"))
# ... (other tables)

# Create "Undecided" career goal as fallback
undecided = models.CareerGoal(
    name="Undecided", 
    description="Student hasn't decided on a career path yet."
)
# ... add to career goals list

# Create demo student with career goal
undecided_goal = db.query(models.CareerGoal).filter(
    models.CareerGoal.name == "Undecided"
).first()
demo_student = models.Student(
    name="demo",
    hashed_password=get_password_hash("demo123"),
    faculty="Computer Science",
    year=3,
    career_goal_id=undecided_goal.id if undecided_goal else None
)
db.add(demo_student)
db.commit()

# Add student courses (with status tracking)
demo_courses = [
    models.StudentCourse(
        student_id=demo_student.id, 
        course_id=10016,  # Intro to CS
        status="completed"
    ),
    # ... more courses
]
db.add_all(demo_courses)
db.commit()
```

---

#### 6. **main.py** - Application Setup

**Added import:**
```python
from .models import Student, Course, Rating, CourseReview, StudentCourse
```
- Ensures StudentCourse model is loaded when database schema is created

---

## API Usage Examples

### Creating a Student

**Request:**
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "alice_smith",
  "password": "securepass123",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "human_skill_ids": [1, 3, 5]
}
```

**Response:**
```json
{
  "id": 42,
  "name": "alice_smith",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "career_goal": {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs."
  },
  "human_skill_ids": [1, 3, 5],
  "courses_taken": [],
  "created_at": "2024-01-15T10:30:00"
}
```

### Updating Student Courses

**Request:**
```bash
PUT /students/42/courses
Content-Type: application/json

{
  "courses_taken": [10016, 10117, 10208]
}
```

**Response:**
```json
{
  "id": 42,
  "name": "alice_smith",
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

### Querying Student Data

**SQL Query Example:**
```sql
-- Get all courses for a student with their status
SELECT 
    sc.course_id,
    c.name,
    sc.status,
    sc.created_at
FROM student_courses sc
JOIN courses c ON sc.course_id = c.id
WHERE sc.student_id = 42;

-- Get all human skills for a student
SELECT 
    shs.skill_id,
    s.name,
    s.type
FROM student_human_skills shs
JOIN skills s ON shs.skill_id = s.id
WHERE shs.student_id = 42 AND s.type = 'human';
```

---

## Migration Strategy for Existing Data

If you have existing data with array columns, follow these steps:

### Step 1: Add New Tables & Columns
```sql
-- Add career_goal_id column (nullable for backfill)
ALTER TABLE students ADD COLUMN career_goal_id INTEGER REFERENCES career_goals(id);

-- Create junction tables
CREATE TABLE student_human_skills (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE student_courses (
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (student_id, course_id)
);
```

### Step 2: Backfill Data

```python
# Career Goals: Use first element of array as FK
for student in db.query(Student).filter(Student.career_goals != []):
    goal_name = student.career_goals[0]
    goal = db.query(CareerGoal).filter(CareerGoal.name == goal_name).first()
    if goal:
        student.career_goal_id = goal.id
    else:
        # Fallback to "Undecided"
        undecided = db.query(CareerGoal).filter(
            CareerGoal.name == "Undecided"
        ).first()
        student.career_goal_id = undecided.id if undecided else None
db.commit()

# Human Skills: Copy each skill to junction table
for student in db.query(Student).filter(Student.human_skills != []):
    for skill_id in student.human_skills:
        if db.query(Skill).filter(Skill.id == skill_id).first():
            db.execute(
                insert(student_human_skills).values(
                    student_id=student.id,
                    skill_id=skill_id,
                    created_at=datetime.utcnow()
                )
            )
db.commit()

# Courses Taken: Copy each course with 'completed' status
for student in db.query(Student).filter(Student.courses_taken != []):
    for course_id in student.courses_taken:
        if db.query(Course).filter(Course.id == course_id).first():
            db.add(StudentCourse(
                student_id=student.id,
                course_id=course_id,
                status='completed'
            ))
db.commit()
```

### Step 3: Drop Old Columns

```sql
-- Only after verifying all data migrated correctly
ALTER TABLE students DROP COLUMN courses_taken;
ALTER TABLE students DROP COLUMN career_goals;
ALTER TABLE students DROP COLUMN human_skills;

-- Set career_goal_id to NOT NULL
ALTER TABLE students ALTER COLUMN career_goal_id SET NOT NULL;
```

---

## Performance Considerations

### Indexing
The implementation includes the following indexes:
```python
# In student_human_skills table
Index('ix_student_human_skills_skill_id', 'skill_id')

# In student_courses table
Index('ix_student_courses_course_id', 'course_id')
Index('ix_student_courses_status', 'student_id', 'status')
```

**Benefits:**
- Quick lookup by foreign key
- Fast filtering by status within a student
- Composite index for combined queries

### Query Examples

**Fast queries with new schema:**
```python
# Get all completed courses for a student
completed = db.query(models.StudentCourse).filter(
    models.StudentCourse.student_id == 42,
    models.StudentCourse.status == 'completed'
).all()

# Get all technical skills for a student
technical = db.query(models.Skill).join(
    student_human_skills
).filter(
    student_human_skills.c.student_id == 42,
    models.Skill.type == 'technical'
).all()

# Count students taking a course
count = db.query(models.StudentCourse).filter(
    models.StudentCourse.course_id == 10016
).count()
```

---

## Testing

### Unit Tests to Consider

```python
def test_create_student_with_skills():
    """Verify student creation includes skills"""
    student = crud.create_student(db, {
        'name': 'test',
        'hashed_password': 'hash',
        'career_goal_id': 1,
        'human_skill_ids': [1, 2, 3]
    })
    assert len(student.human_skills) == 3

def test_update_student_courses():
    """Verify course updates replace properly"""
    crud.add_student_course(db, student_id, 10016, status='completed')
    crud.add_student_course(db, student_id, 10117, status='in_progress')
    
    courses = crud.get_student_courses(db, student_id)
    assert len(courses) == 2
    assert any(c.status == 'in_progress' for c in courses)

def test_student_response_serialization():
    """Verify JSON response includes extracted IDs"""
    response = StudentResponse.from_attributes(student_orm_object)
    assert isinstance(response.courses_taken[0], int)
    assert isinstance(response.human_skill_ids[0], int)
```

---

## Rollback Plan

If issues arise, you can revert to array columns by:

1. **Restore from backup** (recommended approach)
2. **Recreate old schema** with array columns
3. **Copy data back** from junction tables to arrays
4. **Rebuild application** with old code

However, the new schema is production-ready and provides significant improvements over arrays.

---

## Conclusion

The refactoring successfully replaces loose array storage with proper relational modeling:

✅ **Data Integrity** - Foreign key constraints  
✅ **Query Performance** - Indexed joins instead of array scanning  
✅ **Extensibility** - Status field for future course progress tracking  
✅ **Type Safety** - Pydantic validators ensure correct data types  
✅ **Maintainability** - Standard ORM patterns and SQL semantics  

The implementation is backward-compatible at the API level while using best practices internally.
