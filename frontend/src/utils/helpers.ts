import type { ParcelStatus, ParcelPriority, PaymentType, HandoverStatus, AssignmentStatus } from '@/types';

// ─── Status Styling Helpers ────────────────────────────────────────────────────

export function getParcelStatusClass(status: ParcelStatus): string {
  const map: Record<ParcelStatus, string> = {
    RECEIVED_AT_MAE_SOT: 'status-received',
    RECEIVED_AT_MYAWADDY: 'status-received',
    VERIFIED:            'status-verified',
    READY_FOR_DELIVERY:  'status-ready',
    ASSIGNED:            'status-assigned',
    OUT_FOR_DELIVERY:    'status-out',
    DELIVERED:           'status-delivered',
    DELIVERY_FAILED:     'status-failed',
    RETURN_TO_OFFICE:    'status-return',
    RETURNED_TO_SENDER:  'status-returned',
    DAMAGED:             'status-damaged',
    MISSING:             'status-missing',
  };
  return map[status] || 'bg-gray-500/15 text-gray-400';
}

export function getPriorityClass(priority: ParcelPriority): string {
  const map: Record<ParcelPriority, string> = {
    NORMAL: 'bg-gray-500/15 text-gray-400 border border-gray-500/30',
    HIGH:   'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    URGENT: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return map[priority] || '';
}

export function getHandoverStatusClass(status: HandoverStatus): string {
  const map: Record<HandoverStatus, string> = {
    PENDING:   'bg-gray-500/15 text-gray-400 border border-gray-500/30',
    SUBMITTED: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    VERIFIED:  'bg-green-500/15 text-green-400 border border-green-500/30',
    DISPUTED:  'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  return map[status] || '';
}

// ─── Currency Formatting ───────────────────────────────────────────────────────

export function formatCurrency(amount: number | null | undefined, locale = 'en'): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return locale === 'my' ? '— ကျပ်' : 'K —';
  }
  if (locale === 'my') {
    return `${value.toLocaleString('en-US')} ကျပ်`;
  }
  return `K ${value.toLocaleString('en-US')}`;
}

// ─── Date Formatting ───────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined, locale = 'en'): string {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';

  if (locale === 'my') {
    return date.toLocaleDateString('my-MM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string | null | undefined, locale = 'en'): string {
  if (!dateStr) return '-';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';

  return date.toLocaleString(locale === 'my' ? 'my-MM' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ─── Error Handling ───────────────────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  if (typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      'Request failed'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

export function getValidationErrors(error: unknown): Record<string, string[]> {
  if (!error) return {};
  const axiosError = error as any;
  return axiosError?.response?.data?.errors || {};
}

// ─── Role Helpers ─────────────────────────────────────────────────────────────

export function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    admin: 'bg-primary/15 text-primary border border-primary/30',
    manager: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    accountant: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
    delivery_staff: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  };
  return map[role] || 'bg-gray-500/15 text-gray-400';
}

// ─── Google Maps ──────────────────────────────────────────────────────────────

export function buildGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
