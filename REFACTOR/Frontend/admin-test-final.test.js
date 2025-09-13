import { test, expect } from '@playwright/test';

test('Admin hub final test - should work now', async ({ page }) => {
  await page.goto('http://localhost:3005');
  
  // Wait for page to load
  await page.waitForSelector('button:has-text("Admin Hub Test")', { timeout: 10000 });
  
  // Take screenshot before clicking admin hub
  await page.screenshot({ path: 'admin-hub-before-final-test.png', fullPage: true });
  
  // Click admin hub button
  await page.click('button:has-text("Admin Hub Test")');
  
  // Wait longer for the hub to load completely
  await page.waitForTimeout(3000);
  
  // Take screenshot after clicking
  await page.screenshot({ path: 'admin-hub-after-final-test.png', fullPage: true });
  
  // Check if admin hub content loads (should show tabs like Dashboard, Directory, etc.)
  const dashboardTab = await page.locator('text=Dashboard').count();
  console.log('Dashboard tab found:', dashboardTab > 0);
  
  const directoryTab = await page.locator('text=Directory').count();
  console.log('Directory tab found:', directoryTab > 0);
  
  const createTab = await page.locator('text=Create').count();
  console.log('Create tab found:', createTab > 0);
  
  // Check for main content area
  const mainContent = await page.locator('.admin-content, [data-testid="admin-content"], .ui-card').count();
  console.log('Admin content areas found:', mainContent);
  
  // Look for the admin welcome message
  const welcomeText = await page.locator('text=Welcome, Freedom').count();
  console.log('Welcome message found:', welcomeText > 0);
  
  // Log any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
});