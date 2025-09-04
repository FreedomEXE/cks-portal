const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('Opening Clerk dashboard...');
  await page.goto('https://dashboard.clerk.com');
  
  console.log('Please sign in to Clerk manually...');
  console.log('Once signed in, I can help check the settings.');
  console.log('Press Ctrl+C to close when done.');
  
  // Keep the browser open
  await page.waitForTimeout(300000); // Wait 5 minutes
  
  await browser.close();
})();