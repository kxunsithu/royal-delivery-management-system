import apiClient from './apiClient';
import { User } from '../types';
export type { User };

export interface UsersResponse {
  data: User[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export const userService = {
  async list(params?: { page?: number; per_page?: number; search?: string; role?: string }): Promise<UsersResponse> {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  async get(id: number): Promise<User> {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.data;
  },

  async create(data: Partial<User> & { password: string }): Promise<User> {
    const response = await apiClient.post('/users', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  async updateStatus(id: number, isActive: boolean): Promise<void> {
    await apiClient.patch(`/users/${id}/status`, { is_active: isActive });
  },

  async getDeliveryStaff(): Promise<User[]> {
    const response = await apiClient.get('/users/delivery-staff');
    return response.data.data || response.data;
  },

  async updateProfile(id: number, data: { name?: string; phone?: string; email?: string; password?: string; current_password?: string }): Promise<User> {
    const response = await apiClient.put(`/users/${id}`, data);
    return response.data.data;
  },

  async uploadProfileImage(id: number, file: File): Promise<User> {
    const formData = new FormData();
    formData.append('image', file, file.name);
    const response = await apiClient.post(`/users/${id}/profile-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async deleteProfileImage(id: number): Promise<void> {
    await apiClient.delete(`/users/${id}/profile-image`);
  },
};