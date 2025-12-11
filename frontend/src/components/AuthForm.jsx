// frontend/src/components/AuthForm.jsx

import React, { useState } from 'react';

const AuthForm = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [faculty, setFaculty] = useState('');
    const [year, setYear] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Dynamic imports for the service functions
    const { login, register, setToken } = require('../services/authService');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // LOGIN attempt
                const token = await login(name, password);
                setToken(token);
                onAuthSuccess(); // Notify parent component
            } else {
                // REGISTER attempt
                const studentData = { name, password, faculty, year: parseInt(year) || 1 };
                await register(studentData);
                alert('Registration successful! Please log in.');
                setIsLogin(true); // Switch to login view after successful registration
            }
        } catch (err) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError(null); // Clear errors when switching modes
    };

    return (
        <div style={styles.container}>
            <h2>{isLogin ? 'Student Login' : 'Student Registration'}</h2>
            
            <form onSubmit={handleSubmit} style={styles.form}>
                
                <input
                    type="text"
                    placeholder="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={styles.input}
                />
                
                <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                />

                {!isLogin && (
                    <>
                        <input
                            type="text"
                            placeholder="Faculty (e.g., CS)"
                            value={faculty}
                            onChange={(e) => setFaculty(e.target.value)}
                            style={styles.input}
                        />
                         <input
                            type="number"
                            placeholder="Academic Year (e.g., 1)"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            style={styles.input}
                        />
                    </>
                )}

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
                </button>
            </form>
            console.log(error);
            {error && <p style={styles.error}>Error: {error.message}</p>}

            <button onClick={toggleMode} style={styles.linkButton}>
                {isLogin
                    ? 'New user? Register an account'
                    : 'Already have an account? Log in here'}
            </button>
        </div>
    );
};

// Simple inline styles for clarity
const styles = {
    container: {
        maxWidth: '400px',
        margin: '50px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    input: {
        marginBottom: '10px',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
    },
    button: {
        padding: '10px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    linkButton: {
        marginTop: '15px',
        background: 'none',
        border: 'none',
        color: '#007bff',
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    error: {
        color: 'red',
        marginTop: '10px',
    }
};

export default AuthForm;