import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authService';
import { getToken } from '../services/authService';

const API_URL = 'http://localhost:8000';

const RecommendationsPage = () => {
    const { currentUser } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const token = getToken();
                const response = await fetch(`${API_URL}/students/me/recommendations?limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch recommendations');
                }

                const data = await response.json();
                setRecommendations(data.recommendations);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchRecommendations();
        }
    }, [currentUser]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>Loading recommendations...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>Error: {error}</div>;
    }

    if (recommendations.length === 0) {
        return <div style={{ textAlign: 'center', padding: '40px' }}>No recommendations available. Please complete your profile.</div>;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Personalized Course Recommendations</h1>
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>Based on your profile, career goals, and industry preferences</p>

                {recommendations.map((rec, index) => (
                    <div key={rec.course_id} style={{ marginBottom: '24px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>{rec.course_name}</h3>
                        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginBottom: '16px' }}>
                            {rec.reasons.map((reason, i) => (
                                <li key={i} style={{ fontSize: '14px', color: '#555', marginBottom: '4px' }}>{reason}</li>
                            ))}
                        </ul>
                        <button
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                border: '1px solid #00D9A3',
                                backgroundColor: 'white',
                                color: '#00D9A3',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                // Simple rating modal or inline
                                const rating = prompt('Rate this course (1-5):');
                                if (rating && rating >= 1 && rating <= 5) {
                                    fetch(`${API_URL}/courses/${rec.course_id}/ratings`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${getToken()}`,
                                        },
                                        body: JSON.stringify({ rating: parseInt(rating) }),
                                    }).then(() => alert('Rating submitted!'));
                                }
                            }}
                        >
                            Rate this course
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendationsPage;