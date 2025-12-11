// frontend/src/services/authService.js

const API_URL = 'http://localhost:8000/auth';

/**
 * Handles user login.
 * @param {string} username - The user's unique name.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} The JWT access token.
 */
export const login = async (username, password) => {
    // FastAPI's /login expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        // Handle 401 Unauthorized or other errors
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed.');
    }

    const data = await response.json();
    return data.access_token;
};


/**
 * Handles user registration (signup).
 * @param {string} name - The user's unique name.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} The new student object.
 */
export const register = async ({ name, password, faculty, year }) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            password,
            faculty: faculty || "Undeclared",
            year: year || 1,
            courses_taken: []
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed. User may exist.');
    }

    return response.json();
};

/**
 * Stores the token in local storage.
 * @param {string} token - The JWT token.
 */
export const setToken = (token) => {
    localStorage.setItem('userToken', token);
};

/**
 * Retrieves the token from local storage.
 * @returns {string | null} The JWT token or null.
 */
export const getToken = () => {
    return localStorage.getItem('userToken');
};

/**
 * Removes the token from local storage.
 */
export const removeToken = () => {
    localStorage.removeItem('userToken');
};