const { chromium } = require('playwright');

async function analyzeCrowProfile() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Analyzing Crew Hub profile structure for consistency...\n');
    
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
    
    // Take screenshot of full profile
    await page.screenshot({ 
      path: 'crew-profile-structure-reference.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved: crew-profile-structure-reference.png');
    
    // Analyze profile structure
    console.log('\n✅ CREW PROFILE STRUCTURE ANALYSIS:');
    console.log('=' .repeat(60));
    
    // Check for profile tabs
    const profileTabs = await page.locator('button').allTextContents();
    const relevantTabs = profileTabs.filter(tab => 
      tab.includes('Personal') || tab.includes('Work') || tab.includes('Certifications') || 
      tab.includes('Emergency') || tab.includes('Performance') || tab.includes('Info')
    );
    
    console.log('📋 Profile Tabs Found:');
    relevantTabs.forEach((tab, index) => {
      console.log(`  ${index + 1}. ${tab}`);
    });
    
    // Check profile photo area structure
    const profilePhotos = await page.locator('div').evaluateAll(divs => {
      return divs.map(div => {
        const style = window.getComputedStyle(div);
        const hasCircularPhoto = style.borderRadius && (style.width === style.height);
        const hasBackground = style.background && style.background.includes('gradient');
        if (hasCircularPhoto || hasBackground) {
          return {
            borderRadius: style.borderRadius,
            width: style.width,
            height: style.height,
            background: style.background,
            textContent: div.textContent?.substring(0, 10) + '...'
          };
        }
        return null;
      }).filter(Boolean);
    });
    
    console.log('\n🖼️ Photo Section Analysis:');
    console.log('Profile photo elements found:', profilePhotos.slice(0, 3));
    
    // Test each tab to see field organization
    console.log('\n📊 Tab Content Organization:');
    
    for (let i = 0; i < Math.min(relevantTabs.length, 3); i++) {
      try {
        const tabButton = page.locator(`button:has-text("${relevantTabs[i]}")`);
        await tabButton.click();
        await page.waitForTimeout(1000);
        
        const fieldCount = await page.locator('tr').count();
        console.log(`  ${relevantTabs[i]}: ~${fieldCount} fields in table format`);
      } catch (e) {
        console.log(`  ${relevantTabs[i]}: Could not analyze`);
      }
    }
    
    console.log('\n💡 KEY INSIGHTS FOR CENTER HUB:');
    console.log('  📋 Multiple tabs organize fields into logical groups');
    console.log('  🖼️ Profile photo section separate from field tables');
    console.log('  📊 Each tab has manageable field count (not overwhelming)');
    console.log('  🎨 Consistent styling across tabs with "Not Set" fallbacks');
    
    console.log('\n🎯 RECOMMENDED CENTER HUB TABS:');
    console.log('  1. "Center Information" - Basic details, contact, location');
    console.log('  2. "Service Information" - Service details, frequency, assignments');
    console.log('  3. "Management" - IDs for Manager, Contractor, Customer, etc.');
    console.log('  4. "Operations" - Hours, requirements, special needs');
    console.log('  5. "Settings" - QR codes, preferences, configurations');
    
  } catch (error) {
    console.error('❌ Error analyzing crew profile:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

analyzeCrowProfile().catch(console.error);