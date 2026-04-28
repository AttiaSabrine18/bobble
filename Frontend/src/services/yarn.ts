import api from './api';

export interface YarnStashData {
  id?: number;
  yarn_line?: number | null;
  brand?: string;
  name: string;
  colorway?: string;
  color_code?: string;
  weight?: string;
  grams?: number;
  meterage?: number;
  quantity?: number;
  dye_lot?: string;
  purchase_date?: string;
  purchase_price?: number;
  store?: string;
  status?: string;
  image?: File | string;
  notes?: string;
}

export interface NeedleHookData {
  id?: number;
  type: string;
  size_mm: number;
  size_us?: string;
  size_uk?: string;
  material?: string;
  brand?: string;
  length_cm?: number;
  cable_length_cm?: number;
  quantity?: number;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

export const yarnService = {
  getAll: async () => {
    const response = await api.get('/yarn-stash/');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/yarn-stash/${id}/`);
    return response.data;
  },
  
  create: async (data: FormData | YarnStashData) => {
    const response = await api.post('/yarn-stash/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
  
  update: async (id: number, data: FormData | Partial<YarnStashData>) => {
    const response = await api.patch(`/yarn-stash/${id}/`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/yarn-stash/${id}/`);
  },
  
  getStats: async () => {
    const response = await api.get('/stash/stats/');
    return response.data;
  },
  
  getBrands: async () => {
    const response = await api.get('/yarn-brands/');
    return response.data;
  },
  
  getLines: async (brandId?: number) => {
    const params = brandId ? { brand: brandId } : {};
    const response = await api.get('/yarn-lines/', { params });
    return response.data;
  },
};

export const needleService = {
  getAll: async () => {
    const response = await api.get('/needles-hooks/');
    return response.data;
  },
  
  create: async (data: NeedleHookData) => {
    const response = await api.post('/needles-hooks/', data);
    return response.data;
  },
  
  update: async (id: number, data: Partial<NeedleHookData>) => {
    const response = await api.patch(`/needles-hooks/${id}/`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    await api.delete(`/needles-hooks/${id}/`);
  },
};