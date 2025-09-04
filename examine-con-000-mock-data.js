const { chromium } = require('playwright');

async function examineConHub() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    // Clear cache and disable cache
    ignoreHTTPSErrors: true,
    bypassCSP: true,
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Examining con-000 hub for mock data...');
    
    // Navigate to login page with cache-busting parameter
    await page.goto(`http://localhost:5183?t=${Date.now()}`);
    await page.waitForLoadState('networkidle');
    
    // Clear any existing cache
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('📝 Logging in as con-000...');
    
    // Login as con-000
    await page.fill('input[type="text"]', 'con-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('🏢 Navigating to contractor hub...');
    
    // Wait for contractor hub to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of main dashboard
    await page.screenshot({ path: 'con-000-dashboard.png', fullPage: true });
    console.log('📸 Screenshot saved: con-000-dashboard.png');
    
    // Look for any numbers/stats on the dashboard that might be mock data
    const dashboardText = await page.textContent('body');
    console.log('📊 Dashboard content analysis:');
    
    // Look for specific numbers that might be mock data
    const numberMatches = dashboardText.match(/\b\d+\b/g) || [];
    const significantNumbers = numberMatches.filter(num => parseInt(num) > 0 && parseInt(num) < 1000);
    
    console.log('📈 Numbers found on dashboard:', significantNumbers);
    
    // Check for specific mock data content
    const mockDataElements = [
      'active customers',
      'pending requests', 
      'completed jobs',
      'revenue',
      'total customers',
      'active projects',
      'pending approvals',
      'manager demo',
      'john contractor',
      'business ave',
      'contractor-demo.com',
      'cleaning, maintenance, security',
      'new customer opportunities',
      'performance bonus program',
      'from business development'
    ];
    
    console.log('🔍 Checking for potential mock data indicators...');
    for (const element of mockDataElements) {
      if (dashboardText.toLowerCase().includes(element)) {
        console.log(`  ❌ Found mock data: "${element}"`);
      }
    }
    
    // Also check for "not set" or "not assigned" to see our cleanup
    const cleanupElements = ['not set', 'not assigned', 'not available'];
    for (const element of cleanupElements) {
      if (dashboardText.toLowerCase().includes(element)) {
        console.log(`  ✅ Found clean state: "${element}"`);
      }
    }
    
    // Navigate through different sections if available
    const tabs = await page.locator('[role="tab"], .tab, .nav-item').all();
    console.log(`📋 Found ${tabs.length} navigation elements`);
    
    for (let i = 0; i < Math.min(tabs.length, 5); i++) {
      try {
        const tab = tabs[i];
        const tabText = await tab.textContent();
        console.log(`  🏷️ Tab ${i+1}: "${tabText}"`);
        
        await tab.click();
        await page.waitForTimeout(1000);
        
        // Take screenshot of this section
        await page.screenshot({ path: `con-000-section-${i+1}.png`, fullPage: true });
        
        // Check for numbers in this section
        const sectionText = await page.textContent('body');
        const sectionNumbers = sectionText.match(/\b\d+\b/g) || [];
        const sectionSignificantNumbers = sectionNumbers.filter(num => parseInt(num) > 0 && parseInt(num) < 1000);
        console.log(`    📊 Numbers in "${tabText}":`, sectionSignificantNumbers.slice(0, 10));
        
      } catch (error) {
        console.log(`    ❌ Could not access tab ${i+1}:`, error.message);
      }
    }
    
    console.log('✅ con-000 hub examination complete');
    
  } catch (error) {
    console.error('❌ Error examining con-000 hub:', error);
  } finally {
    await browser.close();
  }
}

examineConHub();