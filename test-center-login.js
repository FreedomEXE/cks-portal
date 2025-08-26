const { chromium } = require('playwright');

async function testCenterLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`CONSOLE: ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`ERROR: ${error.message}`);
  });
  
  try {
    console.log('Testing Center hub login...');
    
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    console.log('Filling login form...');
    await page.fill('input[type="text"]', 'cen-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    console.log('Waiting for navigation...');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/hub')) {
      console.log('✅ Successfully reached hub');
    } else if (currentUrl.includes('/login')) {
      console.log('❌ Still on login page - possible auth failure');
    } else {
      console.log(`❌ Unexpected URL: ${currentUrl}`);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testCenterLogin().catch(console.error);