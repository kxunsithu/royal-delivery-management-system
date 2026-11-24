import apiClient from './apiClient';
import { DashboardData } from '../types';

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const response = await apiClient.get('/dashboard');
    return response.data.data;
  },
};