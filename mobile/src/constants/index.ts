// Production API Base URL
export const API_BASE_URL = 'https://royal-delivery-management-system.onrender.com/api/v1';

// Myanmar Font Family
export const FONTS = {
  regular: 'NotoSansMyanmar_400Regular',
  medium: 'NotoSansMyanmar_500Medium',
  semiBold: 'NotoSansMyanmar_600SemiBold',
  bold: 'NotoSansMyanmar_700Bold',
};

// Colors - Yellow/Parcel theme
export const COLORS = {
  primary: '#E67701',
  primaryDark: '#B45309',
  primaryLight: '#FDE68A',
  primaryBg: '#FFFBEB',
  secondary: '#1F2937',
  background: '#F3F4F6',
  white: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  card: '#FFFFFF',
  success: '#16A34A',
  error: '#DC2626',
  warning: '#D97706',
  info: '#2563EB',
  // Status colors
  statusReceived: '#2563EB',
  statusVerified: '#7C3AED',
  statusInTransit: '#D97706',
  statusDelivered: '#16A34A',
  statusFailed: '#DC2626',
  statusDamaged: '#B91C1C',
};

// Parcel Statuses
export const PARCEL_STATUSES = {
  RECEIVED: 'RECEIVED',
  VERIFIED: 'VERIFIED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  DAMAGED: 'DAMAGED',
};

export const STATUS_LABELS_MM = {
  RECEIVED:   'လက်ခံ',
  VERIFIED:   'စစ်ဆေးပြီး',
  IN_TRANSIT: 'ဆောင်ရွက်နေဆဲ',
  DELIVERED:  'ပို့ဆောင်ပြီး',
  FAILED:     'မအောင်မြင်',
  DAMAGED:    'ပျက်ဆီး',
};

export const STATUS_COLORS = {
  RECEIVED: COLORS.statusReceived,
  VERIFIED: COLORS.statusVerified,
  IN_TRANSIT: COLORS.statusInTransit,
  DELIVERED: COLORS.statusDelivered,
  FAILED: COLORS.statusFailed,
  DAMAGED: COLORS.statusDamaged,
};

export const PRIORITY_LABELS_MM = {
  NORMAL: 'ပုံမှန်',
  HIGH: 'အရေးကြီး',
  URGENT: 'အရေးပေါ်',
};

export const PRIORITY_COLORS = {
  NORMAL: COLORS.success,
  HIGH: COLORS.warning,
  URGENT: COLORS.error,
};

export const ROLE_LABELS_MM = {
  admin: 'Admin (CEO)',
  manager: 'Manager',
  delivery_staff: 'Delivery Staff',
  accountant: 'Accountant',
};

export const ASSIGNMENT_STATUS_LABELS_MM: Record<string, string> = {
  COMPLETED:   'ပြီးစီးပြီ',
  FAILED:      'မအောင်မြင်',
  REASSIGNED:  'ပြောင်းလဲ',
};

export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  COMPLETED:   COLORS.statusDelivered,
  FAILED:      COLORS.statusFailed,
  REASSIGNED:  COLORS.textSecondary,
};

export const PARCEL_CATEGORIES = [
  { label: 'အဝတ်အစား', value: 'အဝတ်အစား', icon: 'shirt-outline' },
  { label: 'ဖုန်း / Electronics', value: 'ဖုန်း', icon: 'phone-portrait-outline' },
  { label: 'Laptop / ကွန်ပျူတာ', value: 'Laptop', icon: 'laptop-outline' },
];
