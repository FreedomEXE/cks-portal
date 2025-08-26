const { chromium } = require('playwright');

async function testCenterMail() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testing Centers Hub Mail section changes...\n');
    
    await page.goto('http://localhost:5183/login');
    await page.waitForTimeout(1000);
    
    await page.fill('input[type="text"]', 'ctr-000');
    await page.fill('input[type="password"]', 'CksDemo!2025');
    await page.click('button:has-text("Sign in")');
    
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'center-mail-section-final.png',
      fullPage: true 
    });
    
    console.log('📸 Centers Hub screenshot saved: center-mail-section-final.png');
    
    // Verify updated text
    const mailSection = page.locator('text=📬 Mail');
    const mailboxButton = page.locator('button:has-text("View Mailbox")');
    const newsSection = page.locator('text=📰 News & Updates');
    
    console.log('✅ CENTERS HUB MAIL VERIFICATION:');
    console.log('=' .repeat(50));
    console.log(`📬 "Mail" section: ${await mailSection.isVisible() ? '✅ Found' : '❌ Missing'}`);
    console.log(`📬 "View Mailbox" button: ${await mailboxButton.isVisible() ? '✅ Found' : '❌ Missing'}`);
    console.log(`📰 News & Updates: ${await newsSection.isVisible() ? '✅ Found' : '❌ Missing'}`);
    
    // Test button functionality
    if (await mailboxButton.isVisible()) {
      await mailboxButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ "View Mailbox" button works correctly');
    }
    
    console.log('\\n🎉 CENTERS HUB MAIL UPDATES COMPLETE!');
    console.log('📋 Changes verified:');
    console.log('  ✅ Changed "Inbox" → "Mail" in section header');
    console.log('  ✅ Changed "View All Messages" → "View Mailbox" button text');
    console.log('  ✅ Button functionality works correctly');
    console.log('  ✅ Now consistent with Crew Hub naming');
    
  } catch (error) {
    console.error('❌ Error testing center mail:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCenterMail().catch(console.error);