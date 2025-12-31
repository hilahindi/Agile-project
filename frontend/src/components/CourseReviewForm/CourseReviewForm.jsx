import React, { useState, useEffect } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import LanguagesInput from './LanguagesInput';
import CourseOutputsInput from './CourseOutputsInput';
import { useAuth } from '../../services/authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Reusable TextField styling
const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&:hover fieldset': {
      borderColor: '#00D9A3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00D9A3',
      boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '16px',
  },
  '& .MuiFormLabel-root.Mui-focused': {
    color: '#00D9A3',
  },
};

// Reusable Select styling (same as TextField)
const selectSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&:hover fieldset': {
      borderColor: '#00D9A3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00D9A3',
      boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '16px',
  },
  '& .MuiFormLabel-root.Mui-focused': {
    color: '#00D9A3',
  },
};

const CourseReviewForm = () => {
  const { currentUser, token } = useAuth();
  
  // Courses list state
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  
  const [formData, setFormData] = useState({
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

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true);
        setCoursesError('');
        const url = `${API_BASE_URL}/courses/?skip=0&limit=100`;
        console.log(`[CourseSelect] Fetching from: ${url}`);
        
        const response = await fetch(url);
        console.log(`[CourseSelect] Response status: ${response.status}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[CourseSelect] Error ${response.status}: ${errorText}`);
          setCoursesError(`HTTP ${response.status}`);
          setCoursesLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log(`[CourseSelect] Received courses:`, data);
        
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
        } else {
          console.warn('[CourseSelect] No courses in response');
          setCourses([]);
        }
        setCoursesLoading(false);
      } catch (error) {
        console.error('[CourseSelect] Fetch failed:', error.message);
        setCoursesError(error.message || 'Failed to load courses');
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Validate form data before submission
  const validateFormData = () => {
    if (!formData.course_id) {
      setErrorMessage('Please select a course');
      return false;
    }

    const maxTextLength = 500;
    if (formData.industry_relevance_text.length > maxTextLength) {
      setErrorMessage(`Industry Relevance feedback must be under ${maxTextLength} characters`);
      return false;
    }
    if (formData.instructor_feedback.length > maxTextLength) {
      setErrorMessage(`Instructor feedback must be under ${maxTextLength} characters`);
      return false;
    }
    if (formData.useful_learning_text.length > maxTextLength) {
      setErrorMessage(`Useful Learning feedback must be under ${maxTextLength} characters`);
      return false;
    }

    return true;
  };

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
    if (!currentUser) {
      setErrorMessage('You must be logged in to submit a review');
      return;
    }

    if (!validateFormData()) {
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
      // Construct payload WITHOUT student_id - it's added by the server from auth context
      const payload = {
        course_id: typeof formData.course_id === 'string' ? parseInt(formData.course_id) : formData.course_id,
        languages_learned: formData.languages_learned.join(', ') || null,
        course_outputs: formData.course_outputs.join(', ') || null,
        industry_relevance_text: formData.industry_relevance_text || null,
        instructor_feedback: formData.instructor_feedback || null,
        useful_learning_text: formData.useful_learning_text || null,
        industry_relevance_rating: formData.industry_relevance_rating,
        instructor_rating: formData.instructor_rating,
        useful_learning_rating: formData.useful_learning_rating,
      };

      const response = await fetch(`${API_BASE_URL}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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

      // Reset form but keep course_id if user wants to submit another review for same course
      setFormData({
        course_id: formData.course_id,
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
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <Card
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 900,
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                fontWeight: 'bold',
                fontSize: '28px',
                color: '#333',
              }}
            >
              Course Review
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: '16px',
                fontWeight: 400,
                color: '#666',
              }}
            >
              Share your feedback and help other students discover great courses
            </Typography>
          </Box>

          {/* Content Wrapper */}
          <Box sx={{ px: 4, pb: 4, minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Messages */}
            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: '8px', fontSize: '14px' }}>
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', fontSize: '14px' }}>
                {errorMessage}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {/* ===== SECTION 1: Course Info & User Authentication ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '14px',
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
                Course Information
              </Typography>

              {currentUser && (
                <Alert 
                  severity="info" 
                  sx={{ mb: 3, borderRadius: '8px', fontSize: '14px' }}
                >
                  Logged in as: <strong>{currentUser.name}</strong>
                </Alert>
              )}

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <FormControl 
                    fullWidth 
                    required 
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#00D9A3 !important',
                        },
                      },
                    }}
                  >
                    <InputLabel 
                      id="course-select-label"
                      sx={{ 
                        fontSize: '16px',
                        '&.Mui-focused': {
                          color: '#00D9A3',
                        },
                      }}
                    >
                      Course
                    </InputLabel>
                    <Select
                      labelId="course-select-label"
                      id="course-select"
                      value={formData.course_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          course_id: e.target.value,
                        }))
                      }
                      label="Course"
                      sx={{
                        width: '100%',
                        minWidth: '300px',
                        borderRadius: '8px',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#fff',
                          '& fieldset': {
                            borderColor: '#ddd',
                          },
                          '&:hover fieldset': {
                            borderColor: '#00D9A3',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#00D9A3 !important',
                            boxShadow: '0 0 0 3px rgba(0, 217, 163, 0.1)',
                          },
                        },
                        '& .MuiOutlinedInput-input': {
                          padding: '16px 14px',
                          fontSize: '16px',
                        },
                        '& .MuiFormLabel-root.Mui-focused': {
                          color: '#00D9A3',
                        },
                      }}
                    >
                      {/* Loading state */}
                      {coursesLoading && (
                        <MenuItem disabled>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#666' }}>
                            <CircularProgress size={16} />
                            <span>Loading courses...</span>
                          </Box>
                        </MenuItem>
                      )}

                      {/* Error state */}
                      {coursesError && !coursesLoading && courses.length === 0 && (
                        <MenuItem disabled sx={{ color: '#d32f2f' }}>
                          Failed to load courses
                        </MenuItem>
                      )}

                      {/* Courses list */}
                      {courses.length > 0 &&
                        courses.map((course) => (
                          <MenuItem 
                            key={course.id} 
                            value={course.id}
                            sx={{
                              fontSize: '16px',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 217, 163, 0.1)',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(0, 217, 163, 0.15)',
                                color: '#00D9A3',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 217, 163, 0.2)',
                                },
                              },
                            }}
                          >
                            {course.id} - {course.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, opacity: 0.6 }} />

              {/* ===== SECTION 2: Tags (Languages & Outputs) ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '14px',
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
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '14px',
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
                    sx={textFieldSx}
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
                    sx={textFieldSx}
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
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, opacity: 0.6 }} />

              {/* ===== SECTION 4: Ratings ===== */}
              <Typography
                variant="h6"
                sx={{
                  mb: 3,
                  fontWeight: 600,
                  color: '#333',
                  fontSize: '14px',
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
                    borderRadius: '8px',
                    width: '100%',
                  }}
                >
                  <Grid container spacing={4}>
                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 2.5,
                            fontWeight: 600,
                            color: '#333',
                            fontSize: '16px',
                          }}
                        >
                          Industry Relevance
                        </Typography>
                        <Rating
                          name= "industry_relevance_rating"
                          value={formData.industry_relevance_rating}
                          onChange={(e, value) =>
                            handleRatingChange('industry_relevance_rating', value)
                          }
                          size="large"
                          aria-label="Industry Relevance Rating"
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

                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 2.5,
                            fontWeight: 600,
                            color: '#333',
                            fontSize: '16px',
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
                          aria-label="Instructor Quality Rating"
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

                    <Grid item xs={12} sm={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography
                          variant="body1"
                          sx={{
                            mb: 2.5,
                            fontWeight: 600,
                            color: '#333',
                            fontSize: '16px',
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
                          aria-label="Usefulness & Learning Rating"
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
                    color: 'white',
                    width: 250,
                    fontWeight: 600,
                    fontSize: '16px',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#00b386',
                      boxShadow: '0 4px 12px rgba(0, 217, 163, 0.13)',
                    },
                    '&:disabled': {
                      backgroundColor: '#9ca3af',
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
                      fontWeight: 600,
                      color: '#00D9A3',
                      fontSize: '18px',
                    }}
                  >
                    ✓ Final Score: {finalScore} / 10
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#666',
                      mt: 1,
                      fontSize: '14px',
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
