import apiClient from './apiClient';

export interface DashboardData {
  role: string;
  // Admin/Manager stats
  parcel_stats?: {
    total?: number;
    today?: number;
    in_progress?: number;
    delivered?: number;
    failed?: number;
    returned?: number;
    delivery_success_rate?: number;
    received?: number;
    verified?: number;
    ready_for_delivery?: number;
    assigned?: number;
    out_for_delivery?: number;
    return_to_office?: number;
  };
  trends?: {
    date: string;
    received: number;
    delivered: number;
    failed: number;
  }[];
  active_staff_count?: number;
  today_received?: number;
  staff_workload?: { staff_name: string; active_count: number }[];
  // Staff dashboard
  assignments?: {
    active: number;
    completed_today: number;
    total_completed: number;
  };
  attempts_today?: number;
  failed_today?: number;
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const response = await apiClient.get('/dashboard');
    return response.data.data;
  },
};
