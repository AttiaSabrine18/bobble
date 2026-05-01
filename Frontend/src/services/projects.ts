// src/services/projects.ts
import api from './api';

export interface ProjectData {
  id?: number;
  pattern: number;
  pattern_title?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'frogged';
  start_date?: string;
  end_date?: string;
  notes?: string;
  yarn_used?: string;
  needle_size?: string;
}

export const projectService = {
  getAll: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  create: async (data: ProjectData) => {
    const response = await api.post('/projects/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ProjectData>) => {
    const response = await api.patch(`/projects/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },

  uploadImage: async (projectId: number, image: File, caption?: string, isMain?: boolean) => {
    const formData = new FormData();
    formData.append('image', image);
    if (caption) formData.append('caption', caption);
    if (isMain !== undefined) formData.append('is_main', String(isMain));
    
    const response = await api.post(`/projects/${projectId}/upload/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
