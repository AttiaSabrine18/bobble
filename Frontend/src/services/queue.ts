// src/services/queue.ts
import api from './api';

export const queueService = {
  toggle: async (patternId: number) => {
    const response = await api.post(`/queue/${patternId}/`);
    return response.data;
  },

  remove: async (patternId: number) => {
    const response = await api.delete(`/queue/${patternId}/`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/queue/');
    return response.data;
  },
};