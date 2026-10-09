# Từ Điển Dữ Liệu (Data Dictionary)

Tài liệu này định nghĩa các cấu trúc dữ liệu (Types, Interfaces, Enums) đang thực sự được sử dụng trong mã nguồn frontend.

## 1. Domain Entities (Thực thể chính)

### `AudioStory`
Đại diện cho một bộ truyện audio.
*   `id`: `string` - ID duy nhất.
*   `title`: `string` - Tên bộ truyện.
*   `slug`: `string` - Slug cho URL.
*   `authorName`: `string` - Tên tác giả gốc.
*   `narratorName`: `string` - Tên MC / Giọng đọc.
*   `summary`: `string` - Tóm tắt nội dung.
*   `coverUrl`: `string` - Ảnh bìa.
*   `genres`: `string[]` - Danh sách thể loại.
*   `storyStatus`: `StoryStatus` (`ONGOING`, `COMPLETED`, `PAUSED`).
*   `publishStatus`: `PublishStatus` (`DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`).
*   `rating`: `number` - Điểm đánh giá trung bình.
*   `totalChapters`: `number` - Tổng số tập.
*   `chapters`: `AudioChapter[]` - Danh sách các tập.

### `AudioChapter`
Đại diện cho một tập audio trong bộ truyện.
*   `id`: `string` - ID tập.
*   `number`: `number` - Số thứ tự tập.
*   `title`: `string` - Tiêu đề tập.
*   `audioUrl`: `string` - Đường dẫn file audio (thường là link CDN hoặc mock link).
*   `durationSeconds`: `number` - Độ dài tập audio.
*   `accessLevel`: `ContentAccessLevel` (`FREE`, `PREMIUM`).

### `UserPlaylist`
Danh sách phát cá nhân của người dùng.
*   `id`: `string`
*   `ownerId`: `string`
*   `name`: `string`
*   `itemCount`: `number`
*   `createdAt`: `string` (ISO Date)

## 2. Authentication & Profile

### `UserRole` (Enum)
*   `USER`: Người nghe thông thường.
*   `CREATOR`: Tác giả / Giọng đọc.
*   `PARTNER`: Đối tác.
*   `ADMIN`: Quản trị viên.

### `MockAuthStorage`
Cấu trúc lưu trữ thông tin đăng nhập trong LocalStorage.
*   `role`: `UserRole`
*   `user`: `{ id: string, name: string, email: string, avatarUrl?: string } | null`

### `SubscriptionPlanId` (Enum)
Gói cước Premium.
*   `PREMIUM_MONTHLY`: Gói 1 tháng.
*   `PREMIUM_QUARTERLY`: Gói 3 tháng.
*   `PREMIUM_SEMIANNUAL`: Gói 6 tháng (Alias legacy `PREMIUM_SEMI_ANNUAL` tự động chuyển đổi).
*   `PREMIUM_ANNUAL`: Gói 12 tháng.

### `IdempotencyRecord` (Mongoose Schema)
Bản ghi phục vụ kiểm soát tính đẳng nguồn (Idempotency) cho các giao dịch nhạy cảm (Cấp/Hủy Premium).
*   `key`: `string` - Khóa Idempotency-Key.
*   `actorId`: `string` - ID của Admin/User thực hiện thao tác.
*   `operation`: `string` - Tên thao tác (VD: `PREMIUM_GRANT`, `PREMIUM_REVOKE`).
*   `resourceId`: `string` - ID tài nguyên bị tác động (User ID).
*   `requestHash`: `string` - Mã băm SHA-256 của request payload.
*   `responseStatus`: `number` - HTTP Status Code kết quả.
*   `responseBody`: `any` - Snapshot response JSON.
*   `expiresAt`: `Date` - Tự động xóa sau 7 ngày nhờ TTL Index (`expires: 604800`).
*   **Unique Index**: Compound unique index trên `{ actorId: 1, operation: 1, key: 1 }`.

## 3. Storage Structures (Cấu trúc lưu trữ)

### `UserPreferencesStorage`
Cài đặt cá nhân của người dùng.
*   `volume`: `number` (0 - 1)
*   `isMuted`: `boolean`
*   `playbackRate`: `number` (0.5 - 2.0)
*   `autoPlayNext`: `boolean`
*   `sleepTimer`: `number` (Phút)

### `ListeningProgress`
Tiến độ nghe của một bộ truyện.
*   `storyId`: `string`
*   `chapterId`: `string`
*   `positionSeconds`: `number` - Vị trí giây hiện tại.
*   `completed`: `boolean` - Đã nghe xong hay chưa.

## 4. Admin Domain Types

### `AdminUser`
*   `status`: `ACTIVE` | `SUSPENDED` | `BANNED`.
*   `membershipTier`: `FREE` | `PREMIUM`.
*   `totalListens`: `number`.

### `AdminAuditLogEntry`
*   `performedBy`: `string`.
*   `action`: `string`.
*   `impactScope`: `string`.
*   `timestamp`: `string`.
