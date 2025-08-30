const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing Create Crew functionality...');
    
    // Navigate to login
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(2000);
    
    // Login as Admin
    console.log('🔐 Logging in as Admin...');
    await page.waitForSelector('input[name="identifier"]');
    await page.fill('input[name="identifier"]', 'ADM-001');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign in")');
    
    // Wait for admin hub to load
    await page.waitForURL(/.*\/hub\/admin.*/);
    await page.waitForSelector('text=Welcome', { timeout: 10000 });
    console.log('✅ Admin hub loaded');
    
    // Navigate to Create tab
    console.log('📝 Going to Create tab...');
    await page.click('text=Create');
    await page.waitForSelector('text=Users');
    
    // Take screenshot of create tab
    await page.screenshot({ path: 'create-tab-loaded.png' });
    console.log('📸 Create tab screenshot saved');
    
    // Ensure we're on Users tab
    console.log('👤 Clicking Users tab...');
    await page.click('text=Users');
    await page.waitForTimeout(1000);
    
    // Select Crew role
    console.log('🎭 Selecting Crew role...');
    await page.selectOption('select', 'crew');
    await page.waitForTimeout(1000);
    
    // Take screenshot after selecting crew
    await page.screenshot({ path: 'crew-selected.png' });
    console.log('📸 Crew selection screenshot saved');
    
    // Check if CrewCreateWizard is visible
    const wizardVisible = await page.isVisible('text=Identity');
    console.log(`CrewCreateWizard visible: ${wizardVisible}`);
    
    if (wizardVisible) {
      console.log('✅ CrewCreateWizard loaded correctly');
      
      // Try to fill in some crew details
      await page.fill('input[placeholder*="crew name"], input[placeholder*="name"]', 'Test Crew Member');
      await page.waitForTimeout(500);
      
      // Take screenshot of filled form
      await page.screenshot({ path: 'crew-form-filled.png' });
      console.log('📸 Filled crew form screenshot saved');
      
      // Try to proceed to next step
      const nextButton = await page.locator('button:has-text("Next")');
      if (await nextButton.isVisible()) {
        console.log('🔄 Clicking Next button...');
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'crew-step-2.png' });
        console.log('📸 Crew step 2 screenshot saved');
      }
    } else {
      console.log('❌ CrewCreateWizard not visible');
      
      // Check for any error messages
      const errorMessages = await page.locator('text=/invalid|error/i').all();
      for (const error of errorMessages) {
        const text = await error.textContent();
        console.log(`Error found: ${text}`);
      }
    }
    
    console.log('✅ Test completed - check screenshots for details');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error-create-crew.png' });
  }
  
  await browser.close();
})();