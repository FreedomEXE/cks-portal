const { chromium } = require('playwright');

async function testButtonClick() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.text().includes('Crew Logout')) {
      console.log(`🔍 LOGOUT MESSAGE: ${msg.text()}`);
    }
  });
  
  try {
    console.log('Going to crew hub...');
    await page.goto('http://localhost:5183/login');
    
    // Login
    await page.fill('input[type="text"]', 'crw-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    console.log('Looking for logout button...');
    
    // Find all buttons and their text
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      console.log(`Button ${i}: "${text}" - Visible: ${isVisible}`);
    }
    
    // Try to find and click logout button
    const logoutButton = page.locator('button:has-text("Log out")');
    const count = await logoutButton.count();
    console.log(`Found ${count} logout buttons`);
    
    if (count > 0) {
      console.log('Clicking first logout button...');
      await logoutButton.first().click();
      
      console.log('Waiting 5 seconds after click...');
      await page.waitForTimeout(5000);
      
      console.log(`Final URL: ${page.url()}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testButtonClick().catch(console.error);