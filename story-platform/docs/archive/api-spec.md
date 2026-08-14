# Danh Sách Endpoint REST API Specification (/api/v1)

## 1. Auth Module (`/api/v1/auth`)
- `POST /auth/register`: Đăng ký tài khoản người dùng mới (ngầm định vai trò `USER`).
- `POST /auth/login`: Đăng nhập bằng Email + Mật khẩu, trả về Access Token & Refresh Token.
- `POST /auth/refresh`: Cấp mới Access Token từ Refresh Token hợp lệ.
- `POST /auth/logout`: Đăng xuất và vô hiệu hóa Session/Refresh Token.
- `POST /auth/verify-email`: Xác minh Email người dùng.

## 2. Public Module (`/api/v1`)
- `GET /stories`: Lấy danh sách truyện công khai (hỗ trợ lọc thể loại, trạng thái, sort, phân trang).
- `GET /stories/{slug}`: Lấy chi tiết bộ truyện công khai.
- `GET /stories/{slug}/chapters`: Lấy danh sách chương đã xuất bản.
- `GET /chapters/{id}`: Đọc/nghe nội dung chương công khai hoặc kiểm tra quyền sở hữu.
- `GET /search`: Tìm kiếm truyện gợi ý / kết quả theo từ khóa.
- `GET /leaderboards`: Bảng xếp hạng Top hoạt động đọc truyện (ngày/tuần/tháng).

## 3. Member Module (`/api/v1/me`) [Yêu cầu Role USER]
- `GET /me`: Lấy thông tin tài khoản & hồ sơ cá nhân.
- `PUT /me`: Cập nhật thông tin hồ sơ & cấu hình giao diện đọc.
- `GET/PUT /me/favorites`: Xem / Cập nhật danh sách truyện yêu thích.
- `GET/PUT /me/progress`: Xem / Cập nhật tiến độ đọc chương.
- `GET /wallets/me`: Xem số dư ví tín dụng người dùng (`USER_CREDIT`).

## 4. Creator Application Module (`/api/v1/creator`) [Yêu cầu Role USER]
- `POST /creator/applications`: Gửi hồ sơ đăng ký làm Creator (`PENDING_REVIEW`).
- `GET /creator/application`: Kiểm tra trạng thái và lịch sử duyệt đơn Creator.
- `PUT /creator/application`: Bổ sung thông tin đơn khi bị yêu cầu `NEEDS_INFO`.

## 5. Creator Studio Module (`/api/v1/creator`) [Yêu cầu Role CREATOR]
- `GET /creator/stories`: Danh sách truyện thuộc sở hữu Creator.
- `POST /creator/stories`: Tạo bộ truyện mới (nháp/gửi duyệt).
- `PUT /creator/stories/{id}`: Cập nhật thông tin bộ truyện.
- `POST /creator/chapters`: Soạn thảo và lưu chương mới.
- `PUT /creator/chapters/{id}`: Cập nhật nội dung chương.
- `POST /creator/chapters/{id}/submit`: Gửi chương lên hàng đợi duyệt.
- `POST /creator/rights`: Khai báo giấy phép/bằng chứng sở hữu bản quyền.

## 6. Partner Module (`/api/v1/partner`) [Yêu cầu Role CREATOR / PARTNER]
- `GET /partner/eligibility`: Kiểm tra điều kiện đủ để đăng ký Đối tác.
- `POST /partner/applications`: Gửi đơn xin tham gia chương trình Đối tác.
- `GET /partner/dashboard`: Xem thống kê thu nhập, lượt đọc & chiến dịch.
- `GET /partner/wallets`: Xem số dư ví thu nhập (`PARTNER_EARNING`) & ví chiến dịch (`PARTNER_CAMPAIGN`).
- `GET /partner/settlements`: Xem lịch sử đối soát thu nhập.
- `POST /partner/withdrawals`: Tạo yêu cầu rút thu nhập khả dụng.

## 7. Payments Module (`/api/v1/payments`)
- `GET /payments/packages`: Danh sách gói nạp tiền khả dụng.
- `POST /payments/orders`: Tạo đơn nạp tiền (kèm `idempotencyKey`).
- `GET /payments/orders/{orderCode}`: Kiểm tra trạng thái đơn nạp.
- `POST /webhooks/payments/{provider}`: Endpoint nhận Webhook xác thực từ Cổng thanh toán.

## 8. Admin Module (`/api/v1/admin`) [Yêu cầu Role ADMIN / REVIEWER]
- `GET /admin/queues/creator-applications`: Hàng đợi xét duyệt Creator.
- `PATCH /admin/creator-applications/{id}/decision`: Phê duyệt/Trả hồ sơ/Từ chối đơn Creator.
- `GET /admin/queues/partner-applications`: Hàng đợi xét duyệt Đối tác.
- `PATCH /admin/partner-applications/{id}/decision`: Quyết định đơn Đối tác.
- `GET /admin/queues/content`: Hàng đợi duyệt truyện & chương.
- `PATCH /admin/content/{type}/{id}/decision`: Duyệt / Trả về / Khóa nội dung.
- `GET /admin/withdrawals`: Hàng đợi yêu cầu rút tiền.
- `PATCH /admin/withdrawals/{id}/decision`: Duyệt / Chi trả / Từ chối rút tiền.
- `GET /admin/audit-logs`: Tra cứu nhật ký quản trị bất biến.
