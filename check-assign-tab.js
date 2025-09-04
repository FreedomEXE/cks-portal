const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
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
        await page.waitForTimeout(2000);
      }
    }
    
    // Wait for Admin Hub to load
    console.log('Waiting for Admin Hub to load...');
    await page.waitForTimeout(3000);
    
    // Look for Assign tab
    console.log('Looking for Assign tab...');
    const assignTab = await page.$('text=Assign, [data-tab="assign"], button:has-text("Assign")');
    
    if (assignTab) {
      console.log('Found Assign tab. Clicking it...');
      await assignTab.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of the Assign tab
      console.log('Taking screenshot of Assign tab...');
      await page.screenshot({ path: 'assign-tab-screenshot.png', fullPage: true });
      
      // Look for unassigned bucket elements
      console.log('Looking for unassigned bucket sections...');
      const unassignedSections = await page.$$('[class*="unassigned"], [class*="bucket"], h3, h4, .card, .ui-card');
      
      console.log(`Found ${unassignedSections.length} potential section elements`);
      
      for (let i = 0; i < Math.min(unassignedSections.length, 10); i++) {
        const element = unassignedSections[i];
        const text = await element.textContent();
        console.log(`Section ${i + 1}: "${text?.substring(0, 100)}..."`);
      }
      
      // Look for dropdowns
      const dropdowns = await page.$$('select');
      console.log(`Found ${dropdowns.length} dropdown elements`);
      
      // Look for bulk assignment or crew-center sections
      const bulkElements = await page.$$('text=bulk, text=Bulk, text=crew, text=Crew');
      console.log(`Found ${bulkElements.length} bulk/crew related elements`);
      
    } else {
      console.log('Could not find Assign tab. Available elements:');
      const tabs = await page.$$('button, [role="tab"], .tab, [data-tab]');
      for (let i = 0; i < Math.min(tabs.length, 10); i++) {
        const text = await tabs[i].textContent();
        console.log(`Tab ${i + 1}: "${text}"`);
      }
    }
    
    await page.waitForTimeout(5000); // Keep browser open to see the page
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  await browser.close();
})();