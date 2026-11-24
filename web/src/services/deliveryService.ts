import apiClient from './apiClient';
import { Assignment, DeliverySummary } from '../types';
export type { Assignment, DeliverySummary };

export interface AssignmentsResponse {
  data: Assignment[];
  meta: any;
}

export const deliveryService = {
  async summary(params?: { group_by?: 'day' | 'month'; date_from?: string; date_to?: string; staff_id?: number }): Promise<DeliverySummary[]> {
    const response = await apiClient.get('/deliveries/summary', { params });
    return response.data.data;
  },
  async myAssignments(params?: { status?: string; page?: number; per_page?: number }): Promise<AssignmentsResponse> {
    const response = await apiClient.get('/deliveries/my-assignments', { params });
    return response.data;
  },

  async allAssignments(params?: { staff_id?: number; status?: string; date_from?: string; date_to?: string; page?: number; per_page?: number; finished_only?: boolean }): Promise<AssignmentsResponse> {
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

  async staffWorkload(): Promise<any[]> {
    const response = await apiClient.get('/deliveries/staff-workload');
    return response.data.data;
  },
};