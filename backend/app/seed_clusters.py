"""
Idempotent seeding script for course clusters.
This script creates clusters and links them to courses.

Usage:
    python -m app.seed_clusters

Run this after seeding courses to populate the clusters table.
"""

from .database import SessionLocal
from . import models
from sqlalchemy.exc import IntegrityError
import sys

# Cluster definitions with course IDs
CLUSTERS_DATA = [
    {
        "name": "Machine Learning",
        "description": "Courses focused on machine learning, deep learning, and AI techniques",
        "course_ids": [19101, 10127, 10245, 10224, 10359, 10240, 10243, 10351, 10206]
    },
    {
        "name": "Cyber",
        "description": "Courses focused on cybersecurity, network security, and secure development",
        "course_ids": [10147, 10313, 10208, 10233, 10227, 10248, 10234, 10228]
    },
    {
        "name": "User Interfaces",
        "description": "Courses focused on UI/UX design, web development, and user interface development",
        "course_ids": [10147, 10313, 10208, 10234, 10220, 10225, 10219, 10266]
    },
    {
        "name": "Game Development",
        "description": "Courses focused on game development, graphics programming, and game engines",
        "course_ids": [10128, 10220, 10267, 10342, 10207, 10147]
    },
    {
        "name": "Data Analysis",
        "description": "Courses focused on data analysis, data science, and business analytics",
        "course_ids": [90911, 10015, 10127, 10206, 10351, 10358]
    },
    {
        "name": "Software Development",
        "description": "Courses focused on software engineering, development practices, and coding skills",
        "course_ids": [10010, 11015, 10356, 10110, 10142, 10149, 10212, 10216]
    }
]


def seed_clusters():
    """
    Idempotent seeding: create clusters and link them to courses.
    - Upserts clusters by unique name
    - Links courses to clusters (insert missing pairs only)
    - Handles missing course IDs gracefully
    """
    db = SessionLocal()
    
    try:
        print(f"\n{'='*70}")
        print(f"CLUSTER SEEDING")
        print(f"{'='*70}\n")
        
        # Track statistics
        clusters_created = 0
        clusters_updated = 0
        total_links_added = 0
        missing_course_ids = []
        
        for cluster_data in CLUSTERS_DATA:
            cluster_name = cluster_data["name"]
            course_ids = cluster_data["course_ids"]
            
            # Check if cluster exists
            existing_cluster = db.query(models.Cluster).filter(
                models.Cluster.name == cluster_name
            ).first()
            
            if existing_cluster:
                cluster = existing_cluster
                clusters_updated += 1
                print(f"✓ Cluster '{cluster_name}' already exists (updated)")
            else:
                # Create new cluster
                cluster = models.Cluster(
                    name=cluster_name,
                    description=cluster_data.get("description")
                )
                db.add(cluster)
                db.flush()  # Get the cluster ID
                clusters_created += 1
                print(f"✓ Cluster '{cluster_name}' created")
            
            # Link courses to cluster
            links_added = 0
            courses_not_found = []
            
            for course_id in course_ids:
                # Check if course exists
                course = db.query(models.Course).filter(
                    models.Course.id == course_id
                ).first()
                
                if not course:
                    courses_not_found.append(course_id)
                    missing_course_ids.append(course_id)
                    continue
                
                # Check if link already exists
                existing_link = db.query(models.CourseCluster).filter(
                    models.CourseCluster.course_id == course_id,
                    models.CourseCluster.cluster_id == cluster.id
                ).first()
                
                if not existing_link:
                    try:
                        new_link = models.CourseCluster(
                            course_id=course_id,
                            cluster_id=cluster.id
                        )
                        db.add(new_link)
                        links_added += 1
                        total_links_added += 1
                    except IntegrityError:
                        db.rollback()
                        # Link already exists, skip
                        pass
            
            db.commit()
            
            # Log course linking results
            if courses_not_found:
                print(f"  ⚠️  {len(courses_not_found)} course(s) not found: {courses_not_found}")
            print(f"  → {links_added} course links added")
        
        # Print summary
        print(f"\n{'='*70}")
        print(f"CLUSTER SEEDING COMPLETE")
        print(f"{'='*70}")
        print(f"Clusters created:  {clusters_created}")
        print(f"Clusters updated:  {clusters_updated}")
        print(f"Total links added: {total_links_added}")
        
        if missing_course_ids:
            unique_missing = list(set(missing_course_ids))
            print(f"Missing courses:   {len(unique_missing)} - {unique_missing}")
        
        print(f"{'='*70}\n")
        
        # Verify: print sample clusters with their courses
        print("SAMPLE CLUSTERS WITH COURSES:")
        print("-" * 70)
        for cluster_data in CLUSTERS_DATA[:2]:  # Show first 2 clusters
            cluster = db.query(models.Cluster).filter(
                models.Cluster.name == cluster_data["name"]
            ).first()
            if cluster:
                linked_courses = [c.name for c in cluster.courses]
                print(f"\n  Cluster: {cluster.name}")
                print(f"  Courses ({len(linked_courses)}):")
                for course in linked_courses[:5]:
                    print(f"    • {course}")
                if len(linked_courses) > 5:
                    print(f"    ... and {len(linked_courses) - 5} more")
        
        print(f"\n{'='*70}\n")
        
    except Exception as e:
        print(f"\n❌ Error during cluster seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_clusters()
