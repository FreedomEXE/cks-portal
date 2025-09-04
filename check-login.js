const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('Navigating to http://localhost:5183...');
    await page.goto('http://localhost:5183', { waitUntil: 'networkidle' });
    
    console.log('Page loaded. Taking screenshot...');
    await page.screenshot({ path: 'login-page-screenshot.png' });
    
    // Check for common error elements
    const errorElements = await page.$$('[class*="error"], [class*="Error"], .error-message');
    if (errorElements.length > 0) {
      console.log(`Found ${errorElements.length} error elements`);
      for (const element of errorElements) {
        const text = await element.textContent();
        console.log(`Error text: ${text}`);
      }
    }
    
    // Check page title and current URL
    console.log(`Page title: ${await page.title()}`);
    console.log(`Current URL: ${page.url()}`);
    
    await page.waitForTimeout(3000); // Wait a bit to see the page
    
  } catch (error) {
    console.error('Error loading page:', error.message);
  }
  
  await browser.close();
})();