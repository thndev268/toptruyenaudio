# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: premium.spec.ts >> Premium Workflow >> should show premium plans and activate a plan
- Location: story-platform/frontend/tests/premium.spec.ts:4:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('div.rounded-3xl.border')
Expected: 4
Received: 1
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" with timeout 10000ms
  - waiting for locator('div.rounded-3xl.border')
    2 × locator resolved to 0 elements
      - unexpected value "0"
    21 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - paragraph [ref=e7]:
      - strong [ref=e8]: "Tiếp tục nghe:"
      - text: Phàm Nhân Tu Tiên Audio (Giọng Đọc Chuyện Đêm) - Tập 1
    - generic [ref=e9]:
      - button "Phát Tiếp" [ref=e10]
      - button "Đóng" [ref=e14]
  - banner [ref=e18]:
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e22]: "Mô Phỏng Auth & Role:"
        - generic [ref=e23]: "[GUEST]"
      - generic [ref=e24]:
        - generic [ref=e25]: "Đổi vai trò thử nghiệm:"
        - button "GUEST" [ref=e26]
        - button "USER" [ref=e27]
        - button "CREATOR" [ref=e28]
        - button "PARTNER" [ref=e29]
        - button "ADMIN" [ref=e30]
    - generic [ref=e31]:
      - link "Về trang chủ TOP TRUYỆN AUDIO" [ref=e33] [cursor=pointer]:
        - /url: /
        - img "TOP TRUYỆN AUDIO" [ref=e34]
        - generic [ref=e35]:
          - generic [ref=e36]: TOP TRUYỆN
          - generic [ref=e37]: AUDIO
      - textbox "Tìm truyện audio, giọng đọc, tác giả..." [ref=e43]
      - navigation [ref=e44]:
        - link "Trang Chủ" [ref=e45] [cursor=pointer]:
          - /url: /
        - link "Khám Phá" [ref=e49] [cursor=pointer]:
          - /url: /explore
        - button "Thể Loại" [ref=e55]
        - link "Xếp Hạng" [ref=e61] [cursor=pointer]:
          - /url: /rankings
      - generic [ref=e69]:
        - link "Nâng cấp" [ref=e70] [cursor=pointer]:
          - /url: /premium
        - link "Đăng Nhập" [ref=e74] [cursor=pointer]:
          - /url: /login
  - navigation "Breadcrumb" [ref=e78]:
    - list [ref=e79]:
      - listitem [ref=e80]:
        - link "Trang chủ" [ref=e81] [cursor=pointer]:
          - /url: /
      - listitem [ref=e86]:
        - generic [ref=e89]: login
  - main [ref=e90]:
    - generic [ref=e92]:
      - generic [ref=e96]:
        - strong [ref=e97]: "Chế độ mô phỏng:"
        - text: Hệ thống Auth thử nghiệm, không sử dụng mật khẩu thực.
      - generic [ref=e98]:
        - heading "Đăng Nhập TOP TRUYỆN AUDIO" [level=1] [ref=e103]
        - paragraph [ref=e104]: Thưởng thức kho audiobook HD & podcast mỗi đêm
      - generic [ref=e105]:
        - generic [ref=e106]:
          - text: Email tài khoản
          - textbox "nhap.email@example.com" [ref=e107]
        - generic [ref=e108]:
          - text: Vai trò đăng nhập thử nghiệm
          - combobox [ref=e109]:
            - option "Khán Giả / Độc Giả (USER)" [selected]
            - option "Tác Giả / MC Giọng Đọc (CREATOR)"
            - option "Đối Tác Tiếp Thị (PARTNER)"
            - option "Quản Tri Viên (ADMIN)"
        - button "Đăng Nhập Thử Nghiệm" [ref=e110]
      - generic [ref=e116]:
        - link "Quên mật khẩu?" [ref=e117] [cursor=pointer]:
          - /url: /forgot-password
        - link "Đăng ký tài khoản" [ref=e118] [cursor=pointer]:
          - /url: /register
  - contentinfo [ref=e119]:
    - generic [ref=e120]:
      - generic [ref=e121]:
        - generic [ref=e122]:
          - link "Về trang chủ TOP TRUYỆN AUDIO" [ref=e123] [cursor=pointer]:
            - /url: /
            - img "TOP TRUYỆN AUDIO" [ref=e124]
            - generic [ref=e125]:
              - generic [ref=e126]: TOP TRUYỆN
              - generic [ref=e127]: AUDIO
          - paragraph [ref=e132]: TOP TRUYỆN AUDIO là nền tảng nghe truyện audio trực tuyến, giúp người dùng khám phá và thưởng thức những câu chuyện hấp dẫn mọi lúc, mọi nơi.
        - generic [ref=e133]:
          - button "KHÁM PHÁ AUDIO" [ref=e134]
          - list [ref=e136]:
            - listitem [ref=e137]:
              - link "Truyện audio mới nhất" [ref=e138] [cursor=pointer]:
                - /url: /explore
            - listitem [ref=e139]:
              - link "Bảng xếp hạng lượt nghe" [ref=e140] [cursor=pointer]:
                - /url: /rankings
            - listitem [ref=e141]:
              - link "Danh mục thể loại phong phú" [ref=e142] [cursor=pointer]:
                - /url: /genres
        - generic [ref=e143]:
          - button "DÀNH CHO CREATOR" [ref=e144]
          - list [ref=e146]:
            - listitem [ref=e147]:
              - link "Creator Studio Quản Lý" [ref=e148] [cursor=pointer]:
                - /url: /creator
            - listitem [ref=e149]:
              - link "Đối tác phát triển nội dung" [ref=e150] [cursor=pointer]:
                - /url: /partner
            - listitem [ref=e151]:
              - link "Chính sách tác quyền & phân phối" [ref=e152] [cursor=pointer]:
                - /url: /withdrawal-policy
        - generic [ref=e153]:
          - button "HỖ TRỢ & PHÁP LÝ" [ref=e154]
          - list [ref=e156]:
            - listitem [ref=e157]:
              - link "Điều khoản & Bảo mật" [ref=e158] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e159]:
              - link "Chính sách bản quyền" [ref=e160] [cursor=pointer]:
                - /url: /copyright
            - listitem [ref=e161]:
              - link "Trung tâm trợ giúp 24/7" [ref=e162] [cursor=pointer]:
                - /url: /help
      - generic [ref=e163]:
        - paragraph [ref=e164]: © 2026 TOP TRUYỆN AUDIO. All rights reserved.
        - paragraph [ref=e165]: Tối ưu giao diện mượt mà trên Mobile, Tablet và Desktop.
  - generic [ref=e166]:
    - slider "Thanh thời gian nghe" [ref=e167] [cursor=pointer]
    - generic [ref=e169]:
      - button "Mở trình phát đầy đủ màn hình" [ref=e170] [cursor=pointer]:
        - img "Phàm Nhân Tu Tiên Audio (Giọng Đọc Chuyện Đêm)" [ref=e172]
        - generic [ref=e177]:
          - 'heading "Tập 1: Sơn Thôn Thiếu Niên & Khảo Nghiệm Thất Huyền Môn" [level=4] [ref=e178]'
          - paragraph [ref=e179]: Phàm Nhân Tu Tiên Audio (Giọng Đọc Chuyện Đêm)
      - generic [ref=e180]:
        - button "Lùi 10 giây" [ref=e181]:
          - generic [ref=e185]: "10"
        - button "Phát audio" [ref=e186]
        - button "Tua 10 giây" [ref=e189]:
          - generic [ref=e193]: "10"
        - generic [ref=e194]:
          - generic [ref=e195]: 00:00
          - generic [ref=e196]: /
          - generic [ref=e197]: 25:40
      - generic [ref=e198]:
        - button "1x" [ref=e200]
        - button "Hẹn giờ" [ref=e206]
        - generic [ref=e211]:
          - button "Bật/Tắt tiếng" [ref=e212]
          - slider "Âm lượng" [ref=e217] [cursor=pointer]: "0.8"
        - button "Mở giao diện đầy đủ" [ref=e218]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Premium Workflow', () => {
  4  |   test('should show premium plans and activate a plan', async ({ page }) => {
  5  |     await page.goto('/premium');
  6  |     
  7  |     // Verify 4 plans are shown
  8  |     const plans = page.locator('div.rounded-3xl.border');
> 9  |     await expect(plans).toHaveCount(4);
     |                         ^ Error: expect(locator).toHaveCount(expected) failed
  10 | 
  11 |     // Verify benefits list
  12 |     await expect(page.locator('text=Không quảng cáo thương mại.')).toBeVisible();
  13 | 
  14 |     // Click on a plan (Quarterly)
  15 |     await page.click('text=Đăng ký ngay - 150.000');
  16 |     
  17 |     // Check for confirmation modal (if implemented) or check storage
  18 |     // Since it's a mock, we expect it to trigger activation
  19 |     // Let's verify the localStorage via browser context if possible, or check UI changes
  20 |     
  21 |     // Wait for the mock activation (it might redirect or show a success toast)
  22 |     // For now, let's check if the navbar changes to "Premium" state
  23 |     const premiumChip = page.locator('a[href="/premium"]:has-text("Premium")');
  24 |     await expect(premiumChip).toBeVisible();
  25 |   });
  26 | 
  27 |   test('should verify interest is logged separately from activation', async ({ page }) => {
  28 |     await page.goto('/premium');
  29 |     
  30 |     // Click but don't confirm? (Depends on modal implementation)
  31 |     // Let's check localStorage for interest
  32 |     await page.click('text=Đăng ký ngay - 59.000');
  33 |     
  34 |     const interestLog = await page.evaluate(() => localStorage.getItem('toptruyenaudio:premium-interest:v1'));
  35 |     expect(interestLog).not.toBeNull();
  36 |   });
  37 | });
  38 | 
```