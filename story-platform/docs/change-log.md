# Nhật Ký Thay Đổi (Change Log)

Lịch sử cập nhật mã nguồn và tài liệu của dự án TOP TRUYỆN AUDIO.

## [2026-08-07] - Hoàn Thiện Backend Phase 1 & Sửa Đổi Toàn Diện

### Backend
*   **Security & Password Hashing**: Tích hợp `PasswordHasherService` chuẩn Argon2id, hỗ trợ xác thực và tự động nâng cấp hash Bcrypt cũ transparently.
*   **Bootstrap Admin**: Gỡ bỏ hoàn toàn logic `bootstrapOwnerAdmin` trong startup lifecycle `main.ts`. Tạo CLI script `npm run bootstrap:owner-admin` độc lập.
*   **Subscriptions & Idempotency**:
    *   Chuẩn hóa `SubscriptionPlanId` enum (`MONTHLY_1`, `MONTHLY_3`, `MONTHLY_6`, `YEARLY_12`).
    *   Xây dựng `calculateSubscriptionExpiry` xử lý ngày hết hạn theo chuẩn UTC (xử lý chính xác năm nhuận, tháng 28/29/30/31 ngày).
    *   Triển khai `IdempotencyService` và `IdempotencyRecord` schema với TTL index 7 ngày cho cấp/hủy Premium.
*   **Security Events State Machine**:
    *   Định nghĩa ma trận chuyển trạng thái `ALLOWED_TRANSITIONS` (`NEW -> INVESTIGATING -> ACTION_REQUIRED/RESOLVED/FALSE_POSITIVE -> REOPENED`).
    *   Bắt buộc đầy đủ `resolutionNote`, `actionTaken`, `reason` khi đóng cảnh báo an ninh. Trả về `409 INVALID_STATE_TRANSITION` nếu chuyển trạng thái không hợp lệ.
*   **Health Checks**: Nâng cấp `/health/ready` kiểm tra MongoDB connection và thử nghiệm Replica Set Session (Transactions). Trả về `degraded` nếu không hỗ trợ Transactions.

### Frontend
*   **ApiRepositories & Single-Flight Lock**: Tích hợp khóa hàng đợi đơn (single-flight queue) trong `apiClient.ts` khi gặp lỗi 401, đảm bảo chỉ 1 request thực hiện `/auth/refresh` đồng thời.
*   **Local Storage Protection**: Chỉ gỡ bỏ access token `toptruyenaudio:token:v1` khi hết phiên; bảo vệ tuyệt đối lịch sử nghe, yêu thích và playlist của người dùng (`localStorage.clear()` không được sử dụng).

### Documentation
*   Cập nhật `testing-report.md`, `change-log.md`, `known-gaps-and-next-steps.md`, `data-dictionary.md`, `admin-api-contract.md`.

## [2026-08-06] - Cập nhật Giao diện & Tài liệu

### Frontend
*   **Profile**: Triển khai trang `ProfileView.tsx` cho phép người dùng chỉnh sửa thông tin cá nhân.
*   **Playlist**: Tích hợp menu "Thêm vào danh sách phát" tại trang chi tiết truyện.
*   **Layout**: Sửa lỗi CSS khiến bộ lọc (Filter) không thể cuộn trên mobile.
*   **Navigation**: Thêm liên kết Hồ sơ và nút Đăng xuất vào Menu Mobile.
*   **Routing**: Khai báo route `/account/profile` trong `App.tsx`.

### Documentation
*   **Chỉnh sửa lớn**: Khởi tạo bộ tài liệu kỹ thuật mới trong thư mục `/docs/` phản ánh đúng hiện trạng code.
*   **Archive**: Lưu trữ các tài liệu dự thảo cũ không còn phù hợp với hiện trạng frontend.
*   **Traceability**: Xây dựng ma trận đối soát tính năng và mã nguồn.

## [2026-08-01] - Khởi tạo Project Phase 1

### Frontend
*   Khởi tạo cấu trúc dự án React + Vite + Tailwind.
*   Thiết kế giao diện trang chủ, khám phá và trình phát audio cơ bản.
*   Xây dựng hệ thống Admin Portal với hơn 15 màn hình quản trị.
*   Triển khai `StorageAdapter` và cơ chế Mock Repository.

### Documentation
*   Phát thảo kiến trúc hệ thống và API Spec (Dự thảo).
