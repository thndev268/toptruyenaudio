import { test, expect } from '@playwright/test';

test.describe('Navigation & Routing', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TOP TRUYỆN AUDIO/);

    // Navigate to Explore
    await page.click('text=Khám Phá');
    await expect(page).toHaveURL(/\/explore/);

    // Navigate to Rankings
    await page.click('text=Xếp Hạng');
    await expect(page).toHaveURL(/\/rankings/);

    // Navigate to Premium
    await page.click('text=Nâng cấp');
    await expect(page).toHaveURL(/\/premium/);
  });

  test('should open story detail page from home', async ({ page }) => {
    await page.goto('/');
    // Click the first story card
    const firstStory = page.locator('[role="button"][aria-label^="Chi tiết truyện"]').first();
    await firstStory.click();
    await expect(page).toHaveURL(/\/story\//);
  });
});
