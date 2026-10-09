# Lưu Trữ & Migration (Storage & Migration)

Tài liệu này đặc tả cách thức ứng dụng lưu trữ dữ liệu tại Client và quy trình di chuyển dữ liệu giữa các phiên bản.

## 1. Cơ Chế Lưu Trữ

Toàn bộ dữ liệu người dùng và cài đặt được lưu trữ trong **LocalStorage** của trình duyệt. Không có cơ chế lưu trữ phía Server trong Phase 1.

### Quy ước đặt tên Key (Prefix)
Mọi key lưu trữ bắt buộc sử dụng tiền tố: `toptruyenaudio:`

## 2. Danh Sách Storage Keys (v1)

| Key | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `toptruyenaudio:preferences:v1` | `Object` | Cài đặt âm lượng, tốc độ, tự động phát... |
| `toptruyenaudio:listening-progress:v1` | `Map<StoryId, Progress>` | Vị trí giây cuối cùng đang nghe của từng truyện. |
| `toptruyenaudio:listening-history:v1` | `Array<Entry>` | Danh sách truyện đã nghe gần đây. |
| `toptruyenaudio:favorites:v1` | `Array<StoryId>` | Danh sách ID các truyện đã yêu thích. |
| `toptruyenaudio:mock-auth:v1` | `Object` | Thông tin phiên đăng nhập giả lập. |
| `toptruyenaudio:playlists:v1` | `Array<Playlist>` | Danh sách các playlist đã tạo. |
| `toptruyenaudio:playlist-items:v1` | `Array<Item>` | Chi tiết các truyện nằm trong từng playlist. |
| `toptruyenaudio:subscription:v1` | `Object` | Thông tin gói cước Premium của người dùng. |

## 3. Logic Migration (Di chuyển dữ liệu)

Ứng dụng hỗ trợ di chuyển dữ liệu từ phiên bản cũ (với tiền tố `storyflow:`) sang phiên bản mới (`toptruyenaudio:`).

### Quy trình Migration
1. Khi khởi chạy, `StorageAdapter` kiểm tra key `toptruyenaudio:migrated:v2`.
2. Nếu chưa tồn tại, hệ thống quét toàn bộ các key có tiền tố `storyflow:`.
3. Sao chép giá trị từ key cũ sang key mới tương ứng (Ví dụ: `storyflow:favorites:v1` -> `toptruyenaudio:favorites:v1`).
4. Xóa các key cũ sau khi sao chép thành công.
5. Ghi nhận trạng thái `migrated:v2 = true` để không chạy lại lần sau.

### Các Key được hỗ trợ Migration
* `PREFERENCES`
* `LISTENING_PROGRESS`
* `LISTENING_HISTORY`
* `FAVORITES`
* `MOCK_AUTH`
* `PLAYLISTS`
* `REVIEWS` (nếu có)
* `USER_ACTIVITY` (nếu có)

## 4. Hạn Chế & Rủi Ro

* **Mất dữ liệu**: Dữ liệu sẽ bị xóa hoàn toàn nếu người dùng thực hiện "Clear Browser Data" hoặc "Clear Local Storage".
* **Dung lượng**: LocalStorage giới hạn khoảng 5MB - 10MB tùy trình duyệt. Cần tránh lưu trữ các file audio hoặc hình ảnh dưới dạng Base64 vào đây.
* **Đồng bộ**: Không có sự đồng bộ giữa các thiết bị khác nhau (ví dụ: nghe trên điện thoại sẽ không thấy lịch sử trên máy tính).
