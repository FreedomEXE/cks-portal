const { chromium } = require('playwright');

async function testLogoutFlow() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log(`🖥️  CONSOLE: ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });

  try {
    console.log('🚀 Starting logout flow test...');
    
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:5183');
    
    // Wait a bit to see what happens automatically
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after initial load: ${currentUrl}`);
    
    // Check if we were automatically redirected to a hub
    if (currentUrl.includes('/hub')) {
      console.log('⚠️  ISSUE: Automatically redirected to hub without login!');
      console.log('🔍 Checking for existing authentication state...');
      
      // Check local storage
      const localStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          items[key] = window.localStorage.getItem(key);
        }
        return items;
      });
      console.log('📦 Local Storage:', localStorage);
      
      // Check session storage
      const sessionStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          items[key] = window.sessionStorage.getItem(key);
        }
        return items;
      });
      console.log('📦 Session Storage:', sessionStorage);
      
      // Try to find and click logout button
      console.log('🔍 Looking for logout button...');
      
      // Wait for page to load completely
      await page.waitForTimeout(2000);
      
      // Look for logout button - try multiple selectors
      const logoutSelectors = [
        'button:has-text("Log out")',
        'button:has-text("Logout")',
        'button:has-text("Sign out")',
        '[aria-label*="Sign out"]',
        '[aria-label*="Log out"]',
        'button[title="Sign out"]'
      ];
      
      let logoutButton = null;
      for (const selector of logoutSelectors) {
        try {
          logoutButton = await page.locator(selector).first();
          if (await logoutButton.isVisible()) {
            console.log(`✅ Found logout button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (logoutButton && await logoutButton.isVisible()) {
        console.log('🖱️  Clicking logout button...');
        await logoutButton.click();
        
        // Wait to see what happens
        await page.waitForTimeout(3000);
        
        const afterLogoutUrl = page.url();
        console.log(`📍 URL after logout click: ${afterLogoutUrl}`);
        
        if (afterLogoutUrl.includes('/login')) {
          console.log('✅ Successfully redirected to login page');
          
          // Wait a bit more to see if it auto-redirects back
          await page.waitForTimeout(5000);
          
          const finalUrl = page.url();
          console.log(`📍 Final URL after waiting: ${finalUrl}`);
          
          if (finalUrl.includes('/hub')) {
            console.log('❌ PROBLEM: Auto-redirected back to hub after logout!');
            console.log('🔍 This indicates the login page useEffect is triggering');
          } else {
            console.log('✅ Logout successful - stayed on login page');
          }
        } else {
          console.log('❌ PROBLEM: Did not redirect to login page after logout');
        }
      } else {
        console.log('❌ Could not find logout button');
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'logout-debug.png' });
        console.log('📸 Screenshot saved as logout-debug.png');
      }
    } else {
      console.log('✅ Correctly on login page');
      
      // Test manual login and then logout
      console.log('🔐 Testing manual login...');
      
      // Fill in test credentials
      await page.fill('input[type="text"]', 'crw-000');
      await page.fill('input[type="password"]', 'CksDemo!2025');
      
      // Click sign in
      await page.click('button:has-text("Sign in")');
      
      // Wait for navigation
      await page.waitForTimeout(5000);
      
      const afterLoginUrl = page.url();
      console.log(`📍 URL after login: ${afterLoginUrl}`);
      
      if (afterLoginUrl.includes('/hub')) {
        console.log('✅ Successfully logged in to hub');
        
        // Now test logout
        console.log('🖱️  Testing logout...');
        const logoutButton = page.locator('button:has-text("Log out")').first();
        
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
          
          await page.waitForTimeout(3000);
          
          const finalUrl = page.url();
          console.log(`📍 URL after logout: ${finalUrl}`);
          
          if (finalUrl.includes('/login')) {
            console.log('✅ Logout successful');
          } else {
            console.log('❌ Logout failed');
          }
        } else {
          console.log('❌ Logout button not found');
        }
      } else {
        console.log('❌ Login failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await browser.close();
  }
}

testLogoutFlow().catch(console.error);