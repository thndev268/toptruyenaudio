# Hợp Đồng API Người Dùng (Dự kiến)

Dựa trên cấu trúc dữ liệu và nhu cầu của Frontend hiện tại, đây là các Endpoint cần thiết mà Backend cần cung cấp.

## 1. Authentication (`/api/v1/auth`)

### `POST /login`
* **Request**: `{ email, password }`
* **Response**: `{ user: { id, name, email, role, avatarUrl }, token, refreshToken }`

### `POST /register`
* **Request**: `{ email, password, name }`
* **Response**: `{ status: "success", message: "..." }`

## 2. Stories & Content (`/api/v1/stories`)

### `GET /` (Danh sách truyện)
* **Query Params**: `page`, `limit`, `genre`, `status`, `accessLevel`, `q` (search).
* **Response**: `{ items: AudioStory[], total: number, pages: number }`

### `GET /:slug` (Chi tiết truyện)
* **Response**: `AudioStory` (bao gồm đầy đủ danh sách `chapters`).

### `GET /genres` (Danh sách thể loại)
* **Response**: `Genre[]`

## 3. User Library & Activity (`/api/v1/me`)

### `GET /favorites`
* **Response**: `AudioStory[]`

### `POST /favorites`
* **Request**: `{ storyId }`

### `GET /progress`
* **Response**: `Record<StoryId, ListeningProgress>`

### `POST /progress`
* **Request**: `ListeningProgress`

## 4. Playlists (`/api/v1/playlists`)

### `GET /`
* **Response**: `UserPlaylist[]`

### `POST /`
* **Request**: `{ name, description }`

### `POST /:id/items`
* **Request**: `{ storyId }`

## 5. Ranking (`/api/v1/ranking`)

### `GET /trends`
* **Response**: `AudioStory[]` (Dựa trên lượt nghe 24h/7d).

### `GET /creators`
* **Response**: `CreatorRanking[]`

## 6. Premium & Payments (`/api/v1/premium`)

### `GET /plans`
* **Response**: `PremiumPlan[]`

### `POST /subscribe`
* **Request**: `{ planCode, paymentMethod }`
* **Response**: `{ checkoutUrl, orderId }`

## Schema Dữ Liệu Yêu Cầu (JSON)

Mọi Response API nên tuân thủ định dạng:
```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "meta": { "total": 100, "page": 1 }
}
```
