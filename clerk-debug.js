const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('Opening Clerk dashboard...');
    await page.goto('https://dashboard.clerk.com');
    
    // Wait for dashboard to load
    console.log('Waiting for dashboard to load...');
    await page.waitForTimeout(3000);
    
    // Check if we're logged in by looking for dashboard elements
    const isDashboard = await page.locator('[data-testid="sidebar"]').isVisible().catch(() => false) ||
                       await page.locator('.sidebar').isVisible().catch(() => false) ||
                       await page.locator('nav').isVisible().catch(() => false);
    
    if (isDashboard) {
      console.log('✅ Dashboard loaded successfully!');
      
      // Try to navigate to API Keys
      console.log('Looking for API Keys section...');
      try {
        await page.click('text="API Keys"').catch(() => {});
        await page.waitForTimeout(2000);
        console.log('Navigated to API Keys');
      } catch (e) {
        console.log('Could not find API Keys link');
      }
      
      // Try to navigate to Email settings
      console.log('Looking for Email & SMS settings...');
      try {
        await page.click('text="Email & SMS"').catch(() => {});
        await page.waitForTimeout(2000);
        console.log('Navigated to Email & SMS');
      } catch (e) {
        console.log('Could not find Email & SMS link');
      }
      
    } else {
      console.log('❌ Not logged in or dashboard not loaded');
      console.log('Please sign in manually and run the script again');
    }
    
    console.log('Browser will stay open for manual inspection...');
    await page.waitForTimeout(180000); // Wait 3 minutes
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();