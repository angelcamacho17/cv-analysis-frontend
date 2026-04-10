/**
 * Centralized API Client
 * Handles JWT authentication, headers, 401 auto-logout, and error handling
 */

import { environment } from '../config/environment';

const TOKEN_KEY = 'cv_analysis_token';
const USER_KEY = 'cv_analysis_user';

/**
 * Get JWT token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get standard headers including JWT authentication
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Get headers including Content-Type for JSON requests
 */
export const getJsonHeaders = (): Record<string, string> => {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  };
};

/**
 * Handle 401 responses — clear auth and redirect to login
 */
const handle401 = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.setItem('session_expired', '1');
  window.location.href = '/login';
};

/**
 * Centralized fetch wrapper with automatic JWT header injection and 401 handling
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${environment.apiUrl}${endpoint}`;

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  console.log(`API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      handle401();
      throw new Error('Sesion expirada. Redirigiendo al login...');
    }

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Error de conexion. Verifica tu conexion a internet o intenta nuevamente.');
    }

    throw error;
  }
};

/**
 * Fetch with JSON response parsing
 */
export const apiFetchJson = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiFetch(endpoint, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * POST request with JSON body
 */
export const apiPost = async <T = any>(
  endpoint: string,
  body: any
): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'POST',
    headers: getJsonHeaders(),
    body: JSON.stringify(body),
  });
};

/**
 * PATCH request with JSON body
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  body: any
): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'PATCH',
    headers: getJsonHeaders(),
    body: JSON.stringify(body),
  });
};

/**
 * DELETE request
 */
export const apiDelete = async <T = any>(endpoint: string): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'DELETE',
  });
};

/**
 * GET request
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiFetchJson<T>(endpoint, {
    method: 'GET',
  });
};
