import axios from 'axios';

// Toggle between DEMO_MODE and REAL API endpoints.
// Default to true for local testing with high-fidelity mock data.
export const DEMO_MODE = false;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
    const message = error.response?.data?.message || error.response?.data?.error || 'Unable to connect to service.';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

// Helper function to simulate network delay for demo mode
export const simulateNetworkDelay = async (ms = 400) => {
  if (DEMO_MODE) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
};

export default apiClient;
