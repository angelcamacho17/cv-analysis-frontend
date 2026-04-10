/**
 * Environment Configuration
 */

export const environment = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://cv-analysis-api.onrender.com/api',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 120000, // 2 minutes default
};
