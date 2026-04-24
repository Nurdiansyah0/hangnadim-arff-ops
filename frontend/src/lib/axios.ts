import axios from 'axios';
import { useAuth } from '../store/useAuth';

// Initialize base URL from Rust Axum backend
export const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Always attach JWT token if user is logged in
api.interceptors.request.use(
  (config) => {
    const token = useAuth.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: If token expired / rejected (401), automatically logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && originalRequest.url !== '/auth/login') {
      useAuth.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
