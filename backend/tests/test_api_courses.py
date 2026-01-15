"""
REST API Tests for Course Endpoints

Tests:
- GET /courses/
- GET /courses/{course_id}
- GET /courses/{course_id}/stats
- GET /courses/{course_id}/reviews
- POST /courses/
- PUT /courses/{course_id}
- DELETE /courses/{course_id}
"""
import pytest
from fastapi import status


@pytest.mark.api
class TestGetCourses:
    """Test GET /courses/ endpoint."""
    
    def test_get_all_courses_empty(self, client):
        """Test getting all courses when none exist."""
        response = client.get("/courses/")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
    
    def test_get_all_courses_with_data(self, client, test_course):
        """Test getting all courses."""
        response = client.get("/courses/")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(c["id"] == test_course.id for c in data)
    
    def test_get_all_courses_pagination(self, client, db_session):
        """Test pagination for courses."""
        from app import models
        
        # Create multiple courses
        for i in range(5):
            course = models.Course(name=f"Course {i}", description=f"Description {i}")
            db_session.add(course)
        db_session.commit()
        
        response = client.get("/courses/?skip=0&limit=3")
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 3


@pytest.mark.api
class TestGetCourseById:
    """Test GET /courses/{course_id} endpoint."""
    
    def test_get_course_details_success(self, client, test_course):
        """Test getting course details."""
        response = client.get(f"/courses/{test_course.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_course.id
        assert data["name"] == test_course.name
        assert "prerequisites" in data
        assert "skills" in data
        assert "clusters" in data
    
    def test_get_course_details_not_found(self, client):
        """Test getting non-existent course returns 404."""
        response = client.get("/courses/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "not found" in response.json()["detail"].lower()


@pytest.mark.api
class TestGetCourseStats:
    """Test GET /courses/{course_id}/stats endpoint."""
    
    def test_get_course_stats_no_reviews(self, client, test_course):
        """Test getting stats for course with no reviews."""
        response = client.get(f"/courses/{test_course.id}/stats")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["review_count"] == 0
        assert data["avg_final_score"] == 0.0
    
    def test_get_course_stats_with_reviews(self, client, db_session, test_course, test_student):
        """Test getting stats for course with reviews."""
        from app import models
        
        # Create reviews
        review1 = models.CourseReview(
            student_id=test_student.id,
            course_id=test_course.id,
            industry_relevance_rating=5,
            instructor_rating=4,
            useful_learning_rating=5,
            final_score=9.0
        )
        review2 = models.CourseReview(
            student_id=test_student.id,
            course_id=test_course.id,
            industry_relevance_rating=4,
            instructor_rating=3,
            useful_learning_rating=4,
            final_score=7.0
        )
        db_session.add_all([review1, review2])
        db_session.commit()
        
        response = client.get(f"/courses/{test_course.id}/stats")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["review_count"] == 2
        assert data["avg_final_score"] == 8.0  # (9.0 + 7.0) / 2
        assert data["avg_industry_relevance"] == 4.5
        assert data["avg_instructor_quality"] == 3.5
    
    def test_get_course_stats_not_found(self, client):
        """Test getting stats for non-existent course."""
        response = client.get("/courses/99999/stats")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestGetCourseReviews:
    """Test GET /courses/{course_id}/reviews endpoint."""
    
    def test_get_course_reviews_empty(self, client, test_course):
        """Test getting reviews for course with no reviews."""
        response = client.get(f"/courses/{test_course.id}/reviews")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert len(data["items"]) == 0
    
    def test_get_course_reviews_pagination(self, client, db_session, test_course, test_student):
        """Test paginated course reviews."""
        from app import models
        
        # Create multiple reviews
        for i in range(5):
            review = models.CourseReview(
                student_id=test_student.id,
                course_id=test_course.id,
                industry_relevance_rating=5,
                instructor_rating=4,
                useful_learning_rating=5,
                final_score=9.0
            )
            db_session.add(review)
        db_session.commit()
        
        response = client.get(f"/courses/{test_course.id}/reviews?page=1&page_size=2")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total"] == 5
        assert len(data["items"]) == 2
    
    def test_get_course_reviews_invalid_page(self, client, test_course):
        """Test pagination with invalid page number."""
        response = client.get(f"/courses/{test_course.id}/reviews?page=0&page_size=10")
        
        # Should return 422 for invalid page (ge=1)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_get_course_reviews_not_found(self, client):
        """Test getting reviews for non-existent course."""
        response = client.get("/courses/99999/reviews")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestCreateCourse:
    """Test POST /courses/ endpoint."""
    
    def test_create_course_success(self, client):
        """Test creating a new course."""
        response = client.post(
            "/courses/",
            json={
                "name": "New Course",
                "description": "Course description",
                "workload": 10,
                "credits": 3.0,
                "status": "Mandatory"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "New Course"
        assert data["description"] == "Course description"
        assert "id" in data
    
    def test_create_course_duplicate_name(self, client, test_course):
        """Test creating course with duplicate name fails."""
        response = client.post(
            "/courses/",
            json={
                "name": test_course.name,
                "description": "Duplicate"
            }
        )
        
        # Should fail due to unique constraint
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]


@pytest.mark.api
class TestUpdateCourse:
    """Test PUT /courses/{course_id} endpoint."""
    
    def test_update_course_success(self, client, test_course):
        """Test updating a course."""
        response = client.put(
            f"/courses/{test_course.id}",
            json={
                "name": test_course.name,  # Keep same name
                "description": "Updated description",
                "workload": 15,
                "credits": 4.0,
                "status": "Selective"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["workload"] == 15
    
    def test_update_course_not_found(self, client):
        """Test updating non-existent course returns 404."""
        response = client.put(
            "/courses/99999",
            json={
                "name": "Updated Course",
                "description": "New description"
            }
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestDeleteCourse:
    """Test DELETE /courses/{course_id} endpoint."""
    
    def test_delete_course_success(self, client, db_session):
        """Test deleting a course."""
        from app import models
        
        course = models.Course(name="To Delete", description="Will be deleted")
        db_session.add(course)
        db_session.commit()
        course_id = course.id
        
        response = client.delete(f"/courses/{course_id}")
        
        assert response.status_code == status.HTTP_200_OK
        assert "deleted successfully" in response.json()["message"].lower()
        
        # Verify course is deleted
        get_response = client.get(f"/courses/{course_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_delete_course_not_found(self, client):
        """Test deleting non-existent course."""
        response = client.delete("/courses/99999")
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestSearchCourses:
    """Test GET /courses/search endpoint."""
    
    def test_search_empty_query(self, client, test_course):
        """Test search with empty query returns empty list."""
        response = client.get("/courses/search?q=")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
    
    def test_search_query_too_short(self, client, test_course):
        """Test search with query < 2 chars returns empty list."""
        response = client.get("/courses/search?q=a")
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []
    
    def test_search_minimum_length(self, client, db_session):
        """Test search with exactly 2 characters."""
        from app import models
        
        course = models.Course(name="Python Programming", description="Learn Python")
        db_session.add(course)
        db_session.commit()
        
        response = client.get("/courses/search?q=py")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert any(c["name"] == "Python Programming" for c in data)
    
    def test_search_by_partial_name(self, client, db_session):
        """Test searching by partial course name."""
        from app import models
        
        course = models.Course(name="Introduction to Computer Science", description="CS Basics")
        db_session.add(course)
        db_session.commit()
        
        response = client.get("/courses/search?q=introduction")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert data[0]["id"] == course.id
        assert data[0]["name"] == "Introduction to Computer Science"
    
    def test_search_by_course_id(self, client, db_session):
        """Test searching by course ID (as string)."""
        from app import models
        
        course = models.Course(name="Data Structures", description="DS Course")
        db_session.add(course)
        db_session.commit()
        
        # Search by ID
        response = client.get(f"/courses/search?q={course.id}")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert data[0]["id"] == course.id
    
    def test_search_limit_default_10(self, client, db_session):
        """Test search respects default limit of 10."""
        from app import models
        
        # Create 15 courses with matching name
        for i in range(15):
            course = models.Course(name=f"Test Course {i}", description="Matching")
            db_session.add(course)
        db_session.commit()
        
        response = client.get("/courses/search?q=test")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 10  # Default limit
    
    def test_search_limit_capped_to_10(self, client, db_session):
        """Test search limit is capped at 10 even if client asks for more."""
        from app import models
        
        # Create 15 courses with matching name
        for i in range(15):
            course = models.Course(name=f"Query Course {i}", description="Matching")
            db_session.add(course)
        db_session.commit()
        
        response = client.get("/courses/search?q=query&limit=20")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 10  # Capped at 10
    
    def test_search_ranking_exact_id_first(self, client, db_session):
        """Test ranking: exact ID match comes first."""
        from app import models
        
        # Create courses where one has an ID that matches the name of another
        course1 = models.Course(id=100, name="Programming", description="Desc1")
        course2 = models.Course(id=101, name="Course 100", description="Desc2")
        db_session.add(course1)
        db_session.add(course2)
        db_session.commit()
        
        # Search for "100" - should match both, but exact ID (100) comes first
        response = client.get("/courses/search?q=100")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        # The exact ID match should be first
        assert data[0]["id"] == 100
    
    def test_search_ranking_id_prefix_before_name_contains(self, client, db_session):
        """Test ranking: ID prefix match ranks higher than name contains."""
        from app import models
        
        course1 = models.Course(id=1000, name="Something Else", description="Desc1")
        course2 = models.Course(id=200, name="1000 Ways to Learn", description="Desc2")
        db_session.add(course1)
        db_session.add(course2)
        db_session.commit()
        
        # Search for "100" - should match both
        response = client.get("/courses/search?q=100")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        # ID prefix match (1000) should come before name contains (1000 Ways)
        assert data[0]["id"] == 1000
    
    def test_search_case_insensitive(self, client, db_session):
        """Test search is case-insensitive."""
        from app import models
        
        course = models.Course(name="Web Development", description="Dev Course")
        db_session.add(course)
        db_session.commit()
        
        # Try different cases
        for query in ["web", "WEB", "Web", "wEB"]:
            response = client.get(f"/courses/search?q={query}")
            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert len(data) >= 1
            assert any(c["id"] == course.id for c in data)
    
    def test_search_response_format(self, client, db_session):
        """Test search response contains only id and name fields."""
        from app import models
        
        course = models.Course(
            name="Full Stack Development",
            description="Complex description with lots of details",
            workload=15,
            credits=3.0,
            status="Mandatory"
        )
        db_session.add(course)
        db_session.commit()
        
        response = client.get("/courses/search?q=full")
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        result = data[0]
        
        # Should only have id and name
        assert set(result.keys()) == {"id", "name"}
        assert result["id"] == course.id
        assert result["name"] == "Full Stack Development"
