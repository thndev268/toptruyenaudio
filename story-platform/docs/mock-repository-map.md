# Bản Đồ Mock Repository

Ứng dụng sử dụng mô hình Repository để trừu tượng hóa việc truy cập dữ liệu. Hiện tại, tất cả các Repository đều hoạt động ở chế độ Mock (giả lập).

## 1. Danh Sách Repository

| Repository | Tệp tin | Trách nhiệm | Nguồn dữ liệu |
| :--- | :--- | :--- | :--- |
| `AdminRepository` | `AdminRepository.ts` | Toàn bộ logic quản trị hệ thống. | Hardcoded Static Data |
| `PlaylistRepository` | `PlaylistRepository.ts` | Quản lý danh sách phát cá nhân. | LocalStorage |
| `RankingRepository` | `RankingRepository.ts` | Bảng xếp hạng truyện và người dùng. | `mockRankingData.ts` |
| `ReviewRepository` | `ReviewRepository.ts` | Quản lý đánh giá và nhận xét. | LocalStorage |
| `CommentRepository` | `CommentRepository.ts` | Quản lý bình luận trong truyện. | LocalStorage |
| `SubscriptionRepository` | `SubscriptionRepository.ts` | Gói cước và trạng thái Premium. | LocalStorage |

## 2. Cách Thức Hoạt Động Của Mock

### Dữ liệu Tĩnh (Static Data)
Sử dụng các tệp tin trong `src/data/`:
* `mockAudioData.ts`: Chứa danh sách bộ truyện (`MOCK_STORIES`) và thể loại (`MOCK_GENRES`).
* `mockRankingData.ts`: Chứa dữ liệu bảng xếp hạng giả lập.

### Dữ liệu Động (Dynamic State)
Sử dụng bộ nhớ RAM (In-memory) kết hợp với LocalStorage:
1. Khi khởi tạo, Repository đọc dữ liệu từ LocalStorage.
2. Các thao tác Thêm/Sửa/Xóa sẽ cập nhật vào biến `private` trong class và đồng thời gọi `storage.setItem()` để ghi xuống LocalStorage.
3. Khi Reload trang, dữ liệu sẽ được khôi phục từ LocalStorage.

## 3. Trình Trạng Cụ Thể

### `AdminRepository`
* Đây là repository phức tạp nhất, chứa hàng ngàn dòng code mock.
* Giả lập một hệ thống Admin hoàn chỉnh với: Duyệt Creator, Xử lý vi phạm, Quản lý Incident, Feature Flags.
* **Lưu ý**: Các thay đổi trong Admin (như xóa một bộ truyện) chỉ có tác dụng trong phiên làm việc hiện tại và một số phần được lưu vào LocalStorage, một số phần khác sẽ reset về mặc định khi reload (nếu không có logic persistence cho key đó).

### `PlaylistRepository`
* Được kết nối chặt chẽ với `storage.ts`.
* Hỗ trợ tạo playlist "Mặc định" nếu người dùng chưa có playlist nào.

## 4. Hướng Dẫn Chuyển Sang API Thật
Để chuyển sang API thật, cần thực hiện:
1. Tạo các Service gọi API (sử dụng `fetch` hoặc `axios`).
2. Thay thế logic trong các phương thức Repository từ việc thao tác mảng cục bộ sang gọi API Service.
3. Cập nhật `AuthContext` để sử dụng JWT Token từ Server thay vì Mock Auth.
