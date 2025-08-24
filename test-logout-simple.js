const { chromium } = require('playwright-core');

(async () => {
  console.log('🎯 Starting manual logout test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:5183/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    console.log('📸 Taking screenshot of login page...');
    await page.screenshot({ path: 'login-test.png', fullPage: true });
    
    // Check if we're already logged in by looking for a redirect
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('🔍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/hub')) {
      console.log('✅ Already logged in, redirected to hub');
      
      // Take screenshot of hub page
      console.log('📸 Taking screenshot of hub page...');
      await page.screenshot({ path: 'hub-loaded-test.png', fullPage: true });
      
      // Look for logout button
      console.log('🔍 Looking for logout button...');
      
      const logoutButton = await page.locator('button:has-text("Log out")').first();
      
      if (await logoutButton.isVisible()) {
        console.log('✅ Found logout button');
        
        // Click logout
        console.log('🔄 Clicking logout button...');
        await logoutButton.click();
        
        // Wait for logout process
        await page.waitForTimeout(3000);
        
        // Check URL after logout
        const finalUrl = page.url();
        console.log('🔍 URL after logout:', finalUrl);
        
        if (finalUrl.includes('/login')) {
          console.log('✅ SUCCESS: Logout worked! Redirected to login page.');
        } else {
          console.log('❌ FAILED: Still on same page after logout');
          
          // Take screenshot of failed state
          await page.screenshot({ path: 'logout-failed-test.png', fullPage: true });
        }
      } else {
        console.log('❌ No logout button found');
        
        // Debug - show all buttons
        const allButtons = await page.locator('button').all();
        console.log('🔍 All buttons found:');
        for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
          const text = await allButtons[i].textContent();
          console.log(`  ${i}: "${text}"`);
        }
      }
    } else if (currentUrl.includes('/login')) {
      console.log('ℹ️  On login page - need to log in first');
      
      // Try to fill login form
      const usernameField = page.locator('input[type="text"]');
      const passwordField = page.locator('input[type="password"]');
      const signInButton = page.locator('button[type="submit"]');
      
      if (await usernameField.isVisible()) {
        console.log('🔄 Filling login form...');
        await usernameField.fill('freedom_exe');
        await passwordField.fill('test123');
        await signInButton.click();
        
        // Wait for redirect
        await page.waitForTimeout(5000);
        
        const newUrl = page.url();
        console.log('🔍 URL after login attempt:', newUrl);
        
        if (newUrl.includes('/hub')) {
          console.log('✅ Login successful');
          
          // Now test logout
          const logoutButton = await page.locator('button:has-text("Log out")').first();
          if (await logoutButton.isVisible()) {
            console.log('🔄 Testing logout...');
            await logoutButton.click();
            await page.waitForTimeout(3000);
            
            const finalUrl = page.url();
            if (finalUrl.includes('/login')) {
              console.log('✅ SUCCESS: Complete login-logout cycle worked!');
            } else {
              console.log('❌ FAILED: Logout did not redirect to login');
            }
          }
        } else {
          console.log('❌ Login failed');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    console.log('🏁 Test complete - keeping browser open for manual inspection');
    console.log('👁️  Check the screenshots and manually verify the logout functionality');
    console.log('⏰ Browser will close in 30 seconds...');
    
    setTimeout(async () => {
      await browser.close();
      console.log('🚪 Browser closed');
    }, 30000);
  }
})();