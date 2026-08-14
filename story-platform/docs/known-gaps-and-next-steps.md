# Lỗ Hổng & Bước Tiếp Theo (Known Gaps & Next Steps)

Cập nhật ngày 07/08/2026.

## 1. Trạng Thái Hoàn Thành Phase 1 (Phase 1 Status)

| Hạng mục / Yêu cầu | Trạng thái | Chi tiết triển khai |
| :--- | :--- | :--- |
| **Mã hóa Mật Khẩu (Argon2id)** | **HOÀN THÀNH** | Tích hợp `PasswordHasherService` chuẩn Argon2id, tự động nâng cấp Bcrypt hash cũ. |
| **Gỡ Bỏ Hardcode Admin Startup** | **HOÀN THÀNH** | Tách CLI bootstrap `npm run bootstrap:owner-admin`, không log credentials plain text. |
| **Tự Động Gia Hạn & Tính Hạn UTC** | **HOÀN THÀNH** | Chuẩn hóa gói cước enum và `SubscriptionExpiryCalculator` UTC-safe. |
| **Tính Đẳng Nguồn (Idempotency)** | **HOÀN THÀNH** | `IdempotencyService` khóa atomic lock, trả về cached result nếu request trùng key. |
| **State Machine Cảnh Báo An Ninh** | **HOÀN THÀNH** | Bắt buộc `resolutionNote`, `actionTaken`, `reason`. Báo `409` khi chuyển trạng thái sai. |
| **Health Checks `/health/ready`** | **HOÀN THÀNH** | Kiểm tra kết nối MongoDB và Replica Set Session Transactions. |
| **Single-Flight Refresh Token** | **HOÀN THÀNH** | Hàng đợi đơn trong `apiClient.ts` ngăn race-condition khi token hết hạn. |
| **Bảo Vệ Local Data** | **HOÀN THÀNH** | Giữ nguyên lịch sử, playlist, yêu thích của người dùng; chỉ xóa auth token. |

## 2. Các Mục Cần Phát Triển Trong Phase 2 (Phase 2 Roadmap)

*   **Hệ thống Phân Quyền Nâng Cao**: Mở rộng phân quyền Chi tiết (Granular Roles & Permissions) cho Moderation Team (Reviewer, Content Editor).
*   **Audio Streaming CDN Integration**: Kết nối S3 / Cloudflare R2 cho việc phân phối tập audio với Signed URLs và HLS streaming.
*   **Creator Studio Backend**: Hoàn thiện API tải lên tập audio, quản lý tiến độ duyệt nội dung và thống kê doanh thu cho Tác giả/Creator.
*   **Webhooks & Payment Gateways**: Tích hợp MoMo/VNPay/ZaloPay Webhooks cho việc tự động kích hoạt Premium qua giao dịch ngân hàng thực tế.

