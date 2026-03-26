/**
 * Centralized API Client
 * Handles authentication, headers, and error handling for all API calls
 */

import { environment } from '../config/environment';

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

/**
 * Get standard headers including authentication
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
 * Centralized fetch wrapper with automatic auth header injection
 */
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${environment.apiUrl}${endpoint}`;

  // Merge auth headers with custom headers
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
  console.log(`🔑 Auth Header: ${(headers as Record<string, string>)['Authorization'] ? '✓ Bearer token present' : '✗ No token'}`);

  try {
    const response = await fetch(url, config);

    // Log response for debugging
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ API Success: ${response.status}`);
    }

    return response;
  } catch (error) {
    // Network errors (ERR_NETWORK_CHANGED, connection refused, etc.)
    console.error(`❌ Network Error:`, error);

    // Provide user-friendly error message
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Error de conexión. Verifica tu conexión a internet o intenta nuevamente.');
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
