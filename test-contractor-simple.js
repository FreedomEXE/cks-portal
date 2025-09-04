const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Contractor Hub...');
  
  // Go to contractor hub
  await page.goto('http://localhost:5183/con-000/hub');
  
  // Wait for page to load
  await page.waitForTimeout(4000);
  
  // Take screenshot to see what's happening
  await page.screenshot({ path: 'contractor-hub-test.png' });
  
  // Check page title
  const title = await page.$('h1');
  const titleText = await title?.textContent();
  console.log('Page title:', titleText);
  
  // Look for any text containing numbers
  const pageText = await page.textContent('body');
  const numberMatches = pageText.match(/\d+/g) || [];
  console.log('Numbers found on page:', numberMatches);
  
  // Look for "Active Customers", "Active Centers", etc.
  const metricsText = ['Active Customers', 'Active Centers', 'Active Crew', 'Pending Orders'];
  for (const metric of metricsText) {
    if (pageText.includes(metric)) {
      console.log(`Found metric: ${metric}`);
      // Try to find the number after it
      const pattern = new RegExp(`${metric}.*?(\\d+)`, 's');
      const match = pageText.match(pattern);
      if (match) {
        console.log(`  Value: ${match[1]}`);
      }
    }
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
})();