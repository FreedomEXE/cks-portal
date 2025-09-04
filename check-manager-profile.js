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
    
    // Login as Manager template user
    const usernameInput = await page.$('input[placeholder="Username"], input[name="username"], input[type="text"]');
    const passwordInput = await page.$('input[placeholder="Password"], input[name="password"], input[type="password"]');
    
    if (usernameInput && passwordInput) {
      console.log('Logging in as Manager template user (MGR-000)...');
      await usernameInput.fill('MGR-000');
      await passwordInput.fill('CksDemo!2025');
      
      const loginButton = await page.$('button:has-text("Login"), button[type="submit"], input[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Wait for Manager Hub to load
    console.log('Waiting for Manager Hub to load...');
    await page.waitForTimeout(2000);
    
    // Look for Profile tab/section
    console.log('Looking for Profile section...');
    
    // Try to find Profile tab
    const profileTab = await page.$('text=Profile, text=👤, [data-tab="profile"], button:has-text("Profile")') ||
                       await page.$('text=👤 Profile') ||
                       await page.$('button:has-text("👤")');
    
    if (profileTab) {
      console.log('Found Profile tab. Clicking it...');
      await profileTab.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Profile tab not found. Looking for profile content in current view...');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'manager-hub-profile.png', fullPage: true });
    
    // Look for profile data fields
    console.log('\n=== MANAGER PROFILE DATA FIELDS ===');
    
    // Get all text content to analyze profile fields
    const pageContent = await page.textContent('body');
    console.log('Page content preview (first 2000 chars):');
    console.log(pageContent.substring(0, 2000));
    
    // Look for common profile field patterns
    console.log('\n=== SEARCHING FOR PROFILE FIELDS ===');
    
    // Look for input fields
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input fields:`);
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const value = await input.inputValue();
      
      if (placeholder || name || value) {
        console.log(`Input ${i + 1}: placeholder="${placeholder}", name="${name}", type="${type}", value="${value}"`);
      }
    }
    
    // Look for labels
    const labels = await page.$$('label, .label, [class*="label"]');
    console.log(`\nFound ${labels.length} label elements:`);
    
    for (let i = 0; i < Math.min(labels.length, 20); i++) {
      const label = labels[i];
      const text = await label.textContent();
      if (text && text.trim()) {
        console.log(`Label ${i + 1}: "${text.trim()}"`);
      }
    }
    
    // Look for profile-related divs or sections
    const profileElements = await page.$$('[class*="profile"], [class*="Profile"], [id*="profile"], [id*="Profile"]');
    console.log(`\nFound ${profileElements.length} profile-related elements`);
    
    // Look for form elements
    const forms = await page.$$('form, .form, [class*="form"]');
    console.log(`\nFound ${forms.length} form elements`);
    
    // Look for specific manager-related text patterns
    console.log('\n=== MANAGER-SPECIFIC CONTENT ===');
    const managerPatterns = [
      'manager_id', 'Manager ID', 'manager_name', 'Manager Name',
      'email', 'Email', 'phone', 'Phone', 'department', 'Department',
      'hire_date', 'Hire Date', 'salary', 'Salary', 'supervisor',
      'assigned_center', 'Assigned Center', 'role', 'Role', 'status',
      'first_name', 'First Name', 'last_name', 'Last Name',
      'employee_id', 'Employee ID', 'position', 'Position'
    ];
    
    for (const pattern of managerPatterns) {
      if (pageContent.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`✓ Found pattern: "${pattern}"`);
      }
    }
    
    // Look for tables that might contain profile data
    const tables = await page.$$('table');
    if (tables.length > 0) {
      console.log('\n=== TABLE DATA ===');
      for (let i = 0; i < tables.length; i++) {
        const tableText = await tables[i].textContent();
        if (tableText && tableText.includes('Name') || tableText.includes('ID') || tableText.includes('Email')) {
          console.log(`Table ${i + 1} content (first 500 chars):`);
          console.log(tableText.substring(0, 500));
        }
      }
    }
    
    console.log('\n=== NAVIGATION TABS ===');
    const tabs = await page.$$('button, [role="tab"], .tab, [data-tab]');
    for (let i = 0; i < Math.min(tabs.length, 10); i++) {
      const text = await tabs[i].textContent();
      if (text && text.trim()) {
        console.log(`Tab ${i + 1}: "${text.trim()}"`);
      }
    }
    
    await page.waitForTimeout(8000); // Keep browser open to see the page
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'manager-hub-error.png' });
  }
  
  await browser.close();
})();