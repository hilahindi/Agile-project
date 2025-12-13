// frontend/src/components/ProfileSetup.jsx

import React, { useState } from 'react';
import { useAuth } from '../services/authService';
import { getToken } from '../services/authService';
import CourseSelection from './CourseSelection';

const API_URL = 'http://localhost:8000';

const BasicInfoStep = ({ department, year, onDepartmentChange, onYearChange, errors, onNext, onBack }) => {
    const departments = ['Computer Science'];

    return (
        <div style={styles.card}>
            <h1 style={styles.title}>Basic Information</h1>
            <p style={styles.subtitle}>Tell us about your academic status</p>

            <form onSubmit={(e) => { e.preventDefault(); onNext(); }} style={styles.form}>
                {/* Department Field */}
                <div style={styles.fieldContainer}>
                    <label style={styles.label}>
                        Department <span style={styles.required}>*</span>
                    </label>
                    <select
                        value={department}
                        onChange={(e) => onDepartmentChange(e.target.value)}
                        style={{
                            ...styles.select,
                            borderColor: errors.department ? '#dc3545' : '#ddd',
                            borderWidth: errors.department ? '2px' : '1px'
                        }}
                        required
                    >
                        {departments.map((dept) => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                    {errors.department && (
                        <p style={styles.fieldError}>{errors.department}</p>
                    )}
                </div>

                {/* Year of Study Field */}
                <div style={styles.fieldContainer}>
                    <label style={styles.label}>
                        Year of Study <span style={styles.required}>*</span>
                    </label>
                    <div style={styles.yearButtonsContainer}>
                        {[1, 2, 3, 4].map((yearNum) => (
                            <button
                                key={yearNum}
                                type="button"
                                onClick={() => onYearChange(yearNum)}
                                style={{
                                    ...styles.yearButton,
                                    ...(year === yearNum ? styles.yearButtonActive : {})
                                }}
                            >
                                Year {yearNum}
                            </button>
                        ))}
                    </div>
                    {errors.year && (
                        <p style={styles.fieldError}>{errors.year}</p>
                    )}
                </div>

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
                        type="submit"
                        style={styles.continueButton}
                    >
                        Continue →
                    </button>
                </div>
            </form>
        </div>
    );
};

const ProfileSetup = ({ onComplete, onBack }) => {
    const { currentUser, token } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [department, setDepartment] = useState('Computer Science');
    const [year, setYear] = useState(null);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleStep1Next = async () => {
        const newErrors = {};
        if (!department) {
            newErrors.department = 'Department is required';
        }
        if (!year) {
            newErrors.year = 'Year of study is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            // Save basic info
            const authToken = token || getToken();
            if (!authToken || !currentUser) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_URL}/students/${currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    name: currentUser.name,
                    faculty: department,
                    year: year,
                    courses_taken: selectedCourses
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save profile');
            }

            // Move to next step
            setCurrentStep(2);
            setErrors({});
        } catch (err) {
            setErrors({ submit: err.message || 'Failed to save profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleStep2Next = async () => {
        setLoading(true);
        try {
            // Save selected courses
            const authToken = token || getToken();
            if (!authToken || !currentUser) {
                throw new Error('Not authenticated');
            }

            const response = await fetch(`${API_URL}/students/${currentUser.id}/courses`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    courses_taken: selectedCourses
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to save courses');
            }

            // Complete profile setup
            if (onComplete) {
                onComplete({ department, year, courses: selectedCourses });
            }
        } catch (err) {
            setErrors({ submit: err.message || 'Failed to save courses' });
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (currentStep === 1) {
            if (onBack) {
                onBack();
            }
        } else {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
    };

    return (
        <div style={styles.container}>
            {/* Progress Indicator - will be handled by each step component */}
            
            {currentStep === 1 && (
                <>
                    <div style={styles.progressContainer}>
                        <div style={styles.progressStep}>
                            <div style={styles.progressIconActive}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="white"/>
                                    <path d="M12 14C7.58172 14 4 15.7909 4 18V22H20V18C20 15.7909 16.4183 14 12 14Z" fill="white"/>
                                </svg>
                            </div>
                            <div style={styles.progressLabelActive}>Basic Info</div>
                        </div>
                        <div style={styles.progressLine}></div>
                        <div style={styles.progressStep}>
                            <div style={styles.progressIcon}>2</div>
                            <div style={styles.progressLabel}>Step 2</div>
                        </div>
                        <div style={styles.progressLine}></div>
                        <div style={styles.progressStep}>
                            <div style={styles.progressIcon}>3</div>
                            <div style={styles.progressLabel}>Step 3</div>
                        </div>
                        <div style={styles.progressLine}></div>
                        <div style={styles.progressStep}>
                            <div style={styles.progressIcon}>4</div>
                            <div style={styles.progressLabel}>Step 4</div>
                        </div>
                    </div>
                    <BasicInfoStep
                        department={department}
                        year={year}
                        onDepartmentChange={setDepartment}
                        onYearChange={setYear}
                        errors={errors}
                        onNext={handleStep1Next}
                        onBack={handleBack}
                    />
                </>
            )}

            {currentStep === 2 && (
                <CourseSelection
                    selectedCourses={selectedCourses}
                    onCoursesChange={setSelectedCourses}
                    onNext={handleStep2Next}
                    onBack={handleBack}
                />
            )}

            {errors.submit && (
                <div style={styles.errorContainer}>
                    <p style={styles.error}>{errors.submit}</p>
                </div>
            )}
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
    progressIconActive: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#7c3aed',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressLabel: {
        fontSize: '12px',
        color: '#999',
    },
    progressLabelActive: {
        fontSize: '12px',
        color: '#7c3aed',
        fontWeight: '600',
    },
    progressLine: {
        width: '60px',
        height: '2px',
        backgroundColor: '#e0e0e0',
        margin: '0 10px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '600px',
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
        marginBottom: '32px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    fieldContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '8px',
    },
    required: {
        color: '#dc3545',
    },
    select: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '16px',
        backgroundColor: 'white',
        boxSizing: 'border-box',
        cursor: 'pointer',
    },
    yearButtonsContainer: {
        display: 'flex',
        gap: '12px',
        width: '100%',
    },
    yearButton: {
        flex: 1,
        padding: '12px 20px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        backgroundColor: 'white',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        color: '#333',
    },
    yearButtonActive: {
        backgroundColor: '#7c3aed',
        color: 'white',
        border: '1px solid #7c3aed',
    },
    fieldError: {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '4px',
    },
    errorContainer: {
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
    },
    error: {
        color: '#721c24',
        margin: 0,
        fontSize: '14px',
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
        backgroundColor: '#7c3aed',
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

export default ProfileSetup;
