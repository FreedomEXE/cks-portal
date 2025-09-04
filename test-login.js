const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing login for mgr-001...');
  
  try {
    // Go to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5184/login');
    await page.waitForTimeout(2000);
    
    // Try different username variations
    const usernameVariations = ['mgr-001', 'MGR-001', 'therealtyrell@gmail.com'];
    const password = 'test123';
    
    for (const username of usernameVariations) {
      console.log(`\n2. Trying to login with: ${username}`);
      
      // Clear and fill username
      await page.fill('input[type="email"], input[placeholder*="username"], input[placeholder*="email"]', '');
      await page.fill('input[type="email"], input[placeholder*="username"], input[placeholder*="email"]', username);
      
      // Fill password
      await page.fill('input[type="password"]', password);
      
      // Click sign in
      console.log('3. Clicking Sign In...');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Check for error messages
      const errorText = await page.textContent('body');
      if (errorText.includes("Couldn't find your account")) {
        console.log(`❌ Failed with ${username}: Account not found`);
        continue;
      } else if (errorText.includes('error') || errorText.includes('Error')) {
        console.log(`⚠️  Error with ${username}:`, await page.textContent('[role="alert"], .error, .text-red-500').catch(() => 'Unknown error'));
        continue;
      } else if (page.url().includes('/hub') || page.url().includes('/mgr-001')) {
        console.log(`✅ Success! Logged in with ${username}`);
        console.log(`Current URL: ${page.url()}`);
        break;
      } else {
        console.log(`🤔 Unexpected state with ${username}. Current URL: ${page.url()}`);
      }
      
      // Reset for next attempt
      await page.goto('http://localhost:5184/login');
      await page.waitForTimeout(2000);
    }
    
    console.log('\n📋 Current page state:');
    console.log(`URL: ${page.url()}`);
    console.log(`Title: ${await page.title()}`);
    
    // Keep browser open for inspection
    console.log('\n🔍 Browser will stay open for inspection...');
    await page.waitForTimeout(60000); // 1 minute
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();