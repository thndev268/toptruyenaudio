import { test, expect } from '@playwright/test';

test.describe('LocalStorage Persistence', () => {
  test('should persist favorites across sessions', async ({ page, context }) => {
    await page.goto('/');
    
    const favBtn = page.locator('button[aria-label="Thêm vào yêu thích"]').first();
    await favBtn.scrollIntoViewIfNeeded();
    await favBtn.click({ force: true });
    
    // Check if it's now "Xóa khỏi yêu thích"
    await expect(favBtn).toHaveAttribute('aria-label', 'Xóa khỏi yêu thích');

    // Reload page
    await page.reload();
    await expect(page.locator('button[aria-label="Xóa khỏi yêu thích"]').first()).toBeVisible();
    
    // Verify in new tab/context if storage is shared (it should be for same origin)
    const newPage = await context.newPage();
    await newPage.goto('/');
    await expect(newPage.locator('button[aria-label="Xóa khỏi yêu thích"]').first()).toBeVisible();
  });
});
