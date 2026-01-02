# Running the Application with New Database Schema

## Quick Start

### Prerequisites
```bash
cd backend
pip install -r requirements.txt
```

### Starting the Backend Server

```bash
# From the backend directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**What happens on startup:**
1. FastAPI imports all route modules
2. Models are imported and SQLAlchemy creates the schema
3. `seed_database()` is called automatically:
   - Drops all existing tables
   - Creates new tables with the refactored schema
   - Populates seed data (courses, skills, career goals)
   - Creates demo student: `username: demo, password: demo123`
   - Adds student-course relationships

---

## Database Schema Created

### Tables

```
students
├── id (PK)
├── name (UNIQUE)
├── hashed_password
├── faculty
├── year
├── career_goal_id (FK → career_goals.id)
└── created_at

student_human_skills
├── student_id (FK → students.id) [PK]
├── skill_id (FK → skills.id) [PK]
└── created_at

student_courses
├── student_id (FK → students.id) [PK]
├── course_id (FK → courses.id) [PK]
├── status (VARCHAR: 'completed', 'planned', 'in_progress')
└── created_at

courses
├── id (PK)
├── name (UNIQUE)
├── description
├── workload
├── credits
├── status
└── created_at

skills
├── id (PK)
├── name
├── type ('technical' or 'human')
├── description

career_goals
├── id (PK)
├── name
├── description

(Plus: ratings, course_reviews, course_prerequisites, course_skills, 
 clusters, course_clusters, career_goal_technical_skills, 
 career_goal_human_skills)
```

---

## API Endpoints

### Authentication
```bash
POST /auth/register
POST /auth/login
```

### Students
```bash
GET    /students/                    # List all students
GET    /students/{student_id}        # Get single student
POST   /students/                    # Create student
PUT    /students/{student_id}        # Update student (name, faculty, year, career_goal_id, human_skill_ids)
PUT    /students/{student_id}/courses  # Update courses taken
DELETE /students/{student_id}        # Delete student
```

### Courses
```bash
GET /courses/                        # List all courses
GET /courses/{course_id}             # Get course details
GET /courses/{course_id}/stats       # Get course statistics
GET /courses/{course_id}/reviews     # Get course reviews (paginated)
```

### Skills
```bash
GET /skills/                         # List all skills
GET /skills/?type=human              # Filter by type
GET /skills/?type=technical
```

### Career Goals
```bash
GET /career-goals/                   # List all career goals with their skills
```

### Ratings
```bash
POST /ratings/                       # Rate a course
GET  /ratings/student/{student_id}   # Get student's ratings
```

### Course Reviews
```bash
POST /course-reviews/                # Submit course review
GET  /course-reviews/recent          # Get recent reviews
```

---

## Example API Calls

### 1. Register a New User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_doe",
    "password": "securepass123",
    "faculty": "Computer Science",
    "year": 2,
    "career_goal_id": 1,
    "human_skill_ids": [1, 2, 5]
  }'
```

**Response:**
```json
{
  "id": 42,
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "career_goal": {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs."
  },
  "human_skill_ids": [1, 2, 5],
  "courses_taken": [],
  "created_at": "2024-01-15T14:30:00"
}
```

### 2. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=john_doe&password=securepass123"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. Get Student Details

```bash
curl -X GET http://localhost:8000/students/42 \
  -H "Authorization: Bearer {access_token}"
```

**Response:**
```json
{
  "id": 42,
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "career_goal": {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs."
  },
  "human_skill_ids": [1, 2, 5],
  "courses_taken": [10016, 10117],
  "created_at": "2024-01-15T14:30:00"
}
```

### 4. Update Student Courses

```bash
curl -X PUT http://localhost:8000/students/42/courses \
  -H "Content-Type: application/json" \
  -d '{
    "courses_taken": [10016, 10117, 10208, 10120]
  }'
```

**Response:**
```json
{
  "id": 42,
  "name": "john_doe",
  "faculty": "Computer Science",
  "year": 2,
  "career_goal_id": 1,
  "career_goal": {
    "id": 1,
    "name": "Backend Developer",
    "description": "Builds server-side logic and APIs."
  },
  "human_skill_ids": [1, 2, 5],
  "courses_taken": [10016, 10117, 10208, 10120],
  "created_at": "2024-01-15T14:30:00"
}
```

### 5. Get All Career Goals

```bash
curl -X GET http://localhost:8000/career-goals/
```

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
  },
  ...
]
```

### 6. Get Skills

```bash
curl -X GET http://localhost:8000/skills/?type=human
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Teamwork",
    "type": "human",
    "description": "Works well in teams"
  },
  {
    "id": 2,
    "name": "Communication",
    "type": "human",
    "description": "Clear communicator"
  },
  ...
]
```

---

## Database Connection Details

### Environment Variables

Set these in your `.env` file or Docker Compose:

```bash
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=courses_db
DB_HOST=localhost          # Or 'postgres' if using Docker
DB_PORT=5432
```

### Connection String (Auto-generated)

```
postgresql://admin:admin@localhost:5432/courses_db
```

### Docker Compose Setup

```yaml
version: '3'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin
      POSTGRES_DB: courses_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_USER: admin
      DB_PASSWORD: admin
      DB_NAME: courses_db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Common Operations

