// src/services/payment.ts
import api from './api';

export const paymentService = {
  createCheckout: async (patternIds: number[]) => {
    const response = await api.post('/purchase/create/', { pattern_ids: patternIds });
    return response.data;
  },

  getCreatorDashboard: async () => {
    const response = await api.get('/creator/dashboard/');
    return response.data;
  },

  getPatternPDF: async (patternId: number) => {
    const response = await api.get(`/patterns/${patternId}/pdf/`);
    return response.data;
  },
};

// Important : transformer le fichier en module
export {};