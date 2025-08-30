const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing Admin Create → Assign flow...');
    
    // Navigate to login
    await page.goto('http://localhost:5183/login');
    console.log('🔍 Current URL:', page.url());
    
    // Take screenshot to see what's actually there
    await page.screenshot({ path: 'login-page-debug.png' });
    console.log('📸 Login page screenshot saved');
    
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    
    // Login as Admin
    console.log('🔐 Logging in as Admin...');
    await page.fill('input[name="identifier"]', 'ADM-001');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    // Wait for admin hub to load
    await page.waitForURL(/.*\/hub\/admin.*/);
    await page.waitForSelector('div:has-text("Welcome")', { timeout: 5000 });
    console.log('✅ Admin hub loaded successfully');
    
    // Test Create Tab
    console.log('📝 Testing Create tab...');
    await page.click('div:has-text("Create")');
    await page.waitForSelector('div:has-text("Create New Data")');
    
    // Look for Crew creation
    await page.waitForSelector('select');
    await page.selectOption('select', 'crew');
    
    // Check if CrewCreateWizard is shown
    const hasWizard = await page.locator('text=CrewCreateWizard').count() > 0;
    console.log(`Crew Create Wizard present: ${hasWizard}`);
    
    // Take screenshot of Create tab
    await page.screenshot({ path: 'admin-create-tab.png' });
    console.log('📸 Screenshot saved: admin-create-tab.png');
    
    // Test Assign Tab
    console.log('🎯 Testing Assign tab...');
    await page.click('div:has-text("Assign")');
    await page.waitForSelector('div:has-text("Assign Roles & Permissions")');
    
    // Look for Center Assignment section
    const centerAssignmentExists = await page.locator('text=Center Assignment').count() > 0;
    console.log(`Center Assignment section present: ${centerAssignmentExists}`);
    
    // Take screenshot of Assign tab
    await page.screenshot({ path: 'admin-assign-tab.png' });
    console.log('📸 Screenshot saved: admin-assign-tab.png');
    
    // Test Directory tab to see unassigned crew
    console.log('📋 Testing Directory tab for unassigned crew...');
    await page.click('div:has-text("Directory")');
    await page.waitForSelector('div:has-text("Directory")');
    
    // Click on Crew tab
    await page.click('div:has-text("Crew")');
    await page.waitForTimeout(1000);
    
    // Take screenshot of Directory > Crew
    await page.screenshot({ path: 'admin-directory-crew.png' });
    console.log('📸 Screenshot saved: admin-directory-crew.png');
    
    console.log('✅ Admin Create → Assign flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-admin-flow.png' });
  }
  
  await browser.close();
})();