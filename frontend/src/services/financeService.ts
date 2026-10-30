import apiClient from '@/lib/axios';
import type { Payment, CashHandover, Expense, PaginatedResponse, ApiResponse } from '@/types';

const financeService = {
  payments: (params: {
    payment_type?: string;
    status?: string;
    staff_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  } = {}) =>
    apiClient.get<PaginatedResponse<Payment>>('/finance/payments', { params }),

  expenses: (params: {
    category?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  } = {}) =>
    apiClient.get<PaginatedResponse<Expense>>('/finance/expenses', { params }),

  createExpense: (data: {
    category: string;
    description: string;
    amount: number;
    expense_date: string;
    receipt?: File;
  }) => {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('description', data.description);
    formData.append('amount', String(data.amount));
    formData.append('expense_date', data.expense_date);
    if (data.receipt) formData.append('receipt', data.receipt);
    return apiClient.post<ApiResponse<Expense>>('/finance/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  voidExpense: (id: number, void_reason: string) =>
    apiClient.patch(`/finance/expenses/${id}/void`, { void_reason }),

  handovers: (params: {
    status?: string;
    staff_id?: number;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  } = {}) =>
    apiClient.get<PaginatedResponse<CashHandover>>('/finance/handovers', { params }),

  submitHandover: (data: {
    period_start: string;
    period_end: string;
    submitted_amount: number;
    submission_notes?: string;
  }) =>
    apiClient.post<ApiResponse<CashHandover>>('/finance/handovers', data),

  verifyHandover: (id: number, data: {
    verified_amount: number;
    status: 'VERIFIED' | 'DISPUTED';
    verification_notes?: string;
  }) =>
    apiClient.patch(`/finance/handovers/${id}/verify`, data),

  summary: (params: { date_from?: string; date_to?: string } = {}) =>
    apiClient.get('/finance/summary', { params }),
};

export default financeService;
