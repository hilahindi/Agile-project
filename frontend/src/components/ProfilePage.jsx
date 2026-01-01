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
                setProfile(data);
setFormData({
                     name: data.name || '',
                     faculty: data.faculty || '',
                     year: data.year || '',
                     courses_taken: data.courses_taken || [],
                     career_goals: data.career_goals || [],
                     human_skills: data.human_skills || []
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
        <JobRolesGrid jobRoles={careerGoalOptions.map(g => ({ id: String(g.id), title: g.name, category: (g.technical_skills.concat(g.human_skills).join(', ') || '') }))}
            selectedGoals={selectedGoals}
            handleToggleGoal={goalId => {
                setSelectedGoals([goalId]);
                setFormData(prev => ({ ...prev, career_goals: [goalId] }));
                setCareerGoalsError('');
            }}
            singleSelect={true} />
        {careerGoalsError && <div style={{ color: '#dc3545', fontSize: 15, marginTop: 10 }}>{careerGoalsError}</div>}
    </div>
) : (
    <div className="tag-list">
        {(editMode ? formData.career_goals : profile.career_goals || []).map(id => {
            const goal = careerGoalOptions.find(g => String(g.id) === String(id));
            return (
                <span className="profile-tag" key={id}>{goal ? goal.name : id}</span>
            );
        })}
        {(editMode ? formData.career_goals : profile.career_goals || []).length === 0 && <span className="profile-hint">No goals.</span>}
    </div>
)}
                    </div>

                    
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