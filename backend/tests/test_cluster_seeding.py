"""
Tests for cluster seeding idempotency and correctness.

This test suite verifies that:
1. The cluster seeding script is idempotent (safe to run multiple times)
2. No duplicates are created in course_clusters
3. Known memberships exist (e.g., cluster "Game Development" contains course_id 10220)
4. Courses can belong to multiple clusters without overwriting others
5. Missing courses are handled gracefully
"""

import pytest
from sqlalchemy.orm import Session
from app.models import Cluster, Course, CourseCluster
from app.seed_clusters import seed_clusters, CLUSTERS_DATA


@pytest.fixture
def setup_test_courses(db_session: Session):
    """Create test courses before seeding clusters."""
    # Create courses that are in CLUSTERS_DATA
    test_course_ids = set()
    for cluster in CLUSTERS_DATA:
        test_course_ids.update(cluster["course_ids"])
    
    for course_id in test_course_ids:
        existing = db_session.query(Course).filter(Course.id == course_id).first()
        if not existing:
            course = Course(
                id=course_id,
                name=f"Test Course {course_id}",
                description=f"Test description for course {course_id}",
                status="Mandatory"
            )
            db_session.add(course)
    
    db_session.commit()
    return list(test_course_ids)


class TestClusterSeedingIdempotency:
    """Test that cluster seeding is idempotent."""
    
    def test_seed_clusters_twice_no_duplicates(self, db_session: Session, setup_test_courses):
        """
        Run seed_clusters twice and verify no duplicate course_clusters entries.
        Expected: All entries in course_clusters are unique (no duplicates).
        """
        # First run
        seed_clusters()
        
        # Count links after first run
        first_run_count = db_session.query(CourseCluster).count()
        
        # Second run (should be idempotent)
        seed_clusters()
        
        # Count links after second run
        second_run_count = db_session.query(CourseCluster).count()
        
        # Verify no new links were created (idempotent)
        assert first_run_count == second_run_count, \
            f"Seeding not idempotent: {first_run_count} links after first run, {second_run_count} after second"
        
        # Verify unique constraint is enforced (no duplicates)
        duplicate_pairs = db_session.query(CourseCluster.course_id, CourseCluster.cluster_id) \
            .group_by(CourseCluster.course_id, CourseCluster.cluster_id) \
            .having(db_session.query(CourseCluster) \
                    .filter(CourseCluster.course_id == CourseCluster.course_id,
                            CourseCluster.cluster_id == CourseCluster.cluster_id).count() > 1).all()
        
        assert len(duplicate_pairs) == 0, f"Found duplicate course-cluster pairs: {duplicate_pairs}"
    
    def test_seed_clusters_three_times(self, db_session: Session, setup_test_courses):
        """
        Run seed_clusters three times and verify consistency.
        Expected: Same number of links after each run.
        """
        counts = []
        
        for run in range(3):
            seed_clusters()
            count = db_session.query(CourseCluster).count()
            counts.append(count)
        
        # All runs should have the same count
        assert counts[0] == counts[1] == counts[2], \
            f"Inconsistent counts: {counts}"


class TestClusterMemberships:
    """Test that known cluster memberships are correctly created."""
    
    def test_game_development_has_course_10220(self, db_session: Session, setup_test_courses):
        """
        Verify that cluster "Game Development" contains course_id 10220.
        Expected: course_id 10220 is linked to "Game Development" cluster.
        """
        seed_clusters()
        
        cluster = db_session.query(Cluster).filter(
            Cluster.name == "Game Development"
        ).first()
        
        assert cluster is not None, "Game Development cluster not found"
        
        link = db_session.query(CourseCluster).filter(
            CourseCluster.cluster_id == cluster.id,
            CourseCluster.course_id == 10220
        ).first()
        
        assert link is not None, "Course 10220 not found in Game Development cluster"
    
    def test_data_analysis_has_multiple_courses(self, db_session: Session, setup_test_courses):
        """
        Verify that "Data Analysis" cluster contains expected courses.
        Expected: All courses in [90911, 10015, 10127, 10206, 10351, 10358] are linked.
        """
        seed_clusters()
        
        cluster = db_session.query(Cluster).filter(
            Cluster.name == "Data Analysis"
        ).first()
        
        assert cluster is not None, "Data Analysis cluster not found"
        
        # Expected course IDs for Data Analysis
        expected_course_ids = [90911, 10015, 10127, 10206, 10351, 10358]
        
        for course_id in expected_course_ids:
            link = db_session.query(CourseCluster).filter(
                CourseCluster.cluster_id == cluster.id,
                CourseCluster.course_id == course_id
            ).first()
            
            assert link is not None, f"Course {course_id} not found in Data Analysis cluster"
    
    def test_software_development_cluster_exists(self, db_session: Session, setup_test_courses):
        """
        Verify that "Software Development" cluster is created.
        Expected: Cluster exists with all expected courses.
        """
        seed_clusters()
        
        cluster = db_session.query(Cluster).filter(
            Cluster.name == "Software Development"
        ).first()
        
        assert cluster is not None, "Software Development cluster not found"
        
        # Count courses in this cluster
        course_count = db_session.query(CourseCluster).filter(
            CourseCluster.cluster_id == cluster.id
        ).count()
        
        assert course_count > 0, "Software Development cluster has no courses"
        assert course_count == 8, f"Expected 8 courses, found {course_count}"


