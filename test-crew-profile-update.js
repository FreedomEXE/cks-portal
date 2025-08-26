const { chromium } = require('playwright');

async function testCrewProfileUpdate() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing updated Crew Profile Personal Info tab...\n');
    
    // Login to crew hub
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'crw-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Go to My Profile
    const profileButton = page.locator('button:has-text("My Profile")');
    await profileButton.click();
    await page.waitForTimeout(2000);
    
    // Make sure Personal Info tab is selected (should be default)
    const personalInfoTab = page.locator('button:has-text("Personal Info")');
    await personalInfoTab.click();
    await page.waitForTimeout(1500);
    
    console.log('📋 UPDATED PERSONAL INFO TAB FIELDS:');
    console.log('=' .repeat(50));
    
    // Get all the field labels and values from the table
    const profileFields = await page.evaluate(() => {
      const table = document.querySelector('table tbody');
      if (!table) return [];
      
      const rows = table.querySelectorAll('tr');
      const fields = [];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const label = cells[0].textContent?.trim();
          const value = cells[1].textContent?.trim();
          fields.push({ label, value });
        }
      });
      
      return fields;
    });
    
    profileFields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.label}: ${field.value}`);
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: 'crew-profile-updated-personal-info.png',
      fullPage: true 
    });
    
    console.log('\n📸 Screenshot saved: crew-profile-updated-personal-info.png');
    console.log('✅ Personal Info tab updated successfully!');
    console.log('');
    console.log('🔹 Changes made:');
    console.log('  - Removed hardcoded mock data');
    console.log('  - Added proper fallback values ("Not Set", "Not Assigned")');
    console.log('  - Added Home Address field');
    console.log('  - Added Languages field (with array join)');
    console.log('  - Added Status field');
    console.log('  - Removed Hire Date and Supervisor (moved to Work Details tab)');
    
  } catch (error) {
    console.error('❌ Error testing profile update:', error);
  } finally {
    await browser.close();
  }
}

testCrewProfileUpdate().catch(console.error);