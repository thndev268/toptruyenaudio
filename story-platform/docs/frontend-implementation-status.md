# Trạng Thái Triển Khai Frontend (Traceability Matrix)

Tài liệu này liệt kê chi tiết tình trạng của từng tính năng dựa trên việc đối soát mã nguồn thực tế.

## 1. Hệ Thống Cốt Lõi (Core System)

| Tính năng | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| Routing (Client-side) | **IMPLEMENTED** | Sử dụng `react-router-dom` v6. Quản lý route tập trung tại `App.tsx`. |
| State Management (Global) | **IMPLEMENTED** | Sử dụng React Context: `AuthContext`, `AudioPlayerContext`, `ToastContext`. |
| Mock Storage Adapter | **IMPLEMENTED** | `storage.ts` quản lý toàn bộ việc đọc/ghi LocalStorage với tiền tố `toptruyenaudio:`. |
| Migration Logic (v1 -> v2) | **IMPLEMENTED** | Tự động chuyển đổi dữ liệu từ prefix `storyflow:` sang `toptruyenaudio:` khi khởi chạy. |
| Theme & Styling | **IMPLEMENTED** | Tailwind CSS v4, hỗ trợ Responsive (Mobile/Desktop). |

## 2. Luồng Người Dùng (User Flow)

| Tính năng | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| Đăng nhập / Đăng xuất | **MOCK_WORKING** | Giả lập qua `AuthContext`. Lưu trạng thái vào `toptruyenaudio:mock-auth:v1`. |
| Chỉnh sửa hồ sơ | **IMPLEMENTED** | `ProfileView.tsx` cho phép đổi tên, email, bio (lưu LocalStorage). |
| Xem danh sách truyện | **IMPLEMENTED** | `HomeView`, `ExploreView` sử dụng dữ liệu từ `mockAudioData.ts`. |
| Bộ lọc & Tìm kiếm | **IMPLEMENTED** | Tìm kiếm theo text, lọc theo Thể loại, Trạng thái, Phân loại (Premium/Free). |
| Chi tiết bộ truyện | **IMPLEMENTED** | Hiển thị thông tin, danh sách chương, đánh giá (Reviews). |
| Trình phát Audio (Player) | **IMPLEMENTED** | Hỗ trợ Play/Pause, Next/Prev, Speed, Volume, Seek, Sleep Timer. |
| Tiến độ nghe (Progress) | **MOCK_WORKING** | Tự động lưu vị trí giây cuối cùng của từng chương vào LocalStorage. |
| Lịch sử nghe | **MOCK_WORKING** | Lưu danh sách các tập đã nghe gần nhất vào LocalStorage. |
| Danh sách yêu thích | **MOCK_WORKING** | Thêm/Xóa truyện yêu thích, lưu vào `toptruyenaudio:favorites:v1`. |
| Playlist cá nhân | **IMPLEMENTED** | Tạo mới, thêm truyện vào playlist, quản lý playlist trong `LibraryView`. |
| Đánh giá & Bình luận | **UI_ONLY** | Giao diện hiển thị đánh giá và bình luận, chưa kết nối logic gửi mới (ngoại trừ Admin). |

## 3. Hệ Thống Admin (Owner Admin)

| Tính năng | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| Bảng điều khiển (Dashboard) | **MOCK_WORKING** | Thống kê số liệu giả lập, hiển thị log hệ thống. |
| Quản lý người dùng | **MOCK_WORKING** | Khóa/Mở khóa, Cấp Premium, Xóa người dùng (giả lập trên state/localStorage). |
| Duyệt đơn Creator | **MOCK_WORKING** | Phê duyệt hoặc từ chối đơn đăng ký giọng đọc. |
| Quản lý nội dung (Stories) | **MOCK_WORKING** | Thay đổi trạng thái Publish, Access Level, Xóa tập audio. |
| Quản lý thể loại | **MOCK_WORKING** | Thêm/Xóa thể loại trực tiếp trên giao diện Admin. |
| Quản lý bình luận & Báo cáo | **MOCK_WORKING** | Ẩn/Hiện bình luận, xử lý báo cáo vi phạm. |
| Khiếu nại bản quyền | **UI_ONLY** | Giao diện quản lý khiếu nại, xử lý giả lập (không ảnh hưởng file thực tế). |
| Cấu hình bảo trì | **MOCK_WORKING** | Bật/tắt chế độ bảo trì toàn hệ thống (hiển thị banner thông báo). |
| Hệ thống Incident & Health | **MOCK_WORKING** | Theo dõi sức khỏe dịch vụ và ghi nhận sự cố giả lập. |
| Feature Flags | **MOCK_WORKING** | Bật/tắt các tính năng hệ thống qua giao diện Admin. |

## 4. Tính năng Premium & Partner

| Tính năng | Trạng thái | Ghi chú kỹ thuật |
| :--- | :--- | :--- |
| Trang giới thiệu Premium | **UI_ONLY** | Hiển thị các gói cước và lợi ích. |
| Luồng thanh toán | **NOT_IMPLEMENTED** | Chưa có logic xử lý thanh toán thực tế hoặc mock payment flow. |
| Partner Portal | **NOT_CONNECTED** | Route đã có (`/partner/*`) nhưng chưa có nội dung/view triển khai. |
| Creator Studio | **UI_ONLY** | Route `/creator-studio` dẫn đến trang Dashboard Creator sơ khai. |

## 5. Traceability Matrix (Mã nguồn vs Tính năng)

| Mã nguồn | Tính năng chính | Trạng thái |
| :--- | :--- | :--- |
| `src/App.tsx` | Main Routing & Layout | **IMPLEMENTED** |
| `src/context/AuthContext.tsx` | Authentication State | **MOCK_WORKING** |
| `src/context/AudioPlayerContext.tsx` | Audio Engine State | **IMPLEMENTED** |
| `src/services/storage.ts` | Local Persistence Logic | **IMPLEMENTED** |
| `src/services/repositories/*` | Data Access Abstraction | **MOCK_WORKING** |
| `src/components/admin/*` | Owner Admin Platform | **MOCK_WORKING** |
| `src/components/views/ProfileView.tsx` | User Account Management | **IMPLEMENTED** |
| `src/components/common/AddToPlaylistMenu.tsx` | Playlist Integration | **IMPLEMENTED** |
| `src/components/common/filter/*` | Advanced Filtering | **IMPLEMENTED** |
