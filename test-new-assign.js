const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
  
  try {
    console.log('Navigating to http://localhost:5183...');
    await page.goto('http://localhost:5183', { waitUntil: 'networkidle' });
    
    // Login
    const adminUsernameInput = await page.$('input[placeholder="Username"], input[name="username"], input[type="text"]');
    const adminPasswordInput = await page.$('input[placeholder="Password"], input[name="password"], input[type="password"]');
    
    if (adminUsernameInput && adminPasswordInput) {
      console.log('Logging in as freedom_exe...');
      await adminUsernameInput.fill('freedom_exe');
      await adminPasswordInput.fill('Fr33dom123!');
      
      const loginButton = await page.$('button:has-text("Login"), button[type="submit"], input[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Click on Assign tab
    console.log('Clicking Assign tab...');
    const assignTab = await page.$('text=🔗 Assign');
    if (assignTab) {
      await assignTab.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot
      await page.screenshot({ path: 'new-assign-tab.png', fullPage: true });
      
      // Check for the new dropdown
      console.log('Looking for the new dropdown...');
      const dropdown = await page.$('select');
      if (dropdown) {
        console.log('✅ Found dropdown!');
        
        // Get dropdown options
        const options = await page.$$eval('select option', options => 
          options.map(option => ({ value: option.value, text: option.textContent }))
        );
        
        console.log('Dropdown options:', options);
        
        // Test changing the dropdown
        console.log('Testing dropdown changes...');
        await dropdown.selectOption('crew');
        await page.waitForTimeout(1000);
        
        await dropdown.selectOption('customers');
        await page.waitForTimeout(1000);
        
        await dropdown.selectOption('warehouses');
        await page.waitForTimeout(1000);
        
        console.log('✅ Dropdown functionality working!');
      } else {
        console.log('❌ Dropdown not found');
      }
      
      // Check that legacy sections are gone
      const legacyText = await page.textContent('body');
      if (legacyText.includes('Legacy Bulk Assignment')) {
        console.log('❌ Legacy Bulk Assignment still present');
      } else {
        console.log('✅ Legacy Bulk Assignment removed');
      }
      
      if (legacyText.includes('Crew → Center Assignment')) {
        console.log('❌ Crew → Center Assignment still present');
      } else {
        console.log('✅ Crew → Center Assignment removed');  
      }
      
      await page.waitForTimeout(5000);
      
    } else {
      console.log('❌ Could not find Assign tab');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
})();