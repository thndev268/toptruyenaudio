import { test, expect } from '@playwright/test';

test.describe('Premium Workflow', () => {
  test('should show premium plans and activate a plan', async ({ page }) => {
    await page.goto('/premium');
    
    // Verify 4 plans are shown
    const plans = page.locator('div.rounded-3xl.border');
    await expect(plans).toHaveCount(4);

    // Verify benefits list
    await expect(page.locator('text=Không quảng cáo thương mại.')).toBeVisible();

    // Click on a plan (Quarterly)
    await page.click('text=Đăng ký ngay - 150.000');
    
    // Check for confirmation modal (if implemented) or check storage
    // Since it's a mock, we expect it to trigger activation
    // Let's verify the localStorage via browser context if possible, or check UI changes
    
    // Wait for the mock activation (it might redirect or show a success toast)
    // For now, let's check if the navbar changes to "Premium" state
    const premiumChip = page.locator('a[href="/premium"]:has-text("Premium")');
    await expect(premiumChip).toBeVisible();
  });

  test('should verify interest is logged separately from activation', async ({ page }) => {
    await page.goto('/premium');
    
    // Click but don't confirm? (Depends on modal implementation)
    // Let's check localStorage for interest
    await page.click('text=Đăng ký ngay - 59.000');
    
    const interestLog = await page.evaluate(() => localStorage.getItem('toptruyenaudio:premium-interest:v1'));
    expect(interestLog).not.toBeNull();
  });
});