### View Database Content

**Connect to PostgreSQL:**
```bash
psql -h localhost -U admin -d courses_db
```

**Useful Queries:**
```sql
-- List all students with their career goals
SELECT s.id, s.name, cg.name as career_goal, s.created_at
FROM students s
LEFT JOIN career_goals cg ON s.career_goal_id = cg.id;

-- Count courses per student
SELECT s.id, s.name, COUNT(sc.course_id) as course_count
FROM students s
LEFT JOIN student_courses sc ON s.id = sc.student_id
GROUP BY s.id, s.name;

-- Get a student's courses with status
SELECT s.name, c.name, sc.status, sc.created_at
FROM students s
JOIN student_courses sc ON s.id = sc.student_id
JOIN courses c ON sc.course_id = c.id
WHERE s.id = 1
ORDER BY sc.created_at DESC;

-- Get a student's human skills
SELECT s.name, sk.name, sk.type
FROM students s
JOIN student_human_skills shs ON s.id = shs.student_id
JOIN skills sk ON shs.skill_id = sk.id
WHERE s.id = 1;
```

### Reset Database

```bash
# On backend startup, seed_database() automatically:
# 1. Drops all tables
# 2. Creates new schema
# 3. Populates seed data

# To manually reset while server is running:
# 1. Stop the server
# 2. Delete database: `dropdb courses_db`
# 3. Recreate database: `createdb courses_db`
# 4. Start server (it will recreate schema)
```

### Backup Database

```bash
# Backup
pg_dump -h localhost -U admin -d courses_db > backup.sql

# Restore
psql -h localhost -U admin -d courses_db < backup.sql
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'jose'"

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: "Connection refused" to PostgreSQL

**Check:**
- PostgreSQL is running: `sudo systemctl status postgresql`
- Correct host/port: `psql -h localhost -U admin -d courses_db`
- Environment variables are set correctly

### Issue: Tables not created

**Check:**
- Application startup log for errors in `seed_database()`
- Database permissions: user can create tables
- PostgreSQL connection is working

### Issue: "Foreign key constraint violation"

**Likely cause:** Trying to add a skill/course/goal that doesn't exist
**Solution:** Verify IDs exist before inserting:
```python
skill = db.query(Skill).filter(Skill.id == skill_id).first()
if not skill:
    raise ValueError(f"Skill {skill_id} does not exist")
```

---

## Performance Tips

### Queries with Many-to-Many Relationships

**Bad (lazy loading causes N+1):**
```python
for student in db.query(Student).all():
    for course in student.student_courses:  # Query per student!
        print(course.status)
```

**Good (eager loading):**
```python
from sqlalchemy.orm import joinedload

students = db.query(Student).options(
    joinedload(Student.student_courses)
).all()
for student in students:
    for course in student.student_courses:  # No extra queries
        print(course.status)
```

### Filtering Efficiently

**Bad (load all then filter):**
```python
students = db.query(Student).all()
completed = [s for s in students if any(
    sc.status == 'completed' for sc in s.student_courses
)]
```

**Good (filter in database):**
```python
students = db.query(Student).join(
    models.StudentCourse
).filter(
    models.StudentCourse.status == 'completed'
).distinct().all()
```

---

## Development Workflow

### 1. Make Model Changes

Edit `backend/app/models.py`

### 2. Update Schemas

Edit `backend/app/schemas.py` with new fields and validators

### 3. Update CRUD

Edit `backend/app/crud.py` with new operations

### 4. Update Routes

Edit route files in `backend/app/routes/`

### 5. Test

```bash
# Restart server (will auto-recreate schema)
uvicorn app.main:app --reload
```

### 6. Test Endpoints

```bash
# Use curl, Postman, or the FastAPI Swagger UI
# http://localhost:8000/docs
```

---

## What's Different from Old Schema

| Feature | Old (Arrays) | New (Relations) |
|---------|--------------|-----------------|
| Career Goals Storage | ARRAY(String) | Single FK + relationship |
| Human Skills Storage | ARRAY(Integer) | Many-to-many junction table |
| Courses Storage | ARRAY(Integer) | M2M with status field |
| Foreign Key Validation | None | Enforced via FK constraints |
| Course Status Tracking | Not possible | Built-in (status field) |
| Query Performance | Array scanning | Indexed joins |
| Referential Integrity | Manual | Automatic cascades |
| Adding Skill to Student | Array append | Insert to junction table |

---

## Next Steps

1. ✅ **Backend refactored** - New schema implemented
2. 📋 **Frontend updates** - May need adjustments for API changes
3. 📊 **Data migration** - If you have existing data (see migration guide)
4. 🧪 **Testing** - Run automated tests
5. 📈 **Performance** - Monitor query times and add indexes as needed
6. 📝 **Documentation** - Update API documentation

---

## Support & Questions

For issues or questions about the refactoring:

1. Check `SCHEMA_REFACTOR_SUMMARY.md` for implementation details
2. Check `DATABASE_REFACTORING_GUIDE.md` for comprehensive guide
3. Review actual code in `backend/app/` directory
4. Check database schema in PostgreSQL directly

The new schema is production-ready and follows SQLAlchemy & FastAPI best practices.
