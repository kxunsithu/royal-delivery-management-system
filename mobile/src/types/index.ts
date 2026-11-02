// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'accountant' | 'delivery_staff';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  employee_id?: string;
  profile_image?: string;
  profile_image_url?: string | null;
  is_active: boolean;
  role: UserRole;
  role_display: string;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  data: {
    token: string;
    token_type: string;
    user: User;
  };
  message: string;
}

// ─── Parcel Types ─────────────────────────────────────────────────────────────

export type ParcelStatus =
  | 'RECEIVED'
  | 'VERIFIED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'DAMAGED';

export type ParcelCondition = 'GOOD' | 'DAMAGED' | 'MISSING';
export type ParcelPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface DeliveryArea {
  id: number;
  name: string;
  name_mm?: string;
  description?: string;
  is_active: boolean;
}

export interface Parcel {
  id: number;
  tracking_number: string;
  sender_name?: string;
  sender_phone?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_area?: DeliveryArea;
  description?: string;
  quantity: number;
  weight?: number;
  notes?: string;
  delivery_fee: number;
  cod_amount: number;
  is_cod: boolean;
  status: ParcelStatus;
  condition: ParcelCondition;
  priority: ParcelPriority;
  received_at?: string;
  received_by?: { id: number; name: string };
  active_assignment?: {
    id: number;
    staff?: { id: number; name: string };
    assigned_at: string;
  };
  damage_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ParcelDetail extends Parcel {
  status_histories: ParcelStatusHistory[];
  delivery_assignments: DeliveryAssignment[];
  delivery_attempts: DeliveryAttempt[];
}

export interface ParcelStatusHistory {
  id: number;
  from_status?: ParcelStatus;
  to_status: ParcelStatus;
  reason?: string;
  notes?: string;
  changed_by?: { id: number; name: string };
  created_at: string;
}

// ─── Delivery Types ───────────────────────────────────────────────────────────

export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REASSIGNED';
export type DeliveryResult = 'DELIVERED' | 'FAILED';
export type FailureReason =
  | 'RECIPIENT_UNAVAILABLE'
  | 'PHONE_UNREACHABLE'
  | 'WRONG_ADDRESS'
  | 'REFUSED'
  | 'RESCHEDULED'
  | 'OTHER';

export interface DeliveryAssignment {
  id: number;
  parcel?: Parcel;
  staff?: { id: number; name: string; phone?: string };
  assigned_by?: { id: number; name: string };
  status: AssignmentStatus;
  notes?: string;
  assigned_at: string;
  completed_at?: string;
  delivery_attempts?: DeliveryAttempt[];
}

export interface DeliveryAttempt {
  id: number;
  staff?: { id: number; name: string };
  attempted_at: string;
  result: DeliveryResult;
  failure_reason?: FailureReason;
  recipient_name?: string;
  notes?: string;
}

// Finance types removed

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface AdminDashboard {
  role: 'admin';
  parcel_stats: {
    total: number;
    today: number;
    in_progress: number;
    delivered: number;
    failed: number;
    returned: number;
    delivery_success_rate: number;
  };
  trends: Array<{ date: string; received: number; delivered: number; failed: number }>;
  active_staff_count: number;
}

export interface BusinessSetting {
  id: number;
  key: string;
  value: string | number | boolean | null;
  type: string;
  description?: string;
}
