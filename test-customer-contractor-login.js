const { chromium } = require('playwright');

async function testCustomerContractorLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Customer and Contractor Hub login issues...\n');
    
    // Test Customer Hub login
    console.log('=== CUSTOMER HUB LOGIN TEST ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'cus-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what happens
    await page.screenshot({ 
      path: 'customer-login-attempt.png',
      fullPage: true 
    });
    
    console.log('📸 Customer login attempt screenshot saved');
    
    // Check for error messages or what page we're on
    const currentUrl = page.url();
    console.log(`🔗 Current URL after customer login: ${currentUrl}`);
    
    // Check for error messages
    const errorText = await page.textContent('body');
    if (errorText.includes('admin privileges required') || errorText.includes('error')) {
      console.log('❌ Customer Hub: Admin privileges required error detected');
    } else if (errorText.includes('Customer Hub') || errorText.includes('Customer')) {
      console.log('✅ Customer Hub: Successfully logged in');
    } else {
      console.log('🤔 Customer Hub: Unexpected response, checking content...');
      console.log('Page title:', await page.title());
    }
    
    console.log('\\n=== CONTRACTOR HUB LOGIN TEST ===');
    
    // Test Contractor Hub login
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'con-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'contractor-login-attempt.png',
      fullPage: true 
    });
    
    console.log('📸 Contractor login attempt screenshot saved');
    
    // Check for error messages or what page we're on
    const contractorUrl = page.url();
    console.log(`🔗 Current URL after contractor login: ${contractorUrl}`);
    
    // Check for error messages
    const contractorErrorText = await page.textContent('body');
    if (contractorErrorText.includes('admin privileges required') || contractorErrorText.includes('error')) {
      console.log('❌ Contractor Hub: Admin privileges required error detected');
    } else if (contractorErrorText.includes('Contractor Hub') || contractorErrorText.includes('Contractor')) {
      console.log('✅ Contractor Hub: Successfully logged in');
    } else {
      console.log('🤔 Contractor Hub: Unexpected response, checking content...');
      console.log('Page title:', await page.title());
    }
    
    console.log('\\n📋 DIAGNOSIS SUMMARY:');
    console.log('=' .repeat(60));
    console.log('🔍 Issues found:');
    
    if (errorText.includes('admin privileges required')) {
      console.log('  ❌ Customer Hub (cus-000): Admin privileges required');
      console.log('  🔧 Fix needed: Update HubRoleRouter to recognize "cus" prefix');
    }
    
    if (contractorErrorText.includes('admin privileges required')) {
      console.log('  ❌ Contractor Hub (con-000): Admin privileges required');
      console.log('  🔧 Fix needed: Update HubRoleRouter to recognize "con" prefix');
    }
    
    console.log('\\n💡 RECOMMENDED FIXES:');
    console.log('1. Update HubRoleRouter.tsx to handle cus-000 → customer hub routing');
    console.log('2. Update HubRoleRouter.tsx to handle con-000 → contractor hub routing');
    console.log('3. Ensure template user recognition patterns include all hub prefixes');
    
  } catch (error) {
    console.error('❌ Error testing customer/contractor login:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCustomerContractorLogin().catch(console.error);