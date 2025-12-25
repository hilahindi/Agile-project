import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import { useAuth } from '../services/authService';

const API_URL = 'http://localhost:8000/api';

const CourseDetail = ({ courseId, onBack }) => {
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourseAndReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course details
        const courseResponse = await fetch(
          `${API_URL}/courses/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!courseResponse.ok) {
          throw new Error(`Failed to fetch course: ${courseResponse.status}`);
        }

        const courseData = await courseResponse.json();
        setCourse(courseData);

        // Fetch reviews for this course
        const reviewsResponse = await fetch(
          `${API_URL}/reviews/?course_id=${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        } else {
          setReviews([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to load course details');
        console.error('Error fetching course details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseAndReviews();
    }
  }, [courseId, token]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!course) {
    return (
      <Alert severity="warning">
        Course not found
      </Alert>
    );
  }

  // No reviews state
  if (reviews.length === 0) {
    return (
      <Box>
        {/* Course Header */}
        <Card sx={{ mb: 3, p: 3, backgroundColor: '#f9f9f9' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            {course.id} - {course.name}
          </Typography>
          {course.table_group && (
            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
              {course.table_group}
            </Typography>
          )}
          {course.description && (
            <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
              {course.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {course.difficulty && (
              <Box>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Difficulty:
                </Typography>
                <Chip
                  label={`${course.difficulty}/5`}
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: '#00D9A3',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              </Box>
            )}
            {course.workload && (
              <Box>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Workload:
                </Typography>
                <Chip
                  label={`${course.workload} credits`}
                  size="small"
                  sx={{
                    ml: 1,
                    backgroundColor: '#f0f0f0',
                    color: '#333',
                  }}
                />
              </Box>
            )}
          </Box>
        </Card>

        {/* No reviews message */}
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            textAlign: 'center',
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '300px',
            }}
          >
            <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
              No course reviews available yet.
            </Typography>
            <Button
              variant="contained"
              sx={{
                textTransform: 'none',
                fontSize: '1rem',
                px: 3,
                py: 1,
                backgroundColor: '#00D9A3',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#00A880',
                },
              }}
            >
              Be the First to Submit a Review
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Course Header */}
      <Card sx={{ mb: 3, p: 3, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {course.id} - {course.name}
        </Typography>
        {course.table_group && (
          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
            {course.table_group}
          </Typography>
        )}
        {course.description && (
          <Typography variant="body1" sx={{ mb: 2, color: '#555' }}>
            {course.description}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {course.difficulty && (
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Difficulty:
              </Typography>
              <Chip
                label={`${course.difficulty}/5`}
                size="small"
                sx={{
                  ml: 1,
                  backgroundColor: '#00D9A3',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
          {course.workload && (
            <Box>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Workload:
              </Typography>
              <Chip
                label={`${course.workload} credits`}
                size="small"
                sx={{
                  ml: 1,
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                }}
              />
            </Box>
          )}
        </Box>
      </Card>

      {/* Reviews Section with styled table */}
      <Card sx={{ mt: 3 }}>
        <CardHeader
          title={`Course Reviews (${reviews.length})`}
          titleTypographyProps={{
            variant: 'h6',
            sx: { fontWeight: 600 },
          }}
          sx={{
            backgroundColor: '#f5f5f5',
            borderBottom: '1px solid #e0e0e0',
            pb: 2,
          }}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 'calc(100vh - 300px)',
              minHeight: '300px',
              backgroundColor: '#fff',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#555',
                },
              },
            }}
            elevation={0}
          >
            <Table stickyHeader aria-label="course reviews table" size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '15%',
                    }}
                  >
                    Student
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '12%',
                    }}
                  >
                    Final Score
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '15%',
                    }}
                  >
                    Industry Relevance
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '15%',
                    }}
                  >
                    Instructor Quality
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '15%',
                    }}
                  >
                    Useful Learning
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '15%',
                    }}
                  >
                    Languages
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '15%',
                    }}
                  >
                    Course Outputs
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      fontWeight: 700,
                      backgroundColor: '#f0f0f0',
                      borderBottom: '2px solid #ddd',
                      width: '12%',
                    }}
                  >
                    Created At
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((review, index) => (
                  <TableRow
                    key={review.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    {/* Student Name */}
                    <TableCell align="left" sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {review.student?.name || `Student ${review.student_id}`}
                      </Typography>
                    </TableCell>

                    {/* Final Score */}
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip
                        label={`${review.final_score?.toFixed(1) || 'N/A'}/10`}
                        size="small"
                        sx={{
                          backgroundColor:
                            review.final_score >= 8
                              ? '#c8e6c9'
                              : review.final_score >= 6
                              ? '#fff9c4'
                              : '#ffccbc',
                          color: '#333',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>

                    {/* Industry Relevance */}
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip
                        label={`${review.industry_relevance_rating}/5`}
                        size="small"
                        sx={{
                          backgroundColor:
                            review.industry_relevance_rating >= 4
                              ? '#c8e6c9'
                              : review.industry_relevance_rating >= 3
                              ? '#fff9c4'
                              : '#ffccbc',
                          color: '#333',
                        }}
                      />
                    </TableCell>

                    {/* Instructor Quality */}
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip
                        label={`${review.instructor_rating}/5`}
                        size="small"
                        sx={{
                          backgroundColor:
                            review.instructor_rating >= 4
                              ? '#c8e6c9'
                              : review.instructor_rating >= 3
                              ? '#fff9c4'
                              : '#ffccbc',
                          color: '#333',
                        }}
                      />
                    </TableCell>

                    {/* Useful Learning */}
                    <TableCell align="center" sx={{ py: 1.5 }}>
                      <Chip
                        label={`${review.useful_learning_rating}/5`}
                        size="small"
                        sx={{
                          backgroundColor:
                            review.useful_learning_rating >= 4
                              ? '#c8e6c9'
                              : review.useful_learning_rating >= 3
                              ? '#fff9c4'
                              : '#ffccbc',
                          color: '#333',
                        }}
                      />
                    </TableCell>

                    {/* Languages */}
                    <TableCell align="left" sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {review.languages_learned && Array.isArray(review.languages_learned) && review.languages_learned.length > 0 ? (
                          review.languages_learned.map((lang, idx) => (
                            <Chip
                              key={idx}
                              label={lang}
                              size="small"
                              sx={{
                                backgroundColor: '#e3f2fd',
                                color: '#0277bd',
                                fontWeight: 500,
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            —
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Course Outputs */}
                    <TableCell align="left" sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {review.course_outputs && Array.isArray(review.course_outputs) && review.course_outputs.length > 0 ? (
                          review.course_outputs.map((output, idx) => (
                            <Chip
                              key={idx}
                              label={output}
                              size="small"
                              sx={{
                                backgroundColor: '#f3e5f5',
                                color: '#6a1b9a',
                                fontWeight: 500,
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            —
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    {/* Created At */}
                    <TableCell align="left" sx={{ py: 1.5, color: '#999' }}>
                      <Typography variant="caption">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CourseDetail;
