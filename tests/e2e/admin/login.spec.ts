import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/users';

test.describe('Admin Login', () => {
  test('should successfully login with freedom_exe', async ({ page }) => {
    await loginAs(page, 'admin');

    // Verify we're on the hub
    await expect(page).toHaveURL(/\/hub/);

    // Wait for the page to load OR detect if stuck on loading screen
    const maxWaitSeconds = 30;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      // Check if real content loaded
      const hasContent = await page.locator('main, [role="main"], .admin-content, h1, h2').count() > 0;
      if (hasContent) {
        console.log('✓ Page loaded successfully');
        break;
      }

      // Check if stuck on loading screen (CKS logo icon is visible)
      const loadingVisible = await page.locator('svg').first().isVisible().catch(() => false);
      if (loadingVisible && Date.now() - startTime > 5000) {
        console.log('⟳ Stuck on loading screen, refreshing page...');
        await page.reload({ waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
      } else {
        await page.waitForTimeout(500);
      }
    }

    // Final verification
    await page.waitForSelector('main, [role="main"], .admin-content, h1, h2', { timeout: 5000 });
    console.log('✓ Login successful, page loaded');

    // Take a screenshot of successful login
    await page.screenshot({ path: 'test-results/admin-login-success.png', fullPage: true });
  });
});
