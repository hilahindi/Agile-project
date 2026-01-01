import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Box,
  Button,
  Rating,
  Chip,
  Alert,
} from '@mui/material';
import { useAuth } from '../services/authService';

const API_URL = 'http://localhost:8000';

/**
 * Helper function to format date in a readable format.
 * @param {string} dateString - ISO date string from API.
 * @returns {string} Formatted date (e.g., "Dec 12, 2025").
 */
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

/**
 * Helper function to get color for final score.
 * @param {number} score - The final score (1-10).
 * @returns {string} Color name: 'success' for green, 'warning' for orange, 'error' for red.
 */
const getScoreColor = (score) => {
  if (score >= 8) return 'success'; // green
  if (score >= 5) return 'warning'; // orange
  return 'error'; // red
};

/**
 * ReviewsFeed Component
 * Displays all course reviews from all students in the database
 * in a clean, Material-UI table with comprehensive styling and features.
 */
const ReviewsFeed = ({ onNavigateToReview }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  const { currentUser, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all reviews when component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all reviews from backend endpoint: GET /reviews/
        const response = await fetch(
          `${API_URL}/reviews/`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch reviews: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        // Sort reviews by date (newest first)
        const sortedReviews = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          : [];
        setReviews(sortedReviews);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(
          err.message || 'An error occurred while fetching reviews.'
        );
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [token]);

  // Loading state
  if (loading) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Course Reviews Feed" />
        <CardContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Course Reviews Feed" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state - no reviews yet
  if (reviews.length === 0) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Course Reviews Feed" />
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
            No course reviews available yet.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={onNavigateToReview}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              px: 3,
              py: 1,
            }}
          >
            Be the First to Submit a Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Data rows populated - render table
  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="Last Course Reviews"
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
                    width: '12%',
                  }}
                >
                  Student
                </TableCell>
                <TableCell
                  align="left"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: '#f0f0f0',
                    borderBottom: '2px solid #ddd',
                    width: '10%',
                  }}
                >
                  Course ID
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
                  Course Name
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    fontWeight: 700,
                    backgroundColor: '#f0f0f0',
                    borderBottom: '2px solid #ddd',
                    width: '10%',
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
                    width: '12%',
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
                    width: '12%',
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
                    width: '12%',
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
                    width: '14%',
                  }}
                >
                  Created At
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.slice(page * 3, page * 3 + 3).map((review, index) => (
                <TableRow
                  key={review.id}
                  onClick={() => navigate(`/courses/${review.course_id}?highlightReviewId=${review.id}`)}
                  sx={{
                    backgroundColor:
                      index % 2 === 0 ? '#ffffff' : '#fafafa',
                    '&:hover': {
                      backgroundColor: '#e8f5e9',
                      cursor: 'pointer',
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

                  {/* Course ID */}
                  <TableCell align="left" sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {review.course_id}
                    </Typography>
                  </TableCell>

                  {/* Course Name */}
                  <TableCell align="left" sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {review.course?.name || 'Unknown Course'}
                    </Typography>
                  </TableCell>

                  {/* Final Score - Bold with color coding */}
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color:
                          review.final_score >= 8
                            ? '#4caf50' // green
                            : review.final_score >= 5
                            ? '#ff9800' // orange
                            : '#f44336', // red
                      }}
                    >
                      {review.final_score.toFixed(1)}/10
                    </Typography>
                  </TableCell>

                  {/* Industry Relevance Rating (stars 1-5) */}
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Rating
                        value={review.industry_relevance_rating}
                        readOnly
                        size="small"
                      />
                    </Box>
                  </TableCell>

                  {/* Instructor Quality Rating (stars 1-5) */}
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Rating
                        value={review.instructor_rating}
                        readOnly
                        size="small"
                      />
                    </Box>
                  </TableCell>

                  {/* Useful Learning Rating (stars 1-5) */}
                  <TableCell align="center" sx={{ py: 1.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Rating
                        value={review.useful_learning_rating}
                        readOnly
                        size="small"
                      />
                    </Box>
                  </TableCell>

                  {/* Languages Learned (comma-separated) */}
                  <TableCell align="left" sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {review.languages_learned
                        ? review.languages_learned
                            .split(',')
                            .map((lang, i) => (
                              <Chip
                                key={i}
                                label={lang.trim()}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                }}
                              />
                            ))
                        : (
                          <Typography
                            variant="caption"
                            sx={{ color: '#999' }}
                          >
                            —
                          </Typography>
                        )}
                    </Box>
                  </TableCell>

                  {/* Course Outputs (comma-separated) */}
                  <TableCell align="left" sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {review.course_outputs
                        ? review.course_outputs
                            .split(',')
                            .map((output, i) => (
                              <Chip
                                key={i}
                                label={output.trim()}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 24,
                                  fontSize: '0.75rem',
                                }}
                              />
                            ))
                        : (
                          <Typography
                            variant="caption"
                            sx={{ color: '#999' }}
                          >
                            —
                          </Typography>
                        )}
                    </Box>
                  </TableCell>

                  {/* Created At - Formatted Date */}
                  <TableCell align="left" sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      {formatDate(review.created_at)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 1 }}>
          <Button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            sx={{ minWidth: 0, px: 2, fontWeight: 'bold' }}>&lt;</Button>
          <Typography sx={{ mx: 2, fontSize: 15, color: '#666' }}>
            {page + 1} / {Math.max(1, Math.ceil(reviews.length / 3))}
          </Typography>
          <Button
            onClick={() => setPage(p => (p + 1 < Math.ceil(reviews.length / 3) ? p + 1 : p))}
            disabled={page + 1 >= Math.ceil(reviews.length / 3)}
            sx={{ minWidth: 0, px: 2, fontWeight: 'bold' }}>&gt;</Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReviewsFeed;
