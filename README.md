# 🎓 Course Recommendation System  
Hybrid recommendation engine for college courses (Content-Based + Collaborative Filtering)  
Backend: FastAPI – Frontend: React – Database: PostgreSQL – Fully Dockerized

---

## 🚀 Project Overview
This system provides personalized course recommendations for students based on:
- Academic profile  
- Courses previously taken  
- Student ratings  
- Course difficulty & workload  
- Career goals (job–skill matching)  
- Similar students (collaborative filtering)

The project includes:
- FastAPI backend (REST API)
- PostgreSQL database
- React frontend (Material UI)
- Python recommendation engine (TF-IDF, cosine similarity, collaborative filtering)
- Docker for full environment isolation and easy team setup

---

## 🛠️ Tech Stack
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL
- **Frontend:** React + Material UI
- **Recommendation Engine:** Python (TF-IDF, Cosine Similarity, Surprise)
- **Containerization:** Docker + Docker Compose
- **ORM:** SQLAlchemy

---

## 📦 How to Run the Project (Docker Recommended)

### 1️⃣ Requirements
Install once before running:

---

## 🐳 Quick Start (Docker - Recommended)

### Prerequisites
- **Docker Desktop** https://www.docker.com/products/docker-desktop/
- **Git** https://git-scm.com/downloads

### Run the Application

Open terminal in the project root and run:

```bash
docker compose up --build
```

**That's it!** The application will start automatically with:
- FastAPI backend at **http://localhost:8000**
- PostgreSQL database
- Automatic database seeding with sample data

### Access the API

- **Swagger UI (Interactive API Docs):** http://localhost:8000/docs
- **ReDoc (API Documentation):** http://localhost:8000/redoc
- **API Root:** http://localhost:8000

### Stop the Application

Press `CTRL+C` in the terminal, or run:

```bash
docker compose down
```

---

## 🐳 2️⃣ Starting the Project With Docker

In the project root directory:

```bash
docker compose up --build
```

This command will:
- Build and run the FastAPI backend
- Start the PostgreSQL database
- Create a shared internal network for all services
- Automatically seed the database with sample courses, students, and ratings

### After startup:

✔ **FastAPI Swagger Docs:**  
http://localhost:8000/docs

✔ **API Root:**  
http://localhost:8000/

---

## 📚 API Endpoints

### Students
- `GET /students` - List all students
- `GET /students/{id}` - Get a specific student
- `POST /students` - Create a new student
- `PUT /students/{id}` - Update a student
- `PUT /students/{id}/courses` - Update student's courses taken
- `DELETE /students/{id}` - Delete a student

### Courses
- `GET /courses` - List all courses
- `GET /courses/{id}` - Get a specific course
- `POST /courses` - Create a new course
- `PUT /courses/{id}` - Update a course
- `DELETE /courses/{id}` - Delete a course

### Ratings
- `POST /ratings` - Create a new rating
- `GET /ratings/course/{course_id}` - Get all ratings for a course
- `GET /ratings/student/{student_id}` - Get all ratings by a student

---

## 🗂️ Project Structure

```
Agile-project/
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # Database configuration
│   │   ├── models.py            # SQLAlchemy ORM models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── seed_data.py         # Sample data seeding
│   │   └── routes/
│   │       ├── students.py      # Student endpoints
│   │       ├── courses.py       # Course endpoints
│   │       └── ratings.py       # Rating endpoints
│
├── frontend/                    # React application
│
├── db/                          # Database scripts
│
├── docker-compose.yml           # Multi-container orchestration
│
└── README.md
```

---

## 🗄️ Database

PostgreSQL runs automatically inside Docker.

**Default Credentials:**
- Host: `localhost` (from outside Docker)
- Port: `5432`
- Username: `admin`
- Password: `admin`
- Database: `courses_db`

To connect with DBeaver or PGAdmin:
```
Host: localhost
Port: 5432
Username: admin
Password: admin
```

---

## 💻 Local Development (Without Docker)

If you need to run the backend locally for debugging:

### Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Run FastAPI:
```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at **http://localhost:8000**

> **Note:** You'll need PostgreSQL running locally on port 5432 with the same credentials.

---

## 🌱 Database Seeding

Sample data is **automatically seeded** on startup with:
- 6 courses
- 6 students  
- 9 ratings

To reseed manually:
```bash
python backend/app/seed_data.py
```

---

## 🧠 Recommendation Engine (Coming Soon)

### Content-Based Filtering:
- TF-IDF vectorization of descriptions  
- Cosine similarity between courses  
- Ranking based on student course history  

### Collaborative Filtering:
- Using Surprise (SVD / KNNBasic)

### Hybrid Model:
```
final_score = 0.6 * collaborative + 0.4 * content
```

---

## 👥 Team Workflow

Branch strategy:

```
main       → production / stable  
dev        → active development  
feature/*  → individual feature branches
```

Example feature branches:
- `feature/recommendation-engine`
- `feature/frontend-home`
- `feature/backend-ratings-api`

---

## 🤝 Contributors
- Gal Grinfeld  
- Hila Hindi
- Neta Elbaz
- Noga Dotan
- Dor Dotan

---

## 📄 License
Academic use only.



