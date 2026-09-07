# Hướng dẫn cài đặt Telegram Bot cho hệ thống Chat

## Tổng quan
Hướng dẫn này sẽ giúp bạn thiết lập Telegram Bot để tích hợp với hệ thống chat realtime giữa website Audio Truyện và Telegram Admin.

## Bước 1: Tạo Telegram Bot qua BotFather

### 1.1. Tìm và chat với BotFather
1. Mở Telegram và tìm kiếm `@BotFather`
2. Bắt đầu cuộc trò chuyện với BotFather

### 1.2. Tạo bot mới
1. Gửi lệnh `/newbot` cho BotFather
2. BotFather sẽ yêu cầu bạn đặt tên cho bot (ví dụ: "TopTruyenAudio Support Bot")
3. Sau đó đặt username cho bot (ví dụ: `toptruyenaudio_bot` - phải kết thúc bằng `_bot`)

### 1.3. Lấy Bot Token
- BotFather sẽ gửi cho bạn một token dạng: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Lưu token này cẩn thận** - đây là API key để truy cập bot của bạn
- Token sẽ được sử dụng trong biến môi trường `TELEGRAM_BOT_TOKEN`

## Bước 2: Lấy Chat ID của Admin

### 2.1. Tìm Chat ID của bạn
Có 2 cách để lấy Chat ID:

#### Cách 1: Sử dụng API trực tiếp
1. Mở trình duyệt và truy cập URL sau (thay YOUR_BOT_TOKEN bằng token của bạn):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
2. Gửi một tin nhắn bất kỳ cho bot của bạn trên Telegram
3. Refresh trang web trên trình duyệt
4. Tìm trong JSON returned, tìm phần `chat` -> `id`
5. ID này thường là số (ví dụ: `123456789`)

#### Cách 2: Sử dụng bot khác
1. Tìm và chat với `@userinfobot` trên Telegram
2. Bot này sẽ trả về Chat ID của bạn

### 2.2. Lưu Chat ID
- Chat ID này sẽ được sử dụng trong biến môi trường `TELEGRAM_ADMIN_CHAT_ID`
- Đây là ID của tài khoản Telegram admin sẽ nhận thông báo

## Bước 3: Cấu hình biến môi trường

### 3.1. Thêm các biến vào .env file
Trong file `.env` của backend, thêm các biến sau:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_ADMIN_CHAT_ID="123456789"
TELEGRAM_WEBHOOK_SECRET="your-secret-token-here"

# Application URL for Telegram webhook
APP_URL="https://your-app-url.com"
```

### 3.2. Giải thích các biến
- `TELEGRAM_BOT_TOKEN`: Token nhận được từ BotFather
- `TELEGRAM_ADMIN_CHAT_ID`: Chat ID của admin Telegram
- `TELEGRAM_WEBHOOK_SECRET`: Một chuỗi ngẫu nhiên để bảo mật webhook (tự tạo)
- `APP_URL`: URL của ứng dụng backend của bạn (để Telegram gửi webhook)

## Bước 4: Cấu hình Webhook

### 4.1. Cấu hình Webhook URL
Webhook URL sẽ có dạng:
```
https://your-app-url.com/telegram/webhook
```

### 4.2. Thiết lập Webhook
Có 2 cách để thiết lập webhook:

#### Cách 1: Sử dụng API trực tiếp
```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app-url.com/telegram/webhook",
    "secret_token": "your-secret-token-here"
  }'
```

#### Cách 2: Sử dụng endpoint trong ứng dụng
Sau khi deploy ứng dụng, bạn có thể gọi endpoint:
```
POST /telegram/set-webhook
```
Body:
```json
{
  "url": "https://your-app-url.com/telegram/webhook"
}
```

### 4.3. Kiểm tra Webhook
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

## Bước 5: Deploy trên Render

### 5.1. Chuẩn bị Repository
1. Đảm bảo code đã được push lên GitHub
2. Kiểm tra file `.env.example` có đầy đủ các biến cần thiết

### 5.2. Tạo Web Service trên Render
1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" -> "Web Service"
3. Kết nối GitHub repository của bạn
4. Cấu hình:
   - **Name**: `toptruyenaudio-backend`
   - **Region**: Chọn region gần nhất (Singapore cho Việt Nam)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

### 5.3. Cấu hình Environment Variables trên Render
Trong phần "Environment" của Render, thêm các biến:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789
TELEGRAM_WEBHOOK_SECRET=your-secret-token-here
APP_URL=https://toptruyenaudio-backend.onrender.com
FRONTEND_URL=https://your-frontend-url.com
```

### 5.4. Deploy và Test
1. Click "Deploy Web Service"
2. Chờ quá trình deploy hoàn tất
3. Lấy URL của service (ví dụ: `https://toptruyenaudio-backend.onrender.com`)
4. Cập nhật `APP_URL` trong environment variables nếu cần
5. Thiết lập webhook với URL mới

