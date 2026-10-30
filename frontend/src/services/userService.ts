import apiClient from '@/lib/axios';
import type { User, PaginatedResponse, ApiResponse } from '@/types';

export interface UsersQuery {
  search?: string;
  role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  employee_id?: string;
  role: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  employee_id?: string;
  role?: string;
}

const userService = {
  list: (params: UsersQuery = {}) =>
    apiClient.get<PaginatedResponse<User>>('/users', { params }),

  get: (id: number) =>
    apiClient.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: CreateUserData) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: UpdateUserData) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  updateStatus: (id: number, is_active: boolean) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { is_active }),

  uploadProfileImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<ApiResponse<User>>(`/users/${id}/profile-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteProfileImage: (id: number) =>
    apiClient.delete<ApiResponse<User>>(`/users/${id}/profile-image`),

  deliveryStaff: () =>
    apiClient.get<PaginatedResponse<User>>('/users', {
      params: { role: 'delivery_staff', is_active: true, per_page: 100 },
    }),
};

export default userService;
