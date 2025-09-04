const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to localhost:5183...');
    await page.goto('http://localhost:5183');
    await page.waitForTimeout(2000);
    
    console.log('Logging in as CON-000 (template account)...');
    await page.locator('input[placeholder="Username"]').fill('CON-000');
    await page.locator('input[placeholder="Password"]').fill('CksDemo!2025');
    await page.locator('button:has-text("Login")').click();
    
    // Wait for dashboard to load
    await page.waitForTimeout(4000);
    
    console.log('Checking dashboard metrics...');
    
    // Get all metric card contents
    const cards = await page.locator('.ui-card').allTextContents();
    console.log('All dashboard cards:', cards);
    
    // Take screenshot
    await page.screenshot({ path: 'con-000-dashboard.png', fullPage: true });
    console.log('Screenshot saved as con-000-dashboard.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();