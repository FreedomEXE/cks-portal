const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login
    await page.goto('http://localhost:5183');
    
    // Login as contractor
    await page.fill('input[placeholder="Username"]', 'CON-001');
    await page.fill('input[placeholder="Password"]', 'CksDemo!2025');
    await page.click('button:has-text("Login")');
    
    // Wait for hub to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'contractor-dashboard.png', fullPage: true });
    
    // Get dashboard metrics text
    const metrics = await page.locator('.ui-card').allTextContents();
    console.log('Dashboard metrics:', metrics);
    
    // Keep browser open for manual inspection
    console.log('Browser kept open for inspection. Close manually when done.');
    await page.waitForTimeout(60000); // Wait 1 minute
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Don't close automatically - let user inspect
    // await browser.close();
  }
})();