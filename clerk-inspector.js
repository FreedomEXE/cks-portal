const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('🔍 Clerk Settings Inspector');
  console.log('1. Opening Clerk dashboard...');
  await page.goto('https://dashboard.clerk.com/sign-in');
  
  console.log('2. Please sign in manually (I\'ll wait)...');
  
  // Wait for user to sign in - look for dashboard indicators
  let signedIn = false;
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes
  
  while (!signedIn && attempts < maxAttempts) {
    try {
      // Check multiple possible dashboard indicators
      const dashboardFound = await Promise.race([
        page.waitForSelector('[data-testid="sidebar"]', { timeout: 2000 }).then(() => true),
        page.waitForSelector('.sidebar', { timeout: 2000 }).then(() => true),
        page.waitForSelector('text="API Keys"', { timeout: 2000 }).then(() => true),
        page.waitForSelector('text="Applications"', { timeout: 2000 }).then(() => true),
        page.waitForTimeout(2000).then(() => false)
      ]);
      
      if (dashboardFound) {
        signedIn = true;
        console.log('✅ Dashboard detected!');
        break;
      }
    } catch (e) {
      // Continue waiting
    }
    attempts++;
    if (attempts % 10 === 0) {
      console.log(`⏳ Still waiting for sign-in... (${attempts * 2}s)`);
    }
  }
  
  if (!signedIn) {
    console.log('❌ Timeout waiting for sign-in');
    await browser.close();
    return;
  }
  
  // Now inspect the settings
  console.log('🔍 Checking Clerk settings...');
  
  try {
    // 1. Check API Keys
    console.log('\n📋 Checking API Keys...');
    await page.click('text="API Keys"');
    await page.waitForTimeout(2000);
    
    // Look for secret key display
    const secretKeyVisible = await page.isVisible('text="Secret keys"') || 
                            await page.isVisible('[data-testid="secret-key"]') ||
                            await page.isVisible('text="sk_test"');
    console.log(`API Keys page loaded: ${secretKeyVisible ? '✅' : '❌'}`);
    
  } catch (e) {
    console.log('❌ Could not navigate to API Keys:', e.message);
  }
  
  try {
    // 2. Check Email & SMS settings
    console.log('\n📧 Checking Email & SMS settings...');
    await page.click('text="Email & SMS"');
    await page.waitForTimeout(2000);
    
    const emailSettings = await page.textContent('body');
    const hasEmailConfig = emailSettings.includes('email') || emailSettings.includes('SMTP');
    console.log(`Email settings found: ${hasEmailConfig ? '✅' : '❌'}`);
    
    if (emailSettings.includes('Development')) {
      console.log('⚠️  Development mode detected in email settings');
    }
    
  } catch (e) {
    console.log('❌ Could not navigate to Email & SMS:', e.message);
  }
  
  try {
    // 3. Check User & Authentication
    console.log('\n👥 Checking User & Authentication...');
    await page.click('text="User & Authentication"');
    await page.waitForTimeout(2000);
    
    // Check for restrictions
    const authSettings = await page.textContent('body');
    if (authSettings.includes('restriction') || authSettings.includes('allowlist')) {
      console.log('⚠️  Restrictions detected in authentication settings');
    }
    
  } catch (e) {
    console.log('❌ Could not navigate to User & Authentication:', e.message);
  }
  
  console.log('\n🔍 Settings inspection complete!');
  console.log('Browser will stay open for manual inspection...');
  console.log('Press Ctrl+C to close when done.');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(300000); // 5 minutes
  
  await browser.close();
})();