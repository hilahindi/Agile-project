import React, { useEffect, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAuth } from '../services/authService';
import CoursesGrid from './CoursesGrid';
import JobRolesGrid from './JobRolesGrid';
import { JobRoles } from '../utils';
import './ProfilePage.css';
import { DEPARTMENTS, YEARS } from '../utils';

const API_URL = 'http://localhost:8000';

const ProfilePage = () => {
    const [allStudents, setAllStudents] = useState([]);
    const { currentUser, token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [nameError, setNameError] = useState(null);
    const [selectedGoals, setSelectedGoals] = useState([]);
    const [showCourseSelector, setShowCourseSelector] = useState(false);
    const [showGoalsSelector, setShowGoalsSelector] = useState(false);
    const [courses, setCourses] = useState([]);
    const [toastOpen, setToastOpen] = useState(false);

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
                setProfile(data);
                setFormData({
                    name: data.name || '',
                    faculty: data.faculty || '',
                    year: data.year || '',
                    courses_taken: data.courses_taken || [],
                    career_goals: data.career_goals || [],
                });
                setSelectedGoals(data.career_goals || []);
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
    }, [currentUser, token]);

    function handleChange(e) {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'name' && allStudents) {
            const exists = allStudents.some(s => s.name?.toLowerCase() === value.toLowerCase() && s.id !== currentUser.id);
            setNameError(exists ? 'Name already taken.' : null);
        }
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
    };

    const handleToastClose = (event, reason) => {
        if (reason === 'clickaway') return;
        setToastOpen(false);
    };

    async function handleSave(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/students/${currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });
            const updated = await res.json();
            setProfile(updated);
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
                            setEditMode(false); 
                            setFormData(profile); 
                            setSelectedGoals(profile.career_goals || []);
                            setShowCourseSelector(false);
                            setShowGoalsSelector(false);
                        }}>Cancel</button>
                    )}
                </div>

                <form onSubmit={handleSave} className="profile-form">
                    {/* Basic Info using Labels */}
                    <label className="profile-section">
                        <span className="section-title">Name:</span>
                        {editMode ? (
                            <input type="text" name="name" value={formData.name} className="profile-input" onChange={handleChange} autoFocus />
                        ) : (
                            <div className="read-value">{profile.name}</div>
                        )}
                        {editMode && nameError && <span className="field-error">{nameError}</span>}
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
                            <button type="button" className="inline-edit-btn" onClick={() => setShowCourseSelector(!showCourseSelector)}>
                                {showCourseSelector ? 'Done Selecting' : 'Edit Courses'}
                            </button>
                        )}
                        {editMode && showCourseSelector ? (
                            <div className="selector-wrapper">
                                <CoursesGrid
                                    filteredCourses={courses}
                                    selectedCourses={formData.courses_taken || []}
                                    handleToggleCourse={handleToggleCourse}
                                    getCourseCode={(desc) => desc?.match(/^([A-Z]+\d+)/)?.[1] || ''}
                                />
                            </div>
                        ) : (
                            <div className="tag-list">
                                {(editMode ? formData.courses_taken : profile.courses_taken || []).map(courseId => {
                                    const c = courses.find(item => item.id === courseId) || profile.course_catalog?.find(item => item.id === courseId);
                                    return <span className="profile-tag" key={courseId}>{c?.name || courseId}</span>;
                                })}
                                {(editMode ? formData.courses_taken : profile.courses_taken || []).length === 0 && <span className="profile-hint">No courses.</span>}
                            </div>
                        )}
                    </div>

                    <div className="profile-section">
                        <span className="section-title">Career Goals:</span>
                        {editMode && (
                            <button type="button" className="inline-edit-btn" onClick={() => setShowGoalsSelector(!showGoalsSelector)}>
                                {showGoalsSelector ? 'Done Selecting' : 'Edit Goals'}
                            </button>
                        )}
                        {editMode && showGoalsSelector ? (
                            <div className="selector-wrapper">
                                <JobRolesGrid jobRoles={JobRoles} selectedGoals={selectedGoals} handleToggleGoal={handleToggleGoal} />
                            </div>
                        ) : (
                            <div className="tag-list">
                                {(editMode ? formData.career_goals : profile.career_goals || []).map(id => (
                                    <span className="profile-tag" key={id}>{goalIdToName(id)}</span>
                                ))}
                                {(editMode ? formData.career_goals : profile.career_goals || []).length === 0 && <span className="profile-hint">No goals.</span>}
                            </div>
                        )}
                    </div>

                    {editMode && (
                        <div className="button-row-center">
                            <button type="submit" className="apply-btn" disabled={loading}>Apply Changes</button>
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