const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Contractor Hub empty template state...');
  
  // Go to contractor hub
  await page.goto('http://localhost:5183/con-000/hub');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  // Check for Business Performance metrics
  const businessMetrics = await page.$$eval('.ui-card', cards => {
    return cards.map(card => {
      const label = card.querySelector('div[style*="color: #6b7280"]')?.textContent;
      const value = card.querySelector('div[style*="font-weight: 700"]')?.textContent;
      return { label, value };
    }).filter(item => item.label && item.value);
  });
  
  console.log('\n=== Business Performance Metrics ===');
  businessMetrics.forEach(metric => {
    const expectedZero = ['Active Customers', 'Active Centers', 'Services Used', 'Active Crew', 'Pending Orders'];
    const shouldBeZero = expectedZero.some(expected => metric.label?.includes(expected));
    const isZero = metric.value === '0' || metric.value?.startsWith('0');
    const status = shouldBeZero ? (isZero ? '✅' : '❌') : 'ℹ️';
    console.log(`${status} ${metric.label}: ${metric.value}`);
  });
  
  // Check customer table for empty state
  const customerTable = await page.$('.ui-card table');
  const customerRows = await customerTable?.$$('tbody tr') || [];
  
  console.log('\n=== Customer Activity Table ===');
  if (customerRows.length === 1) {
    const emptyMessage = await customerRows[0].$eval('td', td => td.textContent);
    if (emptyMessage?.includes('No customer activity')) {
      console.log('✅ Customer table shows proper empty state');
    } else {
      console.log('❌ Customer table has unexpected content:', emptyMessage);
    }
  } else {
    console.log(`❌ Customer table has ${customerRows.length} rows, expected 1 empty state row`);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
  
  console.log('\n=== Test Complete ===');
})();