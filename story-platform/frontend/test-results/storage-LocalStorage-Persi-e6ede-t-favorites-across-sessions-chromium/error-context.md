# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: storage.spec.ts >> LocalStorage Persistence >> should persist favorites across sessions
- Location: story-platform/frontend/tests/storage.spec.ts:4:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('button[aria-label="Thêm vào yêu thích"]').first()
Expected: "Xóa khỏi yêu thích"
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" with timeout 10000ms
  - waiting for locator('button[aria-label="Thêm vào yêu thích"]').first()
    - locator resolved to <button aria-label="Thêm vào yêu thích" class="pointer-events-auto p-2 rounded-full backdrop-blur-md transition-all bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-900">…</button>
    - unexpected value "Thêm vào yêu thích"

```

```yaml
- paragraph:
  - strong: "Tiếp tục nghe:"
  - text: Phàm Nhân Tu Tiên Audio (Giọng Đọc Chuyện Đêm) - Tập 1
- button "Phát Tiếp"
- button "Đóng"
- banner:
  - text: "Mô Phỏng Auth & Role: [GUEST] Đổi vai trò thử nghiệm:"
  - button "GUEST"
  - button "USER"
  - button "CREATOR"
  - button "PARTNER"
  - button "ADMIN"
  - link "Về trang chủ TOP TRUYỆN AUDIO":
    - /url: /
    - img "TOP TRUYỆN AUDIO"
    - text: TOP TRUYỆN AUDIO
  - search:
    - textbox "Tìm kiếm truyện audio":
      - /placeholder: Tìm truyện audio, giọng đọc, tác giả...
  - navigation:
    - link "Trang Chủ":
      - /url: /
    - link "Khám Phá":
      - /url: /explore
    - button "Mở menu Thể Loại": Thể Loại
    - link "Xếp Hạng":
      - /url: /rankings
  - link "Nâng cấp":
    - /url: /premium
  - link "Đăng Nhập":
    - /url: /login
- navigation "Breadcrumb":
  - list:
    - listitem:
      - link "Trang chủ":
        - /url: /
    - listitem:
      - link "story":
        - /url: /story
    - listitem: Đắc Nhân Tâm & Nghệ Thuật Giao Tiếp Audio Book
- main:
  - img "Đắc Nhân Tâm & Nghệ Thuật Giao Tiếp Audio Book"
  - text: HD Audio 320kbps Sách Nói & Radio Kỹ Năng Trọn bộ audio
  - heading "Đắc Nhân Tâm & Nghệ Thuật Giao Tiếp Audio Book" [level=1]
  - text: "Tác giả:"
  - strong: Dale Carnegie
  - text: "• MC:"
  - strong: Diễn Viên Thanh Tú
  - text: • 5 (5120 đánh giá)
  - paragraph: Cuốn sách nghệ thuật ứng xử nổi tiếng nhất thế giới. Bản thu âm chuẩn HD với giọng đọc trầm ấm, diễn cảm giúp bạn thấu hiểu tâm lý con người và tạo dựng mối quan hệ bền vững.
  - button "Phát Tập 1 Miễn Phí"
  - button "Yêu Thích"
  - button "Danh Sách Tập Audio (3)"
  - button "Đánh Giá & Bình Luận (0)"
  - text: "1"
  - 'heading "Chương 1: Nghệ Thuật Ứng Xử Cơ Bản & Không Phê Bình" [level=4]'
  - paragraph: "Giọng đọc: Diễn Viên Thanh Tú"
  - text: 23:20
  - button "Phát Audio"
  - text: "2"
  - 'heading "Chương 2: 6 Cách Tạo Thân Thiện & Nụ Cười Chân Thành" [level=4]'
  - paragraph: "Giọng đọc: Diễn Viên Thanh Tú"
  - text: 23:00
  - button "Phát Audio"
  - text: "3"
  - 'heading "Chương 3: Hướng Người Khác Theo Suy Nghĩ Của Bạn" [level=4]'
  - paragraph: "Giọng đọc: Diễn Viên Thanh Tú"
  - text: 23:40
  - button "Nâng cấp Premium Premium"