## Bước 6: Test hệ thống

### 6.1. Test từ Website
1. Mở website Audio Truyện
2. Đăng nhập với tài khoản user
3. Click vào nút "Chat hỗ trợ" (góc phải dưới)
4. Gửi một tin nhắn test

### 6.2. Test từ Telegram
1. Mở Telegram và kiểm tra bot của bạn
2. Bạn sẽ nhận được thông báo về tin nhắn mới từ user
3. Click nút "💬 Trả lời" để trả lời
4. Gửi tin nhắn trả lời
5. Kiểm tra lại website - tin nhắn sẽ xuất hiện realtime

### 6.3. Test đóng hội thoại
1. Click nút "❌ Đóng hội thoại" trên Telegram
2. Kiểm tra website - chat box sẽ hiển thị trạng thái "Đã đóng"
3. User sẽ không thể gửi thêm tin nhắn

## Bước 7: Troubleshooting

### 7.1. Webhook không hoạt động
- Kiểm tra webhook URL có đúng không
- Đảm bảo server có thể truy cập từ internet
- Kiểm tra Render logs để xem lỗi

### 7.2. Không nhận được tin nhắn từ Telegram
- Kiểm tra `TELEGRAM_ADMIN_CHAT_ID` có đúng không
- Đảm bảo bot đã được start (gửi `/start` cho bot)
- Kiểm tra token có đúng không

### 7.3. Socket.IO không kết nối
- Kiểm tra `FRONTEND_URL` trong environment variables
- Đảm bảo CORS được cấu hình đúng
- Kiểm tra console browser để xem lỗi

### 7.4. Render deployment failed
- Kiểm tra `package.json` có đúng scripts không
- Đảm bảo `prisma generate` được chạy trong build
- Kiểm tra database connection string

## Bước 8: Bảo mật

### 8.1. Không expose token
- KHÔNG bao giờ commit `TELEGRAM_BOT_TOKEN` vào Git
- Sử dụng environment variables cho tất cả sensitive data
- Rotate token nếu bị lộ

### 8.2. Webhook Secret
- Sử dụng `TELEGRAM_WEBHOOK_SECRET` để verify webhook requests
- Thay đổi secret thường xuyên

### 8.3. Rate Limiting
- Hệ thống đã có rate limiting tích hợp
- Có thể điều chỉnh trong `app.module.ts`

## Flow hoạt động hoàn chỉnh

```
User gửi tin nhắn trên Website
    ↓
Lưu vào MongoDB (SupportMessage)
    ↓
Gửi thông báo qua Telegram Bot đến Admin
    ↓
Admin nhận thông báo trên Telegram
    ↓
Admin click "Trả lời" trên Telegram
    ↓
Admin gõ tin nhắn trả lời
    ↓
Telegram Webhook nhận tin nhắn
    ↓
Backend xử lý và lưu vào MongoDB
    ↓
Socket.IO gửi realtime về Website
    ↓
User nhận tin nhắn trả lời ngay lập tức
```

## Các endpoint API chính

### User Endpoints
- `POST /support/conversations` - Tạo cuộc hội thoại mới
- `GET /support/conversations/me` - Lấy danh sách hội thoại của user
- `GET /support/conversations/:id` - Lấy chi tiết hội thoại
- `POST /support/conversations/:id/messages` - Gửi tin nhắn

### Admin Endpoints
- `GET /admin/support/conversations` - Lấy danh sách tất cả hội thoại
- `GET /admin/support/conversations/:id` - Lấy chi tiết hội thoại
- `POST /admin/support/conversations/:id/messages` - Admin gửi tin nhắn
- `PATCH /admin/support/conversations/:id/status` - Cập nhật trạng thái

### Telegram Endpoints
- `POST /telegram/webhook` - Telegram webhook endpoint
- `POST /telegram/set-webhook` - Cấu hình webhook (tùy chọn)

## Socket.IO Events

### Client → Server
- `join-conversation` - Tham gia vào phòng chat
- `leave-conversation` - Rời phòng chat

### Server → Client
- `connected` - Xác nhận kết nối
- `new-message` - Tin nhắn mới
- `conversation-closed` - Hội thoại bị đóng
- `error` - Lỗi socket

## File quan trọng

### Backend
- `src/modules/telegram/telegram.service.ts` - Telegram service
- `src/modules/telegram/telegram.controller.ts` - Webhook handler
- `src/modules/support/support.service.ts` - Support chat logic
- `src/modules/chat/chat.gateway.ts` - Socket.IO gateway

### Frontend
- `src/components/common/SupportChat.tsx` - Chat component
- `src/services/repositories/SupportRepository.ts` - API client

## Liên hệ hỗ trợ

Nếu gặp vấn đề trong quá trình cài đặt:
1. Kiểm tra logs trên Render Dashboard
2. Kiểm tra console browser cho frontend errors
3. Review Telegram Bot API documentation: https://core.telegram.org/bots/api