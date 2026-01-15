import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAuth } from '../services/authService';
import CoursesGrid from './CoursesGrid';
import JobRolesGrid from './JobRolesGrid';
import './ProfilePage.css';
import { DEPARTMENTS, YEARS } from '../utils';

const API_URL = 'http://localhost:8000';

const ProfilePage = () => {
    const [careerGoalsError, setCareerGoalsError] = useState('');
    const [allStudents, setAllStudents] = useState([]);
    const { currentUser, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [showCourseSelector, setShowCourseSelector] = useState(false);
    const [showGoalsSelector, setShowGoalsSelector] = useState(false);
    const [courses, setCourses] = useState([]);
    const [toastOpen, setToastOpen] = useState(false);
    const [careerGoalOptions, setCareerGoalOptions] = useState([]);
    const [showSkillsSelector, setShowSkillsSelector] = useState(false);
    const [humanSkillOptions, setHumanSkillOptions] = useState([]);

    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        body.style.overflowX = 'hidden';
        html.style.overflowX = 'hidden';
        
        if (editMode) {
            body.style.overflowY = 'auto';
        }

        return () => {
            body.style.overflow = '';
            html.style.overflow = '';
        };
    }, [editMode]);

    useEffect(() => {
        async function fetchProfile() {
            setLoading(true);
            try {
                if (!token || !currentUser) throw new Error('Not authenticated');
                const res = await fetch(`${API_URL}/students/${currentUser.id}`);
                const data = await res.json();
                // Normalize backend response to frontend shape:
                // - backend returns `career_goal` (object) and `human_skill_ids`.
                // - frontend expects `career_goals` (array of ids) and `human_skills` (array of ids).
                const normalized = {
                    ...data,
                    // career goals used as string ids for JobRolesGrid
                    career_goals: data.career_goal ? [String(data.career_goal.id)] : (data.career_goals || []),
                    // ensure human skill ids and course ids are numbers for lookups
                    human_skills: (data.human_skill_ids || data.human_skills || []).map(id => Number(id)),
                    courses_taken: (data.courses_taken || []).map(id => Number(id)),
                };
                setProfile(normalized);
                setFormData({
                    name: normalized.name || '',
                    faculty: normalized.faculty || '',
                    year: normalized.year || '',
                    courses_taken: normalized.courses_taken || [],
                    career_goals: normalized.career_goals || [],
                    human_skills: normalized.human_skills || []
                });
                setSelectedGoals(normalized.career_goals || []);
            } catch(e) {
                setError(e.message);
            }
            setLoading(false);
        }
        async function fetchCourses() {
            try {
                const response = await fetch(`${API_URL}/courses/`);
                const data = await response.json();
                setCourses(data);
            } catch (e) { console.error(e); }
        }
        fetchProfile();
        fetchCourses();
        fetch(`${API_URL}/students/?skip=0&limit=100`)
            .then(res => res.json())
            .then(data => setAllStudents(data));
        fetch(`${API_URL}/career-goals/`)
            .then(res => res.json())
            .then(data => setCareerGoalOptions(data));
        fetch(`${API_URL}/skills/?type=human`).then(res => res.json()).then(setHumanSkillOptions);
    }, [currentUser, token]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    const handleToggleCourse = (courseId) => {
        const currentTaken = formData.courses_taken || [];
        const isSelected = currentTaken.includes(courseId);
        const newCourses = isSelected 
            ? currentTaken.filter(id => id !== courseId)
            : [...currentTaken, courseId];
        // Grid strictly updates data; visibility state (showCourseSelector) is NOT touched
        setFormData(prev => ({ ...prev, courses_taken: newCourses }));
    };

    const handleToggleGoal = (goalId) => {
        const currentGoals = formData.career_goals || [];
        const isSelected = currentGoals.includes(goalId);
        const newGoals = isSelected
            ? currentGoals.filter(id => id !== goalId)
            : [...currentGoals, goalId];

        setSelectedGoals(newGoals);
        setFormData(prev => ({ ...prev, career_goals: newGoals }));
        setCareerGoalsError(newGoals.length === 0 ? 'Please select at least one career goal.' : '');
    };

    const handleToastClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setToastOpen(false);
    };

    async function handleSave(e) {
        e.preventDefault();
        if ((formData.career_goals || []).length === 0) {
            setCareerGoalsError('Please select at least one career goal.');
            return;
        } else {
            setCareerGoalsError('');
        }
        setLoading(true);
            try {
            // Convert frontend form shape to backend-friendly payload
            const payload = {
                ...formData,
                career_goal_id: (formData.career_goals && formData.career_goals.length > 0) ? parseInt(formData.career_goals[0]) : null,
                human_skill_ids: formData.human_skills || formData.human_skill_ids || [],
                courses_taken: formData.courses_taken || [],
            };
            const res = await fetch(`${API_URL}/students/${currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });
            const updated = await res.json();
            // Normalize returned student as well
            const updatedNormalized = {
                ...updated,
                career_goals: updated.career_goal ? [String(updated.career_goal.id)] : (updated.career_goals || []),
                human_skills: (updated.human_skill_ids || updated.human_skills || []).map(id => Number(id)),
                courses_taken: (updated.courses_taken || []).map(id => Number(id)),
            };
            setProfile(updatedNormalized);
            setEditMode(false);

            // Trigger the toast notification instead of setting a success boolean
            setToastOpen(true); 
        } catch(e) { 
            setError(e.message); 
        } finally { 
            setLoading(false); 
        }
    }

    if (loading) return <div className="loading-state">Loading...</div>;

    const goalIdToName = (id) => {
        const MAP = {
            backend: 'Backend Developer', frontend: 'Frontend Developer',
            fullstack: 'Full Stack Developer', mobile: 'Mobile Developer',
            datascientist: 'Data Scientist', dataanalyst: 'Data Analyst',
            mlengineer: 'ML Engineer', devops: 'DevOps Engineer',
            cloudarchitect: 'Cloud Architect', uxdesigner: 'UX Designer',
            qaengineer: 'QA Engineer', securityengineer: 'Security Engineer',
            productmanager: 'Product Manager', embeddedsystems: 'Embedded Systems'
        };
        return MAP[id] || id;
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="card-header">
                    <h2 className="profile-header">My Profile</h2>
                    {!editMode ? (
                        <button className="edit-btn" onClick={() => setEditMode(true)}>Edit</button>
                    ) : (
                        <button className="done-btn" onClick={() => { 
                            // Exit edit mode and restore normalized profile values into formData
                            setEditMode(false);
                            const p = profile || {};
                            setFormData({
                                name: p.name || '',
                                faculty: p.faculty || '',
                                year: p.year || '',
                                courses_taken: p.courses_taken || [],
                                career_goals: p.career_goals || [],
                                human_skills: p.human_skills || []
                            });
                            setSelectedGoals(p.career_goals || []);
                            setShowCourseSelector(false);
                            setShowGoalsSelector(false);
                        }}>Cancel</button>
                    )}
                </div>

                <form onSubmit={handleSave} className="profile-form">
                    {/* Basic Info using Labels */}
                    <label className="profile-section">
                        <span className="section-title">Name:</span>
                        <div className="read-value">{profile.name}</div>
                    </label>

                    <label className="profile-section">
                        <span className="section-title">Department:</span>
                        {editMode ? (
                            <select name="faculty" value={formData.faculty} className="profile-input" onChange={handleChange}>
                                {DEPARTMENTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <div className="read-value">{profile.faculty}</div>
                        )}
                    </label>

                    <label className="profile-section">
                        <span className="section-title">Year:</span>
                        {editMode ? (
                            <select name="year" value={formData.year} className="profile-input" onChange={handleChange}>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        ) : (
                            <div className="read-value">{profile.year}</div>
                        )}
                    </label>

                    {/* Complex Sections using DIVS to prevent Event Bubbling */}
                    <div className="profile-section">
                        <span className="section-title">Courses Taken:</span>
                        {editMode && (
                            <button type="button" className="inline-edit-btn" onClick={() => {
                                setShowCourseSelector(prev => {
                                    // If closing, reset formData to current profile
                                    if (prev) {
                                        setFormData(f => ({
                                            ...f,
                                            courses_taken: profile.courses_taken || []
                                        }));
                                    }
                                    return !prev;
                                });
                            }}>
                                {showCourseSelector ? 'Done Selecting' : 'Edit Courses'}
                            </button>
                        )}
                        {editMode && showCourseSelector ? (
                            <div className="selector-wrapper">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {courses.map(course => (
                                        <label key={course.id} style={{
                                            border: '1px solid #ccc', borderRadius: 8, padding: 10, margin: 2,
                                            background: (formData.courses_taken || []).includes(course.id) ? '#00D9A3' : '#f4f4f4',
                                            color: (formData.courses_taken || []).includes(course.id) ? 'white' : 'black',
                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.courses_taken || []).includes(course.id)}
                                                onChange={() => {
                                                    const current = formData.courses_taken || [];
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        courses_taken: current.includes(course.id)
                                                            ? current.filter(id => id !== course.id)
                                                            : [...current, course.id]
                                                    }));
                                                }}
                                                style={{ marginRight: 8 }}
                                            />
                                            {course.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="tag-list">
                                {(profile.courses_taken || []).map(courseId => {
                                    const c = courses.find(item => item.id === courseId) || profile.course_catalog?.find(item => item.id === courseId);
                                    return <span className="profile-tag" key={courseId}>{c?.name || courseId}</span>;
                                })}
                                {(profile.courses_taken || []).length === 0 && <span className="profile-hint">No courses.</span>}
                            </div>
                        )}
                    </div>

                    <div className="profile-section">
                        <span className="section-title">Career Goals:</span>
                        {editMode && (
                            <button type="button" className="inline-edit-btn" onClick={() => {
                                setShowGoalsSelector(prev => {
                                    // If closing, reset formData to current profile
                                    if (prev) {
                                        setFormData(f => ({
                                            ...f,
                                            career_goals: profile.career_goals || []
                                        }));
                                        setSelectedGoals(profile.career_goals || []);
                                    }
                                    return !prev;
                                });
                            }}>
                                {showGoalsSelector ? 'Done Selecting' : 'Edit Goals'}
                            </button>
                        )}
                        {editMode && showGoalsSelector ? (
                            <div className="selector-wrapper">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {careerGoalOptions.map(goal => (
                                        <label key={goal.id} style={{
                                            border: '1px solid #ccc', borderRadius: 8, padding: 10, margin: 2,
                                            background: (formData.career_goals || [])[0] === String(goal.id) ? '#00D9A3' : '#f4f4f4',
                                            color: (formData.career_goals || [])[0] === String(goal.id) ? 'white' : 'black',
                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.career_goals || [])[0] === String(goal.id)}
                                                onChange={() => {
                                                    // If already selected, unselect; else select only this
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        career_goals: (formData.career_goals || [])[0] === String(goal.id)
                                                            ? []
                                                            : [String(goal.id)]
                                                    }));
                                                    setSelectedGoals((formData.career_goals || [])[0] === String(goal.id)
                                                        ? []
                                                        : [String(goal.id)]);
                                                    setCareerGoalsError('');
                                                }}
                                                style={{ marginRight: 8 }}
                                            />
                                            {goal.name}
                                        </label>
                                    ))}
                                </div>
                                {careerGoalsError && <div style={{ color: '#dc3545', fontSize: 15, marginTop: 10 }}>{careerGoalsError}</div>}
                            </div>
                        ) : (
                            <div className="tag-list">
                                {(profile.career_goals || []).map(id => {
                                    const goal = careerGoalOptions.find(g => String(g.id) === String(id));
                                    return (
                                        <span className="profile-tag" key={id}>{goal ? goal.name : id}</span>
                                    );
                                })}
                                {(profile.career_goals || []).length === 0 && <span className="profile-hint">No goals.</span>}
                            </div>
                        )}
                    </div>
                    {/* </div> */}

                    
                    {/* Editable Human Skills Section */}
                    <div className="profile-section">
                        <span className="section-title">Human Skills:</span>
                        {editMode && (
                            <button type="button" className="inline-edit-btn" onClick={() => setShowSkillsSelector(!showSkillsSelector)}>
                                {showSkillsSelector ? 'Done Selecting' : 'Edit Human Skills'}
                            </button>
                        )}
                        {editMode && showSkillsSelector ? (
                            <div className="selector-wrapper">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                    {humanSkillOptions.map(skill => (
                                        <label key={skill.id} style={{
                                            border: '1px solid #ccc', borderRadius: 8, padding: 10, margin: 2,
                                            background: (formData.human_skills || []).includes(skill.id) ? '#00D9A3' : '#f4f4f4',
                                            color: (formData.human_skills || []).includes(skill.id) ? 'white' : 'black',
                                            fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={(formData.human_skills || []).includes(skill.id)}
                                                onChange={() => {
                                                    const current = formData.human_skills || [];
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        human_skills: current.includes(skill.id)
                                                            ? current.filter(id => id !== skill.id)
                                                            : [...current, skill.id]
                                                    }));
                                                }}
                                                style={{ marginRight: 8 }}
                                            />
                                            {skill.name}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="tag-list">
                                {((editMode ? formData.human_skills : profile.human_skills) || []).map(id => {
                                    const skill = humanSkillOptions.find(x => x.id === id);
                                    return (
                                        <span className="profile-tag" key={id}>{skill ? skill.name : id}</span>
                                    );
                                })}
                                {((editMode ? formData.human_skills : profile.human_skills) || []).length === 0 && <span className="profile-hint">No skills.</span>}
                            </div>
                        )}
                    </div>
                {editMode && (
                    <div className="button-row-center" style={{ marginTop: 32 }}>
                        <button type="submit" className="apply-btn" disabled={loading || (editMode && (formData.career_goals?.length === 0))}>Apply Changes</button>
                    </div>
                )}
            </form>
            </div>

            <Snackbar 
                open={toastOpen} 
                autoHideDuration={4000} 
                onClose={handleToastClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleToastClose} 
                    severity="success" 
                    variant="filled"
                    sx={{ width: '100%', backgroundColor: '#00D9A3' }}
                >
                    Profile updated successfully!
                </Alert>
            </Snackbar>
        </div>
    );
};

export default ProfilePage;