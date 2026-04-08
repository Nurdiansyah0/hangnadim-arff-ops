import axios from 'axios';
import { useAuth } from '../store/useAuth';

// Inisialisasi basis URL dari Rust Axum backend
export const api = axios.create({
  baseURL: `http://${window.location.hostname}:8000/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor Request: Selalu lampirkan JWT token jika user sudah login
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

// Interceptor Response: Jika token expired / ditolak (401), otomatis logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuth.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
