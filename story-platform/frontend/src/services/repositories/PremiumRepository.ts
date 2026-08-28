import { apiRequest } from '../apiClient';
import type { BackendSubscriptionPlan } from '../../types';

export type SubscriptionPlan = BackendSubscriptionPlan;

export interface PaymentRequest {
  packageCode: string;
}

export interface PaymentResponse {
  orderCode: string;
  planName: string;
  amount: number;
  durationDays: number;
  qrCode: string;
  checkoutUrl: string;
  status: string;
}

export interface PaymentStatus {
  orderCode: string;
  status: string;
  planName: string;
  amount: number;
  paidAt?: string;
}

export interface UserSubscription {
  userId: string;
  planId?: string;
  status: string;
  startAt?: string;
  endAt?: string;
  updatedAt: string;
  isActive?: boolean;
  daysRemaining?: number;
  plan?: SubscriptionPlan;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  paymentId: string;
  orderCode: string;
  type: string;
  amount: number;
  packageId: string;
  status: string;
  createdAt: string;
}

function unwrapPaymentStatus(raw: any): { success: boolean; data: PaymentStatus; message: string } {
  const payload = raw?.data?.status
    ? raw.data
    : raw?.data?.data?.status
      ? raw.data.data
      : raw?.status
        ? raw
        : null;

  if (!payload?.status) {
    return {
      success: false,
      data: raw?.data as PaymentStatus,
      message: raw?.message || 'Không đọc được trạng thái thanh toán',
    };
  }

  return {
    success: true,
    data: payload as PaymentStatus,
    message: raw?.message || `Trạng thái thanh toán: ${payload.status}`,
  };
}

export class PremiumRepository {
  /**
   * Lấy danh sách gói Premium đang active từ backend
   * Frontend chỉ hiển thị, không được tự quyết định giá
   */
  async getActivePlans(): Promise<{ success: boolean; data: SubscriptionPlan[]; message: string }> {
    return apiRequest('/premium/plans');
  }

  /**
   * Tạo payment request mới
   * Chỉ gửi packageCode, backend tự xác định giá và thời hạn
   */
  async createPayment(packageCode: string): Promise<{ success: boolean; data: PaymentResponse; message: string }> {
    return apiRequest('/premium/payments', {
      method: 'POST',
      body: JSON.stringify({ packageCode }),
    });
  }

  /**
   * Kiểm tra trạng thái payment
   * Backend kiểm tra trạng thái thật từ PayOS và xử lý business logic
   */
  async checkPaymentStatus(orderCode: string): Promise<{ success: boolean; data: PaymentStatus; message: string }> {
    const raw = await apiRequest(`/premium/payments/${orderCode}/status`);
    return unwrapPaymentStatus(raw);
  }

  /**
   * Hủy payment
   */
  async cancelPayment(orderCode: string): Promise<{ success: boolean; message: string }> {
    return apiRequest(`/premium/payments/${orderCode}/cancel`, {
      method: 'POST',
    });
  }

  /**
   * Lấy lịch sử giao dịch của user
   */
  async getPaymentHistory(page = 1, limit = 20): Promise<{ 
    success: boolean; 
    data: PaymentHistory[]; 
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return apiRequest(`/premium/payments/history?page=${page}&limit=${limit}`);
  }

  /**
   * Lấy subscription hiện tại của user
   */
  async getUserSubscription(): Promise<{ success: boolean; data: UserSubscription | null; message: string }> {
    return apiRequest('/premium/subscription');
  }
}

export const premiumRepository = new PremiumRepository();