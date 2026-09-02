import { useCallback } from 'react';
import { adminRepository } from '../services/repositories/AdminRepository';
import { useNotifications } from '../context/NotificationContext';

export interface BanNotificationParams {
  userId: string;
  userEmail: string;
  userName?: string;
  reason: string;
  status: 'SUSPENDED' | 'BANNED';
}

/**
 * Hook để gửi thông báo hệ thống tới người dùng khi quản trị viên thực hiện khóa tài khoản.
 */
export function useUserBanNotification() {
  const { showToast } = useNotifications();

  const notifyUserBanned = useCallback(
    ({ userId, userEmail, userName, reason, status }: BanNotificationParams) => {
      const statusText = status === 'BANNED' ? 'cấm vĩnh viễn' : 'tạm khóa';
      const title = '⚠️ Tài khoản của bạn đã bị khóa bởi quản trị viên';
      const message = `Tài khoản ${userEmail} (${userName || 'Thành viên'}) đã bị Ban Quản Trị ${statusText}. Lý do: "${reason}". Vui lòng liên hệ bộ phận hỗ trợ nếu cần thêm thông tin.`;

      // 1. Tạo và phát thông báo hệ thống tới hệ thống dữ liệu - gửi đến user cụ thể
      adminRepository.sendBroadcastNotification(title, message, 'WARNING', 'SPECIFIC_USER', userId);

      // 2. Hiển thị thông báo Toast khẩn cấp real-time qua NotificationProvider
      showToast({
        title,
        message,
        type: 'warning',
        duration: 9000,
      });

      // 3. Đồng bộ sự kiện thời gian thực giữa các tab & component
      window.dispatchEvent(new Event('toptruyenaudio_admin_sync'));
      window.dispatchEvent(
        new CustomEvent('toptruyenaudio_user_banned_event', {
          detail: { userId, userEmail, userName, reason, status },
        })
      );
    },
    [showToast]
  );

  return { notifyUserBanned };
}
