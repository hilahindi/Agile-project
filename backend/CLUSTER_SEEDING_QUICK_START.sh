#!/bin/bash
# Quick Reference Guide for Cluster Seeding

# ==============================================================================
# CLUSTER SEEDING - Quick Start
# ==============================================================================

# 1. RUN THE SEEDING SCRIPT
# ========================
cd backend
python -m app.seed_clusters

# This will:
# - Create 3 new clusters: "Game Development", "Data Analysis", "Software Development"
# - Link them to their respective course IDs
# - Reuse existing clusters if they already exist (idempotent)
# - Output a summary report with statistics

# Safe to run multiple times - no duplicates will be created.


# 2. RUN THE TESTS
# ================
# Run all cluster seeding tests:
pytest tests/test_cluster_seeding.py -v

# Run a specific test class:
pytest tests/test_cluster_seeding.py::TestClusterMemberships -v

# Run a specific test:
pytest tests/test_cluster_seeding.py::TestClusterMemberships::test_game_development_has_course_10220 -v

# Run with coverage:
pytest tests/test_cluster_seeding.py --cov=app --cov-report=html


# 3. VERIFY IN DATABASE
# =====================
# Connect to PostgreSQL:
psql -U admin -d courses_db -h localhost

# List all clusters:
SELECT id, name, created_at FROM clusters;

# List course-cluster links:
SELECT cc.id, cc.course_id, c.name as cluster_name, co.name as course_name
FROM course_clusters cc
JOIN clusters c ON cc.cluster_id = c.id
JOIN courses co ON cc.course_id = co.id
ORDER BY c.name, co.name;

# Count courses in "Game Development" cluster:
SELECT COUNT(*)
FROM course_clusters
WHERE cluster_id = (SELECT id FROM clusters WHERE name = 'Game Development');

# Verify course 10220 is in "Game Development":
SELECT cc.id
FROM course_clusters cc
WHERE cc.course_id = 10220
AND cc.cluster_id = (SELECT id FROM clusters WHERE name = 'Game Development');

# Check for duplicate (course_id, cluster_id) pairs:
SELECT course_id, cluster_id, COUNT(*)
FROM course_clusters
GROUP BY course_id, cluster_id
HAVING COUNT(*) > 1;


# 4. EXPECTED OUTPUT
# ==================
# After running the seeding script, you should see output similar to:
# 
# ======================================================================
# CLUSTER SEEDING
# ======================================================================
# 
# ✓ Cluster 'Machine Learning' already exists (updated)
#   → 5 course links added
# ✓ Cluster 'Cyber' already exists (updated)
#   → 2 course links added
# ✓ Cluster 'User Interfaces' already exists (updated)
#   → 3 course links added
# ✓ Cluster 'Game Development' created
#   → 6 course links added
# ✓ Cluster 'Data Analysis' created
#   → 6 course links added
# ✓ Cluster 'Software Development' created
#   → 8 course links added
# 
# ======================================================================
# CLUSTER SEEDING COMPLETE
# ======================================================================
# Clusters created:  3
# Clusters updated:  3
# Total links added: 30
# Missing courses:   0
# ======================================================================


# 5. NEW CLUSTERS ADDED
# =====================
# 1) Game Development
#    Courses: 10128, 10220, 10267, 10342, 10207, 10147
#
# 2) Data Analysis
#    Courses: 90911, 10015, 10127, 10206, 10351, 10358
#
# 3) Software Development
#    Courses: 10010, 11015, 10356, 10110, 10142, 10149, 10212, 10216


# 6. FILES MODIFIED/CREATED
# ==========================
# Modified:
#   - backend/app/seed_clusters.py (added 3 new clusters to CLUSTERS_DATA)
#
# Created:
#   - backend/tests/test_cluster_seeding.py (comprehensive test suite)
#   - backend/CLUSTER_SEEDING_IMPLEMENTATION.md (detailed documentation)


# 7. KEY FEATURES
# ===============
# ✓ IDEMPOTENT: Safe to run multiple times without creating duplicates
# ✓ UNIQUE CONSTRAINT: Uses PostgreSQL UNIQUE(course_id, cluster_id)
# ✓ ERROR HANDLING: Missing courses logged as warnings, seeding continues
# ✓ ATOMIC: All changes committed or all rolled back
# ✓ TESTED: 12+ test cases covering idempotency, membership, and edge cases
# ✓ BACKWARD COMPATIBLE: Reuses existing clusters, never deletes data
