const { test, expect } = require('@playwright/test');

test('Admin hub debug - check what actually loads', async ({ page }) => {
  // Navigate to the test page
  await page.goto('http://localhost:3012/test');
  
  // Wait a bit for the page to load
  await page.waitForTimeout(2000);
  
  // Take a screenshot to see what's actually there
  await page.screenshot({ path: 'admin-hub-debug.png', fullPage: true });
  
  // Try to find any admin-related content
  const pageContent = await page.content();
  console.log('Page title:', await page.title());
  
  // Look for any error messages
  const errors = await page.locator('text=/error/i').count();
  console.log('Found errors on page:', errors);
  
  // Check if admin button/link exists
  const adminButton = page.locator('text=/admin/i');
  const adminCount = await adminButton.count();
  console.log('Found admin elements:', adminCount);
  
  if (adminCount > 0) {
    console.log('Admin element text:', await adminButton.first().textContent());
    // Click on admin if it exists
    await adminButton.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'admin-hub-after-click.png', fullPage: true });
  }
  
  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Get any JavaScript errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
});