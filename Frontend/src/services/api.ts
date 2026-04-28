// src/services/api.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Fonction pour récupérer le token (identique à PatternDetail)
function getToken(): string | null {
  try { 
    return JSON.parse(localStorage.getItem('authTokens') || '{}')?.access ?? null; 
  }
  catch { return null; }
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokens = JSON.parse(localStorage.getItem('authTokens') || '{}');
        if (tokens.refresh) {
          const response = await axios.post(`${API_URL}/api/token/refresh/`, {
            refresh: tokens.refresh,
          });
          
          const newTokens = {
            ...tokens,
            access: response.data.access,
          };
          
          localStorage.setItem('authTokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('authTokens');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;