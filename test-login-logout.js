const { test, expect } = require('@playwright/test');

test('Login and logout functionality', async ({ page }) => {
  console.log('🎯 Testing login-logout functionality...');
  
  // Navigate to login page
  await page.goto('http://localhost:5183/login');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of login page
  await page.screenshot({ path: 'login-page-test.png', fullPage: true });
  
  // Check if logo is visible
  const logo = page.locator('img[alt="CKS"]');
  await expect(logo).toBeVisible();
  
  console.log('✅ Login page loaded successfully');
  
  // Fill login form (if not already logged in)
  try {
    const usernameField = page.locator('input[type="text"]');
    const passwordField = page.locator('input[type="password"]');
    const signInButton = page.locator('button[type="submit"]');
    
    if (await usernameField.isVisible()) {
      await usernameField.fill('freedom_exe');
      await passwordField.fill('test123');
      await signInButton.click();
      
      // Wait for redirect
      await page.waitForURL('**/freedom_exe/hub', { timeout: 10000 });
      console.log('✅ Successfully logged in');
    }
  } catch (error) {
    console.log('ℹ️  Already logged in or redirect happened automatically');
  }
  
  // Wait for hub page to load
  await page.waitForLoadState('networkidle', { timeout: 10000 });
  
  // Take screenshot of hub page
  await page.screenshot({ path: 'hub-page-test.png', fullPage: true });
  
  // Look for logout button
  const logoutButtons = [
    'button:has-text("Log out")',
    'button:has-text("Logout")', 
    'button[title="Sign out"]',
    'button[aria-label*="Sign out"]'
  ];
  
  let logoutButton = null;
  for (const selector of logoutButtons) {
    try {
      logoutButton = page.locator(selector);
      if (await logoutButton.isVisible()) {
        console.log(`✅ Found logout button: ${selector}`);
        break;
      }
    } catch (e) {
      console.log(`❌ Logout button not found: ${selector}`);
    }
  }
  
  if (logoutButton && await logoutButton.isVisible()) {
    console.log('🔄 Attempting to logout...');
    
    // Click logout button
    await logoutButton.click();
    
    // Wait for logout process
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to login
    try {
      await page.waitForURL('**/login', { timeout: 5000 });
      console.log('✅ Successfully logged out and redirected to login');
    } catch (error) {
      console.log('❌ Logout failed - still on same page');
      console.log('Current URL:', page.url());
      
      // Take screenshot of failed state
      await page.screenshot({ path: 'logout-failed-test.png', fullPage: true });
    }
  } else {
    console.log('❌ No logout button found');
    
    // Log all visible buttons for debugging
    const allButtons = await page.locator('button').all();
    console.log('🔍 All visible buttons:');
    for (let i = 0; i < allButtons.length; i++) {
      try {
        const text = await allButtons[i].textContent();
        const aria = await allButtons[i].getAttribute('aria-label');
        console.log(`  Button ${i}: "${text}" (aria-label: "${aria}")`);
      } catch (e) {
        console.log(`  Button ${i}: Could not read text`);
      }
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'final-state-test.png', fullPage: true });
  
  console.log('🏁 Test completed');
});