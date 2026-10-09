# Story Platform - Nền Tảng Đọc & Nghe Truyện Số (Phase 1 Monorepo)

Monorepo dự án **Nền tảng Đọc & Nghe Truyện Số** giai đoạn 1 (Website First), bao gồm Website Responsive người đọc, Creator Studio, Partner Portal, Admin Portal, thanh toán qua webhook và bộ phòng thủ bảo vệ hệ thống.

---

## 📐 Cấu Trúc Monorepo

```text
story-platform/
├── frontend/             # Application Web (Next.js 14/15, React 18/19, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── app/          # Next.js App Router Pages & Layouts
│   │   ├── components/   # UI components, layout, features
│   │   ├── lib/          # API client, utilities
│   │   └── types/        # Frontend Data Models & DTOs
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── backend/              # REST API Backend Service (NestJS, TypeScript, MongoDB Atlas, Mongoose)
│   ├── src/
│   │   ├── common/       # Guards, Filters, Interceptors, Enums, DTOs
│   │   ├── config/       # Environment & Database Configuration
│   │   ├── modules/      # Auth, Users, Stories, Creator, Partners, Payments, Wallets, Admin, Audit
│   │   ├── app.module.ts
│   │   └── main.ts       # Swagger OpenAPI Setup & App Entry Point
│   ├── test/             # Unit Tests & E2E Tests (Jest)
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── .env.example
├── docs/                 # Tài liệu kỹ thuật chi tiết
│   ├── architecture.md   # Kiến trúc hệ thống, Phân quyền RBAC & Phòng thủ
│   ├── database-schema.md# Chi tiết 17 Collections MongoDB, Indexes & Rules
│   └── api-spec.md       # Đặc tả REST API Endpoints (/api/v1)
├── docker-compose.yml    # Docker Compose môi trường phát triển (MongoDB, Backend, Frontend)
├── tsconfig.json         # Workspace TypeScript Root Config
├── .env.example          # Centralized Environment Variables Template
├── .gitignore            # Git Ignore rules
├── package.json          # Monorepo Workspaces & Root Scripts
└── README.md             # Hướng dẫn chi tiết cài đặt và khởi chạy
```

---

## ⚙️ Yêu Cầu Môi Trường (Prerequisites)

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **MongoDB**: MongoDB Atlas cluster hoặc Docker local MongoDB (v7.0+)
- **Docker & Docker Compose** (Tùy chọn nếu muốn chạy qua container)

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Môi Trường Phát Triển

### Cách 1: Khởi Chạy Trực Tiếp Qua Node.js (Khuyên dùng cho Dev)

#### Bước 1: Clone dự án và truy cập thư mục root monorepo
```bash
cd story-platform
```

#### Bước 2: Cài đặt dependencies cho toàn bộ workspace
```bash
npm run setup
```
*Lệnh này sẽ tự động chạy `npm install` bên trong cả hai thư mục `backend/` và `frontend/`.*

#### Bước 3: Thiết lập Biến môi trường (.env)
1. Sao chép file `.env.example` thành `.env` trong các thư mục tương ứng:
```bash
# Tạo .env ở root (hoặc dùng riêng cho từng service)
cp .env.example .env

# Tạo .env cho Backend
cp backend/.env.example backend/.env

# Tạo .env cho Frontend
cp frontend/.env.example frontend/.env
```
2. Cập nhật các giá trị cấu hình trong `backend/.env` (Đặc biệt là `MONGODB_URI` kết nối MongoDB Atlas hoặc local).

#### Bước 4: Khởi chạy đồng thời Backend và Frontend
```bash
npm run dev
```
- **Backend API Server**: Chạy tại `http://localhost:3001` (API prefix: `/api/v1`)
- **Swagger API Docs**: Truy cập tại `http://localhost:3001/docs`
- **Frontend Web App**: Chạy tại `http://localhost:3000`

---

### Cách 2: Khởi Chạy Bằng Docker Compose

Nếu bạn có Docker Desktop / Docker Compose, bạn có thể khởi chạy toàn bộ Stack (MongoDB + Backend + Frontend) chỉ với 1 lệnh:

```bash
docker-compose up -d --build
```

Kiểm tra trạng thái các container:
```bash
docker-compose ps
```

Dừng các services:
```bash
docker-compose down
```

---

## 🧪 Chạy Kiểm Thử (Testing)

### Chạy Unit Tests cho Backend (Jest)
```bash
npm run test
```

### Chạy E2E Tests
```bash
npm run test:e2e
```

### Kiểm tra Lint Code
```bash
npm run lint
```

---

## 🔐 Nguyên Tắc Nghiệp Vụ & Kỹ Thuật Quan Trọng

1. **Backend Server là nguồn quyết định duy nhất**: Client/Frontend tuyệt đối không được tự ý quyết định số tiền, quyền sở hữu hay kết quả giao dịch.
2. **Không kết nối MongoDB trực tiếp từ Frontend**: Mọi truy vấn dữ liệu phải thông qua REST API (`/api/v1`).
3. **Không lưu khóa thật trong Git**: Toàn bộ bí mật, JWT secret, DB credentials đều đọc từ file `.env` không commit lên repository.
4. **Bảo vệ Idempotency**: Mọi thao tác nạp tiền, ghi sổ kế toán (Ledger) đều yêu cầu `idempotencyKey` duy nhất để tránh cộng tiền trùng lặp.
