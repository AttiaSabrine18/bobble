import api from './api';

export interface CommentData {
  pattern: number;
  text: string;
  rating: number;
}

export const commentService = {
  getByPattern: async (patternId: number) => {
    const response = await api.get(`/patterns/${patternId}/comments/`);
    return response.data;
  },
  
  create: async (data: CommentData) => {
    const response = await api.post('/comments/', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<CommentData>) => {
    const response = await api.patch(`/comments/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/comments/${id}/`);
  },
};