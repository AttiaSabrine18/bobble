// src/services/patterns.ts
import api from './api';

export interface PatternData {
  id?: number;
  title: string;
  description: string;
  type: 'tricot' | 'crochet' | 'tissage';
  level: 'debutant' | 'intermediaire' | 'avance' | 'expert';
  price: number | string;
  is_free: boolean;
  pdf?: File | string;
  cover_image?: File | string;
  tags?: number[] | string[];
}

export interface Pattern {
  id: number;
  title: string;
  description: string;
  type: string;
  level: string;
  price: string;
  is_free: boolean;
  cover_image: string | null;
  pdf: string | null;
  author: {
    id: number;
    username: string;
  };
  favorites_count: number;
  tags: { id: number; name: string }[];
  created_at: string;
  updated_at: string;
}

export const patternService = {
  getAll: async (params?: {
    type?: string;
    level?: string;
    is_free?: boolean;
    search?: string;
    author?: string;
    ordering?: string;
  }) => {
    const response = await api.get('/patterns/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Pattern> => {
    const response = await api.get(`/patterns/${id}/`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post('/patterns/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: number, data: FormData) => {
    const response = await api.patch(`/patterns/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/patterns/${id}/`);
    return response.data;
  },

  getByAuthor: async (username: string) => {
    const response = await api.get('/patterns/', { params: { author: username } });
    return response.data;
  },

  getPDF: async (id: number) => {
    const response = await api.get(`/patterns/${id}/pdf/`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get('/patterns/', { params: { search: query } });
    return response.data;
  },
};

export default patternService;