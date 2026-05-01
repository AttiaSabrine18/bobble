// src/services/social.ts
import api from './api';

export const followService = {
  toggle: async (username: string) => {
    const response = await api.post(`/follow/${username}/`);
    return response.data;
  },

  unfollow: async (username: string) => {
    const response = await api.delete(`/follow/${username}/`);
    return response.data;
  },

  getFollowing: async () => {
    const response = await api.get('/following/');
    return response.data;
  },

  getActivity: async () => {
    const response = await api.get('/activity/');
    return response.data;
  },
};