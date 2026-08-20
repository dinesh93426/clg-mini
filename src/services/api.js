import axios from 'axios';

// Toggle between DEMO_MODE and REAL API endpoints.
// Default to true for local testing with high-fidelity mock data.
export const DEMO_MODE = true;

let rawBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim();
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
// Automatically normalize: if host without /api is given, append /api
const API_BASE_URL = (rawBaseUrl.endsWith('/api') || rawBaseUrl === '/api')
  ? rawBaseUrl
  : `${rawBaseUrl}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to append JWT if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !DEMO_MODE) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isDashboardAi404 = error.config?.url?.includes('/ai/dashboard') && error.response?.status === 404;
    const message = error.response?.data?.message || error.response?.data?.error || error.response?.data?.detail || error.message || 'Unable to connect to service.';
    
    if (!isDashboardAi404) {
      console.error('API Error:', message);
    }
    
    return Promise.reject(new Error(message));
  }
);

// Helper function to simulate network delay for demo mode
export const simulateNetworkDelay = async (ms = 400) => {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
};

export default apiClient;
