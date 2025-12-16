// frontend/src/AuthForm.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authService';
import { register } from '../services/authService';

const AuthForm = ({ onAuthSuccess, onRegisterSuccess }) => {
    // Prevent body scrolling when this component is mounted
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, []);
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [faculty, setFaculty] = useState('');
    const [year, setYear] = useState('');
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Helper function to extract error message from API response
    const extractErrorMessage = (err) => {
        // If it's already a string, return it
        if (typeof err === 'string') {
            return err;
        }
        
        // If it's an object with detail property (from our register function)
        if (err.detail) {
            return formatValidationErrors(err.detail);
        }
        
        // If it has a message property, try to parse it
        if (err.message) {
            try {
                // Try to parse if it's a JSON string
                const parsed = JSON.parse(err.message);
                if (parsed.detail) {
                    return formatValidationErrors(parsed.detail);
                }
            } catch {
                // If not JSON, return the message
                return err.message;
            }
        }
        
        return 'An unknown error occurred.';
    };

    // Format FastAPI validation errors
    const formatValidationErrors = (detail) => {
        if (typeof detail === 'string') {
            return detail;
        }
        
        if (Array.isArray(detail)) {
            // Pydantic validation errors
            const errors = {};
            const messages = [];
            
            detail.forEach((error) => {
                const field = error.loc && error.loc.length > 1 ? error.loc[error.loc.length - 1] : 'unknown';
                let message = error.msg || 'Invalid value';
                
                // Make field names more user-friendly
                const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                
                // Simplify common validation messages
                if (message.includes('at least') && message.includes('characters')) {
                    const match = message.match(/at least (\d+)/);
                    if (match) {
                        message = `must be at least ${match[1]} characters long`;
                    }
                } else if (message.includes('String should have')) {
                    const match = message.match(/at least (\d+)/);
                    if (match) {
                        message = `must be at least ${match[1]} characters long`;
                    }
                }
                
                errors[field] = message;
                messages.push(`${fieldName} ${message}`);
            });
            
            setFieldErrors(errors);
            return messages.join('. ');
        }
        
        return 'Validation error occurred.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setFieldErrors({});
        setLoading(true);

        try {
            if (isLogin) {
                // LOGIN attempt - use the login function from AuthProvider context
                await login(name, password);
                onAuthSuccess(); // Notify parent component
            } else {
                // REGISTER attempt - validate passwords match first
                if (password !== confirmPassword) {
                    setError('Passwords do not match. Please try again.');
                    setFieldErrors({ confirmPassword: 'Passwords do not match' });
                    setLoading(false);
                    return;
                }
                
                const studentData = { name, password, faculty, year: parseInt(year) || 1 };
                await register(studentData);
                // Automatically log in the user after registration
                await login(name, password);
                // Clear form
                setName('');
                setPassword('');
                setConfirmPassword('');
                setFaculty('');
                setYear('');
                // Navigate to profile setup
                if (onRegisterSuccess) {
                    onRegisterSuccess();
                }
            }
        } catch (err) {
            // Extract error message from the error object
            const errorMessage = extractErrorMessage(err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setFieldErrors({});
        // Clear form when switching modes
        setName('');
        setPassword('');
        setConfirmPassword('');
        setFaculty('');
        setYear('');
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <h1 style={styles.title}>{isLogin ? 'Student Login' : 'Student Registration'}</h1>
                {!isLogin && <p style={styles.subtitle}>Create your account to get started</p>}
                
                <form onSubmit={handleSubmit} style={styles.form}>
                
                <div>
                    <input
                        type="text"
                        placeholder="Username"
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (fieldErrors.name) setFieldErrors({...fieldErrors, name: null});
                        }}
                        required
                        style={{
                            ...styles.input,
                            borderColor: fieldErrors.name ? '#dc3545' : '#ddd',
                            borderWidth: fieldErrors.name ? '2px' : '1px'
                        }}
                    />
                    {fieldErrors.name && (
                        <p style={styles.fieldError}>{fieldErrors.name}</p>
                    )}
                </div>
                
                <div>
                    <input
                        type="password"
                        placeholder={isLogin ? "Password" : "Password (min 6 characters)"}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            if (fieldErrors.password) setFieldErrors({...fieldErrors, password: null});
                            // Clear confirm password error if passwords now match
                            if (confirmPassword && e.target.value === confirmPassword && fieldErrors.confirmPassword) {
                                setFieldErrors({...fieldErrors, confirmPassword: null});
                            }
                        }}
                        required
                        style={{
                            ...styles.input,
                            borderColor: fieldErrors.password ? '#dc3545' : '#ddd',
                            borderWidth: fieldErrors.password ? '2px' : '1px'
                        }}
                    />
                    {fieldErrors.password && (
                        <p style={styles.fieldError}>{fieldErrors.password}</p>
                    )}
                </div>

                {!isLogin && (
                    <div>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (fieldErrors.confirmPassword) setFieldErrors({...fieldErrors, confirmPassword: null});
                                // Check if passwords match in real-time
                                if (e.target.value && e.target.value !== password) {
                                    setFieldErrors({...fieldErrors, confirmPassword: 'Passwords do not match'});
                                } else if (e.target.value === password) {
                                    const newErrors = {...fieldErrors};
                                    delete newErrors.confirmPassword;
                                    setFieldErrors(newErrors);
                                }
                            }}
                            required
                            style={{
                                ...styles.input,
                                borderColor: fieldErrors.confirmPassword ? '#dc3545' : '#ddd',
                                borderWidth: fieldErrors.confirmPassword ? '2px' : '1px'
                            }}
                        />
                        {fieldErrors.confirmPassword && (
                            <p style={styles.fieldError}>{fieldErrors.confirmPassword}</p>
                        )}
                    </div>
                )}

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
                    </button>
                </form>

                {error && (
                    <div style={styles.errorContainer}>
                        <p style={styles.error}>{error}</p>
                    </div>
                )}

                <button onClick={toggleMode} style={styles.linkButton}>
                    {isLogin
                        ? 'New user? Register an account'
                        : 'Already have an account? Log in here'}
                </button>
            </div>
        </div>
    );
};

// Simple inline styles for clarity
const styles = {
    pageContainer: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
    },
    container: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
    },
    title: {
        fontSize: '22px',
        fontWeight: 'bold',
        marginBottom: '4px',
        marginTop: 0,
        color: '#333',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    subtitle: {
        fontSize: '14px',
        color: '#666',
        marginBottom: '12px',
        marginTop: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        margin: 0,
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '16px',
        boxSizing: 'border-box',
        margin: 0,
    },
    button: {
        padding: '10px 24px',
        backgroundColor: '#00D9A3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginTop: '4px',
    },
    linkButton: {
        marginTop: '8px',
        background: 'none',
        border: 'none',
        color: '#00D9A3',
        cursor: 'pointer',
        textDecoration: 'underline',
        fontSize: '14px',
        padding: 0,
    },
    errorContainer: {
        marginTop: '8px',
        padding: '10px',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
    },
    error: {
        color: '#721c24',
        margin: 0,
        fontSize: '14px',
        lineHeight: '1.4',
    },
    fieldError: {
        color: '#dc3545',
        fontSize: '12px',
        marginTop: '4px',
        marginBottom: '2px',
        marginLeft: '4px',
    }
};

export default AuthForm;