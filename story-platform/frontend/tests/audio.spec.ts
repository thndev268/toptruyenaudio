import { test, expect } from '@playwright/test';

test.describe('Audio Player Controls', () => {
  test('should play audio and update controls', async ({ page }) => {
    await page.goto('/');
    
    // Click play on a story card
    const playBtn = page.locator('button[aria-label="Nghe ngay tập đầu"]').first();
    await playBtn.click();

    // Verify mini player appears
    const miniPlayer = page.locator('div.fixed.bottom-0');
    await expect(miniPlayer).toBeVisible();

    // Check play/pause button
    const playPauseBtn = miniPlayer.locator('button[aria-label^="Tạm dừng"], button[aria-label^="Phát"]');
    await expect(playPauseBtn).toBeVisible();

    // Toggle play/pause
    await playPauseBtn.click();
    // Use expect().toHaveAttribute to allow for retry if state update is slightly delayed
    await expect(playPauseBtn).toHaveAttribute('aria-label', 'Tạm dừng audio');
    
    await playPauseBtn.click();
    await expect(playPauseBtn).toHaveAttribute('aria-label', 'Phát audio');

    // Open full player
    await miniPlayer.locator('button[aria-label="Mở giao diện đầy đủ"]').click();
    await expect(page.locator('[role="dialog"][aria-label="Trình phát audio đầy đủ màn hình"]')).toBeVisible();
  });

  test('should skip 10 seconds forward and back', async ({ page }) => {
    await page.goto('/');
    await page.locator('button[aria-label="Nghe ngay tập đầu"]').first().click();

    const forwardBtn = page.locator('button[aria-label="Tua 10 giây"]');
    await forwardBtn.click();
    
    const backBtn = page.locator('button[aria-label="Lùi 10 giây"]');
    await backBtn.click();
  });
});
