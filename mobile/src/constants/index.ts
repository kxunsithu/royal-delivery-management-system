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
  primary: '#F5A623',
  primaryDark: '#E09410',
  primaryLight: '#FFD580',
  primaryBg: '#FFF9EE',
  secondary: '#2C2C2C',
  background: '#F8F8F8',
  white: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textLight: '#999999',
  border: '#E8E8E8',
  card: '#FFFFFF',
  success: '#27AE60',
  error: '#E74C3C',
  warning: '#F39C12',
  info: '#3498DB',
  // Status colors
  statusReceived: '#3498DB',
  statusVerified: '#9B59B6',
  statusInTransit: '#F39C12',
  statusDelivered: '#27AE60',
  statusFailed: '#E74C3C',
  statusDamaged: '#C0392B',
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
  RECEIVED: 'လက်ခံပြီး',
  VERIFIED: 'စစ်ဆေးပြီး',
  IN_TRANSIT: 'ပို့ဆောင်နေဆဲ',
  DELIVERED: 'ပို့ဆောင်ပြီး',
  FAILED: 'မအောင်မြင်',
  DAMAGED: 'ပျက်စီး/ဆုံးရှုံး',
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
  admin: 'အက်ဒ်မင်',
  manager: 'မန်နေဂျာ',
  delivery_staff: 'ပို့ဆောင်ရေးဝန်ထမ်း',
  accountant: 'စာရင်းကိုင်',
};
