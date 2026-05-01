import api from './api';

export interface VisualSearchResult {
  id: number;
  title: string;
  description: string;
  price: string;
  is_free: boolean;
  cover_image: string | null;
  author: {
    id: number;
    username: string;
  };
  level: string;
  type: string;
  favorites_count: number;
  similarity_score: number;
}

export const visualSearchService = {
  search: async (image: File, filters?: {
    type?: string;
    level?: string;
    is_free?: boolean;
    top_k?: number;
  }) => {
    const formData = new FormData();
    formData.append('image', image);
    
    if (filters?.top_k) {
      formData.append('top_k', String(filters.top_k));
    }
    
    // Construire les query params pour les filtres
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.level) params.append('level', filters.level);
    if (filters?.is_free !== undefined) params.append('is_free', String(filters.is_free));
    
    const url = `/search/visual/${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  },
};