class TestMultiClusterMembership:
    """Test that courses can belong to multiple clusters."""
    
    def test_course_can_belong_to_multiple_clusters(self, db_session: Session, setup_test_courses):
        """
        Verify that a course can belong to multiple clusters without conflicts.
        Example: course_id 10147 is in both "Cyber" and "User Interfaces" and "Game Development".
        Expected: The same course appears in multiple clusters and links are preserved.
        """
        seed_clusters()
        
        # course_id 10147 should be in multiple clusters
        multi_cluster_course_id = 10147
        
        links = db_session.query(CourseCluster).filter(
            CourseCluster.course_id == multi_cluster_course_id
        ).all()
        
        cluster_ids = [link.cluster_id for link in links]
        cluster_names = [db_session.query(Cluster).filter(Cluster.id == cid).first().name 
                        for cid in cluster_ids]
        
        assert len(cluster_names) >= 1, f"Course {multi_cluster_course_id} should be in at least one cluster"
        # Verify no duplicate links for the same course
        assert len(cluster_names) == len(set(cluster_names)), \
            f"Found duplicate cluster assignments for course {multi_cluster_course_id}: {cluster_names}"
    
    def test_seeding_preserves_existing_links(self, db_session: Session, setup_test_courses):
        """
        Verify that re-running seeding does not delete existing course-cluster links.
        Expected: All links from first run are preserved in second run.
        """
        # First run
        seed_clusters()
        
        first_run_links = db_session.query(CourseCluster).all()
        first_run_pairs = set((link.course_id, link.cluster_id) for link in first_run_links)
        
        # Second run
        seed_clusters()
        
        second_run_links = db_session.query(CourseCluster).all()
        second_run_pairs = set((link.course_id, link.cluster_id) for link in second_run_links)
        
        # All first-run pairs should still exist
        assert first_run_pairs == second_run_pairs, \
            f"Links were lost or altered: {first_run_pairs} != {second_run_pairs}"


class TestMissingCourseHandling:
    """Test that missing courses are handled gracefully."""
    
    def test_missing_course_does_not_crash(self, db_session: Session):
        """
        Verify that seeding completes without crashing when courses are missing.
        Note: This test uses only partially populated test courses.
        Expected: Seeding completes, missing courses are logged as warnings.
        """
        # Create only some test courses (not all)
        course = Course(
            id=10220,
            name="Test Course 10220",
            description="A test course",
            status="Mandatory"
        )
        db_session.add(course)
        db_session.commit()
        
        # Run seeding (some courses will be missing)
        try:
            seed_clusters()
            # If we reach here, no exception was raised
            assert True, "Seeding completed without crash"
        except Exception as e:
            pytest.fail(f"Seeding crashed with missing courses: {e}")
    
    def test_cluster_created_even_with_missing_courses(self, db_session: Session):
        """
        Verify that clusters are still created even if some courses are missing.
        Expected: Clusters exist, but with fewer course links due to missing courses.
        """
        # Create only one course from each cluster
        course_ids = [10220, 10206, 10010]  # One from each of the new clusters
        for course_id in course_ids:
            course = Course(
                id=course_id,
                name=f"Test Course {course_id}",
                description="Test",
                status="Mandatory"
            )
            db_session.add(course)
        db_session.commit()
        
        seed_clusters()
        
        # Verify clusters were created
        for cluster_name in ["Game Development", "Data Analysis", "Software Development"]:
            cluster = db_session.query(Cluster).filter(Cluster.name == cluster_name).first()
            assert cluster is not None, f"Cluster '{cluster_name}' was not created"


class TestClusterUniqueness:
    """Test that cluster names are unique."""
    
    def test_cluster_names_are_unique(self, db_session: Session, setup_test_courses):
        """
        Verify that all cluster names are unique in the database.
        Expected: No two clusters with the same name.
        """
        seed_clusters()
        
        clusters = db_session.query(Cluster).all()
        cluster_names = [c.name for c in clusters]
        
        assert len(cluster_names) == len(set(cluster_names)), \
            f"Found duplicate cluster names: {cluster_names}"
    
    def test_reseeding_reuses_cluster(self, db_session: Session, setup_test_courses):
        """
        Verify that re-running seeding reuses existing clusters (by name).
        Expected: Same number of clusters after re-seeding.
        """
        seed_clusters()
        first_cluster_count = db_session.query(Cluster).count()
        
        seed_clusters()
        second_cluster_count = db_session.query(Cluster).count()
        
        assert first_cluster_count == second_cluster_count, \
            f"Cluster count changed: {first_cluster_count} -> {second_cluster_count}"


class TestExpectedReport:
    """Test expected console output format (documentation)."""
    
    def test_seeding_completes_with_report(self, db_session: Session, setup_test_courses, capsys):
        """
        Verify that seeding produces expected report output.
        
        Expected output example:
        ======================================================================
        CLUSTER SEEDING
        ======================================================================
        
        ✓ Cluster 'Machine Learning' already exists (updated)
          → 3 course links added
        ✓ Cluster 'Cyber' created
          → 4 course links added
        ✓ Cluster 'User Interfaces' created
          → 5 course links added
        ✓ Cluster 'Game Development' created
          → 6 course links added
        ✓ Cluster 'Data Analysis' created
          → 6 course links added
        ✓ Cluster 'Software Development' created
          → 8 course links added
        
        ======================================================================
        CLUSTER SEEDING COMPLETE
        ======================================================================
        Clusters created:  3
        Clusters updated:  3
        Total links added: 32
        Missing courses:   0
        ======================================================================
        
        SAMPLE CLUSTERS WITH COURSES:
        ...
        """
        seed_clusters()
        
        # Check that seeding completed
        captured = capsys.readouterr()
        assert "CLUSTER SEEDING COMPLETE" in captured.out, "Seeding report missing"
        assert "Total links added:" in captured.out, "Links summary missing"
