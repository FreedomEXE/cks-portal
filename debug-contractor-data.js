const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Monitor network requests to see what API data is being returned
  page.on('response', async (response) => {
    if (response.url().includes('/api/contractor') || response.url().includes('contractor')) {
      console.log('API Response:', response.url());
      try {
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Could not parse JSON response');
      }
    }
  });

  // Go to contractor login
  await page.goto('http://localhost:5183/con-000/hub');
  
  // Wait for the page to load
  await page.waitForTimeout(3000);
  
  // Look for Business Performance metrics
  const businessMetrics = await page.$$eval('.ui-card', cards => {
    return cards.map(card => {
      const label = card.querySelector('div[style*="color: #6b7280"]')?.textContent;
      const value = card.querySelector('div[style*="font-weight: 700"]')?.textContent;
      return { label, value };
    }).filter(item => item.label && item.value);
  });
  
  console.log('Business Metrics found on page:');
  businessMetrics.forEach(metric => {
    console.log(`- ${metric.label}: ${metric.value}`);
  });
  
  // Check the state data in React DevTools or console
  await page.evaluate(() => {
    console.log('Window object keys:', Object.keys(window));
    // Look for React components or state
    if (window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('React found on page');
    }
  });
  
  await page.waitForTimeout(5000);
  await browser.close();
})();