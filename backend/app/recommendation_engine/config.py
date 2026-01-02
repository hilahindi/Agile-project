"""Configuration constants for recommendation engine."""

# Final score weights (sum to 1.0)
W1 = 0.80  # Role (career fit): technical skills overlap with required skills (increased)
W2 = 0.10  # Affinity (course-to-course similarity based on completed courses) (reduced)
W5 = 0.10  # Review quality (smoothed review scores) (reduced)

# Affinity similarity blending
ALPHA = 0.6  # cluster_match weight; (1-alpha) for tech_overlap (Jaccard)

# Affinity computation
TOP_K_SIMILAR = 3  # Top K completed course similarities to average for affinity

# Review quality smoothing
PRIOR_M = 5  # prior strength for Bayesian smoothing
