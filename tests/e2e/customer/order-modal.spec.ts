import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/users';

test.describe('Customer Hub - Order Modal', () => {
  test('should open order modal from activity feed', async ({ page }) => {
    // Login as customer
    await loginAs(page, 'customer');
    await expect(page).toHaveURL(/\/hub/);

    // Wait for activity feed to load
    await page.waitForSelector('[data-testid="activity-feed"], .activity-feed, main', { timeout: 30000 });

    // Find first clickable order in activity feed
    const orderLink = page.locator('a[href*="ORD-"], button:has-text("ORD-"), [data-order-id]').first();
    const orderExists = await orderLink.count() > 0;

    if (!orderExists) {
      console.log('⚠️  No orders found in activity feed - skipping modal test');
      test.skip();
      return;
    }

    console.log('📦 Found order, clicking to open modal...');

    // Measure modal open time
    const startTime = Date.now();
    await orderLink.click();

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"], .modal, [data-testid="order-modal"]', { timeout: 10000 });
    const openTime = Date.now() - startTime;

    console.log(`⏱️  Modal opened in ${openTime}ms`);

    // Take screenshot
    await page.screenshot({
      path: 'test-results/customer-order-modal.png',
      fullPage: true
    });

    // Verify modal has content
    const modalContent = await page.locator('[role="dialog"], .modal').textContent();
    expect(modalContent).toBeTruthy();

    console.log(`✅ Customer order modal test complete (${openTime}ms)`);
  });
});
