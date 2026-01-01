import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authService';
import { Card, CardContent, CardHeader, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, Box, Rating, Chip, Alert, Button } from '@mui/material';

const API_URL = 'http://localhost:8000';

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

const MyReviews = () => {
  const navigate = useNavigate();
  const { currentUser, token } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        // GET /ratings/student/{student_id} (user's own reviews)
        const res = await fetch(`${API_URL}/reviews/student/${currentUser.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch your reviews');
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.id && token) fetchUserReviews();
  }, [currentUser, token]);

  if (loading) return <Card sx={{ mt: 3 }}><CardHeader title="My Reviews" /><CardContent sx={{ minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><CircularProgress /></CardContent></Card>;
  if (error) return <Card sx={{ mt: 3 }}><CardHeader title="My Reviews" /><CardContent><Alert severity="error">{error}</Alert></CardContent></Card>;
  if (reviews.length === 0)
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="My Reviews" />
        <CardContent sx={{ minHeight: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography>No reviews submitted yet.</Typography>
          <Box mt={3}>
            <Button variant="contained" onClick={() => navigate('/submit-review')} sx={{ backgroundColor: '#00D9A3', color: 'white', '&:hover': { backgroundColor: '#00b386' } }}>
              Add New Review
            </Button>
          </Box>
        </CardContent>
      </Card>
    );

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader 
        title="My Reviews" 
        sx={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}
        action={<Button variant="contained" onClick={() => navigate('/submit-review')} sx={{ backgroundColor: '#00D9A3', color: 'white', '&:hover': { backgroundColor: '#00b386' } }}>Add New Review</Button>}
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer component={Paper}>
          <Table stickyHeader aria-label="my reviews table" size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                <TableCell align="left" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Course ID</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Course Name</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Final Score</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Industry Relevance</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Instructor Quality</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Useful Learning</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Languages</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Course Outputs</TableCell>
                <TableCell align="left" sx={{ fontWeight: 700, backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review, i) => (
                <TableRow 
                  key={review.id} 
                  onClick={() => navigate(`/courses/${review.course_id}?highlightReviewId=${review.id}`)}
                  sx={{ 
                    backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa', 
                    borderBottom: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#e8f5e9',
                    },
                  }}>
                  <TableCell align="left">{review.course_id}</TableCell>
                  <TableCell align="left">{review.course?.name || 'Unknown Course'}</TableCell>
                  <TableCell align="center"><Typography sx={{ fontWeight: 700, color: review.final_score >= 8 ? '#4caf50' : review.final_score >= 5 ? '#ff9800' : '#f44336' }}>{review.final_score?.toFixed(1)}/10</Typography></TableCell>
                  <TableCell align="center"><Rating value={review.industry_relevance_rating} readOnly size="small" /></TableCell>
                  <TableCell align="center"><Rating value={review.instructor_rating} readOnly size="small" /></TableCell>
                  <TableCell align="center"><Rating value={review.useful_learning_rating} readOnly size="small" /></TableCell>
                  <TableCell align="left">{review.languages_learned ? review.languages_learned.split(',').map((lang, idx) => <Chip key={idx} label={lang.trim()} size="small" sx={{ ml: 0.5, mt: 0.5 }}/>) : '—'}</TableCell>
                  <TableCell align="left">{review.course_outputs ? review.course_outputs.split(',').map((out, idx) => <Chip key={idx} label={out.trim()} size="small" sx={{ ml: 0.5, mt: 0.5 }}/>) : '—'}</TableCell>
                  <TableCell align="left">{formatDate(review.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default MyReviews;

