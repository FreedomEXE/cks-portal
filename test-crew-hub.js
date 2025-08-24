// Test Crew Hub Login and Functionality
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5183';
const CREW_CREDENTIALS = { username: 'crw-000', password: 'CksDemo!2025' };

async function testCrewHub() {
  console.log('\n🔧 Testing Crew Hub Login and Functionality...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('📋 === CREW HUB LOGIN TEST ===');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    console.log('✓ Navigated to login page');
    await page.screenshot({ path: 'crew-test-login.png' });
    
    // Fill in crew credentials
    await page.fill('input[type="text"], input[placeholder*="username" i]', CREW_CREDENTIALS.username);
    await page.fill('input[type="password"]', CREW_CREDENTIALS.password);
    console.log('✓ Entered crew credentials:', CREW_CREDENTIALS.username);
    
    // Click login button
    const loginBtn = await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("sign")').first();
    if (await loginBtn.count() > 0) {
      await loginBtn.click();
      console.log('✓ Clicked login button');
    } else {
      console.log('❌ Could not find login button');
      await browser.close();
      return;
    }
    
    // Wait for navigation and check result
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('✓ Post-login URL:', currentUrl);
    
    // Check if we're redirected properly
    if (currentUrl.includes('/login')) {
      console.log('❌ ISSUE: Still on login page - authentication failed');
      const errorText = await page.textContent('body');
      if (errorText.includes('error') || errorText.includes('invalid')) {
        console.log('❌ Authentication Error Detected');
      }
      await page.screenshot({ path: 'crew-test-login-failed.png' });
    } else if (currentUrl.includes('crw-000') && currentUrl.includes('hub')) {
      console.log('✅ SUCCESS: Redirected to crew hub');
      await page.screenshot({ path: 'crew-test-hub-loaded.png' });
      
      // Check hub content
      const pageContent = await page.textContent('body');
      console.log('✓ Checking hub content...');
      
      // Look for crew-specific content
      const hasCrewContent = pageContent.toLowerCase().includes('crew') || pageContent.toLowerCase().includes('crw-000');
      console.log('✓ Has Crew Content:', hasCrewContent);
      
      // Check for navigation elements
      const buttons = await page.locator('button').all();
      const buttonTexts = [];
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && text.length > 2 && text.length < 25) {
          buttonTexts.push(text.trim());
        }
      }
      console.log('✓ Available Buttons:', buttonTexts.slice(0, 8));
      
      // Check for any error messages
      const hasErrors = pageContent.toLowerCase().includes('error') || 
                       pageContent.toLowerCase().includes('failed') ||
                       pageContent.toLowerCase().includes('undefined');
      console.log('✓ Has Errors:', hasErrors);
      
      // Test logout
      const logoutBtn = await page.locator('button:has-text("Log out"), button:has-text("logout")').first();
      if (await logoutBtn.count() > 0) {
        console.log('✓ Logout button found - testing logout...');
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        
        const postLogoutUrl = page.url();
        const logoutWorked = postLogoutUrl.includes('/login');
        console.log('✓ Logout worked:', logoutWorked);
        await page.screenshot({ path: 'crew-test-logout.png' });
      } else {
        console.log('❌ No logout button found');
      }
      
    } else {
      console.log('❌ ISSUE: Unexpected redirect URL:', currentUrl);
      await page.screenshot({ path: 'crew-test-unexpected-redirect.png' });
    }
    
    // Console logs check
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });
    
    if (logs.length > 0) {
      console.log('\n🚨 Console Errors Found:');
      logs.forEach(log => console.log(log));
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    await page.screenshot({ path: 'crew-test-error.png' });
  } finally {
    await browser.close();
  }
  
  console.log('\n📸 Screenshots generated:');
  console.log('   • crew-test-login.png - Initial login');
  console.log('   • crew-test-hub-loaded.png or crew-test-login-failed.png - Result');
  console.log('   • crew-test-logout.png - Logout test');
  console.log('\n✅ Crew Hub test complete');
}

testCrewHub().catch(console.error);