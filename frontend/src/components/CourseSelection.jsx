// frontend/src/components/CourseSelection.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authService';
import { getToken } from '../services/authService';
import CoursesGrid from './CoursesGrid';

const API_URL = 'http://localhost:8000';

const CourseSelection = ({ selectedCourses, onCoursesChange, onNext, onBack }) => {
    const { token } = useAuth();
    const [courses, setCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/courses/`);
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            setError(err.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCourse = (courseId) => {
        const isSelected = selectedCourses.includes(courseId);
        if (isSelected) {
            onCoursesChange(selectedCourses.filter(id => id !== courseId));
        } else {
            onCoursesChange([...selectedCourses, courseId]);
        }
    };

    // Extract course code from description (format: "CS101 - ...")
    const getCourseCode = (description) => {
        if (!description) return '';
        const match = description.match(/^([A-Z]+\d+)/);
        return match ? match[1] : '';
    };

    // Filter courses based on search query
    const filteredCourses = courses.filter(course => {
        const searchLower = searchQuery.toLowerCase();
        const courseName = course.name.toLowerCase();
        const courseCode = getCourseCode(course.description).toLowerCase();
        return courseName.includes(searchLower) || courseCode.includes(searchLower);
    });

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading courses...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorContainer}>
                    <p style={styles.error}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Progress Indicator */}
            <div style={styles.progressContainer}>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconCompleted}>1</div>
                    <div style={styles.progressLabelCompleted}>Basic Info</div>
                </div>
                <div style={styles.progressLineCompleted}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconActive}>2</div>
                    <div style={styles.progressLabelActive}>Courses</div>
                </div>
                <div style={styles.progressLine}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIcon}>3</div>
                    <div style={styles.progressLabel}>Career Goals</div>
                </div>
                <div style={styles.progressLine}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIcon}>4</div>
                    <div style={styles.progressLabel}>Human Skills</div>
                </div>
            </div>
            
            {/* Form Card */}
            <div style={styles.card}>
                <h2 style={styles.sectionTitle}>Completed Courses</h2>
                <p style={styles.instruction}>
                    Select courses you've already completed ({selectedCourses.length} selected)
                </p>

                {/* Search Bar */}
                <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                />

                {/* Course List */}
                <CoursesGrid
                    filteredCourses={filteredCourses}
                    selectedCourses={selectedCourses}
                    handleToggleCourse={handleToggleCourse}
                    getCourseCode={getCourseCode}
                    styles={styles}
                />

                {/* Navigation Buttons */}
                <div style={styles.buttonContainer}>
                    <button
                        type="button"
                        onClick={onBack}
                        style={styles.backButton}
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        style={styles.continueButton}
                    >
                        Continue →
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    loading: {
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#666',
    },
    errorContainer: {
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '100%',
    },
    error: {
        color: '#721c24',
        margin: 0,
        fontSize: '14px',
    },
    progressContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '40px',
        maxWidth: '800px',
        width: '100%',
    },
    progressStep: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
    },
    progressIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#e0e0e0',
        color: '#999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    progressIconCompleted: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#10b981',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressIconActive: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#00D9A3',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressLabel: {
        fontSize: '12px',
        color: '#999',
    },
    progressLabelCompleted: {
        fontSize: '12px',
        color: '#10b981',
        fontWeight: '600',
    },
    progressLabelActive: {
        fontSize: '12px',
        color: '#00D9A3',
        fontWeight: '600',
    },
    progressLine: {
        width: '60px',
        height: '2px',
        backgroundColor: '#e0e0e0',
        margin: '0 10px',
    },
    progressLineCompleted: {
        width: '60px',
        height: '2px',
        backgroundColor: '#10b981',
        margin: '0 10px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px',
        maxWidth: '800px',
        width: '100%',
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
    },
    subtitle: {
        fontSize: '16px',
        color: '#666',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        width: '100%',
    },
    sectionTitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
    },
    instruction: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '24px',
    },
    searchInput: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '16px',
        marginBottom: '24px',
        boxSizing: 'border-box',
    },
    courseList: {
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '32px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
    },
    courseItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e0e0e0',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        marginRight: '16px',
        cursor: 'pointer',
    },
    courseInfo: {
        flex: 1,
    },
    courseName: {
        fontSize: '16px',
        fontWeight: '500',
        color: '#333',
        marginBottom: '4px',
    },
    courseCode: {
        fontSize: '14px',
        color: '#666',
    },
    credits: {
        fontSize: '14px',
        color: '#666',
        fontWeight: '500',
        marginLeft: '16px',
    },
    noResults: {
        textAlign: 'center',
        padding: '40px',
        color: '#999',
        fontSize: '16px',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '32px',
        gap: '16px',
    },
    backButton: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: '#f5f5f5',
        color: '#333',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        flex: 1,
    },
    continueButton: {
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#00D9A3',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
};

export default CourseSelection;

