import apiClient from './apiClient';
import {
  Parcel,
  ParcelFilters,
  PaginatedResponse,
  Customer,
  ContactSuggestion,
  DailySummary,
  MonthlySummary,
  ParcelImage,
} from '../types';

export type { Parcel, ParcelFilters, Customer, ContactSuggestion, DailySummary, MonthlySummary, ParcelImage };

export interface ParcelsResponse extends PaginatedResponse<Parcel> {}

export const parcelService = {
  async dailySummary(dateFrom?: string, dateTo?: string): Promise<DailySummary[]> {
    const response = await apiClient.get('/parcels/daily-summary', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data.data;
  },

  async monthlySummary(dateFrom?: string, dateTo?: string): Promise<MonthlySummary[]> {
    const response = await apiClient.get('/parcels/monthly-summary', {
      params: { date_from: dateFrom, date_to: dateTo },
    });
    return response.data.data;
  },

  async customers(params: {
    type?: 'sender' | 'recipient';
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Customer[]; meta: any }> {
    const response = await apiClient.get('/parcels/customers', { params });
    return response.data;
  },

  async searchContacts(search: string, type: 'sender' | 'recipient' | 'both' = 'both'): Promise<ContactSuggestion[]> {
    if (!search || search.trim().length < 1) return [];
    const response = await apiClient.get('/parcels/contacts', { params: { search, type, limit: 8 } });
    return response.data.data as ContactSuggestion[];
  },

  async list(filters?: ParcelFilters): Promise<ParcelsResponse> {
    const response = await apiClient.get('/parcels', { params: filters });
    return response.data;
  },

  async get(id: number): Promise<Parcel> {
    const response = await apiClient.get(`/parcels/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Parcel>): Promise<Parcel> {
    const response = await apiClient.post('/parcels', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<Parcel>): Promise<Parcel> {
    const response = await apiClient.put(`/parcels/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/parcels/${id}`);
  },

  async tracking(id: number): Promise<any> {
    const response = await apiClient.get(`/parcels/${id}/tracking`);
    return response.data.data;
  },

  async statusTransition(id: number, status: string, reason?: string, notes?: string): Promise<void> {
    await apiClient.post(`/parcels/${id}/status-transitions`, { status, reason, notes });
  },

  async assign(id: number, staffId: number, notes?: string): Promise<void> {
    await apiClient.post(`/parcels/${id}/assignments`, { staff_id: staffId, notes });
  },

  async uploadImages(id: number, formData: FormData): Promise<ParcelImage[]> {
    const response = await apiClient.post(`/parcels/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  async deleteImage(parcelId: number, imageId: number): Promise<void> {
    await apiClient.delete(`/parcels/${parcelId}/images/${imageId}`);
  },
};