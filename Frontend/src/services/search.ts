// src/services/search.ts
import api from './api';

export const searchService = {
  global: async (query: string) => {
    const response = await api.get('/search/', { params: { q: query } });
    return response.data;
  },

  visual: async (image: File, filters?: { type?: string; level?: string; is_free?: boolean }) => {
    const formData = new FormData();
    formData.append('image', image);
    
    let url = '/search/visual/';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.level) params.append('level', filters.level);
      if (filters.is_free !== undefined) params.append('is_free', String(filters.is_free));
      if (params.toString()) url += `?${params.toString()}`;
    }
    
    const response = await api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};