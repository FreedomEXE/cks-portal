const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to localhost:5183...');
    await page.goto('http://localhost:5183');
    await page.waitForTimeout(2000);
    
    console.log('Logging in as CON-001...');
    await page.locator('input[placeholder="Username"]').fill('CON-001');
    await page.locator('input[placeholder="Password"]').fill('CksDemo!2025');
    await page.locator('button:has-text("Login")').click();
    
    // Wait for dashboard to load
    await page.waitForTimeout(4000);
    
    console.log('Checking dashboard metrics...');
    
    // Look for specific metric values
    const activeCustomers = await page.locator('text=Active Customers').locator('..').locator('..').textContent();
    const activeCenters = await page.locator('text=Active Centers').locator('..').locator('..').textContent();
    const activeCrew = await page.locator('text=Active Crew').locator('..').locator('..').textContent();
    
    console.log('Active Customers card:', activeCustomers);
    console.log('Active Centers card:', activeCenters);
    console.log('Active Crew card:', activeCrew);
    
    // Take screenshot
    await page.screenshot({ path: 'contractor-dashboard-check.png', fullPage: true });
    console.log('Screenshot saved as contractor-dashboard-check.png');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();