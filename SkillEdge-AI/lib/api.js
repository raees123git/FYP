/**
 * API Helper for making authenticated requests to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Get the auth token from localStorage
 */
export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Get request with auth
 */
export async function apiGet(endpoint) {
  return apiRequest(endpoint, {
    method: 'GET',
  });
}

/**
 * Post request with auth
 */
export async function apiPost(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Put request with auth
 */
export async function apiPut(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete request with auth
 */
export async function apiDelete(endpoint) {
  return apiRequest(endpoint, {
    method: 'DELETE',
  });
}

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  request: apiRequest,
};
