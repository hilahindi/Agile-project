import React, { useState } from 'react';
import {
  Container,
  Card,
  TextField,
  Rating,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import TagInput from './TagInput';
import LanguagesInput from './LanguagesInput';
import CourseOutputsInput from './CourseOutputsInput';

const CourseReviewForm = () => {
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    languages_learned: [],
    course_outputs: [],
    industry_relevance_text: '',
    instructor_feedback: '',
    useful_learning_text: '',
    industry_relevance_rating: 0,
    instructor_rating: 0,
    useful_learning_rating: 0,
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [finalScore, setFinalScore] = useState(null);

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagChange = (name, newTags) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newTags,
    }));
  };

  const handleRatingChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.student_id || !formData.course_id) {
      setErrorMessage('Student ID and Course ID are required');
      return;
    }

    if (
      formData.industry_relevance_rating === 0 ||
      formData.instructor_rating === 0 ||
      formData.useful_learning_rating === 0
    ) {
      setErrorMessage('All ratings must be provided');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setFinalScore(null);

    try {
      const payload = {
        student_id: parseInt(formData.student_id),
        course_id: parseInt(formData.course_id),
        languages_learned: formData.languages_learned.join(', ') || null,
        course_outputs: formData.course_outputs.join(', ') || null,
        industry_relevance_text: formData.industry_relevance_text || null,
        instructor_feedback: formData.instructor_feedback || null,
        useful_learning_text: formData.useful_learning_text || null,
        industry_relevance_rating: formData.industry_relevance_rating,
        instructor_rating: formData.instructor_rating,
        useful_learning_rating: formData.useful_learning_rating,
      };

      const response = await fetch('http://localhost:8000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit review');
      }

      const result = await response.json();
      setFinalScore(result.final_score);
      setSuccessMessage(
        `✓ Review submitted successfully! Final Score: ${result.final_score}/10`
      );

      // Reset form
      setFormData({
        student_id: '',
        course_id: '',
        languages_learned: [],
        course_outputs: [],
        industry_relevance_text: '',
        instructor_feedback: '',
        useful_learning_text: '',
        industry_relevance_rating: 0,
        instructor_rating: 0,
        useful_learning_rating: 0,
      });
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while submitting the review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f9f9f9', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Card
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 900,
            borderRadius: 3,
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              backgroundColor: '#ffffff',
              borderBottom: '3px solid #00D9A3',
              p: 4,
              textAlign: 'center',
              mb: 4,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 1,
                fontWeight: 800,
                letterSpacing: 0.5,
                color: '#1a1a1a',
              }}
            >
              Course Review
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.7,
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#666666',
              }}
            >
              Share your feedback and help other students discover great courses
            </Typography>
          </Box>

          {/* Content Wrapper */}
          <Box sx={{ px: 4, pb: 4, width: '90%' }}>
            {/* Messages */}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontSize: '0.95rem' }}>
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.95rem' }}>
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* ===== SECTION 1: Student & Course Info ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#00D9A3',
                  }}
                />
                Course & Student Information
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Student ID"
                    name="student_id"
                    type="number"
                    value={formData.student_id}
                    onChange={handleTextChange}
                    required
                    variant="outlined"
                    size="medium"
                    inputProps={{
                      style: { MozAppearance: 'textfield' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#00D9A3',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00D9A3',
                          boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                      },
                      '& .MuiFormLabel-root.Mui-focused': {
                        color: '#00D9A3',
                      },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Course ID"
                    name="course_id"
                    type="number"
                    value={formData.course_id}
                    onChange={handleTextChange}
                    required
                    variant="outlined"
                    size="medium"
                    inputProps={{
                      style: { MozAppearance: 'textfield' },
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#00D9A3',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00D9A3',
                          boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                      },
                      '& .MuiFormLabel-root.Mui-focused': {
                        color: '#00D9A3',
                      },
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, opacity: 0.6 }} />

              {/* ===== SECTION 2: Tags (Languages & Outputs) ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#00D9A3',
                  }}
                />
                Course Content
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <LanguagesInput
                    value={formData.languages_learned}
                    onChange={(newLanguages) => handleTagChange('languages_learned', newLanguages)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CourseOutputsInput
                    value={formData.course_outputs}
                    onChange={(newOutputs) => handleTagChange('course_outputs', newOutputs)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, opacity: 0.6 }} />

              {/* ===== SECTION 3: Text Feedback ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#00D9A3',
                  }}
                />
                Your Feedback
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Industry Relevance"
                    name="industry_relevance_text"
                    multiline
                    rows={3}
                    value={formData.industry_relevance_text}
                    onChange={handleTextChange}
                    placeholder="How relevant is this course to the industry?"
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#00D9A3',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00D9A3',
                          boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                      },
                      '& .MuiFormLabel-root.Mui-focused': {
                        color: '#00D9A3',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instructor Feedback"
                    name="instructor_feedback"
                    multiline
                    rows={3}
                    value={formData.instructor_feedback}
                    onChange={handleTextChange}
                    placeholder="Your thoughts about the instructor and teaching quality"
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#00D9A3',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00D9A3',
                          boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                      },
                      '& .MuiFormLabel-root.Mui-focused': {
                        color: '#00D9A3',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="What You Found Useful"
                    name="useful_learning_text"
                    multiline
                    rows={3}
                    value={formData.useful_learning_text}
                    onChange={handleTextChange}
                    placeholder="What did you find most useful or impactful?"
                    variant="outlined"
                    size="medium"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: '#00D9A3',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00D9A3',
                          boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.95rem',
                      },
                      '& .MuiFormLabel-root.Mui-focused': {
                        color: '#00D9A3',
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, opacity: 0.6 }} />

              {/* ===== SECTION 4: Ratings ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 700,
                  color: '#1a1a1a',
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: '#00D9A3',
                  }}
                />
                Your Ratings
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: '#f8f8f8',
                    border: '2px solid #00D9A3',
                    p: 4,
                    borderRadius: 2.5,
                    width: '100%',
                    maxWidth: '600px',
                  }}
                >
                  <Grid container spacing={4}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          mb: 2.5,
                          fontWeight: 600,
                          color: '#1a1a1a',
                          fontSize: '0.95rem',
                        }}
                      >
                        Industry Relevance
                      </Typography>
                      <Rating
                        name="industry_relevance_rating"
                        value={formData.industry_relevance_rating}
                        onChange={(e, value) =>
                          handleRatingChange('industry_relevance_rating', value)
                        }
                        size="large"
                        sx={{
                          '& .MuiRating-icon': {
                            fontSize: '2rem',
                            color: '#00D9A3',
                          },
                          justifyContent: 'center',
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          mb: 2.5,
                          fontWeight: 600,
                          color: '#1a1a1a',
                          fontSize: '0.95rem',
                        }}
                      >
                        Instructor Quality
                      </Typography>
                      <Rating
                        name="instructor_rating"
                        value={formData.instructor_rating}
                        onChange={(e, value) =>
                          handleRatingChange('instructor_rating', value)
                        }
                        size="large"
                        sx={{
                          '& .MuiRating-icon': {
                            fontSize: '2rem',
                            color: '#00D9A3',
                          },
                          justifyContent: 'center',
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          mb: 2.5,
                          fontWeight: 600,
                          color: '#1a1a1a',
                          fontSize: '0.95rem',
                        }}
                      >
                        Usefulness & Learning
                      </Typography>
                      <Rating
                        name="useful_learning_rating"
                        value={formData.useful_learning_rating}
                        onChange={(e, value) =>
                          handleRatingChange('useful_learning_rating', value)
                        }
                        size="large"
                        sx={{
                          '& .MuiRating-icon': {
                            fontSize: '2rem',
                            color: '#00D9A3',
                          },
                          justifyContent: 'center',
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
                </Box>
              </Box>

              {/* ===== SUBMIT BUTTON ===== */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                  mt: 2,
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    backgroundColor: '#00D9A3',
                    color: '#1a1a1a',
                    width: 250,
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 15px rgba(25, 236, 184, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundcolor: '#00D9A3',
                      boxShadow: '0 6px 20px rgba(25, 236, 184, 0.4)',
                      transform: 'translateY(-2px)',
                    },
                    '&:disabled': {
                      boxShadow: 'none',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </Box>

              {/* ===== FINAL SCORE DISPLAY ===== */}
              {finalScore && (
                <Box
                  sx={{
                    mt: 2,
                    p: 3,
                    backgroundColor: '#f0fdf4',
                    borderRadius: 2,
                    border: '2px solid #ddd',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#00D9A3',
                      fontSize: '1.1rem',
                    }}
                  >
                    ✓ Final Score: {finalScore} / 10
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#059669',
                      mt: 1,
                      fontSize: '0.9rem',
                    }}
                  >
                    Thank you for your detailed feedback!
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default CourseReviewForm;
