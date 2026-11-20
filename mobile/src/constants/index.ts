// Production API Base URL
export const API_BASE_URL = 'https://royal-delivery-management-system.onrender.com/api/v1';

// Myanmar Font Family
export const FONTS = {
  regular: 'NotoSansMyanmar_400Regular',
  medium: 'NotoSansMyanmar_500Medium',
  semiBold: 'NotoSansMyanmar_600SemiBold',
  bold: 'NotoSansMyanmar_700Bold',
};

// ─── Design tokens ──────────────────────────────────────────────────────────
// Clean minimal white + orange. White surfaces, hairline borders, soft
// orange accents and generous rounding.
export const COLORS = {
  primary: '#F97316',
  primaryDark: '#C2410C',
  primaryLight: '#FFEDD5',
  primaryBg: '#FFF7ED',
  secondary: '#0F172A',

  background: '#F7F8FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  white: '#FFFFFF',
  muted: '#F3F4F6',

  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',

  border: '#ECEEF2',
  borderStrong: '#E2E5EA',

  success: '#16A34A',
  successBg: '#ECFDF3',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  warning: '#D97706',
  warningBg: '#FFFBEB',
  info: '#2563EB',
  infoBg: '#EFF6FF',

  // Status colors
  statusReceived: '#2563EB',
  statusVerified: '#7C3AED',
  statusInTransit: '#D97706',
  statusDelivered: '#16A34A',
  statusFailed: '#DC2626',
  statusDamaged: '#B91C1C',
};

export const RADIUS = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

// Minimal elevation — mostly rely on hairline borders.
export const SHADOWS = {
  none: {},
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
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

export const STATUS_BG = {
  RECEIVED: '#EFF6FF',
  VERIFIED: '#F5F3FF',
  IN_TRANSIT: '#FFFBEB',
  DELIVERED: '#ECFDF3',
  FAILED: '#FEF2F2',
  DAMAGED: '#FEF2F2',
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
