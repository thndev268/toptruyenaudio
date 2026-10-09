# TOP TRUYỆN AUDIO - Nền Tảng Nghe Truyện Số (Giai Đoạn 1)

Chào mừng bạn đến với dự án **TOP TRUYỆN AUDIO**, một ứng dụng web hiện đại được tối ưu hóa cho việc trải nghiệm nghe truyện audio, được xây dựng với mục tiêu mang lại sự tiện dụng, an toàn và cá nhân hóa tối đa cho người dùng.

## 🏗 Kiến Trúc Hệ Thống

Dự án được phát triển theo mô hình **Full-stack (Frontend - Backend - Database)**:

- **Frontend**: React 18+ với Vite, Tailwind CSS, Framer Motion. Thiết kế Single-screen (SPA) tinh gọn, thanh lịch.
- **Backend**: NestJS (Node.js framework), sử dụng TypeScript, Passport.js (JWT) và Mongoose (MongoDB).
- **Database**: MongoDB (Mongoose), hỗ trợ index hiệu năng cao và ACID-like transactions khi cần.

## 🛡 Bảo Mật & An Toàn Thông Tin (Security First)

Hệ thống được thiết kế với các tiêu chuẩn bảo mật nghiêm ngặt:

### 1. Quản lý Danh tính & Phiên (Auth & Session)
- **Mật khẩu**: Hash bằng thuật toán **Argon2id** (tiêu chuẩn OWASP), hỗ trợ re-hash từ bcrypt cũ.
- **Tokens**:
    - **Access Token**: Chỉ lưu in-memory trên Frontend.
    - **Refresh Token**: Lưu trong **HttpOnly, Secure, SameSite: Lax Cookie**.
    - **Token Rotation**: Hệ thống xoay vòng refresh token liên tục. Nếu phát hiện token cũ bị sử dụng lại (Reuse Detection), toàn bộ "gia đình" token đó sẽ bị vô hiệu hóa ngay lập tức.
- **Đăng xuất**: Hỗ trợ đăng xuất khỏi thiết bị hiện tại hoặc **Đăng xuất từ xa khỏi tất cả thiết bị**.

### 2. Bảo vệ Hạ tầng & API
- **Security Headers**: Tích hợp **Helmet.js** để chống XSS, Clickjacking và các cuộc tấn công sniffing.
- **Rate Limiting**: Sử dụng **Throttler** để ngăn chặn Brute-force và DoS ở tầng ứng dụng.
- **CORS**: Cấu hình nghiêm ngặt chỉ cho phép các domain được định nghĩa trước.
- **Validation**: Kiểm tra dữ liệu đầu vào (DTO) bằng `class-validator` với chế độ `whitelist: true`.

### 3. Bảo vệ Dữ liệu
- **Chống IDOR/BOLA**: Mọi yêu cầu lấy hoặc sửa dữ liệu cá nhân (Hồ sơ, Audio Progress, Support Ticket) đều được kiểm tra quyền sở hữu dựa trên ID từ JWT đã giải mã, không tin tưởng vào ID gửi từ Client.
- **Sanitization**: Tự động loại bỏ các trường nhạy cảm (như `passwordHash`) khỏi phản hồi API.
- **Audit Logs**: Ghi lại mọi thao tác quan trọng của Quản trị viên (Khóa tài khoản, Thay đổi gói cước) để phục vụ tra soát.

## 🚀 Hướng Dẫn Cài Đặt

### Yêu cầu hệ thống
- Node.js v18.x trở lên
- MongoDB v5.x trở lên (hoặc Atlas)

### Các bước cài đặt
1. **Clone repository** và cài đặt dependencies:
   ```bash
   npm install
   ```

2. **Cấu hình biến môi trường**:
   Sao chép `.env.example` thành `.env` và điền các thông tin cần thiết:
   - `MONGODB_URI`: Đường dẫn kết nối database.
   - `JWT_ACCESS_SECRET`: Secret key cho Access Token.
   - `JWT_REFRESH_SECRET`: Secret key cho Refresh Token.

3. **Khởi chạy chế độ Phát triển (Development)**:
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

4. **Tài liệu API (Swagger)**:
   Sau khi backend chạy, truy cập: `http://localhost:3001/api/v1/docs`

## 👥 Phân Quyền Người Dùng

1. **USER**: Nghe truyện, lưu lịch sử, quản lý hồ sơ cá nhân.
2. **PREMIUM**: (Dự kiến) Truy cập nội dung độc quyền, chất lượng âm thanh cao.
3. **OWNER_ADMIN**: Toàn quyền quản trị hệ thống, quản lý người dùng và hỗ trợ kỹ thuật.

---
*Dự án đang trong giai đoạn triển khai thử nghiệm nội bộ. Mọi lỗi bảo mật hoặc góp ý vui lòng liên hệ qua hệ thống Support tích hợp.*
