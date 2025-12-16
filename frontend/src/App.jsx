// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import ProfileSetup from './components/ProfileSetup';
import { CourseReviewForm } from './components/CourseReviewForm';
import ReviewsFeed from './components/RecentReviewsTable';
import { getToken, removeToken, AuthProvider, useAuth } from './services/authService';

// --- Dashboard for authenticated users ---
const Dashboard = ({ onLogout }) => {
    const [currentPage, setCurrentPage] = React.useState('dashboard');

    return (
        <div style={dashboardStyles.container}>
            <nav style={dashboardStyles.nav}>
                <div style={dashboardStyles.navButtons}>
                    <button 
                        onClick={() => setCurrentPage('dashboard')}
                        style={{
                            ...dashboardStyles.navButton,
                            ...(currentPage === 'dashboard' ? dashboardStyles.navButtonActive : {})
                        }}
                    >
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setCurrentPage('review')}
                        style={{
                            ...dashboardStyles.navButton,
                            ...(currentPage === 'review' ? dashboardStyles.navButtonActive : {})
                        }}
                    >
                        Submit Review
                    </button>
                </div>
                <button 
                    onClick={onLogout}
                    style={dashboardStyles.logoutButton}
                >
                    Log Out
                </button>
            </nav>

            <div style={dashboardStyles.content}>
                {currentPage === 'dashboard' && (
                    <div style={dashboardStyles.dashboardContent}>
                        <div style={dashboardStyles.welcomeSection}>
                            <h1 style={dashboardStyles.welcomeTitle}>Welcome to Afeka Advisor</h1>
                            <p style={dashboardStyles.welcomeSubtitle}>Your personalized course recommendations</p>
                        </div>
                        {/* ReviewsFeed Component - Shows all reviews from all students */}
                        <ReviewsFeed 
                            onNavigateToReview={() => setCurrentPage('review')}
                        />
                    </div>
                )}
                {currentPage === 'review' && (
                    <div style={dashboardStyles.reviewContent}>
                        <CourseReviewForm />
                    </div>
                )}
            </div>
        </div>
    );
};

const dashboardStyles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
    },
    nav: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: '20px 40px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        zIndex: 1000,
    },
    navButtons: {
        display: 'flex',
        gap: '12px',
    },
    navButton: {
        padding: '12px 24px',
        backgroundColor: 'white',
        color: '#333',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    navButtonActive: {
        backgroundColor: '#00D9A3',
        color: 'white',
        border: '1px solid #00D9A3',
        fontWeight: '600',
    },
    logoutButton: {
        padding: '12px 24px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    content: {
        padding: '100px 20px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    dashboardContent: {
        width: '100%',
    },
    welcomeSection: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    welcomeTitle: {
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: '#333',
        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    },
    welcomeSubtitle: {
        fontSize: '16px',
        color: '#666',
        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
    },
    reviewContent: {
        width: '100%',
    },
};

// --- Public Course Review Page (No Login Required) ---
const PublicReviewPage = () => (
    <div style={publicPageStyles.container}>
        <div style={publicPageStyles.backLink}>
            <a href="/" style={publicPageStyles.link}>
                ← Back to Login
            </a>
        </div>
        <div style={publicPageStyles.content}>
            <CourseReviewForm />
        </div>
    </div>
);

const publicPageStyles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '40px 20px',
    },
    backLink: {
        maxWidth: '1200px',
        margin: '0 auto 20px',
    },
    link: {
        color: '#00D9A3',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
    },
};

const loginPageStyles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
    },
};

// --- Main App Component ---
function AppContent() {
    const [currentRoute, setCurrentRoute] = useState('/');
    const { currentUser, logout, loading } = useAuth();
    const isAuthenticated = !!currentUser;

    const handleAuthSuccess = () => {
        setCurrentRoute('/dashboard');
    };

    const handleRegisterSuccess = () => {
        setCurrentRoute('/profile-setup');
    };

    const handleProfileComplete = (profileData) => {
        // TODO: Update user profile with API call
        // For now, just navigate to dashboard
        setCurrentRoute('/dashboard');
    };

    const handleProfileBack = () => {
        setCurrentRoute('/');
    };

    const handleLogout = () => {
        logout();
        setCurrentRoute('/');
    };

    // Don't render while auth is loading
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#666'
            }}>
                Loading...
            </div>
        );
    }

    // Route: /reviews - Public review form (no login required)
    if (currentRoute === '/reviews') {
        return <PublicReviewPage />;
    }

    // Route: /profile-setup - Profile setup after registration
    if (currentRoute === '/profile-setup') {
        return (
            <ProfileSetup 
                onComplete={handleProfileComplete}
                onBack={handleProfileBack}
            />
        );
    }

    // Route: / or /dashboard - Login or Dashboard
    return (
        <>
            {isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
            ) : (
                <div style={loginPageStyles.container}>
                    <AuthForm 
                        onAuthSuccess={handleAuthSuccess}
                        onRegisterSuccess={handleRegisterSuccess}
                    />
                </div>
            )}
        </>
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
