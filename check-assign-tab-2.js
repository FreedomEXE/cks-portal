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
    
    console.log('Looking for admin login...');
    
    // Try to find admin login elements
    const adminUsernameInput = await page.$('input[placeholder="Username"], input[name="username"], input[type="text"]');
    const adminPasswordInput = await page.$('input[placeholder="Password"], input[name="password"], input[type="password"]');
    
    if (adminUsernameInput && adminPasswordInput) {
      console.log('Found admin login form. Logging in as freedom_exe...');
      
      await adminUsernameInput.fill('freedom_exe');
      await adminPasswordInput.fill('Fr33dom123!');
      
      // Find and click login button
      const loginButton = await page.$('button:has-text("Login"), button[type="submit"], input[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Wait for Admin Hub to load
    console.log('Waiting for Admin Hub to load...');
    await page.waitForTimeout(2000);
    
    // Look for Assign tab using different selectors
    console.log('Looking for Assign tab...');
    const assignTab = await page.$('text=🔗 Assign') || 
                      await page.$('[data-tab="assign"]') || 
                      await page.$('button:has-text("Assign")') ||
                      await page.$('text=Assign');
    
    if (assignTab) {
      console.log('Found Assign tab. Clicking it...');
      await assignTab.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of the Assign tab
      console.log('Taking screenshot of Assign tab...');
      await page.screenshot({ path: 'assign-tab-current.png', fullPage: true });
      
      // Look for page content
      const pageContent = await page.textContent('body');
      console.log('Assign tab content (first 1000 chars):');
      console.log(pageContent.substring(0, 1000));
      
      // Look for specific elements mentioned by user
      console.log('\n=== Looking for unassigned buckets ===');
      const unassignedText = await page.$$('text*=unassigned, text*=Unassigned');
      console.log(`Found ${unassignedText.length} unassigned-related elements`);
      
      for (let i = 0; i < unassignedText.length; i++) {
        const text = await unassignedText[i].textContent();
        console.log(`Unassigned ${i + 1}: "${text}"`);
      }
      
      console.log('\n=== Looking for bulk assignment ===');
      const bulkText = await page.$$('text*=bulk, text*=Bulk');
      console.log(`Found ${bulkText.length} bulk-related elements`);
      
      console.log('\n=== Looking for crew-center assignment ===');
      const crewCenterText = await page.$$('text*=crew, text*=Crew, text*=center, text*=Center');
      console.log(`Found ${crewCenterText.length} crew/center-related elements`);
      
      await page.waitForTimeout(5000);
      
    } else {
      console.log('Could not find Assign tab');
      await page.screenshot({ path: 'no-assign-tab.png' });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  await browser.close();
})();