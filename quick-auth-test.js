const { chromium } = require('playwright');

async function quickAuthTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Quick Auth Test - Admin Login Flow\n');
    
    await page.goto('http://localhost:5183/login');
    await page.waitForLoadState('networkidle');
    console.log('📍 On login page');
    
    // Fill admin credentials
    const identifierInput = page.locator('input[name="identifier"], input[type="email"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button').first();
    
    await identifierInput.fill('freedom_exe');
    await passwordInput.fill('Fr33dom123!');
    console.log('✅ Filled credentials');
    
    await submitButton.click();
    console.log('🔄 Clicked submit');
    
    // Wait and see where we end up
    await page.waitForTimeout(8000);
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    await page.screenshot({ path: 'quick-auth-result.png' });
    console.log('📸 Screenshot saved');
    
    // Check if we can access admin functionality
    if (finalUrl.includes('/freedom_exe/hub')) {
      console.log('✅ Successfully logged in as freedom_exe');
      
      // Check page content
      const pageContent = await page.textContent('body');
      console.log('📄 Page contains "Dashboard":', pageContent.includes('Dashboard'));
      console.log('📄 Page contains "Directory":', pageContent.includes('Directory'));
      console.log('📄 Page contains "Create":', pageContent.includes('Create'));
      console.log('📄 Page contains "Admin":', pageContent.includes('Admin'));
      
      // Try to navigate to typical admin functions
      const directoryLink = page.locator('text=Directory').first();
      if (await directoryLink.count() > 0) {
        await directoryLink.click();
        await page.waitForTimeout(2000);
        console.log('✅ Successfully clicked Directory');
        
        await page.screenshot({ path: 'admin-directory-access.png' });
      }
    }
    
    // Also test a template user
    console.log('\n🔍 Testing template user WH-000...');
    
    await page.goto('http://localhost:5183/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const identifierInput2 = page.locator('input[name="identifier"], input[type="email"], input[type="text"]').first();
    const passwordInput2 = page.locator('input[type="password"]').first();
    const submitButton2 = page.locator('button').first();
    
    await identifierInput2.fill('WH-000');
    await passwordInput2.fill('CksDemo!2025');
    console.log('✅ Filled WH-000 credentials');
    
    await submitButton2.click();
    await page.waitForTimeout(8000);
    
    const warehouseUrl = page.url();
    console.log(`📍 Warehouse URL: ${warehouseUrl}`);
    
    await page.screenshot({ path: 'warehouse-login-result.png' });
    
    if (warehouseUrl.includes('/hub/warehouse') || warehouseUrl.includes('warehouse')) {
      console.log('✅ Warehouse user logged in successfully');
    } else {
      console.log('❌ Warehouse user login may have failed');
    }
    
  } catch (error) {
    console.error('❌ Quick auth test failed:', error);
    await page.screenshot({ path: 'auth-test-error.png' });
  }
  
  await browser.close();
}

quickAuthTest().then(() => {
  console.log('\n✅ Quick auth test complete!');
});