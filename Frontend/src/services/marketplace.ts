// src/services/marketplace.ts
import api from './api';

// Mapping des types frontend → endpoints API
const ENDPOINTS: Record<string, string> = {
  yarn: 'yarn',
  needle: 'needles',
  accessory: 'accessories',
};

export const marketplaceService = {
  // ====================== ANNONCES ======================
  getAll: async (type: string, params?: any) => {
    const endpoint = ENDPOINTS[type] || type;
    const response = await api.get(`/marketplace/${endpoint}/`, { params });
    return response.data;
  },
  
  getById: async (type: string, id: number) => {
    const endpoint = ENDPOINTS[type] || type;
    const response = await api.get(`/marketplace/${endpoint}/${id}/`);
    return response.data;
  },
  
  create: async (type: string, data: FormData) => {
    const endpoint = ENDPOINTS[type] || type;
    const response = await api.post(`/marketplace/${endpoint}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  // ====================== FAVORIS ======================
  addFavorite: async (type: string, id: number) => {
    const response = await api.post('/marketplace/favorites/', { 
      [`${type}_listing`]: id 
    });
    return response.data;
  },
  
  removeFavorite: async (type: string, id: number) => {
    const response = await api.delete('/marketplace/favorites/', { 
      params: { [`${type}_listing`]: id } 
    });
    return response.data;
  },
  
  getFavorites: async () => {
    const response = await api.get('/marketplace/favorites/list/');
    return response.data;
  },
  
  // ====================== VENDEUR ======================
  getSellerProfile: async (username: string) => {
    const response = await api.get(`/marketplace/seller/${username}/`);
    return response.data;
  },
  
  // ====================== COMMANDES ======================
  createOrder: async (data: {
    items: Array<{
      listing_type: string;
      listing_id: number;
      quantity: number;
    }>;
    shipping_address: string;
    message: string;
  }) => {
    const response = await api.post('/marketplace/orders/create/', data);
    return response.data;
  },
  
  getOrders: async () => {
    const response = await api.get('/marketplace/orders/list/');
    return response.data;
  },
  
  getOrderDetail: async (orderId: number) => {
    const response = await api.get(`/marketplace/orders/${orderId}/`);
    return response.data;
  },
  
  updateOrderStatus: async (orderId: number, status: string) => {
    const response = await api.patch(`/marketplace/orders/${orderId}/`, { status });
    return response.data;
  },
  
  sendOrderMessage: async (orderId: number, content: string) => {
    const response = await api.post(`/marketplace/orders/${orderId}/message/`, { content });
    return response.data;
  },
};