- contentinfo:
  - link "Về trang chủ TOP TRUYỆN AUDIO":
    - /url: /
    - img "TOP TRUYỆN AUDIO"
    - text: TOP TRUYỆN AUDIO
  - paragraph: TOP TRUYỆN AUDIO là nền tảng nghe truyện audio trực tuyến, giúp người dùng khám phá và thưởng thức những câu chuyện hấp dẫn mọi lúc, mọi nơi.
  - button "KHÁM PHÁ AUDIO"
  - list:
    - listitem:
      - link "Truyện audio mới nhất":
        - /url: /explore
    - listitem:
      - link "Bảng xếp hạng lượt nghe":
        - /url: /rankings
    - listitem:
      - link "Danh mục thể loại phong phú":
        - /url: /genres
  - button "DÀNH CHO CREATOR"
  - list:
    - listitem:
      - link "Creator Studio Quản Lý":
        - /url: /creator
    - listitem:
      - link "Đối tác phát triển nội dung":
        - /url: /partner
    - listitem:
      - link "Chính sách tác quyền & phân phối":
        - /url: /withdrawal-policy
  - button "HỖ TRỢ & PHÁP LÝ"
  - list:
    - listitem:
      - link "Điều khoản & Bảo mật":
        - /url: /terms
    - listitem:
      - link "Chính sách bản quyền":
        - /url: /copyright
    - listitem:
      - link "Trung tâm trợ giúp 24/7":
        - /url: /help
  - paragraph: © 2026 TOP TRUYỆN AUDIO. All rights reserved.
  - paragraph: Tối ưu giao diện mượt mà trên Mobile, Tablet và Desktop.
- slider "Thanh thời gian nghe"
- button "Mở trình phát đầy đủ màn hình":
  - img "Phàm Nhân Tu Tiên Audio (Giọng Đọc Chuyện Đêm)"
  - 'heading "Tập 1: Sơn Thôn Thiếu Niên & Khảo Nghiệm Thất Huyền Môn" [level=4]'
  - paragraph: Phàm Nhân Tu Tiên Audio (Giọng Đọc Chuyện Đêm)
- button "Lùi 10 giây": "10"
- button "Phát audio"
- button "Tua 10 giây": "10"
- text: 00:00 / 25:40
- button "Tốc độ phát hiện tại 1x": 1x
- button "Hẹn giờ dừng audio": Hẹn giờ
- button "Bật/Tắt tiếng"
- slider "Âm lượng": "0.8"
- button "Mở giao diện đầy đủ"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('LocalStorage Persistence', () => {
  4  |   test('should persist favorites across sessions', async ({ page, context }) => {
  5  |     await page.goto('/');
  6  |     
  7  |     const favBtn = page.locator('button[aria-label="Thêm vào yêu thích"]').first();
  8  |     await favBtn.scrollIntoViewIfNeeded();
  9  |     await favBtn.click({ force: true });
  10 |     
  11 |     // Check if it's now "Xóa khỏi yêu thích"
> 12 |     await expect(favBtn).toHaveAttribute('aria-label', 'Xóa khỏi yêu thích');
     |                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  13 | 
  14 |     // Reload page
  15 |     await page.reload();
  16 |     await expect(page.locator('button[aria-label="Xóa khỏi yêu thích"]').first()).toBeVisible();
  17 |     
  18 |     // Verify in new tab/context if storage is shared (it should be for same origin)
  19 |     const newPage = await context.newPage();
  20 |     await newPage.goto('/');
  21 |     await expect(newPage.locator('button[aria-label="Xóa khỏi yêu thích"]').first()).toBeVisible();
  22 |   });
  23 | });
  24 | 
```