# Sơ Đồ Route & Navigation

Tài liệu này liệt kê toàn bộ các đường dẫn (URLs) hiện có trong ứng dụng và các view tương ứng.

## 1. Public Routes (Dành cho mọi người)

| Path | View Component | Mô tả |
| :--- | :--- | :--- |
| `/` | `HomeView` | Trang chủ: Hero truyện mới, Top bảng xếp hạng, Truyện đề cử. |
| `/explore` | `ExploreView` | Trang khám phá: Lọc truyện theo thể loại, trạng thái, gói cước. |
| `/genres` | `GenresView` | Danh sách tất cả thể loại truyện hiện có. |
| `/genres/:slug` | `ExploreView` | Lọc truyện theo một thể loại cụ thể. |
| `/leaderboard` | `LeaderboardView` | Bảng xếp hạng: Truyện thịnh hành, Top Creator, Top Thành viên. |
| `/search` | `SearchView` | Tìm kiếm truyện theo từ khóa. |
| `/story/:slug` | `StoryDetailView` | Chi tiết truyện: Thông tin, tập audio, đánh giá, đề xuất liên quan. |
| `/player/:slug` | `FullPlayerView` | Trình phát audio toàn màn hình (chuyên dụng cho mobile). |
| `/premium` | `PremiumView` | Trang giới thiệu và chọn gói cước Premium. |

## 2. Member Routes (Yêu cầu Đăng nhập)

| Path | View Component | Mô tả |
| :--- | :--- | :--- |
| `/account/profile` | `ProfileView` | Trang thông tin cá nhân: Chỉnh sửa tên, email, bio. |
| `/library` | `LibraryView` | Thư viện cá nhân: Playlist, Truyện đang nghe, Lịch sử. |
| `/library/favorites` | `LibraryView` (Tab) | Danh sách các bộ truyện đã lưu vào yêu thích. |
| `/library/history` | `LibraryView` (Tab) | Lịch sử nghe audio theo trình tự thời gian. |
| `/library/playlists` | `LibraryView` (Tab) | Quản lý các danh sách phát cá nhân. |
| `/library/playlist/:id` | `PlaylistDetailView` | Chi tiết một playlist cá nhân. |

## 3. Owner Admin Routes (Role: ADMIN)

| Path | View Component | Mô tả |
| :--- | :--- | :--- |
| `/admin` | `AdminLayout` (Redirect) | Chuyển hướng đến `/admin/dashboard`. |
| `/admin/dashboard` | `AdminDashboardPage` | Tổng quan hệ thống, chỉ số nhanh, log hoạt động. |
| `/admin/users` | `AdminUsersPage` | Danh sách người dùng, khóa tài khoản, cấp Premium. |
| `/admin/creators` | `AdminCreatorsPage` | Phê duyệt đơn đăng ký giọng đọc (Creator Applications). |
| `/admin/stories` | `AdminStoriesPage` | Quản lý bộ truyện, chương, trạng thái phát hành. |
| `/admin/genres` | `AdminGenresPage` | Quản lý danh mục thể loại (Thêm/Sửa/Xóa). |
| `/admin/subscriptions` | `AdminSubscriptionsPage` | Lịch sử thanh toán và quản lý gói cước người dùng. |
| `/admin/comments` | `AdminCommentsPage` | Kiểm duyệt bình luận, ẩn nội dung vi phạm. |
| `/admin/reports` | `AdminReportsPage` | Xử lý báo cáo vi phạm từ người dùng. |
| `/admin/copyright` | `AdminCopyrightPage` | Quản lý khiếu nại bản quyền audio. |
| `/admin/support` | `AdminSupportPage` | Hỗ trợ khách hàng qua hệ thống Ticket. |
| `/admin/notifications` | `AdminNotificationsPage` | Gửi thông báo Broadcast toàn hệ thống. |
| `/admin/maintenance` | `AdminMaintenancePage` | Cấu hình chế độ bảo trì hệ thống. |
| `/admin/incidents` | `AdminIncidentsPage` | Theo dõi và xử lý các sự cố kỹ thuật. |
| `/admin/system` | `AdminSystemPage` | Kiểm tra sức khỏe các dịch vụ (Service Health). |
| `/admin/security` | `AdminSecurityPage` | Cảnh báo an ninh, quản lý IP bị chặn (WAF). |
| `/admin/audit-logs` | `AdminAuditLogsPage` | Nhật ký hành động quản trị viên (không thể xóa). |
| `/admin/settings` | `AdminSettingsPage` | Quản lý cờ tính năng (Feature Flags). |
| `/admin/profile` | `AdminProfilePage` | Thông tin cá nhân của Owner Admin. |

## 4. Other Routes (Draft/Pending)

| Path | Mô tả |
| :--- | :--- |
| `/creator-studio` | Dashboard dành cho tác giả/giọng đọc (Đang phát triển). |
| `/partner` | Cổng thông tin dành cho đối tác nhúng YouTube (Chưa triển khai). |
| `/contact` | Trang liên hệ hỗ trợ. |
| `/help` | Trang hướng dẫn sử dụng. |
| `*` | Trang 404 (Not Found). |
