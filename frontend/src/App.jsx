// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import ProfileSetup from './components/ProfileSetup';
import ProfilePage from './components/ProfilePage';
import { CourseReviewForm } from './components/CourseReviewForm';
import ReviewsFeed from './components/RecentReviewsTable';
import MyReviews from './components/MyReviews';
import Navbar from './components/Navbar';
import CourseDetailsPage from './components/CourseDetailsPage';
import { AuthProvider, useAuth } from './services/authService';
import { Box, Typography } from '@mui/material';

// --- Main Layout (Navbar + Outlet) ---
const MainLayout = ({ onLogout, currentPage, onNavigate }) => {
    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            <Navbar 
                currentPage={currentPage} 
                onNavigate={onNavigate}
                onLogout={onLogout}
            />
            {/* Outlet renders the nested route content */}
            <Outlet />
        </Box>
    );
};

// --- Dashboard Home Page ---
const DashboardPage = ({ onNavigate }) => {
    return (
        <Box sx={{ pt: 10, pb: 5, px: 2 }}>
            <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Box>
                    <Box sx={{ textAlign: 'center', mb: 5, mt: 4 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '28px',
                            marginBottom: '8px',
                            color: '#333',
                          }}
                        >
                            Welcome to Afeka Advisor
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: '16px',
                            color: '#666',
                          }}
                        >
                            Your personalized course recommendations
                        </Typography>
                    </Box>
                    <ReviewsFeed 
                        onNavigateToReview={() => onNavigate('review')}
                    />
                </Box>
            </Box>
        </Box>
    );
};

// --- Review Page ---
const ReviewPage = () => {
    return (
        <Box sx={{ pt: 10, pb: 5, px: 2 }}>
            <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                <CourseReviewForm />
            </Box>
        </Box>
    );
};

// --- Profile Page Wrapper ---
const ProfilePageWrapper = () => {
    return (
        <Box sx={{ pt: 10, pb: 5, px: 2 }}>
            <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                <ProfilePage />
            </Box>
        </Box>
    );
};

// --- My Reviews Page Wrapper ---
const MyReviewsPageWrapper = () => {
    return (
        <Box sx={{ pt: 10, pb: 5, px: 2 }}>
            <Box sx={{ maxWidth: '1200px', margin: '0 auto' }}>
                <MyReviews />
            </Box>
        </Box>
    );
};

const loginPageStyles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
    },
};

// --- Main App Component ---
function AppContent() {
    useEffect(() => {
        const handler = () => setCurrentPage('review');
        window.addEventListener('navigateToReview', handler);
        return () => window.removeEventListener('navigateToReview', handler);
    }, []);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { currentUser, logout, loading } = useAuth();
    const isAuthenticated = !!currentUser;

    const handleAuthSuccess = () => {
        navigate('/dashboard');
    };

    const handleRegisterSuccess = () => {
        navigate('/profile-setup');
    };

    const handleProfileComplete = (profileData) => {
        // TODO: Update user profile with API call
        // For now, just navigate to dashboard
        navigate('/dashboard');
    };

    const handleProfileBack = () => {
        navigate('/');
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        setCurrentPage('dashboard');
    };

    const handleNavigate = (page) => {
        setCurrentPage(page);
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

    // If not authenticated, show login/register form
    if (!isAuthenticated) {
        return (
            <div style={loginPageStyles.container}>
                <AuthForm 
                    onAuthSuccess={handleAuthSuccess}
                    onRegisterSuccess={handleRegisterSuccess}
                />
            </div>
        );
    }

    // If authenticated, render dashboard with routes
    return (
        <Routes>
            <Route path="/profile-setup" element={<ProfileSetup onComplete={handleProfileComplete} onBack={handleProfileBack} />} />
            <Route element={
                <MainLayout 
                    onLogout={handleLogout}
                    currentPage={currentPage}
                    onNavigate={handleNavigate}
                />
            }>
                {/* Dashboard routes */}
                <Route index element={<DashboardPage onNavigate={handleNavigate} />} />
                <Route path="dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
                <Route path="submit-review" element={<ReviewPage />} />
                <Route path="profile" element={<ProfilePageWrapper />} />
                <Route path="my-reviews" element={<MyReviewsPageWrapper />} />
                
                {/* Course Details route */}
                <Route path="courses/:courseId" element={<CourseDetailsPage />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
