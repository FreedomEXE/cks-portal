import { test, expect } from '@playwright/test';

test('Admin hub loads after cache clear', async ({ page }) => {
  await page.goto('http://localhost:3005');
  
  // Wait for page to load
  await page.waitForSelector('button:has-text("Admin Hub Test")', { timeout: 10000 });
  
  // Take screenshot before clicking admin hub
  await page.screenshot({ path: 'admin-hub-before-click-after-cache.png', fullPage: true });
  
  // Click admin hub button
  await page.click('button:has-text("Admin Hub Test")');
  
  // Wait a moment for the hub to load
  await page.waitForTimeout(2000);
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'admin-hub-after-click-cache-clear.png', fullPage: true });
  
  // Check if admin hub content loads (should show tabs like Dashboard, Directory, etc.)
  const dashboardTab = await page.locator('text=Dashboard').count();
  console.log('Dashboard tab found:', dashboardTab > 0);
  
  // Check for main content area
  const mainContent = await page.locator('.admin-content, [data-testid="admin-content"], .ui-card').count();
  console.log('Admin content areas found:', mainContent);
  
  // Log any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
});