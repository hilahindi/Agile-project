import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Pagination,
  Rating,
  Skeleton,
  Typography,
  Alert,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../services/authService';
import { getCourse, getCourseStats, getCourseReviews } from '../services/courseService';

// Reusable sx styles for consistency
const headerCardSx = {
  borderRadius: 3,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  mb: 4,
  background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
};

const kpiCardSx = {
  borderRadius: 2.5,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    transform: 'translateY(-2px)',
  },
};

const reviewCardSx = {
  borderRadius: 2.5,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: '1px solid #e0e0e0',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
    transform: 'translateY(-1px)',
  },
};

const reviewCardHighlightSx = {
  borderRadius: 2.5,
  boxShadow: '0 6px 16px rgba(255, 167, 38, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: '#fffbf0',
  border: '2px solid #ffa726',
  '&:hover': {
    boxShadow: '0 8px 20px rgba(255, 167, 38, 0.3)',
    transform: 'translateY(-1px)',
  },
};

// Format date helper
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightReviewId = searchParams.get('highlightReviewId');

  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightedReviewId, setHighlightedReviewId] = useState(null);

  // Refs for review cards to enable scrolling
  const reviewRefs = useRef({});

  const pageSize = 10;

  // Fetch course details and stats on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [courseData, statsData, reviewsData] = await Promise.all([
          getCourse(courseId, token),
          getCourseStats(courseId, token),
          getCourseReviews(courseId, 1, pageSize, token),
        ]);

        setCourse(courseData);
        setStats(statsData);
        setReviews(reviewsData);

        // If highlightReviewId is provided, check if it's in the first page
        if (highlightReviewId) {
          const isInFirstPage = reviewsData.items.some(
            (r) => r.id === parseInt(highlightReviewId)
          );
          if (isInFirstPage) {
            setHighlightedReviewId(parseInt(highlightReviewId));
          }
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError(err.message || 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    if (token && courseId) {
      fetchInitialData();
    }
  }, [courseId, token, highlightReviewId]);

  // Fetch reviews when page changes
  useEffect(() => {
    const fetchReviewsForPage = async () => {
      try {
        const reviewsData = await getCourseReviews(courseId, currentPage, pageSize, token);
        setReviews(reviewsData);

        // Check if highlighted review is on this page
        if (highlightReviewId) {
          const isOnThisPage = reviewsData.items.some(
            (r) => r.id === parseInt(highlightReviewId)
          );
          if (isOnThisPage) {
            setHighlightedReviewId(parseInt(highlightReviewId));
          }
        }
      } catch (err) {
        console.error('Error fetching reviews for page:', err);
        setError(err.message || 'Failed to load reviews');
      }
    };

    if (token && courseId && currentPage !== 1) {
      fetchReviewsForPage();
    }
  }, [currentPage, courseId, token, highlightReviewId]);

  // Scroll to and highlight the review card
  useEffect(() => {
    if (
      highlightedReviewId &&
      reviewRefs.current[highlightedReviewId]
    ) {
      const element = reviewRefs.current[highlightedReviewId];
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Auto-clear highlight after 3 seconds
      const timeout = setTimeout(() => {
        setHighlightedReviewId(null);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [highlightedReviewId]);

  // Loading state
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 10, pb: 5, px: 2 }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
            Back
          </Button>
          <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="40%" height={24} sx={{ mb: 4 }} />
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Grid item xs={12} sm={6} md={2.4} key={i}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={400} />
        </Container>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 10, pb: 5, px: 2 }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
            Back
          </Button>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Container>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 10, pb: 5, px: 2 }}>
        <Container maxWidth="lg">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
            Back
          </Button>
          <Alert severity="error">Course not found</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', pt: 10, pb: 5, px: 2 }}>
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
            textTransform: 'none',
            fontSize: '1rem',
            color: '#00D9A3',
            '&:hover': { backgroundColor: 'rgba(0, 217, 163, 0.1)' },
          }}
        >
          Back to Reviews
        </Button>

        {/* Header Card */}
        <Card sx={headerCardSx}>
          <CardContent>
            <Stack spacing={2}>
              {/* Title and Subtitle */}
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: '#333',
                    mb: 1,
                  }}
                >
                  {course.id} - {course.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#666',
                    fontSize: '1rem',
                  }}
                >
                  {course.credits || '—'} Credits • {course.status || 'Unknown Type'}
                  {course.workload && ` • ${course.workload} hrs/week`}
                </Typography>
              </Box>

              {/* Description */}
              {course.description && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.6 }}>
                    {course.description}
                  </Typography>
                </>
              )}

              {/* Prerequisites Section */}
              <Box sx={{ pt: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    color: '#666',
                    display: 'block',
                    mb: 1.5,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  Prerequisites
                </Typography>
                {course.prerequisites && course.prerequisites.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                    {course.prerequisites.map((prereq) => (
                      <Chip
                        key={prereq.id}
                        label={`${prereq.id} – ${prereq.name}`}
                        variant="outlined"
                        size="medium"
                        sx={{
                          borderColor: '#ddd',
                          backgroundColor: '#f9f9f9',
                          '&:hover': { backgroundColor: '#f0f0f0' },
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                    No prerequisites
                  </Typography>
                )}
              </Box>

              {/* Skills Section */}
              <Box sx={{ pt: 1 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 600,
                    color: '#666',
                    display: 'block',
                    mb: 1.5,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  Skills You'll Learn
                </Typography>
                {course.skills && course.skills.length > 0 ? (
                  <Stack spacing={1}>
                    {/* Technical Skills */}
                    {course.skills.filter(s => s.type === 'technical').length > 0 && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: '#00D9A3',
                            display: 'block',
                            mb: 0.8,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          Technical
                        </Typography>
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.8 }}>
                          {course.skills.filter(s => s.type === 'technical').map((skill) => (
                            <Chip
                              key={skill.id}
                              label={skill.name}
                              size="small"
                              sx={{
                                backgroundColor: '#e0f7f4',
                                color: '#00D9A3',
                                fontWeight: 500,
                                border: '1px solid #b3ebe7',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                    
                    {/* Human Skills */}
                    {course.skills.filter(s => s.type === 'human').length > 0 && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 600,
                            color: '#ff9800',
                            display: 'block',
                            mb: 0.8,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          Human Skills
                        </Typography>
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ gap: 0.8 }}>
                          {course.skills.filter(s => s.type === 'human').map((skill) => (
                            <Chip
                              key={skill.id}
                              label={skill.name}
                              size="small"
                              sx={{
                                backgroundColor: '#fff3e0',
                                color: '#ff9800',
                                fontWeight: 500,
                                border: '1px solid #ffe0b2',
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                    No skills data available
                  </Typography>
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {/* Review Count */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={kpiCardSx}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: '#00D9A3',
                      mb: 1,
                    }}
                  >
                    {stats.review_count}
                  </Typography>
                  <Typography variant="overline" sx={{ color: '#666', fontSize: '0.7rem' }}>
                    Reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Avg Final Score */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={kpiCardSx}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color:
                        stats.avg_final_score >= 8
                          ? '#4caf50'
                          : stats.avg_final_score >= 5
                          ? '#ff9800'
                          : '#f44336',
                      mb: 1,
                    }}
                  >
                    {stats.avg_final_score.toFixed(1)}/10.0
                  </Typography>
                  <Typography variant="overline" sx={{ color: '#666', fontSize: '0.7rem' }}>
                    Avg Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Avg Industry Relevance */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={kpiCardSx}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Rating
                    value={Math.round(stats.avg_industry_relevance)}
                    readOnly
                    sx={{ mb: 1, justifyContent: 'center', display: 'flex' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.avg_industry_relevance.toFixed(1)}/5.0
                  </Typography>
                  <Typography variant="overline" sx={{ color: '#666', fontSize: '0.65rem' }}>
                    Industry
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Avg Instructor Quality */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={kpiCardSx}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Rating
                    value={Math.round(stats.avg_instructor_quality)}
                    readOnly
                    sx={{ mb: 1, justifyContent: 'center', display: 'flex' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.avg_instructor_quality.toFixed(1)}/5.0
                  </Typography>
                  <Typography variant="overline" sx={{ color: '#666', fontSize: '0.65rem' }}>
                    Instructor
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Avg Useful Learning */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={kpiCardSx}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Rating
                    value={Math.round(stats.avg_useful_learning)}
                    readOnly
                    sx={{ mb: 1, justifyContent: 'center', display: 'flex' }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {stats.avg_useful_learning.toFixed(1)}/5.0
                  </Typography>
                  <Typography variant="overline" sx={{ color: '#666', fontSize: '0.65rem' }}>
                    Useful
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Reviews Section */}
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#333' }}>
              Student Reviews
            </Typography>
            <Chip
              label={`${stats?.review_count || 0} reviews`}
              variant="outlined"
              size="small"
              sx={{ backgroundColor: '#f5f5f5' }}
            />
          </Stack>

          {reviews && reviews.items.length > 0 ? (
            <>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {reviews.items.map((review) => (
                  <Grid item xs={12} key={review.id}>
                    <Card
                      ref={(el) => {
                        if (el) reviewRefs.current[review.id] = el;
                      }}
                      sx={
                        highlightedReviewId === review.id
                          ? reviewCardHighlightSx
                          : reviewCardSx
                      }
                    >
                      <CardContent>
                        {/* Header: Student Name + Date */}
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 2 }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333' }}>
                            {review.student_name || 'Anonymous'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#999',
                              fontSize: '0.85rem',
                            }}
                          >
                            {formatDate(review.created_at)}
                          </Typography>
                        </Stack>

                        {/* Final Score */}
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color:
                                review.final_score >= 8
                                  ? '#4caf50'
                                  : review.final_score >= 5
                                  ? '#ff9800'
                                  : '#f44336',
                            }}
                          >
                            Final Score: {review.final_score.toFixed(1)}/10
                          </Typography>
                        </Box>

                        {/* Ratings Grid */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          <Grid item xs={12} sm={4}>
                            <Stack spacing={0.5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: '#666',
                                  textTransform: 'uppercase',
                                  fontSize: '0.7rem',
                                }}
                              >
                                Industry Relevance
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Rating value={review.industry_relevance_rating} readOnly size="small" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {review.industry_relevance_rating}/5
                                </Typography>
                              </Stack>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Stack spacing={0.5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: '#666',
                                  textTransform: 'uppercase',
                                  fontSize: '0.7rem',
                                }}
                              >
                                Instructor Quality
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Rating value={review.instructor_rating} readOnly size="small" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {review.instructor_rating}/5
                                </Typography>
                              </Stack>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            <Stack spacing={0.5}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 600,
                                  color: '#666',
                                  textTransform: 'uppercase',
                                  fontSize: '0.7rem',
                                }}
                              >
                                Useful Learning
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Rating value={review.useful_learning_rating} readOnly size="small" />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {review.useful_learning_rating}/5
                                </Typography>
                              </Stack>
                            </Stack>
                          </Grid>
                        </Grid>

                        {/* Languages and Course Outputs */}
                        {(review.languages_learned || review.course_outputs) && (
                          <Box sx={{ mb: 2 }}>
                            {review.languages_learned && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#666',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    mb: 1,
                                  }}
                                >
                                  Languages
                                </Typography>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                  {review.languages_learned.split(',').map((lang, i) => (
                                    <Chip
                                      key={i}
                                      label={lang.trim()}
                                      size="small"
                                      variant="filled"
                                      sx={{
                                        backgroundColor: '#e8f5e9',
                                        color: '#2e7d32',
                                        height: 28,
                                      }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}

                            {review.course_outputs && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#666',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    mb: 1,
                                  }}
                                >
                                  Course Outputs
                                </Typography>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                                  {review.course_outputs.split(',').map((output, i) => (
                                    <Chip
                                      key={i}
                                      label={output.trim()}
                                      size="small"
                                      variant="filled"
                                      sx={{
                                        backgroundColor: '#e3f2fd',
                                        color: '#1565c0',
                                        height: 28,
                                      }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* Optional feedback text fields */}
                        {(review.industry_relevance_text ||
                          review.instructor_feedback ||
                          review.useful_learning_text) && (
                          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e0e0' }}>
                            {review.industry_relevance_text && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#666',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    mb: 0.5,
                                  }}
                                >
                                  Industry Relevance Feedback
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.5 }}>
                                  {review.industry_relevance_text}
                                </Typography>
                              </Box>
                            )}
                            {review.instructor_feedback && (
                              <Box sx={{ mb: 2 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#666',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    mb: 0.5,
                                  }}
                                >
                                  Instructor Feedback
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.5 }}>
                                  {review.instructor_feedback}
                                </Typography>
                              </Box>
                            )}
                            {review.useful_learning_text && (
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: '#666',
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem',
                                    display: 'block',
                                    mb: 0.5,
                                  }}
                                >
                                  Useful Learning Feedback
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#555', lineHeight: 1.5 }}>
                                  {review.useful_learning_text}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {reviews.total > pageSize && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                  <Pagination
                    count={Math.ceil(reviews.total / pageSize)}
                    page={currentPage}
                    onChange={(event, value) => {
                      setCurrentPage(value);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    variant="outlined"
                    shape="rounded"
                  />
                </Box>
              )}
            </>
          ) : (
            <Card sx={{ ...reviewCardSx }}>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" sx={{ color: '#999' }}>
                  No reviews available yet for this course.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default CourseDetailsPage;
