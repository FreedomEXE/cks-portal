const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== TESTING MANAGER CREATE FORM ===');
    console.log('Navigating to http://localhost:5183...');
    await page.goto('http://localhost:5183', { waitUntil: 'networkidle' });
    
    // Login as admin
    const usernameInput = await page.$('input[placeholder="Username"], input[name="username"], input[type="text"]');
    const passwordInput = await page.$('input[placeholder="Password"], input[name="password"], input[type="password"]');
    
    if (usernameInput && passwordInput) {
      console.log('Logging in as Admin (freedom_exe)...');
      await usernameInput.fill('freedom_exe');
      await passwordInput.fill('Fr33dom123!');
      
      const loginButton = await page.$('button:has-text("Login"), button[type="submit"], input[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Click on Create tab
    console.log('Clicking Create tab...');
    const createTab = await page.$('text=➕ Create');
    if (createTab) {
      await createTab.click();
      await page.waitForTimeout(2000);
      
      // Look for user type dropdown
      console.log('Looking for user type dropdown...');
      const dropdown = await page.$('select');
      if (dropdown) {
        console.log('✓ Found user type dropdown');
        
        // Select Manager
        console.log('Selecting Manager...');
        await dropdown.selectOption('manager');
        await page.waitForTimeout(1000);
        
        // Check Manager form fields
        console.log('Checking Manager form fields...');
        const labels = await page.$$eval('label', labels => 
          labels.map(label => label.textContent?.trim()).filter(text => text)
        );
        
        console.log('Manager form fields found:');
        labels.forEach(label => {
          if (label && label.includes('Manager') || label.includes('Address') || 
              label.includes('Phone') || label.includes('Email') || 
              label.includes('Territory') || label.includes('Reports') || 
              label.includes('Role')) {
            console.log(`  ✓ ${label}`);
          }
        });
        
        // Check for specific required fields
        const requiredFields = [
          'Manager Name',
          'Address', 
          'Phone',
          'Email',
          'Territory',
          'Reports To',
          'Role/Position'
        ];
        
        console.log('\nValidating required fields:');
        for (const field of requiredFields) {
          const fieldExists = labels.some(label => 
            label && label.toLowerCase().includes(field.toLowerCase())
          );
          console.log(`  ${fieldExists ? '✓' : '❌'} ${field}`);
        }
        
        // Take screenshot
        await page.screenshot({ path: 'manager-create-form.png', fullPage: true });
        
      } else {
        console.log('❌ User type dropdown not found');
      }
    } else {
      console.log('❌ Create tab not found');
    }
    
    console.log('\n=== TESTING MANAGER HUB TEMPLATE ===');
    
    // Test Manager hub template
    console.log('Testing Manager hub template...');
    await page.goto('http://localhost:5183', { waitUntil: 'networkidle' });
    
    // Login as Manager template
    const usernameInput2 = await page.$('input[placeholder="Username"], input[name="username"], input[type="text"]');
    const passwordInput2 = await page.$('input[placeholder="Password"], input[name="password"], input[type="password"]');
    
    if (usernameInput2 && passwordInput2) {
      console.log('Logging in as Manager template (MGR-000)...');
      await usernameInput2.fill('MGR-000');
      await passwordInput2.fill('CksDemo!2025');
      
      const loginButton2 = await page.$('button:has-text("Login"), button[type="submit"], input[type="submit"]');
      if (loginButton2) {
        await loginButton2.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Click My Profile
    const profileTab = await page.$('text=My Profile');
    if (profileTab) {
      await profileTab.click();
      await page.waitForTimeout(2000);
      
      // Check updated profile fields
      const profileContent = await page.textContent('body');
      
      console.log('Manager profile fields validation:');
      const expectedFields = [
        'Manager Name',
        'Manager ID', 
        'Address',
        'Phone',
        'Email', 
        'Territory',
        'Reports To',
        'Role/Position',
        'Created Date',
        'Assigned Contractor(s)'
      ];
      
      expectedFields.forEach(field => {
        const exists = profileContent.includes(field);
        console.log(`  ${exists ? '✓' : '❌'} ${field}`);
      });
      
      // Take screenshot
      await page.screenshot({ path: 'manager-profile-updated.png', fullPage: true });
      
    }
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await browser.close();
})();