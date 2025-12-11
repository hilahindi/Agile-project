// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import { getToken, removeToken } from './services/authService';

// --- Placeholder for the protected content ---
const Dashboard = ({ onLogout }) => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Welcome to the Course Recommendation System!</h2>
        <p>You are successfully logged in and can now access personalized recommendations.</p>
        <button onClick={onLogout} style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>
            Log Out
        </button>
    </div>
);
// ---------------------------------------------


function App() {
    // State to track if the user is authenticated (token exists)
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Effect to check local storage on app load
    useEffect(() => {
        if (getToken()) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleAuthSuccess = () => {
        // Called when login is successful in AuthForm
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        removeToken();
        setIsAuthenticated(false);
    };

    return (
        <div className="App">
            <header style={{ backgroundColor: '#333', color: 'white', padding: '15px', textAlign: 'center' }}>
                <h1>Course Recommender</h1>
            </header>
            
            {isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
            ) : (
                <AuthForm onAuthSuccess={handleAuthSuccess} />
            )}
        </div>
    );
}

export default App;