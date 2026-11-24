// Production API Base URL
export const API_BASE_URL = 'https://royal-delivery-api.up.railway.app/api/v1';

// Parcel Statuses
export const PARCEL_STATUSES = {
  RECEIVED: 'RECEIVED',
  VERIFIED: 'VERIFIED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  DAMAGED: 'DAMAGED',
} as const;

export const STATUS_LABELS_MM: Record<string, string> = {
  RECEIVED: 'လက်ခံ',
  VERIFIED: 'စစ်ဆေးပြီး',
  IN_TRANSIT: 'ဆောင်ရွက်နေဆဲ',
  DELIVERED: 'ပို့ဆောင်ပြီး',
  FAILED: 'မအောင်မြင်',
  DAMAGED: 'ပျက်ဆီး',
};

export const STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#2563EB',
  VERIFIED: '#7C3AED',
  IN_TRANSIT: '#D97706',
  DELIVERED: '#16A34A',
  FAILED: '#DC2626',
  DAMAGED: '#B91C1C',
};

export const STATUS_BG: Record<string, string> = {
  RECEIVED: '#EFF6FF',
  VERIFIED: '#F5F3FF',
  IN_TRANSIT: '#FFFBEB',
  DELIVERED: '#ECFDF3',
  FAILED: '#FEF2F2',
  DAMAGED: '#FEF2F2',
};

export const PRIORITY_LABELS_MM: Record<string, string> = {
  NORMAL: 'ပုံမှန်',
  HIGH: 'အရေးကြီး',
  URGENT: 'အရေးပေါ်',
};

export const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: '#16A34A',
  HIGH: '#D97706',
  URGENT: '#DC2626',
};

export const ROLE_LABELS_MM: Record<string, string> = {
  admin: 'Admin (CEO)',
  manager: 'Manager',
  delivery_staff: 'Delivery Staff',
  accountant: 'Accountant',
};

export const ASSIGNMENT_STATUS_LABELS_MM: Record<string, string> = {
  COMPLETED: 'ပြီးစီးပြီ',
  FAILED: 'မအောင်မြင်',
  REASSIGNED: 'ပြောင်းလဲ',
};

export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#16A34A',
  FAILED: '#DC2626',
  REASSIGNED: '#6B7280',
};

export const PARCEL_CATEGORIES = [
  { label: 'အဝတ်အစား', value: 'အဝတ်အစား' },
  { label: 'ဖုန်း / Electronics', value: 'ဖုန်း' },
  { label: 'Laptop / ကွန်ပျူတာ', value: 'Laptop' },
];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ['VERIFIED', 'DAMAGED'],
  VERIFIED: ['DELIVERED', 'FAILED', 'DAMAGED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  FAILED: ['DELIVERED'],
  DELIVERED: [],
  DAMAGED: [],
};

export const FAILURE_REASONS = [
  { value: 'RECIPIENT_UNAVAILABLE', label: 'လက်ခံသူ မရှိ' },
  { value: 'PHONE_UNREACHABLE', label: 'ဖုန်းမကောင်း' },
  { value: 'WRONG_ADDRESS', label: 'လိပ်စာ မှား' },
  { value: 'REFUSED', label: 'ငြင်းဆန်' },
  { value: 'RESCHEDULED', label: 'ချိန်းဆိုမှုပြောင်း' },
  { value: 'OTHER', label: 'အခြား' },
];

export const MM_MONTHS = [
  'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
  'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
];

export const MM_DAYS = ['တနင်္ဂနွေ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ'];

export function formatMMDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = MM_DAYS[d.getDay()];
  const day = d.getDate();
  const month = MM_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}၊ ${dayName}`;
}