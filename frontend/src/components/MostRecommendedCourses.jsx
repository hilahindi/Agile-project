import React, { useEffect, useState } from 'react';
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
  IconButton,
  Collapse,
  Button,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../services/authService';
import { getCourseRecommendations } from '../services/recommendationService';
import { useNavigate } from 'react-router-dom';

const MostRecommendedCourses = () => {
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [openMap, setOpenMap] = useState({});

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCourseRecommendations({ k: 10, enforce_prereqs: true });
      setData(res);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRecommendations();
    }
  }, [token]);

  if (!token) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Most Recommended Courses" />
        <CardContent>
          <Typography>Please log in to view personalized recommendations.</Typography>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Most Recommended Courses" />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', minHeight: 180 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader title="Most Recommended Courses" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // ===== HANDLE BLOCKED RECOMMENDATION (soft blocker) =====
  if (data?.blocked_reason) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader
          title="Most Recommended Courses"
          action={
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchRecommendations}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {data.blocked_reason}
            </Typography>
          </Alert>

          {data.missing_human_skills && data.missing_human_skills.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Required human skills to develop:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {data.missing_human_skills.map((skill) => (
                  <Chip
                    key={skill.skill_id}
                    label={skill.name}
                    variant="outlined"
                    color="error"
                  />
                ))}
              </Stack>
            </Box>
          )}

          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/profile')}
          >
            Update Your Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ===== HANDLE NO RECOMMENDATIONS =====
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <Card sx={{ mt: 3 }}>
        <CardHeader
          title="Most Recommended Courses"
          action={
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchRecommendations}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <Typography color="textSecondary" sx={{ mb: 2 }}>
            No recommendations available yet. Complete your profile with a career goal and human skills to get personalized recommendations.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/profile')}
          >
            Complete Your Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  const toggle = (id) => {
    setOpenMap((m) => ({ ...m, [id]: !m[id] }));
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardHeader
        title="Most Recommended Courses"
        action={
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchRecommendations}
          >
            Refresh
          </Button>
        }
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>#</TableCell>
                <TableCell>Course Name</TableCell>
                <TableCell align="right">Final Score</TableCell>
                <TableCell align="right">Avg Review (Count)</TableCell>
                <TableCell align="right">Career Fit</TableCell>
                <TableCell align="right">Affinity</TableCell>
                <TableCell align="right">Quality</TableCell>
                <TableCell align="center">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recommendations.map((rec, idx) => (
                <React.Fragment key={rec.course_id}>
                  <TableRow hover>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography
                        onClick={() => navigate(`/courses/${rec.course_id}`)}
                        sx={{ cursor: 'pointer', color: '#1976d2', textDecoration: 'underline' }}
                      >
                        {rec.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 600 }}>
                        {(rec.final_score * 10).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {rec.avg_score_raw !== null ? (
                        <Typography>
                          {rec.avg_score_raw.toFixed(1)} ({rec.review_count})
                        </Typography>
                      ) : (
                        <Typography color="textSecondary">- ({rec.review_count})</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {rec.breakdown?.s_role?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      {rec.breakdown?.s_affinity?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="right">
                      {rec.breakdown?.q_smoothed?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => toggle(rec.course_id)}>
                        <ExpandMoreIcon
                          sx={{
                            transform: openMap[rec.course_id] ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s',
                          }}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* EXPAND DETAILS ROW */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0, borderBottom: '1px solid #eee' }}>
                      <Collapse in={openMap[rec.course_id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                          {/* Matched Technical Skills */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Matched Technical Skills
                            </Typography>
                            {rec.matched_technical_skills && rec.matched_technical_skills.length > 0 ? (
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                {rec.matched_technical_skills.map((skill) => (
                                  <Chip
                                    key={skill.skill_id}
                                    label={`${skill.name} (${skill.relevance_score.toFixed(2)})`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                            ) : (
                              <Typography color="textSecondary" variant="body2">
                                None
                              </Typography>
                            )}
                          </Box>

                          {/* Missing Technical Skills */}
                          {rec.missing_technical_skills && rec.missing_technical_skills.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Missing Technical Skills
                              </Typography>
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                {rec.missing_technical_skills.map((skillId) => (
                                  <Chip
                                    key={skillId}
                                    label={`Skill #${skillId}`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {/* Soft Readiness & Human Skills */}
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Goal Alignment
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Soft Readiness: <strong>{(data.soft_readiness * 100).toFixed(0)}%</strong>
                            </Typography>

                            {data.overlap_human_skills && data.overlap_human_skills.length > 0 && (
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  Your Human Skills:
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {data.overlap_human_skills.map((skill) => (
                                    <Chip
                                      key={skill.skill_id}
                                      label={skill.name}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Box>

                          {/* Affinity Explanation */}
                          {rec.affinity_explanation && rec.affinity_explanation.top_contributing_courses && rec.affinity_explanation.top_contributing_courses.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Affinity Explanation
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                Based on your completed courses:
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {rec.affinity_explanation.top_contributing_courses.map((course, idx) => (
                                  <Box key={idx} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #e0e0e0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                      {course.completed_course_name}
                                    </Typography>
                                    <Box sx={{ ml: 1, mt: 0.5 }}>
                                      <Typography variant="caption">
                                        Similarity: <strong>{course.similarity_score.toFixed(2)}</strong>
                                      </Typography>
                                      {course.cluster_matched && (
                                        <Typography variant="caption" sx={{ display: 'block', color: 'green' }}>
                                          ✓ Shared cluster
                                        </Typography>
                                      )}
                                      <Typography variant="caption" sx={{ display: 'block' }}>
                                        Tech Overlap: <strong>{course.tech_overlap_score.toFixed(2)}</strong>
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          )}

                          {(!rec.affinity_explanation || !rec.affinity_explanation.top_contributing_courses || rec.affinity_explanation.top_contributing_courses.length === 0) && (
                            <Typography variant="caption" color="textSecondary">
                              No affinity data available (no completed courses yet).
                            </Typography>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Info: Total recommendations shown */}
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'textSecondary' }}>
          Showing {data.recommendations.length} recommendation{data.recommendations.length !== 1 ? 's' : ''}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MostRecommendedCourses;
