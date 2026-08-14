# Hợp Đồng API Admin (Dự kiến)

Dành cho các tác vụ quản trị từ Owner Admin Platform.

## 1. User Management (`/api/v1/admin/users`)

### `GET /`
* **Query**: `role`, `status`, `q`.
* **Response**: `AdminUser[]`

### `PATCH /:id/status`
* **Request**: `{ status: "SUSPENDED" | "ACTIVE", reason: string }`

### `POST /:id/grant-premium`
* **Request**: `{ days: number, reason: string }`

## 2. Content Moderation (`/api/v1/admin/content`)

### `GET /creator-applications`
* **Response**: `AdminCreatorApplication[]`

### `PATCH /creator-applications/:id/decision`
* **Request**: `{ action: "APPROVE" | "REJECT", notes: string }`

### `PATCH /stories/:id/publish-status`
* **Request**: `{ status: "PUBLISHED" | "REJECTED", reason: string }`

### `DELETE /stories/:id/chapters/:chapterId`
* **Request**: `{ reason: string }`

## 3. System & Security (`/api/v1/admin/system` & `/api/v1/admin/security-events`)

### `GET /maintenance`
* **Response**: `AdminMaintenanceConfig`

### `PATCH /maintenance`
* **Request**: `Partial<AdminMaintenanceConfig>`

### `GET /audit-logs`
* **Query**: `actorId`, `action`, `startDate`, `endDate`.
* **Response**: `AdminAuditLogEntry[]`

### `PATCH /feature-flags/:key`
* **Request**: `{ isEnabled: boolean, reason: string }`

### Security Events State Machine (`/api/v1/admin/security-events`)
* **Ma trận chuyển trạng thái hợp lệ (State Machine Transitions)**:
  * `NEW` -> `INVESTIGATING`
  * `INVESTIGATING` -> `ACTION_REQUIRED` | `WAITING_FOR_USER` | `RESOLVED` | `FALSE_POSITIVE`
  * `ACTION_REQUIRED` -> `INVESTIGATING` | `WAITING_FOR_USER` | `RESOLVED`
  * `WAITING_FOR_USER` -> `INVESTIGATING` | `RESOLVED` | `FALSE_POSITIVE`
  * `RESOLVED` -> `REOPENED`
  * `FALSE_POSITIVE` -> `REOPENED`
  * `REOPENED` -> `INVESTIGATING`
* **Error Response (Nếu chuyển sai trạng thái)**: `409 Conflict` - `{ code: "INVALID_STATE_TRANSITION", message: string }`
* **Yêu cầu khi đóng cảnh báo (`RESOLVED` / `FALSE_POSITIVE`)**:
  * **Body mandatory fields**: `resolutionNote` (Kết luận), `actionTaken` (Biện pháp xử lý), `reason` (Lý do đóng).
  * **Error Response (Nếu thiếu trường)**: `400 Bad Request` - `{ code: "VALIDATION_ERROR", message: string }`

## 4. Subscriptions & Idempotency (`/api/v1/subscriptions`)
* **Headers**: `Idempotency-Key: <UUID>` (Bắt buộc với các thao tác `grant-premium` / `revoke-premium`)
* **Plan Identifiers**: `PREMIUM_MONTHLY`, `PREMIUM_QUARTERLY`, `PREMIUM_SEMIANNUAL`, `PREMIUM_ANNUAL` (Alias legacy `PREMIUM_SEMI_ANNUAL` tự động mapping sang `PREMIUM_SEMIANNUAL`).

## 4. Reports & Copyright (`/api/v1/admin/legal`)

### `GET /reports`
* **Response**: `AdminViolationReport[]`

### `PATCH /reports/:id/resolve`
* **Request**: `{ resolutionNote: string }`

### `GET /copyright-claims`
* **Response**: `AdminCopyrightClaim[]`

### `PATCH /copyright-claims/:id/resolve`
* **Request**: `{ actionTaken: string }`
