const { chromium } = require('playwright');

async function testCustomerHubFixed() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Customer Hub after JSON parsing fix...\n');
    
    // Enable console logging to see if errors are gone
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔥 Browser Error:', msg.text());
      }
    });
    
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'cus-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(4000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'customer-hub-after-fix.png',
      fullPage: true 
    });
    
    console.log('📸 Customer Hub after fix screenshot saved');
    
    // Check current state
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`🔗 Current URL: ${currentUrl}`);
    console.log(`📄 Page title: ${pageTitle}`);
    
    // Check for Customer Hub content
    const bodyText = await page.textContent('body');
    
    if (bodyText.includes('Customer Hub')) {
      console.log('✅ CUSTOMER HUB: Successfully loaded');
      
      // Check for specific dashboard elements
      const hubTitle = page.locator('h1:has-text("Customer Hub")');
      const dashboardElements = page.locator('text=Dashboard');
      
      console.log(`📋 Hub title visible: ${await hubTitle.isVisible() ? '✅' : '❌'}`);
      console.log(`📊 Dashboard elements: ${await dashboardElements.isVisible() ? '✅' : '❌'}`);
      
    } else if (bodyText.includes('Error') || bodyText.includes('error')) {
      console.log('❌ CUSTOMER HUB: Still has errors');
      console.log('Error preview:', bodyText.substring(0, 300) + '...');
    } else {
      console.log('🤔 CUSTOMER HUB: Unexpected state');
      console.log('Content preview:', bodyText.substring(0, 300) + '...');
    }
    
    console.log('\\n🧪 TESTING NAVIGATION...');
    
    // Test if we can click around without errors
    try {
      const profileButton = page.locator('button:has-text("Profile")');
      if (await profileButton.isVisible()) {
        await profileButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Profile navigation works');
      } else {
        console.log('❌ Profile button not found');
      }
    } catch (navError) {
      console.log('❌ Navigation error:', navError.message);
    }
    
    console.log('\\n🎉 CUSTOMER HUB JSON FIX TEST COMPLETE!');
    
  } catch (error) {
    console.error('❌ Error testing customer hub:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCustomerHubFixed().catch(console.error);