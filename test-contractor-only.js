const { chromium } = require('playwright');

async function testContractorLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Contractor Hub login...\n');
    
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(2000);
    
    // Clear fields first
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="text"]', 'con-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(4000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'contractor-login-result.png',
      fullPage: true 
    });
    
    console.log('📸 Contractor login result screenshot saved');
    
    // Check current state
    const currentUrl = page.url();
    const pageTitle = await page.title();
    console.log(`🔗 Current URL: ${currentUrl}`);
    console.log(`📄 Page title: ${pageTitle}`);
    
    // Check for specific error messages
    const bodyText = await page.textContent('body');
    
    if (bodyText.includes('admin privileges required')) {
      console.log('❌ CONTRACTOR HUB ERROR: Admin privileges required');
      console.log('🔧 Issue: HubRoleRouter not recognizing "con" prefix properly');
    } else if (bodyText.includes('Contractor Hub') || currentUrl.includes('con-000')) {
      console.log('✅ CONTRACTOR HUB: Successfully logged in');
    } else if (bodyText.includes('error') || bodyText.includes('Error')) {
      console.log('❌ CONTRACTOR HUB: Some error occurred');
      console.log('Error content preview:', bodyText.substring(0, 200) + '...');
    } else {
      console.log('🤔 CONTRACTOR HUB: Unexpected state');
      console.log('Body content preview:', bodyText.substring(0, 200) + '...');
    }
    
    // Also test ctr-000 like we did with Centers Hub
    console.log('\\n=== TESTING "ctr-000" FOR CONTRACTOR ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="text"]', 'ctr-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(4000);
    
    const ctrUrl = page.url();
    console.log(`🔗 ctr-000 URL result: ${ctrUrl}`);
    
    if (ctrUrl.includes('center')) {
      console.log('✅ ctr-000 redirects to Center Hub (expected)');
    } else {
      console.log('🤔 ctr-000 has unexpected routing');
    }
    
  } catch (error) {
    console.error('❌ Error testing contractor login:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testContractorLogin().catch(console.error);