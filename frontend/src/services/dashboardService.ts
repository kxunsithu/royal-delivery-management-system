import apiClient from '@/lib/axios';

const dashboardService = {
  get: () => apiClient.get('/dashboard'),

  deliveryAreas: () => apiClient.get('/settings/delivery-areas'),
};

export default dashboardService;
