// src/services/messages.ts
import api from './api';

export const messageService = {
  getConversations: async () => {
    const response = await api.get('/conversations/');
    return response.data;
  },

  getOrCreateConversation: async (userId: number) => {
    const response = await api.post('/conversations/', { user_id: userId });
    return response.data;
  },

  getMessages: async (conversationId: number) => {
    const response = await api.get(`/messages/?conversation_id=${conversationId}`);
    return response.data;
  },

  sendMessage: async (conversationId: number, content: string) => {
    const response = await api.post('/messages/', { conversation: conversationId, content });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/messages/unread/');
    return response.data;
  },
};