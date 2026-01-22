/**
 * courseService.js
 * API helpers for course-related endpoints
 */

const API_URL = 'http://localhost:8000';

/**
 * Fetch detailed course information including prerequisites
 * @param {number} courseId - The course ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Course details object
 */
export const getCourse = async (courseId, token) => {
  const response = await fetch(`${API_URL}/courses/${courseId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch course: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch course statistics (averages and review count)
 * @param {number} courseId - The course ID
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Stats object with review_count, avg_final_score, etc.
 */
export const getCourseStats = async (courseId, token) => {
  const response = await fetch(`${API_URL}/courses/${courseId}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch course stats: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch paginated reviews for a course
 * @param {number} courseId - The course ID
 * @param {number} page - Page number (1-indexed)
 * @param {number} pageSize - Number of reviews per page
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Paginated response with items, page, page_size, total
 */
export const getCourseReviews = async (courseId, page = 1, pageSize = 10, token) => {
  const response = await fetch(
    `${API_URL}/courses/${courseId}/reviews?page=${page}&page_size=${pageSize}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch course reviews: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Optional: Locate which page contains a specific review
 * (Implement if needed for highlight functionality)
 * @param {number} courseId - The course ID
 * @param {number} reviewId - The review ID to locate
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Object with page number
 */
export const locateReviewPage = async (courseId, reviewId, token) => {
  const response = await fetch(
    `${API_URL}/courses/${courseId}/reviews/locate?review_id=${reviewId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    // If not implemented, return null
    return null;
  }

  return response.json();
};

/**
 * Search courses by ID or name (for autocomplete)
 * @param {string} query - Search query (2+ characters)
 * @param {number} limit - Max results (default 10, capped at 10)
 * @returns {Promise<Array>} Array of {id, name} objects
 */
export const searchCourses = async (query, limit = 10) => {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `${API_URL}/courses/search?q=${encodedQuery}&limit=${limit}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search courses: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
