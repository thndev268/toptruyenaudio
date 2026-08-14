# BÁO CÁO TỔNG QUAN TÌNH TRẠNG HỆ THỐNG STORY PLATFORM
*Thời gian đánh giá: Tháng 08/2026*

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
Story Platform là một nền tảng Web quản lý, phát và chia sẻ truyện Audio/Video. Hiện tại hệ thống đang chạy song song một lớp Frontend và một lớp Backend tạm thời đóng vai trò làm Server tĩnh (Vite Server) kiêm Mock API.

Dù giao diện (UI/UX) đã được thiết kế khá đồ sộ và hoàn thiện, nhưng hệ thống lõi **gần như đang chạy hoàn toàn trên dữ liệu giả lập (Mock Data)** và chưa kết nối với Cơ sở dữ liệu (Database) thực tế.

---

## 2. CÔNG NGHỆ SỬ DỤNG (TECH STACK)
Hệ thống sử dụng các công nghệ hiện đại, cụ thể như sau:

*   **Frontend (Phía Client):**
    *   **Core:** React 19, TypeScript, Vite.
    *   **UI & Styling:** Tailwind CSS v4, Framer Motion (cho animation), Lucide React (icon).
    *   **Routing:** React Router DOM (phiên bản 7).
    *   **Quản lý State:** Sử dụng React Context API kết hợp LocalStorage.
*   **Backend (Phía Server):**
    *   **Entry Server (Đang chạy - `server.ts`):** Sử dụng Express.js và `http-proxy-middleware`. Đóng vai trò serve file tĩnh, xử lý middleware Vite và **làm Backend giả lập (Mock)** cho một số API.
    *   **AI Integration:** Tích hợp SDK `@google/genai` (Gemini API) dùng để phân tích kịch bản video và tạo tiêu đề/nội dung tự động qua iframe.
    *   **Backend Thực Tế (Bị bỏ quên/Chưa chạy):** Codebase có chứa một Backend hoàn chỉnh viết bằng **NestJS** kết nối **MongoDB Atlas** (Mongoose), JWT, Swagger (nằm trong thư mục `story-platform/backend`). Tuy nhiên, service này **hiện không được khởi chạy** trên môi trường dev hiện tại.

---

## 3. PHÂN TÍCH TÌNH TRẠNG DỮ LIỆU ("DÙNG ẢO" HAY THẬT?)
Kết luận: **95% dữ liệu của hệ thống hiện tại là DÙNG ẢO (Mock Data).**

### 3.1. Dữ liệu "ảo" được lưu trên RAM (Ephemeral Memory)
Tệp `server.ts` đóng vai trò API Backend nhưng thực chất đang khai báo các mảng dữ liệu ngay trên RAM:
*   `let customStoriesStore: any[] = [];`
*   `let customGenresStore: any[] = [];`
Khi thêm một Thể loại (Genre) hoặc Story mới từ giao diện Admin, nó gọi API `POST /api/genres`, lưu vào biến `customGenresStore`. Do đó, **nếu Server khởi động lại (restart) thì TOÀN BỘ dữ liệu mới thêm sẽ biến mất**.

### 3.2. Dữ liệu "ảo" hardcode và LocalStorage
Trong thư mục `frontend/src/services/repositories/`, hầu hết các logic gọi API đều được viết theo cơ chế "Fallback về Mock":
*   **Ranking, Comment, Review, Playlist, Support:** Tất cả đều đang import mảng tĩnh (`MOCK_STORIES`, `MOCK_GENRES`, `MOCK_USER_ACTIVITY_RANKINGS`...) từ thư mục `data/mockAudioData.ts`. Sau đó tự động lưu vào `localStorage` của trình duyệt. 
*   **Bảo mật & Auth (Đăng nhập):** Hệ thống được code theo logic: Nếu không gọi được API thật, nó sẽ **tự động tạo một tài khoản ảo (Mock User)** lưu vào local (Ví dụ ID tạo ngẫu nhiên `usr-xxxxx`). 

---

## 4. CÁC VẤN ĐỀ TỒN ĐỌNG (OUTSTANDING ISSUES)
1.  **Lỗi Proxy 504 Gateway Timeout:**
    Express server đang được cấu hình để forward các endpoint (ví dụ: `/api/auth/login`) tới cổng `3001` (NestJS). Nhưng do NestJS không được start nên các API này lỗi 504. UI không bị sập vì đã có cơ chế "bọc lót" bằng dữ liệu Mock, che giấu lỗi thật bên dưới.
2.  **Thiếu tính bền vững của Dữ liệu (No Data Persistence):**
    Bất kỳ dữ liệu nào người dùng thao tác (Bình luận, Xếp hạng, Đăng ký Creator, Xóa Thể Loại, Thêm Truyện...) đều chỉ tồn tại tạm thời. Hệ thống thiếu một CSDL thực (MongoDB hoặc PostgreSQL).
3.  **Rác Công Nghệ (Technical Debt/Spaghetti files):**
    Thư mục gốc (Root Workspace) đang chứa hàng loạt các file script tạm thời không còn sử dụng:
    *   Hàng tá file dạng `patch_*.ts` (VD: `patch_audioplayer.ts`, `patch_history.ts`).
    *   Các file script cjs (`fix_audio_context.cjs`, `updateMockData.cjs`).
    Đây là rác được sinh ra từ các lần fix bug tự động trước đó, làm cấu trúc thư mục lộn xộn.

---

## 5. KHUYẾN NGHỊ & HƯỚNG GIẢI QUYẾT
Để hệ thống sẵn sàng đem vào sử dụng thực tế (Production), cần thực hiện các công đoạn sau:

*   **BƯỚC 1: Dọn dẹp Codebase (Clean up)**
    *   Xóa bỏ toàn bộ các file `.cjs`, `.patch`, `patch_*.ts`, `fix_*.ts` nằm rải rác ở thư mục gốc để làm sạch môi trường.
*   **BƯỚC 2: Khởi chạy Database & NestJS Backend**
    *   Chuyển trọng tâm sang thư mục `story-platform/backend`. Cài đặt `npm install`, thiết lập `.env` kết nối tới **MongoDB Atlas**.
    *   Start NestJS server trên port 3001.
*   **BƯỚC 3: Xóa bỏ dữ liệu Mock ở Frontend**
    *   Trong `frontend/src/services/apiClient.ts`, loại bỏ chế độ `VITE_DATA_SOURCE_MODE = 'MOCK'`.
    *   Xóa thư mục `data/mockAudioData.ts`. Đổi các Repositories sang gọi Axios/Fetch trực tiếp tới REST API thay vì đọc từ `localStorage`.
*   **BƯỚC 4: Chuyển logic từ Express sang NestJS**
    *   Cắt các logic phân tích Gemini AI và mảng `customStoriesStore` đang tạm bợ ở `server.ts` sang thành Controller/Service thực thụ trong NestJS. Express lúc này chỉ nên đóng vai trò render Vite (Static file server).
