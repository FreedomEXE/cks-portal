const { chromium } = require('playwright-core');

// Test credentials for all hubs
const TEST_USERS = [
  { username: 'Freedom_exe', password: 'Fr33dom123!', expectedHub: 'admin', hubName: 'Admin' },
  { username: 'MGR-000', password: 'CksDemo!2025', expectedHub: 'manager', hubName: 'Manager' },
  { username: 'CON-000', password: 'CksDemo!2025', expectedHub: 'contractor', hubName: 'Contractor' },
  { username: 'CUS-000', password: 'CksDemo!2025', expectedHub: 'customer', hubName: 'Customer' },
  { username: 'CEN-000', password: 'CksDemo!2025', expectedHub: 'center', hubName: 'Center' },
  { username: 'CREW-000', password: 'CksDemo!2025', expectedHub: 'crew', hubName: 'Crew' }
];

async function testHub(browser, user) {
  console.log(`\n🎯 Testing ${user.hubName} Hub (${user.username})`);
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login
    await page.goto('http://localhost:5183/login', { waitUntil: 'networkidle' });
    
    // Fill login form
    console.log(`📝 Logging in as ${user.username}...`);
    await page.fill('input[type="text"]', user.username);
    await page.fill('input[type="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`🔍 Current URL: ${currentUrl}`);
    
    // Check if login was successful
    if (currentUrl.includes('/hub')) {
      console.log(`✅ Login successful - redirected to hub`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `${user.hubName.toLowerCase()}-hub-loaded.png`, 
        fullPage: true 
      });
      
      // Check for console errors
      const consoleLogs = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(msg.text());
        }
      });
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(3000);
      
      // Check for logout button
      const logoutButton = page.locator('button:has-text("Log out")').first();
      const hasLogoutButton = await logoutButton.isVisible();
      
      console.log(`🔘 Logout button visible: ${hasLogoutButton}`);
      
      if (hasLogoutButton) {
        // Test logout
        console.log(`🔄 Testing logout...`);
        await logoutButton.click();
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        const logoutSuccess = finalUrl.includes('/login');
        
        console.log(`🚪 Logout successful: ${logoutSuccess} (URL: ${finalUrl})`);
        
        return {
          hubName: user.hubName,
          username: user.username,
          loginSuccess: true,
          hubLoaded: true,
          logoutButtonVisible: hasLogoutButton,
          logoutSuccess: logoutSuccess,
          consoleErrors: consoleLogs,
          finalUrl: finalUrl
        };
      } else {
        console.log(`❌ No logout button found`);
        return {
          hubName: user.hubName,
          username: user.username,
          loginSuccess: true,
          hubLoaded: true,
          logoutButtonVisible: false,
          logoutSuccess: false,
          consoleErrors: consoleLogs,
          finalUrl: currentUrl
        };
      }
    } else {
      console.log(`❌ Login failed - still on login page`);
      await page.screenshot({ 
        path: `${user.hubName.toLowerCase()}-login-failed.png`, 
        fullPage: true 
      });
      
      return {
        hubName: user.hubName,
        username: user.username,
        loginSuccess: false,
        hubLoaded: false,
        logoutButtonVisible: false,
        logoutSuccess: false,
        consoleErrors: [],
        finalUrl: currentUrl
      };
    }
    
  } catch (error) {
    console.log(`❌ Error testing ${user.hubName}: ${error.message}`);
    await page.screenshot({ 
      path: `${user.hubName.toLowerCase()}-error.png`, 
      fullPage: true 
    });
    
    return {
      hubName: user.hubName,
      username: user.username,
      loginSuccess: false,
      hubLoaded: false,
      logoutButtonVisible: false,
      logoutSuccess: false,
      consoleErrors: [error.message],
      finalUrl: page.url()
    };
  } finally {
    await context.close();
  }
}

(async () => {
  console.log('🚀 Starting comprehensive hub testing...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // Slow down for better visibility
  });
  
  const results = [];
  
  try {
    // Test each hub
    for (const user of TEST_USERS) {
      const result = await testHub(browser, user);
      results.push(result);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Print summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    
    results.forEach(result => {
      console.log(`\n${result.hubName} Hub (${result.username}):`);
      console.log(`  ✅ Login: ${result.loginSuccess ? 'PASS' : 'FAIL'}`);
      console.log(`  ✅ Hub Loaded: ${result.hubLoaded ? 'PASS' : 'FAIL'}`);
      console.log(`  ✅ Logout Button: ${result.logoutButtonVisible ? 'VISIBLE' : 'MISSING'}`);
      console.log(`  ✅ Logout Function: ${result.logoutSuccess ? 'PASS' : 'FAIL'}`);
      console.log(`  🔗 Final URL: ${result.finalUrl}`);
      if (result.consoleErrors.length > 0) {
        console.log(`  ❌ Console Errors: ${result.consoleErrors.length}`);
        result.consoleErrors.forEach(error => console.log(`    - ${error}`));
      }
    });
    
    const passedTests = results.filter(r => r.loginSuccess && r.hubLoaded && r.logoutSuccess);
    console.log(`\n🎯 Overall Results: ${passedTests.length}/${results.length} hubs fully functional`);
    
  } finally {
    console.log('\n⏰ Keeping browser open for 10 seconds for manual inspection...');
    setTimeout(async () => {
      await browser.close();
      console.log('🚪 Browser closed');
    }, 10000);
  }
})();