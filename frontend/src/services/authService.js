// frontend/src/services/authService.js

import { useContext, createContext, useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/auth';

// Create AuthContext
const AuthContext = createContext(null);

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

/**
 * Parses a JWT token and returns the decoded payload.
 * @param {string} token - The JWT token.
 * @returns {object} The decoded payload.
 */
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to parse JWT:', error);
        return null;
    }
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Decode token and set currentUser whenever token changes
    if (token) {
      try {
        const decodedToken = parseJwt(token);
        if (decodedToken && decodedToken.student_id) {
          setCurrentUser({ id: decodedToken.student_id, name: decodedToken.sub });
        }
      } catch (error) {
        console.error('Failed to decode token:', error);
        removeToken();
        setTokenState(null);
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
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
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed.');
    }

    const data = await response.json();
    setToken(data.access_token);
    setTokenState(data.access_token);
    
    // Decode and set currentUser
    const decodedToken = parseJwt(data.access_token);
    setCurrentUser({ id: decodedToken.student_id, name: decodedToken.sub });
    
    return data.access_token;
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('useAuth called outside AuthProvider - returning default context');
    return {
      currentUser: null,
      token: null,
      loading: false,
      login: async () => {},
      logout: () => {},
    };
  }
  return context;
};

/**
 * Handles user login.
 * @param {string} username - The user's unique name.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} The JWT access token.
 */
export const loginUser = async (username, password) => {
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
    setToken(data.access_token);
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
        // Create an error object that preserves the detail structure
        const error = new Error();
        error.detail = errorData.detail || 'Registration failed. User may exist.';
        error.response = response;
        throw error;
    }

    return response.json();
};