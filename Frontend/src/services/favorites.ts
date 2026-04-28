// src/services/favorites.ts
import api from './api';

export const favoriteService = {
  toggle: async (patternId: number) => {
    const response = await api.post(`/favorites/${patternId}/`);
    return response.data;
  },
  
  remove: async (patternId: number) => {
    const response = await api.delete(`/favorites/${patternId}/`);
    return response.data;
  },
  
  check: async (patternId: number) => {
    const response = await api.get(`/favorites/check/${patternId}/`);
    return response.data;
  },
  
  getAll: async () => {
    const response = await api.get('/favorites/');
    return response.data;
  },
};