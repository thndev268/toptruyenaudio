# Báo Cáo Kiểm Thử (Testing Report)

Cập nhật ngày 07/08/2026.

## 1. Kiểm Thử Đơn Vị & Tích Hợp Backend (Backend Unit & Integration Verification)

| Hạng mục / Module | Kịch bản kiểm thử | Trạng thái | Ghi chú chi tiết |
| :--- | :--- | :--- | :--- |
| **Mã hóa Mật Khẩu (PasswordHasherService)** | Băm mật khẩu mới bằng Argon2id; Xác thực chuỗi băm Bcrypt cũ và tự động nâng cấp sang Argon2id | **PASS** | `Argon2id` tuân thủ tiêu chuẩn an ninh cao nhất; tương thích ngược hoàn toàn với `Bcrypt`. |
| **Tính Hạn Sử Dụng Premium (SubscriptionExpiryCalculator)** | Gia hạn gói 1, 3, 6, 12 tháng theo chuẩn UTC, xử lý chính xác năm nhuận và ngày cuối tháng | **PASS** | Đã kiểm thử các mốc đặc biệt: 31/01 -> 28/02 (năm thường), 29/02 (năm nhuận) không tràn tháng. |
| **Tính Đẳng Nguồn (IdempotencyService)** | Xử lý request có `Idempotency-Key` trùng lặp trong môi trường song song | **PASS** | Khóa Atomic Lock, trả về kết quả đã cache mà không thực thi lại giao dịch DB. |
| **Bảo Vệ Đăng Nhập & Phục Hồi Admin** | Tách CLI bootstrap `npm run bootstrap:owner-admin`, gỡ bỏ hardcode admin | **PASS** | Không tự tạo Admin khi khởi động server, không log mật khẩu plain text. |
| **State Machine Cảnh Báo An Ninh** | Chuyển trạng thái `NEW -> INVESTIGATING -> ACTION_REQUIRED/RESOLVED/FALSE_POSITIVE -> REOPENED` | **PASS** | Bắt buộc nhập `resolutionNote`, `actionTaken`, `reason`. Báo `409 INVALID_STATE_TRANSITION` nếu vi phạm. |
| **Kiểm Tra Sẵn Sàng (Health Check `/health/ready`)** | Xác minh DB connection và thử nghiệm MongoDB Replica Set Session (Transactions) | **PASS** | Trả về `degraded` nếu kết nối DB tốt nhưng không hỗ trợ Replica Set / Transactions. |
| **Tránh Xung Đột Refresh Token (Single-Flight Queue)** | Gửi đồng thời nhiều API request bị 401 | **PASS** | `apiClient` chỉ gọi `/auth/refresh` 1 lần duy nhất; khóa hàng đợi chờ token mới và retry tự động. |
| **Bảo Vệ Dữ Liệu Người Dùng LocalStorage** | Đăng xuất hoặc lỗi 401 không thể phục hồi | **PASS** | Chỉ xóa `toptruyenaudio:token:v1`, tuyệt đối không gọi `localStorage.clear()`. |

## 2. Luồng Người Nghe (Listener Flow)

| Scenario | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| Truy cập trang chủ và xem danh sách truyện | **PASS** | Hiển thị đầy đủ banner, truyện mới và bảng xếp hạng. |
| Tìm kiếm truyện theo tên | **PASS** | Kết quả trả về chính xác theo từ khóa nhập vào. |
| Lọc truyện theo thể loại "Tiên Hiệp" | **PASS** | Danh sách được cập nhật đúng thể loại đã chọn. |
| Nghe audio và thay đổi tốc độ phát | **PASS** | Trình phát hoạt động mượt mà, đổi tốc độ 1.5x, 2.0x phản hồi ngay. |
| Chuyển tập (Next/Prev) | **PASS** | Tự động tải metadata và file audio của tập tiếp theo. |
| Lưu tiến độ khi reload trang | **PASS** | Sau khi reload, nhấn Play truyện cũ sẽ tiếp tục từ vị trí đã nghe. |
| Thêm truyện vào Playlist mới | **PASS** | Toast thông báo hiển thị, playlist xuất hiện trong Thư viện. |
| Thay đổi thông tin cá nhân (Hồ sơ) | **PASS** | Tên hiển thị trên Navbar cập nhật ngay sau khi nhấn Lưu. |

## 3. Luồng Quản Trị (Admin Flow)

| Scenario | Kết quả | Ghi chú |
| :--- | :--- | :--- |
| Đăng nhập vào Admin Portal | **PASS** | Đăng nhập an toàn qua JWT & Argon2id. |
| Khóa tài khoản người dùng vi phạm | **PASS** | Trạng thái chuyển sang `SUSPENDED`, có ghi nhận Audit Log. |
| Phê duyệt đơn Creator | **PASS** | Đơn chuyển sang `APPROVED`, vai trò người dùng nâng cấp lên `CREATOR`. |
| Bật chế độ bảo trì hệ thống | **PASS** | Banner bảo trì hiển thị trên toàn bộ các trang giao diện người dùng. |
| Xem nhật ký hệ thống (Audit Logs) | **PASS** | Danh sách log hiển thị theo trình tự thời gian ngược. |
| Xử lý cảnh báo an ninh (Security Events) | **PASS** | Tuân thủ đúng ma trận chuyển trạng thái và bắt buộc nhập lý do/biện pháp xử lý. |

## 4. Kết Luận
Toàn bộ logic Backend Phase 1 và tích hợp Frontend Repository Client đã được hoàn thiện, kiểm thử đầy đủ và đạt chuẩn an ninh nghiêm ngặt.

