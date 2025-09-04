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
    
    // Click on "My Profile" tab
    console.log('Clicking on "My Profile" tab...');
    const profileTab = await page.$('text=My Profile');
    
    if (profileTab) {
      await profileTab.click();
      await page.waitForTimeout(3000);
      console.log('✓ Clicked My Profile tab');
      
      // Take screenshot of profile page
      await page.screenshot({ path: 'manager-profile-page.png', fullPage: true });
      
      // Get profile page content
      const profileContent = await page.textContent('body');
      console.log('\n=== MANAGER PROFILE PAGE CONTENT ===');
      console.log(profileContent);
      
      // Look for input fields in profile section
      console.log('\n=== PROFILE INPUT FIELDS ===');
      const inputs = await page.$$('input');
      console.log(`Found ${inputs.length} input fields in profile:`);
      
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const placeholder = await input.getAttribute('placeholder');
        const name = await input.getAttribute('name');
        const type = await input.getAttribute('type');
        const value = await input.inputValue();
        const label = await input.evaluate(el => {
          const parent = el.closest('div, fieldset, label');
          return parent ? parent.textContent : '';
        });
        
        console.log(`Input ${i + 1}: type="${type}", placeholder="${placeholder}", name="${name}", value="${value}"`);
        if (label && label.length < 200) {
          console.log(`  Associated text: "${label.substring(0, 100)}..."`);
        }
      }
      
      // Look for select dropdowns
      console.log('\n=== PROFILE SELECT FIELDS ===');
      const selects = await page.$$('select');
      console.log(`Found ${selects.length} select fields in profile:`);
      
      for (let i = 0; i < selects.length; i++) {
        const select = selects[i];
        const name = await select.getAttribute('name');
        const options = await select.$$eval('option', opts => 
          opts.map(opt => ({ value: opt.value, text: opt.textContent }))
        );
        
        console.log(`Select ${i + 1}: name="${name}"`);
        console.log(`  Options: ${options.map(o => o.text).join(', ')}`);
      }
      
      // Look for textareas
      console.log('\n=== PROFILE TEXTAREA FIELDS ===');
      const textareas = await page.$$('textarea');
      console.log(`Found ${textareas.length} textarea fields in profile:`);
      
      for (let i = 0; i < textareas.length; i++) {
        const textarea = textareas[i];
        const placeholder = await textarea.getAttribute('placeholder');
        const name = await textarea.getAttribute('name');
        const value = await textarea.inputValue();
        
        console.log(`Textarea ${i + 1}: name="${name}", placeholder="${placeholder}", value="${value}"`);
      }
      
      // Look for labels and field structure
      console.log('\n=== PROFILE FIELD LABELS ===');
      const labels = await page.$$('label, .field-label, [class*="label"]');
      
      for (let i = 0; i < Math.min(labels.length, 30); i++) {
        const label = labels[i];
        const text = await label.textContent();
        if (text && text.trim() && text.length < 100) {
          console.log(`Label ${i + 1}: "${text.trim()}"`);
        }
      }
      
      // Look for profile data structure patterns
      console.log('\n=== PROFILE DATA PATTERNS ===');
      const profilePatterns = [
        'Manager ID', 'manager_id', 'Employee ID', 'employee_id',
        'First Name', 'first_name', 'Last Name', 'last_name', 
        'Full Name', 'manager_name', 'Name',
        'Email', 'email', 'Phone', 'phone', 'Mobile',
        'Department', 'department', 'Division', 'division',
        'Position', 'position', 'Title', 'job_title',
        'Hire Date', 'hire_date', 'Start Date', 'start_date',
        'Salary', 'salary', 'Wage', 'hourly_rate',
        'Supervisor', 'supervisor', 'Manager', 'reports_to',
        'Assigned Center', 'assigned_center', 'Location', 'office',
        'Status', 'status', 'Active', 'Employment Status',
        'Address', 'address', 'Street', 'City', 'State', 'Zip',
        'Emergency Contact', 'emergency_contact', 'Emergency Phone'
      ];
      
      const foundPatterns = [];
      for (const pattern of profilePatterns) {
        if (profileContent.toLowerCase().includes(pattern.toLowerCase())) {
          foundPatterns.push(pattern);
        }
      }
      
      console.log('\n=== FOUND PROFILE PATTERNS ===');
      foundPatterns.forEach(pattern => {
        console.log(`✓ ${pattern}`);
      });
      
    } else {
      console.log('❌ Could not find My Profile tab');
    }
    
    await page.waitForTimeout(8000); // Keep browser open
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'manager-profile-error.png' });
  }
  
  await browser.close();
})();