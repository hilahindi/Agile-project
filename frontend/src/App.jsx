// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import { CourseReviewForm } from './components/CourseReviewForm';
import { getToken, removeToken } from './services/authService';

// --- Dashboard for authenticated users ---
const Dashboard = ({ onLogout }) => {
    const [currentPage, setCurrentPage] = React.useState('dashboard');

    return (
        <div>
            <nav style={{ 
                backgroundColor: '#f0f0f0', 
                padding: '15px', 
                borderBottom: '1px solid #ddd',
                display: 'flex',
                gap: '15px'
            }}>
                <button 
                    onClick={() => setCurrentPage('dashboard')}
                    style={{
                        padding: '8px 15px',
                        backgroundColor: currentPage === 'dashboard' ? '#007bff' : '#fff',
                        color: currentPage === 'dashboard' ? '#fff' : '#000',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: currentPage === 'dashboard' ? 'bold' : 'normal'
                    }}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => setCurrentPage('review')}
                    style={{
                        padding: '8px 15px',
                        backgroundColor: currentPage === 'review' ? '#28a745' : '#fff',
                        color: currentPage === 'review' ? '#fff' : '#000',
                        border: '1px solid #28a745',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: currentPage === 'review' ? 'bold' : 'normal'
                    }}
                >
                    Submit Review
                </button>
                <button 
                    onClick={onLogout}
                    style={{
                        marginLeft: 'auto',
                        padding: '8px 15px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Log Out
                </button>
            </nav>

            <div style={{ padding: '20px' }}>
                {currentPage === 'dashboard' && (
                    <div style={{ textAlign: 'center' }}>
                        <h2>Welcome to the Course Recommendation System!</h2>
                        <p>You are successfully logged in and can now access personalized recommendations.</p>
                    </div>
                )}
                {currentPage === 'review' && (
                    <CourseReviewForm />
                )}
            </div>
        </div>
    );
};

// --- Public Course Review Page (No Login Required) ---
const PublicReviewPage = () => (
    <div>
        
            
            <a href="/" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px', cursor: 'pointer' }}>
                Back to Login
            </a>
        
        <CourseReviewForm />
    </div>
);

// --- Main App Component ---
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentRoute, setCurrentRoute] = useState('/');

    useEffect(() => {
        if (getToken()) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleAuthSuccess = () => {
        setIsAuthenticated(true);
        setCurrentRoute('/dashboard');
    };

    const handleLogout = () => {
        removeToken();
        setIsAuthenticated(false);
        setCurrentRoute('/');
    };

    // Route: /reviews - Public review form (no login required)
    if (currentRoute === '/reviews') {
        return (
            <div className="App">
                <PublicReviewPage />
            </div>
        );
    }

    // Route: / or /dashboard - Login or Dashboard
    return (
        <div className="App">
            {isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
            ) : (
                <div>
                    <AuthForm onAuthSuccess={handleAuthSuccess} />
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <p>Or <a href="#" onClick={(e) => { e.preventDefault(); setCurrentRoute('/reviews'); }} style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>submit a course review without logging in</a></p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
