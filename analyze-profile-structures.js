const { chromium } = require('playwright');

async function analyzeProfileStructures() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Analyzing profile structures across hubs...\n');
    
    // First analyze Crew Hub profile structure (the reference)
    console.log('=== CREW HUB PROFILE ANALYSIS (REFERENCE) ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'crw-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Go to profile
    const crewProfileButton = page.locator('button:has-text("My Profile")');
    await crewProfileButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'crew-profile-reference.png',
      fullPage: true 
    });
    
    console.log('📸 Crew Hub profile reference saved');
    
    // Analyze Crew Hub structure
    const crewTabs = await page.locator('button').allTextContents();
    const crewProfileTabs = crewTabs.filter(tab => 
      tab.includes('Personal Info') || tab.includes('Work Details') || tab.includes('Certifications') || 
      tab.includes('Emergency') || tab.includes('Performance')
    );
    
    console.log('📋 Crew Hub profile tabs found:', crewProfileTabs);
    
    const crewPhotoVisible = await page.locator('button:has-text("Update Photo")').isVisible();
    console.log(`🖼️ Crew Hub "Update Photo" button: ${crewPhotoVisible ? '✅ Found' : '❌ Missing'}`);
    
    // Now check Centers Hub profile
    console.log('\\n=== CENTERS HUB PROFILE ANALYSIS ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="text"]', 'ctr-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Go to profile
    const centerProfileButton = page.locator('button:has-text("Profile")');
    await centerProfileButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'center-profile-current.png',
      fullPage: true 
    });
    
    console.log('📸 Centers Hub current profile saved');
    
    // Analyze Centers Hub structure
    const centerTabs = await page.locator('button').allTextContents();
    const centerProfileTabs = centerTabs.filter(tab => 
      tab.includes('Center Information') || tab.includes('Service Information') || 
      tab.includes('Management') || tab.includes('Operations') || tab.includes('Settings')
    );
    
    console.log('📋 Centers Hub profile tabs found:', centerProfileTabs);
    
    const centerPhotoVisible = await page.locator('button:has-text("Update Photo")').isVisible();
    console.log(`🖼️ Centers Hub "Update Photo" button: ${centerPhotoVisible ? '✅ Found' : '❌ Missing'}`);
    
    // Check Customer Hub profile too
    console.log('\\n=== CUSTOMER HUB PROFILE ANALYSIS ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="text"]', 'cus-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Go to profile
    const customerProfileButton = page.locator('button:has-text("Customer Profile")');
    await customerProfileButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'customer-profile-current.png',
      fullPage: true 
    });
    
    console.log('📸 Customer Hub current profile saved');
    
    const customerTabs = await page.locator('button').allTextContents();
    const customerProfileTabs = customerTabs.filter(tab => 
      tab.includes('Customer Info') || tab.includes('Centers') || tab.includes('Contract') || 
      tab.includes('Contact Manager') || tab.includes('Service Areas')
    );
    
    console.log('📋 Customer Hub profile tabs found:', customerProfileTabs);
    
    const customerPhotoVisible = await page.locator('button:has-text("Update Logo")').isVisible();
    console.log(`🖼️ Customer Hub "Update Logo" button: ${customerPhotoVisible ? '✅ Found' : '❌ Missing'}`);
    
    console.log('\\n🎯 ANALYSIS SUMMARY:');
    console.log('=' .repeat(60));
    console.log('📋 CREW HUB PATTERN (Reference):');
    console.log('  1. Profile tabs at TOP');
    console.log('  2. Circular photo LEFT side with "Update Photo" button');
    console.log('  3. Profile info RIGHT side of photo');
    console.log('  4. Content organized in table format');
    
    console.log('\\n📋 CHANGES NEEDED:');
    console.log('  ✅ Centers Hub: Already has tabs, needs photo/layout restructure');
    console.log('  ✅ Customer Hub: Has basic structure, needs refinement');
    console.log('  ❓ Contractor Hub: Need to check');
    console.log('  ❓ Manager Hub: Need to check');
    
  } catch (error) {
    console.error('❌ Error analyzing profile structures:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

analyzeProfileStructures().catch(console.error);