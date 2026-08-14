# Kiến Trúc Hệ Thống & Quy Chuẩn Kỹ Thuật (Phase 1)

## 1. Nguyên Tắc Cốt Lõi
- **Web-First**: Giai đoạn 1 tập trung xây dựng Website Responsive (Desktop + Mobile Web) dùng chung Backend API NestJS.
- **Single Source of Truth**: Backend Server là nguồn quyết định nghiệp vụ duy nhất. Client (Frontend) là môi trường không đáng tin cậy.
- **Security First**: Mọi ID, số tiền, vai trò, trạng thái gửi từ Frontend lên đều bắt buộc được Backend validate và xác thực qua JWT Token + Session Server.
- **Database**: MongoDB Atlas / local MongoDB sử dụng ODM Mongoose.

## 2. Phân Quyền Vai Trò & Trạng Thái
| Trạng Thái | Vai Trò (Roles) | Quyền Hạn Chính |
| :--- | :--- | :--- |
| **GUEST** | Khách chưa đăng nhập | Xem, tìm kiếm, đọc nội dung công khai |
| **USER** | Thành viên đã xác minh | Yêu thích, xem lịch sử, lưu tiến độ, nạp tiền mua chương/gói |
| **CREATOR** | Tác giả | Tạo nháp, gửi duyệt truyện/chương, khai báo quyền nội dung |
| **PARTNER** | Đối tác thương mại | Nhúng video YouTube, chạy chiến dịch affiliate, đối soát & rút thu nhập |
| **REVIEWER** | Biên tập viên | Kiểm tra nội dung, duyệt hoặc trả về yêu cầu sửa |
| **ADMIN** | Quản trị viên hệ thống | Duyệt Creator/Đối tác, quản lý thanh toán, phân quyền & audit log |

## 3. Các Lớp Bảo Vệ & Phòng Thủ
1. **Edge / CDN**: Hấp thụ traffic tĩnh, chống DDoS tầng mạng.
2. **Reverse Proxy / WAF**: Chặn SQLi, XSS, rate-limit thô theo IP.
3. **Application Validation**: Dùng Class-Validator whitelist payload DTO.
4. **Auth & RBAC**: JWT Access Token ngắn hạn, Refresh Token có rotation, Server-side RBAC Guard.
5. **Idempotency**: Bắt buộc idempotencyKey đối với tất cả giao dịch nạp tiền, ghi sổ ledger và webhook.
