import apiClient from '@/lib/axios';
import type { DeliveryAssignment, PaginatedResponse, ApiResponse } from '@/types';

export interface RecordAttemptData {
  result: 'DELIVERED' | 'FAILED';
  failure_reason?: string;
  recipient_name?: string;
  recipient_confirmation?: string;
  delivery_fee_collected: number;
  cod_collected?: number;
  notes?: string;
  attempted_at?: string;
}

const deliveryService = {
  myAssignments: (params: { status?: string; page?: number; per_page?: number } = {}) =>
    apiClient.get<PaginatedResponse<DeliveryAssignment>>('/deliveries/my-assignments', { params }),

  allAssignments: (params: {
    staff_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  } = {}) =>
    apiClient.get<PaginatedResponse<DeliveryAssignment>>('/deliveries/assignments', { params }),

  get: (id: number) =>
    apiClient.get<ApiResponse<DeliveryAssignment>>(`/deliveries/${id}`),

  staffWorkload: (params: { date_from?: string; date_to?: string } = {}) =>
    apiClient.get('/deliveries/staff-workload', { params }),

  recordAttempt: (assignmentId: number, data: RecordAttemptData) =>
    apiClient.post(`/deliveries/${assignmentId}/attempts`, data),

  uploadProof: (assignmentId: number, formData: FormData) =>
    apiClient.post(`/deliveries/${assignmentId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default deliveryService;
