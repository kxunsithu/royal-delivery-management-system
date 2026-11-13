import apiClient from './apiClient';

export interface Assignment {
  id: number;
  parcel?: {
    id: number;
    tracking_number: string;
    recipient_name: string;
    recipient_phone: string;
    delivery_address: string;
    delivery_area?: { id: number; name: string };
    status: string;
    delivery_fee: number;
    cod_amount: number;
    is_cod: boolean;
    priority: string;
  };
  staff?: { id: number; name: string; phone?: string };
  assigned_by?: { id: number; name: string };
  status: string;
  notes?: string;
  assigned_at: string;
  completed_at?: string;
  delivery_attempts?: {
    id: number;
    attempted_at: string;
    result: string;
    failure_reason?: string;
    recipient_name?: string;
    notes?: string;
    proof_photos?: { id: number; file_url: string }[];
  }[];
}

export interface AssignmentsResponse {
  data: Assignment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    // Real counts from backend (always from full dataset)
    active_count?: number;
    completed_count?: number;
    total_count?: number;
  };
}

export interface StaffWorkload {
  staff?: { id: number; name: string };
  total_assignments: number;
  active: number;
  completed: number;
}

export const deliveryService = {
  async myAssignments(params?: { status?: string; page?: number; per_page?: number }): Promise<AssignmentsResponse> {
    const response = await apiClient.get('/deliveries/my-assignments', { params });
    return response.data;
  },

  async allAssignments(params?: { staff_id?: number; status?: string; page?: number; per_page?: number }): Promise<AssignmentsResponse> {
    const response = await apiClient.get('/deliveries/assignments', { params });
    return response.data;
  },

  async getAssignment(id: number): Promise<Assignment> {
    const response = await apiClient.get(`/deliveries/${id}`);
    return response.data.data;
  },

  async recordAttempt(
    assignmentId: number,
    data: {
      result: 'DELIVERED' | 'FAILED';
      failure_reason?: string;
      recipient_name?: string;
      recipient_confirmation?: string;
      notes?: string;
      attempted_at?: string;
    }
  ): Promise<any> {
    const response = await apiClient.post(`/deliveries/${assignmentId}/attempts`, data);
    return response.data;
  },

  async uploadProof(
    assignmentId: number,
    formData: FormData
  ): Promise<any> {
    const response = await apiClient.post(`/deliveries/${assignmentId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async staffWorkload(): Promise<StaffWorkload[]> {
    const response = await apiClient.get('/deliveries/staff-workload');
    return response.data.data;
  },
};
