import apiClient from './apiClient';

export interface Parcel {
  id: number;
  tracking_number: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_area?: { id: number; name: string; name_mm?: string };
  description?: string;
  quantity: number;
  weight?: number;
  notes?: string;
  delivery_fee: number;
  cod_amount: number;
  is_cod: boolean;
  currency: 'MMK' | 'THB';
  status: string;
  condition: string;
  priority: string;
  received_at?: string;
  received_by?: { id: number; name: string };
  active_assignment?: {
    id: number;
    staff: { id: number; name: string };
    assigned_at: string;
  };
  status_histories?: StatusHistory[];
  delivery_assignments?: DeliveryAssignment[];
  delivery_attempts?: DeliveryAttempt[];
  damage_description?: string;
  images?: ParcelImage[];
  created_at: string;
  updated_at: string;
}

export interface StatusHistory {
  id: number;
  from_status?: string;
  to_status: string;
  reason?: string;
  notes?: string;
  changed_by?: { id: number; name: string };
  created_at: string;
}

export interface DeliveryAssignment {
  id: number;
  staff?: { id: number; name: string; phone?: string };
  assigned_by?: { id: number; name: string };
  status: string;
  notes?: string;
  assigned_at: string;
  completed_at?: string;
}

export interface DeliveryAttempt {
  id: number;
  staff?: { id: number; name: string };
  attempted_at: string;
  result: string;
  failure_reason?: string;
  recipient_name?: string;
  notes?: string;
}

export interface ParcelImage {
  id: number;
  url: string;
  original_name: string;
  size?: number;
  mime_type?: string;
  sort_order: number;
  created_at: string;
}

export interface ParcelsResponse {
  data: Parcel[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ParcelFilters {
  search?: string;
  status?: string;
  priority?: string;
  delivery_area_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
}

export interface ContactSuggestion {
  type: 'sender' | 'recipient';
  name: string;
  phone: string;
  delivery_address?: string;
}

export const parcelService = {
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
