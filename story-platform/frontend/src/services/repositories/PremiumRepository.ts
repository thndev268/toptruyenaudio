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

class PremiumRepository {
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
    return apiRequest(`/premium/payments/${orderCode}/status`);
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