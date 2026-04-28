// src/services/community.ts
import api from './api';

export const groupService = {
  getAll: async (params?: { search?: string }) => {
    const response = await api.get('/groups/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/groups/${id}/`);
    return response.data;
  },

  create: async (data: { name: string; description?: string }) => {
    console.log('Creating group with data:', data); // Debug
    const response = await api.post('/groups/', data);
    return response.data;
  },

  join: async (groupId: number) => {
    console.log(`Joining group ${groupId}`); // Debug
    const response = await api.post(`/groups/${groupId}/join/`);
    return response.data;
  },

  leave: async (groupId: number) => {
    const response = await api.delete(`/groups/${groupId}/join/`);
    return response.data;
  },
  update: async (id: number, data: { name?: string; description?: string }) => {
    const response = await api.patch(`/groups/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/groups/${id}/`);
    return response.data;
  },
   getMembers: async (groupId: number): Promise<MembersResponse> => {
    const response = await api.get(`/groups/${groupId}/members/`);
    return response.data;
  },

  updateMemberRole: async (groupId: number, userId: number, role: string) => {
    const response = await api.patch(`/groups/${groupId}/members/${userId}/`, { role });
    return response.data;
  },

  removeMember: async (groupId: number, userId: number) => {
    const response = await api.delete(`/groups/${groupId}/members/${userId}/`);
    return response.data;
  },
};


export interface Member {
  id: number;
  user: {
    id: number;
    username: string;
    email?: string;
    profile_image?: string | null;
    full_name?: string;
  };
  role: 'member' | 'moderator' | 'admin';
  joined_at: string;
}

export interface MembersResponse {
  group_id: number;
  group_name: string;
  count: number;
  members: Member[];
}
export const forumService = {
  getThreads: async (params?: { category?: string; search?: string }) => {
    const response = await api.get('/forum-threads/', { params });
    return response.data;
  },

  getThread: async (id: number) => {
    const response = await api.get(`/forum-threads/${id}/`);
    return response.data;
  },

  createThread: async (data: { title: string; content: string; category: string; group?: number }) => {
    const response = await api.post('/forum-threads/', data);
    return response.data;
  },

  getReplies: async (threadId: number) => {
    const response = await api.get('/forum-replies/', { params: { thread_id: threadId } });
    return response.data;
  },

  createReply: async (data: { thread: number; content: string }) => {
    const response = await api.post('/forum-replies/', data);
    return response.data;
  },
  deleteThread: async (id: number) => {
    const response = await api.delete(`/forum-threads/${id}/`);
    return response.data;
  },
  
  updateThread: async (id: number, data: Partial<{ title: string; content: string; category: string }>) => {
    const response = await api.patch(`/forum-threads/${id}/`, data);
    return response.data;
  },
  
  deleteReply: async (id: number) => {
    const response = await api.delete(`/forum-replies/${id}/`);
    return response.data;
  },
  
  updateReply: async (id: number, data: { content: string }) => {
    const response = await api.patch(`/forum-replies/${id}/`, data);
    return response.data;
  },
  
};

export const craftAlongService = {
  getAll: async (params?: { status?: string; search?: string }) => {
    const response = await api.get('/craft-alongs/', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/craft-alongs/${id}/`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/craft-alongs/', data);
    return response.data;
  },

  join: async (craftAlongId: number, projectId?: number) => {
    const response = await api.post(`/craft-alongs/${craftAlongId}/join/`, { project_id: projectId });
    return response.data;
  },

  leave: async (craftAlongId: number) => {
    const response = await api.delete(`/craft-alongs/${craftAlongId}/join/`);
    return response.data;
  },
  
};



