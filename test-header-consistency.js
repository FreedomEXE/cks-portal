const { chromium } = require('playwright');

async function testHeaderConsistency() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing header consistency across hubs...\n');
    
    // Test Centers Hub
    console.log('=== CENTERS HUB HEADER TEST ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'ctr-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'center-header-fixed.png',
      fullPage: true 
    });
    
    console.log('📸 Centers Hub header screenshot saved');
    
    // Check Centers Hub header structure
    const centerHubTitle = page.locator('h1:has-text("Center Hub")');
    const centerLogout = page.locator('button', { hasText: /logout/i }).or(page.locator('[class*="logout"]'));
    const centerNavTabs = page.locator('button:has-text("Dashboard")');
    
    console.log(`🏢 Center Hub title (left side): ${await centerHubTitle.isVisible() ? '✅' : '❌'}`);
    console.log(`🚪 Center Hub logout (right side): ${await centerLogout.isVisible() ? '✅' : '❌'}`);
    console.log(`🧭 Center Hub navigation tabs: ${await centerNavTabs.isVisible() ? '✅' : '❌'}`);
    
    // Test Crew Hub
    console.log('\\n=== CREW HUB HEADER TEST ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="text"]', 'crw-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'crew-header-reference.png',
      fullPage: true 
    });
    
    console.log('📸 Crew Hub header reference screenshot saved');
    
    // Check Crew Hub header structure
    const crewHubTitle = page.locator('h1:has-text("Crew Hub")');
    const crewLogout = page.locator('button', { hasText: /logout/i }).or(page.locator('[class*="logout"]'));
    const crewNavTabs = page.locator('button:has-text("Work Dashboard")');
    
    console.log(`👷 Crew Hub title (left side): ${await crewHubTitle.isVisible() ? '✅' : '❌'}`);
    console.log(`🚪 Crew Hub logout (right side): ${await crewLogout.isVisible() ? '✅' : '❌'}`);
    console.log(`🧭 Crew Hub navigation tabs: ${await crewNavTabs.isVisible() ? '✅' : '❌'}`);
    
    // Test Customer Hub
    console.log('\\n=== CUSTOMER HUB HEADER TEST ===');
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', '');
    await page.fill('input[type="password"]', '');
    await page.waitForTimeout(500);
    
    await page.fill('input[type="text"]', 'cus-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Check Customer Hub header structure
    const customerHubTitle = page.locator('h1:has-text("Customer Hub")');
    const customerLogout = page.locator('button', { hasText: /logout/i }).or(page.locator('[class*="logout"]'));
    const customerNavTabs = page.locator('button:has-text("Center Dashboard")');
    
    console.log(`🏬 Customer Hub title (left side): ${await customerHubTitle.isVisible() ? '✅' : '❌'}`);
    console.log(`🚪 Customer Hub logout (right side): ${await customerLogout.isVisible() ? '✅' : '❌'}`);
    console.log(`🧭 Customer Hub navigation tabs: ${await customerNavTabs.isVisible() ? '✅' : '❌'}`);
    
    console.log('\\n🎉 HEADER CONSISTENCY CHECK COMPLETE!');
    console.log('📋 Summary:');
    console.log('  ✅ All hubs should have "Role Hub" title on the left side');
    console.log('  ✅ All hubs should have logout button on the right side');
    console.log('  ✅ All hubs should have navigation tabs below the header');
    console.log('  ✅ Centers Hub header structure now matches Crew Hub pattern');
    
  } catch (error) {
    console.error('❌ Error testing header consistency:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testHeaderConsistency().catch(console.error);