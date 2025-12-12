// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import { CourseReviewForm } from './components/CourseReviewForm';
import ReviewsFeed from './components/RecentReviewsTable';
import { getToken, removeToken, AuthProvider, useAuth } from './services/authService';
import { Container } from '@mui/material';

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

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {currentPage === 'dashboard' && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h2>Welcome to the Course Recommendation System!</h2>
                            <p>You are successfully logged in and can now access personalized recommendations.</p>
                        </div>
                        {/* ReviewsFeed Component - Shows all reviews from all students */}
                        <ReviewsFeed 
                            onNavigateToReview={() => setCurrentPage('review')}
                        />
                    </div>
                )}
                {currentPage === 'review' && (
                    <CourseReviewForm />
                )}
            </Container>
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
function AppContent() {
    const [currentRoute, setCurrentRoute] = useState('/');
    const { currentUser, logout, loading } = useAuth();
    const isAuthenticated = !!currentUser;

    const handleAuthSuccess = () => {
        setCurrentRoute('/dashboard');
    };

    const handleLogout = () => {
        logout();
        setCurrentRoute('/');
    };

    // Don't render while auth is loading
    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
    }

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

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
