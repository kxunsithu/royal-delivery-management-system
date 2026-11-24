export type ThemeMode = 'light' | 'dark';
export type Role = 'admin' | 'manager' | 'accountant' | 'delivery_staff';

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  is_active: boolean;
  profile_image_url?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  active_count?: number;
  completed_count?: number;
  total_count?: number;
  fee_mmk?: number;
  fee_thb?: number;
  cod_mmk?: number;
  cod_thb?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
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

export interface DeliveryAssignmentSummary {
  id: number;
  staff?: { id: number; name: string; phone?: string };
  assigned_by?: { id: number; name: string };
  status: string;
  notes?: string;
  assigned_at: string;
  completed_at?: string;
}

export interface ProofPhoto {
  id: number;
  type?: string;
  file_url: string;
  notes?: string;
  attempt_result?: string;
  recipient_name?: string;
  attempted_at?: string;
}

export interface DeliveryAttempt {
  id: number;
  staff?: { id: number; name: string };
  attempted_at: string;
  result: string;
  failure_reason?: string;
  recipient_name?: string;
  notes?: string;
  proof_photos?: { id: number; type: string; file_url: string | null; notes?: string }[];
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

export interface ParcelItem {
  id?: number;
  product_name: string;
  quantity: number;
}

export interface Parcel {
  id: number;
  tracking_number: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  description?: string;
  items?: ParcelItem[];
  weight?: number;
  kg_fee?: number;
  notes?: string;
  delivery_fee: number;
  cod_amount: number;
  is_cod: boolean;
  currency: 'MMK' | 'THB';
  cod_currency?: 'MMK' | 'THB';
  status: string;
  condition: string;
  priority: string;
  received_at?: string;
  delivered_at?: string;
  failed_at?: string;
  received_by?: { id: number; name: string };
  active_assignment?: {
    id: number;
    staff: { id: number; name: string };
    assigned_by?: { id: number; name: string };
    assigned_at: string;
  };
  status_histories?: StatusHistory[];
  delivery_assignments?: DeliveryAssignmentSummary[];
  delivery_attempts?: DeliveryAttempt[];
  proof_photos?: ProofPhoto[];
  damage_description?: string;
  images?: ParcelImage[];
  created_at: string;
  updated_at: string;
}

export interface ParcelFilters {
  search?: string;
  status?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_dir?: string;
  assigned_by_id?: number;
}

export interface ContactSuggestion {
  type: 'sender' | 'recipient';
  name: string;
  phone: string;
  delivery_address?: string;
}

export interface DailySummary {
  date: string;
  parcel_count: number;
  sender_count: number;
  recipient_count: number;
  received_count: number;
  verified_count: number;
  in_transit_count: number;
  delivered_count: number;
  failed_count: number;
  damaged_count: number;
  fee_mmk: number;
  fee_thb: number;
  cod_mmk: number;
  cod_thb: number;
}

export interface MonthlySummary {
  month: string;
  parcel_count: number;
  sender_count: number;
  recipient_count: number;
  received_count: number;
  verified_count: number;
  in_transit_count: number;
  delivered_count: number;
  failed_count: number;
  damaged_count: number;
  fee_mmk: number;
  fee_thb: number;
  cod_mmk: number;
  cod_thb: number;
  day_count: number;
}

export interface Customer {
  name: string;
  phone: string;
  parcel_count: number;
  received_count?: number;
  verified_count?: number;
  in_transit_count?: number;
  delivered_count?: number;
  failed_count?: number;
  damaged_count?: number;
  last_parcel_at?: string;
  type: 'sender' | 'recipient';
}

export interface Assignment {
  id: number;
  parcel?: Parcel;
  staff?: { id: number; name: string; phone?: string };
  assigned_by?: { id: number; name: string };
  status: string;
  notes?: string;
  assigned_at: string;
  completed_at?: string;
  delivery_attempts?: DeliveryAttempt[];
}

export interface AssignmentsResponse extends PaginatedResponse<Assignment> {
  meta: PaginationMeta & {
    active_count?: number;
    completed_count?: number;
    total_count?: number;
  };
}

export interface DeliverySummary {
  period: string;
  date_from: string;
  date_to: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  in_transit_count: number;
  fee_mmk: number;
  fee_thb: number;
  cod_mmk: number;
  cod_thb: number;
}

export interface StaffWorkload {
  staff?: { id: number; name: string };
  total_assignments: number;
  active: number;
  completed: number;
}

export interface DashboardData {
  role: string;
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
    damaged?: number;
  };
  trends?: { date: string; received: number; delivered: number; failed: number }[];
  active_staff_count?: number;
  today_received?: number;
  totals?: {
    fee_mmk?: number;
    fee_thb?: number;
    cod_mmk?: number;
    cod_thb?: number;
  };
  staff_workload?: { staff_name: string; active_count: number }[];
  assignments?: {
    active: number;
    completed_today: number;
    total_completed: number;
  };
  attempts_today?: number;
  failed_today?: number;
}

export interface PreviewImage {
  id: number | string;
  url: string;
  original_name?: string;
}

export interface SummaryGroup {
  period: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  active_count: number;
  assignments: Assignment[];
}
