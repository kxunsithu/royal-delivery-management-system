import apiClient from '@/lib/axios';
import type { Parcel, ParcelDetail, PaginatedResponse, ApiResponse, ParcelStatus } from '@/types';

export interface ParcelsQuery {
  search?: string;
  status?: ParcelStatus;
  delivery_area_id?: number;
  priority?: string;
  assigned_to?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface CreateParcelData {
  tracking_number?: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_area_id?: number;
  description?: string;
  quantity?: number;
  weight?: number;
  notes?: string;
  delivery_fee: number;
  cod_amount?: number;
  is_cod?: boolean;
  condition?: string;
  priority?: string;
  received_at?: string;
}

export interface ParcelImageData {
  id: number;
  url: string;
  original_name: string | null;
  size: number | null;
  mime_type: string | null;
  sort_order: number;
  created_at: string;
}

const parcelService = {
  list: (params: ParcelsQuery = {}) =>
    apiClient.get<PaginatedResponse<Parcel>>('/parcels', { params }),

  get: (id: number) =>
    apiClient.get<ApiResponse<ParcelDetail>>(`/parcels/${id}`),

  create: (data: CreateParcelData) =>
    apiClient.post<ApiResponse<Parcel>>('/parcels', data),

  update: (id: number, data: Partial<CreateParcelData>) =>
    apiClient.put<ApiResponse<Parcel>>(`/parcels/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/parcels/${id}`),

  tracking: (id: number) =>
    apiClient.get(`/parcels/${id}/tracking`),

  statusTransition: (id: number, status: ParcelStatus, reason?: string, notes?: string) =>
    apiClient.post(`/parcels/${id}/status-transitions`, { status, reason, notes }),

  assign: (id: number, staff_id: number, notes?: string) =>
    apiClient.post(`/parcels/${id}/assignments`, { staff_id, notes }),

  /** Upload one or more images. Sends files as "images[]" multipart/form-data. */
  uploadImages: (id: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images[]', file));
    return apiClient.post<ApiResponse<ParcelImageData[]>>(
      `/parcels/${id}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  /** Delete a specific image by its own ID. */
  deleteImage: (parcelId: number, imageId: number) =>
    apiClient.delete(`/parcels/${parcelId}/images/${imageId}`),
};

export default parcelService;
