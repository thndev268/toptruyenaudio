# Bộ Tài Liệu Kỹ Thuật TOP TRUYỆN AUDIO - Frontend (Phase 1)

Bộ tài liệu này cung cấp cái nhìn chi tiết và chính xác về tình trạng triển khai thực tế của ứng dụng TOP TRUYỆN AUDIO dựa trên mã nguồn hiện tại. Đây là nguồn tham chiếu duy nhất cho việc phát triển backend và đồng bộ hóa các tính năng trong tương lai.

## 1. Cấu Trúc Tài Liệu

| Tài liệu | Nội dung chính |
| :--- | :--- |
| [Trạng Thái Triển Khai](./frontend-implementation-status.md) | Ma trận theo dõi tính năng, phân loại trạng thái (Implemented, Mock, UI-Only...). |
| [Sơ Đồ Route & Navigation](./frontend-route-map.md) | Danh sách route Public, Member và Owner Admin kèm theo view tương ứng. |
| [Từ Điển Dữ Liệu](./data-dictionary.md) | Định nghĩa các Type, Interface và Enum đang sử dụng trong mã nguồn. |
| [Lưu Trữ & Migration](./storage-and-migration.md) | Cấu trúc LocalStorage, các key phiên bản và logic di chuyển dữ liệu (v1 -> v2). |
| [Bản Đồ Mock Repository](./mock-repository-map.md) | Cách thức các Repository giả lập dữ liệu và trạng thái hiện tại của chúng. |
| [Hợp Đồng API Người Dùng](./api-data-contract.md) | Đặc tả các Endpoint và Schema dữ liệu cần thiết cho API người dùng/creator. |
| [Hợp Đồng API Admin](./admin-api-contract.md) | Đặc tả các Endpoint và Schema dữ liệu cho các tác vụ quản trị hệ thống. |
| [Báo Cáo Kiểm Thử](./testing-report.md) | Kết quả kiểm tra thực tế các luồng nghiệp vụ chính trên giao diện. |
| [Lỗ Hổng & Bước Tiếp Theo](./known-gaps-and-next-steps.md) | Các điểm chưa thống nhất, tính năng còn thiếu và ưu tiên phát triển kế tiếp. |
| [Nhật Ký Thay Đổi](./change-log.md) | Lịch sử cập nhật mã nguồn và tài liệu. |

## 2. Quy Ước Trạng Thái (DocumentationFeatureStatus)

Mọi tính năng trong tài liệu được đánh giá dựa trên các trạng thái sau:

*   **IMPLEMENTED**: Đã hoàn thiện code, logic và hiển thị (có thể vẫn dùng mock data nhưng luồng nghiệp vụ đã xong).
*   **MOCK_WORKING**: Hoạt động dựa trên dữ liệu mẫu hoặc LocalStorage (thay thế cho API thực).
*   **UI_ONLY**: Mới chỉ có giao diện tĩnh, chưa có logic xử lý hoặc kết nối dữ liệu.
*   **PARTIAL**: Đã triển khai một phần, còn thiếu các nhánh logic hoặc giao diện phụ.
*   **NOT_CONNECTED**: Giao diện đã có nhưng chưa được kết nối với Repository/Storage.
*   **NOT_IMPLEMENTED**: Chưa có code cho tính năng này.
*   **REMOVED**: Đã từng tồn tại nhưng đã bị gỡ bỏ.
*   **BROKEN**: Có code nhưng đang gặp lỗi không hoạt động được.
*   **NEEDS_VERIFICATION**: Cần kiểm tra lại thực tế code để xác định trạng thái.

## 3. Lưu Ý Quan Trọng

*   **Dữ liệu**: Hiện tại ứng dụng hoạt động 100% Client-side. Mọi thay đổi sẽ mất nếu người dùng xóa cache trình duyệt (trừ khi đã được lưu vào LocalStorage).
*   **Xác thực**: Sử dụng `AuthContext` với logic giả lập (Mock Auth). Không có kết nối server thực tế.
*   **Thanh toán**: Mới chỉ dừng lại ở giao diện nạp tiền và gói cước. Chưa có tích hợp cổng thanh toán thực tế.
*   **Tài liệu cũ**: Các tài liệu dự thảo về kiến trúc backend cũ đã được chuyển vào thư mục `/archive` để tránh nhầm lẫn với hiện trạng thực tế.
