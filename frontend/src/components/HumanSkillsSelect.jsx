import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

const HumanSkillsSelect = ({ selectedSkills, onSkillsChange, onNext, onBack }) => {
    const [skillOptions, setSkillOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [localSelection, setLocalSelection] = useState(selectedSkills || []);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_URL}/skills/?type=human`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSkillOptions(data);
                } else if (data && data.results && Array.isArray(data.results)) {
                    setSkillOptions(data.results);
                } else {
                    setSkillOptions([]);
                }
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load human skills');
                setLoading(false);
            });
    }, []);

    const handleToggle = skillId => {
        const isSelected = localSelection.includes(skillId);
        let updated = [];
        if (isSelected) {
            updated = localSelection.filter(id => id !== skillId);
        } else {
            updated = [...localSelection, skillId];
        }
        setLocalSelection(updated);
        onSkillsChange(updated);
    };

    const handleNext = () => {
        if (!localSelection.length) {
            setError('Please select at least one human skill');
            return;
        }
        setError(null);
        onNext();
    };

    if (loading) return <div style={styles.loading}>Loading human skills...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

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
                    <div style={styles.progressIconCompleted}>2</div>
                    <div style={styles.progressLabelCompleted}>Courses</div>
                </div>
                <div style={styles.progressLineCompleted}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconCompleted}>3</div>
                    <div style={styles.progressLabelCompleted}>Career Goals</div>
                </div>
                <div style={styles.progressLineCompleted}></div>
                <div style={styles.progressStep}>
                    <div style={styles.progressIconActive}>4</div>
                    <div style={styles.progressLabelActive}>Human Skills</div>
                </div>
            </div>
            <div style={styles.card}>
            <h2 style={styles.title}>Human Skills</h2>
            <p style={styles.subtitle}>Select all human skills you think you own</p>
            <div style={styles.skillsGrid}>
                {skillOptions.map(skill => (
                    <label key={skill.id} style={{ ...styles.skillItem, ...(localSelection.includes(skill.id) ? styles.skillItemActive : {}) }}>
                        <input
                            type="checkbox"
                            checked={localSelection.includes(skill.id)}
                            onChange={() => handleToggle(skill.id)}
                            style={styles.checkbox}
                        />
                        <span>{skill.name}</span>
                    </label>
                ))}
            </div>
            {error && <div style={styles.error}>{error}</div>}
            <div style={styles.buttonContainer}>
                <button type="button" onClick={onBack} style={styles.backButton}>Back</button>
                <button type="button" onClick={handleNext} style={styles.continueButton}>Continue →</button>
            </div>
        </div>
    </div>
    );
};

const styles = {
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
        maxWidth: '650px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column'
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333'
    },
    subtitle: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '24px',
    },
    skillsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '24px',
    },
    skillItem: {
        display: 'flex',
        alignItems: 'center',
        background: '#f5f5f5',
        borderRadius: '8px',
        padding: '10px 16px',
        cursor: 'pointer',
        fontWeight: 'bold',
        border: '1px solid #ddd',
        transition: 'background 0.2s',
        fontSize: '16px',
    },
    skillItemActive: {
        background: '#00D9A3',
        color: 'white',
        border: '1px solid #00D9A3',
    },
    checkbox: {
        marginRight: '10px',
        transform: 'scale(1.2)'
    },
    loading: {
        textAlign: 'center',
        padding: '60px',
        fontSize: '18px',
    },
    error: {
        color: '#dc3545',
        fontSize: '14px',
        marginTop: '10px',
        textAlign: 'center',
    },
    buttonContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        marginTop: '32px',
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

export default HumanSkillsSelect;

