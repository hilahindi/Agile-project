// frontend/src/components/CareerGoals.jsx

import React, { useState } from 'react';
import JobRolesGrid from './JobRolesGrid';
import { JobRoles } from '../utils';

const CareerGoals = ({ selectedGoals, onGoalsChange, onNext, onBack }) => {
    const [errors, setErrors] = useState({});

    const handleToggleGoal = (goalId) => {
        const isSelected = selectedGoals.includes(goalId);
        if (isSelected) {
            onGoalsChange(selectedGoals.filter(id => id !== goalId));
        } else {
            onGoalsChange([...selectedGoals, goalId]);
        }
        // Clear error when user selects something
        if (errors.goals) {
            setErrors({ ...errors, goals: null });
        }
    };

    const handleNext = () => {
        if (selectedGoals.length === 0) {
            setErrors({ goals: 'Please select at least one career goal' });
            return;
        }
        onNext();
    };

    return (
        <div style={styles.container}>
            {/* Progress Indicator */}
            <div style={styles.progressContainer}>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconCompleted}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                        </svg>
                    </div>
                    <div style={styles.progressLabelCompleted}>Basic Info</div>
                </div>
                <div style={styles.progressLineCompleted}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconCompleted}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
                        </svg>
                    </div>
                    <div style={styles.progressLabelCompleted}>Courses</div>
                </div>
                <div style={styles.progressLineCompleted}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconActive}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" fill="white"/>
                        </svg>
                    </div>
                    <div style={styles.progressLabelActive}>Career Goals</div>
                </div>
            </div>

            {/* Form Card */}
            <div style={styles.card}>
                <h2 style={styles.title}>Career Goals</h2>
                <p style={styles.instruction}>
                    Select job roles you're interested in (select at least one)
                </p>

                {/* Job Roles Grid */}
                <JobRolesGrid
                    jobRoles={JobRoles}
                    selectedGoals={selectedGoals}
                    handleToggleGoal={handleToggleGoal}
                    styles={styles}
                />

                {errors.goals && (
                    <p style={styles.fieldError}>{errors.goals}</p>
                )}

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
                        onClick={handleNext}
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
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        width: '100%',
    },
    title: {
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
    jobRolesGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '32px',
    },
    jobRoleItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        cursor: 'pointer',
        transition: 'all 0.2s',
        gap: '12px',
    },
    checkbox: {
        width: '20px',
        height: '20px',
        cursor: 'pointer',
        flexShrink: 0,
    },
    jobRoleInfo: {
        flex: 1,
    },
    jobRoleTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '4px',
    },
    jobRoleCategory: {
        fontSize: '14px',
        color: '#666',
    },
    fieldError: {
        color: '#dc3545',
        fontSize: '14px',
        marginBottom: '16px',
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

export default CareerGoals;

